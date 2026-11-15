"""
src/train_lstm.py
-----------------
Phase 4 Track B: Long Short-Term Memory (LSTM) Time-Series Model for Air Pollution Forecasting.

Scientific Validation & Constraints:
- LSTM forecasting requires valid, genuine chronological observations with recorded timestamps.
- Consecutive rows in tabular datasets WITHOUT timestamps CANNOT be arbitrarily assumed to be consecutive time intervals.
- Shuffling, random sequence generation, or inventing synthetic dates on untimestamped data constitutes scientific misconduct.
- This module implements the complete, production-grade LSTM sequence forecasting pipeline.
- If a validated timestamped dataset is supplied (e.g., dataset/delhi_timeseries_cpcb.csv), it executes full training,
  validation, evaluation, and visualization.
- If no genuine timestamped dataset is present, it explicitly reports Track B as blocked pending chronological data,
  preserving scientific validity and avoiding spurious forecasting claims.
"""

import os
import sys

# Ensure root directory is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

os.environ["MPLCONFIGDIR"] = os.path.abspath(".matplotlib_cache")
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"

import json
import random
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns

import tensorflow as tf
import keras
from keras import layers, callbacks
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


def set_reproducible_seeds(seed=42):
    random.seed(seed)
    np.random.seed(seed)
    tf.random.set_seed(seed)
    keras.utils.set_random_seed(seed)


def inspect_timeseries_dataset(file_path):
    """
    Validate whether a given file contains genuine chronological time-series data.
    """
    if not os.path.exists(file_path):
        return None, f"File not found at: {file_path}"

    try:
        if file_path.endswith(".csv"):
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)
    except Exception as e:
        return None, f"Failed to read file: {e}"

    # Search for timestamp or datetime column
    time_cols = [c for c in df.columns if any(t in c.lower() for t in ["date", "time", "timestamp", "datetime", "hour"])]
    if not time_cols:
        return None, "No timestamp, date, or time column detected in dataset."

    time_col = time_cols[0]
    try:
        df[time_col] = pd.to_datetime(df[time_col])
    except Exception as e:
        return None, f"Column '{time_col}' could not be parsed as valid chronological datetime: {e}"

    if "PM2.5" not in df.columns and "pm25" not in [c.lower() for c in df.columns]:
        return None, "Target column 'PM2.5' not found in dataset."

    return df, f"Valid chronological dataset verified with time column '{time_col}' and {len(df)} records."


def create_chronological_sequences(X_scaled, y_values, lookback=24):
    """
    Construct genuine time-series sliding window sequences for LSTM regression.
    X_seq shape: (num_samples, lookback, num_features)
    y_seq shape: (num_samples,)
    """
    X_seq, y_seq = [], []
    for i in range(len(X_scaled) - lookback):
        X_seq.append(X_scaled[i : i + lookback])
        y_seq.append(y_values[i + lookback])
    return np.array(X_seq), np.array(y_seq)


def build_lstm_model(lookback=24, num_features=5, learning_rate=0.001):
    """
    Construct an LSTM regression architecture.
    """
    model = keras.Sequential([
        layers.Input(shape=(lookback, num_features), name="timeseries_sequence_input"),
        layers.LSTM(64, return_sequences=True, name="lstm_layer_1"),
        layers.Dropout(0.2, name="lstm_dropout_1"),
        layers.LSTM(32, return_sequences=False, name="lstm_layer_2"),
        layers.Dropout(0.2, name="lstm_dropout_2"),
        layers.Dense(32, activation="relu", name="dense_transition"),
        layers.Dense(1, activation="linear", name="pm25_forecast_output"),
    ], name="AirPollution_LSTM")

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=learning_rate),
        loss="mean_squared_error",
        metrics=["mae"]
    )
    return model


