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

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage suppliers, medicines, supplies & compliance</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white shadow rounded-lg p-6 border-l-4 border-blue-500">
          <h3 className="text-gray-600 text-sm font-medium">Total Supplies</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total_supplies || 0}</p>
        </div>

        <div className="bg-white shadow rounded-lg p-6 border-l-4 border-green-500">
          <h3 className="text-gray-600 text-sm font-medium">Accepted</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">{stats.accepted || 0}</p>
        </div>

        <div className="bg-white shadow rounded-lg p-6 border-l-4 border-yellow-500">
          <h3 className="text-gray-600 text-sm font-medium">Warnings</h3>
          <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.warnings || 0}</p>
        </div>

        <div className="bg-white shadow rounded-lg p-6 border-l-4 border-red-500">
          <h3 className="text-gray-600 text-sm font-medium">Rejected</h3>
          <p className="text-3xl font-bold text-red-600 mt-2">{stats.rejected || 0}</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Compliance Overview</h2>
          <CompliancePie data={stats} />
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Supplier Risk Assessment</h2>
          <SupplierRiskChart data={riskData} />
        </div>
      </div>

      {/* Near Expiry Table */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Near Expiry Medicines</h2>
        <NearExpiryTable data={nearExpiry} />
      </div>
    </Layout>
  );
}
