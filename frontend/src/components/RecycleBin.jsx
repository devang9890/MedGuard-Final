import { useState, useEffect } from "react";
import API from "../api/axios";

export default function RecycleBin({ module, open, onClose, onUpdate }) {
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
      alert("Failed to load recycle bin: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id) => {
    try {
      const response = await API.post(`/${module}/restore/${id}`);
      console.log("Restore response:", response.data);
      await fetchDeleted();
      if (onUpdate) onUpdate(); // Refresh parent list
      alert("Record restored successfully!");
    } catch (err) {
      console.error("Restore failed:", err);
      alert("Failed to restore: " + (err.response?.data?.detail || err.message));
    }
  };

  const handlePermanentDelete = async (id) => {
    if (!window.confirm("Permanently delete? This cannot be undone.")) return;

    try {
      const response = await API.delete(`/${module}/permanent/${id}`);
      console.log("Permanent delete response:", response.data);
      await fetchDeleted();
      alert("Record permanently deleted!");
    } catch (err) {
      console.error("Permanent delete failed:", err);
      alert("Failed to permanently delete: " + (err.response?.data?.detail || err.message));
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
                <th className="p-2">Name</th>
                <th>Deleted At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {deleted.map((item) => {
                const itemId = item._id || item.id;
                return (
                  <tr key={itemId} className="border-t">
                    <td className="p-2 font-medium">{item.name || item.batch_number || "N/A"}</td>
                    <td className="p-2">
                      {item.deleted_at
                        ? new Date(item.deleted_at).toLocaleString()
                        : "-"}
                    </td>
                    <td className="flex gap-2 p-2">
                      <button
                        onClick={() => handleRestore(itemId)}
                        className="bg-green-500 text-white px-3 py-1 rounded text-sm"
                      >
                        Restore
                      </button>
                      <button
                        onClick={() => handlePermanentDelete(itemId)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Delete Forever
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
