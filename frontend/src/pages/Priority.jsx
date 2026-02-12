import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { getUsagePriority } from "../api/predictiveApi";
import { getMedicines } from "../api/medicineApi";

export default function Priority() {
  const [priorities, setPriorities] = useState([]);
  const [medicines, setMedicines] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prioritiesRes, medicinesRes] = await Promise.all([
        getUsagePriority(),
        getMedicines()
      ]);

      setPriorities(prioritiesRes.data);

      // Create medicine lookup map
      const medMap = {};
      medicinesRes.data.forEach(med => {
        medMap[med._id] = med.name;
      });
      setMedicines(medMap);
    } catch (err) {
      console.error("Failed to fetch priority data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getRecommendationColor = (rec) => {
    switch(rec) {
      case "EXPIRED": return "bg-gray-800 text-white";
      case "USE_IMMEDIATELY": return "bg-red-600 text-white";
      case "USE_SOON": return "bg-orange-600 text-white";
      case "NORMAL": return "bg-green-600 text-white";
      case "HOLD": return "bg-gray-600 text-white";
      default: return "bg-gray-400 text-white";
    }
  };

  const getRecommendationIcon = (rec) => {
    switch(rec) {
      case "EXPIRED": return "❌";
      case "USE_IMMEDIATELY": return "🚨";
      case "USE_SOON": return "⚠️";
      case "NORMAL": return "✅";
      case "HOLD": return "⏸️";
      default: return "❓";
    }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return "text-red-600 font-bold";
    if (score >= 40) return "text-orange-600 font-bold";
    if (score >= 20) return "text-green-600 font-semibold";
    return "text-gray-600";
  };

  const getDaysColor = (days) => {
    if (days === null || days === undefined) return "text-gray-500";
    if (days < 7) return "text-red-600 font-bold";
    if (days < 30) return "text-orange-600 font-semibold";
    if (days < 60) return "text-yellow-600";
    return "text-green-600";
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Calculating priorities...</p>
        </div>
      </Layout>
    );
  }

  const stats = {
    expired: priorities.filter(p => p.recommendation === "EXPIRED").length,
    immediate: priorities.filter(p => p.recommendation === "USE_IMMEDIATELY").length,
    soon: priorities.filter(p => p.recommendation === "USE_SOON").length,
    normal: priorities.filter(p => p.recommendation === "NORMAL").length,
    hold: priorities.filter(p => p.recommendation === "HOLD").length
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">📊 Usage Priority Recommendations</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-5 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium">Expired</h3>
            <p className="text-3xl font-bold text-gray-800 mt-2">{stats.expired}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium">Use Immediately</h3>
            <p className="text-3xl font-bold text-red-600 mt-2">{stats.immediate}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium">Use Soon</h3>
            <p className="text-3xl font-bold text-orange-600 mt-2">{stats.soon}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium">Normal Priority</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">{stats.normal}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium">Hold</h3>
            <p className="text-3xl font-bold text-gray-600 mt-2">{stats.hold}</p>
          </div>
        </div>

        {/* Info Panel */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
          <h3 className="font-semibold text-blue-900">🎯 AI Decision Assistant</h3>
          <p className="mt-2 text-sm text-blue-800">
            This system provides intelligent recommendations based on multiple factors:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-blue-800">
            <li>📅 <strong>Expiry Date:</strong> Prioritizes near-expiry stock (+50 if &lt;7 days)</li>
            <li>🌡️ <strong>Temperature Alerts:</strong> Flags temperature-compromised batches (+20)</li>
            <li>🔍 <strong>Compliance Status:</strong> Highlights rejected/pending items (+25/+10)</li>
            <li>🚫 <strong>Fake Detection:</strong> Marks suspicious batches (+10)</li>
            <li>📦 <strong>Quantity:</strong> Large quantities prioritized (+5)</li>
          </ul>
        </div>

        {/* Priority Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Supply Priority List</h2>
            <p className="text-sm text-gray-600 mt-1">
              Sorted by priority score (highest to lowest)
            </p>
          </div>

          {priorities.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No supply data available
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 text-left">Medicine</th>
                    <th className="p-3 text-left">Batch Number</th>
                    <th className="p-3 text-left">Days to Expiry</th>
                    <th className="p-3 text-left">Quantity</th>
                    <th className="p-3 text-left">Priority Score</th>
                    <th className="p-3 text-left">Recommendation</th>
                    <th className="p-3 text-left">Risk Flags</th>
                  </tr>
                </thead>
                <tbody>
                  {priorities.map((item, idx) => (
                    <tr 
                      key={item.supply_id} 
                      className={`border-t hover:bg-gray-50 ${
                        item.recommendation === "EXPIRED" ? "bg-gray-100" :
                        item.recommendation === "USE_IMMEDIATELY" ? "bg-red-50" : ""
                      }`}
                    >
                      <td className="p-3">
                        {medicines[item.medicine_id] || "Unknown"}
                      </td>
                      <td className="p-3 font-mono text-sm">
                        {item.batch_number}
                      </td>
                      <td className={`p-3 ${getDaysColor(item.days_to_expiry)}`}>
                        {item.days_to_expiry !== null 
                          ? `${item.days_to_expiry} days`
                          : "N/A"
                        }
                      </td>
                      <td className="p-3">
                        {item.quantity}
                      </td>
                      <td className={`p-3 text-lg ${getScoreColor(item.priority_score)}`}>
                        {item.priority_score}
                      </td>
                      <td className="p-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRecommendationColor(item.recommendation)}`}>
                          {getRecommendationIcon(item.recommendation)} {item.recommendation.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-3">
                        {item.risk_flags && item.risk_flags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {item.risk_flags.slice(0, 2).map((flag, idx) => (
                              <span 
                                key={idx}
                                className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs"
                              >
                                {flag}
                              </span>
                            ))}
                            {item.risk_flags.length > 2 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                +{item.risk_flags.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">None</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <div className="flex justify-center">
          <button
            onClick={fetchData}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            🔄 Recalculate Priorities
          </button>
        </div>
      </div>
    </Layout>
  );
}
