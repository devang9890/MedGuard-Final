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
    if (severity === "CRITICAL") return "bg-gradient-to-br from-red-50 to-red-100 border-red-500 text-red-900";
    if (severity === "HIGH") return "bg-gradient-to-br from-orange-50 to-orange-100 border-orange-500 text-orange-900";
    if (severity === "MEDIUM") return "bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-500 text-yellow-900";
    return "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-500 text-blue-900";
  };

  const getSeverityBadge = (severity) => {
    if (severity === "CRITICAL") return "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg";
    if (severity === "HIGH") return "bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-lg";
    if (severity === "MEDIUM") return "bg-gradient-to-r from-yellow-600 to-yellow-700 text-white shadow-lg";
    return "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg";
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header Section with Gradient */}
      <div className="mb-8 bg-gradient-to-r from-green-600 via-teal-600 to-cyan-600 rounded-2xl p-8 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">National Monitoring Dashboard</h1>
            <p className="text-green-100 text-lg">Real-time national surveillance, risk zones & emergency alerts</p>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 text-white">
              <span className="text-sm flex items-center">
                <span className="animate-pulse mr-2">🔴</span> Live Monitoring
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-red-200">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-red-600 rounded-xl p-3 shadow-md">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
            </div>
          </div>
          <h3 className="text-gray-600 text-sm font-semibold uppercase tracking-wide mb-1">Total Alerts</h3>
          <p className="text-4xl font-bold text-red-700">{stats.total_alerts || 0}</p>
          <div className="mt-3 flex items-center text-sm text-red-700">
            <span className="font-medium">Active notifications</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-orange-200">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-orange-600 rounded-xl p-3 shadow-md">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
          </div>
          <h3 className="text-gray-600 text-sm font-semibold uppercase tracking-wide mb-1">Critical Alerts</h3>
          <p className="text-4xl font-bold text-orange-700">{stats.critical_alerts || 0}</p>
          <div className="mt-3 flex items-center text-sm text-orange-700">
            <span className="font-medium">Immediate attention</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-600 rounded-xl p-3 shadow-md">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
          </div>
          <h3 className="text-gray-600 text-sm font-semibold uppercase tracking-wide mb-1">Risk Zones</h3>
          <p className="text-4xl font-bold text-purple-700">{riskZones.length}</p>
          <div className="mt-3 flex items-center text-sm text-purple-700">
            <span className="font-medium">Identified regions</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-600 rounded-xl p-3 shadow-md">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
          <h3 className="text-gray-600 text-sm font-semibold uppercase tracking-wide mb-1">Affected Areas</h3>
          <p className="text-4xl font-bold text-blue-700">{new Set(alerts.map(a => a.region || a.area || "Unknown")).size}</p>
          <div className="mt-3 flex items-center text-sm text-blue-700">
            <span className="font-medium">Geographic spread</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* National Map (Placeholder) */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-teal-600 px-6 py-5">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
              </svg>
              National Monitoring Map
            </h2>
            <p className="text-green-100 text-sm mt-1">Geographic distribution of risk zones</p>
          </div>
          <div className="p-6">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl h-96 flex items-center justify-center border-2 border-dashed border-gray-300">
              <div className="text-center">
                <svg className="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                </svg>
                <p className="text-gray-500 text-lg font-semibold">Risk Zones by Region</p>
                <p className="text-gray-400 text-sm mt-2">Integrated map visualization coming soon</p>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Matrix */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-5">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
              Risk Matrix
            </h2>
            <p className="text-indigo-100 text-sm mt-1">Alert severity breakdown</p>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-xl border-l-4 border-red-500 hover:shadow-md transition-all">
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-red-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-red-900 font-bold">Critical</span>
                </div>
                <span className="bg-red-600 text-white text-lg px-4 py-2 rounded-lg font-bold shadow">{stats.critical_alerts || 0}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border-l-4 border-orange-500 hover:shadow-md transition-all">
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-orange-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-orange-900 font-bold">High</span>
                </div>
                <span className="bg-orange-600 text-white text-lg px-4 py-2 rounded-lg font-bold shadow">{stats.high_alerts || 0}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl border-l-4 border-yellow-500 hover:shadow-md transition-all">
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-yellow-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-yellow-900 font-bold">Medium</span>
                </div>
                <span className="bg-yellow-600 text-white text-lg px-4 py-2 rounded-lg font-bold shadow">{stats.medium_alerts || 0}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border-l-4 border-blue-500 hover:shadow-md transition-all">
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-blue-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-blue-900 font-bold">Low</span>
                </div>
                <span className="bg-blue-600 text-white text-lg px-4 py-2 rounded-lg font-bold shadow">{stats.low_alerts || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* High Risk Zones */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-pink-600 px-6 py-5">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              High Risk Zones
            </h2>
            <p className="text-red-100 text-sm mt-1">Top 10 zones by alert count</p>
          </div>
          <div className="p-6">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {riskZones.length > 0 ? (
                riskZones.map((zone, idx) => (
                  <div key={idx} className={`border-l-4 p-4 rounded-xl shadow-sm hover:shadow-md transition-all ${getSeverityColor(zone.severity)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="bg-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow">
                          {idx + 1}
                        </div>
                        <p className="font-bold">{zone.zone}</p>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full font-bold ${getSeverityBadge(zone.severity)}`}>
                        {zone.severity}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm font-medium ml-11">
                      <span>📍 {zone.count} alerts</span>
                      <span>💊 {zone.medicines} medicines</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <p className="text-gray-500 font-medium">No risk zones identified</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-5">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
              Recent Alerts
            </h2>
            <p className="text-orange-100 text-sm mt-1">Latest 10 notifications</p>
          </div>
          <div className="p-6">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {alerts.length > 0 ? (
                alerts.map((alert, idx) => (
                  <div key={idx} className={`border-l-4 p-4 rounded-xl shadow-sm hover:shadow-md transition-all ${getSeverityColor(alert.severity)}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-bold truncate">{alert.medicine_name || alert.title}</p>
                        <p className="text-sm font-medium mt-1">📍 {alert.region || alert.area || "Unknown"}</p>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full font-bold whitespace-nowrap ml-2 ${getSeverityBadge(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </div>
                    {alert.message && (
                      <p className="text-sm mt-2 line-clamp-2">{alert.message}</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <p className="text-gray-500 font-medium">No active alerts</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
