import serial

ser = serial.Serial(
    "COM3",
    115200,
    timeout=1
)

print("Reading...")

while True:

    raw = ser.readline()

    print(raw)