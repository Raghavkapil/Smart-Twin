import csv
import json
import os
from datetime import datetime
from threading import Lock

from flask import Flask, jsonify, send_file
from flask_cors import CORS

from serial_reader import get_motor_data
from predictor import predict_fault

app = Flask(__name__)
CORS(app)

# ── CSV storage ─────────────────────────────────────────────
CSV_DIR  = os.path.join(os.path.dirname(__file__), "data")
CSV_PATH = os.path.join(CSV_DIR, "sensor_history.csv")
CSV_LOCK = Lock()

CSV_FIELDS = [
    "timestamp",
    "rpm_reduction_percent", "rpm_actual",
    "current", "expected_current", "current_deviation_percent",
    "efficiency_index",
    "ambient_temperature", "ambient_humidity", "estimated_temperature",
    "vibration", "vibration_level",
    "health_score", "fault_type", "failure_probability", "maintenance",
]

def _ensure_csv():
    os.makedirs(CSV_DIR, exist_ok=True)
    if not os.path.exists(CSV_PATH):
        with open(CSV_PATH, "w", newline="") as f:
            csv.DictWriter(f, fieldnames=CSV_FIELDS).writeheader()

_ensure_csv()

def _append_row(data: dict):
    with CSV_LOCK:
        with open(CSV_PATH, "a", newline="") as f:
            w = csv.DictWriter(f, fieldnames=CSV_FIELDS, extrasaction="ignore")
            w.writerow(data)

# ── Routes ───────────────────────────────────────────────────

@app.route("/")
def home():
    return {"status": "running", "project": "SmartTwin"}


@app.route("/api/motor")
def motor():
    sensor_data = get_motor_data()

    prediction = predict_fault(
        sensor_data["rpm_reduction_percent"],
        sensor_data["current"],
        sensor_data["ambient_temperature"],
        sensor_data["ambient_humidity"],
        sensor_data["vibration"],
        sensor_data["vibration_level"],
    )

    response = {
        "motor_name": "12V Geared DC Motor",
        **sensor_data,
        **prediction,
    }

    # Save to CSV only when ESP is live (skip stale/zero data)
    if sensor_data.get("esp_connected"):
        row = {"timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"), **response}
        _append_row(row)

    return jsonify(response)


@app.route("/api/history")
def history():
    if not os.path.exists(CSV_PATH):
        return jsonify({"rows": [], "total": 0})

    with CSV_LOCK:
        with open(CSV_PATH, "r", newline="") as f:
            rows = list(csv.DictReader(f))

    total = len(rows)
    # Return newest-first, capped at 2000 rows to keep response fast
    return jsonify({"rows": list(reversed(rows[-2000:])), "total": total})


@app.route("/api/training-results")
def training_results():
    results_path = os.path.join(os.path.dirname(__file__), "data", "training_results.json")
    if not os.path.exists(results_path):
        return jsonify({"error": "No training results yet. Run retrain.py first."}), 404
    with open(results_path) as f:
        return jsonify(json.load(f))


@app.route("/api/history/export")
def history_export():
    """Return the raw CSV file for browser download."""
    if not os.path.exists(CSV_PATH):
        return ("No data yet", 404)
    return send_file(CSV_PATH, mimetype="text/csv",
                     as_attachment=True, download_name="sensor_history.csv")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=False, threaded=True)
