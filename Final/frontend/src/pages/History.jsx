import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  FaHistory, FaDownload, FaSearch, FaFilter, FaChevronLeft,
  FaChevronRight, FaHeartbeat, FaExclamationTriangle, FaCheckCircle,
  FaSyncAlt, FaDatabase,
} from "react-icons/fa";
import Navbar from "../components/Navbar";

const PAGE_SIZE = 25;

const FAULT_COLORS = {
  Normal:           "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Bearing_Wear:     "bg-orange-500/15  text-orange-400  border-orange-500/30",
  Overheating_Risk: "bg-yellow-500/15  text-yellow-400  border-yellow-500/30",
  Overloaded:       "bg-orange-500/15  text-orange-400  border-orange-500/30",
  Critical:         "bg-red-500/15     text-red-400     border-red-500/30",
};

const FAULT_OPTIONS = ["All", "Normal", "Bearing_Wear", "Overheating_Risk", "Overloaded", "Critical"];

function fmt(v, dec = 2) {
  const n = parseFloat(v);
  return isNaN(n) ? "—" : n.toFixed(dec);
}

function healthColor(score) {
  const s = parseFloat(score);
  if (s >= 75) return "text-emerald-400";
  if (s >= 50) return "text-yellow-400";
  return "text-red-400";
}

