import { useState, useEffect } from "react";
import API from "../api/axios";

export default function RecycleBin({ module, open, onClose }) {
  const [deleted, setDeleted] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) fetchDeleted();
  }, [open, module]);

  const fetchDeleted = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/${module}/recycle/bin`);
      setDeleted(res.data);
    } catch (err) {
      console.error("Failed to fetch recycle bin:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id) => {
    try {
      await API.post(`/${module}/restore/${id}`);
      fetchDeleted();
    } catch (err) {
      console.error("Restore failed:", err);
    }
  };

  const handlePermanentDelete = async (id) => {
    if (!window.confirm("Permanently delete? This cannot be undone.")) return;

    try {
      await API.delete(`/${module}/permanent/${id}`);
      fetchDeleted();
    } catch (err) {
      console.error("Permanent delete failed:", err);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-4xl p-6 max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">♻ Recycle Bin - {module}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : deleted.length === 0 ? (
          <p className="text-center text-gray-500">No deleted records</p>
        ) : (
          <table className="w-full border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2">ID</th>
                <th>Name</th>
                <th>Deleted At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {deleted.map((item) => (
                <tr key={item._id} className="border-t">
                  <td className="p-2 text-xs text-gray-500">{item._id}</td>
                  <td>{item.name || item.batch_number || "N/A"}</td>
                  <td>
                    {item.deleted_at
                      ? new Date(item.deleted_at).toLocaleString()
                      : "-"}
                  </td>
                  <td className="flex gap-2 p-2">
                    <button
                      onClick={() => handleRestore(item._id)}
                      className="bg-green-500 text-white px-3 py-1 rounded text-sm"
                    >
                      Restore
                    </button>
                    <button
                      onClick={() => handlePermanentDelete(item._id)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Delete Forever
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
