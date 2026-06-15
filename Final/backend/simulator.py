import random

def get_motor_data():

    rpm_percent = random.randint(20, 100)

    current = round(random.uniform(0.1, 2.5), 2)

    return rpm_percent, current