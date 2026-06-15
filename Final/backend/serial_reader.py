import serial
import threading

# Latest values from ESP32

latest_rpm_reduction = 0.0
latest_current = 0.0
latest_temperature = 0.0
latest_humidity = 0.0
latest_vibration = 0.0
latest_vibration_level = "NONE"

try:
    ser = serial.Serial(
        "COM3",
        115200,
        timeout=1
    )

    print("ESP32 connected on COM3")

except Exception as e:

    print("Serial Error:", e)
    ser = None


def serial_worker():

    global latest_rpm_reduction
    global latest_current
    global latest_temperature
    global latest_humidity
    global latest_vibration
    global latest_vibration_level

    while True:

        try:

            if ser is None:
                continue

            line = (
                ser.readline()
                .decode(errors="ignore")
                .strip()
            )

            if not line:
                continue

            parts = line.split(",")

            if len(parts) == 6:

                latest_rpm_reduction = float(parts[0])
                latest_current = float(parts[1])
                latest_temperature = float(parts[2])
                latest_humidity = float(parts[3])
                latest_vibration = float(parts[4])
                latest_vibration_level = parts[5]

        except Exception as e:

            print("Serial Error:", e)


threading.Thread(
    target=serial_worker,
    daemon=True
).start()


def get_motor_data():

    return {
        "rpm_reduction_percent":
            latest_rpm_reduction,

        "current":
            latest_current,

        "ambient_temperature":
            latest_temperature,

        "ambient_humidity":
            latest_humidity,

        "vibration":
            latest_vibration,

        "vibration_level":
            latest_vibration_level
    }