from flask import Flask
from flask_cors import CORS

from serial_reader import get_motor_data
from predictor import predict_fault

app = Flask(__name__)

CORS(app)


@app.route("/")
def home():

    return {
        "status": "running",
        "project": "SmartTwin"
    }


@app.route("/api/motor")
def motor():

    sensor_data = get_motor_data()

    prediction = predict_fault(
        sensor_data["rpm_reduction_percent"],
        sensor_data["current"],
        sensor_data["ambient_temperature"],
        sensor_data["ambient_humidity"],
        sensor_data["vibration"],
        sensor_data["vibration_level"]
    )

    return {

        "motor_name":
            "12V Geared DC Motor",

        **sensor_data,

        **prediction
    }
if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=False,
        threaded=True
    )