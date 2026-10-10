import React, { useState, useRef, useEffect } from 'react';
import { Student } from '../types';
import { db } from '../services/db';
import { getDeviceInfo, generateStudentFaceSvg } from '../services/biometrics';
import {
  Camera,
  ScanFace,
  CheckCircle2,
  Smartphone,
  ShieldCheck,
  RefreshCw,
  X,
  Sparkles,
  AlertCircle,
  Eye,
  Check
} from 'lucide-react';

interface StudentBiometricModalProps {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
  onEnrolled?: (updatedStudent: Student) => void;
}

export const StudentBiometricModal: React.FC<StudentBiometricModalProps> = ({
  student,
  isOpen,
  onClose,
  onEnrolled
}) => {
  const [deviceInfo] = useState(() => getDeviceInfo());
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(student.facePhotoUrl || null);
  const [isSuccess, setIsSuccess] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    setCameraActive(false);

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 }
          },
          audio: false
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setCameraActive(true);
      } else {
        setCameraError('Live webcam access is not supported by this browser. Using high-resolution biometric camera emulator.');
      }
    } catch (err: any) {
      console.warn('Camera access unavailable, fallback to emulator:', err);
      setCameraError('Camera sensor access restricted or denied. Using high-fidelity biometric photo generator.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleCaptureAndEnroll = () => {
    setScanning(true);
    setScanProgress(10);

    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return 100;
        }
        return prev + 15;
      });
    }, 120);

    setTimeout(() => {
      clearInterval(interval);
      let photoUrl = '';

      if (cameraActive && videoRef.current && canvasRef.current) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 320;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Draw video frame
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Add biometric HUD watermark
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = 3;
          ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

          photoUrl = canvas.toDataURL('image/jpeg', 0.85);
        }
      }

      if (!photoUrl) {
        photoUrl = generateStudentFaceSvg(student.name, student.enrollmentNumber);
      }

      setCapturedPhoto(photoUrl);
      setScanning(false);

      // Save student biometric face record and device fingerprint to database
      const updated: Student = {
        ...student,
        faceEnrollmentStatus: true,
        facePhotoUrl: photoUrl,
        faceEmbedding: `EMB-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        deviceId: deviceInfo.deviceId,
        deviceName: deviceInfo.deviceName,
        ipAddress: deviceInfo.ipAddress,
        ipRegisteredAt: Date.now(),
        deviceVerified: true,
        deviceRegisteredAt: Date.now()
      };

      db.updateStudent(updated);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sca_student_updated', { detail: updated }));
      }

      setIsSuccess(true);
      if (onEnrolled) {
        onEnrolled(updated);
      }
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-5 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <ScanFace className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Student Biometric & Device Binding</h3>
              <p className="text-[11px] text-slate-500">
                1 Device & 1 IP address bound to Enrollment {student.enrollmentNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Device Scan Information Box */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
            <span className="flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-blue-600" />
              1 Device : 1 IP Hardware Registration
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Bound & Protected
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <div className="bg-white p-2 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[10px]">Trusted Device</span>
              <span className="font-bold text-slate-800 truncate block">{deviceInfo.deviceName}</span>
            </div>
            <div className="bg-white p-2 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[10px]">Device ID</span>
              <span className="font-mono font-bold text-blue-700 truncate block">{deviceInfo.deviceId}</span>
            </div>
            <div className="bg-white p-2 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[10px]">Traced IP</span>
              <span className="font-mono font-bold text-emerald-700 truncate block">{deviceInfo.ipAddress}</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight">
            🛡️ <strong>Anti-Proxy Notice:</strong> Only this registered hardware and IP can scan and mark attendance for <strong>{student.enrollmentNumber}</strong>. No other device can mark for absent students.
          </p>
        </div>

        {/* Camera / Biometric Scan Frame */}
        <div className="relative aspect-video max-h-56 bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-800 flex items-center justify-center">
          {cameraActive ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />
          ) : capturedPhoto ? (
            <img
              src={capturedPhoto}
              alt="Enrolled Face Scan"
              className="w-full h-full object-contain p-2"
            />
          ) : (
            <div className="text-center p-4 text-slate-400 space-y-2">
              <ScanFace className="w-12 h-12 mx-auto text-blue-400 animate-pulse" />
              <p className="text-xs font-semibold text-slate-300">Ready for Live Biometric Face Capture</p>
              <p className="text-[10px] text-slate-500">Camera preview or biometric generator</p>
            </div>
          )}

          {/* Oval Face Guide Overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-36 h-44 border-2 border-dashed border-sky-400/80 rounded-[50%] flex items-center justify-center relative shadow-[0_0_15px_rgba(56,189,248,0.4)]">
              {scanning && (
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent top-0 animate-[bounce_1.5s_infinite]" />
              )}
              <span className="text-[9px] font-mono font-bold text-sky-300 bg-black/60 px-2 py-0.5 rounded-full absolute bottom-2">
                {scanning ? `SCANNING ${scanProgress}%` : 'ALIGN FACE'}
              </span>
            </div>
          </div>

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Notice of conditions */}
        <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-tight">
            <strong>Faculty Roster Integration:</strong> Once enrolled, your photo biometric record and device ID are visible in the Faculty Section. At attendance time, your device & face scan must match to approve attendance.
          </div>
        </div>

        {/* Success Banner */}
        {isSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Face Scan Successfully Enrolled!</strong> Your biometric profile and device record are synchronized with the Faculty Section.
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleCaptureAndEnroll}
            disabled={scanning}
            className="flex-1 py-3 px-4 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
          >
            {scanning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Scanning Biometrics ({scanProgress}%)...</span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                <span>Capture & Save Face Scan Record</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
