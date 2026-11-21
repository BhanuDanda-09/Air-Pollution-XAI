"""
src/predict_mlp.py
------------------
Interactive PM2.5 Prediction Tool using Trained Multilayer Perceptron (MLP).

Allows users to input meteorological measurements:
- RH: Relative Humidity (%)
- WD: Wind Direction (degrees)
- SR: Solar Radiation (W/m² or equivalent)
- BP: Barometric Pressure (hPa/mmHg)
- AT: Air Temperature (°C)

Validates inputs, scales features using models/mlp_scaler.pkl, generates predictions
with models/mlp_model.keras, and provides clear unit-labeled scientific output.
"""

import os
import sys

# Ensure root directory is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

os.environ["MPLCONFIGDIR"] = os.path.abspath(".matplotlib_cache")
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

import argparse
import joblib
import numpy as np
import pandas as pd
import keras


VALIDATION_BOUNDS = {
    "RH": (0.0, 100.0, "%", "Relative Humidity"),
    "WD": (0.0, 360.0, "degrees", "Wind Direction"),
    "SR": (0.0, 1500.0, "W/m2", "Solar Radiation"),
    "BP": (700.0, 780.0, "mmHg", "Barometric Pressure"),
    "AT": (-20.0, 60.0, "°C", "Air Temperature"),
}


def load_inference_artifacts(
    model_path="models/mlp_model.keras",
    scaler_path="models/mlp_scaler.pkl"
):
    """Load the trained Keras model and the fitted scikit-learn scaler pipeline."""
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"MLP model file not found at: {model_path}. Please train via src/train_mlp.py first.")
    if not os.path.exists(scaler_path):
        raise FileNotFoundError(f"MLP scaler file not found at: {scaler_path}. Please train via src/train_mlp.py first.")

    model = keras.models.load_model(model_path)
    scaler = joblib.load(scaler_path)
    return model, scaler


def validate_input_value(feature, val_str):
    """Validate and convert user input string to float within biological/meteorological ranges."""
    try:
        val = float(val_str)
    except ValueError:
        raise ValueError(f"Invalid input '{val_str}' for {feature}. Must be a valid numeric value.")

    low, high, unit, desc = VALIDATION_BOUNDS[feature]
    if val < low or val > high:
        raise ValueError(
            f"Value {val} for {feature} ({desc}) is out of realistic physical bounds [{low}, {high}] {unit}."
        )
    return val


def predict_pm25(rh, wd, sr, bp, at, model, scaler):
    """
    Scale inputs and generate PM2.5 prediction using the trained MLP.

    Parameters
    ----------
    rh, wd, sr, bp, at : float
        Meteorological inputs.
    model : keras.Model
        Trained MLP model.
    scaler : Pipeline
        Fitted SimpleImputer + StandardScaler.

    Returns
    -------
    float : Predicted PM2.5 in µg/m³.
    """
    input_df = pd.DataFrame([{
        "RH": rh,
        "WD": wd,
        "SR": sr,
        "BP": bp,
        "AT": at
    }])

    # Preprocessing transformation (median imputation + standard scaling)
    scaled_input = scaler.transform(input_df)

    # Model inference
    raw_pred = model.predict(scaled_input, verbose=0)
    pred_val = float(raw_pred[0][0])
    # Enforce non-negativity constraint for particulate mass concentration
    return max(0.0, pred_val)


def print_prediction_card(features_dict, predicted_pm25):
    """Format and print a user-friendly prediction report."""
    print("\n" + "=" * 65)
    print("            AIRIQ INDIA — PM2.5 NEURAL ESTIMATION REPORT            ")
    print("=" * 65)
    print("Model Architecture: Multilayer Perceptron (MLP) Deep Learning")
    print("Underlying Engine:  TensorFlow / Keras 3.x")
    print("-" * 65)
    print("INPUT METEOROLOGICAL PARAMETERS:")
    for feat, val in features_dict.items():
        low, high, unit, desc = VALIDATION_BOUNDS[feat]
        print(f"  • {feat:3s} ({desc:20s}): {val:8.2f} {unit}")
    print("-" * 65)
    print(f"PREDICTED PM2.5 CONCENTRATION:  {predicted_pm25:.2f} µg/m³")

    # Indicative CPCB PM2.5 Health Severity Category (Concentration Breakpoints)
    if predicted_pm25 <= 30:
        category = "Good (0 - 30 µg/m³)"
    elif predicted_pm25 <= 60:
        category = "Satisfactory (31 - 60 µg/m³)"
    elif predicted_pm25 <= 90:
        category = "Moderate (61 - 90 µg/m³)"
    elif predicted_pm25 <= 120:
        category = "Poor (91 - 120 µg/m³)"
    elif predicted_pm25 <= 250:
        category = "Very Poor (121 - 250 µg/m³)"
    else:
        category = "Severe (> 250 µg/m³)"

    print(f"INDICATIVE CPCB PM2.5 HEALTH BAND:  {category}")
    print("-" * 65)
    print("SCIENTIFIC NOTICES & REGULATORY DISCLAIMERS:")
    print("  * Model Prediction: This value is an AI regression estimation")
    print("    derived from 5 instantaneous meteorological indicators, NOT an")
    print("    in-situ certified regulatory particulate monitor measurement.")
    print("  * AQI Distinction: This output reflects an indicative single-pollutant")
    print("    health severity band based on CPCB PM2.5 concentration breakpoints.")
    print("    It is NOT an official CPCB AQI calculation, which requires a 24-hour")
    print("    time-weighted running average and multi-pollutant sub-index aggregation.")
    print("=" * 65 + "\n")


