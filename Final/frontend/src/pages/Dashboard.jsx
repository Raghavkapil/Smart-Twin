import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  FaTachometerAlt, FaBolt, FaThermometerHalf, FaHeartbeat,
  FaChartLine, FaExclamationTriangle, FaBrain, FaCheckCircle,
  FaWaveSquare, FaMicrochip, FaArrowLeft, FaCog, FaChartBar,
  FaTools, FaNetworkWired, FaTint,
} from "react-icons/fa";
import Navbar from "../components/Navbar";

// ─── Constants ─────────────────────────────────────────────

const SENSORS = [
  { name: "MPU6050",        cls: "bg-purple-500/15 border-purple-500/30 text-purple-400" },
  { name: "DHT22",          cls: "bg-blue-500/15   border-blue-500/30   text-blue-400"   },
  { name: "ACS712",         cls: "bg-orange-500/15 border-orange-500/30 text-orange-400" },
  { name: "Rotary Encoder", cls: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" },
  { name: "LM35",           cls: "bg-red-500/15    border-red-500/30    text-red-400"    },
];

const COLORS = {
  blue:   { bg: "bg-blue-500/10",    border: "border-blue-500/20",    icon: "text-blue-400",    val: "text-blue-300"    },
  cyan:   { bg: "bg-cyan-500/10",    border: "border-cyan-500/20",    icon: "text-cyan-400",    val: "text-cyan-300"    },
  orange: { bg: "bg-orange-500/10",  border: "border-orange-500/20",  icon: "text-orange-400",  val: "text-orange-300"  },
  red:    { bg: "bg-red-500/10",     border: "border-red-500/20",     icon: "text-red-400",     val: "text-red-300"     },
  green:  { bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: "text-emerald-400", val: "text-emerald-300" },
  purple: { bg: "bg-purple-500/10",  border: "border-purple-500/20",  icon: "text-purple-400",  val: "text-purple-300"  },
};

const VIB_LEVEL_COLORS = {
  NONE:     "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  LOW:      "bg-blue-500/10   border-blue-500/20    text-blue-400",
  MEDIUM:   "bg-yellow-500/10  border-yellow-500/20  text-yellow-400",
  HIGH:     "bg-orange-500/10  border-orange-500/20  text-orange-400",
  CRITICAL: "bg-red-500/10     border-red-500/20     text-red-400",
};

const FAULT_META = {
  Normal:           { cls: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400", sub: "All systems nominal"         },
  Bearing_Wear:     { cls: "bg-orange-500/10  border-orange-500/30  text-orange-400",  sub: "Mechanical wear detected"    },
  Overheating_Risk: { cls: "bg-yellow-500/10  border-yellow-500/30  text-yellow-400",  sub: "Temperature rising"          },
  Overloaded:       { cls: "bg-orange-500/10  border-orange-500/30  text-orange-400",  sub: "Excessive load detected"     },
  Critical:         { cls: "bg-red-500/10      border-red-500/30     text-red-400",      sub: "Immediate action required"  },
};

const CHARTS = ["RPM Trend", "Current Consumption", "Temperature", "Vibration"];

// ─── Main component ────────────────────────────────────────

function Dashboard() {
  const [motor, setMotor]           = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError]           = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:8000/api/motor");
        setMotor(res.data);
        setLastUpdated(new Date());
        setError(false);
      } catch {
        setError(true);
      }
    };
    fetch();
    const id = setInterval(fetch, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* ── Page header ─────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">

          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
            >
              <FaArrowLeft /> Home
            </Link>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600/15 border border-blue-500/30 rounded-xl flex items-center justify-center">
                <FaCog className="text-blue-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white leading-tight">
                  12V Geared DC Motor
                </h1>
                <p className="text-slate-500 text-xs">Digital Twin Dashboard</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {error ? (
              <Pill color="red" label="Disconnected" />
            ) : (
              <Pill color="green" label="Live" pulse />
            )}
            {lastUpdated && (
              <span className="text-slate-600 text-xs hidden sm:block">
                {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* ── Content ─────────────────────────────────── */}
        {!motor ? (
          <LoadingState />
        ) : (
          <>
            {/* Sensor Readings */}
            <Section title="Sensor Readings" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-10">
              <MetricCard icon={<FaChartLine />}       title="RPM Reduction" value={motor.rpm_reduction_percent} unit="%"   color="blue"   />
              <MetricCard icon={<FaTachometerAlt />}   title="Actual RPM"    value={motor.rpm_actual}            unit="RPM" color="cyan"   />
              <MetricCard icon={<FaBolt />}            title="Current"       value={motor.current}               unit="A"   color="orange" />
              <MetricCard icon={<FaThermometerHalf />} title="Ambient Temp"  value={motor.ambient_temperature}   unit="°C"  color="red"    />
              <MetricCard icon={<FaThermometerHalf />} title="Motor Temp"    value={motor.estimated_temperature} unit="°C"  color="orange" />
              <MetricCard icon={<FaTint />}            title="Humidity"      value={motor.ambient_humidity}      unit="%"   color="blue"   />
              <MetricCard icon={<FaWaveSquare />}      title="Vibration"     value={motor.vibration}             unit="g"   color="purple" />
              <VibLevelCard value={motor.vibration_level} />
              <MetricCard icon={<FaChartBar />}        title="Efficiency"    value={motor.efficiency_index}      unit="%"   color="green"  />
              <MetricCard icon={<FaHeartbeat />}       title="Health Score"  value={motor.health_score}          unit="%"   color="green"  />
            </div>

            {/* AI Predictions */}
            <Section title="AI Predictions" accent />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              <FaultTypeCard   value={motor.fault_type}           />
              <FailureProbCard value={motor.failure_probability}  />
              <MaintenanceCard value={motor.maintenance}          />
              <DigitalTwinCard />
            </div>

            {/* Connected Sensors */}
            <Section title="Connected Sensors" />
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-10">
              <div className="flex flex-wrap gap-3">
                {SENSORS.map((s) => (
                  <div
                    key={s.name}
                    className={`flex items-center gap-2 border rounded-xl px-4 py-2.5 ${s.cls}`}
                  >
                    <FaMicrochip className="text-sm" />
                    <span className="text-sm font-semibold">{s.name}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60 animate-pulse block" />
                  </div>
                ))}
                <div className="flex items-center gap-2 border border-dashed border-slate-700 text-slate-600 rounded-xl px-4 py-2.5 text-sm cursor-pointer hover:border-slate-500 transition-colors">
                  + Add Sensor
                </div>
              </div>
            </div>

            {/* Charts */}
            <Section title="Real-Time Charts" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {CHARTS.map((c) => (
                <ChartPlaceholder key={c} title={c} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── UI primitives ─────────────────────────────────────────

function Pill({ color, label, pulse }) {
  const map = {
    green: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    red:   "bg-red-500/10    border-red-500/20    text-red-400",
  };
  const dot = { green: "bg-emerald-400", red: "bg-red-400" };
  return (
    <div className={`flex items-center gap-2 border rounded-full px-4 py-2 ${map[color]}`}>
      <span className={`w-2 h-2 rounded-full block ${dot[color]} ${pulse ? "animate-pulse" : ""}`} />
      <span className="text-sm font-semibold">{label}</span>
    </div>
  );
}

function Section({ title, accent }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      {accent && <div className="w-1 h-5 bg-blue-500 rounded-full" />}
      <h2 className={`text-xs font-bold uppercase tracking-widest ${accent ? "text-blue-400" : "text-slate-500"}`}>
        {title}
      </h2>
      <div className="flex-1 h-px bg-slate-800" />
    </div>
  );
}

function MetricCard({ icon, title, value, unit, color }) {
  const c = COLORS[color] || COLORS.blue;
  const display =
    typeof value === "number"
      ? value % 1 === 0
        ? value
        : value.toFixed(2)
      : value;
  return (
    <div className={`${c.bg} ${c.border} border rounded-2xl p-4`}>
      <div className={`${c.icon} mb-3`}>{icon}</div>
      <p className="text-slate-500 text-xs font-medium mb-1 truncate">{title}</p>
      <p className={`text-2xl font-black ${c.val} leading-none`}>{display}</p>
      <p className="text-slate-600 text-xs mt-1">{unit}</p>
    </div>
  );
}

function VibLevelCard({ value }) {
  const cls = VIB_LEVEL_COLORS[value] ?? VIB_LEVEL_COLORS.NONE;
  return (
    <div className={`${cls} border rounded-2xl p-4`}>
      <div className="mb-3"><FaExclamationTriangle /></div>
      <p className="text-slate-500 text-xs font-medium mb-1">Vibration Level</p>
      <p className="text-xl font-black leading-none">{value}</p>
      <p className="text-slate-600 text-xs mt-1">level</p>
    </div>
  );
}

function FaultTypeCard({ value }) {
  const meta = FAULT_META[value] ?? FAULT_META.Normal;
  return (
    <div className={`${meta.cls} border rounded-2xl p-6 text-center`}>
      <div className="flex justify-center text-3xl mb-3"><FaBrain /></div>
      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Fault Type</p>
      <p className="text-2xl font-black mb-1">{value?.replace("_", " ")}</p>
      <p className="text-slate-500 text-xs">{meta.sub}</p>
    </div>
  );
}

function FailureProbCard({ value }) {
  const low = value < 30, high = value >= 60;
  const cls = high
    ? "bg-red-500/10    border-red-500/30    text-red-400"
    : low
    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
    : "bg-yellow-500/10  border-yellow-500/30  text-yellow-400";
  const sub = high ? "High risk" : low ? "Low risk" : "Moderate risk";
  return (
    <div className={`${cls} border rounded-2xl p-6 text-center`}>
      <div className="flex justify-center text-3xl mb-3"><FaExclamationTriangle /></div>
      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Failure Probability</p>
      <p className="text-2xl font-black mb-1">{value}%</p>
      <p className="text-slate-500 text-xs">{sub}</p>
    </div>
  );
}

function MaintenanceCard({ value }) {
  const needed = value === "YES";
  return (
    <div
      className={`${
        needed
          ? "bg-red-500/10 border-red-500/30 text-red-400"
          : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
      } border rounded-2xl p-6 text-center`}
    >
      <div className="flex justify-center text-3xl mb-3">
        {needed ? <FaTools /> : <FaCheckCircle />}
      </div>
      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Maintenance</p>
      <p className="text-2xl font-black mb-1">{needed ? "Required" : "Not Required"}</p>
      <p className="text-slate-500 text-xs">
        {needed ? "Schedule service soon" : "Operating normally"}
      </p>
    </div>
  );
}

function DigitalTwinCard() {
  return (
    <div className="bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-2xl p-6 text-center">
      <div className="flex justify-center text-3xl mb-3"><FaNetworkWired /></div>
      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Digital Twin</p>
      <p className="text-2xl font-black mb-1">ONLINE</p>
      <p className="text-slate-500 text-xs">Model synchronized</p>
    </div>
  );
}

function ChartPlaceholder({ title }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
        <span className="text-slate-300 text-sm font-semibold">{title}</span>
        <span className="text-xs bg-slate-800 text-slate-500 rounded-full px-2.5 py-0.5">
          Coming Soon
        </span>
      </div>
      <div
        className="h-44 flex flex-col items-center justify-center gap-2"
        style={{
          backgroundImage:
            "linear-gradient(rgba(148,163,184,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.03) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      >
        <FaChartLine className="text-slate-700 text-3xl" />
        <p className="text-slate-600 text-xs">Real-time data coming soon</p>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <FaCog className="text-blue-400 text-4xl animate-spin" />
      <p className="text-slate-400 text-sm">Connecting to Digital Twin...</p>
    </div>
  );
}

export default Dashboard;
