import { Link, useNavigate } from "react-router-dom";

export default function Sidebar() {
	const navigate = useNavigate();

	const handleLogout = () => {
		localStorage.removeItem("token");
		localStorage.removeItem("user");
		navigate("/login");
	};

	return (
		<div className="w-64 h-screen bg-gray-900 text-white p-5 flex flex-col">
			<h2 className="text-xl font-bold mb-8">MedGuard</h2>

			<nav className="flex flex-col gap-4 flex-1">
				<Link to="/dashboard" className="hover:text-green-400">Dashboard</Link>
				<Link to="/scan" className="hover:text-green-400">📱 Scan Medicine</Link>
				<Link to="/suppliers" className="hover:text-green-400">Suppliers</Link>
				<Link to="/medicines" className="hover:text-green-400">Medicines</Link>
				<Link to="/supplies" className="hover:text-green-400">Supplies</Link>
				<Link to="/alerts" className="hover:text-green-400">Alerts</Link>
				<Link to="/national-map" className="hover:text-green-400">National Map</Link>
				<Link to="/ai-insights" className="hover:text-green-400">🤖 AI Insights</Link>
				<Link to="/priority" className="hover:text-green-400">Usage Priority</Link>
				<Link to="/trust" className="hover:text-green-400">Trust Score</Link>
				<Link to="/corruption" className="hover:text-green-400">Corruption</Link>
			</nav>

			<button
				onClick={handleLogout}
				className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded font-medium"
			>
				Logout
			</button>
		</div>
	);
}
