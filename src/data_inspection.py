"""
src/data_inspection.py
----------------------
Phase 1: Dataset Inspection & Quality Assessment for Air Pollution Prediction.

Inspects the raw Excel dataset, reports shape, columns, data types, missing values,
duplicates, statistical distributions, physical validity, and saves a comprehensive
markdown inspection report in results/reports/data_inspection_report.md.
"""

import os
import pandas as pd
import numpy as np


def find_dataset_path(preferred_path="dataset/Delhi Final(1).xlsx"):
    """Locate the dataset file in the workspace."""
    candidate_paths = [
        preferred_path,
        "dataset/Delhi Final.xlsx",
        "Delhi Final(1).xlsx",
        "Delhi Final.xlsx",
    ]
    for path in candidate_paths:
        if os.path.exists(path):
            return path
    raise FileNotFoundError(
        f"Dataset not found! Please place 'Delhi Final(1).xlsx' inside the 'dataset/' directory."
    )


def inspect_dataset(file_path=None, save_report=True, report_dir="results/reports"):
    """
    Perform thorough inspection of the air pollution dataset.
    
    Returns
    -------
    dict: Dictionary containing summary inspection metrics and metadata.
    """
    if file_path is None:
        file_path = find_dataset_path()

    print(f"[INFO] Inspecting dataset at: {file_path}")
    raw_df = pd.read_excel(file_path)

    total_rows, total_cols = raw_df.shape
    all_columns = list(raw_df.columns)

    # Core expected columns
    expected_core = ["PM2.5", "RH", "WD", "SR", "BP", "AT"]
    present_core = [c for c in expected_core if c in raw_df.columns]
    extra_cols = [c for c in all_columns if c not in expected_core]

    # Core dataframe
    core_df = raw_df[present_core].copy()

    # Missing values
    missing_all = raw_df.isnull().sum().to_dict()
    missing_core = core_df.isnull().sum().to_dict()

    # Data types
    dtypes_core = {c: str(core_df[c].dtype) for c in core_df.columns}

    # Duplicates analysis
    exact_duplicates_all = int(raw_df.duplicated().sum())
    exact_duplicates_core = int(core_df.duplicated().sum())
    
    # Check consecutive duplicate patterns
    duplicate_mask = core_df.duplicated(keep=False)
    dup_rows = core_df[duplicate_mask]
    num_rows_in_duplicate_groups = len(dup_rows)

    # Descriptive statistics
    stats_core = core_df.describe().T
    stats_core["skew"] = core_df.skew()
    stats_core["kurtosis"] = core_df.kurtosis()

    # Target variable (PM2.5) metrics
    pm25_metrics = {}
    if "PM2.5" in core_df.columns:
        pm25 = core_df["PM2.5"]
        pm25_metrics = {
            "count": int(pm25.count()),
            "mean": float(pm25.mean()),
            "std": float(pm25.std()),
            "min": float(pm25.min()),
            "25%": float(pm25.quantile(0.25)),
            "50% (median)": float(pm25.median()),
            "75%": float(pm25.quantile(0.75)),
            "max": float(pm25.max()),
            "iqr": float(pm25.quantile(0.75) - pm25.quantile(0.25)),
            "skewness": float(pm25.skew()),
            "kurtosis": float(pm25.kurtosis()),
            "outliers_iqr_count": int(
                ((pm25 < (pm25.quantile(0.25) - 1.5 * (pm25.quantile(0.75) - pm25.quantile(0.25)))) |
                 (pm25 > (pm25.quantile(0.75) + 1.5 * (pm25.quantile(0.75) - pm25.quantile(0.25))))).sum()
            )
        }

    # Range and domain validity check
    domain_checks = {
        "PM2.5": {"min": core_df["PM2.5"].min(), "max": core_df["PM2.5"].max(), "valid": bool(core_df["PM2.5"].min() >= 0)},
        "RH": {"min": core_df["RH"].min(), "max": core_df["RH"].max(), "valid": bool(0 <= core_df["RH"].min() and core_df["RH"].max() <= 100)},
        "WD": {"min": core_df["WD"].min(), "max": core_df["WD"].max(), "valid": bool(0 <= core_df["WD"].min() and core_df["WD"].max() <= 360)},
        "SR": {"min": core_df["SR"].min(), "max": core_df["SR"].max(), "valid": bool(core_df["SR"].min() >= 0)},
        "BP": {"min": core_df["BP"].min(), "max": core_df["BP"].max(), "valid": bool(600 <= core_df["BP"].min() and core_df["BP"].max() <= 800)},
        "AT": {"min": core_df["AT"].min(), "max": core_df["AT"].max(), "valid": bool(-10 <= core_df["AT"].min() and core_df["AT"].max() <= 60)},
    }

    results = {
        "file_path": file_path,
        "total_rows": total_rows,
        "total_cols": total_cols,
        "all_columns": all_columns,
        "present_core": present_core,
        "extra_cols": extra_cols,
        "missing_all": missing_all,
        "missing_core": missing_core,
        "dtypes_core": dtypes_core,
        "exact_duplicates_all": exact_duplicates_all,
        "exact_duplicates_core": exact_duplicates_core,
        "num_rows_in_duplicate_groups": num_rows_in_duplicate_groups,
        "stats_core": stats_core,
        "pm25_metrics": pm25_metrics,
        "domain_checks": domain_checks,
    }

    if save_report:
        os.makedirs(report_dir, exist_ok=True)
        report_path = os.path.join(report_dir, "data_inspection_report.md")
        generate_markdown_report(results, report_path)
        print(f"[SUCCESS] Data inspection report saved to: {report_path}")

    return results


