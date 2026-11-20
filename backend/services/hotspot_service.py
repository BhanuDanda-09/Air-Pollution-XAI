"""All-India Hotspot Analysis and National Ranking Service."""

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
HOTSPOTS_JSON_PATH = PROJECT_ROOT / "results" / "city_hotspots.json"


class HotspotService:
    """Provides nationwide city exposure rankings, regional aggregations, and hotspot tiers."""

    _cached_data: Optional[Dict[str, Any]] = None

    @classmethod
    def _load_data(cls) -> Dict[str, Any]:
        if cls._cached_data is not None:
            return cls._cached_data

        if HOTSPOTS_JSON_PATH.exists():
            try:
                with open(HOTSPOTS_JSON_PATH, "r", encoding="utf-8") as f:
                    cls._cached_data = json.load(f)
                    logger.info("Loaded hotspots analysis from %s", HOTSPOTS_JSON_PATH)
                    return cls._cached_data
            except Exception as exc:
                logger.error("Failed to load hotspots data: %s", exc)

        return {"metadata": {}, "national_rankings": [], "regional_summaries": {}}

    @classmethod
    def get_national_hotspots(cls, region: Optional[str] = None, tier: Optional[str] = None, limit: int = 45) -> Dict[str, Any]:
        """Return ranked list of cities filtered optionally by region or cluster tier."""
        data = cls._load_data()
        rankings = data.get("national_rankings", [])

        if region:
            reg_clean = region.strip().lower()
            rankings = [r for r in rankings if r.get("region", "").lower() == reg_clean]

        if tier:
            tier_clean = tier.strip().lower()
            rankings = [r for r in rankings if tier_clean in r.get("cluster_tier", "").lower()]

        return {
            "success": True,
            "metadata": data.get("metadata", {}),
            "total_cities": len(rankings),
            "rankings": rankings[:limit],
            "regional_summaries": data.get("regional_summaries", {}),
        }

    @classmethod
    def get_city_hotspot_profile(cls, city_id: str) -> Optional[Dict[str, Any]]:
        """Return detailed hotspot percentile card for a specific city."""
        data = cls._load_data()
        c_id = city_id.strip().lower()
        for city in data.get("national_rankings", []):
            if city.get("city_id") == c_id:
                return city
        return None
