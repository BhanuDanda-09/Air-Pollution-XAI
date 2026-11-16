"""Livability & Exposure Scoring Engine for real-world decision guidance."""

import logging
from typing import Any, Dict, List, Optional
from backend.config import Config

logger = logging.getLogger(__name__)


class LivabilityService:
    """Computes transparent, multi-factor Livability and Exposure Scores.

    Core Scientific Rule:
    The verdict is driven primarily by Reference PM2.5 (CAMS model data) + forecast.
    The machine learning estimate (XGBoost) serves strictly as secondary surface meteorological
    context because it was trained exclusively on historical Delhi winter monitoring data (AT 11-23°C).
    If Reference PM2.5 is unavailable, the engine returns a 'low confidence' verdict and refuses
    to silently fall back to the ML model estimate.
    """

    @staticmethod
    def pm25_to_subscore(pm25: float) -> float:
        """Map PM2.5 concentration (µg/m³) to a continuous 0-100 score aligned with CPCB/WHO."""
        if pm25 <= 0.0:
            return 100.0
        if pm25 <= 15.0:
            # WHO 24-hr guideline: Near-perfect air
            return round(100.0 - (pm25 / 15.0) * 10.0, 1)  # 90.0 - 100.0
        if pm25 <= 30.0:
            # CPCB Good: 80 - 90
            return round(90.0 - ((pm25 - 15.0) / 15.0) * 10.0, 1)
        if pm25 <= 60.0:
            # CPCB Satisfactory: 65 - 80
            return round(80.0 - ((pm25 - 30.0) / 30.0) * 15.0, 1)
        if pm25 <= 90.0:
            # CPCB Moderate: 50 - 65
            return round(65.0 - ((pm25 - 60.0) / 30.0) * 15.0, 1)
        if pm25 <= 120.0:
            # CPCB Poor: 35 - 50
            return round(50.0 - ((pm25 - 90.0) / 30.0) * 15.0, 1)
        if pm25 <= 250.0:
            # CPCB Very Poor: 20 - 35
            return round(35.0 - ((pm25 - 120.0) / 130.0) * 15.0, 1)
        # CPCB Severe: 0 - 20
        return round(max(0.0, 20.0 - ((pm25 - 250.0) / 250.0) * 20.0), 1)

    @staticmethod
    def calculate_met_dispersion_subscore(features: Dict[str, float]) -> float:
        """Estimate atmospheric dispersion / ventilation potential from surface weather."""
        sr = features.get("SR", 100.0)
        rh = features.get("RH", 60.0)

        # High solar radiation creates thermal turbulence/mixing layer growth
        solar_factor = min(100.0, max(20.0, (sr / 300.0) * 80.0 + 20.0))
        # High relative humidity (>80%) accelerates secondary aerosol hygroscopic growth and trapping
        moisture_factor = max(10.0, 100.0 - max(0.0, rh - 40.0) * 1.5)

        dispersion_score = round(0.55 * solar_factor + 0.45 * moisture_factor, 1)
        return min(100.0, max(0.0, dispersion_score))

    @classmethod
    def evaluate_livability(
        cls,
        reference_info: Dict[str, Any],
        weather_info: Dict[str, Any],
        ml_prediction: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Synthesize multi-factor Livability and Exposure assessment.

        Returns:
            Structured dict containing score, tier, confidence, verdict, persona advice,
            and explicit transparency notes separating primary driver from secondary ML context.
        """
        ref_pm25 = reference_info.get("reference_pm25")
        ml_pm25 = ml_prediction.get("pm25")
        is_delhi_ncr = weather_info.get("is_delhi_ncr", False)
        features = weather_info.get("features", {})
        config = Config.LIVABILITY_CONFIG
        weights = config["weights"]

        # -------------------------------------------------------------------
        # STRICT RULE: If Reference PM2.5 is unavailable, NEVER silently fall back
        # -------------------------------------------------------------------
        if ref_pm25 is None:
            logger.warning("Reference PM2.5 is unavailable. Returning low confidence verdict.")
            return {
                "score": None,
                "tier": "Unverified / Reference Offline",
                "color": "#94A3B8",
                "confidence": "low",
                "confidence_reason": (
                    "Reference ambient air quality data (CAMS) is temporarily unavailable. "
                    "Livability verdict cannot be reliably established without verified reference data. "
                    "The ML model estimate provides surface meteorological context only and must NOT "
                    "be used as a standalone livability decision basis."
                ),
                "verdicts": {
                    "should_i_go": "Caution advised: Real-time reference air quality data is currently unreachable for this location.",
                    "should_i_live": "Insufficient long-term observational data to confirm livability without reference CAMS records.",
                },
                "score_components": None,
                "persona_guidance": cls._build_fallback_persona_guidance(),
                "primary_driver": {
                    "source": "Reference PM2.5 (CAMS model data)",
                    "status": "unavailable",
                    "note": "Reference service returned null or timed out.",
                },
                "secondary_ml_context": {
                    "model_key": ml_prediction.get("model_key", "xgboost"),
                    "estimated_pm25": ml_pm25,
                    "unit": "µg/m³",
                    "cpcb_category": ml_prediction.get("cpcb_category", {}).get("category"),
                    "note": (
                        "Statistical surface weather estimate only. Trained exclusively on Delhi winter "
                        "data (AT 11-23°C). Not used to fabricate livability score when reference is missing."
                    ),
                },
            }

        # -------------------------------------------------------------------
        # Primary Scoring Calculation
        # -------------------------------------------------------------------
        forecast_info = reference_info.get("forecast_24h") or {}
        ref_fc_pm25 = forecast_info.get("mean_pm25")
        if ref_fc_pm25 is None:
            ref_fc_pm25 = ref_pm25  # Fallback to current if hourly forecast absent

        ref_current_score = cls.pm25_to_subscore(ref_pm25)
        ref_fc_score = cls.pm25_to_subscore(ref_fc_pm25)
        met_dispersion_score = cls.calculate_met_dispersion_subscore(features)

        composite_score = round(
            weights["reference_current"] * ref_current_score
            + weights["reference_forecast_24h"] * ref_fc_score
            + weights["meteorological_stagnation"] * met_dispersion_score
        )
        composite_score = max(0, min(100, composite_score))

        # Match score against configured tiers
        matched_tier = config["score_tiers"][-1]
        for tier in config["score_tiers"]:
            if composite_score >= tier["min_score"]:
                matched_tier = tier
                break

        # Determine confidence level
        if is_delhi_ncr:
            confidence = "high"
            confidence_reason = (
                "High confidence: Both Copernicus (CAMS) regional reference data and the "
                "local surface meteorological XGBoost model are operating within their validated domain."
            )
        else:
            confidence = "moderate"
            confidence_reason = (
                "Moderate confidence: Verdict is anchored on Copernicus (CAMS) reference data. "
                "However, the location is outside Delhi-NCR, meaning the secondary ML estimate is an extrapolation."
            )

        persona_guidance = cls._build_persona_guidance(composite_score, ref_pm25, matched_tier)

        return {
            "score": composite_score,
            "tier": matched_tier["tier"],
            "cpcb_match": matched_tier["cpcb_match"],
            "color": matched_tier["color"],
            "confidence": confidence,
            "confidence_reason": confidence_reason,
            "verdicts": {
                "should_i_go": matched_tier["go_verdict"],
                "should_i_live": matched_tier["stay_verdict"],
            },
            "score_components": {
                "reference_current": {
                    "value_pm25": ref_pm25,
                    "subscore": ref_current_score,
                    "weight": weights["reference_current"],
                    "contribution": round(weights["reference_current"] * ref_current_score, 1),
                },
                "reference_forecast_24h": {
                    "value_pm25": ref_fc_pm25,
                    "trend": forecast_info.get("trend", "stable"),
                    "subscore": ref_fc_score,
                    "weight": weights["reference_forecast_24h"],
                    "contribution": round(weights["reference_forecast_24h"] * ref_fc_score, 1),
                },
                "meteorological_ventilation": {
                    "subscore": met_dispersion_score,
                    "weight": weights["meteorological_stagnation"],
                    "contribution": round(weights["meteorological_stagnation"] * met_dispersion_score, 1),
                },
            },
            "persona_guidance": persona_guidance,
            "primary_driver": {
                "source": reference_info.get("reference_label", "Reference PM2.5 (CAMS model data)"),
                "current_pm25": ref_pm25,
                "unit": "µg/m³",
                "role": "Primary determinant of exposure score and health advisories.",
            },
            "secondary_ml_context": {
                "model_key": ml_prediction.get("model_key", "xgboost"),
                "estimated_pm25": ml_pm25,
                "unit": "µg/m³",
                "delta_to_reference": round(ml_pm25 - ref_pm25, 2) if ml_pm25 is not None else None,
                "cpcb_category": ml_prediction.get("cpcb_category", {}).get("category"),
                "role": "Secondary surface meteorological context (weather-driven particulate stagnation).",
                "scientific_limitation": (
                    "Trained strictly on historical Delhi winter monitoring data (AT 11-23°C). "
                    "Provided for meteorological feature attribution (SHAP), not as the primary verdict driver."
                ),
            },
        }

    @staticmethod
    def _build_persona_guidance(score: int, pm25: float, tier: Dict[str, Any]) -> Dict[str, Any]:
        """Construct actionable advice for different user personas."""
        if score >= 80:
            return {
                "general": {
                    "action": "Unrestricted Outdoor Activity",
                    "details": "Air quality is ideal for all normal daily activities, commuting, and natural window ventilation.",
                    "tag": "Safe",
                },
                "sensitive": {
                    "action": "Safe for Sensitive Groups",
                    "details": "Asthma and allergy sufferers can participate in outdoor routines without elevated concern.",
                    "tag": "Safe",
                },
                "outdoor": {
                    "action": "Excellent for Sports & Running",
                    "details": "Great conditions for marathon training, cycling, and intense cardiovascular sports outdoors.",
                    "tag": "Recommended",
                },
            }
        elif score >= 65:
            return {
                "general": {
                    "action": "Normal Daily Routine",
                    "details": "Ambient air is acceptable. Most individuals can go about their day without special precautions.",
                    "tag": "Acceptable",
                },
                "sensitive": {
                    "action": "Monitor Mild Symptoms",
                    "details": "Extremely sensitive individuals may experience slight throat irritation or coughing during prolonged exertion.",
                    "tag": "Minor Caution",
                },
                "outdoor": {
                    "action": "Good for Outdoor Workouts",
                    "details": "Suitable for jogging, sports, and outdoor workouts. Stay hydrated.",
                    "tag": "Good",
                },
            }
        elif score >= 50:
            return {
                "general": {
                    "action": "Moderate Exposure Caution",
                    "details": "Healthy adults can commute normally, but avoid high-traffic choke points during evening rush hours.",
                    "tag": "Moderate",
                },
                "sensitive": {
                    "action": "Reduce Extended Outdoor Exertion",
                    "details": "Children, seniors, and asthmatics should take frequent breaks and carry rescue inhalers if needed.",
                    "tag": "Caution",
                },
                "outdoor": {
                    "action": "Shift Workouts Indoors or to Midday",
                    "details": "Avoid heavy cardio during early morning inversions when particulate matter concentrates near the ground.",
                    "tag": "Adjust Timing",
                },
            }
        elif score >= 35:
            return {
                "general": {
                    "action": "Limit Prolonged Outdoor Time",
                    "details": "Wear a well-fitting mask (N95/KF94) near congested roadways. Keep domestic windows closed.",
                    "tag": "Unfavorable",
                },
                "sensitive": {
                    "action": "Stay Indoors with Air Purifiers",
                    "details": "Respiratory irritation and shortness of breath likely. Operate HEPA air purifiers at home.",
                    "tag": "High Caution",
                },
                "outdoor": {
                    "action": "Move Training Indoors",
                    "details": "Heavy cardiovascular exercise outdoors will deposit significant fine particulates into deep lung tissue.",
                    "tag": "Not Recommended",
                },
            }
        else:
            return {
                "general": {
                    "action": "Avoid Non-Essential Outdoor Exposure",
                    "details": "Hazardous particulate levels. An N95 respirator is strictly necessary for any outdoor transit.",
                    "tag": "Hazardous",
                },
                "sensitive": {
                    "action": "Strict Indoor Confinement",
                    "details": "High acute risk of asthma exacerbation and cardiovascular strain. Continuous HEPA filtration required.",
                    "tag": "Emergency",
                },
                "outdoor": {
                    "action": "Cancel All Outdoor Athletics",
                    "details": "Intense breathing in this environment carries severe cardiovascular and pulmonary health risks.",
                    "tag": "Prohibited",
                },
            }

    @staticmethod
    def _build_fallback_persona_guidance() -> Dict[str, Any]:
        """Guidance when reference data is temporarily offline."""
        return {
            "general": {
                "action": "Check Local Visual Air Visibility",
                "details": "Reference data offline. Look for visible smog/haze or check municipal monitoring stations.",
                "tag": "Unverified",
            },
            "sensitive": {
                "action": "Precautionary Protection",
                "details": "If you experience coughing or breathing difficulty, remain indoors and operate air filtration.",
                "tag": "Precautionary",
            },
            "outdoor": {
                "action": "Use Caution During Peak Traffic",
                "details": "Limit strenuous exertion until live reference sensor connectivity is restored.",
                "tag": "Precautionary",
            },
        }
