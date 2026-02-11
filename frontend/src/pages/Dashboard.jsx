import { useEffect, useState } from "react";
import { getDashboardAnalytics } from "../api/dashboardApi";
import Layout from "../components/Layout";
import CompliancePie from "../components/CompliancePie";
import SupplierRiskChart from "../components/SupplierRiskChart";
import NearExpiryTable from "../components/NearExpiryTable";

export default function Dashboard() {
  const [stats, setStats] = useState({});
  const [riskData, setRiskData] = useState([]);
  const [nearExpiry, setNearExpiry] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await getDashboardAnalytics();
      setStats(res.data);
      setRiskData(res.data.supplier_risk || []);
      setNearExpiry(res.data.near_expiry || []);
    };

    fetchData();
  }, []);

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">MedGuard Dashboard</h1>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white shadow p-4 rounded">
          <h3>Total Supplies</h3>
          <p className="text-xl font-bold">{stats.total_supplies || 0}</p>
        </div>

        <div className="bg-green-100 shadow p-4 rounded">
          <h3>Accepted</h3>
          <p className="text-xl font-bold">{stats.accepted || 0}</p>
        </div>

        <div className="bg-yellow-100 shadow p-4 rounded">
          <h3>Warnings</h3>
          <p className="text-xl font-bold">{stats.warnings || 0}</p>
        </div>

        <div className="bg-red-100 shadow p-4 rounded">
          <h3>Rejected</h3>
          <p className="text-xl font-bold">{stats.rejected || 0}</p>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-6">
        <div className="chart-shell chart-shell--compliance">
          <h2 className="chart-title">Compliance Overview</h2>
          <CompliancePie data={stats} />
        </div>

        <div className="chart-shell chart-shell--risk">
          <h2 className="chart-title">Supplier Risk</h2>
          <SupplierRiskChart data={riskData} />
        </div>
      </div>

      <div className="mt-10">
        <NearExpiryTable data={nearExpiry} />
      </div>
    </Layout>
  );
}
