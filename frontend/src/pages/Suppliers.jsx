import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import RecycleBin from "../components/RecycleBin";
import API from "../api/axios";
import {
	getSuppliers,
	addSupplier,
	verifySupplier,
	blacklistSupplier
} from "../api/supplierApi";
import { getTrustScore } from "../api/trustApi";

export default function Suppliers() {
	const [suppliers, setSuppliers] = useState([]);
	const [trustScores, setTrustScores] = useState({});
	const [recycleBinOpen, setRecycleBinOpen] = useState(false);
	const [form, setForm] = useState({
		name: "",
		licenseNumber: "",
		phone: "",
		email: "",
		address: ""
	});

	const fetchSuppliers = async () => {
		const res = await getSuppliers();
		setSuppliers(res.data);
		
		// Fetch trust scores for all suppliers
		const scores = {};
		for (const supplier of res.data) {
			try {
				const trustRes = await getTrustScore(supplier._id);
				scores[supplier._id] = trustRes.data;
			} catch (err) {
				console.error(`Failed to fetch trust score for ${supplier._id}:`, err);
				scores[supplier._id] = { score: "-", risk: "N/A" };
			}
		}
		setTrustScores(scores);
	};

	useEffect(() => {
		fetchSuppliers();
	}, []);

	const handleAdd = async () => {
		await addSupplier({ ...form, address: form.address || "N/A" });
		setForm({ name: "", licenseNumber: "", phone: "", email: "", address: "" });
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

	const handleDelete = async (id) => {
		if (!window.confirm("Move to recycle bin?")) return;
		try {
			const response = await API.delete(`/supplier/${id}`);
			console.log("Delete response:", response.data);
			await fetchSuppliers();
			alert("Supplier moved to recycle bin successfully!");
		} catch (err) {
			console.error("Delete failed:", err);
			alert("Failed to delete supplier: " + (err.response?.data?.detail || err.message));
		}
	};

	return (
		<Layout>
			<h1 className="text-2xl font-bold mb-6">Supplier Management</h1>

			<button
				onClick={() => setRecycleBinOpen(true)}
				className="mb-4 bg-gray-600 text-white px-4 py-2 rounded"
			>
				♻ Recycle Bin
			</button>

			<div className="bg-white p-4 rounded shadow mb-6">
				<h2 className="font-semibold mb-3">Add Supplier</h2>

				<div className="grid grid-cols-5 gap-4">
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
					<input
						placeholder="Address"
						className="border p-2"
						value={form.address}
						onChange={(e) => setForm({ ...form, address: e.target.value })}
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
							<th>Trust Score</th>
							<th>Risk Level</th>
							<th>Actions</th>
						</tr>
					</thead>

					<tbody>
						{suppliers.map((s) => {
							const trust = trustScores[s._id] || { score: "...", risk: "..." };
							const getRiskColor = (risk) => {
								if (risk === "LOW") return "text-green-600";
								if (risk === "MEDIUM") return "text-yellow-600";
								if (risk === "HIGH") return "text-red-600";
								return "text-gray-500";
							};

							return (
								<tr key={s._id} className="border-t">
									<td className="p-2">{s.name}</td>
									<td>{s.license_number || s.licenseNumber || "-"}</td>
									<td>
										{s.blacklisted ? (
											<span className="text-red-600">Blacklisted</span>
										) : s.verified ? (
											<span className="text-green-600">Verified</span>
										) : (
											<span className="text-yellow-600">Pending</span>
										)}
									</td>
									<td className="font-semibold">{trust.score}</td>
									<td className={`font-semibold ${getRiskColor(trust.risk)}`}>
										{trust.risk}
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

										<button
											onClick={() => handleDelete(s._id)}
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
				module="supplier"
				open={recycleBinOpen}
				onClose={() => {
					setRecycleBinOpen(false);
					fetchSuppliers();
				}}
				onUpdate={fetchSuppliers}
			/>
		</Layout>
	);
}
