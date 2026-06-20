"""
retrain.py — Retrain the XGBoost fault classifier using:
  1.  The original synthetic dataset  (../../Final_Dataset.csv)
  2.  Real-world readings collected   (data/sensor_history.csv)

Run from the backend/ directory:
    python retrain.py

Results (accuracy, precision, recall, specificity, F1, confusion matrix,
feature importances) are printed to the terminal AND saved to:
    data/training_results.json
so the web dashboard can display them at /model.
"""

import json
import os
import sys
from datetime import datetime

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBClassifier

# ── Paths ─────────────────────────────────────────────────────────
BASE         = os.path.dirname(os.path.abspath(__file__))
ORIG_CSV     = os.path.join(BASE, "..", "..", "Final_Dataset.csv")
HISTORY_CSV  = os.path.join(BASE, "data", "sensor_history.csv")
MODEL_OUT    = os.path.join(BASE, "models", "digital_twin_xgboost_model.pkl")
ENC_OUT      = os.path.join(BASE, "models", "fault_type_encoder.pkl")
RESULTS_JSON = os.path.join(BASE, "data", "training_results.json")

# ── Feature columns (must stay in sync with predictor.py) ─────────
FEATURE_COLS = [
    "rpm_reduction_percent",
    "rpm_actual",
    "current",
    "ambient_temperature",
    "ambient_humidity",
    "estimated_temperature",
    "vibration",
    "health_score",
]
TARGET = "fault_type"

ORIG_RENAME = {
    "RPM_Reduction_Percent":    "rpm_reduction_percent",
    "Actual_RPM":               "rpm_actual",
    "Current_A":                "current",
    "Ambient_Temperature_C":    "ambient_temperature",
    "Ambient_Humidity_Percent": "ambient_humidity",
    "Motor_Temperature_C":      "estimated_temperature",
    "Vibration_g":              "vibration",
    "Health_Score":             "health_score",
    "Fault_Type":               "fault_type",
}

def sep(title=""):
    print("\n" + "=" * 56)
    if title:
        print(f"  {title}")
        print("=" * 56)


# ── Helper: per-class specificity from confusion matrix ───────────
def per_class_specificity(cm):
    """
    One-vs-rest specificity for each class i:
        TN_i = total - row_sum_i - col_sum_i + cm[i,i]
        FP_i = col_sum_i - cm[i,i]
        specificity_i = TN_i / (TN_i + FP_i)
    """
    total      = cm.sum()
    row_sums   = cm.sum(axis=1)
    col_sums   = cm.sum(axis=0)
    specs = []
    for i in range(len(cm)):
        tp = cm[i, i]
        tn = total - row_sums[i] - col_sums[i] + tp
        fp = col_sums[i] - tp
        specs.append(tn / (tn + fp) if (tn + fp) > 0 else 0.0)
    return specs


# ─────────────────────────────────────────────────────────────────
# 1. Load original dataset
# ─────────────────────────────────────────────────────────────────
sep("LOADING DATA")

if not os.path.exists(ORIG_CSV):
    print(f"[ERROR] Original dataset not found:\n  {ORIG_CSV}")
    sys.exit(1)

orig = pd.read_csv(ORIG_CSV).rename(columns=ORIG_RENAME)
orig = orig[FEATURE_COLS + [TARGET]].dropna()
print(f"Original dataset : {len(orig):,} rows")

# ─────────────────────────────────────────────────────────────────
# 2. Load history CSV
# ─────────────────────────────────────────────────────────────────
hist_rows = 0
hist_df   = pd.DataFrame()

if os.path.exists(HISTORY_CSV):
    hist_all = pd.read_csv(HISTORY_CSV)
    hist_df  = hist_all[FEATURE_COLS + [TARGET]].dropna()
    known    = set(orig[TARGET].unique())
    hist_df  = hist_df[hist_df[TARGET].isin(known)]
    hist_rows = len(hist_df)
    print(f"History (real)   : {hist_rows:,} rows")
else:
    print("History CSV not found — training on original data only.")

# ─────────────────────────────────────────────────────────────────
# 3. Merge
# ─────────────────────────────────────────────────────────────────
combined = pd.concat([orig, hist_df], ignore_index=True)
print(f"\nCombined total   : {len(combined):,} rows")
print(f"  ↳ original {len(orig):,}  +  history {hist_rows:,}")

sep("CLASS DISTRIBUTION")
dist = combined[TARGET].value_counts()
for fault, count in dist.items():
    pct = count / len(combined) * 100
    bar = "█" * int(pct / 2)
    print(f"  {fault:<20} {count:>5}  {bar}  {pct:.1f}%")

# ─────────────────────────────────────────────────────────────────
# 4. Encode target
# ─────────────────────────────────────────────────────────────────
encoder = LabelEncoder()
combined["_label"] = encoder.fit_transform(combined[TARGET])
classes = list(encoder.classes_)
print(f"\nClasses : {classes}")

X = combined[FEATURE_COLS].astype(float)
y = combined["_label"]

# ─────────────────────────────────────────────────────────────────
# 5. 80 / 20 stratified split
# ─────────────────────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, random_state=42, stratify=y
)
sep("80 / 20 SPLIT")
print(f"  Train : {len(X_train):,} rows   Test : {len(X_test):,} rows")

# ─────────────────────────────────────────────────────────────────
# 6. Baseline — score old model on the same test set
# ─────────────────────────────────────────────────────────────────
old_acc = None
if os.path.exists(MODEL_OUT):
    try:
        old_model = joblib.load(MODEL_OUT)
        old_pred  = old_model.predict(X_test)
        old_acc   = accuracy_score(y_test, old_pred)
        sep("OLD MODEL BASELINE (same test set)")
        print(f"  Accuracy : {old_acc * 100:.2f}%")
    except Exception as e:
        print(f"[WARN] Could not score old model: {e}")

