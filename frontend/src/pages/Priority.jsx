import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import API from "../api/axios";

export default function Priority() {
  const [data, setData] = useState([]);

  useEffect(() => {
    API.get("/usage-priority").then(res => setData(res.data));
  }, []);

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
