import { Link } from "react-router-dom";
import { FaCog, FaMicrochip, FaBrain, FaServer, FaClock } from "react-icons/fa";
import Navbar from "../components/Navbar";

const SENSOR_CHIPS = ["MPU6050", "DHT22", "ACS712"];
const STATS = [
  { value: "5", label: "IoT Sensors", color: "text-blue-400", icon: <FaMicrochip /> },
  { value: "10", label: "Parameters", color: "text-emerald-400", icon: <FaServer /> },
  { value: "AI", label: "Predictions", color: "text-purple-400", icon: <FaBrain /> },
];

function Home() {
  const time = new Date().toLocaleTimeString();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/60 via-slate-950 to-slate-950" />
        <div
          className="absolute inset-0 opacity-100"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(148,163,184,0.05) 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6 py-28 text-center">

          {/* Gear icon */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 rounded-3xl bg-blue-500 blur-3xl opacity-20 scale-150" />
              <div className="relative w-24 h-24 bg-slate-800 border border-slate-700 rounded-3xl flex items-center justify-center">
                <FaCog className="text-blue-400 text-5xl animate-spin-slow" />
              </div>
            </div>
          </div>

          <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-5">
            Smart<span className="text-blue-400">Twin</span>
          </h1>

          <p className="text-xl md:text-2xl font-semibold text-blue-300 mb-4">
            AI-Powered Digital Twin for Predictive Maintenance
          </p>

          <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto mb-16 leading-relaxed">
            Monitor industrial equipment in real-time using IoT sensors and machine learning.
            Detect faults before they become failures.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
            {STATS.map(({ value, label, color }) => (
              <div
                key={label}
                className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 backdrop-blur"
              >
                <div className={`text-3xl font-black ${color} mb-1`}>{value}</div>
                <div className="text-slate-500 text-xs">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Connected Equipment ─────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-16">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Connected Equipment</h2>
            <p className="text-slate-500 text-sm mt-1">
              Select a component to open its live dashboard
            </p>
          </div>
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse block" />
            <span className="text-emerald-400 text-sm font-semibold">1 Online</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <MotorCard sensors={SENSOR_CHIPS} time={time} />
        </div>
      </section>
    </div>
  );
}

function MotorCard({ sensors, time }) {
  return (
    <Link to="/dashboard/motor" className="block group">
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl p-6
                   hover:border-blue-500/40 hover:shadow-2xl hover:shadow-blue-500/10
                   transition-all duration-300"
      >
        {/* Top row */}
        <div className="flex items-start justify-between mb-6">
          <div
            className="w-14 h-14 bg-blue-600/15 border border-blue-500/20 rounded-xl
                       flex items-center justify-center
                       group-hover:bg-blue-600/25 group-hover:border-blue-500/40
                       transition-all duration-300"
          >
            <FaCog className="text-blue-400 text-2xl" />
          </div>
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse block" />
            <span className="text-emerald-400 text-xs font-bold">ONLINE</span>
          </div>
        </div>

        <h3 className="text-white font-bold text-lg mb-1">12V Geared DC Motor</h3>
        <p className="text-slate-500 text-sm mb-5">
          Digital Twin · Fault Detection · Predictive ML
        </p>

        {/* Sensor chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          {sensors.map((s) => (
            <span
              key={s}
              className="text-xs bg-slate-800 border border-slate-700 text-slate-300 rounded-md px-2.5 py-1 font-mono"
            >
              {s}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs">
            <FaClock />
            <span>{time}</span>
          </div>
          <span className="text-blue-400 text-sm font-semibold group-hover:translate-x-1 transition-transform inline-block">
            Open Dashboard →
          </span>
        </div>
      </div>
    </Link>
  );
}

export default Home;
