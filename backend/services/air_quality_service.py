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
            }
            response = requests.get(url, params=params, timeout=Config.OPEN_METEO_TIMEOUT)
            response.raise_for_status()
            data = response.json()
            current = data.get("current", {})

            ref_pm25 = current.get("pm2_5")
            if ref_pm25 is not None:
                result = {
                    "reference_pm25": round(float(ref_pm25), 2),
                    "unit": "µg/m³",
                    "reference_source": "Copernicus Atmosphere Monitoring Service (CAMS via Open-Meteo)",
                    "reference_label": "Reference PM2.5 (CAMS model data)",
                    "european_aqi": current.get("european_aqi"),
                    "us_aqi": current.get("us_aqi"),
                    "timestamp": current.get("time"),
                    "status": "available",
                    "is_direct_ground_station": False,
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
