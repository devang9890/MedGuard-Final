import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { getAlerts } from "../api/alertApi";

export default function Alerts() {
	const [alerts, setAlerts] = useState([]);

	useEffect(() => {
		fetchAlerts();
	}, []);

	const fetchAlerts = async () => {
		const res = await getAlerts();
		setAlerts(res.data);
	};

	const getSeverityColor = (severity) => {
		if (severity === "HIGH") return "bg-red-500";
		if (severity === "MEDIUM") return "bg-yellow-500";
		return "bg-green-500";
	};

	return (
		<Layout>
			<h1 className="text-2xl font-bold mb-6">System Alerts</h1>

			<div className="bg-white p-4 rounded shadow">
				<table className="w-full border">
					<thead className="bg-gray-100">
						<tr>
							<th className="p-2">Type</th>
							<th>Message</th>
							<th>Severity</th>
							<th>Date</th>
						</tr>
					</thead>

					<tbody>
						{alerts.map((alert) => (
							<tr key={alert._id} className="border-t">
								<td className="p-2">{alert.type}</td>
								<td>{alert.message}</td>

								<td>
									<span
										className={`text-white px-3 py-1 rounded ${getSeverityColor(alert.severity)}`}
									>
										{alert.severity}
									</span>
								</td>

								<td>
									{new Date(alert.createdAt).toLocaleDateString()}
								</td>
							</tr>
						))}
					</tbody>
				</table>

				{alerts.length === 0 && (
					<p className="text-center text-gray-500 mt-6">
						No alerts generated yet
					</p>
				)}
			</div>
		</Layout>
	);
}
