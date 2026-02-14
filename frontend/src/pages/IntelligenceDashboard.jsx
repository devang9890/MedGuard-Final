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
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading intelligence analysis...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Intelligence Dashboard</h1>
        <p className="text-gray-600 mt-2">AI insights, corruption detection & trust analysis</p>
      </div>

      {/* AI Insights Summary */}
      {aiInsights?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6">
            <h3 className="text-gray-600 text-sm font-medium">High Risk Suppliers</h3>
            <p className="text-3xl font-bold text-red-600 mt-2">{aiInsights.summary.total_high_risk || 0}</p>
          </div>

          <div className="bg-orange-50 border-l-4 border-orange-500 rounded-lg p-6">
            <h3 className="text-gray-600 text-sm font-medium">Fake Medicines Detected</h3>
            <p className="text-3xl font-bold text-orange-600 mt-2">{aiInsights.summary.total_fake || 0}</p>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-6">
            <h3 className="text-gray-600 text-sm font-medium">Anomalies</h3>
            <p className="text-3xl font-bold text-yellow-600 mt-2">{aiInsights.summary.total_anomalies || 0}</p>
          </div>

          <div className="bg-purple-50 border-l-4 border-purple-500 rounded-lg p-6">
            <h3 className="text-gray-600 text-sm font-medium">Pattern Warnings</h3>
            <p className="text-3xl font-bold text-purple-600 mt-2">{aiInsights.summary.total_patterns || 0}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Corruption Signals */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">⚠️ Corruption Signals</h2>
          {corruptionData?.critical_flags && corruptionData.critical_flags.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {corruptionData.critical_flags.slice(0, 5).map((flag, idx) => (
                <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-red-900">{flag.flag_type?.replace(/_/g, ' ')}</p>
                      <p className="text-sm text-red-700">{flag.description}</p>
                    </div>
                    <span className="ml-2 bg-red-600 text-white text-xs px-2 py-1 rounded font-medium">
                      {flag.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No critical corruption signals detected</p>
          )}
        </div>

        {/* Anomaly Insights */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">🔍 Anomaly Insights</h2>
          {aiInsights?.anomalies && aiInsights.anomalies.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {aiInsights.anomalies.slice(0, 5).map((anomaly, idx) => (
                <div key={idx} className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-yellow-900">{anomaly.type}</p>
                      <p className="text-sm text-yellow-700">{anomaly.description}</p>
                    </div>
                    <span className="ml-2 bg-yellow-600 text-white text-xs px-2 py-1 rounded font-medium">
                      {anomaly.severity || 'MEDIUM'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No anomalies detected</p>
          )}
        </div>
      </div>

      {/* Low Trust Suppliers */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">⚠️ Low Trust Suppliers (Bottom 5)</h2>
        {trustData.length > 0 ? (
          <div className="space-y-3">
            {trustData.map((supplier) => (
              <div key={supplier.supplierId} className="flex items-center justify-between p-4 bg-gray-50 rounded border border-gray-200">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{supplier.supplier}</p>
                  <p className="text-sm text-gray-600">{supplier.totalSupplies} supplies</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-full rounded-full ${
                        supplier.score >= 80
                          ? "bg-green-500"
                          : supplier.score >= 60
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${supplier.score}%` }}
                    />
                  </div>
                  <span className="font-bold text-gray-900 w-12">{supplier.score}</span>
                  <span className={`px-3 py-1 rounded text-sm font-medium ${
                    supplier.label === 'SAFE'
                      ? 'bg-green-100 text-green-800'
                      : supplier.label === 'MODERATE'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {supplier.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No supplier data available</p>
        )}
      </div>
    </Layout>
  );
}
