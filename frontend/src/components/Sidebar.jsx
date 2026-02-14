import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Sidebar() {
	const navigate = useNavigate();

	// Initialize state from localStorage using lazy initializer
	const [expandedSections, setExpandedSections] = useState(() => {
		try {
			const saved = localStorage.getItem("sidebarState");
			return saved ? JSON.parse(saved) : {
				admin: true,
				intelligence: false,
				national: false,
				public: false
			};
		} catch (err) {
			console.error("Failed to load sidebar state:", err);
			return {
				admin: true,
				intelligence: false,
				national: false,
				public: false
			};
		}
	});

	// Save sidebar state to localStorage whenever it changes
	useEffect(() => {
		localStorage.setItem("sidebarState", JSON.stringify(expandedSections));
	}, [expandedSections]);

	const handleLogout = () => {
		localStorage.removeItem("token");
		localStorage.removeItem("user");
		localStorage.removeItem("sidebarState");
		navigate("/login");
	};

	const toggleSection = (section) => {
		setExpandedSections(prev => ({
			...prev,
			[section]: !prev[section]
		}));
	};

	const NavSection = ({ title, icon, sectionKey, links }) => (
		<div className="mb-6">
			<button
				onClick={() => toggleSection(sectionKey)}
				className="w-full flex items-center justify-between px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-semibold text-sm transiton"
			>
				<span className="flex items-center gap-2">
					<span>{icon}</span>
					{title}
				</span>
				<span className={`transform transition-transform ${expandedSections[sectionKey] ? 'rotate-180' : ''}`}>
					▼
				</span>
			</button>
			{expandedSections[sectionKey] && (
				<div className="mt-2 space-y-1 pl-4">
					{links.map((link, idx) => (
						<Link
							key={idx}
							to={link.path}
							className="block px-3 py-2 rounded hover:bg-gray-700 text-gray-300 hover:text-white text-sm transition"
						>
							{link.label}
						</Link>
					))}
				</div>
			)}
		</div>
	);

	return (
		<div className="w-64 h-screen bg-gray-900 text-white p-5 flex flex-col overflow-y-auto">
			<h2 className="text-2xl font-bold mb-8 text-green-400">🏥 MedGuard</h2>

			<nav className="flex flex-col gap-2 flex-1">
				{/* Admin Section */}
				<NavSection
					title="ADMIN"
					icon="👤"
					sectionKey="admin"
					links={[
						{ label: "📊 Dashboard", path: "/admin" },
						{ label: "🏭 Suppliers", path: "/suppliers" },
						{ label: "💊 Medicines", path: "/medicines" },
						{ label: "📦 Supplies", path: "/supplies" }
					]}
				/>

				{/* Intelligence Section */}
				<NavSection
					title="INTELLIGENCE"
					icon="🤖"
					sectionKey="intelligence"
					links={[
						{ label: "🧠 Intelligence Hub", path: "/intelligence" },
						{ label: "🔍 Corruption Alerts", path: "/corruption" },
						{ label: "⭐ Trust Scores", path: "/trust" },
						{ label: "💡 AI Insights", path: "/ai-insights" }
					]}
				/>

				{/* National Section */}
				<NavSection
					title="NATIONAL"
					icon="🌍"
					sectionKey="national"
					links={[
						{ label: "📍 National Monitor", path: "/national" },
						{ label: "🗺️ Risk Map", path: "/national-map" },
						{ label: "🔔 Alerts", path: "/alerts" },
						{ label: "⚡ Priority", path: "/priority" }
					]}
				/>

				{/* Public Section */}
				<NavSection
					title="PUBLIC"
					icon="👥"
					sectionKey="public"
					links={[
						{ label: "🏠 Public Hub", path: "/public" },
						{ label: "🔎 Verify Medicine", path: "/public-verify" },
						{ label: "📱 Scan Barcode", path: "/scan" }
					]}
				/>
			</nav>

			<button
				onClick={handleLogout}
				className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded font-medium transition mt-auto"
			>
				🚪 Logout
			</button>
		</div>
	);
}
