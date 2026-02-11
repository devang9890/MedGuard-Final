import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import {
	getSuppliers,
	addSupplier,
	verifySupplier,
	blacklistSupplier
} from "../api/supplierApi";

export default function Suppliers() {
	const [suppliers, setSuppliers] = useState([]);
	const [form, setForm] = useState({
		name: "",
		licenseNumber: "",
		phone: "",
		email: ""
	});

	const fetchSuppliers = async () => {
		const res = await getSuppliers();
		setSuppliers(res.data);
	};

	useEffect(() => {
		fetchSuppliers();
	}, []);

	const handleAdd = async () => {
		await addSupplier({ ...form, address: "N/A" });
		setForm({ name: "", licenseNumber: "", phone: "", email: "" });
		fetchSuppliers();
	};

	const handleVerify = async (id) => {
		await verifySupplier(id);
		fetchSuppliers();
	};

	const handleBlacklist = async (id) => {
		await blacklistSupplier(id);
		fetchSuppliers();
	};

	return (
		<Layout>
			<h1 className="text-2xl font-bold mb-6">Supplier Management</h1>

			<div className="bg-white p-4 rounded shadow mb-6">
				<h2 className="font-semibold mb-3">Add Supplier</h2>

				<div className="grid grid-cols-4 gap-4">
					<input
						placeholder="Name"
						className="border p-2"
						value={form.name}
						onChange={(e) => setForm({ ...form, name: e.target.value })}
					/>
					<input
						placeholder="License"
						className="border p-2"
						value={form.licenseNumber}
						onChange={(e) =>
							setForm({ ...form, licenseNumber: e.target.value })
						}
					/>
					<input
						placeholder="Phone"
						className="border p-2"
						value={form.phone}
						onChange={(e) => setForm({ ...form, phone: e.target.value })}
					/>
					<input
						placeholder="Email"
						className="border p-2"
						value={form.email}
						onChange={(e) => setForm({ ...form, email: e.target.value })}
					/>
				</div>

				<button
					onClick={handleAdd}
					className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
				>
					Add Supplier
				</button>
			</div>

			<div className="bg-white p-4 rounded shadow">
				<h2 className="font-semibold mb-3">All Suppliers</h2>

				<table className="w-full border">
					<thead className="bg-gray-100">
						<tr>
							<th className="p-2">Name</th>
							<th>License</th>
							<th>Status</th>
							<th>Actions</th>
						</tr>
					</thead>

					<tbody>
						{suppliers.map((s) => (
							<tr key={s._id} className="border-t">
								<td className="p-2">{s.name}</td>
								<td>{s.licenseNumber}</td>
								<td>
									{s.blacklisted ? (
										<span className="text-red-600">Blacklisted</span>
									) : s.verified ? (
										<span className="text-green-600">Verified</span>
									) : (
										<span className="text-yellow-600">Pending</span>
									)}
								</td>

								<td className="flex gap-2 p-2">
									<button
										onClick={() => handleVerify(s._id)}
										className="bg-green-500 text-white px-3 py-1 rounded"
									>
										Verify
									</button>

									<button
										onClick={() => handleBlacklist(s._id)}
										className="bg-red-500 text-white px-3 py-1 rounded"
									>
										Blacklist
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</Layout>
	);
}
