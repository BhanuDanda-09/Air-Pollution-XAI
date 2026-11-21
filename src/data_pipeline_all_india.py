"""All-India Multi-City Multi-Pollutant Hourly Data Pipeline.

Ingests hourly CAMS atmospheric reanalysis and ERA5 meteorology from Open-Meteo across
45 Indian cities representing all 6 geographical zones (North, South, East, West, Central, Northeast).
Engineers temporal, spatial, meteorological, lag, and rolling features with zero data leakage.
"""

import json
import logging
import math
import os
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timedelta
from pathlib import Path
import numpy as np
import pandas as pd

logging.basicConfig(level=logging.INFO, format="[%(asctime)s] %(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATASET_DIR = PROJECT_ROOT / "dataset"
CITIES_CONFIG_PATH = DATASET_DIR / "all_india_cities.json"
OUTPUT_CSV_PATH = DATASET_DIR / "all_india_hourly_multicity.csv"
CPCB_GROUND_TRUTH_PATH = DATASET_DIR / "cpcb_ground_truth_city_day.csv"

POLLUTANTS = ["pm2_5", "pm10", "nitrogen_dioxide", "sulphur_dioxide", "carbon_monoxide", "ozone"]
POLLUTANT_MAP = {
    "pm2_5": "PM2.5",
    "pm10": "PM10",
    "nitrogen_dioxide": "NO2",
    "sulphur_dioxide": "SO2",
    "carbon_monoxide": "CO",
    "ozone": "O3"
}

WEATHER_VARS = [
    "temperature_2m",
    "relative_humidity_2m",
    "surface_pressure",
    "wind_speed_10m",
    "wind_direction_10m",
    "direct_radiation",
    "precipitation",
    "boundary_layer_height"
]

REGION_CODES = {
    "North": 0,
    "South": 1,
    "West": 2,
    "East": 3,
    "Central": 4,
    "Northeast": 5
}

# Continuous multi-seasonal training range covering Winter smog, Spring transition, and Summer heat/dust
DATASET_START_DATE = "2024-01-01"
DATASET_END_DATE = "2024-05-31"  # 152 days = 3,648 hours per city


def load_cities():
    """Load verified city metadata."""
    if not CITIES_CONFIG_PATH.exists():
        raise FileNotFoundError(f"Cities config not found at {CITIES_CONFIG_PATH}")
    with open(CITIES_CONFIG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def fetch_open_meteo_data(lat, lon, start_date=DATASET_START_DATE, end_date=DATASET_END_DATE, max_retries=3):
    """Fetch synchronized CAMS air quality and ERA5 weather from Open-Meteo API in 2 clean requests."""
    aq_params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": ",".join(POLLUTANTS),
        "start_date": start_date,
        "end_date": end_date,
        "timezone": "Asia/Kolkata"
    }
    aq_url = f"https://air-quality-api.open-meteo.com/v1/air-quality?{urllib.parse.urlencode(aq_params)}"
    
    weather_params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": ",".join(WEATHER_VARS),
        "start_date": start_date,
        "end_date": end_date,
        "timezone": "Asia/Kolkata"
    }
    weather_url = f"https://archive-api.open-meteo.com/v1/archive?{urllib.parse.urlencode(weather_params)}"

    headers = {"User-Agent": "AirIQIndia-AllIndiaPipeline/2.0"}

    # Query Air Quality with retry
    aq_data = None
    for attempt in range(max_retries):
        try:
            req_aq = urllib.request.Request(aq_url, headers=headers)
            with urllib.request.urlopen(req_aq, timeout=20) as resp:
                aq_data = json.loads(resp.read().decode())
            break
        except Exception as err:
            if attempt == max_retries - 1:
                raise err
            time.sleep(1.0 + attempt)

    time.sleep(0.2)  # Respect rate limits

    # Query Weather with retry
    w_data = None
    for attempt in range(max_retries):
        try:
            req_w = urllib.request.Request(weather_url, headers=headers)
            with urllib.request.urlopen(req_w, timeout=20) as resp:
                w_data = json.loads(resp.read().decode())
            break
        except Exception as err:
            if attempt == max_retries - 1:
                raise err
            time.sleep(1.0 + attempt)

    df_aq = pd.DataFrame(aq_data["hourly"])
    df_w = pd.DataFrame(w_data["hourly"])

    # Merge on timestamp
    df = pd.merge(df_aq, df_w, on="time", how="inner")
    df.rename(columns={"time": "timestamp"}, inplace=True)
    return df


