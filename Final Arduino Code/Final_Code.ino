#include <Wire.h>
#include <DHT.h>

#define LPWM    32
#define RPWM    33
#define ACS_PIN 34
#define DHTPIN  4
#define DHTTYPE DHT22

#define MPU_ADDR 0x68

DHT dht(DHTPIN, DHTTYPE);

const float OFFSET = 2.105;

// MPU offsets
float gyro_x_offset=0, gyro_y_offset=0, gyro_z_offset=0;
float accel_x_offset=0, accel_y_offset=0;

// Vibration buffer
float vibBuffer[10];
int   vibIndex = 0;

// ─── MPU helper ────────────────────────────────────────────
void writeMPU(byte reg, byte data) {
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(reg); Wire.write(data);
  Wire.endTransmission();
}

// ─── Calibration ───────────────────────────────────────────
void calibrate() {
  Serial.println("Calibrating... Keep sensor still & motor OFF (3s)");
  delay(3000);

  long sumAX=0,sumAY=0,sumGX=0,sumGY=0,sumGZ=0;
  int samples = 300;

  for (int i=0; i<samples; i++) {
    Wire.beginTransmission(MPU_ADDR); Wire.write(0x3B);
    Wire.endTransmission(false); Wire.requestFrom(MPU_ADDR, 14);

    sumAX += (int16_t)(Wire.read()<<8|Wire.read());
    sumAY += (int16_t)(Wire.read()<<8|Wire.read());
    Wire.read(); Wire.read(); // skip AZ
    Wire.read(); Wire.read(); // skip temp
    sumGX += (int16_t)(Wire.read()<<8|Wire.read());
    sumGY += (int16_t)(Wire.read()<<8|Wire.read());
    sumGZ += (int16_t)(Wire.read()<<8|Wire.read());
    delay(10);
  }

  accel_x_offset = (sumAX/(float)samples)/4096.0;
  accel_y_offset = (sumAY/(float)samples)/4096.0;
  gyro_x_offset  = (sumGX/(float)samples)/16.4;
  gyro_y_offset  = (sumGY/(float)samples)/16.4;
  gyro_z_offset  = (sumGZ/(float)samples)/16.4;

  Serial.println("Calibration Complete!\n");
}

// ─── Vibration reading ─────────────────────────────────────
float readVibration(String &level_out) {
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x3B);
  Wire.endTransmission(false);
  Wire.requestFrom(MPU_ADDR, 14);

  int16_t ax = Wire.read()<<8|Wire.read();
  int16_t ay = Wire.read()<<8|Wire.read();
  int16_t az = Wire.read()<<8|Wire.read();
  Wire.read(); Wire.read(); // skip temp
  int16_t gx = Wire.read()<<8|Wire.read();
  int16_t gy = Wire.read()<<8|Wire.read();
  int16_t gz = Wire.read()<<8|Wire.read();

  float fax = (ax/4096.0) - accel_x_offset;
  float fay = (ay/4096.0) - accel_y_offset;
  float faz = (az/4096.0);

  float accel_mag = sqrt(fax*fax + fay*fay + faz*faz);

  float vib = abs(accel_mag - 1.0);
  if (vib < 0.03) vib = 0;

  vibBuffer[vibIndex] = vib;
  vibIndex = (vibIndex+1) % 10;
  float filtered = 0;
  for (int i=0; i<10; i++) filtered += vibBuffer[i];
  filtered /= 10.0;

  if      (filtered < 0.07) level_out = "NONE";
  else if (filtered < 0.20) level_out = "LOW";
  else if (filtered < 0.40) level_out = "MEDIUM";
  else if (filtered < 0.70) level_out = "HIGH";
  else                       level_out = "CRITICAL";

  return filtered;
}

// ─── Current sensor ────────────────────────────────────────
float readCurrent() {
  uint32_t sum = 0;
  for (int i=0; i<100; i++) {
    sum += analogRead(ACS_PIN);
    delayMicroseconds(100);
  }
  float adc     = sum / 100.0;
  float voltage = adc * 3.3f / 4095.0f;
  float current = fabs(voltage - OFFSET) * 2.0f;
  if (current < 0.05f) current = 0;
  return fabs(current - 4.0f);
}

// ─── Send one data row ─────────────────────────────────────
// Format: speedPercent,current,temperature,humidity,vibration,level
void sendData(int speedPercent) {
  float  current     = readCurrent();
  float  temperature = dht.readTemperature();
  float  humidity    = dht.readHumidity();
  String level;
  float  vib         = readVibration(level);

  Serial.print(speedPercent);   Serial.print(",");
  Serial.print(current, 2);     Serial.print(",");

  if (isnan(temperature)) Serial.print("0");
  else                    Serial.print(temperature, 1);
  Serial.print(",");

  if (isnan(humidity))    Serial.print("0");
  else                    Serial.print(humidity, 1);
  Serial.print(",");

  Serial.print(vib, 4);
  Serial.print(",");

  Serial.println(level);
  Serial.flush();
}

// ─── Motor speed ───────────────────────────────────────────
// FIX: drive RPWM (forward) with the duty value, keep LPWM at 0.
// If motor direction/behavior is still inverted on your wiring,
// swap RPWM <-> LPWM below.
// ─── Motor speed ───────────────────────────────────────────
void setMotorPWM(uint8_t pwm)
{
  ledcWrite(LPWM, pwm);   // Use LPWM (your working wiring)
  ledcWrite(RPWM, 0);     // Ensure opposite direction is off
  delay(500);
}

// ─── Setup ─────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(2000);
// Motor
ledcAttachChannel(LPWM, 1000, 8, 0);
ledcAttachChannel(RPWM, 1000, 8, 1);

ledcWrite(LPWM, 0);
ledcWrite(RPWM, 0);
  // ADC
  analogReadResolution(12);
  analogSetPinAttenuation(ACS_PIN, ADC_11db);
  pinMode(ACS_PIN, INPUT);

  // DHT22
  dht.begin();

  // Motor
  ledcAttachChannel(LPWM, 1000, 8, 0);
  ledcAttachChannel(RPWM, 1000, 8, 1);
  ledcWrite(LPWM, 0);
  ledcWrite(RPWM, 0);

  // MPU6050
  Wire.begin(23, 22);
  Wire.setClock(400000);

  writeMPU(0x6B, 0x80); delay(200); // reset
  writeMPU(0x6B, 0x00); delay(100); // wake
  writeMPU(0x1B, 0x18);             // gyro  ±2000°/s
  writeMPU(0x1C, 0x10);             // accel ±8g
  writeMPU(0x1A, 0x03);             // low pass filter 44Hz

  for (int i=0; i<10; i++) vibBuffer[i] = 0;

  calibrate();

  Serial.println("RPM,Current,Temperature,Humidity,Vibration,Level");
}

// ─── Loop ──────────────────────────────────────────────────
void loop() {
  setMotorPWM(51);       // 20%
  for (int i=0; i<5; i++) { sendData(20);  delay(1000); }

  setMotorPWM(102);      // 40%
  for (int i=0; i<5; i++) { sendData(40);  delay(1000); }

  setMotorPWM(153);      // 60%
  for (int i=0; i<5; i++) { sendData(60);  delay(1000); }

  setMotorPWM(204);      // 80%
  for (int i=0; i<5; i++) { sendData(80);  delay(1000); }

  setMotorPWM(255);      // 100%
  for (int i=0; i<5; i++) { sendData(100); delay(1000); }

  Serial.println("CYCLE_DONE");
}
