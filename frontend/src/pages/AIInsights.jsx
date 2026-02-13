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
				<div className="flex items-center justify-center h-64">
					<p className="text-gray-500">Loading AI analysis...</p>
				</div>
			</Layout>
		);
	}

	if (error) {
		return (
			<Layout>
				<div className="bg-red-50 border border-red-200 p-6 rounded-lg">
					<p className="text-red-600 mb-4">{error}</p>
					<button
						onClick={fetchInsights}
						className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
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
				<div className="text-center p-8">No data available</div>
			</Layout>
		);
	}

	return (
		<Layout>
			<div className="space-y-6">
				<h1 className="text-3xl font-bold text-gray-900">🤖 AI Insights Dashboard</h1>
				<p className="text-gray-600">Real-time intelligence across your supply chain</p>

				{/* Summary Cards */}
				<div className="grid grid-cols-2 md:grid-cols-6 gap-4">
					<div className="bg-red-50 p-4 rounded-lg border border-red-200">
						<div className="text-2xl font-bold text-red-600">{data.summary.total_high_risk}</div>
						<div className="text-xs text-red-700 mt-1">High Risk Suppliers</div>
					</div>
					<div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
						<div className="text-2xl font-bold text-orange-600">{data.summary.total_fake}</div>
						<div className="text-xs text-orange-700 mt-1">Fake Medicines</div>
					</div>
					<div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
						<div className="text-2xl font-bold text-yellow-600">{data.summary.total_anomalies}</div>
						<div className="text-xs text-yellow-700 mt-1">Anomalies</div>
					</div>
					<div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
						<div className="text-2xl font-bold text-purple-600">{data.summary.total_corruption}</div>
						<div className="text-xs text-purple-700 mt-1">Corruption Flags</div>
					</div>
					<div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
						<div className="text-2xl font-bold text-blue-600">{data.summary.total_priority}</div>
						<div className="text-xs text-blue-700 mt-1">Priority Items</div>
					</div>
					<div className="bg-green-50 p-4 rounded-lg border border-green-200">
						<div className="text-2xl font-bold text-green-600">{data.summary.total_alerts}</div>
						<div className="text-xs text-green-700 mt-1">Recent Alerts</div>
					</div>
				</div>

				{/* High Risk Suppliers */}
				<div className="bg-white rounded-lg shadow">
					<div className="p-6 border-b border-gray-200">
						<h2 className="text-xl font-bold text-gray-900">🚨 High Risk Suppliers</h2>
					</div>
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead className="bg-gray-50 border-b border-gray-200">
								<tr>
									<th className="px-6 py-3 text-left font-semibold text-gray-700">Supplier</th>
									<th className="px-6 py-3 text-left font-semibold text-gray-700">Trust Score</th>
									<th className="px-6 py-3 text-left font-semibold text-gray-700">Risk Level</th>
									<th className="px-6 py-3 text-left font-semibold text-gray-700">Rejection Rate</th>
									<th className="px-6 py-3 text-left font-semibold text-gray-700">Fake Rate</th>
								</tr>
							</thead>
							<tbody>
								{data.high_risk_suppliers && data.high_risk_suppliers.length > 0 ? (
									data.high_risk_suppliers.map((supplier) => (
										<tr key={supplier.supplier_id} className="border-b border-gray-200 hover:bg-gray-50">
											<td className="px-6 py-4 text-gray-900 font-medium">{supplier.name}</td>
											<td className="px-6 py-4">
												<span className="text-lg font-bold text-gray-900">{supplier.trust_score.toFixed(1)}</span>
											</td>
											<td className="px-6 py-4">
												<span
													className={`px-3 py-1 rounded-full text-xs font-semibold ${
														supplier.risk_level === "HIGH"
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
										<td colSpan="5" className="px-6 py-8 text-center text-gray-500">
											No high-risk suppliers detected
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</div>

				{/* Fake Medicines */}
				<div className="bg-white rounded-lg shadow">
					<div className="p-6 border-b border-gray-200">
						<h2 className="text-xl font-bold text-gray-900">⚠️ Fake Medicine Cases</h2>
					</div>
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead className="bg-gray-50 border-b border-gray-200">
								<tr>
									<th className="px-6 py-3 text-left font-semibold text-gray-700">Medicine</th>
									<th className="px-6 py-3 text-left font-semibold text-gray-700">Supplier</th>
									<th className="px-6 py-3 text-left font-semibold text-gray-700">Batch</th>
									<th className="px-6 py-3 text-left font-semibold text-gray-700">Detected</th>
								</tr>
							</thead>
							<tbody>
								{data.fake_medicines && data.fake_medicines.length > 0 ? (
									data.fake_medicines.map((fake) => (
										<tr key={fake.supply_id} className="border-b border-gray-200 hover:bg-gray-50">
											<td className="px-6 py-4 text-gray-900 font-medium">{fake.medicine_name}</td>
											<td className="px-6 py-4 text-gray-900">{fake.supplier_name}</td>
											<td className="px-6 py-4 text-gray-700">{fake.batch_number || "N/A"}</td>
											<td className="px-6 py-4 text-gray-600 text-xs">
												{new Date(fake.detected_at).toLocaleString()}
											</td>
										</tr>
									))
								) : (
									<tr>
										<td colSpan="4" className="px-6 py-8 text-center text-gray-500">
											No fake medicines detected
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</div>

				{/* Anomalies */}
				<div className="bg-white rounded-lg shadow">
					<div className="p-6 border-b border-gray-200">
						<h2 className="text-xl font-bold text-gray-900">🔍 Anomaly Signals</h2>
					</div>
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead className="bg-gray-50 border-b border-gray-200">
								<tr>
									<th className="px-6 py-3 text-left font-semibold text-gray-700">Medicine</th>
									<th className="px-6 py-3 text-left font-semibold text-gray-700">Temperature</th>
									<th className="px-6 py-3 text-left font-semibold text-gray-700">Quantity</th>
									<th className="px-6 py-3 text-left font-semibold text-gray-700">Detected</th>
								</tr>
							</thead>
							<tbody>
								{data.anomalies && data.anomalies.length > 0 ? (
									data.anomalies.map((anomaly) => (
										<tr key={anomaly.supply_id} className="border-b border-gray-200 hover:bg-gray-50">
											<td className="px-6 py-4 text-gray-900 font-medium">{anomaly.medicine}</td>
											<td className="px-6 py-4 text-gray-900">{anomaly.temperature}°C</td>
											<td className="px-6 py-4 text-gray-900">{anomaly.quantity} units</td>
											<td className="px-6 py-4 text-gray-600 text-xs">
												{new Date(anomaly.detected_at).toLocaleString()}
											</td>
										</tr>
									))
								) : (
									<tr>
										<td colSpan="4" className="px-6 py-8 text-center text-gray-500">
											No anomalies detected
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</div>

				{/* Corruption Alerts */}
				<div className="bg-white rounded-lg shadow">
					<div className="p-6 border-b border-gray-200">
						<h2 className="text-xl font-bold text-gray-900">🔴 Corruption Alerts</h2>
					</div>
					<div className="space-y-3 p-6">
						{data.corruption_flags && data.corruption_flags.length > 0 ? (
							data.corruption_flags.map((flag, idx) => (
								<div
									key={idx}
									className={`p-4 rounded-lg border-l-4 ${
										flag.severity === "CRITICAL"
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
											className={`px-3 py-1 rounded text-xs font-semibold whitespace-nowrap ml-4 ${
												flag.severity === "CRITICAL"
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
							<div className="text-center text-gray-500 py-8">No corruption flags detected</div>
						)}
					</div>
				</div>

				{/* Priority Usage */}
				<div className="bg-white rounded-lg shadow">
					<div className="p-6 border-b border-gray-200">
						<h2 className="text-xl font-bold text-gray-900">⏰ Priority Usage Recommendations</h2>
					</div>
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead className="bg-gray-50 border-b border-gray-200">
								<tr>
									<th className="px-6 py-3 text-left font-semibold text-gray-700">Medicine</th>
									<th className="px-6 py-3 text-left font-semibold text-gray-700">Priority</th>
									<th className="px-6 py-3 text-left font-semibold text-gray-700">Score</th>
									<th className="px-6 py-3 text-left font-semibold text-gray-700">Days to Expiry</th>
									<th className="px-6 py-3 text-left font-semibold text-gray-700">Reason</th>
								</tr>
							</thead>
							<tbody>
								{data.priority_usage && data.priority_usage.length > 0 ? (
									data.priority_usage.map((item) => (
										<tr key={item.supply_id} className="border-b border-gray-200 hover:bg-gray-50">
											<td className="px-6 py-4 text-gray-900 font-medium">{item.medicine}</td>
											<td className="px-6 py-4">
												<span
													className={`px-3 py-1 rounded-full text-xs font-semibold ${
														item.priority === "USE_IMMEDIATELY"
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
										<td colSpan="5" className="px-6 py-8 text-center text-gray-500">
											No priority items currently
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</div>

				{/* Live Alerts Feed */}
				<div className="bg-white rounded-lg shadow">
					<div className="p-6 border-b border-gray-200">
						<h2 className="text-xl font-bold text-gray-900">📢 Live Alerts Feed</h2>
					</div>
					<div className="divide-y divide-gray-200">
						{data.alerts && data.alerts.length > 0 ? (
							data.alerts.map((alert) => (
								<div key={alert.alert_id} className="p-4 hover:bg-gray-50 flex items-start justify-between">
									<div className="flex-1">
										<p className="text-gray-900 font-medium">{alert.message}</p>
										<p className="text-xs text-gray-500 mt-1">
											{new Date(alert.created_at).toLocaleString()}
										</p>
									</div>
									<span
										className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-4 ${
											alert.severity === "CRITICAL"
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
							<div className="p-8 text-center text-gray-500">No alerts at this time</div>
						)}
					</div>
				</div>

				{/* Refresh Button */}
				<div className="flex justify-center mb-8">
					<button
						onClick={fetchInsights}
						className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
					>
						🔄 Refresh Insights
					</button>
				</div>
			</div>
		</Layout>
	);
}
