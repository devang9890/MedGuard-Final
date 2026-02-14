import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { getAlerts } from "../api/alertApi";

export default function NationalDashboard() {
  const [alerts, setAlerts] = useState([]);
  const [riskZones, setRiskZones] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNationalData();
  }, []);

  const fetchNationalData = async () => {
    try {
      setLoading(true);
      setError(null);

      const alertsRes = await getAlerts().catch(() => ({ data: [] }));

      const alerts = Array.isArray(alertsRes.data) ? alertsRes.data : alertsRes.data?.alerts || [];

      // Calculate risk zones from alerts (grouping by region/area)
      const zoneMap = new Map();
      alerts.forEach((alert) => {
        const zone = alert.region || alert.area || "Unknown Zone";
        if (!zoneMap.has(zone)) {
          zoneMap.set(zone, {
            zone,
            count: 0,
            severity: "LOW",
            medicines: new Set()
          });
        }
        const zoneData = zoneMap.get(zone);
        zoneData.count += 1;
        if (alert.medicine_name) {
          zoneData.medicines.add(alert.medicine_name);
        }
        // Update severity
        if (alert.severity === "CRITICAL") {
          zoneData.severity = "CRITICAL";
        } else if (alert.severity === "HIGH" && zoneData.severity !== "CRITICAL") {
          zoneData.severity = "HIGH";
        }
      });

      const zones = Array.from(zoneMap.values())
        .map(z => ({
          ...z,
          medicines: z.medicines.size
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Calculate statistics
      const stats = {
        total_alerts: alerts.length,
        critical_alerts: alerts.filter(a => a.severity === "CRITICAL").length,
        high_alerts: alerts.filter(a => a.severity === "HIGH").length,
        medium_alerts: alerts.filter(a => a.severity === "MEDIUM").length,
        low_alerts: alerts.filter(a => a.severity === "LOW").length
      };

      setRiskZones(zones);
      setAlerts(alerts.slice(0, 10));
      setStats(stats);
    } catch (err) {
      console.error("Failed to fetch national data:", err);
      setError("Failed to load national monitoring data");
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    if (severity === "CRITICAL") return "bg-red-100 border-red-500 text-red-900";
    if (severity === "HIGH") return "bg-orange-100 border-orange-500 text-orange-900";
    if (severity === "MEDIUM") return "bg-yellow-100 border-yellow-500 text-yellow-900";
    return "bg-blue-100 border-blue-500 text-blue-900";
  };

  const getSeverityBadge = (severity) => {
    if (severity === "CRITICAL") return "bg-red-600 text-white";
    if (severity === "HIGH") return "bg-orange-600 text-white";
    if (severity === "MEDIUM") return "bg-yellow-600 text-white";
    return "bg-blue-600 text-white";
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading national monitoring data...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">National Monitoring Dashboard</h1>
        <p className="text-gray-600 mt-2">Real-time national monitoring, risk zones & alerts</p>
      </div>

      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white shadow rounded-lg p-6 border-l-4 border-red-500">
          <h3 className="text-gray-600 text-sm font-medium">Total Alerts</h3>
          <p className="text-3xl font-bold text-red-600 mt-2">{stats.total_alerts || 0}</p>
        </div>

        <div className="bg-white shadow rounded-lg p-6 border-l-4 border-orange-500">
          <h3 className="text-gray-600 text-sm font-medium">Critical Alerts</h3>
          <p className="text-3xl font-bold text-orange-600 mt-2">{stats.critical_alerts || 0}</p>
        </div>

        <div className="bg-white shadow rounded-lg p-6 border-l-4 border-purple-500">
          <h3 className="text-gray-600 text-sm font-medium">Risk Zones</h3>
          <p className="text-3xl font-bold text-purple-600 mt-2">{riskZones.length}</p>
        </div>

        <div className="bg-white shadow rounded-lg p-6 border-l-4 border-blue-500">
          <h3 className="text-gray-600 text-sm font-medium">Affected Areas</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">{new Set(alerts.map(a => a.region || a.area || "Unknown")).size}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* National Map (Placeholder) */}
        <div className="lg:col-span-2 bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📍 National Monitoring Map</h2>
          <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500 text-lg">Risk Zones by Region</p>
              <p className="text-gray-400 text-sm mt-2">Integrated map visualization</p>
            </div>
          </div>
        </div>

        {/* Risk Matrix */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">🎯 Risk Summary</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-red-50 rounded">
              <span className="text-red-900 font-medium">Critical</span>
              <span className="bg-red-600 text-white text-sm px-3 py-1 rounded font-bold">{stats.critical_alerts || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded">
              <span className="text-orange-900 font-medium">High</span>
              <span className="bg-orange-600 text-white text-sm px-3 py-1 rounded font-bold">{stats.high_alerts || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded">
              <span className="text-yellow-900 font-medium">Medium</span>
              <span className="bg-yellow-600 text-white text-sm px-3 py-1 rounded font-bold">{stats.medium_alerts || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
              <span className="text-blue-900 font-medium">Low</span>
              <span className="bg-blue-600 text-white text-sm px-3 py-1 rounded font-bold">{stats.low_alerts || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* High Risk Zones */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">⚠️ High Risk Zones</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {riskZones.length > 0 ? (
              riskZones.map((zone, idx) => (
                <div key={idx} className={`border-l-4 p-4 rounded ${getSeverityColor(zone.severity)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold">{zone.zone}</p>
                    <span className={`text-xs px-2 py-1 rounded font-medium ${getSeverityBadge(zone.severity)}`}>
                      {zone.severity}
                    </span>
                  </div>
                  <p className="text-sm opacity-75">{zone.count} alerts • {zone.medicines} medicines</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No risk zones identified</p>
            )}
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">🔔 Recent Alerts</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {alerts.length > 0 ? (
              alerts.map((alert, idx) => (
                <div key={idx} className={`border-l-4 p-4 rounded ${getSeverityColor(alert.severity)}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-semibold truncate">{alert.medicine_name || alert.title}</p>
                      <p className="text-sm opacity-75">{alert.region || alert.area || "Unknown"}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded font-medium whitespace-nowrap ml-2 ${getSeverityBadge(alert.severity)}`}>
                      {alert.severity}
                    </span>
                  </div>
                  {alert.message && (
                    <p className="text-sm opacity-75 line-clamp-2">{alert.message}</p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500">No active alerts</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
