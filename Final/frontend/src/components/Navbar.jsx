import { Link, useLocation } from "react-router-dom";
import { FaCog } from "react-icons/fa";

const NAV_LINKS = [
  { label: "Home",            path: "/" },
  { label: "History",         path: "/history" },
  { label: "Model",           path: "/model" },
  { label: "Edit Components", path: "/edit" },
  { label: "About Us",        path: "/about" },
  { label: "Contact Us",      path: "/contact" },
];

function Navbar() {
  const { pathname } = useLocation();

  return (
    <nav className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/25">
            <FaCog className="text-white text-sm animate-spin-slow" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">
            Smart<span className="text-blue-400">Twin</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ label, path }) => (
            <Link
              key={path}
              to={path}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                pathname === path
                  ? "bg-blue-600/20 text-blue-400"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

      </div>
    </nav>
  );
}

export default Navbar;
