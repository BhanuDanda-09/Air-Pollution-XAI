"""Reference ambient air quality retrieval via Open-Meteo CAMS and optional OpenAQ fallback."""

import logging
from typing import Any, Dict, Optional
import requests

from backend.config import Config
from backend.utils.cache import ThreadSafeTTLCache

logger = logging.getLogger(__name__)

# Global singleton cache for air quality reference data (thread-safe, 10 min TTL)
aq_cache = ThreadSafeTTLCache(
    maxsize=Config.LOCATION_CACHE_MAXSIZE,
    ttl=Config.LOCATION_CACHE_TTL,
)


class AirQualityService:
    """Retrieves Reference PM2.5 and AQI data.

    Scientific Framing:
    Open-Meteo Air Quality utilizes the Copernicus Atmosphere Monitoring Service (CAMS)
    regional reanalysis and forecast models. It is strictly designated as:
    'Reference PM2.5 (CAMS model data)', NOT direct ground reference monitor measurements,
    unless explicitly sourced from an authenticated OpenAQ regulatory station.
    """

    @classmethod
    def get_reference_air_quality(cls, lat: float, lon: float) -> Optional[Dict[str, Any]]:
        """Fetch reference PM2.5 from Open-Meteo CAMS with optional OpenAQ fallback.

        Resilience guarantee: If the external reference service times out or errors,
        this method returns a structured offline payload rather than raising an exception,
        allowing the model's estimate to be returned without disruption.
        """
        cache_key = f"aq:{round(lat, 2)}:{round(lon, 2)}"
        cached_result = aq_cache.get(cache_key)
        if cached_result is not None:
            logger.info("Serving reference air quality from cache for (%s, %s)", lat, lon)
            return dict(cached_result)

        # 1. Primary Source: Open-Meteo CAMS Air Quality API
        try:
            url = Config.OPEN_METEO_AIR_QUALITY_URL
            params = {
                "latitude": lat,
                "longitude": lon,
                "current": "pm2_5,european_aqi,us_aqi",
                "hourly": "pm2_5",
                "forecast_days": 7,
            }
            headers = {
                "User-Agent": "AirPollutionXAI/1.0 (https://github.com/BhanuDanda-09/Air-Pollution-XAI; research-capstone)",
                "Accept": "application/json",
            }
            if getattr(Config, "OPEN_METEO_API_KEY", None):
                params["apikey"] = Config.OPEN_METEO_API_KEY

            response = requests.get(url, params=params, headers=headers, timeout=Config.OPEN_METEO_TIMEOUT)
            response.raise_for_status()
            data = response.json()
            current = data.get("current", {})

            ref_pm25 = current.get("pm2_5")
            if ref_pm25 is not None:
                ref_pm25_float = round(float(ref_pm25), 2)

                # Process hourly CAMS data for 24h, best time today, and 7-day trend
                hourly_data = data.get("hourly", {})
                hourly_pm25 = hourly_data.get("pm2_5", [])
                hourly_times = hourly_data.get("time", [])

                forecast_24h_mean = None
                forecast_24h_max = None
                forecast_trend = "stable"
                hourly_series_24h = []
                best_time_today = None
                seven_day_daily = []
                seven_day_trend = "stable"

                if hourly_pm25 and isinstance(hourly_pm25, list) and hourly_times:
                    # 1. Next 24h Forecast
                    valid_24h = [
                        (t, float(p))
                        for t, p in zip(hourly_times[:24], hourly_pm25[:24])
                        if p is not None and not (isinstance(p, float) and p < 0)
                    ]
                    if valid_24h:
                        vals_24h = [v[1] for v in valid_24h]
                        forecast_24h_mean = round(sum(vals_24h) / len(vals_24h), 2)
                        forecast_24h_max = round(max(vals_24h), 2)
                        if forecast_24h_mean - ref_pm25_float > 8.0:
                            forecast_trend = "worsening"
                        elif ref_pm25_float - forecast_24h_mean > 8.0:
                            forecast_trend = "improving"
                        else:
                            forecast_trend = "stable"

                        # Build 24h series for charting
                        for t, p in valid_24h:
                            hourly_series_24h.append({"time": t, "pm25": round(p, 1)})

                        # 2. Best time to go out today (lowest PM2.5 hour in first 24h)
                        min_slot = min(valid_24h, key=lambda x: x[1])
                        slot_time = min_slot[0]
                        hour_str = slot_time.split("T")[-1] if "T" in slot_time else slot_time
                        best_time_today = {
                            "time": slot_time,
                            "hour": hour_str,
                            "pm25": round(min_slot[1], 1),
                            "guidance": (
                                f"Optimal outdoor activity window around {hour_str} "
                                f"with lowest estimated PM2.5 of {round(min_slot[1], 1)} µg/m³."
                            ),
                        }

                    # 3. 7-Day Trend Aggregation (group by date)
                    from collections import defaultdict
                    daily_groups = defaultdict(list)
                    for t, p in zip(hourly_times[:168], hourly_pm25[:168]):
                        if p is not None:
                            date_str = t.split("T")[0] if "T" in t else t[:10]
                            daily_groups[date_str].append(float(p))

                    for date_k, p_list in list(daily_groups.items())[:7]:
                        if p_list:
                            d_mean = round(sum(p_list) / len(p_list), 1)
                            d_max = round(max(p_list), 1)
                            # CPCB category helper
                            if d_mean <= 30:
                                d_cat = "Good"
                            elif d_mean <= 60:
                                d_cat = "Satisfactory"
                            elif d_mean <= 90:
                                d_cat = "Moderate"
                            elif d_mean <= 120:
                                d_cat = "Poor"
                            elif d_mean <= 250:
                                d_cat = "Very Poor"
                            else:
                                d_cat = "Severe"

                            seven_day_daily.append({
                                "date": date_k,
                                "mean_pm25": d_mean,
                                "max_pm25": d_max,
                                "cpcb_category": d_cat,
                            })

                    if len(seven_day_daily) >= 3:
                        first_avg = seven_day_daily[0]["mean_pm25"]
                        last_avg = seven_day_daily[-1]["mean_pm25"]
                        if last_avg - first_avg > 12.0:
                            seven_day_trend = "worsening"
                        elif first_avg - last_avg > 12.0:
                            seven_day_trend = "improving"
                        else:
                            seven_day_trend = "stable"

                result = {
                    "reference_pm25": ref_pm25_float,
                    "unit": "µg/m³",
                    "reference_source": "Copernicus Atmosphere Monitoring Service (CAMS via Open-Meteo)",
                    "reference_label": "Reference PM2.5 (CAMS model data)",
                    "european_aqi": current.get("european_aqi"),
                    "us_aqi": current.get("us_aqi"),
                    "timestamp": current.get("time"),
                    "status": "available",
                    "is_direct_ground_station": False,
                    "forecast_24h": {
                        "mean_pm25": forecast_24h_mean,
                        "max_pm25": forecast_24h_max,
                        "trend": forecast_trend,
                        "series": hourly_series_24h,
                    },
                    "best_time_today": best_time_today,
                    "seven_day_forecast": {
                        "trend": seven_day_trend,
                        "days": seven_day_daily,
                    },
                }
                aq_cache.set(cache_key, result)
                return result

        except Exception as exc:
            logger.warning("Open-Meteo CAMS Air Quality request failed for (%s, %s): %s", lat, lon, exc)

        # 2. Optional Fallback: OpenAQ Ground Stations (only if OPENAQ_API_KEY is configured)
        if Config.OPENAQ_API_KEY:
            try:
                openaq_url = "https://api.openaq.org/v3/locations"
                headers = {"X-API-Key": Config.OPENAQ_API_KEY}
                openaq_params = {
                    "coordinates": f"{lat},{lon}",
                    "radius": 25000,
                    "limit": 1,
                }
                openaq_res = requests.get(openaq_url, headers=headers, params=openaq_params, timeout=Config.OPEN_METEO_TIMEOUT)
                if openaq_res.status_code == 200:
                    openaq_data = openaq_res.json()
                    results = openaq_data.get("results", [])
                    if results:
                        loc = results[0]
                        # Extract pm25 sensor if available
                        for sensor in loc.get("sensors", []):
                            if sensor.get("parameter", {}).get("name") == "pm25":
                                latest_val = sensor.get("latest", {}).get("value")
                                if latest_val is not None:
                                    result = {
                                        "reference_pm25": round(float(latest_val), 2),
                                        "unit": "µg/m³",
                                        "reference_source": f"OpenAQ Ground Station: {loc.get('name', 'Regulatory Monitor')}",
                                        "reference_label": "Reference PM2.5 (OpenAQ Ground Station)",
                                        "european_aqi": None,
                                        "us_aqi": None,
                                        "timestamp": loc.get("datetimeLast", {}).get("utc"),
                                        "status": "available",
                                        "is_direct_ground_station": True,
                                    }
                                    aq_cache.set(cache_key, result)
                                    return result
            except Exception as openaq_exc:
                logger.warning("OpenAQ fallback request failed for (%s, %s): %s", lat, lon, openaq_exc)

        # 3. Graceful Fallback: Reference service unavailable, model prediction will still proceed
        fallback_payload = {
            "reference_pm25": None,
            "unit": "µg/m³",
            "reference_source": None,
            "reference_label": "Reference PM2.5 (CAMS model data)",
            "status": "unavailable",
            "error": "Reference air quality data is temporarily offline or unavailable for this region.",
        }
        return fallback_payload
