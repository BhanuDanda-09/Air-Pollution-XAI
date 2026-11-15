"""
src/train_mlp.py
----------------
Phase 4: Multilayer Perceptron (MLP) Deep Learning Model for Air Pollution Prediction.

Responsibilities:
1. Load cleaned dataset and reproduce the exact 80/20 train-test split (seed=42).
2. Fit median imputer and StandardScaler strictly on training partition (X_train) to prevent data leakage.
3. Partition training data into sub-train (85%) and validation (15%) sets for early stopping and hyperparameter monitoring.
4. Construct a deep Multilayer Perceptron (MLP) using TensorFlow/Keras.
5. Train with Adam optimizer, MSE loss, MAE metric, EarlyStopping, and ModelCheckpoint.
6. Evaluate on the untouched 406 held-out test observations (MAE, MSE, RMSE, R²).
7. Save model to models/mlp_model.keras, scaler to models/mlp_scaler.pkl, history to results/metrics/mlp_training_history.csv,
   metrics to results/metrics/mlp_metrics.json, and graphs to results/graphs/mlp/.
"""

import os
import sys

# Ensure root directory is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Matplotlib configuration for headless environment
os.environ["MPLCONFIGDIR"] = os.path.abspath(".matplotlib_cache")
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"

import json
import random
import joblib
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns

import tensorflow as tf
import keras
from keras import layers, regularizers, callbacks
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from src.preprocessing import preprocess_data, get_feature_target_names


def set_reproducible_seeds(seed=42):
    """Set seeds across Python, NumPy, and TensorFlow for reproducibility."""
    random.seed(seed)
    np.random.seed(seed)
    tf.random.set_seed(seed)
    keras.utils.set_random_seed(seed)


def build_mlp_model(input_dim=5, learning_rate=0.001):
    """
    Construct a Multilayer Perceptron regression model matching the capstone specification.

    Architecture:
    - Input: 5 meteorological features (RH, WD, SR, BP, AT)
    - Hidden Layer 1: 128 neurons, ReLU activation, L2 weight regularizer (1e-4)
    - Dropout(0.2)
    - Hidden Layer 2: 64 neurons, ReLU activation, L2 weight regularizer (1e-4)
    - Dropout(0.1)
    - Hidden Layer 3: 32 neurons, ReLU activation
    - Output Layer: 1 neuron, linear activation
    """
    model = keras.Sequential([
        layers.Input(shape=(input_dim,), name="meteorological_input"),
        layers.Dense(128, activation="relu", kernel_regularizer=regularizers.l2(1e-4), name="hidden_layer_1"),
        layers.Dropout(0.2, name="dropout_1"),
        layers.Dense(64, activation="relu", kernel_regularizer=regularizers.l2(1e-4), name="hidden_layer_2"),
        layers.Dropout(0.1, name="dropout_2"),
        layers.Dense(32, activation="relu", name="hidden_layer_3"),
        layers.Dense(1, activation="linear", name="pm25_output"),
    ], name="AirPollution_MLP")

    optimizer = keras.optimizers.Adam(learning_rate=learning_rate)
    model.compile(
        optimizer=optimizer,
        loss="mean_squared_error",
        metrics=["mae"]
    )
    return model


