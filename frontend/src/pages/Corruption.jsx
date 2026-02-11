import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import { getSupplies } from "../api/supplyApi";
import { getSuppliers } from "../api/supplierApi";

export default function Corruption() {
  const [supplies, setSupplies] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    const load = async () => {
      const [suppliesRes, suppliersRes] = await Promise.all([
        getSupplies(),
        getSuppliers()
      ]);
      setSupplies(suppliesRes.data);
      setSuppliers(suppliersRes.data);
    };

    load();
  }, []);

  const data = useMemo(() => {
    const supplierMap = new Map(
      suppliers.map((supplier) => [supplier._id || supplier.id, supplier])
    );
    const stats = new Map();

    supplies.forEach((supply) => {
      const supplierId = supply.supplier_id;
      if (!supplierId) return;

      if (!stats.has(supplierId)) {
        stats.set(supplierId, {
          total: 0,
          accepted: 0,
          rejected: 0,
          warnings: 0,
          fake: 0
        });
      }

      const stat = stats.get(supplierId);
      stat.total += 1;
      if (supply.compliance_status === "ACCEPTED") stat.accepted += 1;
      if (supply.compliance_status === "REJECTED") stat.rejected += 1;
      if (Array.isArray(supply.risk_flags) && supply.risk_flags.length > 0) stat.warnings += 1;
      if (["SUSPICIOUS", "FAKE"].includes(supply.fake_status)) stat.fake += 1;
    });

    const results = [];
    stats.forEach((stat, supplierId) => {
      const supplier = supplierMap.get(supplierId);
      const acceptanceRate = stat.total ? Math.round((stat.accepted / stat.total) * 100) : 0;
      const flags = [];

      if (stat.rejected >= 2) flags.push("HIGH_REJECTION_RATE");
      if (stat.warnings / Math.max(stat.total, 1) > 0.3) flags.push("FREQUENT_WARNINGS");
      if (stat.fake > 0) flags.push("FAKE_MEDICINE_SIGNAL");

      if (flags.length > 0) {
        results.push({
          supplier: supplier?.name || "Unknown",
          acceptanceRate,
          flags
        });
      }
    });

    return results;
  }, [supplies, suppliers]);

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Corruption Detection</h1>

      {data.length === 0 ? (
        <p>No suspicious activity detected</p>
      ) : (
        data.map((item, idx) => (
          <div key={idx} className="bg-white p-4 mb-4 shadow rounded">
            <h2 className="font-semibold">{item.supplier}</h2>
            <p>Acceptance Rate: {item.acceptanceRate}%</p>

            <ul className="text-red-600 mt-2">
              {item.flags.map((flag, i) => (
                <li key={i}>⚠ {flag}</li>
              ))}
            </ul>
          </div>
        ))
      )}
    </Layout>
  );
}