# ─────────────────────────────────────────────────────────────────
# 7. Train new model
# ─────────────────────────────────────────────────────────────────
sep("TRAINING  (XGBoost  500 trees  depth=6  lr=0.05)")
print("  Please wait…")

model = XGBClassifier(
    n_estimators=500,
    max_depth=6,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    objective="multi:softprob",
    num_class=len(classes),
    random_state=42,
    eval_metric="mlogloss",
    verbosity=0,
)
model.fit(X_train, y_train)

# ─────────────────────────────────────────────────────────────────
# 8. Evaluate — all metrics incl. specificity
# ─────────────────────────────────────────────────────────────────
y_pred  = model.predict(X_test)
new_acc = accuracy_score(y_test, y_pred)
cm      = confusion_matrix(y_test, y_pred)
specs   = per_class_specificity(cm)

report  = classification_report(
    y_test, y_pred,
    target_names=classes,
    output_dict=True,
    zero_division=0,
)

# ── Per-class table ───────────────────────────────────────────────
sep("RESULTS")

if old_acc is not None:
    delta = new_acc - old_acc
    sign  = "+" if delta >= 0 else ""
    print(f"  Old accuracy : {old_acc * 100:.2f}%")
    print(f"  New accuracy : {new_acc * 100:.2f}%   ({sign}{delta * 100:.2f}%)")
    if delta < -0.01:
        print("  [WARN] New model is less accurate — consider discarding.")
else:
    print(f"  Accuracy : {new_acc * 100:.2f}%")

col_w = max(len(c) for c in classes)
header = (f"\n  {'Class':<{col_w}}  {'Precision':>10}  {'Recall':>8}"
          f"  {'Specificity':>12}  {'F1-Score':>9}  {'Support':>8}")
print(header)
print("  " + "-" * (col_w + 50))

per_class = {}
for i, cls in enumerate(classes):
    r   = report[cls]
    sp  = specs[i]
    pre = r["precision"]
    rec = r["recall"]
    f1  = r["f1-score"]
    sup = int(r["support"])
    print(f"  {cls:<{col_w}}  {pre:>10.4f}  {rec:>8.4f}"
          f"  {sp:>12.4f}  {f1:>9.4f}  {sup:>8}")
    per_class[cls] = {
        "precision":   round(pre, 4),
        "recall":      round(rec, 4),
        "specificity": round(sp, 4),
        "f1_score":    round(f1, 4),
        "support":     sup,
    }

macro = report["macro avg"]
print("  " + "-" * (col_w + 50))
print(f"  {'macro avg':<{col_w}}  {macro['precision']:>10.4f}  {macro['recall']:>8.4f}"
      f"  {np.mean(specs):>12.4f}  {macro['f1-score']:>9.4f}")

# ── Confusion matrix ──────────────────────────────────────────────
sep("CONFUSION MATRIX  (row=actual  col=predicted)")
print("  " + "  ".join(f"{c[:8]:>8}" for c in classes))
for i, cls in enumerate(classes):
    row_str = "  ".join(f"{cm[i, j]:>8}" for j in range(len(classes)))
    print(f"  {cls[:8]:<8}  {row_str}")

# ── Feature importances ───────────────────────────────────────────
sep("FEATURE IMPORTANCES")
imp_df = pd.DataFrame({
    "feature":    FEATURE_COLS,
    "importance": model.feature_importances_,
}).sort_values("importance", ascending=False)

feature_importances = {}
for _, row in imp_df.iterrows():
    bar = "█" * int(row["importance"] * 40)
    print(f"  {row['feature']:<30} {bar:<20}  {row['importance']:.4f}")
    feature_importances[row["feature"]] = round(float(row["importance"]), 4)

# ─────────────────────────────────────────────────────────────────
# 9. Save results JSON (always — before asking to save model)
# ─────────────────────────────────────────────────────────────────
os.makedirs(os.path.join(BASE, "data"), exist_ok=True)

results = {
    "trained_at":          datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    "dataset": {
        "original_rows": len(orig),
        "history_rows":  hist_rows,
        "total_rows":    len(combined),
        "train_rows":    len(X_train),
        "test_rows":     len(X_test),
    },
    "classes":             classes,
    "accuracy":            round(new_acc, 4),
    "old_accuracy":        round(old_acc, 4) if old_acc is not None else None,
    "macro_precision":     round(macro["precision"], 4),
    "macro_recall":        round(macro["recall"], 4),
    "macro_specificity":   round(float(np.mean(specs)), 4),
    "macro_f1":            round(macro["f1-score"], 4),
    "per_class":           per_class,
    "confusion_matrix":    cm.tolist(),
    "feature_importances": feature_importances,
}

with open(RESULTS_JSON, "w") as f:
    json.dump(results, f, indent=2)

print(f"\n  Results saved → {RESULTS_JSON}")
print(  "  View in browser at  http://127.0.0.1:5173/model")

# ─────────────────────────────────────────────────────────────────
# 10. Confirm model save
# ─────────────────────────────────────────────────────────────────
sep("SAVE MODEL")
try:
    answer = input("  Save new model and encoder? (y/n): ").strip().lower()
except EOFError:
    answer = "n"

if answer == "y":
    joblib.dump(model,   MODEL_OUT)
    joblib.dump(encoder, ENC_OUT)
    print(f"\n  Saved → {MODEL_OUT}")
    print(f"  Saved → {ENC_OUT}")
    print("  Restart app.py to activate the retrained model.")
else:
    print("\n  Model discarded — existing .pkl files unchanged.")
