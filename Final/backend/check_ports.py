# com_test.py

import serial

try:

    ser = serial.Serial(
        "COM3",
        115200,
        timeout=1
    )

    print("COM3 OPENED SUCCESSFULLY")

    ser.close()

except Exception as e:

    print(e)