import { Link } from "react-router-dom";

export default function Sidebar() {
	return (
		<div className="w-64 h-screen bg-gray-900 text-white p-5">
			<h2 className="text-xl font-bold mb-8">MedGuard</h2>

			<nav className="flex flex-col gap-4">
				<Link to="/" className="hover:text-green-400">Dashboard</Link>
				<Link to="/suppliers" className="hover:text-green-400">Suppliers</Link>
				<Link to="/medicines" className="hover:text-green-400">Medicines</Link>
				<Link to="/supplies" className="hover:text-green-400">Supplies</Link>
				<Link to="/alerts" className="hover:text-green-400">Alerts</Link>
				<Link to="/national-map" className="hover:text-green-400">National Map</Link>
				<Link to="/priority" className="hover:text-green-400">Usage Priority</Link>
				<Link to="/trust" className="hover:text-green-400">Trust Score</Link>
				<Link to="/corruption" className="hover:text-green-400">Corruption</Link>
			</nav>
		</div>
	);
}
