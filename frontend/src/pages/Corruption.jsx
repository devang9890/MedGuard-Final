import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import API from "../api/axios";

export default function Corruption() {
  const [data, setData] = useState([]);

  useEffect(() => {
    API.get("/corruption").then(res => setData(res.data));
  }, []);

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
