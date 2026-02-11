export default function Navbar() {
	return (
		<div className="bg-white shadow px-6 py-4 flex justify-between">
			<h1 className="font-bold text-lg">Hospital Compliance Panel</h1>

			<div className="flex gap-4">
				<span className="bg-red-500 text-white px-3 py-1 rounded">
					Alerts
				</span>
				<span>Admin</span>
			</div>
		</div>
	);
}
