import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { getAnomalies } from "../api/aiApi";
import { getSupplies } from "../api/supplyApi";

export default function AIInsights() {
	const [anomalies, setAnomalies] = useState([]);
	const [supplies, setSupplies] = useState([]);
	const [loading, setLoading] = useState(true);
	const [stats, setStats] = useState({
		total: 0,
		detected: 0
	});

	const fetchData = async () => {
		setLoading(true);
		try {
			// Fetch anomalies
			const anomalyRes = await getAnomalies();
			const anomalyData = anomalyRes.data;
			
			setStats({
				total: anomalyData.total_supplies || 0,
				detected: anomalyData.anomalies_detected || 0
			});

			// Fetch all supplies
			const suppliesRes = await getSupplies();
			const allSupplies = suppliesRes.data;

			// Filter anomalous supplies
			const anomalousSupplies = allSupplies.filter(s => 
				anomalyData.anomalies.includes(s._id)
			);

			setAnomalies(anomalousSupplies);
			setSupplies(allSupplies);
		} catch (err) {
			console.error("Failed to fetch AI data:", err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	const getTemperatureColor = (temp) => {
		if (temp < 2 || temp > 8) return "text-red-600 font-bold";
		return "text-green-600";
	};

	const getQuantityColor = (quantity) => {
		if (quantity > 1000) return "text-orange-600 font-bold";
		return "text-gray-700";
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

	return (
		<Layout>
			<div className="space-y-6">
				<h1 className="text-3xl font-bold text-gray-900">🤖 AI Insights</h1>

				{/* Stats Cards */}
				<div className="grid grid-cols-3 gap-6">
					<div className="bg-white p-6 rounded-lg shadow">
						<h3 className="text-gray-500 text-sm font-medium">Total Supplies</h3>
						<p className="text-3xl font-bold text-blue-600 mt-2">{stats.total}</p>
					</div>

					<div className="bg-white p-6 rounded-lg shadow">
						<h3 className="text-gray-500 text-sm font-medium">Anomalies Detected</h3>
						<p className="text-3xl font-bold text-red-600 mt-2">{stats.detected}</p>
					</div>

					<div className="bg-white p-6 rounded-lg shadow">
						<h3 className="text-gray-500 text-sm font-medium">Anomaly Rate</h3>
						<p className="text-3xl font-bold text-orange-600 mt-2">
							{stats.total > 0 ? ((stats.detected / stats.total) * 100).toFixed(1) : 0}%
						</p>
					</div>
				</div>

				{/* Anomaly Detection Info */}
				<div className="bg-blue-50 border-l-4 border-blue-500 p-4">
					<h3 className="font-semibold text-blue-900">🔍 What We Detect:</h3>
					<ul className="mt-2 space-y-1 text-sm text-blue-800">
						<li>🌡️ <strong>Abnormal Temperature:</strong> Outside safe range (2-8°C)</li>
						<li>📦 <strong>Abnormal Quantity:</strong> Unusual spikes or drops</li>
						<li>📊 <strong>Statistical Outliers:</strong> Patterns that deviate from supplier norms</li>
					</ul>
				</div>

				{/* Anomalous Supplies Table */}
				<div className="bg-white p-6 rounded-lg shadow">
					<h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
						<span className="text-red-600">🚨</span>
						Anomalous Supplies
					</h2>

					{stats.detected === 0 ? (
						<p className="text-gray-500 text-center py-8">
							✅ No anomalies detected. All supplies are within normal parameters.
						</p>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full border-collapse">
								<thead className="bg-gray-100">
									<tr>
										<th className="p-3 text-left">Batch Number</th>
										<th className="p-3 text-left">Temperature (°C)</th>
										<th className="p-3 text-left">Quantity</th>
										<th className="p-3 text-left">Status</th>
										<th className="p-3 text-left">Risk Flags</th>
									</tr>
								</thead>
								<tbody>
									{anomalies.map((supply) => (
										<tr key={supply._id} className="border-t hover:bg-gray-50">
											<td className="p-3 font-mono text-sm">{supply.batch_number}</td>
											<td className={`p-3 ${getTemperatureColor(supply.temperature)}`}>
												{supply.temperature}°C
												{(supply.temperature < 2 || supply.temperature > 8) && 
													<span className="ml-2 text-xs">⚠️</span>
												}
											</td>
											<td className={`p-3 ${getQuantityColor(supply.quantity)}`}>
												{supply.quantity}
												{supply.quantity > 1000 && 
													<span className="ml-2 text-xs">⚠️</span>
												}
											</td>
											<td className="p-3">
												<span className={`px-2 py-1 rounded text-xs font-semibold ${
													supply.compliance_status === "REJECTED" 
														? "bg-red-100 text-red-700"
														: supply.compliance_status === "APPROVED"
														? "bg-green-100 text-green-700"
														: "bg-yellow-100 text-yellow-700"
												}`}>
													{supply.compliance_status}
												</span>
											</td>
											<td className="p-3">
												{supply.risk_flags && supply.risk_flags.length > 0 ? (
													<div className="flex flex-wrap gap-1">
														{supply.risk_flags.map((flag, idx) => (
															<span 
																key={idx}
																className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs"
															>
																{flag}
															</span>
														))}
													</div>
												) : (
													<span className="text-gray-400 text-sm">None</span>
												)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>

				{/* Temperature Distribution */}
				<div className="bg-white p-6 rounded-lg shadow">
					<h2 className="text-xl font-semibold mb-4">📊 Temperature Distribution</h2>
					<div className="grid grid-cols-4 gap-4">
						{[
							{ label: "Critical Low (<2°C)", color: "bg-blue-600", count: supplies.filter(s => s.temperature < 2).length },
							{ label: "Normal (2-8°C)", color: "bg-green-600", count: supplies.filter(s => s.temperature >= 2 && s.temperature <= 8).length },
							{ label: "Warning (8-12°C)", color: "bg-yellow-600", count: supplies.filter(s => s.temperature > 8 && s.temperature <= 12).length },
							{ label: "Critical High (>12°C)", color: "bg-red-600", count: supplies.filter(s => s.temperature > 12).length }
						].map((range, idx) => (
							<div key={idx} className="text-center">
								<div className={`${range.color} text-white p-4 rounded-lg`}>
									<p className="text-3xl font-bold">{range.count}</p>
								</div>
								<p className="text-sm text-gray-600 mt-2">{range.label}</p>
							</div>
						))}
					</div>
				</div>

				{/* Refresh Button */}
				<div className="flex justify-center">
					<button
						onClick={fetchData}
						className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
					>
						🔄 Re-run Anomaly Detection
					</button>
				</div>
			</div>
		</Layout>
	);
}
