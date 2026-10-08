import React, { useRef, useEffect, useState } from 'react';
import { Camera, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';

interface CameraViewProps {
  challengeTitle: string;
  challengeInstruction: string;
  statusText: string;
  isVerified: boolean;
  onCapture: (canvas: HTMLCanvasElement) => void;
  className?: string;
}

export const CameraView: React.FC<CameraViewProps> = ({
  challengeTitle,
  challengeInstruction,
  statusText,
  isVerified,
  onCapture,
  className = ''
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    let currentStream: MediaStream | null = null;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 }
          },
          audio: false
        });
        currentStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setStreamActive(true);
        }
      } catch (err: any) {
        console.warn('Camera stream error / fallback mode:', err);
        setCameraError('Camera access not detected or blocked. You can still use the simulated capture.');
      }
    }

    startCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 320;
    canvas.height = 320;

    if (videoRef.current && streamActive) {
      ctx.drawImage(videoRef.current, 0, 0, 320, 320);
    } else {
      // Draw simulated biometric face capture
      ctx.fillStyle = '#E2E8F0';
      ctx.fillRect(0, 0, 320, 320);
      ctx.fillStyle = '#1E40AF';
      ctx.beginPath();
      ctx.arc(160, 160, 80, 0, Math.PI * 2);
      ctx.fill();
    }

    onCapture(canvas);
  };

  return (
    <div className={`relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-md ${className}`}>
      {/* Hidden Canvas for capture analysis */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Video View */}
      <div className="relative w-full h-[280px] bg-slate-950 flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transform -scale-x-100 ${!streamActive ? 'opacity-30' : ''}`}
        />

        {!streamActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <Camera className="w-12 h-12 text-slate-500 mb-2 animate-pulse" />
            <span className="text-xs text-slate-400 max-w-xs">
              {cameraError || 'Initializing Camera Feed...'}
            </span>
          </div>
        )}

        {/* Face Guide Oval */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`w-[170px] h-[220px] rounded-[85px] border-2 transition-all duration-300 ${
            isVerified 
              ? 'border-emerald-400 ring-4 ring-emerald-400/30' 
              : 'border-blue-400/80 ring-2 ring-blue-400/20'
          }`} />
        </div>

        {/* Challenge prompt overlay */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-slate-900/85 backdrop-blur border border-slate-700 text-white px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-md flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
          {challengeTitle}
        </div>

        {/* Status bar bottom overlay */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur px-4 py-1.5 rounded-full text-xs font-medium text-white shadow-md flex items-center gap-2 border border-slate-700">
          {isVerified ? (
            <>
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-300 font-semibold">{statusText}</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
              <span>{statusText}</span>
            </>
          )}
        </div>
      </div>

      {/* Guide & Controls */}
      <div className="p-3 bg-slate-800/90 text-center flex items-center justify-between gap-3 text-xs">
        <span className="text-slate-300 text-left truncate">{challengeInstruction}</span>
        <button
          onClick={handleCapture}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg flex items-center gap-1.5 shadow transition shrink-0"
        >
          <Camera className="w-4 h-4" />
          Capture Pose
        </button>
      </div>
    </div>
  );
};
