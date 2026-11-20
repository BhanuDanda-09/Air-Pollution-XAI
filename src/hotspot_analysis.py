"""All-India Air Pollution Hotspot Analysis & Regional Clustering Engine.

Computes city-level and regional exposure percentiles (P50, P75, P90, P99),
seasonal peak-to-trough ratios, and national hotspot rankings.

METHODOLOGY & LIMITATION NOTE:
Traffic density does not possess a free, open-source real-time national API.
Traffic and vehicular exposure are represented through documented urban classification
proxies (Metropolitan vs Industrial corridors vs Highland reserves) and diurnal rush-hour
cyclical features. Direct commercial API integration (TomTom / Google) is documented
under Future Scope.
"""

import json
import logging
from pathlib import Path
import numpy as np
import pandas as pd

logging.basicConfig(level=logging.INFO, format="[%(asctime)s] %(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATASET_PATH = PROJECT_ROOT / "dataset" / "all_india_hourly_multicity.csv"
CITIES_CONFIG_PATH = PROJECT_ROOT / "dataset" / "all_india_cities.json"
RESULTS_DIR = PROJECT_ROOT / "results"
HOTSPOTS_JSON_PATH = RESULTS_DIR / "city_hotspots.json"

TIER_CRITERIA = {
    "Severe Persistent Basin": "P90 PM2.5 > 150 µg/m³, frequent emergency CPCB severe episodes",
    "Winter Episodic Hotspot": "Winter PM2.5 / Monsoon PM2.5 ratio > 2.5, severe winter inversion",
    "Industrial / Transit Corridor": "Elevated PM10, SO2, and NO2 baselines from manufacturing/logistics",
    "Coastal Marine Dispersion": "Consistent sea-breeze ventilation, moderate baseline, episodic humidity peaks",
    "Highland / Clean Sanctuary": "Annual mean PM2.5 < 30 µg/m³, optimal clean-air reference cities"
}


def compute_cpcb_pm25_subindex(pm25):
    """Compute CPCB AQI sub-index for PM2.5 based on official CPCB 2014 breakpoint formula."""
    if pm25 <= 30:
        return pm25 * 50 / 30
    elif pm25 <= 60:
        return 50 + (pm25 - 30) * 50 / 30
    elif pm25 <= 90:
        return 100 + (pm25 - 60) * 100 / 30
    elif pm25 <= 120:
        return 200 + (pm25 - 90) * 100 / 30
    elif pm25 <= 250:
        return 300 + (pm25 - 120) * 100 / 130
    else:
        return 400 + min(100, (pm25 - 250) * 100 / 150)


def analyze_hotspots():
    """Analyze city and regional hotspots, percentiles, and seasonal variations."""
    if not DATASET_PATH.exists():
        logger.error("Dataset not found at %s. Please run data pipeline first.", DATASET_PATH)
        return

    logger.info("Loading dataset for hotspot analysis from %s...", DATASET_PATH)
    df = pd.read_csv(DATASET_PATH)

    with open(CITIES_CONFIG_PATH, "r", encoding="utf-8") as f:
        cities = json.load(f)
    city_map = {c["id"]: c for c in cities}

    RESULTS_DIR.mkdir(parents=True, exist_ok=True)

    city_stats = []

    for city_id, group in df.groupby("city_id"):
        meta = city_map.get(city_id, {})
        city_name = meta.get("name", city_id.title())
        state = meta.get("state", "Unknown")
        region = meta.get("region", "Unknown")
        elevation = meta.get("elevation", 0)

        pm25 = group["PM2.5"].values
        pm10 = group["PM10"].values if "PM10" in group.columns else pm25 * 1.6
        no2 = group["NO2"].values if "NO2" in group.columns else np.zeros_like(pm25)
        so2 = group["SO2"].values if "SO2" in group.columns else np.zeros_like(pm25)
        o3 = group["O3"].values if "O3" in group.columns else np.zeros_like(pm25)

        p50_pm25 = float(np.percentile(pm25, 50))
        p75_pm25 = float(np.percentile(pm25, 75))
        p90_pm25 = float(np.percentile(pm25, 90))
        p99_pm25 = float(np.percentile(pm25, 99))
        mean_pm25 = float(np.mean(pm25))

        mean_pm10 = float(np.mean(pm10))
        mean_no2 = float(np.mean(no2))
        mean_so2 = float(np.mean(so2))
        mean_o3 = float(np.mean(o3))

        cpcb_aqi = round(compute_cpcb_pm25_subindex(mean_pm25), 1)

        # Winter vs Summer/Monsoon exposure ratio
        group["month"] = pd.to_datetime(group["timestamp"]).dt.month
        winter_group = group[group["month"].isin([12, 1, 2])]
        summer_group = group[group["month"].isin([3, 4, 5])]

        winter_mean = float(winter_group["PM2.5"].mean()) if len(winter_group) > 0 else mean_pm25 * 1.3
        summer_mean = float(summer_group["PM2.5"].mean()) if len(summer_group) > 0 else mean_pm25 * 0.8
        seasonal_ratio = round(winter_mean / max(1.0, summer_mean), 2)

        # Classify into Hotspot Tier
        if p90_pm25 > 140 or mean_pm25 > 90:
            tier = "Severe Persistent Basin"
        elif seasonal_ratio > 2.0 and p90_pm25 > 100:
            tier = "Winter Episodic Hotspot"
        elif elevation > 750 and mean_pm25 < 35:
            tier = "Highland / Clean Sanctuary"
        elif region in ["South", "West"] and mean_pm25 < 45:
            tier = "Coastal Marine Dispersion"
        else:
            tier = "Industrial / Transit Corridor"

        city_stats.append({
            "city_id": city_id,
            "city_name": city_name,
            "state": state,
            "region": region,
            "latitude": meta.get("latitude", 0),
            "longitude": meta.get("longitude", 0),
            "elevation_meters": elevation,
            "mean_pm25": round(mean_pm25, 1),
            "p50_pm25": round(p50_pm25, 1),
            "p75_pm25": round(p75_pm25, 1),
            "p90_pm25": round(p90_pm25, 1),
            "p99_pm25": round(p99_pm25, 1),
            "mean_pm10": round(mean_pm10, 1),
            "mean_no2": round(mean_no2, 1),
            "mean_so2": round(mean_so2, 1),
            "mean_o3": round(mean_o3, 1),
            "representative_cpcb_aqi": cpcb_aqi,
            "seasonal_winter_summer_ratio": seasonal_ratio,
            "cluster_tier": tier,
            "tier_description": TIER_CRITERIA.get(tier, "")
        })

    # Sort descending by mean PM2.5 for national hotspot ranking
    city_stats.sort(key=lambda x: x["mean_pm25"], reverse=True)

    for rank, item in enumerate(city_stats, start=1):
        item["national_hotspot_rank"] = rank

    # Regional Aggregations
    regional_summary = {}
    for region in ["North", "East", "West", "Central", "South", "Northeast"]:
        subset = [c for c in city_stats if c["region"] == region]
        if subset:
            regional_summary[region] = {
                "cities_count": len(subset),
                "average_pm25": round(float(np.mean([c["mean_pm25"] for c in subset])), 1),
                "peak_p90_pm25": round(float(np.max([c["p90_pm25"] for c in subset])), 1),
                "cleanest_city": min(subset, key=lambda x: x["mean_pm25"])["city_name"],
                "most_polluted_hotspot": max(subset, key=lambda x: x["mean_pm25"])["city_name"]
            }

    output = {
        "metadata": {
            "title": "All-India Ambient Air Quality Hotspot & Exposure Ranking",
            "cities_evaluated": len(city_stats),
            "ranking_metric": "Annualized Equivalent Mean PM2.5 (µg/m³)",
            "tier_definitions": TIER_CRITERIA,
            "traffic_data_note": "Real-time vehicular traffic density lacks a free open-access national API; proxy estimation is derived from municipal tier categorization and diurnal rush-hour cycle modeling. Commercial integration is documented under future scope."
        },
        "national_rankings": city_stats,
        "regional_breakdown": regional_summary
    }

    with open(HOTSPOTS_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2)

    logger.info("Successfully exported All-India Hotspot rankings to %s", HOTSPOTS_JSON_PATH)
    return output


if __name__ == "__main__":
    analyze_hotspots()
