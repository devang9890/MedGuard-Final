import { useTheme } from "../context/ThemeProvider";
import { useLocation } from "react-router-dom";

const pageTitles = {
	"/admin": "Dashboard",
	"/suppliers": "Suppliers",
	"/medicines": "Medicines",
	"/supplies": "Supply Chain",
	"/intelligence": "Intelligence Hub",
	"/corruption": "Corruption Detection",
	"/trust": "Trust Scores",
	"/ai-insights": "AI Insights",
	"/national": "National Monitor",
	"/national-map": "Risk Map",
	"/alerts": "Alert Center",
	"/priority": "Priority Queue",
	"/public": "Public Portal",
	"/public-verify": "Medicine Verify",
	"/scan": "Scan Medicine",
};

export default function Navbar() {
	const { theme, toggleTheme } = useTheme();
	const location = useLocation();
	const pageTitle = pageTitles[location.pathname] || "MedGuard";

	return (
		<header className="sticky top-0 z-30 h-12 flex items-center justify-between px-5 bg-[var(--bg-navbar)] backdrop-blur-xl border-b border-[var(--border-subtle)]">
			{/* Page title */}
			<div className="flex items-center gap-3">
				<h1 className="text-[15px] font-semibold text-[var(--text-primary)] tracking-tight">
					{pageTitle}
				</h1>
			</div>

			{/* Right actions */}
			<div className="flex items-center gap-2">
				{/* Theme toggle */}
				<button
					onClick={toggleTheme}
					className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-200"
					title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
					aria-label="Toggle theme"
				>
					{theme === "dark" ? (
						<svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
						</svg>
					) : (
						<svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
						</svg>
					)}
				</button>

				{/* Profile avatar placeholder */}
				<div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-blue-500/30 transition-all">
					<span className="text-[11px] font-bold text-white">A</span>
				</div>
			</div>
		</header>
	);
}
