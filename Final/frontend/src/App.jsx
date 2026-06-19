import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import About from "./pages/About";
import EditComponents from "./pages/EditComponents";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                element={<Home />}             />
        <Route path="/dashboard/motor" element={<Dashboard />}        />
        <Route path="/about"           element={<About />}            />
        <Route path="/edit"            element={<EditComponents />}   />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
