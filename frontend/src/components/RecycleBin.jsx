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
      await API.post(`/${module}/restore/${id}`);
      await fetchDeleted();
      if (onUpdate) onUpdate();
      alert("Record restored successfully!");
    } catch (err) {
      console.error("Restore failed:", err);
      alert("Failed to restore: " + (err.response?.data?.detail || err.message));
    }
  };

  const handlePermanentDelete = async (id) => {
    if (!window.confirm("Permanently delete? This cannot be undone.")) return;
    try {
      await API.delete(`/${module}/permanent/${id}`);
      await fetchDeleted();
      alert("Record permanently deleted!");
    } catch (err) {
      console.error("Permanent delete failed:", err);
      alert("Failed to permanently delete: " + (err.response?.data?.detail || err.message));
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-11/12 max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-3.5 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
            </svg>
            Recycle Bin – {module}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-5">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-3"></div>
              <p className="text-gray-500 text-sm">Loading...</p>
            </div>
          ) : deleted.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-10 h-10 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
              <p className="text-gray-500 text-sm">No deleted records</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Deleted At</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {deleted.map((item) => {
                  const itemId = item._id || item.id;
                  return (
                    <tr key={itemId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2.5 font-medium text-gray-900">{item.name || item.batch_number || "N/A"}</td>
                      <td className="px-3 py-2.5 text-gray-500 text-xs">
                        {item.deleted_at ? new Date(item.deleted_at).toLocaleString() : "–"}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex gap-1.5 justify-end">
                          <button
                            onClick={() => handleRestore(itemId)}
                            className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-md text-xs font-medium transition-colors"
                          >
                            Restore
                          </button>
                          <button
                            onClick={() => handlePermanentDelete(itemId)}
                            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-md text-xs font-medium transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
