'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Camera,
  Upload,
  Cloud,
  ShieldCheck,
  BrainCircuit,
  ArrowRight,
  Loader2,
  Cloud as CloudIcon,
  Droplets,
  ThermometerSun,
  MessageCircle,
  BookOpen,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { validateImage, compressImage } from '@/utils/helpers';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
import { chatService } from '@/lib/chat-service';
import { generateId, formatTime } from '@/utils/helpers';

export default function Home() {
  const router = useRouter();
  const {
    images,
    setImages,
    setResults,
    setIsAnalyzing,
    isAnalyzing,
    userLocation,
    setWeather,
    results,
  role,
    chatMessages,
    addChatMessage,
    isOffline,
  } = useStore();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'farmer' | 'expert'>('farmer');
  const [expertCode, setExpertCode] = useState('');
  const [authError, setAuthError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setError('');
    const validImages: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validation = validateImage(file);

      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        continue;
      }

      try {
        const compressed = await compressImage(file);
        validImages.push(compressed);
      } catch (err) {
        console.error('Error processing image:', err);
        setError('Error processing image. Please try again.');
      }
    }

    if (validImages.length > 0) {
      setImages(validImages);
      try { localStorage.setItem('lastImage', validImages[0]); } catch {}
      document.getElementById('analysis')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  // Geolocation helper
  const getGeolocation = (): Promise<{ lat: number; lon: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        (err) => reject(new Error(err.message || 'Failed to get geolocation')),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  const analyzePlant = async (imageDataUrl: string, lat: number, lon: number) => {
    const res = await fetch(imageDataUrl);
    const blob = await res.blob();
    const file = new File([blob], 'image.jpg', { type: blob.type || 'image/jpeg' });
    const formData = new FormData();
    formData.append('image', file);
    formData.append('latitude', String(lat));
    formData.append('longitude', String(lon));
    const response = await fetch(`${API_URL}/analyze`, { method: 'POST', body: formData });
    if (!response.ok) throw new Error(`Analyze API error: ${response.status}`);
    return await response.json();
  };

  const startAnalysis = async () => {
    if (images.length === 0) return;
    setIsAnalyzing(true);
    setProgress(0);
    try {
      setProgress(10);
      const { lat, lon } = await getGeolocation();
      setProgress(25);
      const firstImage = images[0];
      const analysis = await analyzePlant(firstImage, lat, lon);
      setProgress(85);
      const result = {
        disease: analysis.disease,
        confidence: Math.round(analysis.confidence),
        weather: {
          temp: analysis.weather?.temp ?? 0,
          humidity: analysis.weather?.humidity ?? 0,
          location: analysis.weather?.location ?? userLocation,
          description: analysis.weather?.conditions ?? 'N/A',
        },
        pestRisk: analysis.pestRisk,
        llmAnalysis: analysis.llmAnalysis,
        timestamp: new Date().toISOString(),
  };
      setWeather(result.weather);
      setResults(result);
      setProgress(100);
      setTimeout(() => {
        setIsAnalyzing(false);
        document.getElementById('diagnosis')?.scrollIntoView({ behavior: 'smooth' });
      }, 400);
    } catch (e) {
      console.error('Analysis failed', e);
      setIsAnalyzing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isSending) return;
    const userMessage = {
      id: generateId(),
      role: 'user' as const,
      content: chatInput,
      timestamp: new Date().toISOString(),
    };
    addChatMessage(userMessage);
    setChatInput('');
    setIsSending(true);
    try {
      let reply: string;
      if (isOffline) {
        reply = chatService.getOfflineFallback(userMessage.content);
      } else {
        const response = await chatService.sendMessage({
          message: userMessage.content,
          diseaseContext: results?.disease,
          location: userLocation,
          recommendations: `Confidence: ${results?.confidence}%. Weather: ${results?.weather?.temp}°C, ${results?.weather?.humidity}% humidity, ${results?.weather?.description}. Treatment: ${results?.llmAnalysis?.treatment || ''} Prevention: ${results?.llmAnalysis?.prevention || ''}`,
        });
        reply = response.reply;
      }
      const assistantMessage = {
        id: generateId(),
        role: 'assistant' as const,
        content: reply,
        timestamp: new Date().toISOString(),
      };
      addChatMessage(assistantMessage);
    } catch (e) {
      console.error('Chat send failed', e);
      const assistantMessage = {
        id: generateId(),
        role: 'assistant' as const,
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      };
      addChatMessage(assistantMessage);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation */}
      <div className="absolute top-0 left-0 right-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌾</span>
            <span className="font-bold">CropGuard</span>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2 py-1 rounded-full ${role === 'expert' ? 'bg-green-600/80' : 'bg-white/20'}`}>Signed in as {role}</span>
            <button
              onClick={() => { setAuthError(''); setExpertCode(''); setSelectedRole(role); setShowAuth(true); }}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 font-semibold"
            >
              Community
            </button>
          </div>
        </div>
      </div>
      {/* Hero Section */}
      <section
        className="relative"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url('https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=1960&auto=format&fit=crop')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="max-w-xl text-white">
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
              Protect Your Crops
              <br />
              with AI
            </h1>
            <p className="mt-4 text-white/90">
              Detect pest infestations and plant diseases early with instant AI-powered image analysis. Protect your harvest with fast, actionable insights.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={() => document.getElementById('analysis')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-3 rounded-lg shadow"
              >
                <Camera className="w-5 h-5" /> Scan Your Crops Now
              </button>
              <a href="#analysis" className="px-5 py-3 rounded-lg bg-white/10 text-white font-medium hover:bg-white/20">
                Learn More
              </a>
              
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <span className="text-sm bg-white/15 backdrop-blur px-3 py-1.5 rounded-full inline-flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Early Detection
              </span>
              <span className="text-sm bg-white/15 backdrop-blur px-3 py-1.5 rounded-full inline-flex items-center gap-2">
                <BrainCircuit className="w-4 h-4" /> AI-Powered Analysis
              </span>
              <span className="text-sm bg-white/15 backdrop-blur px-3 py-1.5 rounded-full inline-flex items-center gap-2">
                <Cloud className="w-4 h-4" /> Weather Alerts
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Instant Crop Analysis */}
      <section id="analysis" className="bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 text-center">Instant Crop Analysis</h2>
          <p className="text-gray-600 text-center mt-2 max-w-2xl mx-auto">
            Upload a photo of your crops and get instant AI-powered diagnosis in seconds
          </p>

          <div className="max-w-xl mx-auto mt-8">
            <div
              className={`bg-white rounded-2xl shadow-lg p-6 md:p-8 border transition-all ${
                isDragging ? 'border-green-500 bg-green-50' : 'border-gray-200'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <Camera className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-center mt-4 font-semibold text-gray-800">Upload Your Crop Image</h3>
              <p className="text-center text-sm text-gray-600">Drag and drop an image here, or click to select a file</p>

              <div className="mt-5 flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files)}
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files)}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 bg-green-600 text-white font-medium px-4 py-2.5 rounded-md hover:bg-green-700"
                >
                  <Upload className="inline-block w-4 h-4 mr-2" /> Choose File
                </button>
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex-1 bg-gray-100 text-gray-800 font-medium px-4 py-2.5 rounded-md hover:bg-gray-200"
                >
                  Take Photo
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-3 text-center">Results in under 5 seconds</p>

              {images && images.length > 0 && (
                <>
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    {images.map((img, idx) => (
                      <img key={idx} src={img} alt={`preview-${idx}`} className="w-full h-36 object-cover rounded-md border" />
                    ))}
                  </div>
                  <div className="mt-5 text-center">
                    <button onClick={startAnalysis} className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-md">
                      Analyze <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Auth Modal for Community */}
      {showAuth && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-gray-900">Join Community</h3>
            <p className="text-sm text-gray-600 mt-1">Choose your role to continue. Experts need a passcode.</p>
            <div className="mt-4 bg-gray-100 rounded-lg p-1 inline-flex">
              <button onClick={() => setSelectedRole('farmer')} className={`px-3 py-1.5 rounded-md text-sm ${selectedRole === 'farmer' ? 'bg-white shadow font-semibold' : ''}`}>Farmer</button>
              <button onClick={() => setSelectedRole('expert')} className={`px-3 py-1.5 rounded-md text-sm ${selectedRole === 'expert' ? 'bg-white shadow font-semibold' : ''}`}>Expert</button>
            </div>

            {selectedRole === 'expert' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Expert Passcode</label>
                <input
                  type="password"
                  value={expertCode}
                  onChange={(e) => setExpertCode(e.target.value)}
                  placeholder="Enter code"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            )}

            {authError && <div className="mt-3 text-sm text-red-600">{authError}</div>}

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowAuth(false)} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200">Cancel</button>
              <button
                onClick={() => {
                  if (selectedRole === 'expert' && expertCode.trim() !== 'EXPERT2025') {
                    setAuthError('Invalid expert passcode.');
                    return;
                  }
                  try { localStorage.setItem('role', selectedRole); } catch {}
                  // update global role
                  try {
                    // narrow the getState() shape locally to avoid using `any`
                    const s = useStore.getState() as unknown as { setRole?: (r: 'farmer' | 'expert') => void };
                    s.setRole?.(selectedRole);
                  } catch {}
                  setShowAuth(false);
                  router.push('/community');
                }}
                className="px-5 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analyzing Section */}
      {isAnalyzing && (
        <section className="bg-white">
          <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
            <div className="max-w-md w-full mx-auto">
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center border">
                <Loader2 className="w-16 h-16 text-green-600 mx-auto mb-4 animate-spin" />
                <h2 className="text-2xl font-bold text-gray-900">Analyzing Your Crops</h2>
                <p className="text-gray-600 mt-2 mb-6">Our AI is examining your image and fetching local weather…</p>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                  <div className="bg-green-600 h-3 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-sm text-gray-500">{progress}% complete</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Accurate AI Diagnosis */}
      <section id="diagnosis" className="bg-white">
        <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 text-center">Accurate AI Diagnosis</h2>
          <p className="text-gray-600 text-center mt-2 max-w-2xl mx-auto">
            See how CropGuard identifies issues and provides actionable treatment plans
          </p>
          {results && (
            <>
              <div className="mt-8 grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b text-sm text-gray-700 font-medium">Uploaded Image</div>
                  <img
                    className="w-full h-80 object-cover"
                    src={typeof window !== 'undefined' && localStorage.getItem('lastImage') ? String(localStorage.getItem('lastImage')) : images[0] || ''}
                    alt="Uploaded"
                  />
                </div>

                <div className="space-y-4">
                  <div className="bg-white rounded-xl border shadow-sm p-5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">{results.disease}</h3>
                      <span className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 border border-red-200">confidence: {results.confidence}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: `${results.confidence}%` }} />
                    </div>
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700">Summary:</p>
                      <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{results.llmAnalysis?.description || 'Description not available.'}</p>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700">Recommended treatment:</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{results.llmAnalysis?.treatment || 'Not available.'}</p>
                      <button className="mt-4 inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-md">
                        View Detailed Treatment Plan <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {results.weather && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-900">
                      <div className="font-semibold">Weather Alert</div>
                      <p className="mt-1">{results.weather.description}. Temp {results.weather.temp}°C, humidity {results.weather.humidity}%.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 bg-white rounded-xl border shadow-sm p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CloudIcon className="w-6 h-6 text-blue-600" /> Weather & Pest Risk
                </h3>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <ThermometerSun className="w-8 h-8 text-orange-600" />
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{results.weather?.temp}°C</div>
                      <div className="text-sm text-gray-600">Temperature</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <Droplets className="w-8 h-8 text-blue-600" />
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{results.weather?.humidity}%</div>
                      <div className="text-sm text-gray-600">Humidity</div>
                    </div>
                  </div>
                </div>
                <div className={`p-4 rounded-lg border-2 ${results.pestRisk?.level === 'High' ? 'bg-red-50 border-red-200' : results.pestRisk?.level === 'Medium' ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{results.pestRisk?.level === 'High' ? '🔴' : results.pestRisk?.level === 'Medium' ? '🟡' : '🟢'}</span>
                    <span className="font-bold text-lg">{results.pestRisk?.level} Risk Alert</span>
                  </div>
                  <p className="text-sm text-gray-700">{results.pestRisk?.reason}</p>
                </div>
              </div>

              <div className="mt-8 bg-white rounded-xl border shadow-sm p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-green-600" /> AI Analysis
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Disease Description</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{results.llmAnalysis?.description || 'Not available.'}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">How It Attacked (weather-based)</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{results.llmAnalysis?.causes || 'Not available.'}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Prevention Strategies</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{results.llmAnalysis?.prevention || 'Not available.'}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Care Tips</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{results.llmAnalysis?.tips || 'Not available.'}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Floating Chatbot - visible when results exist */}
      {results && (
        <>
          {!showChat && (
            <button
              onClick={() => setShowChat(true)}
              className="fixed bottom-6 right-6 bg-green-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-green-700 flex items-center gap-2 font-medium"
            >
              <MessageCircle className="w-5 h-5" /> Ask Expert AI
            </button>
          )}

          {showChat && (
            <div className="fixed bottom-6 right-6 w-96 bg-white rounded-2xl shadow-2xl border">
              <div className="bg-green-600 text-white p-4 rounded-t-2xl flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-semibold">Expert AI Assistant</span>
                </div>
                <button onClick={() => setShowChat(false)} className="text-white hover:text-gray-200">✕</button>
              </div>
              <div className="h-96 overflow-y-auto p-4 space-y-3">
                {chatMessages.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <p className="mb-2">👋 Hi! I&apos;m here to help!</p>
                    <p className="text-sm">Ask me about treatments, product sourcing, or best practices.</p>
                  </div>
                )}
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className="text-xs mt-1 opacity-70">{formatTime(msg.timestamp)}</p>
                    </div>
                  </div>
                ))}
                {isSending && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask a question..."
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={isSending}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={isSending || !chatInput.trim()}
                    className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}