def engineer_features(df, city_info):
    """Engineer temporal, spatial, meteorological, lag, and rolling features."""
    df = df.copy()
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df["city_id"] = city_info["id"]
    df["city_name"] = city_info["name"]
    df["state"] = city_info["state"]
    df["region"] = city_info["region"]
    df["region_code"] = REGION_CODES.get(city_info["region"], 0)
    df["latitude"] = city_info["latitude"]
    df["longitude"] = city_info["longitude"]
    df["elevation"] = city_info["elevation"]

    # 1. Cyclical and Calendar Time Features
    hour = df["timestamp"].dt.hour
    month = df["timestamp"].dt.month
    day_of_week = df["timestamp"].dt.dayofweek

    df["hour"] = hour
    df["month"] = month
    df["day_of_week"] = day_of_week
    df["is_weekend"] = (day_of_week >= 5).astype(int)

    df["hour_sin"] = np.sin(2 * np.pi * hour / 24.0)
    df["hour_cos"] = np.cos(2 * np.pi * hour / 24.0)
    df["month_sin"] = np.sin(2 * np.pi * month / 12.0)
    df["month_cos"] = np.cos(2 * np.pi * month / 12.0)

    # 2. Indian Climatological Season Indicators
    # Winter: Dec, Jan, Feb -> 0
    # Summer/Pre-monsoon: Mar, Apr, May -> 1
    # Monsoon: Jun, Jul, Aug, Sep -> 2
    # Post-monsoon: Oct, Nov -> 3
    season_map = {12: 0, 1: 0, 2: 0, 3: 1, 4: 1, 5: 1, 6: 2, 7: 2, 8: 2, 9: 2, 10: 3, 11: 3}
    df["season_code"] = month.map(season_map)

    # Monsoon flag (strong precipitation & washout)
    df["is_monsoon"] = month.isin([6, 7, 8, 9]).astype(int)

    # Stubble burning flag (Oct 15 - Nov 20, predominantly affecting North & East Indo-Gangetic Plains)
    is_stubble_month = (month == 10) & (df["timestamp"].dt.day >= 15) | (month == 11) & (df["timestamp"].dt.day <= 20)
    is_igp_region = df["region"].isin(["North", "East"])
    df["is_stubble_burning_season"] = (is_stubble_month & is_igp_region).astype(int)

    # 3. Atmospheric Dispersion Dynamics
    # Ventilation coefficient proxy = Wind Speed (m/s) * Boundary Layer Height (m)
    # Open-Meteo wind_speed_10m is in km/h -> convert to m/s
    wind_speed_ms = df["wind_speed_10m"] / 3.6
    blh = df["boundary_layer_height"].clip(lower=10.0)
    df["ventilation_index"] = wind_speed_ms * blh

    # Stagnation indicator (Wind speed < 2.0 m/s and RH > 70%)
    df["is_stagnation"] = ((wind_speed_ms < 2.0) & (df["relative_humidity_2m"] > 70.0)).astype(int)

    # 4. Zero-Leakage Lag & Rolling Features per Pollutant
    # Lags: t-1, t-6, t-24
    # Rolling: 24h rolling mean and std (closed='left' so target time is excluded)
    df.sort_values("timestamp", inplace=True)
    df.reset_index(drop=True, inplace=True)

    for pol in POLLUTANTS:
        # Standardize pollutant names in column headers
        col_name = POLLUTANT_MAP[pol]
        df[col_name] = df[pol].clip(lower=0.0)

        # Lags
        df[f"{col_name}_lag1"] = df[col_name].shift(1)
        df[f"{col_name}_lag6"] = df[col_name].shift(6)
        df[f"{col_name}_lag24"] = df[col_name].shift(24)

        # 24h Rolling Mean and Std (strictly past data)
        rolling_24 = df[col_name].shift(1).rolling(window=24, min_periods=3)
        df[f"{col_name}_roll24_mean"] = rolling_24.mean()
        df[f"{col_name}_roll24_std"] = rolling_24.std().fillna(0.0)

        # Multi-Step Forecasting Targets (t+1, t+6, t+24, t+72)
        df[f"target_{col_name}_1h"] = df[col_name].shift(-1)
        df[f"target_{col_name}_6h"] = df[col_name].shift(-6)
        df[f"target_{col_name}_24h"] = df[col_name].shift(-24)
        df[f"target_{col_name}_72h"] = df[col_name].shift(-72)

    return df


def build_all_india_dataset():
    """Main pipeline execution across all 45 cities."""
    cities = load_cities()
    logger.info("Loaded %d Indian cities for multi-pollutant dataset generation.", len(cities))

    city_dataframes = []
    total_cities = len(cities)

    for idx, city in enumerate(cities, start=1):
        city_id = city["id"]
        logger.info("[%d/%d] Ingesting CAMS + ERA5 data for %s (%s, %s)...", idx, total_cities, city["name"], city["state"], city["region"])
        
        try:
            raw_df = fetch_open_meteo_data(city["latitude"], city["longitude"])
            city_featured = engineer_features(raw_df, city)
            city_dataframes.append(city_featured)
        except Exception as exc:
            logger.warning("Failed to fetch data for %s: %s. Continuing...", city["name"], exc)

    full_dataset = pd.concat(city_dataframes, ignore_index=True)
    full_dataset.dropna(subset=["PM2.5_lag24", "target_PM2.5_1h", "target_PM2.5_24h"], inplace=True)
    full_dataset.sort_values(["timestamp", "city_id"], inplace=True)
    full_dataset.reset_index(drop=True, inplace=True)

    OUTPUT_CSV_PATH.parent.mkdir(parents=True, exist_ok=True)
    full_dataset.to_csv(OUTPUT_CSV_PATH, index=False)
    logger.info("Successfully generated and saved All-India dataset to %s. Shape: %s", OUTPUT_CSV_PATH, full_dataset.shape)
    return full_dataset


if __name__ == "__main__":
    build_all_india_dataset()
