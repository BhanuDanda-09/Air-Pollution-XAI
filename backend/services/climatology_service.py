"""All-India Climatology Service: Monthly and Seasonal Air Quality Norms."""

import json
import logging
from pathlib import Path
from typing import Any, Dict, Optional

from backend.services.city_service import CityService

logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
CLIMATOLOGY_JSON_PATH = PROJECT_ROOT / "results" / "city_climatology.json"


class ClimatologyService:
    """Provides historical monthly profiles, best/worst months, and seasonal inversion metrics."""

    _cached_data: Optional[Dict[str, Any]] = None

    @classmethod
    def _load_data(cls) -> Dict[str, Any]:
        if cls._cached_data is not None:
            return cls._cached_data

        if CLIMATOLOGY_JSON_PATH.exists():
            try:
                with open(CLIMATOLOGY_JSON_PATH, "r", encoding="utf-8") as f:
                    cls._cached_data = json.load(f)
                    logger.info("Loaded city climatology for %d cities", len(cls._cached_data))
                    return cls._cached_data
            except Exception as exc:
                logger.error("Failed to load climatology JSON: %s", exc)

        return {}

    @classmethod
    def get_city_climatology(cls, city_id: Optional[str] = None, lat: Optional[float] = None, lon: Optional[float] = None) -> Dict[str, Any]:
        """Fetch climatology profile for a city ID or nearest coordinates."""
        data = cls._load_data()

        resolved_id = None
        if city_id:
            resolved_id = city_id.strip().lower()
        elif lat is not None and lon is not None:
            nearest, _ = CityService.find_nearest_city(lat, lon)
            if nearest:
                resolved_id = nearest["id"]

        if resolved_id and resolved_id in data:
            return {
                "success": True,
                "data": data[resolved_id],
            }

        # Fallback to Delhi if unmatched
        fallback = data.get("delhi")
        if fallback:
            return {
                "success": True,
                "is_fallback": True,
                "data": fallback,
            }

        return {
            "success": False,
            "error": "climatology_not_found",
            "message": "Climatological historical profile not found.",
        }
