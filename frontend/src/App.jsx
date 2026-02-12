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

const ProtectedRoute = ({ element }) => {
  const token = localStorage.getItem("token");
  return token ? element : <Navigate to="/login" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
        <Route path="/suppliers" element={<ProtectedRoute element={<Suppliers />} />} />
        <Route path="/medicines" element={<ProtectedRoute element={<Medicines />} />} />
        <Route path="/supplies" element={<ProtectedRoute element={<Supplies />} />} />
        <Route path="/alerts" element={<ProtectedRoute element={<Alerts />} />} />
        <Route path="/trust" element={<ProtectedRoute element={<Trust />} />} />
        <Route path="/corruption" element={<ProtectedRoute element={<Corruption />} />} />
        <Route path="/priority" element={<ProtectedRoute element={<Priority />} />} />
        <Route path="/national-map" element={<ProtectedRoute element={<NationalMap />} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
