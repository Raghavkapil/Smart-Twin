import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import About from "./pages/About";
import EditComponents from "./pages/EditComponents";
import History from "./pages/History";
import ModelResults from "./pages/ModelResults";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                element={<Home />}             />
        <Route path="/dashboard/motor" element={<Dashboard />}        />
        <Route path="/about"           element={<About />}            />
        <Route path="/edit"            element={<EditComponents />}   />
        <Route path="/history"         element={<History />}          />
        <Route path="/model"           element={<ModelResults />}     />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
