import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function Layout({ children }) {
  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 w-full lg:w-auto">
        <Navbar />
        <div className="p-4 md:p-6 bg-gray-100 min-h-screen pt-20 lg:pt-6">
          {children}
        </div>
      </div>
    </div>
  );
}
