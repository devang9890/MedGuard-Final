import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sidebar-collapsed") === "true";
    } catch { return false; }
  });

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  return (
    <div className="flex min-h-screen bg-[var(--bg-base)]">
      <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed(c => !c)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-4 lg:p-5 overflow-y-auto">
          <div className="max-w-[1360px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
