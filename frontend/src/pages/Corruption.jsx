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

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-600 mb-4"></div>
            <p className="text-gray-500 text-lg font-semibold">Analyzing corruption patterns...</p>
          </div>
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
      {/* Header Section */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-2xl p-8 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center">
                <svg className="w-10 h-10 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                Corruption Monitoring
              </h1>
              <p className="text-purple-100 text-lg">Intelligent pattern detection and compliance violation analysis</p>
            </div>
            <div className="mt-4 md:mt-0">
              <button
                onClick={fetchCorruptionData}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center shadow-lg">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                Re-scan
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Total Suppliers</p>
              <p className="text-3xl font-bold text-blue-600">{data?.summary?.total_suppliers || 0}</p>
            </div>
            <div className="bg-blue-100 rounded-full p-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Flags Detected</p>
              <p className="text-3xl font-bold text-red-600">{data?.total_flags || 0}</p>
            </div>
            <div className="bg-red-100 rounded-full p-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Total Approvals</p>
              <p className="text-3xl font-bold text-green-600">{data?.summary?.total_approvals || 0}</p>
            </div>
            <div className="bg-green-100 rounded-full p-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Total Rejections</p>
              <p className="text-3xl font-bold text-orange-600">{data?.summary?.total_rejections || 0}</p>
            </div>
            <div className="bg-orange-100 rounded-full p-4">
              <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Detection Info */}
      <div className="bg-white rounded-2xl shadow-xl border-l-4 border-purple-600 p-6 mb-8">
        <h3 className="font-bold text-purple-900 text-xl mb-3 flex items-center">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
          </svg>
          AI Intelligence Engine
        </h3>
        <p className="text-sm text-purple-800 mb-4">
          Advanced audit intelligence system detecting corruption patterns across supply chain operations:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="flex items-start space-x-2 bg-purple-50 rounded-lg p-3">
            <span className="text-2xl">👑</span>
            <div>
              <strong className="text-purple-900 text-sm">Supplier Favoritism</strong>
              <p className="text-xs text-purple-700">Disproportionate approval of single supplier</p>
            </div>
          </div>
          <div className="flex items-start space-x-2 bg-purple-50 rounded-lg p-3">
            <span className="text-2xl">⚖️</span>
            <div>
              <strong className="text-purple-900 text-sm">Approval Bias</strong>
              <p className="text-xs text-purple-700">100% approval rate anomalies</p>
            </div>
          </div>
          <div className="flex items-start space-x-2 bg-purple-50 rounded-lg p-3">
            <span className="text-2xl">🔁</span>
            <div>
              <strong className="text-purple-900 text-sm">Repeated Batches</strong>
              <p className="text-xs text-purple-700">Duplicate batch number approvals</p>
            </div>
          </div>
          <div className="flex items-start space-x-2 bg-purple-50 rounded-lg p-3">
            <span className="text-2xl">🚫</span>
            <div>
              <strong className="text-purple-900 text-sm">Blacklist Violations</strong>
              <p className="text-xs text-purple-700">Banned suppliers gaining entry</p>
            </div>
          </div>
          <div className="flex items-start space-x-2 bg-purple-50 rounded-lg p-3">
            <span className="text-2xl">🎯</span>
            <div>
              <strong className="text-purple-900 text-sm">Targeted Rejection</strong>
              <p className="text-xs text-purple-700">Systematic supplier exclusion</p>
            </div>
          </div>
          <div className="flex items-start space-x-2 bg-purple-50 rounded-lg p-3">
            <span className="text-2xl">🔍</span>
            <div>
              <strong className="text-purple-900 text-sm">Pattern Analysis</strong>
              <p className="text-xs text-purple-700">Real-time behavioral monitoring</p>
            </div>
          </div>
        </div>
      </div>

      {/* Corruption Flags */}
      {data?.total_flags === 0 ? (
        <div className="bg-white rounded-2xl shadow-xl border-2 border-green-300 overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-center">
            <svg className="w-20 h-20 text-white mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <h2 className="text-3xl font-bold text-white mb-2">
              No Corruption Patterns Detected
            </h2>
            <p className="text-green-100 text-lg">
              The system has not identified any suspicious patterns in the supply chain.
            </p>
          </div>
          <div className="p-6 text-center">
            <p className="text-gray-600">Supply chain operations are running within normal parameters.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 to-rose-600 px-6 py-4">
            <h2 className="text-xl font-bold text-white flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              Detected Corruption Flags
              <span className="ml-3 text-sm bg-white/20 backdrop-blur-sm px-4 py-1 rounded-full">
                {data?.total_flags} Critical Issues
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
      </div>
    </Layout>
  );
}
