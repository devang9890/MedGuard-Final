import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeProvider";

// Role-based Dashboards
import AdminDashboard from "./pages/AdminDashboard";
import IntelligenceDashboard from "./pages/IntelligenceDashboard";
import NationalDashboard from "./pages/NationalDashboard";
import PublicDashboard from "./pages/PublicDashboard";

// Feature Pages
import Suppliers from "./pages/Suppliers";
import Medicines from "./pages/Medicines";
import Supplies from "./pages/Supplies";
import Alerts from "./pages/Alerts";
import Trust from "./pages/Trust";
import Corruption from "./pages/Corruption";
import Priority from "./pages/Priority";
import NationalMap from "./pages/NationalMap";
import Login from "./pages/Login";
import AIInsights from "./pages/AIInsights";
import ScanMedicine from "./pages/ScanMedicine";
import PublicVerify from "./pages/PublicVerify";

const ProtectedRoute = ({ element }) => {
  const token = localStorage.getItem("token");
  return token ? element : <Navigate to="/login" replace />;
};

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* Authentication */}
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/admin" replace />} />

          {/* Role-Based Dashboards */}
          <Route path="/admin" element={<ProtectedRoute element={<AdminDashboard />} />} />
          <Route path="/intelligence" element={<ProtectedRoute element={<IntelligenceDashboard />} />} />
          <Route path="/national" element={<ProtectedRoute element={<NationalDashboard />} />} />
          <Route path="/public" element={<PublicDashboard />} />

          {/* Legacy Dashboard Redirect */}
          <Route path="/dashboard" element={<Navigate to="/admin" replace />} />

          {/* Admin Features */}
          <Route path="/suppliers" element={<ProtectedRoute element={<Suppliers />} />} />
          <Route path="/medicines" element={<ProtectedRoute element={<Medicines />} />} />
          <Route path="/supplies" element={<ProtectedRoute element={<Supplies />} />} />

          {/* Intelligence Features */}
          <Route path="/corruption" element={<ProtectedRoute element={<Corruption />} />} />
          <Route path="/trust" element={<ProtectedRoute element={<Trust />} />} />
          <Route path="/ai-insights" element={<ProtectedRoute element={<AIInsights />} />} />

          {/* National Monitoring Features */}
          <Route path="/alerts" element={<ProtectedRoute element={<Alerts />} />} />
          <Route path="/national-map" element={<ProtectedRoute element={<NationalMap />} />} />
          <Route path="/priority" element={<ProtectedRoute element={<Priority />} />} />

          {/* Public Features */}
          <Route path="/scan" element={<ProtectedRoute element={<ScanMedicine />} />} />
          <Route path="/public-verify" element={<PublicVerify />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
