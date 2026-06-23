import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  FaTachometerAlt, FaBolt, FaThermometerHalf, FaHeartbeat,
  FaChartLine, FaExclamationTriangle, FaBrain, FaCheckCircle,
  FaWaveSquare, FaMicrochip, FaArrowLeft, FaCog, FaChartBar,
  FaTools, FaNetworkWired, FaTint, FaStop, FaSave, FaClock,
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

const MAX_HISTORY    = 40;
const IDLE_CURRENT   = 0.21;  // A — no-load / stopped draw of this motor
const IDLE_TOLERANCE = 0.05;  // ± band around IDLE_CURRENT
const IDLE_SECONDS   = 3;     // consecutive readings required

// ─── Main component ────────────────────────────────────────

const AUTOSAVE_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

function Dashboard() {
  const [motor, setMotor]             = useState(null);
  const [history, setHistory]         = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError]             = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState(null);
  const [autoSaving, setAutoSaving]     = useState(false);
  const autoSaveTimerRef = useRef(null);

  const triggerAutoSave = async () => {
    setAutoSaving(true);
    try {
      const res = await axios.post("http://127.0.0.1:8000/api/autosave");
      if (res.data?.last_time) {
        setLastAutoSave(new Date(res.data.last_time));
      }
    } catch {
      // silently fail — data is still being saved per-second by the backend
    } finally {
      setAutoSaving(false);
    }
  };

  // Hourly auto-save timer
  useEffect(() => {
    autoSaveTimerRef.current = setInterval(triggerAutoSave, AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(autoSaveTimerRef.current);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:8000/api/motor");
        setMotor(res.data);
        setHistory((prev) => {
          const next = [...prev, res.data];
          return next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next;
        });
        setLastUpdated(new Date());
        setError(false);
      } catch {
        setError(true);
      }
    };
    fetchData();
    const id = setInterval(fetchData, 1000);
    return () => clearInterval(id);
  }, []);

  const recentReadings = history.slice(-IDLE_SECONDS);
  const isMotorStopped =
    !error &&
    motor?.esp_connected !== false &&
    history.length >= IDLE_SECONDS &&
    (
      recentReadings.every((h) => Math.abs(h.current - IDLE_CURRENT) <= IDLE_TOLERANCE) ||
      recentReadings.every((h) => h.vibration === 0)
    );

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
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${
                isMotorStopped
                  ? "bg-slate-700/40 border-slate-600/40"
                  : "bg-blue-600/15 border-blue-500/30"
              }`}>
                <FaCog className={isMotorStopped ? "text-slate-500" : "text-blue-400"} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white leading-tight">
                  12V Geared DC Motor
                </h1>
                <p className="text-slate-500 text-xs">
                  {isMotorStopped ? "Motor Stopped" : "Digital Twin Dashboard"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {error ? (
              <Pill color="red" label="Backend Offline" />
            ) : motor?.esp_connected === false ? (
              <Pill color="amber" label="ESP Offline" />
            ) : isMotorStopped ? (
              <Pill color="slate" label="Motor Stopped" />
            ) : (
              <Pill color="green" label="Live" pulse />
            )}
            {/* Auto-save status */}
            <button
              onClick={triggerAutoSave}
              disabled={autoSaving}
              title="Save a checkpoint now"
              className="flex items-center gap-1.5 border rounded-full px-3 py-1.5
                         bg-slate-800/60 border-slate-700 text-slate-400 text-xs
                         hover:bg-slate-700 hover:text-white transition-all disabled:opacity-50"
            >
              {autoSaving ? (
                <FaSave className="animate-pulse text-blue-400" />
              ) : (
                <FaSave />
              )}
              {lastAutoSave ? (
                <span className="hidden sm:inline">
                  Saved {lastAutoSave.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              ) : (
                <span className="hidden sm:inline flex items-center gap-1">
                  <FaClock className="text-xs" /> Auto-save: 1 hr
                </span>
              )}
            </button>
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
            {/* ESP offline banner */}
            {motor.esp_connected === false && (
              <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/25 rounded-xl px-5 py-3 mb-8 text-sm">
                <FaExclamationTriangle className="text-amber-400 shrink-0" />
                <div>
                  <span className="text-amber-300 font-semibold">ESP32 not responding</span>
                  <span className="text-amber-500 ml-2">— no data received in the last 3 seconds. Showing last known values.</span>
                </div>
              </div>
            )}

            {/* Motor stopped banner */}
            {isMotorStopped && (
              <div className="flex items-center gap-3 bg-slate-700/20 border border-slate-600/30 rounded-xl px-5 py-3 mb-8 text-sm">
                <FaStop className="text-slate-400 shrink-0" />
                <span className="text-slate-300 font-semibold">Motor Stopped</span>
              </div>
            )}

            {/* Sensor Readings */}
            {/* v() returns null when motor is stopped so every card shows — */}
            <Section title="Sensor Readings" />
            {(() => {
              const v = (val) => isMotorStopped ? null : val;
              return (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-10">
                  <MetricCard icon={<FaChartLine />}       title="RPM Reduction" value={v(motor.rpm_reduction_percent)} unit="%"   color="blue"   />
                  <MetricCard icon={<FaTachometerAlt />}   title="Actual RPM"    value={v(motor.rpm_actual)}            unit="RPM" color="cyan"   />
                  <MetricCard icon={<FaBolt />}            title="Current"       value={v(motor.current)}               unit="A"   color="orange" />
                  <MetricCard icon={<FaThermometerHalf />} title="Ambient Temp"  value={v(motor.ambient_temperature)}   unit="°C"  color="red"    />
                  <MetricCard icon={<FaThermometerHalf />} title="Motor Temp"    value={v(motor.estimated_temperature)} unit="°C"  color="orange" />
                  <MetricCard icon={<FaTint />}            title="Humidity"      value={v(motor.ambient_humidity)}      unit="%"   color="blue"   />
                  <MetricCard icon={<FaWaveSquare />}      title="Vibration"     value={v(motor.vibration)}             unit="g"   color="purple" />
                  <VibLevelCard value={v(motor.vibration_level)} />
                  <MetricCard icon={<FaChartBar />}        title="Efficiency"    value={v(motor.efficiency_index)}      unit="%"   color="green"  />
                  <MetricCard icon={<FaHeartbeat />}       title="Health Score"  value={v(motor.health_score)}          unit="%"   color="green"  />
                </div>
              );
            })()}

            {/* AI Predictions */}
            <Section title="AI Predictions" accent />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              <FaultTypeCard   value={isMotorStopped ? null : motor.fault_type}          />
              <FailureProbCard value={isMotorStopped ? null : motor.failure_probability} />
              <MaintenanceCard value={isMotorStopped ? null : motor.maintenance}         />
              <DigitalTwinCard espConnected={motor.esp_connected} />
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

            {/* Real-Time Charts */}
            <Section title="Real-Time Charts" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <RealtimeChart
                title="RPM Trend"
                icon={<FaTachometerAlt />}
                iconColor="text-cyan-400"
                unit="RPM"
                current={isMotorStopped ? null : motor.rpm_actual}
                espConnected={motor.esp_connected}
                stopped={isMotorStopped}
                series={[
                  { label: "Actual RPM", color: "#22d3ee", data: isMotorStopped ? [] : history.map((h) => h.rpm_actual) },
                ]}
              />
              <RealtimeChart
                title="Current Consumption"
                icon={<FaBolt />}
                iconColor="text-orange-400"
                unit="A"
                current={isMotorStopped ? null : motor.current}
                espConnected={motor.esp_connected}
                stopped={isMotorStopped}
                series={[
                  { label: "Current", color: "#fb923c", data: isMotorStopped ? [] : history.map((h) => h.current) },
                ]}
              />
              <RealtimeChart
                title="Temperature"
                icon={<FaThermometerHalf />}
                iconColor="text-red-400"
                unit="°C"
                current={isMotorStopped ? null : motor.estimated_temperature}
                espConnected={motor.esp_connected}
                stopped={isMotorStopped}
                series={[
                  { label: "Ambient", color: "#60a5fa", data: isMotorStopped ? [] : history.map((h) => h.ambient_temperature)   },
                  { label: "Motor",   color: "#f87171", data: isMotorStopped ? [] : history.map((h) => h.estimated_temperature) },
                ]}
              />
              <RealtimeChart
                title="Vibration"
                icon={<FaWaveSquare />}
                iconColor="text-purple-400"
                unit="g"
                current={isMotorStopped ? null : motor.vibration}
                espConnected={motor.esp_connected}
                stopped={isMotorStopped}
                series={[
                  { label: "Vibration", color: "#c084fc", data: isMotorStopped ? [] : history.map((h) => h.vibration) },
                ]}
              />
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
    amber: "bg-amber-500/10  border-amber-500/20  text-amber-400",
    red:   "bg-red-500/10    border-red-500/20    text-red-400",
    slate: "bg-slate-700/30  border-slate-600/40  text-slate-400",
  };
  const dot = { green: "bg-emerald-400", amber: "bg-amber-400", red: "bg-red-400", slate: "bg-slate-500" };
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
    value == null
      ? "—"
      : typeof value === "number"
      ? value % 1 === 0 ? value : value.toFixed(2)
      : value;
  return (
    <div className={`${c.bg} ${c.border} border rounded-2xl p-4`}>
      <div className={`${c.icon} mb-3`}>{icon}</div>
      <p className="text-slate-500 text-xs font-medium mb-1 truncate">{title}</p>
      <p className={`text-2xl font-black ${value == null ? "text-slate-700" : c.val} leading-none`}>{display}</p>
      <p className="text-slate-600 text-xs mt-1">{unit}</p>
    </div>
  );
}

function VibLevelCard({ value }) {
  const cls = value == null
    ? "bg-slate-800/40 border-slate-700/40 text-slate-600"
    : VIB_LEVEL_COLORS[value] ?? VIB_LEVEL_COLORS.NONE;
  return (
    <div className={`${cls} border rounded-2xl p-4`}>
      <div className="mb-3"><FaExclamationTriangle /></div>
      <p className="text-slate-500 text-xs font-medium mb-1">Vibration Level</p>
      <p className="text-xl font-black leading-none">{value ?? "—"}</p>
      <p className="text-slate-600 text-xs mt-1">level</p>
    </div>
  );
}

function FaultTypeCard({ value }) {
  if (value == null) return <EmptyPredCard icon={<FaBrain />} label="Fault Type" />;
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
  if (value == null) return <EmptyPredCard icon={<FaExclamationTriangle />} label="Failure Probability" />;
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
  if (value == null) return <EmptyPredCard icon={<FaTools />} label="Maintenance" />;
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

function EmptyPredCard({ icon, label }) {
  return (
    <div className="bg-slate-800/30 border border-slate-700/40 rounded-2xl p-6 text-center text-slate-700">
      <div className="flex justify-center text-3xl mb-3">{icon}</div>
      <p className="text-xs font-bold uppercase tracking-widest mb-2">{label}</p>
      <p className="text-2xl font-black mb-1">—</p>
      <p className="text-xs">Motor stopped</p>
    </div>
  );
}

function DigitalTwinCard({ espConnected }) {
  const online = espConnected !== false;
  return (
    <div className={`border rounded-2xl p-6 text-center ${
      online
        ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
        : "bg-amber-500/10 border-amber-500/30 text-amber-400"
    }`}>
      <div className="flex justify-center text-3xl mb-3"><FaNetworkWired /></div>
      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Digital Twin</p>
      <p className="text-2xl font-black mb-1">{online ? "ONLINE" : "ESP OFFLINE"}</p>
      <p className="text-slate-500 text-xs">{online ? "Model synchronized" : "Awaiting ESP32 data"}</p>
    </div>
  );
}

/* ── Real-time chart wrapper ─────────────────────────────── */
function RealtimeChart({ title, icon, iconColor, unit, current, espConnected, stopped, series }) {
  const allData = series.flatMap((s) => s.data);
  const min = allData.length ? Math.min(...allData) : 0;
  const max = allData.length ? Math.max(...allData) : 0;

  const display =
    current == null
      ? "—"
      : typeof current === "number"
      ? current % 1 === 0 ? current : current.toFixed(2)
      : "—";

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={iconColor}>{icon}</span>
          <span className="text-slate-300 text-sm font-semibold">{title}</span>
        </div>
        {espConnected === false ? (
          <div className="flex items-center gap-1.5 text-xs text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 block" />
            STALE
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse block" />
            LIVE
          </div>
        )}
      </div>

      {/* Value row */}
      <div className="px-5 pt-4 pb-1 flex items-end justify-between">
        <div>
          <span className={`text-3xl font-black ${iconColor}`}>{display}</span>
          <span className="text-slate-500 text-sm ml-1">{unit}</span>
        </div>
        <div className="text-right text-xs text-slate-600 space-y-0.5">
          <div>H <span className="text-slate-600">{stopped ? "—" : (max % 1 === 0 ? max : max.toFixed(2))}</span></div>
          <div>L <span className="text-slate-600">{stopped ? "—" : (min % 1 === 0 ? min : min.toFixed(2))}</span></div>
        </div>
      </div>

      {/* SVG chart */}
      <div className="px-2 pb-3">
        <SVGChart series={series} stopped={stopped} />
      </div>

      {/* Legend (only when multiple series) */}
      {series.length > 1 && (
        <div className="flex gap-4 px-5 pb-4">
          {series.map((s) => (
            <div key={s.label} className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-3 h-0.5 rounded-full inline-block" style={{ backgroundColor: s.color }} />
              {s.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── SVG line chart (no library) ─────────────────────────── */
const VB_W = 500, VB_H = 150;
const PAD  = { t: 12, r: 12, b: 24, l: 40 };
const IW   = VB_W - PAD.l - PAD.r;
const IH   = VB_H - PAD.t - PAD.b;

function SVGChart({ series, stopped }) {
  const uid = useId();
  const allVals = series.flatMap((s) => s.data).filter((v) => v != null);

  if (stopped) {
    return (
      <div className="h-36 flex items-center justify-center text-slate-700 text-xs gap-2">
        <FaStop className="text-xs" /> Motor Stopped
      </div>
    );
  }

  if (allVals.length < 2) {
    return (
      <div className="h-36 flex items-center justify-center text-slate-700 text-xs">
        Collecting data…
      </div>
    );
  }

  const rawMin = Math.min(...allVals);
  const rawMax = Math.max(...allVals);
  const pad    = (rawMax - rawMin) * 0.15 || 0.5;
  const yMin   = rawMin - pad;
  const yMax   = rawMax + pad;
  const yRange = yMax - yMin;

  const toX = (i, n) => PAD.l + (i / Math.max(n - 1, 1)) * IW;
  const toY = (v)    => PAD.t + ((yMax - v) / yRange) * IH;

  const GRID = 4;

  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full" style={{ height: VB_H }}>
      <defs>
        {series.map((s, si) => (
          <linearGradient key={si} id={`${uid}-g${si}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={s.color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={s.color} stopOpacity="0"    />
          </linearGradient>
        ))}
      </defs>

      {/* Horizontal grid lines + Y labels */}
      {Array.from({ length: GRID + 1 }, (_, i) => {
        const y = PAD.t + (i / GRID) * IH;
        const v = yMax  - (i / GRID) * yRange;
        const label = Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(1);
        return (
          <g key={i}>
            <line
              x1={PAD.l} y1={y} x2={VB_W - PAD.r} y2={y}
              stroke="rgba(148,163,184,0.07)" strokeWidth="1"
            />
            <text
              x={PAD.l - 5} y={y + 3.5}
              textAnchor="end" fontSize="9" fill="rgba(148,163,184,0.35)"
            >
              {label}
            </text>
          </g>
        );
      })}

      {/* Bottom axis */}
      <line
        x1={PAD.l} y1={VB_H - PAD.b} x2={VB_W - PAD.r} y2={VB_H - PAD.b}
        stroke="rgba(148,163,184,0.12)" strokeWidth="1"
      />

      {/* Series */}
      {series.map((s, si) => {
        const { data, color } = s;
        if (data.length < 2) return null;
        const n = data.length;

        const linePts = data.map((v, i) => `${toX(i, n)},${toY(v)}`).join(" ");
        const areaPts = [
          `${toX(0, n)},${VB_H - PAD.b}`,
          ...data.map((v, i) => `${toX(i, n)},${toY(v)}`),
          `${toX(n - 1, n)},${VB_H - PAD.b}`,
        ].join(" ");

        const lx = toX(n - 1, n);
        const ly = toY(data[n - 1]);

        return (
          <g key={si}>
            <polygon points={areaPts} fill={`url(#${uid}-g${si})`} />
            <polyline
              points={linePts}
              fill="none" stroke={color} strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
            />
            {/* Animated pulse on latest point */}
            <circle cx={lx} cy={ly} r="5" fill={color} fillOpacity="0.18" />
            <circle cx={lx} cy={ly} r="3" fill={color} />
          </g>
        );
      })}
    </svg>
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
