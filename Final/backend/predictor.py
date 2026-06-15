import joblib
import numpy as np

model = joblib.load(
    "models/digital_twin_xgboost_model.pkl"
)

encoder = joblib.load(
    "models/fault_type_encoder.pkl"
)


def predict_fault(
        rpm_reduction_percent,
        current,
        ambient_temperature,
        ambient_humidity,
        vibration,
        vibration_level
):

    MAX_RPM = 1000

    # ---------------------------------
    # Digital Twin Calculations
    # ---------------------------------

    rpm_actual = round(
        MAX_RPM *
        (1 - rpm_reduction_percent / 100),
        2
    )

    expected_current = round(
        0.05 +
        (rpm_actual / 1000) * 0.20,
        3
    )

    current_deviation_percent = round(
        abs(current - expected_current)
        /
        max(expected_current, 0.01)
        * 100,
        2
    )

    rpm_drop_percent = round(
        rpm_reduction_percent,
        2
    )

    efficiency_index = round(
        100 - rpm_drop_percent,
        2
    )

    estimated_temperature = round(
        ambient_temperature
        + current * 25
        + vibration * 15,
        2
    )

    health_score = round(
        max(
            0,
            100
            - current_deviation_percent * 0.10
            - rpm_drop_percent * 0.40
            - vibration * 30
            - max(
                0,
                estimated_temperature - 50
            ) * 0.5
        ),
        2
    )

    failure_probability = round(
        100 - health_score,
        2
    )

    # ---------------------------------
    # XGBoost Features
    # EXACTLY SAME AS TRAINING
    # ---------------------------------

    features = np.array([[

        rpm_reduction_percent,
        rpm_actual,
        current,
        ambient_temperature,
        ambient_humidity,
        estimated_temperature,
        vibration,
        health_score

    ]])

    prediction = model.predict(
        features
    )[0]

    fault_type = encoder.inverse_transform(
        [prediction]
    )[0]

    # ---------------------------------
    # Rule-Based Overrides
    # ---------------------------------

    if vibration >= 0.70:
        fault_type = "Critical"

    elif vibration >= 0.40:
        fault_type = "Bearing_Wear"

    elif estimated_temperature >= 80:
        fault_type = "Critical"

    elif estimated_temperature >= 65:
        fault_type = "Overheating_Risk"

    elif current >= 0.45:
        fault_type = "Overloaded"

    elif (
        vibration < 0.35
        and current < 0.30
        and rpm_drop_percent < 25
    ):
        fault_type = "Normal"

    # ---------------------------------
    # Maintenance Logic
    # ---------------------------------

    maintenance = (
        "YES"
        if (
            failure_probability > 40
            or fault_type in [
                "Overloaded",
                "Bearing_Wear",
                "Overheating_Risk",
                "Critical"
            ]
        )
        else "NO"
    )

    return {

        "rpm_actual":
            rpm_actual,

        "expected_current":
            expected_current,

        "current_deviation_percent":
            current_deviation_percent,

        "rpm_drop_percent":
            rpm_drop_percent,

        "efficiency_index":
            efficiency_index,

        "estimated_temperature":
            estimated_temperature,

        "health_score":
            health_score,

        "fault_type":
            fault_type,

        "failure_probability":
            failure_probability,

        "maintenance":
            maintenance,

        "ambient_temperature":
            ambient_temperature,

        "ambient_humidity":
            ambient_humidity,

        "vibration":
            vibration,

        "vibration_level":
            vibration_level
    }