// ─── Main page ───────────────────────────────────────────────
function History() {
  const [rows, setRows]         = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);
  const [search, setSearch]     = useState("");
  const [faultFilter, setFault] = useState("All");
  const [page, setPage]         = useState(1);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/history");
      setRows(res.data.rows);
      setTotal(res.data.total);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Reset to page 1 whenever filters change
  useEffect(() => { setPage(1); }, [search, faultFilter]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchFault  = faultFilter === "All" || r.fault_type === faultFilter;
      const matchSearch = search === "" ||
        r.timestamp?.toLowerCase().includes(search.toLowerCase()) ||
        r.fault_type?.toLowerCase().includes(search.toLowerCase());
      return matchFault && matchSearch;
    });
  }, [rows, faultFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Summary stats
  const stats = useMemo(() => {
    if (!rows.length) return null;
    const health = rows.map((r) => parseFloat(r.health_score)).filter((v) => !isNaN(v));
    const faultCounts = {};
    rows.forEach((r) => { faultCounts[r.fault_type] = (faultCounts[r.fault_type] || 0) + 1; });
    const topFault = Object.entries(faultCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    return {
      avgHealth: health.length ? (health.reduce((a, b) => a + b, 0) / health.length).toFixed(1) : "—",
      minHealth: health.length ? Math.min(...health).toFixed(1) : "—",
      topFault,
      first: rows[rows.length - 1]?.timestamp,
      last:  rows[0]?.timestamp,
    };
  }, [rows]);

  function exportCSV() {
    window.open("http://127.0.0.1:8000/api/history/export", "_blank");
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
        <div className="relative max-w-7xl mx-auto px-6 py-14 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-600/15 border border-blue-500/30 rounded-xl flex items-center justify-center">
                <FaHistory className="text-blue-400" />
              </div>
              <h1 className="text-4xl font-black tracking-tight">
                Data <span className="text-blue-400">History</span>
              </h1>
            </div>
            <p className="text-slate-500 text-sm">
              All sensor readings saved while the ESP32 was online.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                         bg-slate-800 border border-slate-700 text-slate-300
                         hover:bg-slate-700 transition-all disabled:opacity-50"
            >
              <FaSyncAlt className={loading ? "animate-spin" : ""} /> Refresh
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                         bg-blue-600 hover:bg-blue-500 text-white transition-all"
            >
              <FaDownload /> Export CSV
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 pb-20 space-y-6">

        {/* ── Summary stats ───────────────────────────────── */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={<FaDatabase />}         color="blue"   label="Total Readings"  value={total.toLocaleString()} />
            <StatCard icon={<FaHeartbeat />}        color="green"  label="Avg Health Score" value={`${stats.avgHealth}%`} />
            <StatCard icon={<FaExclamationTriangle />} color="orange" label="Min Health Score" value={`${stats.minHealth}%`} />
            <StatCard icon={<FaCheckCircle />}      color="purple" label="Most Common Fault" value={stats.topFault?.replace("_", " ") ?? "—"} />
          </div>
        )}

        {/* Time range */}
        {stats?.first && (
          <p className="text-slate-600 text-xs">
            Recording from <span className="text-slate-400">{stats.first}</span> to{" "}
            <span className="text-slate-400">{stats.last}</span>
          </p>
        )}

        {/* ── Filters ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 text-xs" />
            <input
              type="text"
              placeholder="Search by timestamp or fault…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-4 py-2.5
                         text-sm text-slate-300 placeholder-slate-600 focus:outline-none
                         focus:border-blue-500/50 transition-colors"
            />
          </div>

          {/* Fault filter */}
          <div className="relative">
            <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 text-xs pointer-events-none" />
            <select
              value={faultFilter}
              onChange={(e) => setFault(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-10 py-2.5
                         text-sm text-slate-300 focus:outline-none focus:border-blue-500/50
                         transition-colors appearance-none cursor-pointer"
            >
              {FAULT_OPTIONS.map((f) => (
                <option key={f} value={f}>{f === "All" ? "All Fault Types" : f.replace("_", " ")}</option>
              ))}
            </select>
          </div>

          <div className="text-slate-600 text-xs self-center whitespace-nowrap">
            {filtered.length.toLocaleString()} result{filtered.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* ── Table ───────────────────────────────────────── */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-24 gap-3 text-slate-500 text-sm">
              <FaSyncAlt className="animate-spin" /> Loading history…
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-24 gap-2 text-slate-600">
              <FaExclamationTriangle className="text-2xl" />
              <p className="text-sm">Could not reach the backend.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-2 text-slate-700">
              <FaDatabase className="text-3xl" />
              <p className="text-sm">No records found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase tracking-wider">
                    {[
                      "Timestamp", "RPM", "Current (A)", "Amb. Temp (°C)",
                      "Motor Temp (°C)", "Humidity (%)", "Vibration (g)",
                      "Health %", "Fault Type", "Maint.",
                    ].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-slate-400 text-xs whitespace-nowrap">{row.timestamp}</td>
                      <td className="px-4 py-3 text-slate-300">{fmt(row.rpm_actual, 0)}</td>
                      <td className="px-4 py-3 text-orange-300">{fmt(row.current)}</td>
                      <td className="px-4 py-3 text-blue-300">{fmt(row.ambient_temperature, 1)}</td>
                      <td className="px-4 py-3 text-red-300">{fmt(row.estimated_temperature, 1)}</td>
                      <td className="px-4 py-3 text-cyan-300">{fmt(row.ambient_humidity, 1)}</td>
                      <td className="px-4 py-3 text-purple-300">{fmt(row.vibration)}</td>
                      <td className={`px-4 py-3 font-bold ${healthColor(row.health_score)}`}>
                        {fmt(row.health_score, 1)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold border rounded-md px-2 py-0.5 whitespace-nowrap
                          ${FAULT_COLORS[row.fault_type] ?? FAULT_COLORS.Normal}`}>
                          {row.fault_type?.replace("_", " ") ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold ${row.maintenance === "YES" ? "text-red-400" : "text-emerald-400"}`}>
                          {row.maintenance}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Pagination ──────────────────────────────────── */}
        {!loading && !error && filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between">
            <p className="text-slate-600 text-xs">
              Page {page} of {totalPages} · rows {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}
            </p>
            <div className="flex items-center gap-2">
              <PagBtn onClick={() => setPage(1)}           disabled={page === 1}          label="«" />
              <PagBtn onClick={() => setPage((p) => p - 1)} disabled={page === 1}          label={<FaChevronLeft />} />
              <span className="text-slate-400 text-sm font-semibold w-10 text-center">{page}</span>
              <PagBtn onClick={() => setPage((p) => p + 1)} disabled={page === totalPages} label={<FaChevronRight />} />
              <PagBtn onClick={() => setPage(totalPages)}  disabled={page === totalPages} label="»" />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function StatCard({ icon, color, label, value }) {
  const colors = {
    blue:   "bg-blue-500/10   border-blue-500/20   text-blue-400",
    green:  "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    orange: "bg-orange-500/10  border-orange-500/20  text-orange-400",
    purple: "bg-purple-500/10  border-purple-500/20  text-purple-400",
  };
  return (
    <div className={`border rounded-2xl p-5 ${colors[color]}`}>
      <div className="text-lg mb-2">{icon}</div>
      <p className="text-slate-500 text-xs mb-1">{label}</p>
      <p className="text-white font-black text-xl leading-none">{value}</p>
    </div>
  );
}

function PagBtn({ onClick, disabled, label }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-slate-400
                 hover:bg-slate-700 hover:text-white transition-all disabled:opacity-30
                 disabled:cursor-not-allowed flex items-center justify-center text-sm"
    >
      {label}
    </button>
  );
}

export default History;