def train_mlp(
    model_save_path="models/mlp_model.keras",
    scaler_save_path="models/mlp_scaler.pkl",
    metrics_save_path="results/metrics/mlp_metrics.json",
    history_save_path="results/metrics/mlp_training_history.csv",
    graphs_dir="results/graphs/mlp",
    epochs=200,
    batch_size=32,
    validation_split=0.15,
    random_state=42
):
    """
    Train, validate, evaluate, and save the Multilayer Perceptron (MLP) model.
    """
    set_reproducible_seeds(random_state)
    os.makedirs(os.path.dirname(model_save_path), exist_ok=True)
    os.makedirs(os.path.dirname(metrics_save_path), exist_ok=True)
    os.makedirs(graphs_dir, exist_ok=True)

    print("=" * 70)
    print("PHASE 4 TRACK A: MULTILAYER PERCEPTRON (MLP) DEEP LEARNING")
    print("=" * 70)

    # 1. Load data via standard preprocessing pipeline
    print("\n[Step 1/6] Loading preprocessed dataset (80/20 train/test split)...")
    data = preprocess_data(random_state=random_state)
    X_train_df = data["X_train"]
    X_test_df = data["X_test"]
    y_train_s = data["y_train"]
    y_test_s = data["y_test"]
    features, target = get_feature_target_names()

    print(f"  Training set:   {X_train_df.shape[0]} samples, {len(features)} features: {features}")
    print(f"  Held-out test:  {X_test_df.shape[0]} samples (identical to Phase 1 & 2)")

    # 2. Partition training data FIRST into sub-train (85%) and validation (15%) subsets
    # This guarantees the validation subset remains completely unseen during imputer & scaler fitting
    print(f"\n[Step 2/6] Splitting training set into sub-train ({1-validation_split:.0%}) and validation ({validation_split:.0%})...")
    X_tr_df, X_val_df, y_tr, y_val = train_test_split(
        X_train_df,
        y_train_s.values,
        test_size=validation_split,
        random_state=random_state
    )
    print(f"  Sub-training samples (fitted): {X_tr_df.shape[0]}")
    print(f"  Validation samples (holdout):  {X_val_df.shape[0]}")

    # 3. Fit SimpleImputer and StandardScaler STRICTLY on X_tr_df (Zero Leakage)
    print("\n[Step 3/6] Fitting Preprocessing Pipeline (Median Imputer + StandardScaler) STRICTLY on X_tr_df...")
    preprocessor = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler())
    ])

    X_tr = preprocessor.fit_transform(X_tr_df)
    X_val = preprocessor.transform(X_val_df)
    X_test_scaled = preprocessor.transform(X_test_df)
    joblib.dump(preprocessor, scaler_save_path)
    print(f"  Saved strictly fitted preprocessing scaler pipeline to: {scaler_save_path}")
    print(f"  Validation samples:   {X_val.shape[0]}")

    # 4. Build and Compile Model
    print("\n[Step 4/6] Constructing MLP Architecture...")
    model = build_mlp_model(input_dim=len(features), learning_rate=0.001)
    model.summary()

    # Callbacks
    early_stop = callbacks.EarlyStopping(
        monitor="val_loss",
        patience=25,
        restore_best_weights=True,
        verbose=1
    )
    reduce_lr = callbacks.ReduceLROnPlateau(
        monitor="val_loss",
        factor=0.5,
        patience=10,
        min_lr=1e-5,
        verbose=1
    )
    checkpoint = callbacks.ModelCheckpoint(
        filepath=model_save_path,
        monitor="val_loss",
        save_best_only=True,
        verbose=0
    )

    # 5. Train Model
    print("\n[Step 5/6] Training MLP with EarlyStopping and ModelCheckpoint...")
    history = model.fit(
        X_tr,
        y_tr,
        validation_data=(X_val, y_val),
        epochs=epochs,
        batch_size=batch_size,
        callbacks=[early_stop, reduce_lr, checkpoint],
        verbose=1
    )

    # Reload best saved model to ensure exact best weights
    best_model = keras.models.load_model(model_save_path)
    print(f"  Best model loaded from: {model_save_path}")

    # Save training history
    history_df = pd.DataFrame(history.history)
    history_df.index.name = "epoch"
    history_df.to_csv(history_save_path)
    print(f"  Saved training history to: {history_save_path}")

    # 6. Evaluation on Held-out Test Set
    print("\n[Step 6/6] Evaluating on 406 Held-Out Test Observations...")
    y_test_pred = best_model.predict(X_test_scaled, verbose=0).flatten()

    mae = float(mean_absolute_error(y_test_s, y_test_pred))
    mse = float(mean_squared_error(y_test_s, y_test_pred))
    rmse = float(np.sqrt(mse))
    r2 = float(r2_score(y_test_s, y_test_pred))

    val_loss = float(np.min(history.history["val_loss"]))
    val_mae = float(np.min(history.history["val_mae"]))
    stopped_epoch = int(len(history.history["loss"]))

    metrics = {
        "model_name": "Multilayer Perceptron (MLP)",
        "framework": "TensorFlow/Keras",
        "keras_version": str(keras.__version__),
        "tensorflow_version": str(tf.__version__),
        "input_features": features,
        "target_variable": target,
        "training_samples": int(X_tr.shape[0]),
        "validation_samples": int(X_val.shape[0]),
        "test_samples": int(X_test_scaled.shape[0]),
        "epochs_trained": stopped_epoch,
        "best_val_loss_mse": round(val_loss, 4),
        "best_val_mae": round(val_mae, 4),
        "test_metrics": {
            "MAE": round(mae, 4),
            "MSE": round(mse, 4),
            "RMSE": round(rmse, 4),
            "R2": round(r2, 4)
        }
    }

    with open(metrics_save_path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=4)
    print(f"  Saved evaluation metrics to: {metrics_save_path}")

    print("\n" + "=" * 50)
    print(f"MLP TEST RESULTS:")
    print(f"  MAE:   {mae:.4f} ug/m3")
    print(f"  MSE:   {mse:.4f}")
    print(f"  RMSE:  {rmse:.4f} ug/m3")
    print(f"  R2:    {r2:.4f}")
    print("=" * 50)

    # Generate Graphs
    generate_mlp_plots(history_df, y_test_s.values, y_test_pred, metrics, graphs_dir)

    return best_model, preprocessor, metrics


