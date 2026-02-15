import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { getAIInsights } from "../api/aiInsightsApi";

export default function AIInsights() {
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		fetchInsights();
	}, []);

	const fetchInsights = async () => {
		try {
			setLoading(true);
			setError(null);
			const insights = await getAIInsights();
			setData(insights);
		} catch (err) {
			console.error("Failed to load AI insights:", err);
			setError("Failed to load AI insights. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return (
			<Layout>
				<div className="flex items-center justify-center h-screen">
					<div className="flex flex-col items-center">
						<div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-violet-600 mb-4"></div>
						<p className="text-gray-500 text-lg font-semibold">Loading AI analysis...</p>
					</div>
				</div>
			</Layout>
		);
	}

	if (error) {
		return (
			<Layout>
				<div className="bg-red-50 border border-red-200 p-8 rounded-2xl shadow-xl">
					<div className="flex items-center mb-4">
						<svg className="w-8 h-8 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
						</svg>
						<p className="text-red-700 text-lg font-semibold">{error}</p>
					</div>
					<button
						onClick={fetchInsights}
						className="px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-semibold hover:from-red-700 hover:to-rose-700 transition-all shadow-lg"
					>
						Try Again
					</button>
				</div>
			</Layout>
		);
	}

	if (!data) {
		return (
			<Layout>
				<div className="text-center p-8 text-gray-500">No data available</div>
			</Layout>
		);
	}

	return (
		<Layout>
			{/* Header Section */}
			<div className="mb-8">
				<div className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 rounded-2xl p-8 shadow-xl">
					<div className="flex flex-col md:flex-row md:items-center md:justify-between">
						<div>
							<h1 className="text-4xl font-bold text-white mb-2 flex items-center">
								<svg className="w-10 h-10 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
								</svg>
								AI Insights Dashboard
							</h1>
							<p className="text-purple-100 text-lg">Real-time intelligence across your supply chain</p>
						</div>
						<div className="mt-4 md:mt-0">
							<button
								onClick={fetchInsights}
								className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center shadow-lg"
							>
								<svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
								</svg>
								Refresh Insights
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Summary Cards */}
			<div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
				<div className="bg-white rounded-xl p-5 shadow-lg border border-gray-100">
					<div className="flex items-center mb-3">
						<div className="bg-red-100 rounded-full p-2 mr-3">
							<svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
							</svg>
						</div>
					</div>
					<p className="text-2xl font-bold text-red-600">{data.summary.total_high_risk}</p>
					<p className="text-xs text-gray-500 font-medium mt-1">High Risk Suppliers</p>
				</div>
				<div className="bg-white rounded-xl p-5 shadow-lg border border-gray-100">
					<div className="flex items-center mb-3">
						<div className="bg-orange-100 rounded-full p-2 mr-3">
							<svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
					</div>
					<p className="text-2xl font-bold text-orange-600">{data.summary.total_fake}</p>
					<p className="text-xs text-gray-500 font-medium mt-1">Fake Medicines</p>
				</div>
				<div className="bg-white rounded-xl p-5 shadow-lg border border-gray-100">
					<div className="flex items-center mb-3">
						<div className="bg-yellow-100 rounded-full p-2 mr-3">
							<svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
							</svg>
						</div>
					</div>
					<p className="text-2xl font-bold text-yellow-600">{data.summary.total_anomalies}</p>
					<p className="text-xs text-gray-500 font-medium mt-1">Anomalies</p>
				</div>
				<div className="bg-white rounded-xl p-5 shadow-lg border border-gray-100">
					<div className="flex items-center mb-3">
						<div className="bg-purple-100 rounded-full p-2 mr-3">
							<svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
							</svg>
						</div>
					</div>
					<p className="text-2xl font-bold text-purple-600">{data.summary.total_corruption}</p>
					<p className="text-xs text-gray-500 font-medium mt-1">Corruption Flags</p>
				</div>
				<div className="bg-white rounded-xl p-5 shadow-lg border border-gray-100">
					<div className="flex items-center mb-3">
						<div className="bg-blue-100 rounded-full p-2 mr-3">
							<svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
					</div>
					<p className="text-2xl font-bold text-blue-600">{data.summary.total_priority}</p>
					<p className="text-xs text-gray-500 font-medium mt-1">Priority Items</p>
				</div>
				<div className="bg-white rounded-xl p-5 shadow-lg border border-gray-100">
					<div className="flex items-center mb-3">
						<div className="bg-green-100 rounded-full p-2 mr-3">
							<svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
							</svg>
						</div>
					</div>
					<p className="text-2xl font-bold text-green-600">{data.summary.total_alerts}</p>
					<p className="text-xs text-gray-500 font-medium mt-1">Recent Alerts</p>
				</div>
			</div>

			{/* High Risk Suppliers */}
			<div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-8">
				<div className="bg-gradient-to-r from-red-600 to-rose-600 px-6 py-4">
					<h2 className="text-xl font-bold text-white flex items-center">
						<svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
						</svg>
						High Risk Suppliers
					</h2>
				</div>
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead className="bg-gray-50 border-b-2 border-gray-200">
							<tr>
								<th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Supplier</th>
								<th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Trust Score</th>
								<th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Risk Level</th>
								<th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Rejection Rate</th>
								<th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Fake Rate</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-200">
							{data.high_risk_suppliers && data.high_risk_suppliers.length > 0 ? (
								data.high_risk_suppliers.map((supplier) => (
									<tr key={supplier.supplier_id} className="hover:bg-gray-50 transition-colors">
										<td className="px-6 py-4 text-gray-900 font-medium">{supplier.name}</td>
										<td className="px-6 py-4">
											<span className="text-lg font-bold text-gray-900">{supplier.trust_score.toFixed(1)}</span>
										</td>
										<td className="px-6 py-4">
											<span
												className={`px-3 py-1 rounded-full text-xs font-semibold ${supplier.risk_level === "HIGH"
														? "bg-red-100 text-red-800"
														: "bg-yellow-100 text-yellow-800"
													}`}
											>
												{supplier.risk_level}
											</span>
										</td>
										<td className="px-6 py-4 text-gray-900">{(supplier.rejection_rate * 100).toFixed(1)}%</td>
										<td className="px-6 py-4 text-gray-900">{(supplier.fake_item_rate * 100).toFixed(1)}%</td>
									</tr>
								))
							) : (
								<tr>
									<td colSpan="5" className="px-6 py-12 text-center">
										<div className="flex flex-col items-center text-gray-400">
											<svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
											</svg>
											<p className="font-semibold">No high-risk suppliers detected</p>
										</div>
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* Fake Medicines */}
			<div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-8">
				<div className="bg-gradient-to-r from-orange-600 to-amber-600 px-6 py-4">
					<h2 className="text-xl font-bold text-white flex items-center">
						<svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						Fake Medicine Cases
					</h2>
				</div>
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead className="bg-gray-50 border-b-2 border-gray-200">
							<tr>
								<th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Medicine</th>
								<th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Supplier</th>
								<th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Batch</th>
								<th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Detected</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-200">
							{data.fake_medicines && data.fake_medicines.length > 0 ? (
								data.fake_medicines.map((fake) => (
									<tr key={fake.supply_id} className="hover:bg-gray-50 transition-colors">
										<td className="px-6 py-4 text-gray-900 font-medium">{fake.medicine_name}</td>
										<td className="px-6 py-4 text-gray-900">{fake.supplier_name}</td>
										<td className="px-6 py-4 text-gray-700 font-mono">{fake.batch_number || "N/A"}</td>
										<td className="px-6 py-4 text-gray-600 text-xs">{new Date(fake.detected_at).toLocaleString()}</td>
									</tr>
								))
							) : (
								<tr>
									<td colSpan="4" className="px-6 py-12 text-center">
										<div className="flex flex-col items-center text-gray-400">
											<svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
											</svg>
											<p className="font-semibold">No fake medicines detected</p>
										</div>
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* Anomalies */}
			<div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-8">
				<div className="bg-gradient-to-r from-yellow-600 to-amber-600 px-6 py-4">
					<h2 className="text-xl font-bold text-white flex items-center">
						<svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
						</svg>
						Anomaly Signals
					</h2>
				</div>
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead className="bg-gray-50 border-b-2 border-gray-200">
							<tr>
								<th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Medicine</th>
								<th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Temperature</th>
								<th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Quantity</th>
								<th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Detected</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-200">
							{data.anomalies && data.anomalies.length > 0 ? (
								data.anomalies.map((anomaly) => (
									<tr key={anomaly.supply_id} className="hover:bg-gray-50 transition-colors">
										<td className="px-6 py-4 text-gray-900 font-medium">{anomaly.medicine}</td>
										<td className="px-6 py-4 text-gray-900">{anomaly.temperature}°C</td>
										<td className="px-6 py-4 text-gray-900">{anomaly.quantity} units</td>
										<td className="px-6 py-4 text-gray-600 text-xs">{new Date(anomaly.detected_at).toLocaleString()}</td>
									</tr>
								))
							) : (
								<tr>
									<td colSpan="4" className="px-6 py-12 text-center">
										<div className="flex flex-col items-center text-gray-400">
											<svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
											</svg>
											<p className="font-semibold">No anomalies detected</p>
										</div>
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* Corruption Alerts */}
			<div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-8">
				<div className="bg-gradient-to-r from-rose-600 to-red-600 px-6 py-4">
					<h2 className="text-xl font-bold text-white flex items-center">
						<svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
						</svg>
						Corruption Alerts
					</h2>
				</div>
				<div className="p-6 space-y-3">
					{data.corruption_flags && data.corruption_flags.length > 0 ? (
						data.corruption_flags.map((flag, idx) => (
							<div
								key={idx}
								className={`p-4 rounded-xl border-l-4 ${flag.severity === "CRITICAL"
										? "bg-red-50 border-red-500"
										: flag.severity === "HIGH"
											? "bg-orange-50 border-orange-500"
											: "bg-yellow-50 border-yellow-500"
									}`}
							>
								<div className="flex justify-between items-start">
									<div>
										<h3 className="font-semibold text-gray-900">{flag.type}</h3>
										<p className="text-sm text-gray-700 mt-1">{flag.detail}</p>
										<p className="text-xs text-gray-600 mt-1">Supplier: {flag.supplier_name}</p>
									</div>
									<span
										className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-4 ${flag.severity === "CRITICAL"
												? "bg-red-200 text-red-800"
												: flag.severity === "HIGH"
													? "bg-orange-200 text-orange-800"
													: "bg-yellow-200 text-yellow-800"
											}`}
									>
										{flag.severity}
									</span>
								</div>
							</div>
						))
					) : (
						<div className="text-center py-12">
							<svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							<p className="text-gray-500 font-semibold">No corruption flags detected</p>
						</div>
					)}
				</div>
			</div>

			{/* Priority Usage */}
			<div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-8">
				<div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
					<h2 className="text-xl font-bold text-white flex items-center">
						<svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						Priority Usage Recommendations
					</h2>
				</div>
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead className="bg-gray-50 border-b-2 border-gray-200">
							<tr>
								<th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Medicine</th>
								<th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Priority</th>
								<th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Score</th>
								<th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Days to Expiry</th>
								<th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Reason</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-200">
							{data.priority_usage && data.priority_usage.length > 0 ? (
								data.priority_usage.map((item) => (
									<tr key={item.supply_id} className="hover:bg-gray-50 transition-colors">
										<td className="px-6 py-4 text-gray-900 font-medium">{item.medicine}</td>
										<td className="px-6 py-4">
											<span
												className={`px-3 py-1 rounded-full text-xs font-semibold ${item.priority === "USE_IMMEDIATELY"
														? "bg-red-100 text-red-800"
														: "bg-orange-100 text-orange-800"
													}`}
											>
												{item.priority}
											</span>
										</td>
										<td className="px-6 py-4 font-bold text-gray-900">{item.score}</td>
										<td className="px-6 py-4 text-gray-900">{item.days_to_expiry || "N/A"}</td>
										<td className="px-6 py-4 text-gray-600 text-xs">{item.reason}</td>
									</tr>
								))
							) : (
								<tr>
									<td colSpan="5" className="px-6 py-12 text-center">
										<div className="flex flex-col items-center text-gray-400">
											<svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
											</svg>
											<p className="font-semibold">No priority items currently</p>
										</div>
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* Live Alerts Feed */}
			<div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-8">
				<div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4">
					<h2 className="text-xl font-bold text-white flex items-center">
						<svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
						</svg>
						Live Alerts Feed
					</h2>
				</div>
				<div className="divide-y divide-gray-200">
					{data.alerts && data.alerts.length > 0 ? (
						data.alerts.map((alert) => (
							<div key={alert.alert_id} className="p-4 hover:bg-gray-50 transition-colors flex items-start justify-between">
								<div className="flex-1">
									<p className="text-gray-900 font-medium">{alert.message}</p>
									<p className="text-xs text-gray-500 mt-1">
										{new Date(alert.created_at).toLocaleString()}
									</p>
								</div>
								<span
									className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-4 ${alert.severity === "CRITICAL"
											? "bg-red-100 text-red-800"
											: alert.severity === "HIGH" || alert.severity === "WARNING"
												? "bg-yellow-100 text-yellow-800"
												: "bg-blue-100 text-blue-800"
										}`}
								>
									{alert.severity}
								</span>
							</div>
						))
					) : (
						<div className="p-12 text-center">
							<svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							<p className="text-gray-500 font-semibold">No alerts at this time</p>
						</div>
					)}
				</div>
			</div>
		</Layout>
	);
}
