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
            # CPCB Good: 75 - 90
            return round(90.0 - ((pm25 - 15.0) / 15.0) * 15.0, 1)
        if pm25 <= 60.0:
            # CPCB Satisfactory: 50 - 75
            return round(75.0 - ((pm25 - 30.0) / 30.0) * 25.0, 1)
        if pm25 <= 90.0:
            # CPCB Moderate: 35 - 50
            return round(50.0 - ((pm25 - 60.0) / 30.0) * 15.0, 1)
        if pm25 <= 120.0:
            # CPCB Poor: 20 - 35
            return round(35.0 - ((pm25 - 90.0) / 30.0) * 15.0, 1)
        if pm25 <= 250.0:
            # CPCB Very Poor: 10 - 20
            return round(20.0 - ((pm25 - 120.0) / 130.0) * 10.0, 1)
        # CPCB Severe: 0 - 10
        return round(max(0.0, 10.0 - ((pm25 - 250.0) / 250.0) * 10.0), 1)

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

    @staticmethod
    def calculate_health_profile_shift(health_profile: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Compute threshold shift from health risk indicators (tightening thresholds)."""
        shifts_cfg = Config.LIVABILITY_CONFIG.get("health_profile_shifts", {})
        if not health_profile or not isinstance(health_profile, dict):
            return {
                "total_shift": 0,
                "applied_factors": [],
                "vulnerability": "standard",
            }

        total = 0
        applied = []

        # Age group
        age = str(health_profile.get("age_group", "adult")).lower()
        if age == "child":
            shift = shifts_cfg.get("child", 8)
            total += shift
            applied.append(f"Child profile (+{shift} sensitivity shift)")
        elif age == "senior":
            shift = shifts_cfg.get("senior", 8)
            total += shift
            applied.append(f"Senior / 65+ profile (+{shift} sensitivity shift)")

        # Conditions
        if health_profile.get("has_respiratory_condition") or health_profile.get("asthma"):
            shift = shifts_cfg.get("respiratory_condition", 10)
            total += shift
            applied.append(f"Asthma / Respiratory condition (+{shift} sensitivity shift)")

        if health_profile.get("has_heart_condition"):
            shift = shifts_cfg.get("heart_condition", 10)
            total += shift
            applied.append(f"Cardiovascular / Heart condition (+{shift} sensitivity shift)")

        if health_profile.get("is_pregnant"):
            shift = shifts_cfg.get("pregnant", 10)
            total += shift
            applied.append(f"Pregnancy (+{shift} sensitivity shift)")

        if health_profile.get("is_outdoor_worker"):
            shift = shifts_cfg.get("outdoor_worker", 8)
            total += shift
            applied.append(f"Outdoor worker / Prolonged exposure (+{shift} sensitivity shift)")

        max_shift = shifts_cfg.get("max_total_shift", 25)
        total_shift = min(total, max_shift)

        vulnerability = "standard"
        if total_shift >= 20:
            vulnerability = "high"
        elif total_shift >= 8:
            vulnerability = "elevated"

        return {
            "total_shift": total_shift,
            "applied_factors": applied,
            "vulnerability": vulnerability,
        }

    @classmethod
    def evaluate_livability(
        cls,
        reference_info: Dict[str, Any],
        weather_info: Dict[str, Any],
        ml_prediction: Dict[str, Any],
        health_profile: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Synthesize multi-factor Livability and Exposure assessment.

        Returns:
            Structured dict containing score, tier/verdict, confidence, reasons,
            tailored actions, best time to go out, 7-day trend, and explanation.
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
                "verdict": "Unverified / Reference Offline",
                "tier": "Unverified / Reference Offline",
                "color": "#94A3B8",
                "confidence": "low",
                "confidence_reason": (
                    "Reference ambient air quality data (CAMS) is temporarily unavailable. "
                    "Livability verdict cannot be reliably established without verified reference data. "
                    "The ML model estimate provides surface meteorological context only and must NOT "
                    "be used as a standalone livability decision basis."
                ),
                "summary": "Real-time reference air quality data is currently unreachable for this location.",
                "reasons": [
                    "CAMS regional reference satellite service is unreachable or timed out.",
                    "ML model estimate is available for meteorological context only, but cannot substitute for verified ambient data.",
                ],
                "tailored_advice": {
                    "n95_mask": "Precautionary N95 mask advised if outdoor haze or odor is noticeable.",
                    "indoor_exercise": "Prefer indoor workout until reference connectivity is restored.",
                    "windows": "Keep windows partially closed during morning and evening rush hours.",
                    "purifier": "Operate indoor HEPA air purifier on automatic mode.",
                },
                "persona_guidance": {
                    "general": {
                        "tag": "Caution",
                        "action": "Exercise caution; reference data temporarily unavailable",
                        "details": "Assess local visual haze and odor before planning prolonged outdoor activities.",
                    },
                    "sensitive": {
                        "tag": "High Caution",
                        "action": "Sensitive groups should prefer filtered indoor environments",
                        "details": "Keep rescue inhalers accessible and avoid strenuous exertion near roadways.",
                    },
                    "outdoor": {
                        "tag": "Adjust Timing",
                        "action": "Limit outdoor workouts if smog or dust is visibly evident",
                        "details": "Switch to indoor treadmill or gym workouts until reference connectivity is restored.",
                    },
                },
                "explain_verdict": {
                    "primary_driver_evaluation": "CAMS Reference is offline. No score computed.",
                    "secondary_ml_role": f"XGBoost estimated {ml_pm25} µg/m³ from surface weather, but is not used to fabricate scores.",
                    "health_profile_impact": "Profile not applied while reference is offline.",
                },
                "score_components": None,
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
                "best_time_today": reference_info.get("best_time_today"),
                "seven_day_forecast": reference_info.get("seven_day_forecast"),
                "medical_disclaimer": Config.MEDICAL_DISCLAIMER,
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

        # Health profile sensitivity adjustment
        profile_shift = cls.calculate_health_profile_shift(health_profile)
        effective_score = max(0, composite_score - profile_shift["total_shift"])

        # Match against 4 Standard Verdicts:
        # Good to go / Take precautions / Avoid outdoor activity / Not recommended
        verdicts_list = config.get("verdicts", [])
        matched_verdict = verdicts_list[-1]  # Default to not_recommended
        for v in verdicts_list:
            if effective_score >= v["min_baseline_score"]:
                matched_verdict = v
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

        # Plain language reasons
        reasons = [
            f"Current Reference PM2.5 is {ref_pm25} µg/m³ ({reference_info.get('reference_label', 'CAMS data')}).",
            f"24-Hour Forecast indicates a {forecast_info.get('trend', 'stable')} trend (mean: {ref_fc_pm25} µg/m³).",
            f"Atmospheric dispersion index is {met_dispersion_score}/100 based on live solar radiation and relative humidity.",
        ]
        if profile_shift["total_shift"] > 0:
            reasons.append(
                f"Health profile adjustments applied: {', '.join(profile_shift['applied_factors'])} "
                f"(-{profile_shift['total_shift']} threshold shift)."
            )

        # "Explain this verdict" interactive panel breakdown
        explain_verdict = {
            "verdict_assigned": matched_verdict["label"],
            "raw_score": composite_score,
            "effective_score": effective_score,
            "primary_driver": (
                f"Reference CAMS PM2.5 ({ref_pm25} µg/m³) provided {round(weights['reference_current'] * ref_current_score, 1)} "
                f"out of 60 possible points."
            ),
            "forecast_influence": (
                f"24h forecast trend ({forecast_info.get('trend', 'stable')}, {ref_fc_pm25} µg/m³) contributed "
                f"{round(weights['reference_forecast_24h'] * ref_fc_score, 1)} out of 25 possible points."
            ),
            "meteorological_context": (
                f"Surface weather (SR: {features.get('SR', 0)} W/m², RH: {features.get('RH', 0)}%) provided "
                f"{round(weights['meteorological_stagnation'] * met_dispersion_score, 1)} out of 15 possible points."
            ),
            "secondary_ml_role": (
                f"XGBoost model predicted {ml_pm25} µg/m³ from surface weather alone. This is displayed as "
                f"secondary context to illustrate surface stagnation and does NOT override CAMS reference observations."
            ),
            "health_profile_tightening": (
                f"Vulnerability level is '{profile_shift['vulnerability']}'. Thresholds tightened by "
                f"{profile_shift['total_shift']} points due to: {', '.join(profile_shift['applied_factors']) if profile_shift['applied_factors'] else 'No high-risk conditions reported.'}"
            ),
        }

        # Targeted persona-specific health guidance
        persona_guidance = {
            "general": {
                "tag": "Safe" if effective_score >= 75 else ("Moderate" if effective_score >= 50 else ("Unfavorable" if effective_score >= 30 else "Hazardous")),
                "action": (
                    "Normal outdoor routines and natural home ventilation permitted." if effective_score >= 75
                    else "Normal outdoor activities permitted; avoid heavy traffic corridors during peak rush hours." if effective_score >= 50
                    else "Limit outdoor exertion; consider indoor gym workouts and keep home windows closed." if effective_score >= 30
                    else "Avoid all outdoor physical activity; seal window drafts and run indoor air purifiers."
                ),
                "details": (
                    "Clean ambient particulate levels support safe cardio exercise, daily commutes, and open-window ventilation." if effective_score >= 75
                    else "Fine particulates may cause minor throat irritation during prolonged strenuous workouts." if effective_score >= 50
                    else "Particulate accumulation elevates respiratory strain. Shift aerobic exercises indoors." if effective_score >= 30
                    else "Severe particulate pollution penetrates alveolar membranes. Stay indoors with continuous HEPA filtration."
                ),
            },
            "sensitive": {
                "tag": "Good" if effective_score >= 85 else ("Caution" if effective_score >= 60 else ("High Caution" if effective_score >= 35 else "Emergency")),
                "action": (
                    "Safe outdoor conditions for children, seniors, and expectant mothers." if effective_score >= 75
                    else "Sensitive individuals should carry quick-relief inhalers and avoid intense outdoor play." if effective_score >= 50
                    else "Strictly avoid outdoor recreation; wear an N95 respirator if transit is required." if effective_score >= 30
                    else "Remain indoors in a clean-air room with HEPA filtration; consult physician if symptoms appear."
                ),
                "details": (
                    "Minimal risk for asthma, COPD, or cardiovascular patients under current atmospheric dispersion." if effective_score >= 75
                    else "Children and asthmatics are more susceptible to bronchospasm. Restrict high-intensity outdoor games." if effective_score >= 50
                    else "Elevated risk of asthma exacerbation, chest tightness, and cardiovascular strain." if effective_score >= 30
                    else "Critical hazard for vulnerable respiratory or cardiovascular profiles. Seek immediate care if distress occurs."
                ),
            },
            "outdoor": {
                "tag": "Recommended" if effective_score >= 75 else ("Adjust Timing" if effective_score >= 50 else ("Not Recommended" if effective_score >= 30 else "Prohibited")),
                "action": (
                    "Optimal conditions for running, cycling, and prolonged outdoor labor." if effective_score >= 75
                    else "Schedule strenuous training during mid-day dispersion windows; avoid peak traffic hours." if effective_score >= 50
                    else "Relocate athletic training indoors; outdoor workers must wear tight-fitting N95 respirators." if effective_score >= 30
                    else "Halt all non-essential outdoor work and outdoor athletic activities."
                ),
                "details": (
                    "Favorable atmospheric dispersion prevents particulate accumulation during deep aerobic breathing." if effective_score >= 75
                    else "Deep inhalation during exercise increases particulate dosage. Prefer hours with lowest ambient PM2.5." if effective_score >= 50
                    else "Heavy ventilation during outdoor exercise significantly increases toxic particulate deposition in lungs." if effective_score >= 30
                    else "Extreme particulate exposure poses immediate acute hazards to pulmonary and vascular function."
                ),
            },
        }

        return {
            "score": effective_score,
            "raw_score": composite_score,
            "verdict": matched_verdict["label"],
            "tier": matched_verdict["label"],
            "color": matched_verdict["color"],
            "summary": matched_verdict["summary"],
            "confidence": confidence,
            "confidence_reason": confidence_reason,
            "reasons": reasons,
            "tailored_advice": matched_verdict["actions"],
            "persona_guidance": persona_guidance,
            "explain_verdict": explain_verdict,
            "health_profile_applied": {
                "profile": health_profile or {},
                "total_shift": profile_shift["total_shift"],
                "vulnerability": profile_shift["vulnerability"],
                "applied_factors": profile_shift["applied_factors"],
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
            "best_time_today": reference_info.get("best_time_today"),
            "seven_day_forecast": reference_info.get("seven_day_forecast"),
            "medical_disclaimer": Config.MEDICAL_DISCLAIMER,
        }
