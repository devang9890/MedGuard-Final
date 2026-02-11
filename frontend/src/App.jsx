import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Suppliers from "./pages/Suppliers";
import Medicines from "./pages/Medicines";
import Supplies from "./pages/Supplies";
import Alerts from "./pages/Alerts";
import Trust from "./pages/Trust";
import Corruption from "./pages/Corruption";
import Priority from "./pages/Priority";
import NationalMap from "./pages/NationalMap";
import Login from "./pages/Login";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/suppliers" element={<Suppliers />} />
        <Route path="/medicines" element={<Medicines />} />
        <Route path="/supplies" element={<Supplies />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/trust" element={<Trust />} />
        <Route path="/corruption" element={<Corruption />} />
        <Route path="/priority" element={<Priority />} />
        <Route path="/national-map" element={<NationalMap />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
