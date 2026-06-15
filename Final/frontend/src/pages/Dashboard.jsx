import { useEffect, useState } from "react";
import axios from "axios";

import {
  FaTachometerAlt,
  FaBolt,
  FaThermometerHalf,
  FaHeartbeat,
  FaChartLine,
  FaExclamationTriangle,
  FaBrain,
  FaCheckCircle,
  FaWaveSquare
} from "react-icons/fa";

import "./Dashboard.css";

function Dashboard() {
  const [motor, setMotor] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(
          "http://127.0.0.1:5000/api/motor"
        );

        setMotor(res.data);
      } catch (err) {
        console.log(err);
      }
    };

    fetchData();

    const interval = setInterval(
      fetchData,
      1000
    );

    return () => clearInterval(interval);

  }, []);

  if (!motor)
    return <h2>Loading...</h2>;

  return (
    <div className="dashboard">

      <div className="title">

        <h1>
          ⚙️ 12V Geared DC Motor
        </h1>

      </div>

     <div className="metrics">

  <MetricCard
    icon={<FaChartLine />}
    title="RPM Reduction"
    value={`${motor.rpm_reduction_percent}%`}
    color="blue"
  />

  <MetricCard
    icon={<FaTachometerAlt />}
    title="Actual RPM"
    value={motor.rpm_actual}
    color="green"
  />

  <MetricCard
    icon={<FaBolt />}
    title="Current"
    value={`${motor.current} A`}
    color="orange"
  />

  <MetricCard
    icon={<FaThermometerHalf />}
    title="Ambient Temp"
    value={`${motor.ambient_temperature} °C`}
    color="red"
  />

  <MetricCard
    icon={<FaThermometerHalf />}
    title="Motor Temp"
    value={`${motor.estimated_temperature} °C`}
    color="orange"
  />

  <MetricCard
    icon={<FaHeartbeat />}
    title="Humidity"
    value={`${motor.ambient_humidity}%`}
    color="blue"
  />

  <MetricCard
    icon={<FaWaveSquare />}
    title="Vibration"
    value={`${motor.vibration} g`}
    color="purple"
  />

  <MetricCard
    icon={<FaWaveSquare />}
    title="Vibration Level"
    value={motor.vibration_level}
    color={
      motor.vibration_level === "NONE"
        ? "green"
        : motor.vibration_level === "LOW"
        ? "blue"
        : motor.vibration_level === "MEDIUM"
        ? "orange"
        : motor.vibration_level === "HIGH"
        ? "red"
        : "red"
    }
  />

  <MetricCard
    icon={<FaChartLine />}
    title="Efficiency"
    value={`${motor.efficiency_index}%`}
    color="green"
  />

  <MetricCard
    icon={<FaHeartbeat />}
    title="Health Score"
    value={`${motor.health_score}%`}
    color="green"
  />

</div>

      <div className="bottom-row">

        <StatusCard
  icon={<FaExclamationTriangle />}
  title="Fault Type"
  value={motor.fault_type}
  danger={
    motor.fault_type !== "Normal"
  }
/>

        <StatusCard
          icon={<FaBrain />}
          title="Failure Probability"
          value={`${motor.failure_probability}%`}
        />

        <StatusCard
          icon={<FaCheckCircle />}
          title="Maintenance"
          value={motor.maintenance}
          success={
            motor.maintenance === "NO"
          }
        />

        <StatusCard
  icon={<FaBrain />}
  title="Digital Twin"
  value="ONLINE"
/>

      </div>

    </div>
  );
}

function MetricCard({
  icon,
  title,
  value,
  color
}) {

  return (
    <div className="metric-card">

      <div className={`icon ${color}`}>
        {icon}
      </div>

      <div>

        <h4>{title}</h4>

        <h2>{value}</h2>

      </div>

    </div>
  );
}

function StatusCard({
  icon,
  title,
  value,
  danger,
  success
}) {

  return (
    <div className="status-card">

      <div
        className={
          danger
            ? "status-icon red"
            : success
            ? "status-icon green"
            : "status-icon purple"
        }
      >
        {icon}
      </div>

      <h3>{title}</h3>

      <h2>{value}</h2>

    </div>
  );
}

export default Dashboard;