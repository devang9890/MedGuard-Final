import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import { getSupplies } from "../api/supplyApi";
import { getSuppliers } from "../api/supplierApi";

export default function Trust() {
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
        totalSupplies: stat.total
      };
    });
  }, [supplies, suppliers]);

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Supplier Trust Score</h1>

      <table className="w-full bg-white rounded shadow">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2">Supplier</th>
            <th>Score</th>
            <th>Status</th>
            <th>Total Supplies</th>
          </tr>
        </thead>

        <tbody>
          {data.map((s) => (
            <tr key={s.supplierId} className="border-t">
              <td className="p-2">{s.supplier}</td>
              <td>{s.score}</td>
              <td>
                <span className={`px-3 py-1 rounded text-white ${
                  s.label === "SAFE"
                    ? "bg-green-500"
                    : s.label === "MODERATE"
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}>
                  {s.label}
                </span>
              </td>
              <td>{s.totalSupplies}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Layout>
  );
}
