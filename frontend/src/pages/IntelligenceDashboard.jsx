import { useEffect, useState, useMemo } from "react";
import Layout from "../components/Layout";
import { getAIInsights } from "../api/aiInsightsApi";
import { detectCorruption } from "../api/corruptionApi";
import { getSupplies } from "../api/supplyApi";
import { getSuppliers } from "../api/supplierApi";

export default function IntelligenceDashboard() {
  const [aiInsights, setAiInsights] = useState(null);
  const [corruptionData, setCorruptionData] = useState(null);
  const [trustData, setTrustData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [aiRes, corruptRes, suppliesRes, suppliersRes] = await Promise.all([
        getAIInsights().catch(() => null),
        detectCorruption().catch(() => null),
        getSupplies().catch(() => ({ data: [] })),
        getSuppliers().catch(() => ({ data: [] }))
      ]);

      setAiInsights(aiRes?.data || {});
      setCorruptionData(corruptRes?.data || {});

      // Calculate trust scores
      const suppliers = suppliersRes.data || [];
      const supplies = suppliesRes.data || [];
      const supplierMap = new Map(
        suppliers.map((supplier) => [supplier._id || supplier.id, supplier])
      );

      const totals = new Map();
      supplies.forEach((supply) => {
        const supplierId = supply.supplier_id;
        if (!supplierId) return;

        if (!totals.has(supplierId)) {
          totals.set(supplierId, {
            total: 0,
            accepted: 0,
            rejected: 0,
            warnings: 0,
            flags: 0,
            fake: 0
          });
        }

        const stat = totals.get(supplierId);
        stat.total += 1;

        if (supply.compliance_status === "ACCEPTED") stat.accepted += 1;
        if (supply.compliance_status === "REJECTED") stat.rejected += 1;

        if (Array.isArray(supply.risk_flags) && supply.risk_flags.length > 0) {
          stat.warnings += 1;
          stat.flags += supply.risk_flags.length;
        }

        if (["SUSPICIOUS", "FAKE"].includes(supply.fake_status)) {
          stat.fake += 1;
        }
      });

      const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

      const trustScores = Array.from(totals.entries())
        .map(([supplierId, stat]) => {
          const supplier = supplierMap.get(supplierId);
          const penalty = stat.rejected * 20 + stat.warnings * 8 + stat.flags * 2 + stat.fake * 25;
          const score = clamp(100 - penalty, 0, 100);
          const label = score >= 80 ? "SAFE" : score >= 60 ? "MODERATE" : "RISK";

          return {
            supplierId,
            supplier: supplier?.name || "Unknown",
            score,
            label,
            totalSupplies: stat.total
          };
        })
        .sort((a, b) => a.score - b.score)
        .slice(0, 5);

      setTrustData(trustScores);
    } catch (err) {
      console.error("Failed to fetch intelligence data:", err);
      setError("Failed to load intelligence data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header Section with Gradient */}
      <div className="mb-8 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-2xl p-8 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Intelligence Dashboard</h1>
            <p className="text-purple-100 text-lg">AI-powered insights, corruption detection & trust analysis</p>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 text-white">
              <span className="text-sm">AI Analysis Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights Summary */}
      {aiInsights?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-red-200">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-red-600 rounded-xl p-3 shadow-md">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-semibold uppercase tracking-wide mb-1">High Risk Suppliers</h3>
            <p className="text-4xl font-bold text-red-700">{aiInsights.summary.total_high_risk || 0}</p>
            <div className="mt-3 flex items-center text-sm text-red-700">
              <span className="font-medium">Critical attention required</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-orange-200">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-600 rounded-xl p-3 shadow-md">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-semibold uppercase tracking-wide mb-1">Fake Medicines</h3>
            <p className="text-4xl font-bold text-orange-700">{aiInsights.summary.total_fake || 0}</p>
            <div className="mt-3 flex items-center text-sm text-orange-700">
              <span className="font-medium">Detected & flagged</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-yellow-200">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-yellow-600 rounded-xl p-3 shadow-md">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-semibold uppercase tracking-wide mb-1">Anomalies</h3>
            <p className="text-4xl font-bold text-yellow-700">{aiInsights.summary.total_anomalies || 0}</p>
            <div className="mt-3 flex items-center text-sm text-yellow-700">
              <span className="font-medium">Pattern deviations</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-600 rounded-xl p-3 shadow-md">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-semibold uppercase tracking-wide mb-1">Pattern Warnings</h3>
            <p className="text-4xl font-bold text-purple-700">{aiInsights.summary.total_patterns || 0}</p>
            <div className="mt-3 flex items-center text-sm text-purple-700">
              <span className="font-medium">Behavioral alerts</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Corruption Signals */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-5">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              Corruption Signals
            </h2>
            <p className="text-red-100 text-sm mt-1">Critical flags requiring immediate action</p>
          </div>
          <div className="p-6">
            {corruptionData?.critical_flags && corruptionData.critical_flags.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {corruptionData.critical_flags.slice(0, 5).map((flag, idx) => (
                  <div key={idx} className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg hover:shadow-md transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-bold text-red-900">{flag.flag_type?.replace(/_/g, ' ')}</p>
                        <p className="text-sm text-red-700 mt-1">{flag.description}</p>
                      </div>
                      <span className="ml-2 bg-red-600 text-white text-xs px-3 py-1 rounded-full font-bold">
                        {flag.severity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p className="text-gray-500 font-medium">No critical corruption signals detected</p>
              </div>
            )}
          </div>
        </div>

        {/* Anomaly Insights */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 px-6 py-5">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
              Anomaly Insights
            </h2>
            <p className="text-yellow-100 text-sm mt-1">AI-detected behavioral patterns</p>
          </div>
          <div className="p-6">
            {aiInsights?.anomalies && aiInsights.anomalies.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {aiInsights.anomalies.slice(0, 5).map((anomaly, idx) => (
                  <div key={idx} className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-lg hover:shadow-md transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-bold text-yellow-900">{anomaly.type}</p>
                        <p className="text-sm text-yellow-700 mt-1">{anomaly.description}</p>
                      </div>
                      <span className="ml-2 bg-yellow-600 text-white text-xs px-3 py-1 rounded-full font-bold">
                        {anomaly.severity || 'MEDIUM'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p className="text-gray-500 font-medium">No anomalies detected</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Low Trust Suppliers */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-5">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            Low Trust Suppliers
          </h2>
          <p className="text-indigo-100 text-sm mt-1">Bottom 5 suppliers requiring review</p>
        </div>
        <div className="p-6">
          {trustData.length > 0 ? (
            <div className="space-y-4">
              {trustData.map((supplier, index) => (
                <div key={supplier.supplierId} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 hover:shadow-lg transition-all">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg shadow-md">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">{supplier.supplier}</p>
                      <p className="text-sm text-gray-600">{supplier.totalSupplies} supplies</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32 bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          supplier.score >= 80
                            ? "bg-gradient-to-r from-green-400 to-green-600"
                            : supplier.score >= 60
                            ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                            : "bg-gradient-to-r from-red-400 to-red-600"
                        }`}
                      style={{ width: `${supplier.score}%` }}
                    />
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-2xl text-gray-900">{supplier.score}</div>
                    <div className="text-xs text-gray-500">Score</div>
                  </div>
                  <span className={`px-4 py-2 rounded-xl text-sm font-bold shadow-md ${
                    supplier.label === 'SAFE'
                      ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300'
                      : supplier.label === 'MODERATE'
                      ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-300'
                      : 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300'
                  }`}>
                    {supplier.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p className="text-gray-500 font-medium">No supplier data available</p>
          </div>
        )}
      </div>
    </div>
    </Layout>
  );
}
