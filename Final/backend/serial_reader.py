import requests
import threading
import time

# Set this to the IP printed by the ESP32 in the Serial Monitor at startup
ESP32_IP = "10.255.113.165"

POLL_INTERVAL = 0.5   # seconds between polls

latest_rpm_reduction    = 0.0
latest_current          = 0.0
latest_temperature      = 0.0
latest_humidity         = 0.0
latest_vibration        = 0.0
latest_vibration_level  = "NONE"


def wifi_worker():

    global latest_rpm_reduction, latest_current
    global latest_temperature, latest_humidity
    global latest_vibration, latest_vibration_level

    url = f"http://{ESP32_IP}/data"

    while True:

        try:

            r    = requests.get(url, timeout=2)
            data = r.json()

            latest_rpm_reduction   = float(data["speed_percent"])
            latest_current         = float(data["current"])
            latest_temperature     = float(data["temperature"])
            latest_humidity        = float(data["humidity"])
            latest_vibration       = float(data["vibration"])
            latest_vibration_level = str(data["vib_level"])

        except Exception as e:

            print("WiFi Error:", e)

        time.sleep(POLL_INTERVAL)


threading.Thread(
    target=wifi_worker,
    daemon=True
).start()


def get_motor_data():

    return {
        "rpm_reduction_percent": latest_rpm_reduction,
        "current":               latest_current,
        "ambient_temperature":   latest_temperature,
        "ambient_humidity":      latest_humidity,
        "vibration":             latest_vibration,
        "vibration_level":       latest_vibration_level,
    }
