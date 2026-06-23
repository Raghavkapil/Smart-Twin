# 🤖 SmartTwin — AI-Enabled Digital Twin for Predictive Maintenance

<p align="center">
  <img src="https://img.shields.io/badge/Platform-ESP32-blue?style=for-the-badge&logo=espressif" />
  <img src="https://img.shields.io/badge/ML-XGBoost-orange?style=for-the-badge&logo=python" />
  <img src="https://img.shields.io/badge/Backend-Python%20Flask-green?style=for-the-badge&logo=python" />
  <img src="https://img.shields.io/badge/Frontend-React%20%2B%20Vite-purple?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/Protocol-HTTP%20%2F%20Local%20Network-yellow?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Industry-4.0-red?style=for-the-badge" />
</p>

> SmartTwin creates a virtual replica of an industrial motor, ingests real-time sensor data over HTTP, classifies fault states using a pre-trained XGBoost model, and displays live telemetry on a React dashboard — enabling predictive maintenance before failures occur.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [System Architecture](#-system-architecture)
- [Features](#-features)
- [Hardware & Sensors](#-hardware--sensors)
- [Fault Classification](#-fault-classification)
- [ML Pipeline](#-ml-pipeline)
- [Repository Structure](#-repository-structure)
- [Getting Started](#-getting-started)
- [Dataset](#-dataset)
- [Model Performance](#-model-performance)
- [Tech Stack](#-tech-stack)

---

## 🔍 Overview

SmartTwin is an end-to-end **Industry 4.0 / IIoT** project demonstrating a complete predictive maintenance pipeline:

```
Physical Motor → ESP32 Sensors → HTTP (Local Network) → Python Backend → React Dashboard
                                                                ↓
                                                     XGBoost ML Model
                                                  (Fault Classification)
```

The ESP32 reads vibration, temperature, current, humidity, and RPM from a running motor and sends the data over **HTTP to a Python Flask backend** on the same local network. The backend runs the ML model and streams results to the React frontend in real time.

---

## 🏗 System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     PHYSICAL LAYER                        │
│   Motor → MPU6050 · LM35 · DHT22 · ACS712 · Encoder     │
│                        ESP32                              │
└─────────────────────┬────────────────────────────────────┘
                      │ HTTP POST (same Wi-Fi network)
┌─────────────────────▼────────────────────────────────────┐
│                   BACKEND LAYER                           │
│          Python Flask — app.py                            │
│               XGBoost Classifier                          │
│          (Fault Detection & Prediction)                   │
└─────────────────────┬────────────────────────────────────┘
                      │ REST API
┌─────────────────────▼────────────────────────────────────┐
│                  FRONTEND LAYER                           │
│       React + Vite — npm run dev                          │
│   Live Telemetry · Fault Alerts · Digital Twin UI         │
└──────────────────────────────────────────────────────────┘
```

> Both the ESP32 and the computer running the backend **must be on the same Wi-Fi network.**

---

## ✨ Features

- **Real-time sensor streaming** over HTTP from ESP32 to backend
- **6-class fault classification** using a pre-trained XGBoost model (no retraining required to run)
- **Vibration severity levels**: NONE / LOW / MEDIUM / HIGH / CRITICAL
- **Live React dashboard** showing RPM, temperature, current, humidity, and fault state
- **Predictive alerts** — flags anomalies before equipment fails
- **Retrain support** via `retrain.py` using your own data
- **Full model comparison** across 6 ML algorithms (notebooks included)

---

## 🔧 Hardware & Sensors

| Sensor | Parameter Measured | ESP32 Interface |
|--------|-------------------|-----------------|
| **MPU6050** | Vibration (Accel/Gyro) | I²C — SDA: GPIO23, SCL: GPIO22 |
| **LM35** | Motor Temperature (°C) | Analog — GPIO34 |
| **DHT22** | Ambient Temp & Humidity | Digital — GPIO4 |
| **ACS712** | Motor Current (A) | Analog — GPIO35 |
| **Rotary Encoder** | RPM | Digital — GPIO18/19 |

> **Note:** Clone MPU6050 modules (WHO_AM_I = `0x70`) are supported via a firmware workaround. SDA is mapped to GPIO23 (not the default GPIO21) to avoid I²C conflicts.

**CSV output format from ESP32:**
```
RPM, Current (A), Temperature (°C), Humidity (%), Vibration (g), Vibration_Level
```

---

## 🚨 Fault Classification

The ML model classifies the motor's operating state into **6 classes**:

| Class | Description |
|-------|-------------|
| `Normal` | Motor running within healthy parameters |
| `Overload` | Current draw exceeds rated threshold |
| `Overheating` | Motor temperature above safe limits |
| `Mechanical_Vibration` | Excessive vibration indicating bearing/alignment issues |
| `Critical_Fault` | Multiple parameters simultaneously out of range |
| `Stopped_Idle` | Motor at rest / not running |

---

## 🧠 ML Pipeline

The pre-trained model ships with the repo — **you do not need to retrain it to run the project.**

### Training notebooks (reference)

| Notebook | Purpose |
|----------|---------|
| `Model2.ipynb` | XGBoost training on `Dataset.csv` |
| `Model Comparison.ipynb` | Benchmark of 6 classifiers |
| `test.ipynb` | Validation and testing |

### Retraining

To retrain the model with new data:

```bash
cd Final
python retrain.py
```

### Model Comparison Results

| Model | Accuracy | Precision | Recall | F1 |
|-------|----------|-----------|--------|----|
| **XGBoost** ⭐ | ~92% | Best | Good | Good |
| Random Forest | ~91% | Good | **Best** | **Best** |
| SVM | ~88% | Good | Moderate | Moderate |
| Decision Tree | ~85% | Moderate | Moderate | Moderate |
| KNN | ~84% | Moderate | Moderate | Moderate |
| Logistic Regression | ~78% | Lower | Lower | Lower |

> XGBoost is selected as the production model for its high accuracy and precision across all fault classes.

---

## 📁 Repository Structure

```
Smart-Twin/
│
├── Arduino_Code/               # Prototype ESP32 firmware
│
├── Final Arduino Code/         # Production ESP32 firmware
│   └── *.ino                   # Sensor integration + HTTP POST to backend
│
├── Final/                      # Main application
│   ├── app.py                  # Python Flask backend — receives data, runs ML inference
│   ├── retrain.py              # Script to retrain the XGBoost model
│   ├── frontend/               # React + Vite frontend
│   │   ├── src/
│   │   │   └── components/     # ← Put your backend IP address here
│   │   └── package.json
│   └── ...
│
├── Dataset.csv                 # 4,000-row motor fault dataset
├── Model2.ipynb                # XGBoost training notebook
├── Model Comparison.ipynb      # 6-model comparison notebook
├── model_comparison_results.csv
└── test.ipynb
```

---

## 🚀 Getting Started

### Prerequisites

- **Hardware:** ESP32, MPU6050, LM35, DHT22, ACS712, Rotary Encoder
- **Software:** Arduino IDE, Python ≥ 3.8, Node.js ≥ 16
- **Network:** ESP32 and your computer on the **same Wi-Fi network**

---

### Step 1 — Configure & Flash the ESP32

1. Open `Final Arduino Code/` in Arduino IDE
2. Install required libraries: `Adafruit_MPU6050`, `DHT sensor library`, `ArduinoJson`, `HTTPClient`
3. In the sketch, set your Wi-Fi credentials:
   ```cpp
   const char* ssid     = "YOUR_WIFI_SSID";
   const char* password = "YOUR_WIFI_PASSWORD";
   ```
4. Set the backend IP address (your computer's local IP, e.g. `192.168.1.10`):
   ```cpp
   const char* serverURL = "http://192.168.1.10:5000/data";
   ```
5. Flash to the ESP32

---

### Step 2 — Start the Backend

```bash
cd Final

# Install Python dependencies
pip install -r requirements.txt

# Start the Flask backend
python app.py
```

The backend listens on port `5000` and runs ML inference on every incoming data point.

---

### Step 3 — Configure & Start the Frontend

1. Open `Final/frontend/src/components/` and update the backend IP address to match your machine's local IP:
   ```js
   const API_URL = "http://192.168.1.10:5000";
   ```

2. Install dependencies and run the dev server:
   ```bash
   cd Final/frontend
   npm install
   npm run dev
   ```

3. Open the URL shown in the terminal (typically `http://localhost:5173`) in your browser.

---

### Step 4 — Power the ESP32

Once the ESP32 is powered and connected to Wi-Fi, it will start sending sensor readings to the backend automatically, and the dashboard will update in real time.

---

## 📊 Dataset

`Dataset.csv` contains **4,000 rows** with the following columns:

| Column | Unit | Description |
|--------|------|-------------|
| `RPM` | rev/min | Motor speed |
| `Current` | A | Phase current |
| `Temperature` | °C | Motor winding temperature |
| `Humidity` | % | Ambient relative humidity |
| `Vibration` | g | RMS vibration magnitude |
| `Fault_Label` | — | Target class (6 categories) |

Synthetically generated with Gaussian noise per class, realistic operating envelopes per fault type, and balanced class distribution.

---

## 📈 Model Performance

XGBoost final results on the test split:

| Metric | Score |
|--------|-------|
| Accuracy | ~92% |
| Macro Precision | ~91% |
| Macro Recall | ~90% |
| Macro F1 | ~90% |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Firmware | C++ (Arduino) |
| Communication | HTTP over local Wi-Fi |
| Backend | Python · Flask · XGBoost · scikit-learn |
| Frontend | React · Vite · JavaScript · CSS |
| ML Notebooks | Jupyter · Pandas · scikit-learn |

---

<p align="center">Built as part of an Industry 4.0 / IIoT research initiative.</p>
