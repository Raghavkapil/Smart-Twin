function MotorCard({ motor }) {
  return (
    <div className="card">
      <div className="card-header">
        <h2>{motor.motor_name}</h2>
      </div>

      <div className="grid">
        <div className="item">
          <h4>RPM Commanded</h4>
          <p>{motor.rpm_percent}</p>
        </div>

        <div className="item">
          <h4>RPM Actual</h4>
          <p>{motor.rpm_actual}</p>
        </div>

        <div className="item">
          <h4>Current</h4>
          <p>{motor.current} A</p>
        </div>

        <div className="item">
          <h4>Expected Current</h4>
          <p>{motor.expected_current}</p>
        </div>

        <div className="item">
          <h4>Current Deviation</h4>
          <p>{motor.current_deviation_percent}%</p>
        </div>

        <div className="item">
          <h4>RPM Drop</h4>
          <p>{motor.rpm_drop_percent}%</p>
        </div>

        <div className="item">
          <h4>Efficiency</h4>
          <p>{motor.efficiency_index}%</p>
        </div>

        <div className="item">
          <h4>Temperature</h4>
          <p>{motor.estimated_temperature} °C</p>
        </div>

        <div className="item">
          <h4>Health Score</h4>
          <p>{motor.health_score}</p>
        </div>
      </div>

      <div className="status-section">
        <div className="status-box">
          <h3>Fault Type</h3>
          <p>{motor.fault_type}</p>
        </div>

        <div className="status-box">
          <h3>Failure Probability</h3>
          <p>{motor.failure_probability}%</p>
        </div>

        <div className="status-box">
          <h3>Maintenance</h3>
          <p>{motor.maintenance}</p>
        </div>
      </div>
    </div>
  );
}

export default MotorCard;