def generate_mlp_plots(history_df, y_true, y_pred, metrics, output_dir):
    """Generate all required MLP diagnostic and evaluation plots."""
    sns.set_theme(style="whitegrid", font_scale=1.1)

    # 1. Training & Validation Loss Curve
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))
    epochs = range(1, len(history_df) + 1)

    ax1.plot(epochs, history_df["loss"], label="Train Loss (MSE)", color="#2b5c8f", lw=2)
    ax1.plot(epochs, history_df["val_loss"], label="Validation Loss (MSE)", color="#d95f02", lw=2, linestyle="--")
    ax1.set_title("MLP Loss Convergence (MSE)", fontsize=13, weight="bold")
    ax1.set_xlabel("Epoch")
    ax1.set_ylabel("Mean Squared Error")
    ax1.legend(frameon=True)

    ax2.plot(epochs, history_df["mae"], label="Train MAE", color="#2b5c8f", lw=2)
    ax2.plot(epochs, history_df["val_mae"], label="Validation MAE", color="#d95f02", lw=2, linestyle="--")
    ax2.set_title("MLP Mean Absolute Error Convergence", fontsize=13, weight="bold")
    ax2.set_xlabel("Epoch")
    ax2.set_ylabel("MAE (ug/m3)")
    ax2.legend(frameon=True)

    plt.tight_layout()
    loss_path = os.path.join(output_dir, "mlp_loss_curve.png")
    fig.savefig(loss_path, dpi=300)
    plt.close(fig)
    print(f"  Generated: {loss_path}")

    # 2. Actual vs Predicted PM2.5 Scatter
    fig, ax = plt.subplots(figsize=(7, 6))
    ax.scatter(y_true, y_pred, alpha=0.55, color="#1b9e77", edgecolors="w", s=45, label="Test Predictions")
    min_val = min(y_true.min(), y_pred.min())
    max_val = max(y_true.max(), y_pred.max())
    ax.plot([min_val, max_val], [min_val, max_val], "r--", lw=2, label="Perfect Fit (y = x)")
    ax.set_title(f"MLP Actual vs. Predicted PM2.5 (Test Set)\nR2 = {metrics['test_metrics']['R2']:.4f}, RMSE = {metrics['test_metrics']['RMSE']:.2f} ug/m3", fontsize=12, weight="bold")
    ax.set_xlabel("Actual PM2.5 (ug/m3)")
    ax.set_ylabel("Predicted PM2.5 (ug/m3)")
    ax.legend(frameon=True)
    plt.tight_layout()
    act_pred_path = os.path.join(output_dir, "mlp_actual_vs_predicted.png")
    fig.savefig(act_pred_path, dpi=300)
    plt.close(fig)
    print(f"  Generated: {act_pred_path}")

    # 3. Residual Plot
    residuals = y_true - y_pred
    fig, ax = plt.subplots(figsize=(8, 5))
    ax.scatter(y_pred, residuals, alpha=0.55, color="#7570b3", edgecolors="w", s=45)
    ax.axhline(0, color="red", linestyle="--", lw=2)
    ax.set_title("MLP Residual Plot (Residuals vs Predicted PM2.5)", fontsize=13, weight="bold")
    ax.set_xlabel("Predicted PM2.5 (ug/m3)")
    ax.set_ylabel("Residual (Actual - Predicted) (ug/m3)")
    plt.tight_layout()
    res_path = os.path.join(output_dir, "mlp_residual_plot.png")
    fig.savefig(res_path, dpi=300)
    plt.close(fig)
    print(f"  Generated: {res_path}")

    # 4. Prediction Error Distribution
    fig, ax = plt.subplots(figsize=(8, 5))
    sns.histplot(residuals, kde=True, color="#e7298a", bins=30, ax=ax, edgecolor="black")
    ax.axvline(0, color="darkblue", linestyle="--", lw=1.5, label="Zero Error")
    ax.axvline(np.mean(residuals), color="red", linestyle="-", lw=1.5, label=f"Mean Error ({np.mean(residuals):.2f})")
    ax.set_title("MLP Prediction Error Distribution (Residuals)", fontsize=13, weight="bold")
    ax.set_xlabel("Residual Error (ug/m3)")
    ax.set_ylabel("Frequency")
    ax.legend(frameon=True)
    plt.tight_layout()
    err_path = os.path.join(output_dir, "mlp_prediction_error_distribution.png")
    fig.savefig(err_path, dpi=300)
    plt.close(fig)
    print(f"  Generated: {err_path}")

    # 5. Multi-panel Model Performance Summary Dashboard
    fig = plt.figure(figsize=(15, 10))
    gs = fig.add_gridspec(2, 2)

    # Panel 1: Loss curves
    ax_a = fig.add_subplot(gs[0, 0])
    ax_a.plot(epochs, history_df["loss"], label="Train Loss", color="#2b5c8f", lw=2)
    ax_a.plot(epochs, history_df["val_loss"], label="Val Loss", color="#d95f02", lw=2, linestyle="--")
    ax_a.set_title("A. Learning Curves (MSE Loss)", weight="bold")
    ax_a.set_xlabel("Epoch")
    ax_a.set_ylabel("MSE")
    ax_a.legend()

    # Panel 2: Actual vs Predicted
    ax_b = fig.add_subplot(gs[0, 1])
    ax_b.scatter(y_true, y_pred, alpha=0.5, color="#1b9e77", s=35)
    ax_b.plot([min_val, max_val], [min_val, max_val], "r--", lw=2)
    ax_b.set_title(f"B. Actual vs. Predicted (R2: {metrics['test_metrics']['R2']:.4f})", weight="bold")
    ax_b.set_xlabel("Actual PM2.5 (ug/m3)")
    ax_b.set_ylabel("Predicted PM2.5 (ug/m3)")

    # Panel 3: Residuals
    ax_c = fig.add_subplot(gs[1, 0])
    ax_c.scatter(y_pred, residuals, alpha=0.5, color="#7570b3", s=35)
    ax_c.axhline(0, color="red", linestyle="--")
    ax_c.set_title("C. Residuals vs. Predicted", weight="bold")
    ax_c.set_xlabel("Predicted PM2.5 (ug/m3)")
    ax_c.set_ylabel("Residual (ug/m3)")

    # Panel 4: Error Histogram + Metrics Card
    ax_d = fig.add_subplot(gs[1, 1])
    sns.histplot(residuals, kde=True, color="#e7298a", bins=25, ax=ax_d)
    ax_d.set_title("D. Prediction Error Distribution", weight="bold")
    ax_d.set_xlabel("Residual (ug/m3)")

    # Inset metrics text box
    summary_text = (
        f"MLP Test Metrics:\n"
        f"  * MAE:  {metrics['test_metrics']['MAE']:.2f} ug/m3\n"
        f"  * RMSE: {metrics['test_metrics']['RMSE']:.2f} ug/m3\n"
        f"  * MSE:  {metrics['test_metrics']['MSE']:.2f}\n"
        f"  * R2:   {metrics['test_metrics']['R2']:.4f}\n"
        f"  * Stopped Epoch: {metrics['epochs_trained']}"
    )
    ax_d.text(0.95, 0.95, summary_text, transform=ax_d.transAxes, fontsize=10,
              verticalalignment="top", horizontalalignment="right",
              bbox=dict(boxstyle="round,pad=0.5", facecolor="wheat", alpha=0.85))

    plt.suptitle("Multilayer Perceptron (MLP) Deep Learning Performance Dashboard", fontsize=15, weight="bold")
    plt.tight_layout()
    summary_path = os.path.join(output_dir, "mlp_performance_summary.png")
    fig.savefig(summary_path, dpi=300)
    plt.close(fig)
    print(f"  Generated: {summary_path}")


if __name__ == "__main__":
    train_mlp()