def interactive_mode(model, scaler):
    """Run interactive command-line interface."""
    print("\n" + "=" * 65)
    print("  INTERACTIVE PM2.5 PREDICTOR (MULTILAYER PERCEPTRON)  ")
    print("=" * 65)
    print("Enter the 5 meteorological parameters below (or type 'q' to quit):\n")

    while True:
        try:
            inputs = {}
            for feat in ["RH", "WD", "SR", "BP", "AT"]:
                low, high, unit, desc = VALIDATION_BOUNDS[feat]
                prompt = f"Enter {feat} ({desc}) [{low}-{high} {unit}]: "
                user_val = input(prompt).strip()
                if user_val.lower() in ("q", "quit", "exit"):
                    print("Exiting interactive prediction tool. Goodbye!")
                    return
                inputs[feat] = validate_input_value(feat, user_val)

            pm25_pred = predict_pm25(
                inputs["RH"], inputs["WD"], inputs["SR"], inputs["BP"], inputs["AT"],
                model, scaler
            )
            print_prediction_card(inputs, pm25_pred)

            cont = input("Predict another sample? (y/n, default=y): ").strip().lower()
            if cont in ("n", "no", "q", "quit"):
                break
        except Exception as e:
            print(f"\n[ERROR] {e}\nPlease try again.\n")


def main():
    parser = argparse.ArgumentParser(description="Predict PM2.5 using trained MLP Deep Learning model.")
    parser.add_argument("--rh", type=float, help="Relative Humidity (0-100 percent)")
    parser.add_argument("--wd", type=float, help="Wind Direction (0-360 degrees)")
    parser.add_argument("--sr", type=float, help="Solar Radiation (W/m2)")
    parser.add_argument("--bp", type=float, help="Barometric Pressure in mmHg (typical Delhi range: 720-760 mmHg)")
    parser.add_argument("--at", type=float, help="Air Temperature (deg C)")
    parser.add_argument("--example", action="store_true", help="Run with verified capstone example inputs (RH=74, WD=298, SR=5, BP=740, AT=14)")

    args = parser.parse_args()

    model, scaler = load_inference_artifacts()

    if args.example:
        example_inputs = {"RH": 74.0, "WD": 298.0, "SR": 5.0, "BP": 740.0, "AT": 14.0}
        pred = predict_pm25(
            example_inputs["RH"], example_inputs["WD"], example_inputs["SR"],
            example_inputs["BP"], example_inputs["AT"], model, scaler
        )
        print_prediction_card(example_inputs, pred)
        return

    if any(v is not None for v in [args.rh, args.wd, args.sr, args.bp, args.at]):
        if any(v is None for v in [args.rh, args.wd, args.sr, args.bp, args.at]):
            print("[ERROR] When specifying command line inputs, all 5 parameters (--rh, --wd, --sr, --bp, --at) must be provided.")
            sys.exit(1)

        inputs = {
            "RH": validate_input_value("RH", str(args.rh)),
            "WD": validate_input_value("WD", str(args.wd)),
            "SR": validate_input_value("SR", str(args.sr)),
            "BP": validate_input_value("BP", str(args.bp)),
            "AT": validate_input_value("AT", str(args.at)),
        }
        pred = predict_pm25(
            inputs["RH"], inputs["WD"], inputs["SR"],
            inputs["BP"], inputs["AT"], model, scaler
        )
        print_prediction_card(inputs, pred)
    else:
        # Fall back to interactive mode if no arguments provided
        # If in non-interactive terminal (like automated test), run example
        if not sys.stdin.isatty():
            print("[INFO] Non-interactive environment detected. Running standard capstone example (RH=74, WD=298, SR=5, BP=740, AT=14)...")
            example_inputs = {"RH": 74.0, "WD": 298.0, "SR": 5.0, "BP": 740.0, "AT": 14.0}
            pred = predict_pm25(
                example_inputs["RH"], example_inputs["WD"], example_inputs["SR"],
                example_inputs["BP"], example_inputs["AT"], model, scaler
            )
            print_prediction_card(example_inputs, pred)
        else:
            interactive_mode(model, scaler)


if __name__ == "__main__":
    main()
