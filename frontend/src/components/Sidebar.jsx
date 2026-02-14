import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Sidebar() {
	const navigate = useNavigate();
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

	const closeMobileMenu = () => {
		setIsMobileMenuOpen(false);
	};

	const NavSection = ({ title, icon, sectionKey, links }) => (
		<div className="mb-6">
			<button
				onClick={() => toggleSection(sectionKey)}
				className="w-full flex items-center justify-between px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-semibold text-sm transition"
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
							onClick={closeMobileMenu}
							className="block px-3 py-2 rounded hover:bg-gray-700 text-gray-300 hover:text-white text-sm transition"
						>
							{link.label}
						</Link>
					))}
				</div>
			)}
		</div>
	);

	const SidebarContent = () => (
		<>
			<div className="flex items-center justify-between mb-8">
				<h2 className="text-2xl font-bold text-green-400">🏥 MedGuard</h2>
				<button
					onClick={closeMobileMenu}
					className="lg:hidden text-white hover:text-gray-300 transition"
				>
					<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
					</svg>
				</button>
			</div>

			<nav className="flex flex-col gap-2 flex-1 overflow-y-auto">
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
		</>
	);

	return (
		<>
			{/* Mobile Hamburger Button */}
			<button
				onClick={() => setIsMobileMenuOpen(true)}
				className="lg:hidden fixed top-4 left-4 z-50 bg-gray-900 text-white p-3 rounded-lg shadow-lg hover:bg-gray-800 transition"
			>
				<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/>
				</svg>
			</button>

			{/* Mobile Backdrop */}
			{isMobileMenuOpen && (
				<div
					className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
					onClick={closeMobileMenu}
				/>
			)}

			{/* Sidebar - Mobile Drawer / Desktop Fixed */}
			<div
				className={`fixed lg:static inset-y-0 left-0 z-50 w-64 h-screen bg-gray-900 text-white p-5 flex flex-col 
					transform transition-transform duration-300 lg:transform-none 
					${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
			>
				<SidebarContent />
			</div>
		</>
	);
}
