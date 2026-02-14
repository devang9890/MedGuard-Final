import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import { getSupplies } from "../api/supplyApi";
import { getSuppliers } from "../api/supplierApi";

export default function Trust() {
  const [supplies, setSupplies] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [suppliesRes, suppliersRes] = await Promise.all([
          getSupplies(),
          getSuppliers()
        ]);
        setSupplies(suppliesRes.data);
        setSuppliers(suppliersRes.data);
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const data = useMemo(() => {
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

    return Array.from(totals.entries()).map(([supplierId, stat]) => {
      const supplier = supplierMap.get(supplierId);
      const penalty = stat.rejected * 20 + stat.warnings * 8 + stat.flags * 2 + stat.fake * 25;
      const score = clamp(100 - penalty, 0, 100);
      const label = score >= 80 ? "SAFE" : score >= 60 ? "MODERATE" : "RISK";

      return {
        supplierId,
        supplier: supplier?.name || "Unknown",
        score,
        label,
        totalSupplies: stat.total,
        stats: stat
      };
    }).sort((a, b) => a.score - b.score);
  }, [supplies, suppliers]);

  const filteredData = useMemo(() => {
    if (filterStatus === "ALL") return data;
    return data.filter(s => s.label === filterStatus);
  }, [data, filterStatus]);

  const stats = useMemo(() => {
    const safe = data.filter(s => s.label === "SAFE").length;
    const moderate = data.filter(s => s.label === "MODERATE").length;
    const risk = data.filter(s => s.label === "RISK").length;
    const avgScore = data.length > 0 ? Math.round(data.reduce((sum, s) => sum + s.score, 0) / data.length) : 0;
    return { safe, moderate, risk, avgScore, total: data.length };
  }, [data]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header Section */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Supplier Trust Score</h1>
              <p className="text-indigo-100 text-lg">AI-powered supplier reliability assessment and risk analysis</p>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-4">
                <p className="text-indigo-100 text-sm font-medium">Average Trust Score</p>
                <p className="text-4xl font-bold text-white">{stats.avgScore}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Total Suppliers</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-blue-100 rounded-full p-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 cursor-pointer hover:shadow-xl transition-all" onClick={() => setFilterStatus(filterStatus === "SAFE" ? "ALL" : "SAFE")}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Safe</p>
              <p className="text-3xl font-bold text-green-600">{stats.safe}</p>
            </div>
            <div className="bg-green-100 rounded-full p-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 cursor-pointer hover:shadow-xl transition-all" onClick={() => setFilterStatus(filterStatus === "MODERATE" ? "ALL" : "MODERATE")}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Moderate</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.moderate}</p>
            </div>
            <div className="bg-yellow-100 rounded-full p-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 cursor-pointer hover:shadow-xl transition-all" onClick={() => setFilterStatus(filterStatus === "RISK" ? "ALL" : "RISK")}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">High Risk</p>
              <p className="text-3xl font-bold text-red-600">{stats.risk}</p>
            </div>
            <div className="bg-red-100 rounded-full p-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-gray-700">Filter by Status:</span>
          {["ALL", "SAFE", "MODERATE", "RISK"].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                filterStatus === status
                  ? status === "SAFE"
                    ? "bg-green-600 text-white"
                    : status === "MODERATE"
                      ? "bg-yellow-500 text-white"
                      : status === "RISK"
                        ? "bg-red-600 text-white"
                        : "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Trust Score Table */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4">
          <h2 className="text-xl font-bold text-white flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
            Supplier Reliability Ranking ({filteredData.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Trust Score
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Total Supplies
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Risk Metrics
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                      </svg>
                      <p className="text-lg font-semibold">No suppliers found</p>
                      <p className="text-sm">
                        {filterStatus !== "ALL" 
                          ? `No ${filterStatus.toLowerCase()} suppliers`
                          : "Add suppliers to see trust scores"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((s) => (
                  <tr key={s.supplierId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className={`rounded-lg p-2 mr-3 ${
                          s.label === "SAFE" ? "bg-green-100" : s.label === "MODERATE" ? "bg-yellow-100" : "bg-red-100"
                        }`}>
                          <svg className={`w-5 h-5 ${
                            s.label === "SAFE" ? "text-green-600" : s.label === "MODERATE" ? "text-yellow-600" : "text-red-600"
                          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                          </svg>
                        </div>
                        <span className="text-sm font-bold text-gray-900">{s.supplier}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                          <div 
                            className={`h-2 rounded-full ${
                              s.score >= 80 ? "bg-green-500" : s.score >= 60 ? "bg-yellow-500" : "bg-red-500"
                            }`}
                            style={{ width: `${s.score}%` }}
                          ></div>
                        </div>
                        <span className="text-lg font-bold text-gray-900">{s.score}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold text-white ${
                        s.label === "SAFE"
                          ? "bg-green-500"
                          : s.label === "MODERATE"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}>
                        {s.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {s.totalSupplies}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2 text-xs">
                        {s.stats.rejected > 0 && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-md font-semibold">
                            {s.stats.rejected} Rejected
                          </span>
                        )}
                        {s.stats.warnings > 0 && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-md font-semibold">
                            {s.stats.warnings} Warnings
                          </span>
                        )}
                        {s.stats.fake > 0 && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-md font-semibold">
                            {s.stats.fake} Fake
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
