import { useState, useRef } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const PublicVerify = () => {
  const [mode, setMode] = useState('barcode'); // barcode, batch, image
  const [batchNumber, setBatchNumber] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);

  // Camera functions
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
      setError('Camera access denied. Please enable camera in browser settings.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
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

  // File upload handlers
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
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
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    } else {
      setError('Please drop a valid image file');
    }
  };

  // Verification functions
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
        timeout: 30000 // 30 second timeout
      });

      setResult(response.data);
    } catch (err) {
      console.error('Barcode verification error:', err);
      setError(err.response?.data?.detail || err.message || 'Verification failed. Please try again.');
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
      // Build URL with query parameters
      const url = `${API_BASE_URL}/public/verify/batch`;
      const params = new URLSearchParams({
        batch_number: batchNumber.trim()
      });
      
      if (manufacturer.trim()) {
        params.append('manufacturer', manufacturer.trim());
      }

      const response = await axios.post(`${url}?${params.toString()}`, null, {
        timeout: 15000 // 15 second timeout
      });

      setResult(response.data);
    } catch (err) {
      console.error('Batch verification error:', err);
      setError(err.response?.data?.detail || err.message || 'Verification failed. Please try again.');
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
        timeout: 30000 // 30 second timeout
      });

      setResult(response.data);
    } catch (err) {
      console.error('Image verification error:', err);
      setError(err.response?.data?.detail || err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = () => {
    if (mode === 'barcode') verifyByBarcode();
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
    stopCamera();
  };

  // Verdict styling
  const getVerdictStyle = (verdict) => {
    switch (verdict) {
      case 'SAFE':
        return 'bg-green-50 border-green-500 text-green-900';
      case 'LIKELY_AUTHENTIC':
        return 'bg-green-50 border-green-400 text-green-800';
      case 'UNKNOWN':
        return 'bg-yellow-50 border-yellow-500 text-yellow-900';
      case 'SUSPICIOUS':
        return 'bg-orange-50 border-orange-500 text-orange-900';
      case 'HIGH_RISK_FAKE':
        return 'bg-red-50 border-red-600 text-red-900';
      default:
        return 'bg-gray-50 border-gray-400 text-gray-900';
    }
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
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🔍 Verify Your Medicine
          </h1>
          <p className="text-gray-600 text-lg">
            National Public Medicine Verification Engine
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Powered by MedGuard AI • Protecting citizens from fake medicines
          </p>
        </div>

        {/* Mode Selection */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Choose Verification Method</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => { setMode('barcode'); resetForm(); }}
              className={`p-4 rounded-lg border-2 transition-all ${
                mode === 'barcode'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-300 hover:border-blue-400'
              }`}
            >
              <div className="text-3xl mb-2">📷</div>
              <div className="font-semibold text-gray-800">Scan Barcode</div>
              <div className="text-sm text-gray-600">QR or barcode</div>
            </button>

            <button
              onClick={() => { setMode('batch'); resetForm(); }}
              className={`p-4 rounded-lg border-2 transition-all ${
                mode === 'batch'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-300 hover:border-blue-400'
              }`}
            >
              <div className="text-3xl mb-2">⌨️</div>
              <div className="font-semibold text-gray-800">Enter Batch</div>
              <div className="text-sm text-gray-600">Manual entry</div>
            </button>

            <button
              onClick={() => { setMode('image'); resetForm(); }}
              className={`p-4 rounded-lg border-2 transition-all ${
                mode === 'image'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-300 hover:border-blue-400'
              }`}
            >
              <div className="text-3xl mb-2">📦</div>
              <div className="font-semibold text-gray-800">Photo Analysis</div>
              <div className="text-sm text-gray-600">Package image</div>
            </button>
          </div>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          {/* Barcode Mode */}
          {mode === 'barcode' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Scan Barcode or QR Code</h3>
              
              {!cameraActive && !previewUrl && (
                <div>
                  <button
                    onClick={startCamera}
                    className="w-full mb-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    📷 Open Camera
                  </button>
                  
                  <div
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="text-4xl mb-2">📁</div>
                    <p className="text-gray-600">Drag & drop image or click to upload</p>
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
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 mb-4"
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
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Enter Batch Number</h3>
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    placeholder="e.g., Beximco Pharmaceuticals"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Image Analysis Mode */}
          {mode === 'image' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Upload Medicine Package Photo</h3>
              
              {!cameraActive && !previewUrl && (
                <div>
                  <button
                    onClick={startCamera}
                    className="w-full mb-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    📷 Open Camera
                  </button>
                  
                  <div
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="text-4xl mb-2">📦</div>
                    <p className="text-gray-600">Drag & drop image or click to upload</p>
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
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 mb-4"
                  >
                    🔄 Retake
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Verify Button */}
          <button
            onClick={handleVerify}
            disabled={loading || (mode !== 'batch' && !selectedFile) || (mode === 'batch' && !batchNumber.trim())}
            className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
          >
            {loading ? '⏳ Verifying...' : '🔍 Verify Now'}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <span className="text-2xl mr-3">⚠️</span>
              <div>
                <h3 className="font-semibold text-red-800">Error</h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Result Display */}
        {result && (
          <div className={`rounded-xl shadow-xl p-6 border-l-8 ${getVerdictStyle(result.verdict)}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Verification Result</h2>
              <span className={`text-3xl font-bold ${getConfidenceColor(result.confidence)}`}>
                {result.confidence}%
              </span>
            </div>

            <div className="mb-6">
              <div className="text-4xl font-bold mb-2">{result.verdict.replace(/_/g, ' ')}</div>
              <div className="text-lg">{result.recommendation}</div>
            </div>

            {result.medicine_details && (
              <div className="bg-white bg-opacity-50 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-lg mb-2">Medicine Details</h3>
                <div className="space-y-1 text-sm">
                  <p><strong>Name:</strong> {result.medicine_details.name}</p>
                  {result.medicine_details.manufacturer && (
                    <p><strong>Manufacturer:</strong> {result.medicine_details.manufacturer}</p>
                  )}
                  {result.medicine_details.batch_number && (
                    <p><strong>Batch:</strong> {result.medicine_details.batch_number}</p>
                  )}
                  {result.medicine_details.expiry_date && (
                    <p><strong>Expiry:</strong> {result.medicine_details.expiry_date}</p>
                  )}
                  {result.medicine_details.database_match !== undefined && (
                    <p><strong>Database Match:</strong> {result.medicine_details.database_match ? '✓ Yes' : '✗ No'}</p>
                  )}
                  {result.medicine_details.ai_confidence && (
                    <p><strong>AI Confidence:</strong> {result.medicine_details.ai_confidence}%</p>
                  )}
                </div>
              </div>
            )}

            {/* Reasoning Section - NEW */}
            {result.reasoning && result.reasoning.length > 0 && (
              <div className="bg-white bg-opacity-50 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-lg mb-2">🔍 Analysis Details</h3>
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

            {result.risk_flags && result.risk_flags.length > 0 && (
              <div className="bg-white bg-opacity-50 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-lg mb-2">⚠️ Risk Flags</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {result.risk_flags.map((flag, idx) => (
                    <li key={idx}>{flag.replace(/_/g, ' ')}</li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={resetForm}
              className="w-full mt-4 px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition"
            >
              ✅ Verify Another Medicine
            </button>
          </div>
        )}

        {/* Hidden canvas for photo capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default PublicVerify;
