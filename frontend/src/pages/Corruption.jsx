import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { detectCorruption } from "../api/corruptionApi";

export default function Corruption() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCorruptionData = async () => {
    setLoading(true);
    try {
      const res = await detectCorruption();
      setData(res.data);
    } catch (err) {
      console.error("Failed to fetch corruption data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCorruptionData();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Analyzing patterns...</p>
        </div>
      </Layout>
    );
  }

  const getSeverityColor = (severity) => {
    if (severity === "CRITICAL") return "bg-red-600";
    if (severity === "HIGH") return "bg-orange-600";
    if (severity === "MEDIUM") return "bg-yellow-600";
    return "bg-gray-600";
  };

  const getSeverityBadgeColor = (severity) => {
    if (severity === "CRITICAL") return "bg-red-100 text-red-800";
    if (severity === "HIGH") return "bg-orange-100 text-orange-800";
    if (severity === "MEDIUM") return "bg-yellow-100 text-yellow-800";
    return "bg-gray-100 text-gray-800";
  };

  const getFlagIcon = (type) => {
    switch(type) {
      case "FAVORITISM_DETECTED": return "👑";
      case "BLACKLIST_ACCEPTED": return "🚫";
      case "REPEATED_BATCH_APPROVAL": return "🔁";
      case "TARGETED_REJECTION": return "🎯";
      case "BIAS_APPROVAL_PATTERN": return "⚖️";
      default: return "🚩";
    }
  };

  const getFlagTitle = (type) => {
    switch(type) {
      case "FAVORITISM_DETECTED": return "Supplier Favoritism";
      case "BLACKLIST_ACCEPTED": return "Blacklisted Supplier Accepted";
      case "REPEATED_BATCH_APPROVAL": return "Repeated Batch Approval";
      case "TARGETED_REJECTION": return "Targeted Rejection";
      case "BIAS_APPROVAL_PATTERN": return "Approval Bias Pattern";
      default: return type.replace(/_/g, ' ');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">🔍 Corruption Monitoring</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium">Total Suppliers</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {data?.summary?.total_suppliers || 0}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium">Flags Detected</h3>
            <p className="text-3xl font-bold text-red-600 mt-2">
              {data?.total_flags || 0}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium">Total Approvals</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {data?.summary?.total_approvals || 0}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium">Total Rejections</h3>
            <p className="text-3xl font-bold text-orange-600 mt-2">
              {data?.summary?.total_rejections || 0}
            </p>
          </div>
        </div>

        {/* Detection Info */}
        <div className="bg-purple-50 border-l-4 border-purple-500 p-4">
          <h3 className="font-semibold text-purple-900">🧠 Intelligence Engine</h3>
          <p className="mt-2 text-sm text-purple-800">
            This system detects corruption patterns using audit intelligence methods:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-purple-800">
            <li>👑 <strong>Supplier Favoritism:</strong> One supplier approved far more than others</li>
            <li>⚖️ <strong>Approval Bias:</strong> 100% approval rate for specific suppliers</li>
            <li>🔁 <strong>Repeated Batches:</strong> Same batch number approved multiple times</li>
            <li>🚫 <strong>Blacklist Violations:</strong> Blacklisted suppliers still getting approved</li>
            <li>🎯 <strong>Targeted Rejection:</strong> Systematic rejection of specific suppliers</li>
          </ul>
        </div>

        {/* Corruption Flags */}
        {data?.total_flags === 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-900 mb-2">
              No Corruption Patterns Detected
            </h2>
            <p className="text-green-700">
              The system has not identified any suspicious patterns in the supply chain.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <span className="text-red-600">🚨</span>
                Detected Corruption Flags
                <span className="ml-2 text-sm bg-red-100 text-red-800 px-3 py-1 rounded-full">
                  {data?.total_flags} Issues
                </span>
              </h2>
            </div>

            <div className="p-6 space-y-4">
              {data?.flags?.map((flag, idx) => (
                <div 
                  key={idx} 
                  className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{getFlagIcon(flag.type)}</span>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {getFlagTitle(flag.type)}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeverityBadgeColor(flag.severity)}`}>
                          {flag.severity}
                        </span>
                      </div>

                      <p className="text-gray-700 mb-3">{flag.detail}</p>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {flag.supplier_name && (
                          <div>
                            <span className="text-gray-500">Supplier:</span>
                            <span className="ml-2 font-semibold">{flag.supplier_name}</span>
                          </div>
                        )}
                        {flag.count && (
                          <div>
                            <span className="text-gray-500">Count:</span>
                            <span className="ml-2 font-semibold">{flag.count}</span>
                          </div>
                        )}
                        {flag.batch && (
                          <div>
                            <span className="text-gray-500">Batch:</span>
                            <span className="ml-2 font-mono text-sm">{flag.batch}</span>
                          </div>
                        )}
                        {flag.rejection_rate !== undefined && (
                          <div>
                            <span className="text-gray-500">Rejection Rate:</span>
                            <span className="ml-2 font-semibold text-red-600">{flag.rejection_rate}%</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className={`w-2 h-2 rounded-full ${getSeverityColor(flag.severity)} animate-pulse`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <div className="flex justify-center">
          <button
            onClick={fetchCorruptionData}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
          >
            🔄 Re-scan for Corruption
          </button>
        </div>
      </div>
    </Layout>
  );
}