def run_lstm_pipeline(
    dataset_path="dataset/delhi_timeseries_cpcb.csv",
    model_save_path="models/lstm_model.keras",
    metrics_save_path="results/metrics/lstm_metrics.json",
    graphs_dir="results/graphs/lstm",
    lookback=24,
    random_state=42
):
    """
    Train, validate, and evaluate the LSTM model if a genuine timestamped dataset exists.
    Otherwise, log the scientific limitation and mark Track B as blocked.
    """
    print("\n" + "=" * 70)
    print("PHASE 4 TRACK B: LONG SHORT-TERM MEMORY (LSTM) TIME-SERIES MODEL")
    print("=" * 70)

    # 1. Check for genuine timestamped dataset availability
    print("\n[Step 1/4] Verifying timestamped dataset availability...")
    candidate_paths = [
        dataset_path,
        "dataset/delhi_cpcb_timeseries.csv",
        "dataset/delhi_air_quality_timeseries.csv"
    ]

    valid_df = None
    validation_note = ""
    for p in candidate_paths:
        df_found, note = inspect_timeseries_dataset(p)
        if df_found is not None:
            valid_df = df_found
            validation_note = note
            dataset_path = p
            break
        else:
            validation_note = note

    if valid_df is None:
        print("\n" + "!" * 70)
        print("SCIENTIFIC NOTICE: TRACK B (LSTM FORECASTING) IS CURRENTLY BLOCKED")
        print("!" * 70)
        print("Reason: The existing workspace dataset 'dataset/Delhi Final(1).xlsx' is a tabular")
        print("cross-sectional dataset with NO genuine date or timestamp column.")
        print("\nPer strict scientific integrity and capstone project instructions:")
        print("  1. We DO NOT invent synthetic dates or hourly timestamps.")
        print("  2. We DO NOT treat consecutive tabular rows as consecutive time intervals.")
        print("  3. We DO NOT reshape static tabular data into fake sequences.")
        print("  4. LSTM forecasting requires true chronological sequence dependency (t-24 ... t-1 -> t).")
        print(f"\nChecked candidate paths: {candidate_paths}")
        print(f"Status Note: {validation_note}")
        print("\nTO UNBLOCK TRACK B:")
        print("  Place a valid hourly or daily CPCB/OpenAQ dataset containing a 'datetime' column")
        print(f"  and 'PM2.5' at '{dataset_path}', then re-run this script.")
        print("!" * 70 + "\n")
        return {
            "status": "BLOCKED",
            "model_name": "Long Short-Term Memory (LSTM)",
            "reason": "Missing genuine chronological timestamp column in dataset.",
            "unblock_instructions": f"Provide chronological time-series dataset at {dataset_path}."
        }

    # If valid timestamped dataset is found, proceed with full training
    print(f"\n[Step 2/4] Valid timestamped dataset found! {validation_note}")
    set_reproducible_seeds(random_state)
    os.makedirs(os.path.dirname(model_save_path), exist_ok=True)
    os.makedirs(os.path.dirname(metrics_save_path), exist_ok=True)
    os.makedirs(graphs_dir, exist_ok=True)

    # Identify features
    target_col = [c for c in valid_df.columns if c.lower() == "pm2.5" or c.lower() == "pm25"][0]
    time_col = [c for c in valid_df.columns if any(t in c.lower() for t in ["date", "time", "timestamp"])][0]
    feature_cols = [c for c in valid_df.columns if c not in [time_col, target_col] and np.issubdtype(valid_df[c].dtype, np.number)]
    if not feature_cols:
        feature_cols = [target_col]

    # Chronological sort
    valid_df = valid_df.sort_values(by=time_col).reset_index(drop=True)

    # Chronological train (70%), val (15%), test (15%) split (NEVER random shuffle)
    n = len(valid_df)
    train_end = int(n * 0.70)
    val_end = int(n * 0.85)

    df_train = valid_df.iloc[:train_end]
    df_val = valid_df.iloc[train_end:val_end]
    df_test = valid_df.iloc[val_end:]

    # Scale strictly on training set
    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(df_train[feature_cols])
    X_val_s = scaler.transform(df_val[feature_cols])
    X_test_s = scaler.transform(df_test[feature_cols])

    y_train = df_train[target_col].values
    y_val = df_val[target_col].values
    y_test = df_test[target_col].values

    X_train_seq, y_train_seq = create_chronological_sequences(X_train_s, y_train, lookback)
    X_val_seq, y_val_seq = create_chronological_sequences(X_val_s, y_val, lookback)
    X_test_seq, y_test_seq = create_chronological_sequences(X_test_s, y_test, lookback)

    print(f"\n[Step 3/4] Constructed sliding window sequences (lookback={lookback}):")
    print(f"  Training sequences:   {X_train_seq.shape}")
    print(f"  Validation sequences: {X_val_seq.shape}")
    print(f"  Test sequences:       {X_test_seq.shape}")

    # Build model
    model = build_lstm_model(lookback=lookback, num_features=len(feature_cols))
    model.summary()

    callbacks_list = [
        callbacks.EarlyStopping(monitor="val_loss", patience=20, restore_best_weights=True),
        callbacks.ModelCheckpoint(filepath=model_save_path, monitor="val_loss", save_best_only=True)
    ]

    print("\n[Step 4/4] Training LSTM model...")
    history = model.fit(
        X_train_seq, y_train_seq,
        validation_data=(X_val_seq, y_val_seq),
        epochs=100,
        batch_size=32,
        callbacks=callbacks_list,
        verbose=1
    )

    best_model = keras.models.load_model(model_save_path)
    y_pred = best_model.predict(X_test_seq).flatten()

    mae = float(mean_absolute_error(y_test_seq, y_pred))
    mse = float(mean_squared_error(y_test_seq, y_pred))
    rmse = float(np.sqrt(mse))
    r2 = float(r2_score(y_test_seq, y_pred))

    metrics = {
        "status": "COMPLETED",
        "model_name": "Long Short-Term Memory (LSTM)",
        "dataset_path": dataset_path,
        "lookback_window": lookback,
        "features": feature_cols,
        "test_metrics": {
            "MAE": round(mae, 4),
            "MSE": round(mse, 4),
            "RMSE": round(rmse, 4),
            "R2": round(r2, 4)
        }
    }

    with open(metrics_save_path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=4)
    print(f"  Saved LSTM metrics to: {metrics_save_path}")

    # Generate plot
    plt.figure(figsize=(12, 5))
    plt.plot(df_test[time_col].iloc[lookback:], y_test_seq, label="Actual PM2.5", color="blue", alpha=0.7)
    plt.plot(df_test[time_col].iloc[lookback:], y_pred, label="LSTM Forecast", color="red", linestyle="--", alpha=0.8)
    plt.title(f"LSTM Air Pollution Forecasting (Test Set) — R2: {r2:.4f}, RMSE: {rmse:.2f} ug/m3")
    plt.xlabel("Datetime")
    plt.ylabel("PM2.5 (ug/m3)")
    plt.legend()
    plt.tight_layout()
    plot_path = os.path.join(graphs_dir, "lstm_test_forecast.png")
    plt.savefig(plot_path, dpi=300)
    plt.close()
    print(f"  Saved plot to: {plot_path}")

    return metrics


if __name__ == "__main__":
    run_lstm_pipeline()
