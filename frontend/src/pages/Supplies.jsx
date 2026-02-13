import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import RecycleBin from "../components/RecycleBin";
import API from "../api/axios";
import { addSupply, getSupplies } from "../api/supplyApi";
import { getSuppliers } from "../api/supplierApi";
import { getMedicines } from "../api/medicineApi";

export default function Supplies() {
	const [suppliers, setSuppliers] = useState([]);
	const [medicines, setMedicines] = useState([]);
	const [result, setResult] = useState(null);
	const [supplies, setSupplies] = useState([]);
	const [recycleBinOpen, setRecycleBinOpen] = useState(false);

	const [form, setForm] = useState({
		medicineId: "",
		supplierId: "",
		batchNumber: "",
		expiryDate: "",
		quantity: "",
		temperature: ""
	});

	useEffect(() => {
		fetchData();
	}, []);

	const fetchData = async () => {
		const sup = await getSuppliers();
		const med = await getMedicines();
		const suppliesRes = await getSupplies();
		setSuppliers(sup.data);
		setMedicines(med.data);
		setSupplies(suppliesRes.data);
	};

	const handleSubmit = async () => {
		const payload = {
			medicine_id: form.medicineId,
			supplier_id: form.supplierId,
			batch_number: form.batchNumber,
			expiry_date: form.expiryDate,
			quantity: parseInt(form.quantity),
			temperature: parseFloat(form.temperature)
		};
		const res = await addSupply(payload);
		setResult(res.data.compliance_status || "PENDING");
		const suppliesRes = await getSupplies();
		setSupplies(suppliesRes.data);
	};

	const handleDelete = async (id) => {
		if (!window.confirm("Move to recycle bin?")) return;
		try {
			const response = await API.delete(`/supply/${id}`);
			console.log("Delete response:", response.data);
			const suppliesRes = await getSupplies();
			setSupplies(suppliesRes.data);
			alert("Supply moved to recycle bin successfully!");
		} catch (err) {
			console.error("Delete failed:", err);
			alert("Failed to delete supply: " + (err.response?.data?.detail || err.message));
		}
	};

	const supplierMap = new Map(
		suppliers.map((supplier) => [supplier._id || supplier.id, supplier])
	);

	return (
		<Layout>
			<h1 className="text-2xl font-bold mb-6">Supply Entry</h1>

			<button
				onClick={() => setRecycleBinOpen(true)}
				className="mb-4 bg-gray-600 text-white px-4 py-2 rounded"
			>
				♻ Recycle Bin
			</button>

			<div className="bg-white p-6 rounded shadow">
				<div className="grid grid-cols-3 gap-4">
					<select
						className="border p-2"
						onChange={(e) => setForm({ ...form, medicineId: e.target.value })}
					>
						<option>Select Medicine</option>
						{medicines.map((m) => (
							<option key={m._id} value={m._id}>{m.name}</option>
						))}
					</select>

					<select
						className="border p-2"
						onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
					>
						<option>Select Supplier</option>
						{suppliers.map((s) => (
							<option key={s._id} value={s._id}>{s.name}</option>
						))}
					</select>

					<input
						placeholder="Batch Number"
						className="border p-2"
						onChange={(e) => setForm({ ...form, batchNumber: e.target.value })}
					/>

					<input
						type="date"
						className="border p-2"
						onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
					/>

					<input
						placeholder="Quantity"
						className="border p-2"
						onChange={(e) => setForm({ ...form, quantity: e.target.value })}
					/>

					<input
						placeholder="Temperature"
						className="border p-2"
						onChange={(e) => setForm({ ...form, temperature: e.target.value })}
					/>
				</div>

				<button
					onClick={handleSubmit}
					className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
				>
					Submit Supply
				</button>

				{result && (
					<div className={`mt-6 p-4 rounded text-white text-lg ${result === "ACCEPTED"
						? "bg-green-600"
						: result === "REJECTED"
							? "bg-red-600"
							: "bg-yellow-500"
						}`}>
						Compliance Result: {result}
					</div>
				)}
			</div>

			<div className="mt-8 bg-white p-4 rounded shadow">
				<h2 className="font-semibold mb-3">Supply Records</h2>

				<table className="w-full border">
					<thead className="bg-gray-100">
						<tr>
							<th className="p-2">Batch</th>
							<th>Supplier</th>
							<th>Expiry</th>
							<th>Compliance</th>
							<th>Fake Status</th>
							<th>Risk Flags</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{supplies.map((supply) => {
							const supplier = supplierMap.get(supply.supplier_id);
							const isFake = ["SUSPICIOUS", "FAKE"].includes(supply.fake_status);

							return (
								<tr
										key={supply.id}
										className={`border-t ${isFake ? "bg-red-50" : ""}`}
									>
										<td className="p-2">{supply.batch_number}</td>
										<td>{supplier?.name || "Unknown"}</td>
										<td>{new Date(supply.expiry_date).toLocaleDateString()}</td>
										<td>{supply.compliance_status}</td>
										<td>{supply.fake_status || "-"}</td>
										<td>{(supply.risk_flags || []).join(", ") || "-"}</td>
										<td className="p-2">
											<button
												onClick={() => handleDelete(supply.id)}
												className="bg-gray-700 text-white px-3 py-1 rounded"
											>
												🗑
											</button>
										</td>
									</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			<RecycleBin
				module="supply"
				open={recycleBinOpen}
				onClose={() => {
					setRecycleBinOpen(false);
					fetchData();
				}}
				onUpdate={fetchData}
			/>
		</Layout>
	);
}
