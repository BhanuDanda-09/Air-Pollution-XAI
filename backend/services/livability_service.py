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

    @classmethod
    def get_cpcb_category(cls, pm25: Optional[float]) -> str:
        """Return CPCB 2014 air quality category for 24-hr PM2.5 concentration (µg/m³).

        Breakpoints:
        - Good: 0 - 30 µg/m³
        - Satisfactory: 31 - 60 µg/m³
        - Moderate: 61 - 90 µg/m³
        - Poor: 91 - 120 µg/m³
        - Very Poor: 121 - 250 µg/m³
        - Severe: > 250 µg/m³
        """
        if pm25 is None:
            return "Unknown"
        if pm25 <= 30.0:
            return "Good"
        elif pm25 <= 60.0:
            return "Satisfactory"
        elif pm25 <= 90.0:
            return "Moderate"
        elif pm25 <= 120.0:
            return "Poor"
        elif pm25 <= 250.0:
            return "Very Poor"
        else:
            return "Severe"

    @classmethod
    def is_sensitive_profile(cls, health_profile: Optional[Dict[str, Any]]) -> bool:
        """Determine whether the user has a sensitive/vulnerable health profile."""
        if not health_profile or not isinstance(health_profile, dict):
            return False
        # Check explicit conditions list
        conditions = [str(c).lower() for c in health_profile.get("conditions", [])]
        sensitive_keywords = {
            "asthma", "copd", "bronchitis", "allergic_rhinitis", "respiratory",
            "cardiovascular", "heart_disease", "hypertension", "diabetes",
            "pregnancy", "child", "senior", "outdoor_worker",
        }
        if any(c in sensitive_keywords for c in conditions):
            return True
        # Check boolean condition flags
        if (
            health_profile.get("has_respiratory_condition")
            or health_profile.get("asthma")
            or health_profile.get("has_heart_condition")
            or health_profile.get("is_pregnant")
            or health_profile.get("is_outdoor_worker")
        ):
            return True
        # Check age group
        age = str(health_profile.get("age_group", "adult")).lower()
        if age in ("child", "senior"):
            return True
        return False

    @classmethod
    def get_verdict_messaging(
        cls,
        cpcb_category: str,
        is_sensitive: bool,
        health_profile: Optional[Dict[str, Any]] = None,
        effective_score: float = 50.0,
    ) -> Dict[str, Any]:
        """Align verdict summary and protective advice with CPCB PM2.5 band and health profile.

        Strict constraints:
        - For 91-120 µg/m³ (Poor), do NOT say 'Severe air pollution crisis';
        - 'Severe' wording is used strictly only for the Severe band (> 250 µg/m³).
        - Sensitive groups receive stricter, tailored clinical guidance.
        """
        cat_lower = cpcb_category.lower()

        if cat_lower == "good":
            if is_sensitive:
                summary = (
                    "Air quality is in the CPCB Good band. Favorable conditions for sensitive individuals, "
                    "children, and seniors; outdoor activities and natural home ventilation are safe."
                )
                actions = {
                    "n95_mask": "Mask not required; maintain standard medication readiness if clinically prescribed.",
                    "indoor_exercise": "Safe for children, seniors, and asthmatics to enjoy outdoor exercise.",
                    "windows": "Natural fresh-air ventilation encouraged during daytime dispersion hours.",
                    "purifier": "Air purifiers optional; maintain standard indoor allergen management.",
                }
            else:
                summary = (
                    "Air quality is in the CPCB Good band. Minimal health risk; outdoor activities, sports, "
                    "and natural home ventilation are safe for all groups."
                )
                actions = {
                    "n95_mask": "Not required for general population under clean air conditions.",
                    "indoor_exercise": "Outdoor workouts encouraged; enjoy parks and open spaces.",
                    "windows": "Open windows freely for natural fresh-air ventilation.",
                    "purifier": "Air purifiers optional under clean outdoor air conditions.",
                }

        elif cat_lower == "satisfactory":
            if is_sensitive:
                summary = (
                    "Air quality is in the CPCB Satisfactory band. Minor breathing discomfort may occur for sensitive "
                    "individuals during prolonged heavy outdoor exertion; take breaks if symptoms appear."
                )
                actions = {
                    "n95_mask": "Sensitive individuals advised to carry an N95 mask in congested traffic corridors.",
                    "indoor_exercise": "Sensitive groups and children should take periodic breaks during prolonged outdoor play.",
                    "windows": "Keep windows closed during morning and evening rush hour traffic peaks.",
                    "purifier": "Running an indoor purifier in bedrooms can benefit sensitive respiratory profiles.",
                }
            else:
                summary = (
                    "Air quality is in the CPCB Satisfactory band. Ambient particulate levels pose minimal risk "
                    "for healthy individuals during normal daily routines."
                )
                actions = {
                    "n95_mask": "Mask optional for general population in open areas.",
                    "indoor_exercise": "Normal outdoor workouts and physical activities permitted.",
                    "windows": "Windows can remain open; close during peak rush hour traffic.",
                    "purifier": "Air purifiers optional during normal hours.",
                }

        elif cat_lower == "moderate":
            if is_sensitive:
                summary = (
                    "Air quality is in the CPCB Moderate band. Breathing discomfort possible for people with asthma, "
                    "lung, or heart disease. Sensitive groups should reduce prolonged heavy outdoor exertion."
                )
                actions = {
                    "n95_mask": "N95 / FFP2 respirator advised for sensitive individuals and seniors when outdoors.",
                    "indoor_exercise": "Sensitive individuals, children, and seniors should move heavy aerobic exercise indoors.",
                    "windows": "Keep windows closed to prevent particulate accumulation indoors.",
                    "purifier": "Operate indoor HEPA air purifiers in bedrooms and primary living rooms.",
                }
            else:
                summary = (
                    "Air quality is in the CPCB Moderate band. Healthy individuals can engage in routine outdoor activities; "
                    "prolonged strenuous workouts may cause slight throat irritation."
                )
                actions = {
                    "n95_mask": "N95 mask recommended in congested or dust-heavy traffic corridors.",
                    "indoor_exercise": "Healthy adults can exercise outdoors; reduce duration of strenuous cardio.",
                    "windows": "Limit window opening during morning and evening rush hours.",
                    "purifier": "Indoor air purifiers recommended in living spaces.",
                }

        elif cat_lower == "poor":
            # 91 - 120 µg/m³: NO 'severe' or 'crisis' wording!
            if is_sensitive:
                summary = (
                    "Air quality is in the CPCB Poor band. Heightened risk of breathing discomfort and asthma "
                    "exacerbation for sensitive groups. Strictly avoid prolonged outdoor exertion and keep quick-relief medication handy."
                )
                actions = {
                    "n95_mask": "Airtight N95 / FFP2 respirator strongly advised for any essential outdoor transit.",
                    "indoor_exercise": "Avoid outdoor exertion; exercise indoors in a filtered room.",
                    "windows": "Keep windows firmly closed continuously; seal noticeable draft gaps.",
                    "purifier": "Operate HEPA air purifiers continuously on medium/high speed in living and sleeping areas.",
                }
            else:
                summary = (
                    "Air quality is in the CPCB Poor band. Ambient particulate levels cause breathing discomfort "
                    "on prolonged outdoor exposure. Limit heavy outdoor exertion and close windows."
                )
                actions = {
                    "n95_mask": "N95 / FFP2 respirator recommended for prolonged outdoor commutes.",
                    "indoor_exercise": "Shift strenuous cardio and athletic workouts indoors.",
                    "windows": "Keep windows and doors closed to block ambient dust ingress.",
                    "purifier": "Operate HEPA air purifiers in home and office spaces.",
                }

        elif cat_lower == "very poor":
            # 121 - 250 µg/m³: High hazard, NO 'severe' wording!
            if is_sensitive:
                summary = (
                    "Air quality is in the CPCB Very Poor band. Significant respiratory and cardiovascular risk for "
                    "sensitive individuals, children, and seniors. Strictly avoid outdoor exposure."
                )
                actions = {
                    "n95_mask": "Well-fitted N95 / FFP2 respirator strictly mandatory for any unavoidable outdoor trip.",
                    "indoor_exercise": "Stay indoors; avoid all physical exertion and maintain a clean-air environment.",
                    "windows": "Keep windows sealed; do not open for ventilation during high-pollution periods.",
                    "purifier": "Run high-efficiency HEPA purifiers continuously; monitor indoor PM2.5 levels.",
                }
            else:
                summary = (
                    "Air quality is in the CPCB Very Poor band. Prolonged outdoor exposure increases risk of respiratory "
                    "illness for all individuals. Avoid strenuous outdoor activities."
                )
                actions = {
                    "n95_mask": "N95 / FFP2 respirator strongly advised whenever stepping outdoors.",
                    "indoor_exercise": "Move all athletic training, running, and workouts indoors.",
                    "windows": "Keep windows closed continuously; avoid ventilating with unpurified outdoor air.",
                    "purifier": "Run HEPA air purifiers continuously in bedrooms and living rooms.",
                }

        elif cat_lower == "severe":
            # > 250 µg/m³: 'Severe' wording is strictly appropriate here!
            if is_sensitive:
                summary = (
                    "Severe air pollution emergency. Critical acute hazards for sensitive individuals, children, "
                    "seniors, and patients with cardiopulmonary disease. Remain strictly indoors with continuous HEPA filtration."
                )
                actions = {
                    "n95_mask": "Certified N95 / FFP2 respirator mandatory; avoid any outdoor exposure if possible.",
                    "indoor_exercise": "Remain indoors in a clean-air room; consult physician if experiencing respiratory distress.",
                    "windows": "Completely seal windows and external vents; prevent ambient air infiltration.",
                    "purifier": "Continuous high-grade HEPA purification essential; monitor indoor PM2.5 closely.",
                }
            else:
                summary = (
                    "Severe air pollution event. Ambient PM2.5 exceeds 250 µg/m³, affecting healthy individuals "
                    "and creating serious health risks. Avoid all outdoor physical activity."
                )
                actions = {
                    "n95_mask": "N95 / FFP2 / P100 respirator strictly mandatory for any outdoor transit.",
                    "indoor_exercise": "Strict indoor stay; halt all non-essential outdoor physical activity.",
                    "windows": "Seal window and door draft gaps; do not ventilate with raw ambient air.",
                    "purifier": "Operate high-capacity HEPA filtration units continuously on maximum speed.",
                }

        else:
            # Fallback for offline / unknown reference
            summary = "Unverified air quality. Reference data unavailable to determine CPCB category."
            actions = {
                "n95_mask": "Carry an N95 mask as a precaution in high-traffic corridors.",
                "indoor_exercise": "Monitor local conditions before outdoor exertion.",
                "windows": "Keep windows closed if outdoor smog or haze is visible.",
                "purifier": "Operate indoor air purifiers as needed.",
            }

        return {
            "summary": summary,
            "tailored_advice": actions,
        }

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

        # Determine CPCB air quality band and health sensitivity
        cpcb_category = cls.get_cpcb_category(ref_pm25)
        is_sensitive = cls.is_sensitive_profile(health_profile) or (profile_shift["total_shift"] > 0)

        # Align verdict summary and protective advice with CPCB band and health profile
        messaging = cls.get_verdict_messaging(
            cpcb_category=cpcb_category,
            is_sensitive=is_sensitive,
            health_profile=health_profile,
            effective_score=effective_score,
        )
        verdict_summary = messaging["summary"]
        tailored_actions = messaging["tailored_advice"]

        # Plain language reasons
        reasons = [
            f"Current Reference PM2.5 is {ref_pm25} µg/m³ ({reference_info.get('reference_label', 'CAMS data')}, CPCB band: {cpcb_category}).",
            f"24-Hour Forecast indicates a {forecast_info.get('trend', 'stable')} trend (mean: {ref_fc_pm25} µg/m³).",
            f"Atmospheric dispersion index is {met_dispersion_score}/100 based on live solar radiation and relative humidity.",
        ]
        if profile_shift["total_shift"] > 0:
            reasons.append(
                f"Health profile adjustments applied: {', '.join(profile_shift['applied_factors'])} "
                f"(-{profile_shift['total_shift']} threshold shift)."
            )

        # Generate persona-tailored citizen precautions with direct FAQ linkage
        citizen_precautions = cls.generate_citizen_precautions(
            effective_score=effective_score,
            verdict_label=matched_verdict["label"],
            health_profile=health_profile,
            current_pm25=ref_pm25,
            forecast_pm25=ref_fc_pm25,
            cpcb_category=cpcb_category,
        )

        # "Explain this verdict" interactive panel breakdown
        explain_verdict = {
            "verdict_assigned": matched_verdict["label"],
            "raw_score": composite_score,
            "effective_score": effective_score,
            "primary_driver": (
                f"Reference CAMS PM2.5 ({ref_pm25} µg/m³, CPCB: {cpcb_category}) provided {round(weights['reference_current'] * ref_current_score, 1)} "
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

        # Targeted persona-specific health guidance aligned with CPCB category & score
        if cpcb_category == "Severe":
            gen_tag = "Hazardous"
            gen_action = "Avoid all outdoor physical activity; seal window drafts and run indoor air purifiers."
            gen_details = "Severe particulate pollution penetrates alveolar membranes. Stay indoors with continuous HEPA filtration."
            sens_tag = "Emergency"
            sens_action = "Remain indoors in a clean-air room with HEPA filtration; consult physician if symptoms appear."
            sens_details = "Critical hazard for vulnerable respiratory or cardiovascular profiles. Seek immediate care if distress occurs."
            out_tag = "Prohibited"
            out_action = "Halt all non-essential outdoor work and outdoor athletic activities."
            out_details = "Severe particulate exposure poses immediate acute hazards to pulmonary and vascular function. Halt all outdoor exertion."
        elif cpcb_category == "Very Poor":
            gen_tag = "Hazardous" if effective_score < 20 else "Unfavorable"
            gen_action = "Avoid strenuous outdoor physical activity; move cardio indoors and run air purifiers."
            gen_details = "Very poor air quality with high particulate accumulation. Restrict outdoor activity and run indoor HEPA filtration."
            sens_tag = "High Caution"
            sens_action = "Strictly avoid outdoor recreation; wear an N95 respirator if transit is required."
            sens_details = "Elevated risk of asthma exacerbation, chest tightness, and cardiovascular strain in very poor air."
            out_tag = "Not Recommended"
            out_action = "Relocate athletic training indoors; outdoor workers must wear tight-fitting N95 respirators."
            out_details = "Heavy ventilation during outdoor exercise significantly increases toxic particulate deposition. Move workouts indoors."
        elif cpcb_category == "Poor":
            gen_tag = "Unfavorable"
            gen_action = "Limit prolonged outdoor exertion; consider indoor gym workouts and keep home windows closed."
            gen_details = "Elevated particulate accumulation increases respiratory strain on prolonged exposure. Limit outdoor exertion."
            sens_tag = "High Caution"
            sens_action = "Avoid prolonged outdoor recreation; carry quick-relief inhalers and wear an N95 respirator."
            sens_details = "Elevated risk of cough, throat irritation, and asthma exacerbation during poor air quality."
            out_tag = "Not Recommended"
            out_action = "Relocate strenuous athletic training indoors; outdoor workers should wear N95 respirators."
            out_details = "Prolonged heavy ventilation during outdoor workouts increases particulate dosage. Shift athletic training indoors."
        elif cpcb_category == "Moderate":
            gen_tag = "Moderate"
            gen_action = "Normal outdoor activities permitted; avoid heavy traffic corridors during peak rush hours."
            gen_details = "Particulate levels may cause minor throat or respiratory irritation during prolonged exertion."
            sens_tag = "Caution"
            sens_action = "Sensitive individuals should carry quick-relief inhalers and avoid intense outdoor play."
            sens_details = "Children and asthmatics are more susceptible to bronchospasm. Restrict high-intensity outdoor games."
            out_tag = "Adjust Timing"
            out_action = "Schedule strenuous training during mid-day dispersion windows; avoid peak traffic hours."
            out_details = "Deep inhalation during prolonged strenuous exercise increases particulate exposure. Prefer off-peak hours."
        elif cpcb_category == "Satisfactory":
            gen_tag = "Moderate" if effective_score < 75 else "Safe"
            gen_action = "Normal outdoor routines and natural home ventilation permitted."
            gen_details = "Particulate levels are acceptable; minor irritation only possible for exceptionally sensitive persons."
            sens_tag = "Caution" if is_sensitive else "Good"
            sens_action = "Safe outdoor conditions; sensitive individuals should monitor symptoms during prolonged heavy exercise."
            sens_details = "Low risk for general public; sensitive groups should take intermittent breaks during intense workouts."
            out_tag = "Recommended"
            out_action = "Outdoor training and activities permitted; avoid congested vehicular corridors."
            out_details = "Outdoor physical training is generally safe; adjust timing away from peak traffic corridors."
        else:  # Good or Unknown
            gen_tag = "Safe"
            gen_action = "Normal outdoor routines and natural home ventilation permitted."
            gen_details = "Clean ambient particulate levels support safe cardio exercise, daily commutes, and open-window ventilation."
            sens_tag = "Good"
            sens_action = "Safe outdoor conditions for children, seniors, and expectant mothers."
            sens_details = "Minimal risk for asthma, COPD, or cardiovascular patients under current atmospheric dispersion."
            out_tag = "Recommended"
            out_action = "Optimal conditions for running, cycling, and prolonged outdoor labor."
            out_details = "Favorable atmospheric dispersion prevents particulate accumulation during deep aerobic breathing."

        persona_guidance = {
            "general": {
                "tag": gen_tag,
                "action": gen_action,
                "details": gen_details,
            },
            "sensitive": {
                "tag": sens_tag,
                "action": sens_action,
                "details": sens_details,
            },
            "outdoor": {
                "tag": out_tag,
                "action": out_action,
                "details": out_details,
            },
        }

        return {
            "score": effective_score,
            "raw_score": composite_score,
            "verdict": matched_verdict["label"],
            "tier": matched_verdict["label"],
            "color": matched_verdict["color"],
            "cpcb_category": cpcb_category,
            "summary": verdict_summary,
            "confidence": confidence,
            "confidence_reason": confidence_reason,
            "reasons": reasons,
            "tailored_advice": tailored_actions,
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
            "citizen_precautions": citizen_precautions,
            "medical_disclaimer": Config.MEDICAL_DISCLAIMER,
        }

    @classmethod
    def generate_citizen_precautions(
        cls,
        effective_score: float,
        verdict_label: str = "Moderate",
        health_profile: Optional[Dict[str, Any]] = None,
        current_pm25: Optional[float] = None,
        forecast_pm25: Optional[float] = None,
        cpcb_category: Optional[str] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """Generate tailored citizen precautions based on specific health profile and air severity."""
        profile = health_profile or {}
        conditions = [str(c).lower() for c in profile.get("conditions", [])]
        if profile.get("asthma") or profile.get("has_respiratory_condition"):
            conditions.append("asthma")
        if profile.get("has_heart_condition"):
            conditions.append("cardiovascular")
        if profile.get("is_pregnant"):
            conditions.append("pregnancy")
        if profile.get("is_outdoor_worker"):
            conditions.append("outdoor_worker")

        age_group = str(profile.get("age_group", "adult")).lower()
        if age_group in ("child", "senior"):
            conditions.append(age_group)

        # Detect active vulnerabilities
        active_tags = []
        if any(c in conditions for c in ("asthma", "copd", "bronchitis", "allergic_rhinitis")):
            active_tags.append("Respiratory Vulnerability")
        if any(c in conditions for c in ("cardiovascular", "hypertension", "diabetes")):
            active_tags.append("Cardiovascular Sensitivity")
        if "pregnancy" in conditions:
            active_tags.append("Expectant Mother")
        if "child" in conditions:
            active_tags.append("Young Child (< 12 yrs)")
        if "senior" in conditions:
            active_tags.append("Senior Citizen (65+ yrs)")
        if "outdoor_worker" in conditions:
            active_tags.append("High Outdoor Exposure")

        if not active_tags:
            active_tags.append("Standard Healthy Adult")

        precautions = []

        # 1. Mask guidance
        if effective_score < 60:
            precautions.append({
                "category": "Respiratory Barrier & Masking",
                "title": "Certified N95 / FFP2 Respirator Mandate",
                "recommendation": (
                    "Cloth masks and simple surgical masks provide near-zero filtration against microscopic PM2.5 particulates. "
                    "Wear an airtight, certified N95 or FFP2 respirator with an adjustable metal nose clip whenever outdoors."
                ),
                "urgency": "High" if effective_score < 40 else "Moderate",
                "faq_anchor": "protection-masks",
            })
        else:
            precautions.append({
                "category": "Respiratory Barrier & Masking",
                "title": "Optional Protection for High-Traffic Corridors",
                "recommendation": "Air quality is currently acceptable. Masks are optional, but recommended if walking along heavy vehicular transit corridors.",
                "urgency": "Low",
                "faq_anchor": "protection-masks",
            })

        # 2. Indoor environment & HEPA air purifiers
        if effective_score < 50:
            precautions.append({
                "category": "Indoor Clean Air Sanctuary",
                "title": "Seal Windows & Run True HEPA (H13) Filtration",
                "recommendation": (
                    "Close external windows during calm morning and evening inversion hours (6:00 AM – 10:00 AM and 7:00 PM – 11:00 PM). "
                    "Run a certified True HEPA (H13) air purifier sized appropriately to your room's Clean Air Delivery Rate (CADR)."
                ),
                "urgency": "High",
                "faq_anchor": "protection-masks",
            })

        # 3. Clinical medication & condition-specific precautions
        if "Respiratory Vulnerability" in active_tags:
            precautions.append({
                "category": "Clinical Condition Care",
                "title": "Asthma / COPD Action Plan & Inhaler Readiness",
                "recommendation": (
                    "Carry prescribed rescue bronchodilators (e.g. Salbutamol) at all times. "
                    "Track daily Peak Expiratory Flow (PEF). If morning chest tightness or persistent coughing occurs, "
                    "consult your pulmonologist immediately."
                ),
                "urgency": "High" if effective_score < 60 else "Moderate",
                "faq_anchor": "health-sensitive-profiles",
            })

        if "Cardiovascular Sensitivity" in active_tags:
            precautions.append({
                "category": "Cardiovascular Protection",
                "title": "Avoid Early Morning Cold & Strenuous Exertion",
                "recommendation": (
                    "Inhaling sub-micron particulates causes systemic inflammation, autonomic nervous stimulation, and vasoconstriction. "
                    "Strictly avoid rapid physical exertion in cold smog, which elevates arterial pressure and myocardial workload."
                ),
                "urgency": "High",
                "faq_anchor": "health-sensitive-profiles",
            })

        if "Expectant Mother" in active_tags:
            precautions.append({
                "category": "Maternal & Fetal Protection",
                "title": "Strict Particulate Avoidance During Pregnancy",
                "recommendation": (
                    "Ultra-fine particulate matter (< 0.1 µm) can translocate across the alveolar-capillary barrier into maternal circulation. "
                    "Prioritize clean indoor air rooms and avoid road transit during high smog hours."
                ),
                "urgency": "High",
                "faq_anchor": "health-sensitive-profiles",
            })

        # 4. Activity Timing & Outdoor Exercise
        if effective_score < 40:
            precautions.append({
                "category": "Exercise & Activity Scheduling",
                "title": "Shift All Cardiovascular Workouts Indoors",
                "recommendation": (
                    "Deep aerobic breathing during running or cycling increases particulate intake by 4–8x and bypasses nasal filtration. "
                    "Shift all workouts indoors to a filtered room until daytime solar radiation disperses the surface inversion layer."
                ),
                "urgency": "High",
                "faq_anchor": "health-sensitive-profiles",
            })

        return {
            "health_tags": active_tags,
            "precautions_count": len(precautions),
            "precautions": precautions,
            "faq_link": "/faq",
            "faq_guidance_notice": (
                "Personalized health precautions are synthesized from WHO 2021 Clinical Guidelines and CPCB Health Advisory Protocols. "
                "For detailed mask standards, HEPA CADR sizing, and exercise thresholds, consult our FAQ."
            ),
        }
