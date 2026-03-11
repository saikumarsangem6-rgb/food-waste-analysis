import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Camera, Video, VideoOff, Trash2, 
  BarChart3, RefreshCw, ChevronLeft, 
  AlertCircle, CheckCircle2, Loader2,
  TrendingUp, TrendingDown, Info, Upload,
  FileVideo, FileImage
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import InchargeLayout from '../../layouts/InchargeLayout';

export default function WasteAnalysis() {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'camera' | 'image' | 'video'>('camera');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);

  // Mock statistics for the chart
  const [stats, setStats] = useState([
    { name: 'Rice', amount: 45, color: '#10b981' },
    { name: 'Dal', amount: 20, color: '#3b82f6' },
    { name: 'Curry', amount: 35, color: '#f59e0b' },
    { name: 'Roti', amount: 15, color: '#ef4444' },
    { name: 'Salad', amount: 5, color: '#8b5cf6' },
  ]);

  useEffect(() => {
    if (mediaType === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [mediaType]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: false 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access camera. Please ensure permissions are granted.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current && mediaType === 'camera') {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const imageData = canvasRef.current.toDataURL('image/jpeg');
        setCapturedImage(imageData);
        setPreviewUrl(imageData);
        setMediaType('image');
        analyzeImage(imageData);
      }
    }
  };

  const startRecording = () => {
    if (videoRef.current) {
      const stream = videoRef.current.srcObject as MediaStream;
      if (stream) {
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        const chunks: Blob[] = [];
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
            setRecordedChunks(chunks);
          }
        };
        mediaRecorder.start();
        setIsRecording(true);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const resetToCamera = () => {
    setCapturedImage(null);
    setPreviewUrl(null);
    setAnalysis(null);
    setError(null);
    setMediaType('camera');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          setCapturedImage(result);
          setPreviewUrl(result);
          setMediaType('image');
          analyzeImage(result);
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('video/')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setMediaType('video');
      }
    }
  };

  const analyzeImage = async (base64Image: string) => {
    setLoading(true);
    setError(null);
    setAnalysis(null);

    const applyResult = (result: any) => {
      setAnalysis(result);
      if (result.item) {
        setStats(prev => {
          const exists = prev.some(s => s.name.toLowerCase() === result.item.toLowerCase());
          if (exists) {
            return prev.map(s => 
              s.name.toLowerCase() === result.item.toLowerCase() 
                ? { ...s, amount: s.amount + 5 } : s
            );
          } else {
            const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
            return [...prev, { name: result.item, amount: 5, color: colors[prev.length % colors.length] }];
          }
        });
      }
    };

    try {
      const serverRes = await fetch('/api/ai/detect-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image })
      });
      if (serverRes.ok) {
        const serverResult = await serverRes.json();
        if (serverResult.success && serverResult.data) {
          applyResult(serverResult.data);
          return;
        }
      }
      throw new Error("YOLO detection server unavailable");
    } catch (err) {
      console.error("YOLO detection failed:", err);
      setError("Could not analyze image. Make sure the FastAPI backend is running (python backend/main.py).");
    } finally {
      setLoading(false);
    }
  };

  return (
    <InchargeLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Camera Feed Section */}
        <section className="bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl relative aspect-video flex items-center justify-center">
          {mediaType === 'camera' && (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover"
            />
          )}
          
          {mediaType === 'image' && previewUrl && (
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          )}

          {mediaType === 'video' && previewUrl && (
            <video 
              ref={previewVideoRef}
              src={previewUrl}
              autoPlay 
              controls
              className="w-full h-full object-contain"
            />
          )}

          <canvas ref={canvasRef} className="hidden" />
          
          {/* Overlay Controls */}
          <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-6 px-6">
            {mediaType === 'camera' ? (
              <>
                <button 
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`p-4 rounded-full transition-all ${isRecording ? 'bg-red-500 text-white scale-110' : 'bg-white/20 text-white backdrop-blur-md hover:bg-white/30'}`}
                  title={isRecording ? "Stop Recording" : "Start Recording"}
                >
                  {isRecording ? <VideoOff size={28} /> : <Video size={28} />}
                </button>
                
                <button 
                  onClick={captureImage}
                  className="w-20 h-20 rounded-full bg-white border-4 border-white/30 flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all"
                  title="Capture Image"
                >
                  <div className="w-16 h-16 rounded-full border-2 border-slate-900 flex items-center justify-center">
                    <Camera size={32} className="text-slate-900" />
                  </div>
                </button>
              </>
            ) : (
              <button 
                onClick={resetToCamera}
                className="px-6 py-3 rounded-full bg-white text-slate-900 font-bold flex items-center gap-2 shadow-xl hover:scale-105 transition-all"
              >
                <RefreshCw size={20} />
                Reset to Camera
              </button>
            )}

            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-4 rounded-full bg-white/20 text-white backdrop-blur-md hover:bg-white/30 transition-all"
              title="Upload File"
            >
              <Upload size={28} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*,video/*"
              onChange={handleFileUpload}
            />
          </div>

          {isRecording && (
            <div className="absolute top-6 left-6 bg-red-500 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              Recording
            </div>
          )}

          {mediaType !== 'camera' && (
            <div className="absolute top-6 left-6 bg-blue-500 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-2">
              {mediaType === 'image' ? <FileImage size={14} /> : <FileVideo size={14} />}
              {mediaType === 'image' ? 'Image Preview' : 'Video Preview'}
            </div>
          )}
        </section>

        {error && (
          <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600">
            <AlertCircle size={20} />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Analysis Results */}
          <section className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Trash2 size={20} className="text-emerald-600" />
                AI Analysis
              </h2>
              {loading && <Loader2 size={20} className="text-emerald-600 animate-spin" />}
            </div>

            {analysis ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                  <p className="text-xs text-emerald-600 font-bold uppercase mb-1">Primary Detection</p>
                  <h3 className="text-2xl font-bold text-emerald-900">{analysis.item}</h3>
                  <div className="mt-2 bg-emerald-200/50 rounded-full h-2 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${analysis.confidence}%` }}></div>
                  </div>
                  <p className="text-[10px] text-emerald-600 mt-1">{analysis.confidence}% confidence</p>
                </div>

                {/* All detected items */}
                {analysis.items && analysis.items.length > 1 && (
                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 space-y-2">
                    <p className="text-xs text-blue-600 font-bold uppercase mb-2">All Detected Items</p>
                    {analysis.items.map((det: any, i: number) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-sm font-medium text-slate-700 w-24 truncate">{det.name}</span>
                        <div className="flex-1 bg-blue-100 rounded-full h-2 overflow-hidden">
                          <div className="bg-blue-500 h-full rounded-full" style={{ width: `${det.confidence}%` }}></div>
                        </div>
                        <span className="text-[10px] text-blue-600 font-bold w-10 text-right">{det.confidence}%</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Confidence</p>
                    <p className="text-lg font-bold text-slate-700">{analysis.confidence}%</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Est. Weight</p>
                    <p className="text-lg font-bold text-slate-700">{analysis.estimatedWeight}</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Visual Cues Used</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{analysis.reason}</p>
                </div>

                <button 
                  onClick={() => setAnalysis(null)}
                  className="w-full py-3 text-slate-400 text-xs font-bold uppercase hover:text-slate-600 transition-all"
                >
                  Clear Analysis
                </button>
              </motion.div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="h-64 flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed border-slate-100 rounded-3xl cursor-pointer hover:bg-slate-50 transition-all"
              >
                <div className="flex gap-4">
                  <div className="p-4 bg-slate-50 rounded-full text-slate-300">
                    <FileImage size={32} />
                  </div>
                  <div className="p-4 bg-slate-50 rounded-full text-slate-300">
                    <FileVideo size={32} />
                  </div>
                </div>
                <div>
                  <p className="text-slate-500 font-medium">Click to upload media</p>
                  <p className="text-xs text-slate-400">Support for images and videos</p>
                </div>
              </div>
            )}
          </section>

          {/* Statistics Section */}
          <section className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 size={20} className="text-blue-600" />
              Waste Statistics
            </h2>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                  />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                    {stats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-sm font-medium text-slate-600">Daily Average</span>
                </div>
                <span className="font-bold text-slate-800">24.5kg</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-sm font-medium text-slate-600">Peak Waste Item</span>
                </div>
                <span className="font-bold text-slate-800">Rice</span>
              </div>
            </div>
          </section>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ActionCard 
            icon={<TrendingUp className="text-emerald-600" />} 
            label="Efficiency" 
            value="+12%" 
            sub="vs last week"
          />
          <ActionCard 
            icon={<TrendingDown className="text-red-500" />} 
            label="Daily Waste" 
            value="18.2kg" 
            sub="-4.5kg reduction"
          />
          <ActionCard 
            icon={<Info className="text-blue-500" />} 
            label="Alerts" 
            value="2" 
            sub="Action required"
          />
        </div>
      </div>
    </InchargeLayout>
  );
}

function ActionCard({ icon, label, value, sub }: any) {
  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
      <div className="p-3 bg-slate-50 rounded-2xl">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase text-slate-400">{label}</p>
        <p className="text-lg font-bold text-slate-800">{value}</p>
        <p className="text-[10px] text-slate-500">{sub}</p>
      </div>
    </div>
  );
}

