import { useEffect, useState } from "react";
import { getDashboardAnalytics } from "../api/dashboardApi";
import Layout from "../components/Layout";
import CompliancePie from "../components/CompliancePie";
import SupplierRiskChart from "../components/SupplierRiskChart";
import NearExpiryTable from "../components/NearExpiryTable";

export default function AdminDashboard() {
  const [stats, setStats] = useState({});
  const [riskData, setRiskData] = useState([]);
  const [nearExpiry, setNearExpiry] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getDashboardAnalytics();
        setStats(res.data);
        setRiskData(res.data.supplier_risk || []);
        setNearExpiry(res.data.near_expiry || []);
      } catch (error) {
        console.error("Failed to fetch admin analytics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-3"></div>
            <p className="text-[var(--text-muted)] text-sm font-medium">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const complianceRate = stats.total_supplies
    ? Math.round(((stats.accepted || 0) / stats.total_supplies) * 100)
    : 0;

  return (
    <Layout>
      {/* Header */}
      <div className="mb-5">
        <div className="bg-gradient-to-r from-slate-700 via-gray-800 to-zinc-800 rounded-xl p-5 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-xl font-bold text-white mb-1 flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Admin Dashboard
              </h1>
              <p className="text-gray-400 text-sm">Manage suppliers, medicines, supplies & compliance</p>
            </div>
            <div className="mt-3 md:mt-0 flex gap-2">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
                <p className="text-gray-400 text-[11px] font-medium">Supplies</p>
                <p className="text-lg font-bold text-white">{stats.total_supplies || 0}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
                <p className="text-gray-400 text-[11px] font-medium">Compliance</p>
                <p className="text-lg font-bold text-green-400">{complianceRate}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total Supplies", value: stats.total_supplies || 0, color: "text-blue-500", bg: "bg-blue-100", iconPath: "M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" },
          { label: "Accepted", value: stats.accepted || 0, color: "text-green-500", bg: "bg-green-100", iconPath: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
          { label: "Warnings", value: stats.warnings || 0, color: "text-yellow-500", bg: "bg-yellow-100", iconPath: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" },
          { label: "Rejected", value: stats.rejected || 0, color: "text-red-500", bg: "bg-red-100", iconPath: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" },
        ].map((m, i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs font-medium mb-1">{m.label}</p>
                <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
              </div>
              <div className={`${m.bg} rounded-full p-2.5`}>
                <svg className={`w-5 h-5 ${m.color}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={m.iconPath} />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-4 py-3">
            <h2 className="text-sm font-semibold text-white flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              </svg>
              Compliance Overview
            </h2>
          </div>
          <div className="p-4">
            <CompliancePie data={stats} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-4 py-3">
            <h2 className="text-sm font-semibold text-white flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Supplier Risk Assessment
            </h2>
          </div>
          <div className="p-4">
            <SupplierRiskChart data={riskData} />
          </div>
        </div>
      </div>

      {/* Near Expiry Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-4 py-3">
          <h2 className="text-sm font-semibold text-white flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Near Expiry Medicines
          </h2>
        </div>
        <div className="p-4">
          <NearExpiryTable data={nearExpiry} />
        </div>
      </div>
    </Layout>
  );
}
