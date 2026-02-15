import { Link } from "react-router-dom";
import Layout from "../components/Layout";

export default function PublicDashboard() {
  return (
    <Layout>
      {/* Header */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center">
                <svg className="w-10 h-10 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Public Dashboard
              </h1>
              <p className="text-blue-100 text-lg">Verify medicine authenticity & report suspicious products</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link to="/public-verify">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 hover:shadow-2xl hover:border-blue-300 transform hover:scale-[1.02] transition-all duration-300 group">
            <div className="bg-blue-100 rounded-full p-5 w-20 h-20 flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Medicine</h2>
            <p className="text-gray-500">Check if your medicine is authentic by name or batch</p>
          </div>
        </Link>
        <Link to="/scan">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 hover:shadow-2xl hover:border-green-300 transform hover:scale-[1.02] transition-all duration-300 group">
            <div className="bg-green-100 rounded-full p-5 w-20 h-20 flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Scan Barcode</h2>
            <p className="text-gray-500">Scan medicine barcode for instant verification</p>
          </div>
        </Link>
      </div>

      {/* Information Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
            <h3 className="text-lg font-bold text-white flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              How It Works
            </h3>
          </div>
          <div className="p-6">
            <ol className="space-y-3 text-sm text-gray-700">
              {["Enter medicine name or scan barcode", "Get instant authenticity status", "Report suspicious products"].map((step, i) => (
                <li key={i} className="flex items-start">
                  <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0 text-xs font-bold">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
            <h3 className="text-lg font-bold text-white flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              What We Check
            </h3>
          </div>
          <div className="p-6">
            <ul className="space-y-2 text-sm text-gray-700">
              {["Manufacturer authenticity", "Batch number validity", "CDSCO certification", "Expiry status", "Corruption signals"].map((item, i) => (
                <li key={i} className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 to-rose-600 px-6 py-4">
            <h3 className="text-lg font-bold text-white flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Report Issues
            </h3>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-700 mb-4">Found a suspicious medicine? Help protect your community by reporting it immediately.</p>
            <button className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white py-3 rounded-xl font-semibold transition-all shadow-lg">
              Report Suspicious Product
            </button>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4">
          <h2 className="text-xl font-bold text-white flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Frequently Asked Questions
          </h2>
        </div>
        <div className="p-6 space-y-6">
          {[
            { q: "What is MedGuard?", a: "MedGuard is a comprehensive medicine verification system that helps identify counterfeit and suspicious medicines in the supply chain." },
            { q: "Is my personal data safe?", a: "Yes. We don't store personal information during verification. All queries are anonymous and processed securely." },
            { q: "What does \"High Risk\" mean?", a: "High Risk indicates detected anomalies, pattern irregularities, or supplier concerns. Do not use such medicines without consulting a pharmacist." },
            { q: "How accurate is the verification?", a: "Our system uses CDSCO official data, AI anomaly detection, and corruption pattern analysis for very high accuracy." }
          ].map((faq, i) => (
            <div key={i}>
              <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
              <p className="text-gray-700 text-sm">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-center">
        <p className="text-gray-700 text-sm">
          <strong>Need Help?</strong> Contact our support team or visit{" "}
          <a href="https://cdsco.gov.in" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold">CDSCO</a>
          {" "}for official medicine information
        </p>
      </div>
    </Layout>
  );
}
