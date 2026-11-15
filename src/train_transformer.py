"""
src/train_transformer.py
------------------------
Phase 4 Track B: Transformer-based Deep Learning Model for Air Pollution Time-Series Forecasting.

Key Architecture & Concepts:
- Positional Encoding: Captures order of time steps without recurrence.
- Multi-Head Self-Attention: Learns complex temporal correlations across previous lookback intervals.
- Layer Normalization & Residual Additions: Stabilizes gradient flow across deep attention blocks.
- Chronological Splits: Strictly prevents lookahead data leakage.

Scientific Validation & Constraints:
- Transformer time-series models require real, chronologically continuous time-stamped records.
- Inventing dates, shuffling rows, or reshaping tabular cross-sectional data into fake sequences
  violates scientific validity and invalidates research conclusions.
- If a genuine timestamped dataset is present (e.g., dataset/delhi_timeseries_cpcb.csv), this module
  executes full training, validation, and evaluation.
- If no timestamped dataset exists, it reports Track B as blocked pending chronological data.
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


class PositionalEncoding(layers.Layer):
    """Adds sinusoids of varying frequencies to sequence inputs to encode temporal position."""
    def __init__(self, sequence_length, d_model, **kwargs):
        super().__init__(**kwargs)
        self.sequence_length = sequence_length
        self.d_model = d_model
        # Compute positional encodings once in log space
        pos = np.arange(sequence_length)[:, np.newaxis]
        i = np.arange(d_model)[np.newaxis, :]
        angle_rates = 1 / np.power(10000, (2 * (i // 2)) / np.float32(d_model))
        angle_rads = pos * angle_rates

        # Apply sin to even indices, cos to odd
        sines = np.sin(angle_rads[:, 0::2])
        cosines = np.cos(angle_rads[:, 1::2])
        pos_encoding = np.concatenate([sines, cosines], axis=-1)
        self.pos_encoding = tf.constant(pos_encoding[np.newaxis, ...], dtype=tf.float32)

    def call(self, inputs):
        # inputs shape: (batch_size, sequence_length, d_model)
        return inputs + self.pos_encoding[:, :tf.shape(inputs)[1], :]


def build_transformer_model(lookback=24, num_features=5, head_size=32, num_heads=4, ff_dim=64, dropout=0.2):
    """
    Construct a Transformer encoder model for time-series PM2.5 forecasting.
    """
    inputs = layers.Input(shape=(lookback, num_features), name="timeseries_input")

    # Project features to d_model space if needed
    d_model = 32
    x = layers.Dense(d_model, name="feature_projection")(inputs)
    x = PositionalEncoding(sequence_length=lookback, d_model=d_model, name="positional_encoding")(x)

    # Transformer Encoder Block
    # 1. Multi-Head Self-Attention
    attn_output = layers.MultiHeadAttention(num_heads=num_heads, key_dim=head_size, dropout=dropout, name="self_attention")(x, x)
    x = layers.Add(name="residual_1")([x, attn_output])
    x = layers.LayerNormalization(epsilon=1e-6, name="layer_norm_1")(x)

    # 2. Feed-Forward Network
    ffn_output = layers.Dense(ff_dim, activation="relu", name="ffn_dense_1")(x)
    ffn_output = layers.Dropout(dropout, name="ffn_dropout")(ffn_output)
    ffn_output = layers.Dense(d_model, name="ffn_dense_2")(ffn_output)
    x = layers.Add(name="residual_2")([x, ffn_output])
    x = layers.LayerNormalization(epsilon=1e-6, name="layer_norm_2")(x)

    # Global pooling & output regression head
    x = layers.GlobalAveragePooling1D(name="global_pooling")(x)
    x = layers.Dropout(dropout, name="head_dropout")(x)
    x = layers.Dense(32, activation="relu", name="head_dense")(x)
    outputs = layers.Dense(1, activation="linear", name="pm25_forecast")(x)

    model = keras.Model(inputs=inputs, outputs=outputs, name="AirPollution_Transformer")
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss="mean_squared_error",
        metrics=["mae"]
    )
    return model


def inspect_timeseries_dataset(file_path):
    """Validate whether a given file contains genuine chronological time-series data."""
    if not os.path.exists(file_path):
        return None, f"File not found at: {file_path}"
    try:
        df = pd.read_csv(file_path) if file_path.endswith(".csv") else pd.read_excel(file_path)
    except Exception as e:
        return None, f"Failed to read file: {e}"

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
    """Construct genuine time-series sliding window sequences for Transformer regression."""
    X_seq, y_seq = [], []
    for i in range(len(X_scaled) - lookback):
        X_seq.append(X_scaled[i : i + lookback])
        y_seq.append(y_values[i + lookback])
    return np.array(X_seq), np.array(y_seq)


def run_transformer_pipeline(
    dataset_path="dataset/delhi_timeseries_cpcb.csv",
    model_save_path="models/transformer_model.keras",
    metrics_save_path="results/metrics/transformer_metrics.json",
    graphs_dir="results/graphs/transformer",
    lookback=24,
    random_state=42
):
    """
    Train, validate, and evaluate the Transformer model if a genuine timestamped dataset exists.
    Otherwise, log the scientific limitation and mark Track B as blocked.
    """
    print("\n" + "=" * 70)
    print("PHASE 4 TRACK B: TRANSFORMER TIME-SERIES FORECASTING MODEL")
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
        print("SCIENTIFIC NOTICE: TRACK B (TRANSFORMER FORECASTING) IS CURRENTLY BLOCKED")
        print("!" * 70)
        print("Reason: The existing workspace dataset 'dataset/Delhi Final(1).xlsx' is a tabular")
        print("dataset with NO genuine date, time, or timestamp column.")
        print("\nPer strict scientific integrity and capstone project instructions:")
        print("  1. We DO NOT invent synthetic dates or hourly timestamps.")
        print("  2. We DO NOT treat consecutive tabular rows as consecutive time intervals.")
        print("  3. We DO NOT reshape static tabular data into fake sequences.")
        print("  4. Transformer self-attention requires true chronological sequence dependency.")
        print(f"\nChecked candidate paths: {candidate_paths}")
        print(f"Status Note: {validation_note}")
        print("\nTO UNBLOCK TRACK B:")
        print("  Place a valid hourly or daily CPCB/OpenAQ dataset containing a 'datetime' column")
        print(f"  and 'PM2.5' at '{dataset_path}', then re-run this script.")
        print("!" * 70 + "\n")
        return {
            "status": "BLOCKED",
            "model_name": "Transformer Time-Series Regressor",
            "reason": "Missing genuine chronological timestamp column in dataset.",
            "unblock_instructions": f"Provide chronological time-series dataset at {dataset_path}."
        }

    # If valid timestamped dataset is found, proceed with full training
    print(f"\n[Step 2/4] Valid timestamped dataset found! {validation_note}")
    set_reproducible_seeds(random_state)
    os.makedirs(os.path.dirname(model_save_path), exist_ok=True)
    os.makedirs(os.path.dirname(metrics_save_path), exist_ok=True)
    os.makedirs(graphs_dir, exist_ok=True)

    target_col = [c for c in valid_df.columns if c.lower() == "pm2.5" or c.lower() == "pm25"][0]
    time_col = [c for c in valid_df.columns if any(t in c.lower() for t in ["date", "time", "timestamp"])][0]
    feature_cols = [c for c in valid_df.columns if c not in [time_col, target_col] and np.issubdtype(valid_df[c].dtype, np.number)]
    if not feature_cols:
        feature_cols = [target_col]

    valid_df = valid_df.sort_values(by=time_col).reset_index(drop=True)

    n = len(valid_df)
    train_end = int(n * 0.70)
    val_end = int(n * 0.85)

    df_train = valid_df.iloc[:train_end]
    df_val = valid_df.iloc[train_end:val_end]
    df_test = valid_df.iloc[val_end:]

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

    model = build_transformer_model(lookback=lookback, num_features=len(feature_cols))
    model.summary()

    callbacks_list = [
        callbacks.EarlyStopping(monitor="val_loss", patience=20, restore_best_weights=True),
        callbacks.ModelCheckpoint(filepath=model_save_path, monitor="val_loss", save_best_only=True)
    ]

    print("\n[Step 4/4] Training Transformer model...")
    history = model.fit(
        X_train_seq, y_train_seq,
        validation_data=(X_val_seq, y_val_seq),
        epochs=100,
        batch_size=32,
        callbacks=callbacks_list,
        verbose=1
    )

    best_model = keras.models.load_model(model_save_path, custom_objects={"PositionalEncoding": PositionalEncoding})
    y_pred = best_model.predict(X_test_seq).flatten()

    mae = float(mean_absolute_error(y_test_seq, y_pred))
    mse = float(mean_squared_error(y_test_seq, y_pred))
    rmse = float(np.sqrt(mse))
    r2 = float(r2_score(y_test_seq, y_pred))

    metrics = {
        "status": "COMPLETED",
        "model_name": "Transformer Time-Series Regressor",
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
    print(f"  Saved Transformer metrics to: {metrics_save_path}")

    plt.figure(figsize=(12, 5))
    plt.plot(df_test[time_col].iloc[lookback:], y_test_seq, label="Actual PM2.5", color="blue", alpha=0.7)
    plt.plot(df_test[time_col].iloc[lookback:], y_pred, label="Transformer Forecast", color="purple", linestyle="--", alpha=0.8)
    plt.title(f"Transformer Air Pollution Forecasting (Test Set) — R2: {r2:.4f}, RMSE: {rmse:.2f} ug/m3")
    plt.xlabel("Datetime")
    plt.ylabel("PM2.5 (ug/m3)")
    plt.legend()
    plt.tight_layout()
    plot_path = os.path.join(graphs_dir, "transformer_test_forecast.png")
    plt.savefig(plot_path, dpi=300)
    plt.close()
    print(f"  Saved plot to: {plot_path}")

    return metrics


if __name__ == "__main__":
    run_transformer_pipeline()
