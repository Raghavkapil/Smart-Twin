import requests
import threading
import time

ESP32_IP = "10.255.113.165"
POLL_INTERVAL = 0.5   # seconds between polls
ESP_TIMEOUT = 3.0   # seconds without fresh data → consider offline

_lock = threading.Lock()
_data = {
    "rpm_reduction_percent": 0.0,
    "current":               0.0,
    "ambient_temperature":   0.0,
    "ambient_humidity":      0.0,
    "vibration":             0.0,
    "vibration_level":       "NONE",
}
_last_data_time = None   # wall-clock time of last successful ESP read


def wifi_worker():
    global _last_data_time

    url = f"http://{ESP32_IP}/data"

    while True:
        try:
            r = requests.get(url, timeout=2)
            data = r.json()

            with _lock:
                _data["rpm_reduction_percent"] = float(data["speed_percent"])
                _data["current"] = float(data["current"])
                _data["ambient_temperature"] = float(data["temperature"])
                _data["ambient_humidity"] = float(data["humidity"])
                _data["vibration"] = float(data["vibration"])
                _data["vibration_level"] = str(data["vib_level"])
                _last_data_time = time.monotonic()

        except Exception as e:
            print("WiFi Error:", e)

        time.sleep(POLL_INTERVAL)


threading.Thread(target=wifi_worker, daemon=True).start()


def get_motor_data():
    with _lock:
        age = (time.monotonic() -
               _last_data_time) if _last_data_time is not None else None
        esp_connected = age is not None and age < ESP_TIMEOUT

        return {
            **_data,
            "esp_connected": esp_connected,
        }
