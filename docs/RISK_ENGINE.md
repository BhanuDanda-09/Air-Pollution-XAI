# Personal Exposure Risk Engine — Specification & Medical Methodology

## 1. Executive Summary & Objective

The **Personal Exposure Risk Engine** (`backend/services/risk_service.py`) calculates an individualized, transparent, rule-based **Personal Risk Score** ($0 \le S \le 100$) and categorical relocation recommendation for users evaluating ambient air quality across Indian cities.

Unlike black-box models or diagnostic medical AI, this engine operates strictly as a **rule-based multi-criteria exposure risk assessment tool** based on published public health standards:
1. **World Health Organization (WHO) 2021 Global Air Quality Guidelines**
2. **Central Pollution Control Board (CPCB) National Ambient Air Quality Standards (NAAQS, 2009)**
3. **Global Initiative for Asthma (GINA) & Global Initiative for Chronic Obstructive Lung Disease (GOLD)**

> **Statutory Disclaimer**: *This system provides informational exposure risk assessments and relative environmental comparisons. It does not provide medical diagnosis, clinical treatment plans, or individual prognosis. Users must consult licensed medical practitioners for clinical advice.*

---

## 2. Mathematical Formulation

The Personal Exposure Risk Score $S_{\text{risk}} \in [0, 100]$ combines four physical and physiological exposure dimensions:

$$S_{\text{risk}} = \min\left(100, \left( w_c \cdot I_{\text{current}} + w_f \cdot I_{\text{forecast}} + w_s \cdot I_{\text{season}} + w_a \cdot I_{\text{annual}} \right) \cdot M_{\text{vuln}} \cdot M_{\text{exp}} \cdot M_{\text{prot}}\right)$$

### 2.1 Dimension Weights ($w_k$)
The baseline air quality index combines four temporal horizons:
- **$w_c = 0.35$** — **Current Ambient Reference**: Immediate exposure based on Copernicus CAMS and CPCB observations.
- **$w_f = 0.25$** — **Short-Term Forecast ($24\text{h}\text{--}72\text{h}$)**: Machine learning predictive trajectory for upcoming days.
- **$w_s = 0.20$** — **Seasonal Climatological Peak**: Worst-month historical concentration ($P_{90}$) capturing seasonal inversion severity.
- **$w_a = 0.20$** — **Long-Term Annual Mean**: Chronic exposure baseline relative to WHO annual guideline thresholds.

$$\sum_{k} w_k = 0.35 + 0.25 + 0.20 + 0.20 = 1.00$$

---

## 3. Vulnerability Multipliers ($M_{\text{vuln}}$)

Clinical research demonstrates that individuals with preexisting respiratory, cardiovascular, and metabolic conditions experience adverse acute reactions at significantly lower particulate thresholds than healthy adults.

| Condition / Risk Group | Clinical Rationale | Multiplier ($M_i$) | Authority |
|:---|:---|:---:|:---|
| **Asthma** | Hyper-reactive airways; acute PM2.5/NO2 trigger bronchospasms | $+0.35$ | GINA 2023 |
| **COPD / Chronic Bronchitis** | Irreversible airflow limitation; high risk of acute exacerbation | $+0.40$ | GOLD 2024 |
| **Cardiovascular Disease** | Ultrafine particles trigger systemic inflammation, plaque rupture, arrhythmia | $+0.30$ | AHA Circulation 2020 |
| **Hypertension** | Endothelial dysfunction aggravated by acute particulate spikes | $+0.15$ | Lancet Public Health |
| **Diabetes (Type 2)** | Microvascular inflammation and autonomic vascular stiffness | $+0.15$ | ADA Standards 2023 |
| **Allergic Rhinitis / Sinusitis** | Upper airway mucosal hyper-responsiveness | $+0.10$ | ARIA Guidelines |
| **Pregnancy** | Transplacental translocation of nano-particles; IUGR and preterm risk | $+0.30$ | WHO Maternal Health |
| **Children Under 5 Years** | Immature lung parenchyma, higher minute ventilation per body weight | $+0.25$ | WHO Air Quality 2021 |
| **Elderly (>65 Years)** | Diminished mucociliary clearance and reduced cardiovascular reserve | $+0.25$ | ICMR Geriatric Guidelines |

