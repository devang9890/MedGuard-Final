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
      const medMap = {};
      medicinesRes.data.forEach(med => { medMap[med._id] = med.name; });
      setMedicines(medMap);
    } catch (err) {
      console.error("Failed to fetch priority data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const getRecommendationColor = (rec) => {
    switch (rec) {
      case "EXPIRED": return "bg-gray-800 text-white";
      case "USE_IMMEDIATELY": return "bg-red-600 text-white";
      case "USE_SOON": return "bg-orange-600 text-white";
      case "NORMAL": return "bg-green-600 text-white";
      case "HOLD": return "bg-gray-600 text-white";
      default: return "bg-gray-400 text-white";
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
        <div className="flex items-center justify-center h-screen">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-amber-600 mb-4"></div>
            <p className="text-gray-500 text-lg font-semibold">Calculating priorities...</p>
          </div>
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
      <div className="mb-8">
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 rounded-2xl p-8 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center">
                <svg className="w-10 h-10 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Usage Priority Recommendations
              </h1>
              <p className="text-orange-100 text-lg">AI-powered medicine usage prioritization</p>
            </div>
            <div className="mt-4 md:mt-0">
              <button onClick={fetchData} className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center shadow-lg">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Recalculate
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: "Expired", value: stats.expired, color: "text-gray-800", bg: "bg-gray-200" },
          { label: "Use Immediately", value: stats.immediate, color: "text-red-600", bg: "bg-red-100" },
          { label: "Use Soon", value: stats.soon, color: "text-orange-600", bg: "bg-orange-100" },
          { label: "Normal", value: stats.normal, color: "text-green-600", bg: "bg-green-100" },
          { label: "Hold", value: stats.hold, color: "text-gray-600", bg: "bg-gray-100" }
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl p-5 shadow-lg border border-gray-100">
            <div className={`${s.bg} rounded-full p-2 w-10 h-10 flex items-center justify-center mb-2`}>
              <svg className={`w-5 h-5 ${s.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 font-medium mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4">
          <h2 className="text-xl font-bold text-white flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Supply Priority List
          </h2>
        </div>
        {priorities.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-lg font-semibold">No supply data available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  {["Medicine", "Batch", "Days to Expiry", "Qty", "Score", "Recommendation", "Flags"].map(h => (
                    <th key={h} className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {priorities.map((item) => (
                  <tr key={item.supply_id} className={`hover:bg-gray-50 transition-colors ${item.recommendation === "EXPIRED" ? "bg-gray-50" : item.recommendation === "USE_IMMEDIATELY" ? "bg-red-50/50" : ""}`}>
                    <td className="px-6 py-4 font-medium text-gray-900">{medicines[item.medicine_id] || "Unknown"}</td>
                    <td className="px-6 py-4 font-mono text-sm text-gray-700">{item.batch_number}</td>
                    <td className={`px-6 py-4 ${getDaysColor(item.days_to_expiry)}`}>{item.days_to_expiry !== null ? `${item.days_to_expiry} days` : "N/A"}</td>
                    <td className="px-6 py-4 text-gray-900">{item.quantity}</td>
                    <td className={`px-6 py-4 text-lg ${getScoreColor(item.priority_score)}`}>{item.priority_score}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRecommendationColor(item.recommendation)}`}>
                        {item.recommendation.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {item.risk_flags?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {item.risk_flags.slice(0, 2).map((flag, idx) => (
                            <span key={idx} className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">{flag}</span>
                          ))}
                          {item.risk_flags.length > 2 && <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">+{item.risk_flags.length - 2}</span>}
                        </div>
                      ) : <span className="text-gray-400 text-sm">None</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
