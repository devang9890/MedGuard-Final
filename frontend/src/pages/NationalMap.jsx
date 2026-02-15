import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { getNationalRiskMap } from "../api/mapApi";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
});

export default function NationalMap() {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({ total_suppliers: 0, high_risk: 0, medium_risk: 0, low_risk: 0 });
  const [loading, setLoading] = useState(true);

  const fetchMapData = async () => {
    setLoading(true);
    try {
      const res = await getNationalRiskMap();
      const mapData = res.data;
      setStats({
        total_suppliers: mapData.total_suppliers || 0,
        high_risk: mapData.high_risk || 0,
        medium_risk: mapData.medium_risk || 0,
        low_risk: mapData.low_risk || 0
      });
      setData(mapData.suppliers || []);
    } catch (err) {
      console.error("Failed to fetch map data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMapData(); }, []);

  const getColor = (zone) => {
    if (zone === "RED") return "#dc2626";
    if (zone === "YELLOW") return "#f59e0b";
    return "#16a34a";
  };

  const getRiskIcon = (zone) => {
    const color = getColor(zone);
    return L.divIcon({
      className: "custom-marker",
      html: `<div style="width:20px;height:20px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.3);"></div>`,
      iconSize: [20, 20], iconAnchor: [10, 10], popupAnchor: [0, -10]
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mb-4"></div>
            <p className="text-gray-500 text-lg font-semibold">Loading national risk map...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 rounded-2xl p-8 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center">
                <svg className="w-10 h-10 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                National Medicine Monitoring Map
              </h1>
              <p className="text-blue-100 text-lg">Real-time geographic risk assessment across all suppliers</p>
            </div>
            <div className="mt-4 md:mt-0">
              <button onClick={fetchMapData} className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center shadow-lg">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Map
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Locations", value: stats.total_suppliers, color: "text-blue-600", bg: "bg-blue-100", iconColor: "text-blue-600" },
          { label: "High Risk", value: stats.high_risk, color: "text-red-600", bg: "bg-red-100", iconColor: "text-red-600" },
          { label: "Medium Risk", value: stats.medium_risk, color: "text-yellow-600", bg: "bg-yellow-100", iconColor: "text-yellow-600" },
          { label: "Low Risk", value: stats.low_risk, color: "text-green-600", bg: "bg-green-100", iconColor: "text-green-600" }
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">{s.label}</p>
                <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              </div>
              <div className={`${s.bg} rounded-full p-4`}>
                <svg className={`w-8 h-8 ${s.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Map */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4">
          <h2 className="text-xl font-bold text-white flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Risk Distribution Map
          </h2>
        </div>
        <div className="map-shell">
          <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: "70vh", minHeight: "720px", width: "100%" }}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" detectRetina maxZoom={19} />
            {data.map((supplier, idx) => (
              <Marker key={idx} position={[supplier.location.lat, supplier.location.lng]} icon={getRiskIcon(supplier.zone)}>
                <Popup>
                  <div className="p-2">
                    <h3 className="font-bold text-lg mb-2">{supplier.supplier_name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{supplier.location.address}</p>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Risk Score:</span>
                        <span className="text-sm font-bold" style={{ color: getColor(supplier.zone) }}>{supplier.risk_score}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Zone:</span>
                        <span className="text-sm font-bold px-2 py-0.5 rounded" style={{ backgroundColor: getColor(supplier.zone) + '20', color: getColor(supplier.zone) }}>{supplier.zone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Alerts:</span>
                        <span className="text-sm">{supplier.alert_count || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Status:</span>
                        <span className={`text-sm font-semibold ${supplier.blacklisted ? 'text-red-600' : supplier.verified ? 'text-green-600' : 'text-yellow-600'}`}>
                          {supplier.blacklisted ? 'Blacklisted' : supplier.verified ? 'Verified' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* High Risk Table */}
      {stats.high_risk > 0 && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 to-rose-600 px-6 py-4">
            <h2 className="text-xl font-bold text-white flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              High Risk Suppliers - Immediate Attention
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  {["Supplier", "Location", "Risk Score", "Alerts", "Status"].map(h => (
                    <th key={h} className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.filter(s => s.zone === "RED").map((supplier, idx) => (
                  <tr key={idx} className="hover:bg-red-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-900">{supplier.supplier_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{supplier.location.address}</td>
                    <td className="px-6 py-4"><span className="text-red-600 font-bold text-lg">{supplier.risk_score}</span></td>
                    <td className="px-6 py-4"><span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-semibold">{supplier.alert_count || 0} alerts</span></td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${supplier.blacklisted ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {supplier.blacklisted ? 'Blacklisted' : 'Under Review'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
}
