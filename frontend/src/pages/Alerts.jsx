import { useEffect, useState, useMemo } from "react";
import Layout from "../components/Layout";
import { getAlerts } from "../api/alertApi";

export default function Alerts() {
	const [alerts, setAlerts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [filterSeverity, setFilterSeverity] = useState("ALL");

	useEffect(() => {
		fetchAlerts();
	}, []);

	const fetchAlerts = async () => {
		setLoading(true);
		try {
			const res = await getAlerts();
			setAlerts(res.data);
		} catch (err) {
			console.error("Failed to fetch alerts:", err);
		} finally {
			setLoading(false);
		}
	};

	const getSeverityColor = (severity) => {
		if (severity === "HIGH") return "bg-red-500";
		if (severity === "MEDIUM") return "bg-yellow-500";
		return "bg-green-500";
	};

	const stats = useMemo(() => {
		const high = alerts.filter(a => a.severity === "HIGH").length;
		const medium = alerts.filter(a => a.severity === "MEDIUM").length;
		const low = alerts.filter(a => a.severity === "LOW").length;
		return { high, medium, low, total: alerts.length };
	}, [alerts]);

	const filteredAlerts = useMemo(() => {
		if (filterSeverity === "ALL") return alerts;
		return alerts.filter(a => a.severity === filterSeverity);
	}, [alerts, filterSeverity]);

	if (loading) {
		return (
			<Layout>
				<div className="flex items-center justify-center h-screen">
					<div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-600"></div>
				</div>
			</Layout>
		);
	}

	return (
		<Layout>
			{/* Header Section */}
			<div className="mb-8">
				<div className="bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 rounded-2xl p-8 shadow-xl">
					<div className="flex flex-col md:flex-row md:items-center md:justify-between">
						<div>
							<h1 className="text-4xl font-bold text-white mb-2">System Alerts</h1>
							<p className="text-red-100 text-lg">Real-time supply chain risk & compliance notifications</p>
						</div>
						<div className="mt-4 md:mt-0">
							<button
								onClick={fetchAlerts}
								className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center shadow-lg"
							>
								<svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
								</svg>
								Refresh
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
							<p className="text-gray-500 text-sm font-medium mb-1">Total Alerts</p>
							<p className="text-3xl font-bold text-gray-900">{stats.total}</p>
						</div>
						<div className="bg-blue-100 rounded-full p-4">
							<svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
							</svg>
						</div>
					</div>
				</div>
				<div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 cursor-pointer hover:shadow-xl transition-all" onClick={() => setFilterSeverity(filterSeverity === "HIGH" ? "ALL" : "HIGH")}>
					<div className="flex items-center justify-between">
						<div>
							<p className="text-gray-500 text-sm font-medium mb-1">High Severity</p>
							<p className="text-3xl font-bold text-red-600">{stats.high}</p>
						</div>
						<div className="bg-red-100 rounded-full p-4">
							<svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
							</svg>
						</div>
					</div>
				</div>
				<div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 cursor-pointer hover:shadow-xl transition-all" onClick={() => setFilterSeverity(filterSeverity === "MEDIUM" ? "ALL" : "MEDIUM")}>
					<div className="flex items-center justify-between">
						<div>
							<p className="text-gray-500 text-sm font-medium mb-1">Medium Severity</p>
							<p className="text-3xl font-bold text-yellow-600">{stats.medium}</p>
						</div>
						<div className="bg-yellow-100 rounded-full p-4">
							<svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
							</svg>
						</div>
					</div>
				</div>
				<div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 cursor-pointer hover:shadow-xl transition-all" onClick={() => setFilterSeverity(filterSeverity === "LOW" ? "ALL" : "LOW")}>
					<div className="flex items-center justify-between">
						<div>
							<p className="text-gray-500 text-sm font-medium mb-1">Low Severity</p>
							<p className="text-3xl font-bold text-green-600">{stats.low}</p>
						</div>
						<div className="bg-green-100 rounded-full p-4">
							<svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
							</svg>
						</div>
					</div>
				</div>
			</div>

			{/* Filter Bar */}
			<div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 mb-8">
				<div className="flex flex-wrap items-center gap-3">
					<span className="text-sm font-semibold text-gray-700">Filter by Severity:</span>
					{["ALL", "HIGH", "MEDIUM", "LOW"].map(severity => (
						<button
							key={severity}
							onClick={() => setFilterSeverity(severity)}
							className={`px-4 py-2 rounded-lg font-semibold transition-all ${
								filterSeverity === severity
									? severity === "HIGH"
										? "bg-red-600 text-white"
										: severity === "MEDIUM"
											? "bg-yellow-500 text-white"
											: severity === "LOW"
												? "bg-green-600 text-white"
												: "bg-blue-600 text-white"
									: "bg-gray-100 text-gray-700 hover:bg-gray-200"
							}`}
						>
							{severity}
						</button>
					))}
				</div>
			</div>

			{/* Alerts Table */}
			<div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
				<div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4">
					<h2 className="text-xl font-bold text-white flex items-center">
						<svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
						</svg>
						Alert Notifications ({filteredAlerts.length})
					</h2>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full">
						<thead className="bg-gray-50 border-b-2 border-gray-200">
							<tr>
								<th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
									Supply ID
								</th>
								<th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
									Alert Message
								</th>
								<th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
									Severity
								</th>
								<th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
									Date
								</th>
							</tr>
						</thead>

						<tbody className="divide-y divide-gray-200">
							{filteredAlerts.length === 0 ? (
								<tr>
									<td colSpan="4" className="px-6 py-12 text-center">
										<div className="flex flex-col items-center justify-center text-gray-400">
											<svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
											</svg>
											<p className="text-lg font-semibold">No alerts found</p>
											<p className="text-sm">
												{filterSeverity !== "ALL" 
													? `No ${filterSeverity.toLowerCase()} severity alerts`
													: "System is running smoothly"}
											</p>
										</div>
									</td>
								</tr>
							) : (
								filteredAlerts.map((alert) => (
									<tr key={alert._id} className="hover:bg-gray-50 transition-colors">
										<td className="px-6 py-4">
											<div className="flex items-center">
												<div className={`rounded-lg p-2 mr-3 ${
													alert.severity === "HIGH" ? "bg-red-100" : alert.severity === "MEDIUM" ? "bg-yellow-100" : "bg-green-100"
												}`}>
													<svg className={`w-5 h-5 ${
														alert.severity === "HIGH" ? "text-red-600" : alert.severity === "MEDIUM" ? "text-yellow-600" : "text-green-600"
													}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 1 0 010 2.828l-7 7a2 1 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
													</svg>
												</div>
												<span className="text-sm font-mono text-gray-900">{alert.supply_id}</span>
											</div>
										</td>
										<td className="px-6 py-4">
											<p className="text-sm text-gray-900 font-medium">{alert.message}</p>
										</td>
										<td className="px-6 py-4">
											<span
												className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold text-white ${getSeverityColor(alert.severity)}`}
											>
												{alert.severity === "HIGH" && (
													<svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
														<path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
													</svg>
												)}
												{alert.severity}
											</span>
										</td>
										<td className="px-6 py-4 text-sm text-gray-900">
											<div className="flex items-center">
												<svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
												</svg>
												{new Date(alert.created_at).toLocaleDateString()}
											</div>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>
		</Layout>
	);
}
