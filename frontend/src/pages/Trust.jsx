import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import API from "../api/axios";

export default function Trust() {
  const [data, setData] = useState([]);

  useEffect(() => {
    API.get("/trust").then(res => setData(res.data));
  }, []);

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
