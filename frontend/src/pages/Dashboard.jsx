import { useEffect, useState } from "react";
import {
  getDashboardStats,
  getSupplierRisk,
  getNearExpiry
} from "../api/dashboardApi";
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
      const statsRes = await getDashboardStats();
      setStats(statsRes.data);

      const riskRes = await getSupplierRisk();
      setRiskData(riskRes.data);

      const expiryRes = await getNearExpiry();
      setNearExpiry(expiryRes.data);
    };

    fetchData();
  }, []);

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">MedGuard Dashboard</h1>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white shadow p-4 rounded">
          <h3>Total Supplies</h3>
          <p className="text-xl font-bold">{stats.totalSupplies}</p>
        </div>

        <div className="bg-green-100 shadow p-4 rounded">
          <h3>Accepted</h3>
          <p className="text-xl font-bold">{stats.accepted}</p>
        </div>

        <div className="bg-yellow-100 shadow p-4 rounded">
          <h3>Warnings</h3>
          <p className="text-xl font-bold">{stats.warning}</p>
        </div>

        <div className="bg-red-100 shadow p-4 rounded">
          <h3>Rejected</h3>
          <p className="text-xl font-bold">{stats.rejected}</p>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-3">Compliance Overview</h2>
          <CompliancePie data={stats} />
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-3">Supplier Risk</h2>
          <SupplierRiskChart data={riskData} />
        </div>
      </div>

      <div className="mt-10">
        <NearExpiryTable data={nearExpiry} />
      </div>
    </Layout>
  );
}
