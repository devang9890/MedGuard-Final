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
  const [stats, setStats] = useState({
    total_suppliers: 0,
    high_risk: 0,
    medium_risk: 0,
    low_risk: 0
  });
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

  useEffect(() => {
    fetchMapData();
  }, []);

  const getColor = (zone) => {
    if (zone === "RED") return "#dc2626";
    if (zone === "YELLOW") return "#f59e0b";
    return "#16a34a";
  };

  const getRiskIcon = (zone) => {
    const color = getColor(zone);

    return L.divIcon({
      className: "custom-marker",
      html: `<div style="
        width: 20px; 
        height: 20px; 
        border-radius: 50%; 
        background: ${color}; 
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
      popupAnchor: [0, -10]
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading national risk map...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">
          🗺️ National Medicine Monitoring Map
        </h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium">Total Locations</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">{stats.total_suppliers}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium">🔴 High Risk</h3>
            <p className="text-3xl font-bold text-red-600 mt-2">{stats.high_risk}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium">🟡 Medium Risk</h3>
            <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.medium_risk}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium">🟢 Low Risk</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">{stats.low_risk}</p>
          </div>
        </div>

        {/* Info Panel */}
        <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4">
          <h3 className="font-semibold text-indigo-900">🎯 AI Risk Intelligence</h3>
          <p className="mt-2 text-sm text-indigo-800">
            This map shows real-time risk assessment across all suppliers based on:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-indigo-800">
            <li>🚫 <strong>Compliance Failures:</strong> Rejected supplies (+5 per rejection)</li>
            <li>💊 <strong>Fake Detections:</strong> Counterfeit medicine signals (+10 per fake)</li>
            <li>⚠️ <strong>Risk Flags:</strong> Temperature, verification issues (+3 per flag)</li>
            <li>🚨 <strong>Alert History:</strong> Critical incidents (+2-4 per alert)</li>
            <li>🚷 <strong>Blacklist Status:</strong> Banned suppliers (+20 penalty)</li>
          </ul>
        </div>

        {/* Map */}
        <div className="map-shell">
          <MapContainer
            center={[20.5937, 78.9629]}
            zoom={5}
            style={{ height: "70vh", minHeight: "720px", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              detectRetina
              maxZoom={19}
            />

            {data.map((supplier, idx) => (
              <Marker
                key={idx}
                position={[supplier.location.lat, supplier.location.lng]}
                icon={getRiskIcon(supplier.zone)}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-bold text-lg mb-2">{supplier.supplier_name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{supplier.location.address}</p>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Risk Score:</span>
                        <span className="text-sm font-bold" style={{ color: getColor(supplier.zone) }}>
                          {supplier.risk_score}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Risk Zone:</span>
                        <span 
                          className="text-sm font-bold px-2 py-0.5 rounded"
                          style={{ 
                            backgroundColor: getColor(supplier.zone) + '20',
                            color: getColor(supplier.zone)
                          }}
                        >
                          {supplier.zone}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Alerts:</span>
                        <span className="text-sm">{supplier.alert_count || 0}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Status:</span>
                        <span className={`text-sm font-semibold ${
                          supplier.blacklisted ? 'text-red-600' :
                          supplier.verified ? 'text-green-600' :
                          'text-yellow-600'
                        }`}>
                          {supplier.blacklisted ? 'Blacklisted' : 
                           supplier.verified ? 'Verified' : 
                           'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* High Risk Suppliers Table */}
        {stats.high_risk > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-red-600">
                🚨 High Risk Suppliers Requiring Immediate Attention
              </h2>
            </div>
            <div className="p-6">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 text-left">Supplier</th>
                    <th className="p-3 text-left">Location</th>
                    <th className="p-3 text-left">Risk Score</th>
                    <th className="p-3 text-left">Alerts</th>
                    <th className="p-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.filter(s => s.zone === "RED").map((supplier, idx) => (
                    <tr key={idx} className="border-t hover:bg-red-50">
                      <td className="p-3 font-semibold">{supplier.supplier_name}</td>
                      <td className="p-3 text-sm">{supplier.location.address}</td>
                      <td className="p-3">
                        <span className="text-red-600 font-bold text-lg">
                          {supplier.risk_score}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm">
                          {supplier.alert_count || 0} alerts
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-sm font-semibold ${
                          supplier.blacklisted ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
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

        {/* Refresh Button */}
        <div className="flex justify-center">
          <button
            onClick={fetchMapData}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            🔄 Refresh Risk Map
          </button>
        </div>
      </div>
    </Layout>
  );
}
