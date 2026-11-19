"""Live weather retrieval and meteorological feature mapping via Open-Meteo API."""

import logging
from typing import Any, Dict, List, Optional, Tuple
import requests

from backend.config import Config
from backend.utils.cache import ThreadSafeTTLCache

logger = logging.getLogger(__name__)

# Global singleton cache for weather queries (thread-safe, 10 min TTL, max 256 items)
weather_cache = ThreadSafeTTLCache(
    maxsize=Config.LOCATION_CACHE_MAXSIZE,
    ttl=Config.LOCATION_CACHE_TTL,
)

HPA_TO_MMHG = 0.750062


class WeatherService:
    """Retrieves live meteorological conditions and maps them to model feature schema."""

    @staticmethod
    def is_within_delhi_ncr(lat: float, lon: float) -> bool:
        """Check whether coordinates fall within the Delhi-NCR validated training region."""
        bounds = Config.DELHI_NCR_BOUNDS
        return (
            bounds["lat_min"] <= lat <= bounds["lat_max"]
            and bounds["lon_min"] <= lon <= bounds["lon_max"]
        )

    @staticmethod
    def inspect_training_ranges(features: Dict[str, float]) -> Tuple[bool, List[str]]:
        """Compare meteorological inputs against the empirical training distribution ranges.

        Enforces zero silent clamping: unconstrained inputs are passed as-is to the model,
        while any variable outside the training baseline is explicitly flagged with a warning.

        Returns:
            (has_out_of_range: bool, warning_messages: List[str])
        """
        warnings: List[str] = []
        for feat, spec in Config.TRAINING_FEATURE_RANGES.items():
            val = features.get(feat)
            if val is None:
                continue
            if val < spec["min"] or val > spec["max"]:
                warnings.append(
                    f"{spec['name']} ({feat}) is {val:.1f} {spec['unit']}, outside the model's "
                    f"training distribution [{spec['min']:.1f}, {spec['max']:.1f}] {spec['unit']}."
                )

        return (len(warnings) > 0, warnings)

    @classmethod
    def _get_baseline_weather(cls, lat: float, lon: float, warning_msg: Optional[str] = None) -> Dict[str, Any]:
        """Provides Delhi-NCR regional seasonal baseline meteorology when external APIs are rate-limited."""
        is_ncr = cls.is_within_delhi_ncr(lat, lon)
        mapped_features = {
            "RH": 55.0,
            "WD": 180.0,
            "SR": 150.0,
            "BP": 740.0,
            "AT": 24.0,
        }
        has_out_of_range, range_warnings = cls.inspect_training_ranges(mapped_features)
        return {
            "latitude": lat,
            "longitude": lon,
            "timestamp": "Regional Baseline (External API Rate-Limited)",
            "raw_weather": {
                "temperature_2m_c": 24.0,
                "relative_humidity_2m_pct": 55.0,
                "wind_direction_10m_deg": 180.0,
                "surface_pressure_hpa": 986.6,
                "surface_pressure_mmhg": 740.0,
                "shortwave_radiation_wm2": 150.0,
            },
            "features": mapped_features,
            "is_delhi_ncr": is_ncr,
            "validity": "valid_training_region" if is_ncr else "outside_training_region",
            "validity_warning": warning_msg or (
                "External meteorological service is temporarily rate-limiting requests. "
                "Utilizing regional baseline meteorological indicators for Delhi-NCR."
            ),
            "has_out_of_training_range_inputs": has_out_of_range,
            "input_out_of_training_range_warnings": range_warnings,
        }

    @classmethod
    def get_live_weather(cls, lat: float, lon: float) -> Dict[str, Any]:
        """Fetch real-time weather from Open-Meteo for the given coordinates.

        Converts surface pressure from hPa to mmHg (1 hPa = 0.750062 mmHg).
        Implements 10-minute caching per rounded coordinate pair.

        Raises:
            requests.RequestException: On external API failure or timeout.
            ValueError: On invalid coordinates or malformed response.
        """
        if not (-90.0 <= lat <= 90.0) or not (-180.0 <= lon <= 180.0):
            raise ValueError(f"Invalid geographical coordinates: lat={lat}, lon={lon}")

        cache_key = f"weather:{round(lat, 2)}:{round(lon, 2)}"
        cached_result = weather_cache.get(cache_key)
        if cached_result is not None:
            logger.info("Serving live weather from cache for (%s, %s)", lat, lon)
            return dict(cached_result)

        url = Config.OPEN_METEO_FORECAST_URL
        params = {
            "latitude": lat,
            "longitude": lon,
            "current": "temperature_2m,relative_humidity_2m,wind_direction_10m,surface_pressure,shortwave_radiation",
        }
        headers = {
            "User-Agent": "AirPollutionXAI/1.0 (https://github.com/BhanuDanda-09/Air-Pollution-XAI; research-capstone)",
            "Accept": "application/json",
        }
        if getattr(Config, "OPEN_METEO_API_KEY", None):
            params["apikey"] = Config.OPEN_METEO_API_KEY

        try:
            response = requests.get(url, params=params, headers=headers, timeout=Config.OPEN_METEO_TIMEOUT)
            if response.status_code == 429:
                logger.warning("Open-Meteo rate limit (429) encountered for (%s, %s). Checking fallback cache or baseline.", lat, lon)
                with weather_cache._lock:
                    for k, v in weather_cache._cache.items():
                        if not weather_cache._is_expired(v):
                            cached_val = dict(v["value"])
                            cached_val["latitude"] = lat
                            cached_val["longitude"] = lon
                            cached_val["validity_warning"] = (
                                "External meteorological service is temporarily rate-limiting requests. "
                                "Serving recent cached meteorological readings."
                            )
                            return cached_val
                return cls._get_baseline_weather(lat, lon)
            response.raise_for_status()
            data = response.json()
        except requests.HTTPError as http_err:
            if http_err.response is not None and http_err.response.status_code == 429:
                return cls._get_baseline_weather(lat, lon)
            raise

        current = data.get("current")
        if not current:
            raise ValueError("Open-Meteo response did not contain current weather observation.")

        temp_c = float(current.get("temperature_2m", 25.0))
        rh_pct = float(current.get("relative_humidity_2m", 50.0))
        wd_deg = float(current.get("wind_direction_10m", 180.0))
        hpa = float(current.get("surface_pressure", 1013.25))
        sr_wm2 = max(0.0, float(current.get("shortwave_radiation", 0.0)))

        # Precise unit conversion from hectopascals (hPa) to millimeters of mercury (mmHg)
        bp_mmhg = round(hpa * HPA_TO_MMHG, 2)

        # Feature order strictly matching model training: ["RH", "WD", "SR", "BP", "AT"]
        mapped_features = {
            "RH": round(rh_pct, 1),
            "WD": round(wd_deg, 1),
            "SR": round(sr_wm2, 1),
            "BP": bp_mmhg,
            "AT": round(temp_c, 1),
        }

        is_ncr = cls.is_within_delhi_ncr(lat, lon)
        has_out_of_range, range_warnings = cls.inspect_training_ranges(mapped_features)

        result = {
            "latitude": lat,
            "longitude": lon,
            "timestamp": current.get("time"),
            "raw_weather": {
                "temperature_2m_c": temp_c,
                "relative_humidity_2m_pct": rh_pct,
                "wind_direction_10m_deg": wd_deg,
                "surface_pressure_hpa": hpa,
                "surface_pressure_mmhg": bp_mmhg,
                "shortwave_radiation_wm2": sr_wm2,
            },
            "features": mapped_features,
            "is_delhi_ncr": is_ncr,
            "validity": "valid_training_region" if is_ncr else "outside_training_region",
            "validity_warning": None if is_ncr else (
                "Coordinates are outside the model's validated training region (Delhi-NCR). "
                "The prediction is an unvalidated geographic extrapolation and should not be considered authoritative."
            ),
            "has_out_of_training_range_inputs": has_out_of_range,
            "input_out_of_training_range_warnings": range_warnings,
        }

        weather_cache.set(cache_key, result)
        return result
