import { useState, useRef } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const PublicVerify = () => {
  // MODES: medicine (primary) | batch | barcode | image
  const [mode, setMode] = useState('medicine');
  
  // PRIMARY: Medicine Name + Batch
  const [medicineName, setMedicineName] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  
  // LEGACY: Batch mode only
  const [manufacturer, setManufacturer] = useState('');
  
  // Image/Camera
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  // Status
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Refs
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);

  // ===== CAMERA FUNCTIONS =====
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      setError('Camera access denied. Please enable camera permissions.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      setCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (canvasRef.current && videoRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(blob));
        stopCamera();
      }, 'image/jpeg', 0.95);
    }
  };

  // ===== FILE HANDLERS =====
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file?.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    } else {
      setError('Please select a valid image file');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    } else {
      setError('Please drop a valid image file');
    }
  };

  // ===== VERIFICATION FUNCTIONS =====

  // PRIMARY: Medicine-name-first (simple interface)
  const verifyByMedicineName = async () => {
    if (!medicineName.trim()) {
      setError('Please enter a medicine name');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const url = `${API_BASE_URL}/public/verify/medicine`;
      const params = new URLSearchParams({
        medicine_name: medicineName.trim()
      });
      
      if (batchNumber.trim()) {
        params.append('batch_number', batchNumber.trim());
      }

      const response = await axios.post(`${url}?${params.toString()}`, null, {
        timeout: 15000
      });

      setResult(response.data);
    } catch (err) {
      console.error('Medicine verification error:', err);
      setError(err.response?.data?.detail || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyByBarcode = async () => {
    if (!selectedFile) {
      setError('Please select or capture an image');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await axios.post(`${API_BASE_URL}/public/verify/barcode`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000
      });

      setResult(response.data);
    } catch (err) {
      console.error('Barcode verification error:', err);
      setError(err.response?.data?.detail || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const verifyByBatch = async () => {
    if (!batchNumber.trim()) {
      setError('Please enter a batch number');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const url = `${API_BASE_URL}/public/verify/batch`;
      const params = new URLSearchParams({
        batch_number: batchNumber.trim()
      });
      
      if (manufacturer.trim()) {
        params.append('manufacturer', manufacturer.trim());
      }

      const response = await axios.post(`${url}?${params.toString()}`, null, {
        timeout: 15000
      });

      setResult(response.data);
    } catch (err) {
      console.error('Batch verification error:', err);
      setError(err.response?.data?.detail || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const verifyByImage = async () => {
    if (!selectedFile) {
      setError('Please select or capture an image');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await axios.post(`${API_BASE_URL}/public/verify/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000
      });

      setResult(response.data);
    } catch (err) {
      console.error('Image verification error:', err);
      setError(err.response?.data?.detail || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = () => {
    if (mode === 'medicine') verifyByMedicineName();
    else if (mode === 'barcode') verifyByBarcode();
    else if (mode === 'batch') verifyByBatch();
    else if (mode === 'image') verifyByImage();
  };

  const resetForm = () => {
    setResult(null);
    setError(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    setBatchNumber('');
    setManufacturer('');
    setMedicineName('');
    stopCamera();
  };

  // ===== STYLING HELPERS =====
  const getVerdictStyle = (verdict) => {
    const styles = {
      'SAFE': 'bg-green-50 border-green-500 text-green-900',
      'LIKELY_AUTHENTIC': 'bg-green-50 border-green-400 text-green-800',
      'UNKNOWN': 'bg-yellow-50 border-yellow-500 text-yellow-900',
      'SUSPICIOUS': 'bg-orange-50 border-orange-500 text-orange-900',
      'HIGH_RISK_FAKE': 'bg-red-50 border-red-600 text-red-900'
    };
    return styles[verdict] || 'bg-gray-50 border-gray-400 text-gray-900';
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-green-500';
    if (confidence >= 40) return 'text-yellow-600';
    if (confidence >= 20) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* HEADER */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-2">
            💊 Verify Your Medicine
          </h1>
          <p className="text-gray-600 text-lg font-medium">
            Simple. Fast. Like searching on Google.
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Powered by MedGuard AI • Protecting citizens from fake medicines
          </p>
        </div>

        {/* PRIMARY INPUT: Medicine Name (ALWAYS PROMINENT) */}
        <div className="bg-white rounded-xl shadow-2xl p-8 mb-6 border-4 border-blue-400">
          <div className="flex items-center mb-6">
            <span className="text-4xl mr-4">💊</span>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Quick Verification</h2>
              <p className="text-gray-600 text-sm">Enter medicine name (that's it!)</p>
            </div>
          </div>
          
          <div className="space-y-5">
            {/* Medicine Name Input */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                Medicine Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={medicineName}
                  onChange={(e) => setMedicineName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && mode === 'medicine' && handleVerify()}
                  placeholder="e.g., Aspirin, Crocin, Amoxycillin"
                  className="w-full px-5 py-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base font-medium"
                  autoFocus
                />
                <span className="absolute right-4 top-4 text-2xl pointer-events-none">🔍</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Examples: Paracetamol, Cetirizine, Himalaya, Patanjali...</p>
            </div>

            {/* Optional Batch Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Batch Number <span className="text-gray-400 font-normal">(optional - adds 15% accuracy)</span>
              </label>
              <input
                type="text"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                placeholder="e.g., BD-0111 or CRN500-K23-119"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-sm"
              />
            </div>

            {/* Verify Button */}
            <button
              onClick={handleVerify}
              disabled={loading || !medicineName.trim()}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg text-lg"
            >
              {loading ? (
                <>
                  <span className="inline-block animate-spin mr-2">⏳</span>
                  Checking Database...
                </>
              ) : (
                <>
                  🔍 Verify Now
                </>
              )}
            </button>
          </div>
        </div>

        {/* ADVANCED: Secondary Methods */}
        <div className="bg-gray-50 rounded-xl shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Advanced Methods</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={() => { setMode('barcode'); resetForm(); }}
              className={`p-4 rounded-lg border-2 transition-all text-center ${
                mode === 'barcode'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-300 hover:border-blue-400 hover:bg-white'
              }`}
            >
              <div className="text-3xl mb-2">📷</div>
              <div className="font-semibold text-gray-800 text-sm">Scan Barcode</div>
              <div className="text-xs text-gray-600">QR or barcode</div>
            </button>

            <button
              onClick={() => { setMode('batch'); resetForm(); }}
              className={`p-4 rounded-lg border-2 transition-all text-center ${
                mode === 'batch'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-300 hover:border-blue-400 hover:bg-white'
              }`}
            >
              <div className="text-3xl mb-2">⌨️</div>
              <div className="font-semibold text-gray-800 text-sm">Batch Number</div>
              <div className="text-xs text-gray-600">Manual entry</div>
            </button>

            <button
              onClick={() => { setMode('image'); resetForm(); }}
              className={`p-4 rounded-lg border-2 transition-all text-center ${
                mode === 'image'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-300 hover:border-blue-400 hover:bg-white'
              }`}
            >
              <div className="text-3xl mb-2">📦</div>
              <div className="font-semibold text-gray-800 text-sm">Photo Analysis</div>
              <div className="text-xs text-gray-600">Package image</div>
            </button>
          </div>
        </div>

        {/* ADVANCED INPUT SECTIONS (CONDITIONAL) */}
        {mode !== 'medicine' && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            {/* Barcode Mode */}
            {mode === 'barcode' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">📷 Scan Barcode or QR Code</h3>
                
                {!cameraActive && !previewUrl && (
                  <div>
                    <button
                      onClick={startCamera}
                      className="w-full mb-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      📷 Open Camera
                    </button>
                    
                    <div
                      onDrop={handleDrop}
                      onDragOver={(e) => e.preventDefault()}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="text-4xl mb-2">📁</div>
                      <p className="text-gray-600">Drag & drop or click to upload</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>
                  </div>
                )}

                {cameraActive && (
                  <div className="text-center">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full max-w-md mx-auto rounded-lg mb-4"
                    />
                    <div className="flex gap-4 justify-center">
                      <button
                        onClick={capturePhoto}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        📸 Capture
                      </button>
                      <button
                        onClick={stopCamera}
                        className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                      >
                        ❌ Cancel
                      </button>
                    </div>
                  </div>
                )}

                {previewUrl && (
                  <div className="text-center">
                    <img src={previewUrl} alt="Preview" className="w-full max-w-md mx-auto rounded-lg mb-4" />
                    <button
                      onClick={resetForm}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                    >
                      🔄 Retake
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Batch Mode */}
            {mode === 'batch' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">⌨️ Enter Batch Number</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Batch Number *
                    </label>
                    <input
                      type="text"
                      value={batchNumber}
                      onChange={(e) => setBatchNumber(e.target.value)}
                      placeholder="e.g., BD-0111"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Manufacturer (Optional)
                    </label>
                    <input
                      type="text"
                      value={manufacturer}
                      onChange={(e) => setManufacturer(e.target.value)}
                      placeholder="e.g., Cipla"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Image Mode */}
            {mode === 'image' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">📦 Upload Medicine Package Photo</h3>
                
                {!cameraActive && !previewUrl && (
                  <div>
                    <button
                      onClick={startCamera}
                      className="w-full mb-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      📷 Open Camera
                    </button>
                    
                    <div
                      onDrop={handleDrop}
                      onDragOver={(e) => e.preventDefault()}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="text-4xl mb-2">📦</div>
                      <p className="text-gray-600">Drag & drop or click to upload</p>
                      <p className="text-sm text-gray-500 mt-2">Clear photo of medicine packaging</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>
                  </div>
                )}

                {cameraActive && (
                  <div className="text-center">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full max-w-md mx-auto rounded-lg mb-4"
                    />
                    <div className="flex gap-4 justify-center">
                      <button
                        onClick={capturePhoto}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        📸 Capture
                      </button>
                      <button
                        onClick={stopCamera}
                        className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                      >
                        ❌ Cancel
                      </button>
                    </div>
                  </div>
                )}

                {previewUrl && (
                  <div className="text-center">
                    <img src={previewUrl} alt="Preview" className="w-full max-w-md mx-auto rounded-lg mb-4" />
                    <button
                      onClick={resetForm}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                    >
                      🔄 Retake
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Verify Button for Advanced Modes */}
            <button
              onClick={handleVerify}
              disabled={loading || (mode !== 'batch' && !selectedFile) || (mode === 'batch' && !batchNumber.trim())}
              className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? '⏳ Verifying...' : '🔍 Verify Now'}
            </button>
          </div>
        )}

        {/* ERROR DISPLAY */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <span className="text-2xl mr-3">⚠️</span>
              <div>
                <h3 className="font-semibold text-red-800">Error</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* RESULT DISPLAY */}
        {result && (
          <div className={`rounded-xl shadow-xl p-8 border-l-8 ${getVerdictStyle(result.verdict)}`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold">Verification Result</h2>
              <span className={`text-4xl font-bold ${getConfidenceColor(result.confidence)}`}>
                {result.confidence}%
              </span>
            </div>

            <div className="mb-8">
              <div className="text-5xl font-bold mb-3">{result.verdict.replace(/_/g, ' ')}</div>
              <div className="text-lg leading-relaxed whitespace-pre-line">{result.recommendation}</div>
            </div>

            {/* Medicine Details */}
            {result.medicine_details && (
              <div className="bg-white bg-opacity-60 rounded-lg p-4 mb-4">
                <h3 className="font-bold text-lg mb-3">💊 Medicine Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div><strong>Name:</strong> {result.medicine_details.name}</div>
                  {result.medicine_details.brand_name && (
                    <div><strong>Brand:</strong> {result.medicine_details.brand_name}</div>
                  )}
                  {result.medicine_details.inferred_manufacturer && (
                    <div><strong>Manufacturer:</strong> {result.medicine_details.inferred_manufacturer}</div>
                  )}
                  {result.medicine_details.batch_number && (
                    <div><strong>Batch:</strong> {result.medicine_details.batch_number}</div>
                  )}
                  {result.medicine_details.category && (
                    <div><strong>Category:</strong> {result.medicine_details.category}</div>
                  )}
                </div>
              </div>
            )}

            {/* CDSCO Info */}
            {result.cdsco && (
              <div className="bg-white bg-opacity-60 rounded-lg p-4 mb-4">
                <h3 className="font-bold text-lg mb-2">🏛️ CDSCO Registry Status</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Verified:</strong> {result.cdsco.cdsco_match ? '✅ Yes' : '❌ No'}
                  </div>
                  {result.cdsco.status && (
                    <div><strong>Status:</strong> {result.cdsco.status}</div>
                  )}
                  <div>
                    <strong>Confidence Modifier:</strong> {result.cdsco.confidence_modifier > 0 ? '+' : ''}{result.cdsco.confidence_modifier}
                  </div>
                </div>
              </div>
            )}

            {/* Reasoning */}
            {result.reasoning?.length > 0 && (
              <div className="bg-white bg-opacity-60 rounded-lg p-4 mb-4">
                <h3 className="font-bold text-lg mb-3">🔍 Analysis Details</h3>
                <ul className="space-y-2 text-sm">
                  {result.reasoning.map((reason, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Risk Flags */}
            {result.risk_flags?.length > 0 && (
              <div className="bg-white bg-opacity-60 rounded-lg p-4 mb-4">
                <h3 className="font-bold text-lg mb-2">⚠️ Risk Flags</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {result.risk_flags.map((flag, idx) => (
                    <li key={idx}>{flag.replace(/_/g, ' ')}</li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={resetForm}
              className="w-full mt-6 px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 font-semibold"
            >
              ✅ Verify Another Medicine
            </button>
          </div>
        )}

        {/* Hidden Canvas */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default PublicVerify;
