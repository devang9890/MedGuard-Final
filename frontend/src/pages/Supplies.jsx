import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { addSupply } from "../api/supplyApi";
import { getSuppliers } from "../api/supplierApi";
import { getMedicines } from "../api/medicineApi";

export default function Supplies() {
	const [suppliers, setSuppliers] = useState([]);
	const [medicines, setMedicines] = useState([]);
	const [result, setResult] = useState(null);

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
		setSuppliers(sup.data);
		setMedicines(med.data);
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
		setResult(res.data.compliance_status);
	};

	return (
		<Layout>
			<h1 className="text-2xl font-bold mb-6">Supply Entry</h1>

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
					<div className={`mt-6 p-4 rounded text-white text-lg ${result === "ACCEPT"
						? "bg-green-600"
						: result === "WARNING"
							? "bg-yellow-500"
							: "bg-red-600"
						}`}>
						Compliance Result: {result}
					</div>
				)}
			</div>
		</Layout>
	);
}
