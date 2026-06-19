import { useState } from "react";
import {
  FaCog, FaPlus, FaTrash, FaCheckCircle, FaCircle, FaWifi,
  FaMicrochip, FaCode, FaNetworkWired, FaTag, FaUpload, FaRocket,
  FaTimes, FaExclamationTriangle, FaChevronRight, FaChevronLeft,
} from "react-icons/fa";
import Navbar from "../components/Navbar";

/* ── initial component registry (mirrors Home) ─────────── */
const INITIAL_COMPONENTS = [
  {
    id: "motor-12v",
    name: "12V Geared DC Motor",
    sensors: ["LM35", "DHT22", "MPU6050", "ACS712", "Encoder"],
    status: "online",
  },
];

/* ── add-wizard step definitions ────────────────────────── */
const STEPS = [
  {
    icon: <FaMicrochip />,
    title: "Prepare Hardware",
    color: "text-blue-400",
    ring: "ring-blue-500/40",
    bg: "bg-blue-500/10",
    content: (
      <div className="space-y-4">
        <p className="text-slate-400 leading-relaxed">
          Gather your ESP32 development board and the sensors for the component you want to monitor.
          Ensure everything is powered off before wiring.
        </p>
        <div className="bg-slate-800 rounded-xl p-4 space-y-2">
          <p className="text-slate-300 text-sm font-semibold mb-3">Recommended sensor connections</p>
          {[
            ["LM35",          "GPIO34 (ADC1_CH6) — motor temperature"],
            ["DHT22",         "GPIO4             — ambient temp & humidity"],
            ["MPU6050",       "SDA → GPIO21 / SCL → GPIO22 — vibration"],
            ["ACS712",        "GPIO35 (ADC1_CH7) — current sensing"],
            ["Rotary Encoder","GPIO18 (CLK) / GPIO19 (DT) — RPM"],
          ].map(([chip, note]) => (
            <div key={chip} className="flex items-start gap-3 text-sm">
              <span className="font-mono text-blue-300 w-28 shrink-0">{chip}</span>
              <span className="text-slate-500">{note}</span>
            </div>
          ))}
        </div>
        <p className="text-slate-500 text-sm">
          Power the ESP32 via USB or a regulated 5 V supply. Confirm the onboard LED lights up.
        </p>
      </div>
    ),
  },
  {
    icon: <FaCode />,
    title: "Install Firmware",
    color: "text-emerald-400",
    ring: "ring-emerald-500/40",
    bg: "bg-emerald-500/10",
    content: (
      <div className="space-y-4">
        <p className="text-slate-400 leading-relaxed">
          Set up the Arduino IDE (v2+) or PlatformIO with the ESP32 board support package, then
          install the required libraries.
        </p>
        <div className="bg-slate-800 rounded-xl p-4 space-y-3">
          <p className="text-slate-300 text-sm font-semibold">Required Libraries</p>
          {[
            ["WiFi.h",        "Built-in — ESP32 WiFi stack"],
            ["HTTPClient.h",  "Built-in — HTTP POST to Flask"],
            ["ArduinoJson",   "Install via Library Manager (v6+)"],
            ["Wire.h",        "Built-in — I²C for MPU6050"],
            ["DHT sensor lib","Install via Library Manager (Adafruit)"],
          ].map(([lib, note]) => (
            <div key={lib} className="flex items-start gap-3 text-sm">
              <code className="bg-slate-700 text-emerald-300 px-2 py-0.5 rounded text-xs font-mono w-36 shrink-0">{lib}</code>
              <span className="text-slate-500">{note}</span>
            </div>
          ))}
        </div>
        <p className="text-slate-500 text-sm">
          Open <code className="text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded text-xs">SmartTwin_ESP32.ino</code> from
          the firmware folder in your Arduino IDE before proceeding to the next step.
        </p>
      </div>
    ),
  },
  {
    icon: <FaNetworkWired />,
    title: "Configure Network",
    color: "text-purple-400",
    ring: "ring-purple-500/40",
    bg: "bg-purple-500/10",
    content: (
      <div className="space-y-4">
        <p className="text-slate-400 leading-relaxed">
          Open <code className="text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded text-xs">config.h</code> and
          fill in your local network credentials and the IP address of the machine running the Flask server.
        </p>
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 font-mono text-sm leading-relaxed">
          <p className="text-slate-600">{"// config.h"}</p>
          <p><span className="text-purple-400">#define</span> <span className="text-white">WIFI_SSID</span>     <span className="text-emerald-300">"YourNetworkName"</span></p>
          <p><span className="text-purple-400">#define</span> <span className="text-white">WIFI_PASSWORD</span> <span className="text-emerald-300">"YourPassword"</span></p>
          <p><span className="text-purple-400">#define</span> <span className="text-white">SERVER_IP</span>     <span className="text-emerald-300">"192.168.x.x"</span></p>
          <p><span className="text-purple-400">#define</span> <span className="text-white">SERVER_PORT</span>   <span className="text-blue-300">8000</span></p>
          <p><span className="text-purple-400">#define</span> <span className="text-white">POST_INTERVAL</span> <span className="text-blue-300">1000</span>  <span className="text-slate-600">{"// ms"}</span></p>
        </div>
        <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-sm">
          <FaWifi className="text-amber-400 mt-0.5 shrink-0" />
          <p className="text-amber-300">
            The ESP32 and the Flask server must be on the <strong>same local network</strong>.
            Run <code className="bg-slate-800 px-1 rounded text-xs">ipconfig</code> (Windows) or{" "}
            <code className="bg-slate-800 px-1 rounded text-xs">ifconfig</code> (Mac/Linux) to find the server IP.
          </p>
        </div>
      </div>
    ),
  },
  {
    icon: <FaTag />,
    title: "Assign Component ID",
    color: "text-cyan-400",
    ring: "ring-cyan-500/40",
    bg: "bg-cyan-500/10",
    content: (
      <div className="space-y-4">
        <p className="text-slate-400 leading-relaxed">
          Give this ESP32 node a unique identity so the dashboard can distinguish it from other components.
          Still inside <code className="text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded text-xs">config.h</code>:
        </p>
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 font-mono text-sm leading-relaxed">
          <p className="text-slate-600">{"// Unique node identity"}</p>
          <p><span className="text-purple-400">#define</span> <span className="text-white">COMPONENT_ID</span>   <span className="text-emerald-300">"motor-01"</span>   <span className="text-slate-600">{"// no spaces"}</span></p>
          <p><span className="text-purple-400">#define</span> <span className="text-white">COMPONENT_NAME</span> <span className="text-emerald-300">"12V DC Motor #2"</span></p>
          <p><span className="text-purple-400">#define</span> <span className="text-white">COMPONENT_TYPE</span> <span className="text-emerald-300">"motor"</span></p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 text-sm text-slate-400 space-y-1">
          <p className="text-slate-300 font-semibold mb-2">Naming rules</p>
          <p>• <code className="text-cyan-300">COMPONENT_ID</code> must be unique across all nodes (use lowercase + hyphens).</p>
          <p>• <code className="text-cyan-300">COMPONENT_NAME</code> is the human-readable label shown on the dashboard.</p>
          <p>• <code className="text-cyan-300">COMPONENT_TYPE</code> tells the backend which ML model to apply.</p>
        </div>
      </div>
    ),
  },
  {
    icon: <FaUpload />,
    title: "Upload & Verify",
    color: "text-orange-400",
    ring: "ring-orange-500/40",
    bg: "bg-orange-500/10",
    content: (
      <div className="space-y-4">
        <p className="text-slate-400 leading-relaxed">
          Flash the firmware to your ESP32 and confirm it connects successfully before moving on.
        </p>
        <div className="bg-slate-800 rounded-xl p-4 space-y-3">
          <p className="text-slate-300 text-sm font-semibold">Upload steps</p>
          {[
            "Select the correct board: Tools → Board → ESP32 Dev Module",
            "Select the correct port: Tools → Port → COMx (Windows) or /dev/ttyUSB0 (Linux/Mac)",
            "Click the Upload button (→) and wait for 'Done uploading'",
            "Open Serial Monitor at 115200 baud",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3 text-sm">
              <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span className="text-slate-400">{step}</span>
            </div>
          ))}
        </div>
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 font-mono text-xs text-slate-400 leading-relaxed">
          <p className="text-emerald-400">✓ Connecting to WiFi...</p>
          <p className="text-emerald-400">✓ WiFi connected! IP: 192.168.1.42</p>
          <p className="text-emerald-400">✓ Registered with server as motor-01</p>
          <p className="text-blue-400">→ Sending data... [OK] 200</p>
          <p className="text-blue-400">→ Sending data... [OK] 200</p>
        </div>
      </div>
    ),
  },
  {
    icon: <FaRocket />,
    title: "Done — Component Live",
    color: "text-emerald-400",
    ring: "ring-emerald-500/40",
    bg: "bg-emerald-500/10",
    content: (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-6">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-emerald-500 blur-2xl opacity-20 scale-150" />
            <FaCheckCircle className="relative text-emerald-400 text-6xl" />
          </div>
        </div>
        <p className="text-slate-400 leading-relaxed text-center">
          Your ESP32 node is live and streaming data to the Flask backend. The component has been
          automatically registered and will appear on the Home dashboard.
        </p>
        <div className="bg-slate-800 rounded-xl p-4 space-y-2 text-sm">
          {[
            "Component auto-registered with the Flask server",
            "XGBoost model running health predictions in real-time",
            "Live sensor feed visible on the dashboard",
            "Fault alerts enabled for this component",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 text-slate-400">
              <FaCheckCircle className="text-emerald-400 shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>
        <p className="text-slate-500 text-sm text-center">
          Navigate to <span className="text-white font-semibold">Home</span> to see your new component card.
        </p>
      </div>
    ),
  },
];

/* ═══════════════════════════════════════════════════════════ */

function EditComponents() {
  const [components, setComponents]     = useState(INITIAL_COMPONENTS);
  const [mode, setMode]                 = useState(null);   // null | "add" | "delete"
  const [activeStep, setActiveStep]     = useState(0);
  const [deleteTarget, setDeleteTarget] = useState(null);   // component id

  function openAdd() { setMode("add"); setActiveStep(0); }
  function openDelete() { setMode("delete"); setDeleteTarget(null); }
  function closePanel() { setMode(null); setDeleteTarget(null); }

  function confirmDelete() {
    setComponents((prev) => prev.filter((c) => c.id !== deleteTarget));
    setDeleteTarget(null);
    if (components.length === 1) setMode(null);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      {/* ── Header ──────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/40 via-slate-950 to-slate-950" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(148,163,184,0.05) 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-6 py-16 text-center">
          <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-3">
            Edit <span className="text-blue-400">Components</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Add a new ESP32-connected device or remove an existing one from the dashboard.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 pb-20 space-y-8">

        {/* ── Action buttons ──────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={openAdd}
            className={`flex items-center gap-4 p-6 rounded-2xl border transition-all duration-200 text-left
              ${mode === "add"
                ? "bg-blue-600/20 border-blue-500/50 shadow-lg shadow-blue-500/10"
                : "bg-slate-900 border-slate-800 hover:border-blue-500/30 hover:bg-slate-800/60"}`}
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center shrink-0">
              <FaPlus className="text-blue-400 text-xl" />
            </div>
            <div>
              <p className="text-white font-bold text-lg">Add Component</p>
              <p className="text-slate-500 text-sm mt-0.5">Connect a new ESP32 device via WiFi</p>
            </div>
          </button>

          <button
            onClick={openDelete}
            className={`flex items-center gap-4 p-6 rounded-2xl border transition-all duration-200 text-left
              ${mode === "delete"
                ? "bg-red-600/15 border-red-500/40 shadow-lg shadow-red-500/10"
                : "bg-slate-900 border-slate-800 hover:border-red-500/30 hover:bg-slate-800/60"}`}
          >
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
              <FaTrash className="text-red-400 text-xl" />
            </div>
            <div>
              <p className="text-white font-bold text-lg">Delete Component</p>
              <p className="text-slate-500 text-sm mt-0.5">Remove a component from the dashboard</p>
            </div>
          </button>
        </div>

        {/* ══════════════════════════════════════════════
            ADD WIZARD
        ══════════════════════════════════════════════ */}
        {mode === "add" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">

            {/* wizard header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <div>
                <p className="text-white font-bold">Connect a New ESP32 Component</p>
                <p className="text-slate-500 text-xs mt-0.5">Step {activeStep + 1} of {STEPS.length}</p>
              </div>
              <button onClick={closePanel} className="text-slate-500 hover:text-white transition-colors">
                <FaTimes />
              </button>
            </div>

            {/* step rail */}
            <div className="flex items-center gap-0 px-6 py-4 border-b border-slate-800 overflow-x-auto">
              {STEPS.map((step, i) => (
                <div key={i} className="flex items-center shrink-0">
                  <button
                    onClick={() => setActiveStep(i)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                      ${i === activeStep
                        ? `${step.bg} ${step.color} ring-1 ${step.ring}`
                        : i < activeStep
                          ? "text-emerald-400"
                          : "text-slate-600 hover:text-slate-400"}`}
                  >
                    {i < activeStep
                      ? <FaCheckCircle className="text-emerald-400" />
                      : i === activeStep
                        ? <span className={step.color}>{step.icon}</span>
                        : <FaCircle className="text-slate-700 text-xs" />}
                    <span className="hidden sm:inline">{step.title}</span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <FaChevronRight className="text-slate-700 text-xs mx-1" />
                  )}
                </div>
              ))}
            </div>

            {/* step content */}
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-xl ${STEPS[activeStep].bg} border ${STEPS[activeStep].ring} flex items-center justify-center ${STEPS[activeStep].color} text-lg`}>
                  {STEPS[activeStep].icon}
                </div>
                <h3 className="text-white font-bold text-xl">{STEPS[activeStep].title}</h3>
              </div>
              {STEPS[activeStep].content}
            </div>

            {/* navigation */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800">
              <button
                onClick={() => setActiveStep((s) => Math.max(0, s - 1))}
                disabled={activeStep === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                           text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed
                           hover:bg-slate-800 transition-all"
              >
                <FaChevronLeft /> Back
              </button>

              {activeStep < STEPS.length - 1 ? (
                <button
                  onClick={() => setActiveStep((s) => s + 1)}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold
                             bg-blue-600 hover:bg-blue-500 text-white transition-all"
                >
                  Next <FaChevronRight />
                </button>
              ) : (
                <button
                  onClick={closePanel}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold
                             bg-emerald-600 hover:bg-emerald-500 text-white transition-all"
                >
                  <FaCheckCircle /> Finish
                </button>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            DELETE PANEL
        ══════════════════════════════════════════════ */}
        {mode === "delete" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">

            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <div>
                <p className="text-white font-bold">Remove a Component</p>
                <p className="text-slate-500 text-xs mt-0.5">{components.length} component{components.length !== 1 ? "s" : ""} registered</p>
              </div>
              <button onClick={closePanel} className="text-slate-500 hover:text-white transition-colors">
                <FaTimes />
              </button>
            </div>

            <div className="p-6 space-y-3">
              {components.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No components registered.</p>
              ) : (
                components.map((comp) => (
                  <div
                    key={comp.id}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all
                      ${deleteTarget === comp.id
                        ? "bg-red-500/10 border-red-500/40"
                        : "bg-slate-800/60 border-slate-700/50"}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/20 flex items-center justify-center">
                        <FaCog className="text-blue-400" />
                      </div>
                      <div>
                        <p className="text-white font-semibold">{comp.name}</p>
                        <div className="flex gap-1.5 mt-1 flex-wrap">
                          {comp.sensors.map((s) => (
                            <span key={s} className="text-xs font-mono bg-slate-700 text-slate-400 px-2 py-0.5 rounded">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {deleteTarget === comp.id ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={confirmDelete}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition-all"
                        >
                          Confirm Delete
                        </button>
                        <button
                          onClick={() => setDeleteTarget(null)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-300 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteTarget(comp.id)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium
                                   text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-all shrink-0"
                      >
                        <FaTrash /> Remove
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* warning banner */}
            {deleteTarget && (
              <div className="mx-6 mb-6 flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-sm">
                <FaExclamationTriangle className="text-amber-400 shrink-0 mt-0.5" />
                <p className="text-amber-300">
                  Removing a component only unregisters it from the dashboard. To fully disconnect the
                  device, power off the ESP32 or remove it from the network.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Component overview (always visible) ─────── */}
        <div>
          <h2 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-4">
            Registered Components
          </h2>
          {components.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-600">
              No components registered. Add one above.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {components.map((comp) => (
                <div
                  key={comp.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/20 flex items-center justify-center">
                      <FaCog className="text-blue-400" />
                    </div>
                    <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      ONLINE
                    </span>
                  </div>
                  <p className="text-white font-semibold">{comp.name}</p>
                  <p className="text-slate-600 text-xs font-mono mt-0.5 mb-3">{comp.id}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {comp.sensors.map((s) => (
                      <span key={s} className="text-xs font-mono bg-slate-800 border border-slate-700 text-slate-400 px-2 py-0.5 rounded">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default EditComponents;
