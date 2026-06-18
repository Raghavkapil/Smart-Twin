import { FaMicrochip, FaBrain, FaWifi, FaChartLine, FaCog } from "react-icons/fa";
import Navbar from "../components/Navbar";

const TECH_STACK = [
  { label: "ESP32", desc: "Microcontroller & WiFi", icon: <FaMicrochip />, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  { label: "Flask",  desc: "Python Backend API",    icon: <FaWifi />,       color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { label: "XGBoost", desc: "ML Health Prediction", icon: <FaBrain />,    color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  { label: "React",  desc: "Live Web Dashboard",    icon: <FaChartLine />, color: "text-cyan-400",   bg: "bg-cyan-500/10 border-cyan-500/20" },
];

const SENSORS = ["LM35", "DHT22", "MPU6050", "ACS712", "Rotary Encoder"];

function About() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      {/* ── Header ──────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/50 via-slate-950 to-slate-950" />
        <div
          className="absolute inset-0 opacity-100"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(148,163,184,0.05) 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-6 py-20 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 rounded-3xl bg-blue-500 blur-3xl opacity-20 scale-150" />
              <div className="relative w-20 h-20 bg-slate-800 border border-slate-700 rounded-3xl flex items-center justify-center">
                <FaCog className="text-blue-400 text-4xl animate-spin-slow" />
              </div>
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-4">
            About <span className="text-blue-400">Us</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Final year students building the future of predictive maintenance.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 pb-20 space-y-12">

        {/* ── Who We Are ──────────────────────────────────── */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-4">Who We Are</h2>
          <p className="text-slate-400 leading-relaxed text-base">
            We are final year students who developed the <span className="text-blue-400 font-semibold">Smart Twin</span> project
            as part of our training program. This work represents our hands-on exploration of Industrial Internet of Things (IIoT),
            machine learning, and modern web technologies — combining them into a practical, cost-effective predictive maintenance system.
          </p>
        </section>

        {/* ── About the Project ────────────────────────────── */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6">
          <h2 className="text-2xl font-bold text-white">About the Project</h2>

          <p className="text-slate-400 leading-relaxed">
            The <span className="text-white font-semibold">Smart Twin</span> project presents a low-cost Digital Twin framework
            for predictive maintenance of a 12 V geared DC motor using IIoT technologies and machine learning. The system
            continuously monitors critical operating parameters including motor temperature, ambient temperature, humidity,
            vibration, current consumption, and rotational speed using an integrated sensor network.
          </p>

          {/* Sensor chips */}
          <div>
            <p className="text-slate-500 text-sm mb-3 uppercase tracking-wider font-semibold">Sensor Network</p>
            <div className="flex flex-wrap gap-2">
              {SENSORS.map((s) => (
                <span
                  key={s}
                  className="text-xs bg-slate-800 border border-slate-700 text-slate-300 rounded-md px-3 py-1.5 font-mono"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          <p className="text-slate-400 leading-relaxed">
            An <span className="text-white font-semibold">ESP32 microcontroller</span> acquires and processes sensor data before
            transmitting it over a local Wi-Fi network to a <span className="text-white font-semibold">Python Flask</span> backend
            through HTTP-based communication. The backend performs real-time data processing and executes an{" "}
            <span className="text-white font-semibold">XGBoost</span> machine learning model trained on a hybrid dataset
            consisting of experimentally collected baseline readings and synthetically generated fault conditions.
          </p>

          <p className="text-slate-400 leading-relaxed">
            Based on incoming sensor values, the model estimates the motor health score, predicts potential fault conditions,
            and generates maintenance recommendations. The processed information is visualized through a{" "}
            <span className="text-white font-semibold">React-based web dashboard</span> that provides live sensor readings,
            health indicators, and maintenance alerts.
          </p>

          <p className="text-slate-400 leading-relaxed">
            The proposed framework demonstrates the practical implementation of Digital Twin technology using affordable hardware
            and open-source software tools. The modular architecture enables real-time monitoring, predictive analytics, and
            intuitive visualization while remaining scalable for future industrial applications. The project highlights the
            potential of combining IIoT, machine learning, and web technologies to develop cost-effective predictive maintenance
            solutions aligned with <span className="text-blue-400 font-semibold">Industry 4.0</span> principles.
          </p>
        </section>

        {/* ── Tech Stack ──────────────────────────────────── */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6">Technology Stack</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TECH_STACK.map(({ label, desc, icon, color, bg }) => (
              <div
                key={label}
                className={`bg-slate-900 border rounded-2xl p-6 flex flex-col items-center text-center gap-3 ${bg}`}
              >
                <div className={`text-3xl ${color}`}>{icon}</div>
                <div>
                  <div className={`font-bold text-lg ${color}`}>{label}</div>
                  <div className="text-slate-500 text-xs mt-1">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}

export default About;
