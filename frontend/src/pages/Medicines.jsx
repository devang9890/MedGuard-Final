import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { getMedicines, addMedicine } from "../api/medicineApi";

export default function Medicines() {
  const [medicines, setMedicines] = useState([]);
  const [form, setForm] = useState({
    name: "",
    category: "",
    manufacturer: ""
  });

  const fetchMedicines = async () => {
    const res = await getMedicines();
    setMedicines(res.data);
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  const handleAdd = async () => {
    await addMedicine(form);
    setForm({ name: "", category: "", manufacturer: "" });
    fetchMedicines();
  };

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Medicine Management</h1>

      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="font-semibold mb-3">Add Medicine</h2>

        <div className="grid grid-cols-3 gap-4">
          <input
            placeholder="Medicine Name"
            className="border p-2"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <input
            placeholder="Category"
            className="border p-2"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />

          <input
            placeholder="Manufacturer"
            className="border p-2"
            value={form.manufacturer}
            onChange={(e) =>
              setForm({ ...form, manufacturer: e.target.value })
            }
          />
        </div>

        <button
          onClick={handleAdd}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
        >
          Add Medicine
        </button>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-3">All Medicines</h2>

        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">Name</th>
              <th>Category</th>
              <th>Manufacturer</th>
            </tr>
          </thead>

          <tbody>
            {medicines.map((m) => (
              <tr key={m._id} className="border-t">
                <td className="p-2">{m.name}</td>
                <td>{m.category}</td>
                <td>{m.manufacturer}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
