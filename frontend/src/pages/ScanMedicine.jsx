import { useState, useRef } from "react";
import Layout from "../components/Layout";
import { scanMedicine, verifyBatchManual } from "../api/scanApi";

export default function ScanMedicine() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualForm, setManualForm] = useState({ batch_number: "", manufacturer: "" });
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setScanning(true);
      }
    } catch (err) {
      console.error("Camera access error:", err);
      alert("Unable to access camera. Please check permissions or upload an image instead.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoRef.current, 0, 0);
      
      canvas.toBlob(async (blob) => {
        if (blob) {
          stopCamera();
          setPreviewImage(URL.createObjectURL(blob));
          await processScan(blob);
        }
      }, "image/jpeg", 0.95);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setPreviewImage(URL.createObjectURL(file));
      await processScan(file);
    }
  };

  const processScan = async (imageFile) => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await scanMedicine(imageFile);
      setResult(response.data);
    } catch (err) {
      console.error("Scan error:", err);
      setResult({
        success: false,
        verdict: "ERROR",
        message: err.response?.data?.detail || "Scan failed. Please try again.",
        details: null
      });
    } finally {
      setLoading(false);
    }
  };

  const resetScan = () => {
    setResult(null);
    setPreviewImage(null);
    setScanning(false);
    setShowManualEntry(false);
    setManualForm({ batch_number: "", manufacturer: "" });
    stopCamera();
  };

  const handleManualVerify = async () => {
    if (!manualForm.batch_number.trim()) {
      alert("Please enter a batch number");
      return;
    }

    setLoading(true);
    setResult(null);
    
    try {
      const response = await verifyBatchManual(
        manualForm.batch_number.trim(),
        manualForm.manufacturer.trim() || null
      );
      setResult(response.data);
      setShowManualEntry(false);
    } catch (err) {
      console.error("Verification error:", err);
      setResult({
        success: false,
        verdict: "ERROR",
        message: err.response?.data?.detail || "Verification failed. Please try again.",
        details: null
      });
    } finally {
      setLoading(false);
    }
  };

  const getVerdictStyle = (verdict) => {
    switch (verdict) {
      case "AUTHENTIC":
        return "bg-green-100 border-green-500 text-green-800";
      case "SUSPICIOUS":
        return "bg-yellow-100 border-yellow-500 text-yellow-800";
      case "FAKE":
        return "bg-red-100 border-red-500 text-red-800";
      case "UNKNOWN":
        return "bg-gray-100 border-gray-500 text-gray-800";
      case "ERROR":
        return "bg-red-100 border-red-500 text-red-800";
      default:
        return "bg-gray-100 border-gray-500 text-gray-800";
    }
  };

  const getVerdictIcon = (verdict) => {
    switch (verdict) {
      case "AUTHENTIC":
        return "✓";
      case "SUSPICIOUS":
        return "⚠";
      case "FAKE":
        return "✗";
      case "UNKNOWN":
        return "?";
      case "ERROR":
        return "!";
      default:
        return "?";
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">📱 Scan Medicine</h1>
        <p className="text-gray-600 mb-8">
          Verify medicine authenticity by scanning the QR code or barcode on the package.
        </p>

        {/* Action Buttons */}
        {!scanning && !result && !showManualEntry && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <button
              onClick={startCamera}
              className="bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-lg font-medium"
            >
              📷 Open Camera
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-purple-600 text-white px-6 py-4 rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2 text-lg font-medium"
            >
              📁 Upload Image
            </button>
            <button
              onClick={() => setShowManualEntry(true)}
              className="bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 text-lg font-medium"
            >
              ⌨️ Enter Batch Number
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Manual Entry Form */}
        {showManualEntry && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h3 className="text-xl font-semibold mb-4">Manual Batch Verification</h3>
            <p className="text-gray-600 mb-6 text-sm">
              Enter the batch number manually if barcode scanning is not available or failed.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Batch Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={manualForm.batch_number}
                  onChange={(e) => setManualForm({ ...manualForm, batch_number: e.target.value })}
                  placeholder="e.g., BATCH001, ABC123"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manufacturer (Optional)
                </label>
                <input
                  type="text"
                  value={manualForm.manufacturer}
                  onChange={(e) => setManualForm({ ...manualForm, manufacturer: e.target.value })}
                  placeholder="e.g., Pfizer, GSK"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex gap-4 pt-2">
                <button
                  onClick={handleManualVerify}
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium"
                >
                  ✓ Verify Medicine
                </button>
                <button
                  onClick={() => setShowManualEntry(false)}
                  className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Camera View */}
        {scanning && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg mb-4"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-4 border-blue-500 w-64 h-64 rounded-lg"></div>
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={captureImage}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium"
              >
                📸 Capture & Scan
              </button>
              <button
                onClick={stopCamera}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Preview Image */}
        {previewImage && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h3 className="text-lg font-semibold mb-3">Scanned Image</h3>
            <img
              src={previewImage}
              alt="Scanned"
              className="w-full max-h-96 object-contain rounded-lg"
            />
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg font-medium text-gray-700">Analyzing barcode...</p>
            <p className="text-sm text-gray-500 mt-2">Verifying against database</p>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className={`border-l-4 p-6 rounded-lg mb-6 ${getVerdictStyle(result.verdict)}`}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-4xl">{getVerdictIcon(result.verdict)}</span>
                <div>
                  <h2 className="text-2xl font-bold">{result.verdict}</h2>
                  <p className="text-sm mt-1">{result.message}</p>
                </div>
              </div>
            </div>

            {/* Medicine Details */}
            {result.details && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Medicine Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.details.medicine && (
                    <div>
                      <p className="text-sm text-gray-600">Medicine Name</p>
                      <p className="font-medium">{result.details.medicine}</p>
                    </div>
                  )}
                  
                  {result.details.manufacturer && (
                    <div>
                      <p className="text-sm text-gray-600">Manufacturer</p>
                      <p className="font-medium">{result.details.manufacturer}</p>
                    </div>
                  )}
                  
                  {result.batch_number && (
                    <div>
                      <p className="text-sm text-gray-600">Batch Number</p>
                      <p className="font-medium font-mono">{result.batch_number}</p>
                    </div>
                  )}
                  
                  {result.details.supplier && (
                    <div>
                      <p className="text-sm text-gray-600">Supplier</p>
                      <p className="font-medium">{result.details.supplier}</p>
                    </div>
                  )}
                  
                  {result.details.category && (
                    <div>
                      <p className="text-sm text-gray-600">Category</p>
                      <p className="font-medium">{result.details.category}</p>
                    </div>
                  )}
                  
                  {result.details.compliance_status && (
                    <div>
                      <p className="text-sm text-gray-600">Compliance Status</p>
                      <p className="font-medium">{result.details.compliance_status}</p>
                    </div>
                  )}
                  
                  {result.details.expiry_date && (
                    <div>
                      <p className="text-sm text-gray-600">Expiry Date</p>
                      <p className="font-medium">
                        {new Date(result.details.expiry_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  
                  {result.details.quantity && (
                    <div>
                      <p className="text-sm text-gray-600">Quantity</p>
                      <p className="font-medium">{result.details.quantity} units</p>
                    </div>
                  )}
                </div>

                {/* Warning Flags */}
                {result.details.warning_flags && result.details.warning_flags.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">Warning Flags</p>
                    <div className="flex flex-wrap gap-2">
                      {result.details.warning_flags.map((flag, idx) => (
                        <span
                          key={idx}
                          className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium"
                        >
                          {flag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Barcode Info */}
                {result.barcode_type && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Barcode Type</p>
                    <p className="font-medium">{result.barcode_type}</p>
                    {result.raw_barcode_data && (
                      <p className="text-xs text-gray-500 mt-1 font-mono">
                        Raw: {result.raw_barcode_data}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Scan Again Button */}
            <button
              onClick={resetScan}
              className="w-full mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
            >
              Scan Another Medicine
            </button>
          </div>
        )}

        {/* Instructions */}
        {!scanning && !result && !loading && !showManualEntry && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-3">📋 How to Use:</h3>
            <ol className="list-decimal list-inside space-y-2 text-blue-800 text-sm">
              <li>Choose verification method: Camera scan, Image upload, or Manual batch entry</li>
              <li>For scanning: Position the QR code or barcode within the frame</li>
              <li>For manual entry: Type the batch number found on the medicine package</li>
              <li>Wait for the system to analyze and verify the medicine</li>
              <li>Review the authentication result and details</li>
            </ol>
            
            <h3 className="font-semibold text-blue-900 mt-6 mb-3">✓ Supported Formats:</h3>
            <ul className="list-disc list-inside space-y-1 text-blue-800 text-sm">
              <li>QR Codes</li>
              <li>EAN-13 Barcodes</li>
              <li>Code-128 Barcodes</li>
              <li>Code-39 Barcodes</li>
              <li>Manual Batch Number Entry</li>
            </ul>
          </div>
        )}
      </div>
    </Layout>
  );
}
