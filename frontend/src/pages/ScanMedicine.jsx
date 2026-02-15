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

  const getVerdictConfig = (verdict) => {
    switch (verdict) {
      case "AUTHENTIC":
        return {
          bg: "bg-green-50", border: "border-green-400", text: "text-green-800",
          iconBg: "bg-green-100", iconColor: "text-green-600",
          gradient: "from-green-500 to-emerald-600",
          icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          )
        };
      case "SUSPICIOUS":
        return {
          bg: "bg-yellow-50", border: "border-yellow-400", text: "text-yellow-800",
          iconBg: "bg-yellow-100", iconColor: "text-yellow-600",
          gradient: "from-yellow-500 to-amber-600",
          icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )
        };
      case "FAKE":
        return {
          bg: "bg-red-50", border: "border-red-400", text: "text-red-800",
          iconBg: "bg-red-100", iconColor: "text-red-600",
          gradient: "from-red-500 to-rose-600",
          icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          )
        };
      default:
        return {
          bg: "bg-gray-50", border: "border-gray-400", text: "text-gray-800",
          iconBg: "bg-gray-100", iconColor: "text-gray-600",
          gradient: "from-gray-500 to-slate-600",
          icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
    }
  };

  return (
    <Layout>
      {/* Header Section */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 rounded-2xl p-8 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center">
                <svg className="w-10 h-10 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                Scan Medicine
              </h1>
              <p className="text-blue-100 text-lg">Verify medicine authenticity by scanning QR code, barcode, or manual entry</p>
            </div>
            {(result || scanning || showManualEntry) && (
              <div className="mt-4 md:mt-0">
                <button
                  onClick={resetScan}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center shadow-lg"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  New Scan
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Action Buttons */}
        {!scanning && !result && !showManualEntry && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <button
              onClick={startCamera}
              className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 hover:shadow-2xl hover:border-blue-300 transition-all duration-300 group"
            >
              <div className="flex flex-col items-center text-center">
                <div className="bg-blue-100 rounded-full p-5 mb-4 group-hover:bg-blue-200 transition-colors">
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Open Camera</h3>
                <p className="text-sm text-gray-500">Scan barcode or QR code</p>
              </div>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 hover:shadow-2xl hover:border-purple-300 transition-all duration-300 group"
            >
              <div className="flex flex-col items-center text-center">
                <div className="bg-purple-100 rounded-full p-5 mb-4 group-hover:bg-purple-200 transition-colors">
                  <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Upload Image</h3>
                <p className="text-sm text-gray-500">Select a photo from device</p>
              </div>
            </button>
            <button
              onClick={() => setShowManualEntry(true)}
              className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 hover:shadow-2xl hover:border-green-300 transition-all duration-300 group"
            >
              <div className="flex flex-col items-center text-center">
                <div className="bg-green-100 rounded-full p-5 mb-4 group-hover:bg-green-200 transition-colors">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Enter Batch Number</h3>
                <p className="text-sm text-gray-500">Manual verification</p>
              </div>
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
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 mb-8 overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Manual Batch Verification
              </h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-6 text-sm">
                Enter the batch number manually if barcode scanning is not available or failed.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Batch Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={manualForm.batch_number}
                    onChange={(e) => setManualForm({ ...manualForm, batch_number: e.target.value })}
                    placeholder="e.g., BATCH001, ABC123"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Manufacturer (Optional)
                  </label>
                  <input
                    type="text"
                    value={manualForm.manufacturer}
                    onChange={(e) => setManualForm({ ...manualForm, manufacturer: e.target.value })}
                    placeholder="e.g., Pfizer, GSK"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowManualEntry(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleManualVerify}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg"
                >
                  Verify Medicine
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Camera View */}
        {scanning && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 mb-8 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                </svg>
                Camera Scanning
                <span className="ml-3 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              </h2>
            </div>
            <div className="p-6">
              <div className="relative rounded-xl overflow-hidden mb-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-xl"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="border-4 border-blue-500 w-64 h-64 rounded-lg shadow-lg"></div>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={captureImage}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  </svg>
                  Capture & Scan
                </button>
                <button
                  onClick={stopCamera}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Preview Image */}
        {previewImage && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 mb-8 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Scanned Image
              </h2>
            </div>
            <div className="p-6">
              <img
                src={previewImage}
                alt="Scanned"
                className="w-full max-h-96 object-contain rounded-xl"
              />
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-12 text-center mb-8">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg font-semibold text-gray-700">Analyzing barcode...</p>
            <p className="text-sm text-gray-500 mt-2">Verifying against database</p>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 mb-8 overflow-hidden">
            {/* Verdict Banner */}
            {(() => {
              const config = getVerdictConfig(result.verdict);
              return (
                <div className={`bg-gradient-to-r ${config.gradient} p-8 text-center`}>
                  <div className="flex flex-col items-center">
                    <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 mb-4">
                      <div className="text-white">{config.icon}</div>
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">{result.verdict}</h2>
                    <p className="text-white/90 text-lg">{result.message}</p>
                  </div>
                </div>
              );
            })()}

            {/* Medicine Details */}
            {result.details && (
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Medicine Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {result.details.medicine && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-gray-500 font-medium">Medicine Name</p>
                      <p className="font-semibold text-gray-900">{result.details.medicine}</p>
                    </div>
                  )}

                  {result.details.manufacturer && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-gray-500 font-medium">Manufacturer</p>
                      <p className="font-semibold text-gray-900">{result.details.manufacturer}</p>
                    </div>
                  )}

                  {result.batch_number && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-gray-500 font-medium">Batch Number</p>
                      <p className="font-semibold font-mono text-gray-900">{result.batch_number}</p>
                    </div>
                  )}

                  {result.details.supplier && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-gray-500 font-medium">Supplier</p>
                      <p className="font-semibold text-gray-900">{result.details.supplier}</p>
                    </div>
                  )}

                  {result.details.category && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-gray-500 font-medium">Category</p>
                      <p className="font-semibold text-gray-900">{result.details.category}</p>
                    </div>
                  )}

                  {result.details.compliance_status && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-gray-500 font-medium">Compliance Status</p>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${result.details.compliance_status === "ACCEPTED"
                          ? "bg-green-100 text-green-800"
                          : result.details.compliance_status === "REJECTED"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                        {result.details.compliance_status}
                      </span>
                    </div>
                  )}

                  {result.details.expiry_date && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-gray-500 font-medium">Expiry Date</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(result.details.expiry_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {result.details.quantity && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-gray-500 font-medium">Quantity</p>
                      <p className="font-semibold text-gray-900">{result.details.quantity} units</p>
                    </div>
                  )}
                </div>

                {/* Warning Flags */}
                {result.details.warning_flags && result.details.warning_flags.length > 0 && (
                  <div className="mt-4 bg-red-50 rounded-xl p-4 border border-red-200">
                    <p className="text-sm font-semibold text-red-800 mb-2 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Warning Flags
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {result.details.warning_flags.map((flag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800 border border-red-200"
                        >
                          {flag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Barcode Info */}
                {result.barcode_type && (
                  <div className="mt-4 bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500 font-medium">Barcode Type</p>
                    <p className="font-semibold text-gray-900">{result.barcode_type}</p>
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
            <div className="px-6 pb-6">
              <button
                onClick={resetScan}
                className="w-full px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-semibold hover:from-cyan-700 hover:to-blue-700 transition-all shadow-lg flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Scan Another Medicine
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        {!scanning && !result && !loading && !showManualEntry && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                How to Use
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                    <span className="bg-blue-100 rounded-full p-1 mr-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                    Steps
                  </h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700 text-sm ml-2">
                    <li>Choose verification method: Camera, Image, or Manual</li>
                    <li>For scanning: Position the code within the frame</li>
                    <li>For manual: Type the batch number on the package</li>
                    <li>Wait for the system to verify the medicine</li>
                    <li>Review the authentication result and details</li>
                  </ol>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                    <span className="bg-green-100 rounded-full p-1 mr-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                    Supported Formats
                  </h3>
                  <ul className="space-y-2 text-gray-700 text-sm ml-2">
                    {["QR Codes", "EAN-13 Barcodes", "Code-128 Barcodes", "Code-39 Barcodes", "Manual Batch Number Entry"].map((item, idx) => (
                      <li key={idx} className="flex items-center">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
