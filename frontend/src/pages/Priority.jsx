import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import { getSupplies } from "../api/supplyApi";
import { getMedicines } from "../api/medicineApi";

export default function Priority() {
  const [supplies, setSupplies] = useState([]);
  const [medicines, setMedicines] = useState([]);

  useEffect(() => {
    const load = async () => {
      const [suppliesRes, medicinesRes] = await Promise.all([
        getSupplies(),
        getMedicines()
      ]);
      setSupplies(suppliesRes.data);
      setMedicines(medicinesRes.data);
    };

    load();
  }, []);

  const data = useMemo(() => {
    const medicineMap = new Map(
      medicines.map((med) => [med._id || med.id, med])
    );

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const now = Date.now();

    return supplies
      .map((supply) => {
        const expiry = new Date(supply.expiry_date).getTime();
        const daysToExpiry = Math.max(0, Math.ceil((expiry - now) / 86400000));
        const quantity = Number.isFinite(supply.quantity) ? supply.quantity : 0;
        const priorityScore = clamp(Math.round((30 - daysToExpiry) * 2 + quantity / 5), 0, 100);
        const medicine = medicineMap.get(supply.medicine_id);

        return {
          supplyId: supply.id || supply._id,
          medicine: medicine?.name || "Unknown",
          batchNumber: supply.batch_number,
          daysToExpiry,
          quantity,
          priorityScore
        };
      })
      .sort((a, b) => b.priorityScore - a.priorityScore);
  }, [supplies, medicines]);

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Usage Priority Recommendations</h1>

      <div className="bg-white p-4 rounded shadow">
        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">Medicine</th>
              <th>Batch</th>
              <th>Days to Expiry</th>
              <th>Quantity</th>
              <th>Priority Score</th>
            </tr>
          </thead>

          <tbody>
            {data.map((item) => (
              <tr key={item.supplyId} className="border-t">
                <td className="p-2">{item.medicine}</td>
                <td>{item.batchNumber}</td>
                <td>{item.daysToExpiry}</td>
                <td>{item.quantity}</td>
                <td className="font-bold text-red-600">
                  {item.priorityScore}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
