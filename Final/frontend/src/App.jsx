import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import About from "./pages/About";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                element={<Home />}      />
        <Route path="/dashboard/motor" element={<Dashboard />} />
        <Route path="/about"           element={<About />}     />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
