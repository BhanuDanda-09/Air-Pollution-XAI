"""Explanation service computing local SHAP attributions across ML/DL models."""

from typing import Any, Dict, List
import numpy as np
import pandas as pd
from backend.config import Config
from backend.models.model_loader import get_model_loader


class ExplanationService:
    """Computes and formats local SHAP attributions."""

    @classmethod
    def explain_instance(cls, model_key: str, features: Dict[str, float]) -> Dict[str, Any]:
        """Compute SHAP feature attributions for a single observation.

        Args:
            model_key: 'random_forest', 'xgboost', or 'mlp'.
            features: Validated meteorological features.

        Returns:
            Dictionary with base_value, predicted_value, attributions, and sorted importance.
        """
        loader = get_model_loader()
        df = pd.DataFrame([features], columns=Config.FEATURE_ORDER)

        if model_key == "random_forest":
            explainer = loader.rf_explainer
            base_value = float(np.ravel(explainer.expected_value)[0])
            exp_result = explainer(df)
            shap_array = np.ravel(exp_result.values[0])
            predicted_value = float(loader.rf_model.predict(df)[0])
            explainer_type = "TreeExplainer"

        elif model_key == "xgboost":
            explainer = loader.xgb_explainer
            base_value = float(np.ravel(explainer.expected_value)[0])
            exp_result = explainer(df)
            shap_array = np.ravel(exp_result.values[0])
            predicted_value = float(loader.xgb_model.predict(df)[0])
            explainer_type = "TreeExplainer"

        elif model_key == "mlp":
            scaler = loader.mlp_scaler
            scaled = scaler.transform(df)
            explainer = loader.mlp_explainer
            base_value = float(np.ravel(explainer.expected_value)[0])
            shap_matrix = explainer.shap_values(scaled)
            shap_array = np.ravel(shap_matrix[0])
            predicted_value = float(loader.mlp_model.predict(scaled, verbose=0).flatten()[0])
            explainer_type = "KernelExplainer"

        else:
            raise ValueError(f"Unsupported model key for explanation: {model_key}")

        attributions: List[Dict[str, Any]] = []
        for idx, feat in enumerate(Config.FEATURE_ORDER):
            spec = Config.FEATURE_SPECS[feat]
            val = float(features[feat])
            sv = float(shap_array[idx])
            direction = "positive" if sv >= 0 else "negative"
            verb = "Increases" if sv >= 0 else "Decreases"
            attributions.append(
                {
                    "feature": feat,
                    "name": spec["name"],
                    "value": round(val, 2),
                    "unit": spec["unit"],
                    "shap_value": round(sv, 4),
                    "abs_shap_value": round(abs(sv), 4),
                    "direction": direction,
                    "impact": f"{verb} predicted PM2.5 by {abs(sv):.2f} µg/m³",
                }
            )

        sorted_importance = sorted(attributions, key=lambda x: x["abs_shap_value"], reverse=True)
        benchmark = Config.MODEL_BENCHMARKS.get(model_key, {})

        source_attribution = cls.attribute_sources(features)

        return {
            "model_key": model_key,
            "model_name": benchmark.get("display_name", model_key),
            "explainer_type": explainer_type,
            "base_value": round(base_value, 2),
            "predicted_value": max(0.0, round(predicted_value, 2)),
            "unit": "µg/m³",
            "features": features,
            "attributions": attributions,
            "ranked_importance": sorted_importance,
            "dominant_feature": sorted_importance[0]["name"] if sorted_importance else None,
            "source_attribution": source_attribution,
            "scientific_disclaimer": Config.XAI_DISCLAIMER,
        }

    @classmethod
    def attribute_sources(cls, features: Dict[str, float]) -> Dict[str, Any]:
        """Synthesize heuristic emission source sector attribution based on meteorological conditions.

        Methodology:
        Derives empirical source propensity scores for the 5 major Delhi-NCR airshed source categories
        (Vehicles, Stubble/Biomass, Secondary Aerosols, Industrial Stacks, Road Dust)
        grounded in IIT Kanpur (2015) and TERI (2018) comprehensive source apportionment studies.

        Args:
            features: Dictionary containing 'RH', 'WD', 'SR', 'BP', 'AT'.

        Returns:
            Dictionary with sector percentages, qualitative levels, driving factors, and narrative summary.
        """
        rh = float(features.get("RH", 50.0))
        wd = float(features.get("WD", 180.0))
        sr = float(features.get("SR", 100.0))
        bp = float(features.get("BP", 740.0))
        at = float(features.get("AT", 25.0))

        # 1. Vehicular Emissions & Urban Boundary Trapping
        veh_weight = 30.0
        veh_factors = []
        if at < 20.0:
            shift = (20.0 - at) * 0.9
            veh_weight += shift
            veh_factors.append(f"Low ambient temperature ({at:.1f}°C) suppressing planetary boundary layer height")
        if bp > 740.0:
            shift = (bp - 740.0) * 0.5
            veh_weight += shift
            veh_factors.append(f"High barometric pressure ({bp:.1f} mmHg) causing atmospheric capping")
        if not veh_factors:
            veh_factors.append("Persistent urban baseline vehicular traffic and commute density")

        # 2. Agricultural Stubble & Biomass Burning (NW corridor alignment)
        bio_weight = 15.0
        bio_factors = []
        if 280.0 <= wd <= 345.0:
            bio_weight += 28.0
            bio_factors.append(f"Direct North-Westerly transport corridor alignment (WD: {wd:.0f}° from Punjab/Haryana fires)")
        elif 240.0 <= wd < 280.0 or 345.0 < wd <= 360.0:
            bio_weight += 12.0
            bio_factors.append(f"Peripheral trajectory alignment with regional upwind agricultural zones (WD: {wd:.0f}°)")
        else:
            bio_factors.append(f"Current wind vector ({wd:.0f}°) disfavors cross-border agricultural smoke influx")
        if at < 25.0:
            bio_weight += 6.0
            bio_factors.append("Autumn/winter seasonal window matching post-harvest burning cycles")

        # 3. Secondary Inorganic Aerosols (SIA: Sulfate, Nitrate, Ammonium)
        sia_weight = 18.0
        sia_factors = []
        if rh > 65.0:
            shift = (rh - 65.0) * 0.8
            sia_weight += shift
            sia_factors.append(f"Elevated relative humidity ({rh:.1f}%) accelerating heterogeneous aqueous gas-to-particle conversion")
        elif rh > 50.0:
            sia_weight += 5.0
            sia_factors.append(f"Moderate moisture ({rh:.1f}%) enabling continuous photochemical aerosol nucleation")
        else:
            sia_factors.append(f"Low ambient moisture ({rh:.1f}%) limits secondary gas condensation")
        if sr > 150.0:
            sia_weight += 5.0
            sia_factors.append(f"Active solar irradiance ({sr:.0f} W/m²) driving photochemical precursor oxidation")

        # 4. Industrial Stacks & Power Plants (East/SE corridor alignment)
        ind_weight = 14.0
        ind_factors = []
        if 80.0 <= wd <= 160.0:
            ind_weight += 22.0
            ind_factors.append(f"Downwind of major industrial corridors (East/South-East, WD: {wd:.0f}°)")
        else:
            ind_factors.append(f"Cross-wind orientation ({wd:.0f}°) reducing direct industrial cluster exposure")
        if bp > 740.0:
            ind_weight += 4.0
            ind_factors.append("Stagnant barometric conditions preventing vertical stack dispersion")

        # 5. Road Dust & Construction Minerals (Aridity & Westerly Corridor)
        dust_weight = 12.0
        dust_factors = []
        if rh < 45.0:
            shift = (45.0 - rh) * 0.8
            dust_weight += shift
            dust_factors.append(f"Dry ambient air ({rh:.1f}% RH) maximizes mechanical surface dust suspension")
        else:
            dust_factors.append(f"Moisture presence ({rh:.1f}% RH) suppresses mechanical particle resuspension")
        if at > 28.0:
            dust_weight += (at - 28.0) * 0.6
            dust_factors.append(f"High ground surface heating ({at:.1f}°C) promoting convective thermal turbulence")
        if 230.0 <= wd <= 280.0:
            dust_weight += 10.0
            dust_factors.append("Westerly trajectory tapping Thar desert crustal dust pathways")

        total_weight = veh_weight + bio_weight + sia_weight + ind_weight + dust_weight

        sectors_raw = [
            {
                "id": "vehicles",
                "name": "Vehicular Exhaust & Urban Traffic",
                "weight": veh_weight,
                "driving_factors": veh_factors,
                "color": "#ef4444",
            },
            {
                "id": "biomass",
                "name": "Agricultural Stubble & Biomass Burning",
                "weight": bio_weight,
                "driving_factors": bio_factors,
                "color": "#f97316",
            },
            {
                "id": "secondary_aerosols",
                "name": "Secondary Inorganic Aerosols (SIA)",
                "weight": sia_weight,
                "driving_factors": sia_factors,
                "color": "#8b5cf6",
            },
            {
                "id": "industrial",
                "name": "Industrial Stacks & Point Sources",
                "weight": ind_weight,
                "driving_factors": ind_factors,
                "color": "#0ea5e9",
            },
            {
                "id": "dust",
                "name": "Road Dust & Construction Minerals",
                "weight": dust_weight,
                "driving_factors": dust_factors,
                "color": "#eab308",
            },
        ]

        sectors = []
        for s in sectors_raw:
            pct = round((s["weight"] / total_weight) * 100.0, 1)
            level = "High" if pct >= 28.0 else ("Moderate" if pct >= 18.0 else "Low")
            sectors.append({
                "id": s["id"],
                "name": s["name"],
                "percentage": pct,
                "contribution_level": level,
                "driving_factors": s["driving_factors"],
                "color": s["color"],
            })

        sectors = sorted(sectors, key=lambda x: x["percentage"], reverse=True)
        primary = sectors[0]
        secondary = sectors[1]

        narrative = (
            f"Current surface meteorology designates {primary['name']} as the primary contributing sector "
            f"({primary['percentage']}%), followed by {secondary['name']} ({secondary['percentage']}%). "
            f"{primary['driving_factors'][0]}."
        )

        return {
            "primary_source": primary["name"],
            "primary_percentage": primary["percentage"],
            "secondary_source": secondary["name"],
            "secondary_percentage": secondary["percentage"],
            "sectors": sectors,
            "narrative_summary": narrative,
            "scientific_methodology": (
                "Empirical heuristic decomposition based on IIT Kanpur (2015) and TERI (2018) Delhi-NCR "
                "airshed source apportionment profiles combined with real-time meteorological trajectory heuristics."
            ),
        }
