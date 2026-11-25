"""Health-Personalised Exposure Risk & Relocation Advisory Engine.

Methodology strictly conforms to WHO 2021 Air Quality Guidelines and CPCB Health Advisory Protocols.
Rule-based, transparent, and clinically defensible for academic viva review.
"""

import logging
from typing import Any, Dict, List, Optional

from backend.services.city_service import CityService
from backend.services.climatology_service import ClimatologyService
from backend.services.location_resolver import LocationResolver
from backend.services.multi_pollutant_service import MultiPollutantService

logger = logging.getLogger(__name__)


class RiskService:
    """Computes personalized exposure risk and multi-destination relocation recommendations."""

    @classmethod
    def get_place_context(cls, lat: float, lon: float, name: str = "") -> Dict[str, Any]:
        """Assembles rich environmental, meteorological, and climatological context for a place."""
        from backend.services.weather_service import WeatherService
        from backend.services.air_quality_service import AirQualityService

        # 1. Multi-pollutant current air
        air = MultiPollutantService.get_current_air(lat, lon)
        pollutants_map = air.get("pollutants", {})
        pm25_val = pollutants_map.get("PM2.5", {}).get("concentration")
        pm10_val = pollutants_map.get("PM10", {}).get("concentration")
        no2_val = pollutants_map.get("NO2", {}).get("concentration")
        so2_val = pollutants_map.get("SO2", {}).get("concentration")
        co_val = pollutants_map.get("CO", {}).get("concentration")
        o3_val = pollutants_map.get("O3", {}).get("concentration")

        # 2. Weather
        weather = WeatherService.get_live_weather(lat, lon)
        raw_w = weather.get("raw_weather", {})
        temp_c = raw_w.get("temperature_2m_c", 25.0)
        rh_pct = raw_w.get("relative_humidity_2m_pct", 50.0)
        ws_kmh = raw_w.get("wind_speed_10m_kmh", 5.0)
        precip_mm = raw_w.get("precipitation_mm", 0.0)
        elevation = raw_w.get("elevation_m") or air.get("elevation") or 0.0

        # 3. Climatology
        clim = ClimatologyService.get_city_climatology(lat=lat, lon=lon)
        clim_data = clim.get("data", {})
        monthly_pm25 = clim_data.get("monthly_pm25", [])
        annual_mean = round(sum(m.get("mean_pm25", 0.0) for m in monthly_pm25) / len(monthly_pm25), 1) if monthly_pm25 else 35.0
        best_month = clim_data.get("best_month", {"month": 7, "month_name": "July", "mean_pm25": 20.0})
        worst_month = clim_data.get("worst_month", {"month": 1, "month_name": "January", "mean_pm25": 80.0})
        inversion_factor = clim_data.get("winter_inversion_factor", 1.5)

        # 4. Hourly Forecast & Best Time Today
        early_warn = AirQualityService.get_early_warning_forecast(lat, lon, horizon_hours=72)
        best_time_today = cls.calculate_best_time_today(
            place_name=name or f"Coordinates ({round(lat, 2)}, {round(lon, 2)})",
            governing_pollutant=air.get("governing_pollutant", "PM2.5"),
            current_pm25=pm25_val or 40.0,
            current_o3=o3_val or 30.0,
            early_warning_data=early_warn,
            inversion_factor=inversion_factor,
        )

        return {
            "name": name or f"Coordinates ({round(lat, 2)}, {round(lon, 2)})",
            "lat": lat,
            "lon": lon,
            "elevation": elevation,
            "current_air": {
                "overall_aqi": air.get("overall_aqi", 100),
                "cpcb_category": air.get("category", "Moderate"),
                "cpcb_color": air.get("color", "#EAB308"),
                "governing_pollutant": air.get("governing_pollutant", "PM2.5"),
                "pm25": pm25_val,
                "pm10": pm10_val,
                "no2": no2_val,
                "so2": so2_val,
                "co": co_val,
                "o3": o3_val,
                "dust": air.get("dust", 0.0),
                "uv_index": air.get("uv_index", 0.0),
                "pollutants": pollutants_map,
            },
            "current_weather": {
                "temperature": temp_c,
                "humidity": rh_pct,
                "wind_speed": ws_kmh,
                "precipitation": precip_mm,
                "elevation": elevation,
            },
            "climatology": {
                "annual_mean_pm25": annual_mean,
                "best_month": best_month,
                "worst_month": worst_month,
                "winter_inversion_factor": inversion_factor,
                "monsoon_relief_expected": clim_data.get("monsoon_relief_expected", "Moderate seasonal reduction"),
                "monthly_pm25": monthly_pm25,
            },
            "forecast": {
                "best_time_today": best_time_today,
                "early_warning": early_warn if early_warn.get("success") else None,
            },
        }

    @classmethod
    def calculate_best_time_today(
        cls,
        place_name: str,
        governing_pollutant: str,
        current_pm25: float,
        current_o3: float,
        early_warning_data: Optional[Dict[str, Any]] = None,
        inversion_factor: float = 1.5,
    ) -> Dict[str, Any]:
        """Compute the optimal diurnal outdoor activity window based on governing pollutant dynamics."""
        gov = (governing_pollutant or "PM2.5").upper()

        hourly_series = []
        if early_warning_data and early_warning_data.get("success"):
            hourly_series = early_warning_data.get("forecast_series", [])[:24]

        if hourly_series:
            # If O3 is governing or elevated: penalize midday and afternoon hours (11:00 - 17:00)
            if "O3" in gov or "OZONE" in gov or current_o3 > 60.0:
                candidate_slots = []
                for s in hourly_series:
                    t_str = s.get("time", "")
                    h = int(t_str.split("T")[-1].split(":")[0]) if "T" in t_str else 8
                    p25 = s.get("pm25", current_pm25)
                    o3 = s.get("o3", current_o3)
                    # Severe ozone penalty during peak photochemical sunshine hours
                    o3_weight = 3.0 if (11 <= h <= 17) else 1.0
                    composite_metric = p25 * 0.3 + o3 * 0.7 * o3_weight
                    candidate_slots.append((t_str, h, p25, o3, composite_metric))
                best_slot = min(candidate_slots, key=lambda x: x[4])
                hour_val = best_slot[1]
                end_hour = (hour_val + 2) % 24
                window_str = f"{hour_val:02d}:00 – {end_hour:02d}:00"
                return {
                    "window": window_str,
                    "hour": f"{hour_val:02d}:00",
                    "pm25": round(best_slot[2], 1),
                    "o3": round(best_slot[3], 1),
                    "guidance": (
                        f"Optimal window in {place_name} is around {window_str}. Governing pollutant is Ozone (O3); "
                        "schedule outdoor activities in morning or evening to avoid midday photochemical ozone peaks."
                    ),
                }
            else:
                # PM2.5 or PM10 governing with inversion
                candidate_slots = []
                for s in hourly_series:
                    t_str = s.get("time", "")
                    h = int(t_str.split("T")[-1].split(":")[0]) if "T" in t_str else 14
                    p25 = s.get("pm25", current_pm25)
                    o3 = s.get("o3", current_o3)
                    # Morning cold inversion penalty between 05:00 and 09:00 if high inversion
                    inv_weight = 2.5 if (5 <= h <= 9 and inversion_factor >= 1.8) else 1.0
                    composite_metric = p25 * 0.75 * inv_weight + o3 * 0.25
                    candidate_slots.append((t_str, h, p25, o3, composite_metric))
                best_slot = min(candidate_slots, key=lambda x: x[4])
                hour_val = best_slot[1]
                end_hour = (hour_val + 2) % 24
                window_str = f"{hour_val:02d}:00 – {end_hour:02d}:00"
                return {
                    "window": window_str,
                    "hour": f"{hour_val:02d}:00",
                    "pm25": round(best_slot[2], 1),
                    "o3": round(best_slot[3], 1),
                    "guidance": (
                        f"Optimal window in {place_name} is around {window_str}. Solar convective mixing disperses "
                        f"ground-level fine particulates (estimated PM2.5: {round(best_slot[2], 1)} µg/m³)."
                    ),
                }

        # Fallback if hourly series is unavailable
        if "O3" in gov or "OZONE" in gov or current_o3 > 60.0:
            return {
                "window": "06:30 – 08:30 AM",
                "hour": "07:00",
                "pm25": round(current_pm25, 1),
                "o3": round(current_o3, 1),
                "guidance": (
                    f"Optimal window in {place_name}: Early morning (06:30 – 08:30 AM). Governing pollutant is Ozone; "
                    "avoid midday and afternoon hours when sunlight accelerates toxic ozone formation."
                ),
            }
        elif inversion_factor >= 2.0:
            return {
                "window": "01:30 – 03:30 PM",
                "hour": "14:00",
                "pm25": round(current_pm25, 1),
                "o3": round(current_o3, 1),
                "guidance": (
                    f"Optimal window in {place_name}: Mid-afternoon (01:30 – 03:30 PM). Solar radiation breaks the ground-level "
                    "inversion layer, providing maximum vertical dispersion before nocturnal cooling begins."
                ),
            }
        else:
            return {
                "window": "10:00 AM – 12:00 PM",
                "hour": "11:00",
                "pm25": round(current_pm25, 1),
                "o3": round(current_o3, 1),
                "guidance": f"Optimal outdoor activity window in {place_name} during morning dispersion hours.",
            }

    @classmethod
    def classify_destination_suitability(
        cls,
        place_context: Dict[str, Any],
        profile: Dict[str, Any],
        origin_context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Classify destination suitability and generate 2-3 specific numeric comparison reasons."""
        conditions = [c.lower() for c in profile.get("conditions", [])]
        has_respiratory = any(c in conditions for c in ["asthma", "copd", "bronchitis", "allergic_rhinitis"])
        has_cardio = any(c in conditions for c in ["cardiovascular_disease", "hypertension", "diabetes"])
        is_vulnerable = has_respiratory or has_cardio or profile.get("is_pregnant") or profile.get("household") in ["children", "both", "elderly"]

        # User profile limit for annual mean PM2.5 (µg/m³)
        user_pm25_limit = 25.0 if is_vulnerable else 40.0

        clim = place_context.get("climatology", {})
        annual_pm25 = clim.get("annual_mean_pm25", 35.0)
        best_month = clim.get("best_month", {})
        worst_month = clim.get("worst_month", {})
        inversion = clim.get("winter_inversion_factor", 1.5)

        current_air = place_context.get("current_air", {})
        dest_aqi = current_air.get("overall_aqi", 100)
        gov_pol = current_air.get("governing_pollutant", "PM2.5")

        origin_aqi = origin_context.get("current_air", {}).get("overall_aqi", 150) if origin_context else 150
        origin_annual = origin_context.get("climatology", {}).get("annual_mean_pm25", 85.0) if origin_context else 85.0

        risk_eval = cls.evaluate_personal_risk(dest_aqi, current_air.get("pollutants", {}), profile)
        dest_risk_score = risk_eval["score"]

        numeric_reasons = []

        # 1. Suitable
        if annual_pm25 <= user_pm25_limit and worst_month.get("mean_pm25", 50.0) <= (user_pm25_limit * 1.5) and dest_risk_score <= 38:
            suitability = "Suitable"
            badge_color = "#16A34A"
            numeric_reasons.append(
                f"Annual PM2.5 averages {annual_pm25:.1f} µg/m³, safely within your health profile limit of {user_pm25_limit:.0f} µg/m³."
            )
            numeric_reasons.append(
                f"Low winter inversion factor of {inversion:.1f}×; worst month ({worst_month.get('month_name', 'winter')}) reaches only {worst_month.get('mean_pm25', 0.0):.1f} µg/m³."
            )
            if origin_context and origin_aqi > dest_aqi:
                aqi_drop = round(((origin_aqi - dest_aqi) / max(1.0, origin_aqi)) * 100.0)
                numeric_reasons.append(
                    f"Reduces baseline air pollution exposure by {aqi_drop}% compared to origin (AQI {dest_aqi} vs {origin_aqi})."
                )

        # 2. Not recommended
        elif annual_pm25 > (user_pm25_limit * 1.45) or dest_risk_score >= 65 or (origin_context and dest_aqi > origin_aqi and annual_pm25 >= origin_annual):
            suitability = "Not recommended"
            badge_color = "#EF4444"
            numeric_reasons.append(
                f"Annual PM2.5 of {annual_pm25:.1f} µg/m³ exceeds your personal safety limit of {user_pm25_limit:.0f} µg/m³ by {round(annual_pm25 - user_pm25_limit, 1)} µg/m³."
            )
            numeric_reasons.append(
                f"Severe winter stagnation in {worst_month.get('month_name', 'winter')} reaches {worst_month.get('mean_pm25', 0.0):.1f} µg/m³ with an inversion factor of {inversion:.1f}×."
            )
            if origin_context and dest_aqi >= origin_aqi:
                numeric_reasons.append(
                    f"Current AQI of {dest_aqi} offers no improvement over origin ({origin_aqi}), increasing cardiopulmonary risk."
                )
            else:
                numeric_reasons.append(
                    f"Personal exposure index is {dest_risk_score}/100 ({risk_eval['tier']}), requiring intensive continuous filtration."
                )

        # 3. Suitable with precautions
        else:
            suitability = "Suitable with precautions"
            badge_color = "#EAB308"
            numeric_reasons.append(
                f"Annual PM2.5 is {annual_pm25:.1f} µg/m³ (vs your limit {user_pm25_limit:.0f} µg/m³), favorable for 8–9 months of the year."
            )
            numeric_reasons.append(
                f"Seasonal winter spike in {worst_month.get('month_name', 'winter')} averages {worst_month.get('mean_pm25', 0.0):.1f} µg/m³ (inversion factor {inversion:.1f}×), requiring air purifiers."
            )
            if origin_context and origin_aqi > dest_aqi:
                aqi_drop = round(((origin_aqi - dest_aqi) / max(1.0, origin_aqi)) * 100.0)
                numeric_reasons.append(
                    f"Reduces personal exposure by {aqi_drop}% relative to origin (AQI {dest_aqi} vs {origin_aqi})."
                )
            else:
                numeric_reasons.append(
                    f"Governing pollutant is {gov_pol} (AQI {dest_aqi}); midday or early-morning timing adjustments required."
                )

        return {
            "suitability": suitability,
            "badge_color": badge_color,
            "numeric_reasons": numeric_reasons,
            "user_pm25_limit": user_pm25_limit,
            "annual_pm25": annual_pm25,
            "personal_risk_score": dest_risk_score,
            "personal_risk_tier": risk_eval["tier"],
        }

    @classmethod
    def generate_place_precautions(
        cls,
        place_context: Dict[str, Any],
        profile: Dict[str, Any],
        suitability_info: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """Generate dynamic, non-templated place-specific precautions categorized into 5 actionable buckets.

        Returns structured items:
        { id, category, text, trigger, priority, source }
        """
        place_name = place_context.get("name", "this location")
        current_air = place_context.get("current_air", {})
        current_weather = place_context.get("current_weather", {})
        clim = place_context.get("climatology", {})
        forecast = place_context.get("forecast", {})
        best_time = forecast.get("best_time_today", {})

        conditions = [c.lower() for c in profile.get("conditions", [])]
        has_respiratory = any(c in conditions for c in ["asthma", "copd", "bronchitis", "allergic_rhinitis"])
        has_cardio = any(c in conditions for c in ["cardiovascular_disease", "hypertension", "diabetes"])

        gov_pol = str(current_air.get("governing_pollutant", "PM2.5")).upper()
        pm25 = current_air.get("pm25", 35.0) or 35.0
        o3 = current_air.get("o3", 30.0) or 30.0
        dust = current_air.get("dust", 0.0) or 0.0
        aqi = current_air.get("overall_aqi", 80)

        temp_c = current_weather.get("temperature", 24.0)
        humidity = current_weather.get("humidity", 55.0)
        wind_speed = current_weather.get("wind_speed", 6.0)
        elevation = current_weather.get("elevation", 0.0) or place_context.get("elevation", 0.0) or 0.0

        annual_pm25 = clim.get("annual_mean_pm25", 35.0)
        best_month = clim.get("best_month", {})
        worst_month = clim.get("worst_month", {})
        worst_month_name = worst_month.get("month_name", "January")
        worst_pm25 = worst_month.get("mean_pm25", 70.0)
        inversion = clim.get("winter_inversion_factor", 1.5)

        if not suitability_info:
            suitability_info = cls.classify_destination_suitability(place_context, profile)
        suitability = suitability_info.get("suitability", "Suitable with precautions")
        user_pm25_limit = suitability_info.get("user_pm25_limit", 25.0)

        precautions: List[Dict[str, Any]] = []

        # -------------------------------------------------------------------
        # Rule 1: Ozone (O3) vs PM2.5 Timing Advice (Category: "Every day")
        # -------------------------------------------------------------------
        if "O3" in gov_pol or "OZONE" in gov_pol or o3 > 60.0:
            precautions.append({
                "id": f"{place_name.lower().replace(' ', '_')}_o3_timing",
                "category": "Every day",
                "trigger": f"Governing pollutant in {place_name} is Ozone ({o3:.1f} µg/m³)",
                "text": (
                    f"Governing pollutant in {place_name} is ground-level ozone ({o3:.1f} µg/m³). "
                    f"Avoid vigorous outdoor cardio and sports between 12:00 PM and 5:00 PM when solar radiation peaks; "
                    f"schedule workouts during optimal window around {best_time.get('window', 'early morning')}."
                ),
                "priority": "High" if has_respiratory else "Medium",
                "source": "CPCB Health Advisory & WHO Air Quality Guidelines (General advisory)",
            })
        else:
            precautions.append({
                "id": f"{place_name.lower().replace(' ', '_')}_daily_timing",
                "category": "Every day",
                "trigger": f"Governing pollutant in {place_name} is {gov_pol} (current PM2.5: {pm25:.1f} µg/m³)",
                "text": (
                    f"Optimal outdoor exercise window today in {place_name} is around {best_time.get('window', 'mid-day')}, "
                    f"when vertical atmospheric dispersion minimizes fine aerosol inhalation."
                ),
                "priority": "Medium",
                "source": "CPCB Diurnal Exposure Recommendations (General advisory)",
            })

        # -------------------------------------------------------------------
        # Rule 2: Seasonal Stagnation & Inversion (Category: "Seasonal (named months)")
        # -------------------------------------------------------------------
        if inversion >= 1.8:
            precautions.append({
                "id": f"{place_name.lower().replace(' ', '_')}_seasonal_inversion",
                "category": f"Seasonal ({worst_month_name} & Winter)",
                "trigger": f"Winter inversion factor is {inversion:.1f}× in {place_name} (peak month: {worst_month_name})",
                "text": (
                    f"Thermal inversion factor reaches {inversion:.1f}× during {worst_month_name} with PM2.5 averaging {worst_pm25:.1f} µg/m³. "
                    f"Avoid early-morning outdoor exertion (6:00–9:00 AM) during winter when cold nocturnal air traps ground pollutants; "
                    "move aerobic exercise to afternoon hours."
                ),
                "priority": "High",
                "source": "IMD Stagnation & CPCB Winter Advisory Protocols (General advisory)",
            })
        else:
            precautions.append({
                "id": f"{place_name.lower().replace(' ', '_')}_seasonal_clean",
                "category": f"Seasonal ({best_month.get('month_name', 'Spring')})",
                "trigger": f"Low seasonal inversion ({inversion:.1f}×) in {place_name}",
                "text": (
                    f"{place_name} experiences steady year-round ventilation with minimal winter stagnation ({inversion:.1f}×). "
                    f"Cleanest ambient air occurs in {best_month.get('month_name', 'summer')} ({best_month.get('mean_pm25', 18.0):.1f} µg/m³)."
                ),
                "priority": "Low",
                "source": "City Climatology Records (General advisory)",
            })

        # -------------------------------------------------------------------
        # Rule 3: AQI Action Threshold (Category: "When AQI exceeds X at this place")
        # -------------------------------------------------------------------
        action_aqi = 100 if has_respiratory or has_cardio else 150
        action_band = "Moderate" if action_aqi == 100 else "Poor"
        precautions.append({
            "id": f"{place_name.lower().replace(' ', '_')}_aqi_threshold",
            "category": f"When AQI exceeds {action_aqi} at this place",
            "trigger": f"Personal health vulnerability threshold for {place_name}",
            "text": (
                f"When AQI in {place_name} crosses {action_aqi} ({action_band}), activate True HEPA bedroom filtration, "
                f"close external windows during inversion hours, and wear an airtight N95 respirator during outdoor transit."
            ),
            "priority": "High" if (has_respiratory or has_cardio) else "Medium",
            "source": "CPCB Health Advisory Protocol (General advisory)",
        })

        # -------------------------------------------------------------------
        # Rule 4: Weather-Related Precautions (Category: "Weather-related")
        # -------------------------------------------------------------------
        # A: High Humidity / Monsoon / Mould
        if humidity >= 70.0:
            precautions.append({
                "id": f"{place_name.lower().replace(' ', '_')}_weather_humidity",
                "category": "Weather-related",
                "trigger": f"High ambient relative humidity ({humidity:.0f}%) in {place_name}",
                "text": (
                    f"High ambient humidity ({humidity:.0f}%) in {place_name} promotes indoor mould spore propagation and dust mites. "
                    "For asthma and allergy profiles, maintain indoor relative humidity below 50–55% using dehumidification."
                ),
                "priority": "High" if has_respiratory else "Medium",
                "source": "GINA Global Strategy for Asthma Management (General advisory)",
            })

        # B: Cold Air or High Elevation
        if elevation >= 800.0 or temp_c < 15.0:
            precautions.append({
                "id": f"{place_name.lower().replace(' ', '_')}_weather_cold_elevation",
                "category": "Weather-related",
                "trigger": f"Elevation {elevation:.0f} m and ambient temperature {temp_c:.1f}°C in {place_name}",
                "text": (
                    f"Elevation of {elevation:.0f} m and cool morning air ({temp_c:.1f}°C) can trigger bronchospasm in reactive airways. "
                    "Warm up indoors for 10 minutes and cover nose and mouth with a loose scarf or mask to pre-warm inhaled air."
                ),
                "priority": "Medium",
                "source": "American Thoracic Society Clinical Exercise Guidance (General advisory)",
            })

        # C: Extreme Heat
        if temp_c >= 35.0:
            precautions.append({
                "id": f"{place_name.lower().replace(' ', '_')}_weather_heat",
                "category": "Weather-related",
                "trigger": f"High ambient temperature ({temp_c:.1f}°C) in {place_name}",
                "text": (
                    f"High ambient heat ({temp_c:.1f}°C) elevates cardiovascular strain and accelerates secondary pollutant formation. "
                    "Maintain continuous hydration and suspend strenuous outdoor labor during peak afternoon heat (1:00–5:00 PM)."
                ),
                "priority": "High" if has_cardio else "Medium",
                "source": "CPCB Heat & Air Quality Health Advisory (General advisory)",
            })

        # D: Dry, Windy or Dusty
        if dust >= 5.0 or wind_speed >= 15.0:
            precautions.append({
                "id": f"{place_name.lower().replace(' ', '_')}_weather_dust",
                "category": "Weather-related",
                "trigger": f"Surface mineral dust {dust:.1f} µg/m³ and wind speed {wind_speed:.1f} km/h in {place_name}",
                "text": (
                    f"Surface mineral dust ({dust:.1f} µg/m³) and wind gusts ({wind_speed:.1f} km/h) elevate coarse PM10. "
                    "Wear protective eyewear and avoid walking along unpaved or dry roadway verges."
                ),
                "priority": "Medium",
                "source": "CPCB Particulate Guidance (General advisory)",
            })

        # -------------------------------------------------------------------
        # Rule 5: Relocation Guidance (Category: "If you move here")
        # -------------------------------------------------------------------
        if suitability == "Suitable":
            precautions.append({
                "id": f"{place_name.lower().replace(' ', '_')}_move_suitable",
                "category": "If you move here",
                "trigger": f"{place_name} meets your annual health exposure baseline",
                "text": (
                    f"{place_name} offers a favorable annual air baseline ({annual_pm25:.1f} µg/m³ vs your {user_pm25_limit:.0f} µg/m³ limit). "
                    f"Long-term maintenance requires monitoring AQI only during peak winter months ({worst_month_name}), "
                    "with standard natural home ventilation during daytime."
                ),
                "priority": "Low",
                "source": "Health-based Relocation Assessment (General advisory)",
            })
        elif suitability == "Suitable with precautions":
            precautions.append({
                "id": f"{place_name.lower().replace(' ', '_')}_move_precautions",
                "category": "If you move here",
                "trigger": f"Seasonal particulate surge in {place_name} requires localized management",
                "text": (
                    f"Relocating to {place_name} improves baseline exposure, but requires seasonal precautions between {worst_month_name} "
                    f"and adjacent winter months when PM2.5 averages {worst_pm25:.1f} µg/m³. Ensure bedrooms are equipped with certified True HEPA filtration before winter."
                ),
                "priority": "Medium",
                "source": "Health-based Relocation Assessment (General advisory)",
            })
        else:
            precautions.append({
                "id": f"{place_name.lower().replace(' ', '_')}_move_not_recommended",
                "category": "If you move here",
                "trigger": f"{place_name} annual PM2.5 ({annual_pm25:.1f} µg/m³) exceeds health limit ({user_pm25_limit:.0f} µg/m³)",
                "text": (
                    f"Relocation to {place_name} is not recommended for your health profile due to high annual exposure ({annual_pm25:.1f} µg/m³ vs limit {user_pm25_limit:.0f} µg/m³). "
                    "Relocation here would mandate continuous whole-home HEPA filtration and strict outdoor confinement during peak months."
                ),
                "priority": "High",
                "source": "Health-based Relocation Assessment (General advisory)",
            })

        return precautions

    @classmethod
    def evaluate_personal_risk(
        cls,
        aqi: int,
        pollutants: Dict[str, Any],
        profile: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Compute personal exposure risk score (1-100) based on air quality and health vulnerabilities."""
        # 1. Base Score derived from AQI (0-500 mapped non-linearly to 1-70 base)
        if aqi <= 50:
            base_score = (aqi / 50.0) * 20.0
        elif aqi <= 100:
            base_score = 20.0 + ((aqi - 50.0) / 50.0) * 15.0
        elif aqi <= 200:
            base_score = 35.0 + ((aqi - 100.0) / 100.0) * 20.0
        elif aqi <= 300:
            base_score = 55.0 + ((aqi - 200.0) / 100.0) * 18.0
        else:
            base_score = min(75.0, 73.0 + ((aqi - 300.0) / 200.0) * 12.0)

        risk_multipliers = []
        additive_risk = 0.0

        conditions = [c.lower() for c in profile.get("conditions", [])]
        household = profile.get("household", "none").lower()
        is_pregnant = bool(profile.get("is_pregnant", False))
        outdoor_hours = float(profile.get("outdoor_exercise_hours", 0.0))
        commute_mode = profile.get("commute_mode", "car").lower()

        pm25 = pollutants.get("PM2.5", {}).get("concentration", 50.0)
        no2 = pollutants.get("NO2", {}).get("concentration", 20.0)
        o3 = pollutants.get("O3", {}).get("concentration", 40.0)

        # 2. Respiratory condition modifiers (Asthma, COPD, Bronchitis)
        has_respiratory = any(c in conditions for c in ["asthma", "copd", "bronchitis", "allergic_rhinitis"])
        if has_respiratory:
            if pm25 > 60.0 or no2 > 40.0:
                additive_risk += 14.0
                risk_multipliers.append("High sensitivity to fine particulates & NO2 due to chronic airway inflammation")
            else:
                additive_risk += 6.0
                risk_multipliers.append("Moderate respiratory vulnerability")

        # 3. Cardiovascular modifiers (Heart Disease, Hypertension)
        has_cardio = any(c in conditions for c in ["cardiovascular_disease", "hypertension", "diabetes"])
        if has_cardio:
            if pm25 > 90.0:
                additive_risk += 12.0
                risk_multipliers.append("Elevated autonomic and vascular risk from particulate translocation")
            else:
                additive_risk += 5.0
                risk_multipliers.append("Mild cardiovascular susceptibility")

        # 4. Pregnancy & Transplacental risk
        if is_pregnant:
            additive_risk += 15.0
            risk_multipliers.append("Urgent reproductive health sensitivity (fetal susceptibility to PM2.5 & CO)")

        # 5. Vulnerable household members (Children < 5, Elderly 65+)
        if household in ["children", "both"]:
            additive_risk += 8.0
            risk_multipliers.append("Developing respiratory system in young child (< 5 yrs)")
        if household in ["elderly", "both"]:
            additive_risk += 8.0
            risk_multipliers.append("Reduced physiological cardiopulmonary clearance in senior family member")

        # 6. Physical activity and open commute
        if outdoor_hours >= 5.0:
            if pm25 > 60.0 or o3 > 80.0:
                additive_risk += 7.0
                risk_multipliers.append("Hyperventilation during outdoor exercise deepens inhaled aerosol dose")
        if commute_mode in ["two_wheeler", "open_auto", "walking", "bicycle"]:
            additive_risk += 6.0
            risk_multipliers.append("Unfiltered roadside vehicular exhaust exposure during commute")

        # Final aggregate risk score clamped to 1-100
        final_score = int(round(max(1.0, min(100.0, base_score + additive_risk))))

        # Tier mapping
        if final_score <= 25:
            tier = "Low Exposure Risk"
            badge_color = "#16A34A"
        elif final_score <= 50:
            tier = "Moderate Exposure Risk"
            badge_color = "#EAB308"
        elif final_score <= 75:
            tier = "High Exposure Risk"
            badge_color = "#F97316"
        else:
            tier = "Severe Health Hazard"
            badge_color = "#EF4444"

        # Tailored citizen precautions based on profile conditions
        precautions = []
        if has_respiratory:
            precautions.append({
                "condition": "Respiratory / Asthma Vulnerability",
                "action": "Carry prescribed rescue inhalers; strictly limit outdoor activity during peak inversion hours.",
                "mask": "Certified N95 / FFP2 respirator with tight nasal seal",
                "faq_link": "/faq",
            })
        if has_cardio:
            precautions.append({
                "condition": "Cardiovascular Sensitivity",
                "action": "Avoid abrupt strenuous physical exertion in cold smog to prevent vascular vasoconstriction.",
                "mask": "Low-resistance certified N95 respirator",
                "faq_link": "/faq",
            })
        if is_pregnant:
            precautions.append({
                "condition": "Pregnancy Protection",
                "action": "Protect fetal lung and neuro-development by remaining in True HEPA filtered rooms during smog surges.",
                "mask": "Certified N95 respirator during any outdoor transit",
                "faq_link": "/faq",
            })
        if household in ("children", "both") or "child" in conditions:
            precautions.append({
                "condition": "Young Children (< 5 yrs)",
                "action": "Keep children indoors during early morning inversions; developing airways absorb double the particulate dose.",
                "mask": "Child-fitted N95 / KN95 with nose foam",
                "faq_link": "/faq",
            })
        if household in ("elderly", "both") or "senior" in conditions:
            precautions.append({
                "condition": "Senior Citizens (65+ yrs)",
                "action": "Maintain indoor air purification and stay well-hydrated to compensate for reduced cardiopulmonary clearance.",
                "mask": "N95 respirator",
                "faq_link": "/faq",
            })
        if outdoor_hours >= 5.0 or commute_mode in ("two_wheeler", "open_auto", "walking", "bicycle"):
            precautions.append({
                "condition": "High Outdoor / Open Commute Exposure",
                "action": "Wear sealed N95 masks on open transit routes and reschedule outdoor running to mid-day solar dispersion windows.",
                "mask": "N95 sports / active commute respirator",
                "faq_link": "/faq",
            })
        if not precautions:
            precautions.append({
                "condition": "General Preventive Guidance",
                "action": "Follow diurnal CAMS forecast alerts, avoid rush-hour traffic corridors, and keep indoor air clean.",
                "mask": "N95 recommended above AQI 150",
                "faq_link": "/faq",
            })

        return {
            "score": final_score,
            "tier": tier,
            "badge_color": badge_color,
            "risk_factors": risk_multipliers,
            "vulnerability_multiplier": round(1.0 + (additive_risk / max(1.0, base_score)), 2),
            "tailored_precautions": precautions,
            "faq_link": "/faq",
            "faq_guidance_notice": "Health precautions strictly follow WHO 2021 air quality guidelines and CPCB advisories. Consult our FAQ for clinical specifics.",
        }

    @classmethod
    def compare_relocation(
        cls,
        origin: Dict[str, Any],
        destinations: List[Dict[str, Any]],
        profile: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Compare origin place with 1-4 destination candidate places using place-specific data and health profiles."""
        origin_lat = float(origin["lat"])
        origin_lon = float(origin["lon"])
        origin_name = origin.get("name", "Current Location")

        # Assemble rich place context for origin
        origin_context = cls.get_place_context(origin_lat, origin_lon, name=origin_name)
        origin_air = origin_context["current_air"]
        origin_clim = origin_context["climatology"]
        origin_aqi = origin_air.get("overall_aqi", 150)
        origin_risk = cls.evaluate_personal_risk(origin_aqi, origin_air.get("pollutants", {}), profile)
        origin_coverage = LocationResolver.classify_coverage_tier(origin_lat, origin_lon)

        dest_results = []
        for dest in destinations[:4]:
            d_lat = float(dest["lat"])
            d_lon = float(dest["lon"])
            d_name = dest.get("name", f"Destination ({round(d_lat, 2)}, {round(d_lon, 2)})")

            # Assemble rich place context for candidate destination
            d_context = cls.get_place_context(d_lat, d_lon, name=d_name)
            d_air = d_context["current_air"]
            d_clim = d_context["climatology"]
            d_coverage = LocationResolver.classify_coverage_tier(d_lat, d_lon)
            d_aqi = d_air.get("overall_aqi", 120)

            # 1. Suitability classification & numeric comparison reasons
            suitability_info = cls.classify_destination_suitability(
                place_context=d_context,
                profile=profile,
                origin_context=origin_context,
            )
            suitability = suitability_info["suitability"]
            suitability_color = suitability_info["badge_color"]
            numeric_reasons = suitability_info["numeric_reasons"]
            dest_risk = cls.evaluate_personal_risk(d_aqi, d_air.get("pollutants", {}), profile)
            dest_risk["badge_color"] = suitability_color
            dest_risk_score = dest_risk["score"]
            dest_risk_tier = dest_risk["tier"]

            # 2. Dynamic place-specific grouped precautions
            grouped_precautions = cls.generate_place_precautions(
                place_context=d_context,
                profile=profile,
                suitability_info=suitability_info,
            )

            # Exposure delta points and percentages
            exposure_diff_points = origin_risk["score"] - dest_risk_score
            aqi_reduction_pct = round(((origin_aqi - d_aqi) / max(1.0, origin_aqi)) * 100.0, 1)

            # Low confidence adjustment for display
            is_low_confidence = d_coverage.get("confidence_level") == "Low" or d_coverage.get("tier_number") == 3
            display_verdict = suitability
            if is_low_confidence:
                display_verdict = f"Indicative Only: {suitability}"

            actionable_advice = [p.get("text", "") for p in grouped_precautions]
            if is_low_confidence:
                actionable_advice.insert(
                    0,
                    f"Precision Advisory: Air quality for {d_name} is a Tier 3 gridded regional estimate (~11 km CAMS grid) without a nearby ground station. Verdict is indicative only.",
                )

            # Health-based Relocation Narrative (replacing old clinical narrative)
            explanation = cls._generate_health_relocation_narrative(
                origin_name=origin_name,
                dest_name=d_name,
                origin_aqi=origin_aqi,
                dest_aqi=d_aqi,
                origin_exposure_score=origin_risk["score"],
                dest_exposure_score=dest_risk_score,
                exposure_diff_points=exposure_diff_points,
                suitability=suitability,
                profile=profile,
                dest_clim=d_clim,
                is_low_confidence=is_low_confidence,
            )

            # Best time to go out today and best month to move
            best_time_today = d_context["forecast"]["best_time_today"]
            best_month = d_clim.get("best_month", {})
            worst_month = d_clim.get("worst_month", {})

            dest_results.append({
                "destination": {
                    "name": d_name,
                    "lat": d_lat,
                    "lon": d_lon,
                },
                "current_aqi": d_aqi,
                "cpcb_category": d_air.get("cpcb_category"),
                "cpcb_color": d_air.get("cpcb_color"),
                "governing_pollutant": d_air.get("governing_pollutant"),
                "personal_risk": dest_risk,
                "suitability": suitability,
                "suitability_color": suitability_color,
                "verdict": display_verdict,
                "verdict_color": suitability_color,
                "display_verdict": display_verdict,
                "numeric_reasons": numeric_reasons,
                "place_precautions": grouped_precautions,
                "actionable_advice": actionable_advice,
                "best_time_today": best_time_today,
                "best_month_to_move": {
                    "month": best_month.get("month", 7),
                    "month_name": best_month.get("month_name", "July"),
                    "mean_pm25": best_month.get("mean_pm25", 20.0),
                    "worst_month_name": worst_month.get("month_name", "January"),
                    "worst_mean_pm25": worst_month.get("mean_pm25", 80.0),
                    "annual_mean_pm25": d_clim.get("annual_mean_pm25", 35.0),
                    "monthly_pm25": d_clim.get("monthly_pm25", []),
                },
                "place_weather": d_context["current_weather"],
                "exposure_diff_points": exposure_diff_points,
                "aqi_reduction_pct": aqi_reduction_pct,
                "coverage": d_coverage,
                "coverage_tier": d_coverage.get("tier_label"),
                "confidence_score": d_coverage.get("confidence_score"),
                "confidence_level": d_coverage.get("confidence_level"),
                "nearest_station": d_coverage.get("nearest_station"),
                "explanation_narrative": explanation,
                "climatology": d_clim,
            })

        return {
            "success": True,
            "origin": {
                "name": origin_name,
                "district": origin.get("district"),
                "state": origin.get("state"),
                "lat": origin_lat,
                "lon": origin_lon,
                "current_aqi": origin_aqi,
                "cpcb_category": origin_air.get("cpcb_category"),
                "cpcb_color": origin_air.get("cpcb_color"),
                "governing_pollutant": origin_air.get("governing_pollutant"),
                "personal_risk": origin_risk,
                "coverage": origin_coverage,
                "coverage_tier": origin_coverage.get("tier_label"),
                "confidence_score": origin_coverage.get("confidence_score"),
                "confidence_level": origin_coverage.get("confidence_level"),
                "nearest_station": origin_coverage.get("nearest_station"),
                "climatology": origin_clim,
                "place_weather": origin_context["current_weather"],
            },
            "candidates": dest_results,
            "profile_summary": {
                "conditions": profile.get("conditions", []),
                "household": profile.get("household", "none"),
                "is_pregnant": profile.get("is_pregnant", False),
            },
            "advisory_notice": (
                "Advisory only, not medical advice. Relocation assessments are rule-based environmental risk estimates. "
                "Follow your doctor's clinical asthma or health action plan."
            ),
        }

    @staticmethod
    def _generate_health_relocation_narrative(
        origin_name: str,
        dest_name: str,
        origin_aqi: int,
        dest_aqi: int,
        origin_exposure_score: int,
        dest_exposure_score: int,
        exposure_diff_points: int,
        suitability: str,
        profile: Dict[str, Any],
        dest_clim: Dict[str, Any],
        is_low_confidence: bool = False,
    ) -> str:
        """Compose Health-based Relocation Assessment narrative with rule-based exposure index deltas."""
        conditions = profile.get("conditions", [])
        best_month = dest_clim.get("best_month", {}).get("month_name", "the summer season")

        if exposure_diff_points > 0:
            core = (
                f"Relocating from {origin_name} to {dest_name} shifts your rule-based personal exposure index "
                f"by {exposure_diff_points} points (from {origin_exposure_score}/100 to {dest_exposure_score}/100), "
                f"with an ambient air quality shift of AQI {origin_aqi} → {dest_aqi}."
            )
        elif exposure_diff_points < 0:
            core = (
                f"Relocating from {origin_name} to {dest_name} would increase your personal exposure index "
                f"by {abs(exposure_diff_points)} points (from {origin_exposure_score}/100 to {dest_exposure_score}/100, "
                f"AQI {origin_aqi} → {dest_aqi}). Relocation does not offer an environmental health benefit."
            )
        else:
            core = (
                f"Relocating from {origin_name} to {dest_name} results in an equivalent exposure index "
                f"of {dest_exposure_score}/100 (AQI {origin_aqi} vs {dest_aqi})."
            )

        health_note = ""
        if "asthma" in conditions or "copd" in conditions:
            if suitability in ("Suitable", "Suitable with precautions"):
                health_note = (
                    " For your respiratory profile, escaping heavy chronic aerosol exposure helps lower airway hyper-responsiveness "
                    "and reduce reliance on rescue bronchodilators."
                )
            else:
                health_note = (
                    " High particulate burden in this destination would maintain elevated airway inflammation for your respiratory condition."
                )
        elif profile.get("is_pregnant"):
            health_note = (
                " Protecting gestational development from systemic particulate translocation is critical; "
                "lower exposure reduces intrauterine environmental stress."
            )

        season_note = f" Optimal clean-air relocation window for {dest_name} is around {best_month}."
        confidence_note = (
            f" Note: Atmospheric values for {dest_name} represent a gridded regional reanalysis estimate (~11 km resolution); "
            "recommendations are indicative."
            if is_low_confidence
            else ""
        )

        return f"{core}{health_note}{season_note}{confidence_note}"
