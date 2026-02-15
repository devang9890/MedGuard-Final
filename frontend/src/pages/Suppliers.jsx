import { useEffect, useState, useMemo } from "react";
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
	const [showAddForm, setShowAddForm] = useState(false);
	const [loading, setLoading] = useState(true);
	const [form, setForm] = useState({
		name: "",
		licenseNumber: "",
		phone: "",
		email: "",
		address: ""
	});

	const fetchSuppliers = async () => {
		setLoading(true);
		try {
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
		} catch (err) {
			console.error("Failed to fetch suppliers:", err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchSuppliers();
	}, []);

	const handleAdd = async () => {
		if (!form.name || !form.licenseNumber || !form.phone || !form.email) {
			alert("Please fill in all required fields");
			return;
		}
		try {
			await addSupplier({ ...form, address: form.address || "N/A" });
			setForm({ name: "", licenseNumber: "", phone: "", email: "", address: "" });
			setShowAddForm(false);
			fetchSuppliers();
		} catch (err) {
			console.error("Failed to add supplier:", err);
			alert("Failed to add supplier");
		}
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

	const getRiskColor = (risk) => {
		if (risk === "LOW") return "bg-green-100 text-green-800 border-green-200";
		if (risk === "MEDIUM") return "bg-yellow-100 text-yellow-800 border-yellow-200";
		if (risk === "HIGH") return "bg-red-100 text-red-800 border-red-200";
		return "bg-gray-100 text-gray-800 border-gray-200";
	};

	const getStatusBadge = (supplier) => {
		if (supplier.blacklisted) return { text: "Blacklisted", style: "bg-red-100 text-red-800 border border-red-200" };
		if (supplier.verified) return { text: "Verified", style: "bg-green-100 text-green-800 border border-green-200" };
		return { text: "Pending", style: "bg-yellow-100 text-yellow-800 border border-yellow-200" };
	};

	const stats = useMemo(() => {
		const verified = suppliers.filter(s => s.verified && !s.blacklisted).length;
		const blacklisted = suppliers.filter(s => s.blacklisted).length;
		const pending = suppliers.filter(s => !s.verified && !s.blacklisted).length;
		return { total: suppliers.length, verified, blacklisted, pending };
	}, [suppliers]);

	if (loading) {
		return (
			<Layout>
				<div className="flex items-center justify-center h-screen">
					<div className="flex flex-col items-center">
						<div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-600 mb-4"></div>
						<p className="text-gray-500 text-lg font-semibold">Loading suppliers...</p>
					</div>
				</div>
			</Layout>
		);
	}

	return (
		<Layout>
			{/* Header Section */}
			<div className="mb-8">
				<div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-2xl p-8 shadow-xl">
					<div className="flex flex-col md:flex-row md:items-center md:justify-between">
						<div>
							<h1 className="text-4xl font-bold text-white mb-2 flex items-center">
								<svg className="w-10 h-10 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
								</svg>
								Supplier Management
							</h1>
							<p className="text-purple-100 text-lg">Manage, verify, and monitor trusted pharmaceutical suppliers</p>
						</div>
						<div className="mt-4 md:mt-0 flex flex-wrap gap-3">
							<button
								onClick={() => setRecycleBinOpen(true)}
								className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center shadow-lg"
							>
								<svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
								</svg>
								Recycle Bin
							</button>
							<button
								onClick={() => setShowAddForm(!showAddForm)}
								className="bg-white hover:bg-gray-50 text-purple-600 px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center shadow-lg"
							>
								<svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
								</svg>
								Add Supplier
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Statistics Cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
				<div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-gray-500 text-sm font-medium mb-1">Total Suppliers</p>
							<p className="text-3xl font-bold text-gray-900">{stats.total}</p>
						</div>
						<div className="bg-blue-100 rounded-full p-4">
							<svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
							</svg>
						</div>
					</div>
				</div>
				<div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-gray-500 text-sm font-medium mb-1">Verified</p>
							<p className="text-3xl font-bold text-green-600">{stats.verified}</p>
						</div>
						<div className="bg-green-100 rounded-full p-4">
							<svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
							</svg>
						</div>
					</div>
				</div>
				<div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-gray-500 text-sm font-medium mb-1">Blacklisted</p>
							<p className="text-3xl font-bold text-red-600">{stats.blacklisted}</p>
						</div>
						<div className="bg-red-100 rounded-full p-4">
							<svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
							</svg>
						</div>
					</div>
				</div>
				<div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-gray-500 text-sm font-medium mb-1">Pending</p>
							<p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
						</div>
						<div className="bg-yellow-100 rounded-full p-4">
							<svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
					</div>
				</div>
			</div>

			{/* Add Supplier Form */}
			{showAddForm && (
				<div className="bg-white rounded-2xl shadow-xl border border-gray-200 mb-8 overflow-hidden">
					<div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
						<h2 className="text-xl font-bold text-white flex items-center">
							<svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							Add New Supplier
						</h2>
					</div>
					<div className="p-6">
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-2">
									Supplier Name <span className="text-red-500">*</span>
								</label>
								<input
									placeholder="Enter supplier name"
									className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
									value={form.name}
									onChange={(e) => setForm({ ...form, name: e.target.value })}
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-2">
									License Number <span className="text-red-500">*</span>
								</label>
								<input
									placeholder="Enter license number"
									className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
									value={form.licenseNumber}
									onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-2">
									Phone <span className="text-red-500">*</span>
								</label>
								<input
									placeholder="Enter phone number"
									className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
									value={form.phone}
									onChange={(e) => setForm({ ...form, phone: e.target.value })}
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-2">
									Email <span className="text-red-500">*</span>
								</label>
								<input
									placeholder="Enter email address"
									type="email"
									className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
									value={form.email}
									onChange={(e) => setForm({ ...form, email: e.target.value })}
								/>
							</div>
							<div className="lg:col-span-2">
								<label className="block text-sm font-semibold text-gray-700 mb-2">
									Address
								</label>
								<input
									placeholder="Enter address (optional)"
									className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
									value={form.address}
									onChange={(e) => setForm({ ...form, address: e.target.value })}
								/>
							</div>
						</div>
						<div className="flex justify-end space-x-3">
							<button
								onClick={() => {
									setShowAddForm(false);
									setForm({ name: "", licenseNumber: "", phone: "", email: "", address: "" });
								}}
								className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-all"
							>
								Cancel
							</button>
							<button
								onClick={handleAdd}
								className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg"
							>
								Add Supplier
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Suppliers Table */}
			<div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
				<div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4">
					<h2 className="text-xl font-bold text-white flex items-center">
						<svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
						</svg>
						All Suppliers ({suppliers.length})
					</h2>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full">
						<thead className="bg-gray-50 border-b-2 border-gray-200">
							<tr>
								<th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
									Supplier Name
								</th>
								<th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
									License
								</th>
								<th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
									Status
								</th>
								<th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
									Trust Score
								</th>
								<th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
									Risk Level
								</th>
								<th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
									Actions
								</th>
							</tr>
						</thead>

						<tbody className="divide-y divide-gray-200">
							{suppliers.length === 0 ? (
								<tr>
									<td colSpan="6" className="px-6 py-12 text-center">
										<div className="flex flex-col items-center justify-center text-gray-400">
											<svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
											</svg>
											<p className="text-lg font-semibold">No suppliers found</p>
											<p className="text-sm">Add your first supplier to get started</p>
										</div>
									</td>
								</tr>
							) : (
								suppliers.map((s) => {
									const trust = trustScores[s._id] || { score: "...", risk: "..." };
									const status = getStatusBadge(s);

									return (
										<tr key={s._id} className="hover:bg-gray-50 transition-colors">
											<td className="px-6 py-4">
												<div className="flex items-center">
													<div className={`rounded-lg p-2 mr-3 ${s.blacklisted ? "bg-red-100" : s.verified ? "bg-green-100" : "bg-yellow-100"
														}`}>
														<svg className={`w-5 h-5 ${s.blacklisted ? "text-red-600" : s.verified ? "text-green-600" : "text-yellow-600"
															}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
														</svg>
													</div>
													<div>
														<span className="text-sm font-bold text-gray-900">{s.name}</span>
														{s.email && (
															<p className="text-xs text-gray-500">{s.email}</p>
														)}
													</div>
												</div>
											</td>
											<td className="px-6 py-4">
												<span className="text-sm font-mono text-gray-900">{s.license_number || s.licenseNumber || "-"}</span>
											</td>
											<td className="px-6 py-4">
												<span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${status.style}`}>
													{status.text}
												</span>
											</td>
											<td className="px-6 py-4">
												<span className="text-lg font-bold text-gray-900">{trust.score}</span>
											</td>
											<td className="px-6 py-4">
												<span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${getRiskColor(trust.risk)}`}>
													{trust.risk}
												</span>
											</td>
											<td className="px-6 py-4">
												<div className="flex items-center justify-center gap-2">
													{!s.verified && !s.blacklisted && (
														<button
															onClick={() => handleVerify(s._id)}
															className="p-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-all"
															title="Verify Supplier"
														>
															<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
															</svg>
														</button>
													)}
													{!s.blacklisted && (
														<button
															onClick={() => handleBlacklist(s._id)}
															className="p-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg transition-all"
															title="Blacklist Supplier"
														>
															<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
															</svg>
														</button>
													)}
													<button
														onClick={() => handleDelete(s._id)}
														className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-all"
														title="Delete Supplier"
													>
														<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
														</svg>
													</button>
												</div>
											</td>
										</tr>
									);
								})
							)}
						</tbody>
					</table>
				</div>
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
