export default function NearExpiryTable({ data }) {
  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="font-semibold mb-3">Near Expiry Supplies</h2>

      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2">Medicine</th>
            <th>Supplier</th>
            <th>Expiry Date</th>
          </tr>
        </thead>

        <tbody>
          {data.map((item) => (
            <tr key={item._id} className="border-t">
              <td className="p-2">{item.medicineId?.name}</td>
              <td>{item.supplierId?.name}</td>
              <td>{new Date(item.expiryDate).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
