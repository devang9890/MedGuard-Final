import { Link } from "react-router-dom";
import Layout from "../components/Layout";

export default function PublicDashboard() {
  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Public Dashboard</h1>
        <p className="text-gray-600 mt-2">Verify medicine authenticity & report suspicious products</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link to="/public-verify">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg rounded-lg p-8 text-white cursor-pointer hover:shadow-2xl transform hover:scale-105 transition-all">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold mb-2">Verify Medicine</h2>
            <p className="text-blue-100">Check if your medicine is authentic by name or batch</p>
          </div>
        </Link>

        <Link to="/scan">
          <div className="bg-gradient-to-br from-green-500 to-green-600 shadow-lg rounded-lg p-8 text-white cursor-pointer hover:shadow-2xl transform hover:scale-105 transition-all">
            <div className="text-5xl mb-4">📱</div>
            <h2 className="text-2xl font-bold mb-2">Scan Barcode</h2>
            <p className="text-green-100">Scan medicine barcode for instant verification</p>
          </div>
        </Link>
      </div>

      {/* Information Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3">ℹ️ How It Works</h3>
          <ol className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0 text-xs font-bold">1</span>
              <span>Enter medicine name or scan barcode</span>
            </li>
            <li className="flex items-start">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0 text-xs font-bold">2</span>
              <span>Get instant authenticity status</span>
            </li>
            <li className="flex items-start">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0 text-xs font-bold">3</span>
              <span>Report suspicious products</span>
            </li>
          </ol>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3">✅ What We Check</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              <span>Manufacturer authenticity</span>
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              <span>Batch number validity</span>
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              <span>CDSCO certification</span>
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              <span>Expiry status</span>
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              <span>Corruption signals</span>
            </li>
          </ul>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3">⚠️ Report Issues</h3>
          <p className="text-sm text-gray-700 mb-3">
            Found a suspicious medicine? Help protect your community by reporting it immediately.
          </p>
          <button className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded font-medium transition">
            Report Suspicious Product
          </button>
        </div>
      </div>

      {/* Common Questions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">❓ Frequently Asked Questions</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">What is MedGuard?</h3>
            <p className="text-gray-700 text-sm">
              MedGuard is a comprehensive medicine verification system that helps identify counterfeit and suspicious medicines in the supply chain. It combines AI analysis, CDSCO verification, and pattern detection to ensure medicine authenticity.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Is my personal data safe?</h3>
            <p className="text-gray-700 text-sm">
              Yes. We don't store personal information during verification. All queries are anonymous and processed securely. No personal data is shared with third parties.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">What does "High Risk" mean?</h3>
            <p className="text-gray-700 text-sm">
              High Risk indicates detected anomalies, pattern irregularities, or supplier concerns. Do not use medicines marked as High Risk or Rejected without consulting a pharmacist.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">How accurate is the verification?</h3>
            <p className="text-gray-700 text-sm">
              Our system uses CDSCO official data, AI anomaly detection, and corruption pattern analysis. Accuracy is very high, but in case of doubt, consult your pharmacist or call CDSCO.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">What should I do if I find a fake medicine?</h3>
            <p className="text-gray-700 text-sm">
              1. Report it through our platform immediately. 2. Contact your local pharmacy. 3. Inform CDSCO or drug regulatory authorities. 4. Don't consume the medicine.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg text-center">
        <p className="text-gray-700 text-sm">
          <strong>Need Help?</strong> Contact our support team or visit{" "}
          <a href="https://cdsco.gov.in" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            CDSCO
          </a>
          {" "}for official medicine information
        </p>
      </div>
    </Layout>
  );
}
