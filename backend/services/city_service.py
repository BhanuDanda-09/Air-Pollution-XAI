"""All-India City Catalog, Geocoding, and Spatial Coverage Service."""

import json
import logging
import math
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import requests

from backend.config import Config
from backend.utils.cache import ThreadSafeTTLCache

logger = logging.getLogger(__name__)

# India Subcontinent Geographic Bounding Box (Honest spatial limits)
INDIA_BOUNDS = {
    "min_lat": 8.0,
    "max_lat": 37.5,
    "min_lon": 68.0,
    "max_lon": 97.5,
}

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
CITIES_CONFIG_PATH = PROJECT_ROOT / "dataset" / "all_india_cities.json"

geocode_cache = ThreadSafeTTLCache(maxsize=512, ttl=86400)  # 24h geocode cache


class CityService:
    """Manages 45-city catalog, reverse/forward geocoding, and spatial validation."""

    _cities: List[Dict[str, Any]] = []
    _city_map: Dict[str, Dict[str, Any]] = {}
    _loaded = False

    @classmethod
    def _ensure_loaded(cls) -> None:
        if cls._loaded:
            return
        if CITIES_CONFIG_PATH.exists():
            try:
                with open(CITIES_CONFIG_PATH, "r", encoding="utf-8") as f:
                    raw_cities = json.load(f)
                    cls._cities = []
                    for c in raw_cities:
                        city = dict(c)
                        city["lat"] = float(c.get("lat", c.get("latitude", 0.0)))
                        city["lon"] = float(c.get("lon", c.get("longitude", 0.0)))
                        city["latitude"] = city["lat"]
                        city["longitude"] = city["lon"]
                        cls._cities.append(city)
                    cls._city_map = {c["id"]: c for c in cls._cities}
                    cls._loaded = True
                    logger.info("CityService: Loaded %d cities from %s", len(cls._cities), CITIES_CONFIG_PATH)
            except Exception as exc:
                logger.error("Failed to load cities config: %s", exc)
        else:
            logger.warning("City config file not found at %s", CITIES_CONFIG_PATH)

    @classmethod
    def get_all_cities(cls) -> List[Dict[str, Any]]:
        """Return full list of all catalog cities."""
        cls._ensure_loaded()
        return list(cls._cities)

    @classmethod
    def get_city_by_id(cls, city_id: str) -> Optional[Dict[str, Any]]:
        """Lookup city by unique string ID."""
        cls._ensure_loaded()
        return cls._city_map.get(city_id.lower().strip())

    @classmethod
    def is_within_india(cls, lat: float, lon: float) -> bool:
        """Verify whether coordinate is geographically within the Indian subcontinent."""
        return (
            INDIA_BOUNDS["min_lat"] <= lat <= INDIA_BOUNDS["max_lat"]
            and INDIA_BOUNDS["min_lon"] <= lon <= INDIA_BOUNDS["max_lon"]
        )

    @staticmethod
    def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate great-circle distance between two coordinates in kilometers."""
        r = 6371.0
        phi1, phi2 = math.radians(lat1), math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlam = math.radians(lon2 - lon1)
        a = (
            math.sin(dphi / 2.0) ** 2
            + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2.0) ** 2
        )
        return 2.0 * r * math.asin(math.sqrt(max(0.0, min(1.0, a))))

    @classmethod
    def find_nearest_city(cls, lat: float, lon: float) -> Tuple[Optional[Dict[str, Any]], float]:
        """Find closest catalog city and the distance in kilometers."""
        cls._ensure_loaded()
        if not cls._cities:
            return None, float("inf")

        best_city = None
        min_dist = float("inf")
        for city in cls._cities:
            d = cls.haversine_distance_km(lat, lon, city["lat"], city["lon"])
            if d < min_dist:
                min_dist = d
                best_city = city
        return best_city, round(min_dist, 1)

    @classmethod
    def get_coverage_status(cls, lat: float, lon: float) -> Dict[str, Any]:
        """Determine coverage tier, validation state, and nearest station."""
        if not cls.is_within_india(lat, lon):
            return {
                "in_coverage": False,
                "tier": "outside_coverage",
                "confidence": "none",
                "message": (
                    f"Coordinates ({lat}, {lon}) are outside the Indian geographical bounds "
                    f"({INDIA_BOUNDS['min_lat']}°N–{INDIA_BOUNDS['max_lat']}°N, "
                    f"{INDIA_BOUNDS['min_lon']}°E–{INDIA_BOUNDS['max_lon']}°E). "
                    "Air-Pollution-XAI is calibrated for the Indian subcontinent."
                ),
            }

        nearest, dist_km = cls.find_nearest_city(lat, lon)
        if dist_km <= 30.0 and nearest:
            return {
                "in_coverage": True,
                "tier": "directly_trained",
                "confidence": "high",
                "nearest_city": nearest["name"],
                "nearest_city_id": nearest["id"],
                "distance_km": dist_km,
                "state": nearest.get("state"),
                "region": nearest.get("region"),
                "message": (
                    f"Directly trained & validated for {nearest['name']}, {nearest.get('state')} "
                    f"({dist_km} km away). High model confidence."
                ),
            }
        elif dist_km <= 150.0 and nearest:
            return {
                "in_coverage": True,
                "tier": "regional_interpolation",
                "confidence": "moderate",
                "nearest_city": nearest["name"],
                "nearest_city_id": nearest["id"],
                "distance_km": dist_km,
                "state": nearest.get("state"),
                "region": nearest.get("region"),
                "message": (
                    f"Validated via regional atmospheric transferability from {nearest['name']} "
                    f"({dist_km} km away). Moderate model confidence."
                ),
            }
        else:
            return {
                "in_coverage": True,
                "tier": "synoptic_reanalysis",
                "confidence": "indicative",
                "nearest_city": nearest["name"] if nearest else None,
                "nearest_city_id": nearest["id"] if nearest else None,
                "distance_km": dist_km,
                "state": nearest.get("state") if nearest else None,
                "region": nearest.get("region") if nearest else None,
                "message": (
                    f"Covered via nationwide synoptic reanalysis ({dist_km} km from nearest catalog hub "
                    f"{nearest['name'] if nearest else ''}). Indicative model confidence."
                ),
            }

    @classmethod
    def search_cities(cls, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Filter catalog cities matching substring in name or state."""
        cls._ensure_loaded()
        q = query.strip().lower()
        if not q:
            return cls._cities[:limit]

        matches = []
        for city in cls._cities:
            name = city["name"].lower()
            state = city.get("state", "").lower()
            region = city.get("region", "").lower()
            if q == name or q == city["id"]:
                matches.insert(0, city)
            elif q in name or q in state or q in region:
                matches.append(city)

        return matches[:limit]

    @classmethod
    def geocode(cls, query: str) -> List[Dict[str, Any]]:
        """Geocode search query restricted to India using Nominatim with catalog fallback."""
        query_clean = query.strip()
        if not query_clean:
            return []

        cache_key = f"geo:{query_clean.lower()}"
        cached = geocode_cache.get(cache_key)
        if cached is not None:
            return cached

        # 1. Try local catalog exact / prefix match first (fastest, zero network)
        local_matches = cls.search_cities(query_clean, limit=5)
        if local_matches and (query_clean.lower() in [c["name"].lower() for c in local_matches]):
            results = [
                {
                    "name": c["name"],
                    "state": c.get("state", ""),
                    "lat": c["lat"],
                    "lon": c["lon"],
                    "elevation": c.get("elevation", 0),
                    "source": "all_india_catalog",
                    "display_name": f"{c['name']}, {c.get('state')}, India",
                }
                for c in local_matches
            ]
            geocode_cache.set(cache_key, results)
            return results

        # 2. Query OpenStreetMap Nominatim restricted to India (countrycodes=in)
        try:
            url = "https://nominatim.openstreetmap.org/search"
            params = {
                "q": query_clean,
                "format": "jsonv2",
                "countrycodes": "in",
                "limit": 5,
                "addressdetails": 1,
            }
            headers = {
                "User-Agent": "AirPollutionXAI/2.0 (capstone; https://github.com/BhanuDanda-09/Air-Pollution-XAI)",
                "Accept": "application/json",
            }
            resp = requests.get(url, params=params, headers=headers, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                results = []
                for item in data:
                    lat = float(item["lat"])
                    lon = float(item["lon"])
                    if cls.is_within_india(lat, lon):
                        addr = item.get("address", {})
                        state = addr.get("state") or addr.get("state_district") or ""
                        city_name = addr.get("city") or addr.get("town") or addr.get("suburb") or item.get("name")
                        results.append({
                            "name": city_name or item.get("name"),
                            "state": state,
                            "lat": round(lat, 4),
                            "lon": round(lon, 4),
                            "elevation": 0,
                            "source": "nominatim_in",
                            "display_name": item.get("display_name", ""),
                        })
                if results:
                    geocode_cache.set(cache_key, results)
                    return results
        except Exception as exc:
            logger.warning("Nominatim geocode failed for '%s': %s", query_clean, exc)

        # Fallback to local catalog matches if any
        fallback_results = [
            {
                "name": c["name"],
                "state": c.get("state", ""),
                "lat": c["lat"],
                "lon": c["lon"],
                "elevation": c.get("elevation", 0),
                "source": "catalog_fallback",
                "display_name": f"{c['name']}, {c.get('state')}, India",
            }
            for c in local_matches
        ]
        geocode_cache.set(cache_key, fallback_results)
        return fallback_results
