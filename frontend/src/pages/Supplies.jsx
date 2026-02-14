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
	const [loading, setLoading] = useState(true);
	const [showAddForm, setShowAddForm] = useState(false);

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
		setLoading(true);
		try {
			const sup = await getSuppliers();
			const med = await getMedicines();
			const suppliesRes = await getSupplies();
			setSuppliers(sup.data);
			setMedicines(med.data);
			setSupplies(suppliesRes.data);
		} catch (err) {
			console.error("Failed to fetch data:", err);
		} finally {
			setLoading(false);
		}
	};

	const handleSubmit = async () => {
		if (!form.medicineId || !form.supplierId || !form.batchNumber || !form.expiryDate || !form.quantity || !form.temperature) {
			alert("Please fill in all fields");
			return;
		}
		try {
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
			setForm({
				medicineId: "",
				supplierId: "",
				batchNumber: "",
				expiryDate: "",
				quantity: "",
				temperature: ""
			});
			setShowAddForm(false);
			const suppliesRes = await getSupplies();
			setSupplies(suppliesRes.data);
		} catch (err) {
			console.error("Failed to add supply:", err);
			alert("Failed to add supply");
		}
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

	const stats = useMemo(() => {
		const accepted = supplies.filter(s => s.compliance_status === "ACCEPTED").length;
		const rejected = supplies.filter(s => s.compliance_status === "REJECTED").length;
		const suspicious = supplies.filter(s => ["SUSPICIOUS", "FAKE"].includes(s.fake_status)).length;
		return { accepted, rejected, suspicious, total: supplies.length };
	}, [supplies]);

	if (loading) {
		return (
			<Layout>
				<div className="flex items-center justify-center h-screen">
					<div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-600"></div>
				</div>
			</Layout>
		);
	}

	return (
		<Layout>
			{/* Header Section */}
			<div className="mb-8">
				<div className="bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 rounded-2xl p-8 shadow-xl">
					<div className="flex flex-col md:flex-row md:items-center md:justify-between">
						<div>
							<h1 className="text-4xl font-bold text-white mb-2">Supply Chain Management</h1>
							<p className="text-orange-100 text-lg">Track and verify supply chain entries with compliance monitoring</p>
						</div>
						<div className="mt-4 md:mt-0 flex flex-wrap gap-3">
							<button
								onClick={() => setRecycleBinOpen(true)}
								className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center shadow-lg"
							>
								<svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
								</svg>
								Recycle Bin
							</button>
							<button
								onClick={() => setShowAddForm(!showAddForm)}
								className="bg-white hover:bg-gray-50 text-orange-600 px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center shadow-lg"
							>
								<svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
								</svg>
								Add Supply Entry
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
							<p className="text-gray-500 text-sm font-medium mb-1">Total Supplies</p>
							<p className="text-3xl font-bold text-gray-900">{stats.total}</p>
						</div>
						<div className="bg-blue-100 rounded-full p-4">
							<svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
							</svg>
						</div>
					</div>
				</div>
				<div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-gray-500 text-sm font-medium mb-1">Accepted</p>
							<p className="text-3xl font-bold text-green-600">{stats.accepted}</p>
						</div>
						<div className="bg-green-100 rounded-full p-4">
							<svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
							</svg>
						</div>
					</div>
				</div>
				<div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-gray-500 text-sm font-medium mb-1">Rejected</p>
							<p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
						</div>
						<div className="bg-red-100 rounded-full p-4">
							<svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
							</svg>
						</div>
					</div>
				</div>
				<div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-gray-500 text-sm font-medium mb-1">Suspicious</p>
							<p className="text-3xl font-bold text-orange-600">{stats.suspicious}</p>
						</div>
						<div className="bg-orange-100 rounded-full p-4">
							<svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
							</svg>
						</div>
					</div>
				</div>
			</div>

			{/* Compliance Result Alert */}
			{result && (
				<div className={`mb-8 p-6 rounded-2xl shadow-xl border-2 flex items-start ${
					result === "ACCEPTED"
						? "bg-green-50 border-green-300"
						: result === "REJECTED"
							? "bg-red-50 border-red-300"
							: "bg-yellow-50 border-yellow-300"
				}`}>
					<div className={`rounded-full p-3 mr-4 ${
						result === "ACCEPTED" ? "bg-green-100" : result === "REJECTED" ? "bg-red-100" : "bg-yellow-100"
					}`}>
						<svg className={`w-8 h-8 ${
							result === "ACCEPTED" ? "text-green-600" : result === "REJECTED" ? "text-red-600" : "text-yellow-600"
						}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
							{result === "ACCEPTED" ? (
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
							) : (
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
							)}
						</svg>
					</div>
					<div>
						<h3 className={`text-xl font-bold mb-1 ${
							result === "ACCEPTED" ? "text-green-800" : result === "REJECTED" ? "text-red-800" : "text-yellow-800"
						}`}>
							Compliance Result: {result}
						</h3>
						<p className={`text-sm ${
							result === "ACCEPTED" ? "text-green-700" : result === "REJECTED" ? "text-red-700" : "text-yellow-700"
						}`}>
							{result === "ACCEPTED" 
								? "Supply entry has passed all compliance checks and can proceed."
								: result === "REJECTED"
									? "Supply entry has been rejected due to compliance violations."
									: "Supply entry is pending further verification."}
						</p>
					</div>
					<button
						onClick={() => setResult(null)}
						className="ml-auto text-gray-400 hover:text-gray-600"
					>
						<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
						</svg>
					</button>
				</div>
			)}

			{/* Add Supply Form */}
			{showAddForm && (
				<div className="bg-white rounded-2xl shadow-xl border border-gray-200 mb-8 overflow-hidden">
					<div className="bg-gradient-to-r from-orange-600 to-amber-600 px-6 py-4">
						<h2 className="text-xl font-bold text-white flex items-center">
							<svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
							</svg>
							New Supply Entry
						</h2>
					</div>
					<div className="p-6">
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-2">
									Medicine <span className="text-red-500">*</span>
								</label>
								<select
									className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
									value={form.medicineId}
									onChange={(e) => setForm({ ...form, medicineId: e.target.value })}
								>
									<option value="">Select Medicine</option>
									{medicines.map((m) => (
										<option key={m._id} value={m._id}>{m.name}</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-2">
									Supplier <span className="text-red-500">*</span>
								</label>
								<select
									className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
									value={form.supplierId}
									onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
								>
									<option value="">Select Supplier</option>
									{suppliers.map((s) => (
										<option key={s._id} value={s._id}>{s.name}</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-2">
									Batch Number <span className="text-red-500">*</span>
								</label>
								<input
									placeholder="Enter batch number"
									className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
									value={form.batchNumber}
									onChange={(e) => setForm({ ...form, batchNumber: e.target.value })}
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-2">
									Expiry Date <span className="text-red-500">*</span>
								</label>
								<input
									type="date"
									className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
									value={form.expiryDate}
									onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-2">
									Quantity <span className="text-red-500">*</span>
								</label>
								<input
									placeholder="Enter quantity"
									type="number"
									className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
									value={form.quantity}
									onChange={(e) => setForm({ ...form, quantity: e.target.value })}
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-2">
									Temperature (°C) <span className="text-red-500">*</span>
								</label>
								<input
									placeholder="Enter temperature"
									type="number"
									step="0.1"
									className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
									value={form.temperature}
									onChange={(e) => setForm({ ...form, temperature: e.target.value })}
								/>
							</div>
						</div>
						<div className="flex justify-end space-x-3">
							<button
								onClick={() => {
									setShowAddForm(false);
									setForm({
										medicineId: "",
										supplierId: "",
										batchNumber: "",
										expiryDate: "",
										quantity: "",
										temperature: ""
									});
								}}
								className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-all"
							>
								Cancel
							</button>
							<button
								onClick={handleSubmit}
								className="px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg font-semibold hover:from-orange-700 hover:to-amber-700 transition-all shadow-lg"
							>
								Submit Supply
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Supply Records Table */}
			<div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
				<div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4">
					<h2 className="text-xl font-bold text-white flex items-center">
						<svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
						</svg>
						Supply Records ({supplies.length})
					</h2>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full">
						<thead className="bg-gray-50 border-b-2 border-gray-200">
							<tr>
								<th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
									Batch Number
								</th>
								<th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
									Supplier
								</th>
								<th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
									Expiry Date
								</th>
								<th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
									Compliance
								</th>
								<th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
									Fake Status
								</th>
								<th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
									Risk Flags
								</th>
								<th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
									Actions
								</th>
							</tr>
						</thead>

						<tbody className="divide-y divide-gray-200">
							{supplies.length === 0 ? (
								<tr>
									<td colSpan="7" className="px-6 py-12 text-center">
										<div className="flex flex-col items-center justify-center text-gray-400">
											<svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
											</svg>
											<p className="text-lg font-semibold">No supply records found</p>
											<p className="text-sm">Add your first supply entry to get started</p>
										</div>
									</td>
								</tr>
							) : (
								supplies.map((supply) => {
									const supplier = supplierMap.get(supply.supplier_id);
									const isFake = ["SUSPICIOUS", "FAKE"].includes(supply.fake_status);

									return (
										<tr
											key={supply.id}
											className={`hover:bg-gray-50 transition-colors ${isFake ? "bg-red-50" : ""}`}
										>
											<td className="px-6 py-4">
												<div className="flex items-center">
													<div className="bg-orange-100 rounded-lg p-2 mr-3">
														<svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
														</svg>
													</div>
													<span className="text-sm font-bold text-gray-900">{supply.batch_number}</span>
												</div>
											</td>
											<td className="px-6 py-4 text-sm text-gray-900 font-medium">
												{supplier?.name || "Unknown"}
											</td>
											<td className="px-6 py-4 text-sm text-gray-900">
												{new Date(supply.expiry_date).toLocaleDateString()}
											</td>
											<td className="px-6 py-4">
												<span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
													supply.compliance_status === "ACCEPTED"
														? "bg-green-100 text-green-800 border border-green-200"
														: supply.compliance_status === "REJECTED"
															? "bg-red-100 text-red-800 border border-red-200"
															: "bg-yellow-100 text-yellow-800 border border-yellow-200"
												}`}>
													{supply.compliance_status}
												</span>
											</td>
											<td className="px-6 py-4">
												<span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
													isFake
														? "bg-red-100 text-red-800 border border-red-200"
														: "bg-gray-100 text-gray-800 border border-gray-200"
												}`}>
													{supply.fake_status || "GENUINE"}
												</span>
											</td>
											<td className="px-6 py-4 text-sm text-gray-900">
												{(supply.risk_flags || []).length > 0 ? (
													<div className="flex flex-wrap gap-1">
														{supply.risk_flags.map((flag, idx) => (
															<span key={idx} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200">
																{flag}
															</span>
														))}
													</div>
												) : (
													<span className="text-gray-400">None</span>
												)}
											</td>
											<td className="px-6 py-4 text-center">
												<button
													onClick={() => handleDelete(supply.id)}
													className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-all"
													title="Delete Supply"
												>
													<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
													</svg>
												</button>
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