The cumulative vulnerability multiplier is capped at $M_{\text{vuln}} \le 2.20$ to prevent numerical distortion while reflecting multi-morbidity:

$$M_{\text{vuln}} = \min\left(2.20, 1.0 + \sum_{i \in \text{conditions}} M_i\right)$$

---

## 4. Exposure & Protection Modifiers ($M_{\text{exp}}, M_{\text{prot}}$)

### 4.1 Outdoor Exposure ($M_{\text{exp}}$)
$$\Delta M_{\text{hours}} = \max\left(-0.10, \frac{\text{daily outdoor hours} - 4}{10} \cdot 0.25\right)$$
- Two-wheeler or cycling commute in heavy traffic: $+0.15$
- Public transit (metro/closed bus): $0.00$
- Private AC automobile or remote work: $-0.05$

$$M_{\text{exp}} = 1.0 + \Delta M_{\text{hours}} + M_{\text{commute}}$$

### 4.2 Indoor Protection ($M_{\text{prot}}$)
- **True HEPA Air Purifier at home/work**: Reduces indoor particulate exposure by $60\text{--}80\% \implies M_{\text{prot}} = 0.85$ (15% net risk reduction).
- **Frequent N95 Respirator Use outdoors during poor episodes**: $M_{\text{prot}} = 0.85$.
- Combined HEPA + N95 compliance: $M_{\text{prot}} = 0.72$.

---

## 5. Comparative Verdict Matrix

For each candidate relocation destination, the engine compares the baseline risk in the origin city against the destination:

$$\Delta \text{Risk} = \frac{S_{\text{origin}} - S_{\text{dest}}}{S_{\text{origin}}} \times 100\%$$

| Verdict Category | Clinical & Exposure Criteria | Actionable Guidance |
|:---|:---|:---|
| **Highly Recommended** | $\Delta \text{Risk} \ge 40\%$ reduction AND $S_{\text{dest}} < 45$ | Relocation delivers profound reduction in chronic and acute triggers. Peak season remains well within tolerable biological boundaries. |
| **Recommended with Precautions** | $\Delta \text{Risk} \ge 15\%$ reduction AND $S_{\text{dest}} < 65$ | Meaningful reduction in ambient exposure. Maintain indoor HEPA purification during winter months. Keep rescue inhaler/medication on schedule. |
| **Neutral / Marginal Benefit** | $-15\% < \Delta \text{Risk} < 15\%$ | Relocation offers negligible improvement in environmental load. Seasonal episodes are comparable to current residence. |
| **Not Recommended for Sensitive Profile** | $S_{\text{dest}} \ge 70$ OR $\Delta \text{Risk} \le -15\%$ | High particulate basin with severe winter temperature inversions. Frequent acute respiratory/cardiovascular exacerbations expected for user's profile. |
| **Avoid (Severe Exposure Hazard)** | $S_{\text{dest}} \ge 85$ OR Destination in Severe Persistent Basin with chronic $P_{90} > 150\,\mu\text{g/m}^3$ | Critical particulate concentrations exceed NAAQS emergency thresholds for extended multi-month periods. Substantial risk of clinical hospitalization. |

---

## 6. Verification and Test Assertions

The engine is covered by automated unit and integration tests in `backend/tests/test_multi_pollutant_api.py`:
1. **Asthmatic Child vs. Healthy Adult**: Demonstrates $+60\%$ risk differentiation under identical Delhi air quality.
2. **Delhi to Bengaluru Relocation**: Confirms $>60\%$ risk reduction and "Highly Recommended" verdict.
3. **Delhi to Faridabad Relocation**: Confirms negative risk delta and "Not Recommended" / "Avoid" verdict.
4. **HEPA / N95 Mitigation**: Confirms mathematically sound risk dampening without clamping.