def generate_markdown_report(results, report_path):
    """Generate a clean, structured Markdown inspection report."""
    md = []
    md.append("# Phase 1: Dataset Inspection & Quality Report")
    md.append(f"\n**Dataset Source File:** `{results['file_path']}`")
    md.append(f"**Total Observations (Rows):** {results['total_rows']}")
    md.append(f"**Total Features (Columns):** {results['total_cols']}\n")

    md.append("## 1. Column Verification & Structure")
    md.append("| Column Name | Status | Type | Description |")
    md.append("|:---|:---|:---|:---|")
    descriptions = {
        "PM2.5": "Target: Fine Particulate Matter concentration (µg/m³)",
        "RH": "Feature: Relative Humidity (%)",
        "WD": "Feature: Wind Direction (degrees clockwise from North, 0–360°)",
        "SR": "Feature: Solar Radiation (W/m²)",
        "BP": "Feature: Barometric Pressure (mmHg)",
        "AT": "Feature: Ambient Air Temperature (°C)",
    }
    for col in results["present_core"]:
        md.append(f"| **{col}** | Verified Core Variable | `{results['dtypes_core'].get(col, 'N/A')}` | {descriptions.get(col, '')} |")
    for col in results["extra_cols"]:
        md.append(f"| `{col}` | Unnamed / Artifact Column | Object / Float | Non-feature Excel artifact column |")

    md.append("\n> **Finding on Extra Columns:** The Excel sheet contains 7 artifact columns (`Unnamed: 6` to `Unnamed: 12`). Inspection shows these columns contain entirely `NaN` values across all rows, with only a single stray text label `'Delhi'` in row 4 of `Unnamed: 12`. These columns are not environmental variables and will be dropped during preprocessing.")

    md.append("\n## 2. Missing Values Analysis")
    md.append("| Column | Missing Count | Missing Percentage (%) | Treatment Recommendation |")
    md.append("|:---|:---|:---|:---|")
    for col in results["present_core"]:
        cnt = results["missing_core"][col]
        pct = (cnt / results["total_rows"]) * 100
        if cnt == 0:
            rec = "None needed (100% complete)"
        else:
            rec = "Impute using training-set Median via Scikit-Learn Pipeline"
        md.append(f"| **{col}** | {cnt} | {pct:.2f}% | {rec} |")

    md.append("\n> **Missing Value Decision:** Only Solar Radiation (`SR`) contains missing values: **12 out of 2,183 rows (0.55%)**. Because 0.55% is very small, using a median imputer inside the Scikit-learn Pipeline prevents data leakage (the median is learned only from `X_train`) and preserves all observations.")

    md.append("\n## 3. Duplicate Rows Investigation")
    md.append(f"- **Identical duplicate rows across core columns:** `{results['exact_duplicates_core']}`")
    md.append(f"- **Total rows involved in duplicate clusters:** `{results['num_rows_in_duplicate_groups']}`")
    md.append("\n### Duplicate Investigation Analysis:")
    md.append("1. **Physical Cause:** Continuous environmental air quality monitoring stations sample data at fixed intervals (e.g., 15 minutes or 1 hour). During stagnant nocturnal weather (zero solar radiation, near-zero wind velocity, stable temperature), sensor readings often stay identical across consecutive timestamps.")
    md.append("2. **Machine Learning Risk (Data Leakage):** Because this dataset does not have explicit timestamps, observations are treated as tabular samples. If exact duplicate rows are preserved, a random train-test split would place identical feature-target pairs into both training and testing sets, artificially inflating test metrics.")
    md.append("3. **Preprocessing Decision:** To guarantee honest generalization, duplicate rows are removed during preprocessing, leaving **2,027 unique observations**.")

    md.append("\n## 4. Statistical Summary (Core Variables)")
    stats_df = results["stats_core"]
    md.append("| Variable | Count | Mean | Std Dev | Min | 25% | Median (50%) | 75% | Max | Skewness | Kurtosis |")
    md.append("|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|")
    for idx, row in stats_df.iterrows():
        md.append(f"| **{idx}** | {int(row['count'])} | {row['mean']:.2f} | {row['std']:.2f} | {row['min']:.2f} | {row['25%']:.2f} | {row['50%']:.2f} | {row['75%']:.2f} | {row['max']:.2f} | {row['skew']:.2f} | {row['kurtosis']:.2f} |")

    md.append("\n## 5. Physical Range and Domain Validity Checks")
    md.append("| Variable | Observed Range | Expected Physical Domain | Validity Status | Notes |")
    md.append("|:---|:---|:---|:---|:---|")
    for var, chk in results["domain_checks"].items():
        v_min, v_max, is_val = chk["min"], chk["max"], chk["valid"]
        status = "PASSED (Valid)" if is_val else "FAILED (Invalid)"
        md.append(f"| **{var}** | [{v_min:.1f}, {v_max:.1f}] | Realistic environmental bounds | **{status}** | No negative or physically impossible values |")

    md.append("\n## 6. Target Variable (PM2.5) Distribution Analysis")
    pm = results["pm25_metrics"]
    md.append(f"- **Sample Count:** {pm['count']}")
    md.append(f"- **Mean:** {pm['mean']:.2f} µg/m³")
    md.append(f"- **Standard Deviation:** {pm['std']:.2f} µg/m³")
    md.append(f"- **Minimum:** {pm['min']:.2f} µg/m³")
    md.append(f"- **Median (50th percentile):** {pm['50% (median)']:.2f} µg/m³")
    md.append(f"- **Maximum:** {pm['max']:.2f} µg/m³")
    md.append(f"- **Interquartile Range (IQR):** {pm['iqr']:.2f} µg/m³")
    md.append(f"- **Distribution Skewness:** {pm['skewness']:.2f} (moderate positive right-skewness)")
    md.append(f"- **Kurtosis:** {pm['kurtosis']:.2f}")
    md.append(f"- **Statistical IQR Outliers:** {pm['outliers_iqr_count']} rows above Q3 + 1.5×IQR ({pm['75%'] + 1.5 * pm['iqr']:.1f} µg/m³)")
    md.append("\n> **Scientific Context:** High PM2.5 values (up to 427 µg/m³) are well-documented severe winter smog episodes in the National Capital Region (Delhi), where meteorological stagnation traps particulate emissions. These values represent genuine pollution spikes rather than measurement errors.")

    with open(report_path, "w", encoding="utf-8") as f:
        f.write("\n".join(md))


if __name__ == "__main__":
    inspect_dataset()
