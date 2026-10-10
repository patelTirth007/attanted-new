import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Lecture, AttendanceQRPayload } from '../types';
import { db } from '../services/db';
import { getCurrentDeviceLocation } from '../services/gps';
import {
  QrCode,
  RefreshCw,
  Maximize2,
  Minimize2,
  MapPin,
  ShieldCheck,
  Radio,
  Clock,
  Key,
  Copy,
  Check,
  Download,
  AlertTriangle,
  Smartphone
} from 'lucide-react';

interface FacultyQRCodeGeneratorProps {
  lecture: Lecture;
  onSessionUpdated?: (updatedLecture: Lecture) => void;
  attendanceCount?: number;
}

export const FacultyQRCodeGenerator: React.FC<FacultyQRCodeGeneratorProps> = ({
  lecture,
  onSessionUpdated,
  attendanceCount = 0
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncingGps, setIsSyncingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [copiedPasscode, setCopiedPasscode] = useState(false);

  // Auto-refresh countdown (60 seconds cycle)
  const [countdown, setCountdown] = useState(60);

  // Active coordinates (defaults to lecture's classroom coordinates or college baseline)
  const [facultyCoords, setFacultyCoords] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  }>({
    latitude: lecture.facultyLatitude || 23.21562,
    longitude: lecture.facultyLongitude || 72.63692,
    accuracy: 5
  });

  const [sessionToken, setSessionToken] = useState<string>(
    lecture.qrSessionToken || `QR-${lecture.subjectCode}-${Date.now().toString(36)}`
  );
  const [passcode, setPasscode] = useState<string>(
    lecture.qrPasscode || Math.floor(100000 + Math.random() * 900000).toString()
  );

  // Generate QR code data URL whenever session parameters change
  useEffect(() => {
    generateQR();
  }, [lecture.id, facultyCoords.latitude, facultyCoords.longitude, sessionToken, passcode]);

  // Countdown timer for rotating security token
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          handleRotateToken();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lecture.id, facultyCoords]);

  const generateQR = async () => {
    try {
      const payload: AttendanceQRPayload = {
        lectureId: lecture.id,
        subjectCode: lecture.subjectCode,
        subjectName: lecture.subjectName,
        facultyId: lecture.facultyId,
        facultyName: lecture.facultyName,
        room: lecture.room,
        facultyLat: facultyCoords.latitude,
        facultyLng: facultyCoords.longitude,
        allowedRadiusMeters: lecture.geofenceRadiusMeters || 100, // 100-meter limit
        passcode: passcode,
        token: sessionToken,
        timestamp: Date.now(),
        expiresAt: Date.now() + 120000 // 2 minutes window
      };

      const payloadString = JSON.stringify(payload);
      const url = await QRCode.toDataURL(payloadString, {
        width: 380,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      });
      setQrDataUrl(url);
    } catch (err) {
      console.error('Failed to generate QR Code:', err);
    }
  };

  const handleRotateToken = () => {
    setIsRefreshing(true);
    const newToken = `QR-${lecture.subjectCode}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const newPasscode = Math.floor(100000 + Math.random() * 900000).toString();

    setSessionToken(newToken);
    setPasscode(newPasscode);
    setCountdown(60);

    // Save to db
    const updated = db.updateLectureQRSession(lecture.id, {
      facultyLatitude: facultyCoords.latitude,
      facultyLongitude: facultyCoords.longitude,
      geofenceRadiusMeters: 100,
      qrSessionToken: newToken,
      qrPasscode: newPasscode
    });

    if (updated && onSessionUpdated) {
      onSessionUpdated(updated);
    }

    setTimeout(() => setIsRefreshing(false), 300);
  };

  const handleSyncFacultyHandheldGps = async () => {
    setIsSyncingGps(true);
    setGpsError(null);
    try {
      const loc = await getCurrentDeviceLocation({
        latitude: lecture.facultyLatitude || 23.21562,
        longitude: lecture.facultyLongitude || 72.63692
      });

      setFacultyCoords({
        latitude: loc.latitude,
        longitude: loc.longitude,
        accuracy: Math.round(loc.accuracy)
      });

      // Update lecture coordinates in DB
      const updated = db.updateLectureQRSession(lecture.id, {
        facultyLatitude: loc.latitude,
        facultyLongitude: loc.longitude,
        geofenceRadiusMeters: 100,
        qrSessionToken: sessionToken,
        qrPasscode: passcode
      });

      if (updated && onSessionUpdated) {
        onSessionUpdated(updated);
      }
    } catch (err: any) {
      setGpsError(err.message || 'Could not fetch device GPS.');
    } finally {
      setIsSyncingGps(false);
    }
  };

  const handleUseCampusCoords = () => {
    const settings = db.getCollegeSettings();
    setFacultyCoords({
      latitude: settings.latitude,
      longitude: settings.longitude,
      accuracy: 5
    });

    const updated = db.updateLectureQRSession(lecture.id, {
      facultyLatitude: settings.latitude,
      facultyLongitude: settings.longitude,
      geofenceRadiusMeters: 100,
      qrSessionToken: sessionToken,
      qrPasscode: passcode
    });

    if (updated && onSessionUpdated) {
      onSessionUpdated(updated);
    }
  };

  const handleCopyPasscode = () => {
    navigator.clipboard.writeText(passcode);
    setCopiedPasscode(true);
    setTimeout(() => setCopiedPasscode(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `attendance_qr_${lecture.subjectCode}_100m.png`;
    a.click();
  };

  return (
    <>
      {/* Embedded Component Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-5 sm:p-7 shadow-xl border border-slate-700/60 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-700/60">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  100-Meter Handheld Geofence Active
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {lecture.room}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <QrCode className="w-6 h-6 text-blue-400" />
                Live Attendance QR Code
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Students must scan this QR code within <strong>100 meters</strong> of faculty handheld device.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={handleRotateToken}
                disabled={isRefreshing}
                className="px-3 py-2 bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
                title="Generate new token"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh QR
              </button>

              <button
                onClick={() => setIsFullscreen(true)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition active:scale-95"
                title="Projector / Fullscreen Presentation"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                Projector Mode
              </button>
            </div>
          </div>

          {/* Main Content: Left QR Code + Right Device Proximity & Controls */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-6 items-center">
            {/* Left: QR Code Display Frame */}
            <div className="md:col-span-5 flex flex-col items-center justify-center">
              <div className="relative p-3.5 bg-white rounded-2xl shadow-2xl border-4 border-slate-700/80 group">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Attendance QR Code"
                    className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-xl select-none"
                  />
                ) : (
                  <div className="w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center bg-slate-100 rounded-xl">
                    <RefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
                  </div>
                )}

                {/* 100-meter badge badge overlay */}
                <div className="absolute -top-3 -right-3 bg-emerald-600 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-full shadow-lg border-2 border-white flex items-center gap-1">
                  <Radio className="w-3 h-3" />
                  100M RANGE
                </div>
              </div>

              {/* Countdown Progress Bar */}
              <div className="w-56 sm:w-64 mt-3 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-blue-400" /> Rotating Token
                  </span>
                  <span className="text-white font-bold">{countdown}s</span>
                </div>
                <div className="w-full bg-slate-700/70 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-400 h-full rounded-full transition-all duration-1000 ease-linear"
                    style={{ width: `${(countdown / 60) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Right: Handheld Device GPS & 6-Digit Code */}
            <div className="md:col-span-7 space-y-4">
              {/* 6-Digit Passcode Box */}
              <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold mb-1">
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    Backup 6-Digit Session Passcode
                  </div>
                  <div className="font-mono text-2xl sm:text-3xl font-black text-amber-300 tracking-widest">
                    {passcode}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    For students with camera issues (100m GPS check still enforced).
                  </p>
                </div>

                <button
                  onClick={handleCopyPasscode}
                  className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition self-start sm:self-auto shrink-0"
                >
                  {copiedPasscode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Code
                    </>
                  )}
                </button>
              </div>

              {/* Faculty Handheld GPS Coordinates & Sync */}
              <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Faculty Handheld Device GPS</h4>
                      <p className="text-[11px] text-slate-400">
                        Acts as the center point of the 100-meter geofence
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleUseCampusCoords}
                      className="px-2.5 py-1.5 bg-slate-700/80 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-semibold rounded-xl flex items-center gap-1 transition"
                      title="Reset coordinates to campus defaults"
                    >
                      Campus GPS
                    </button>
                    <button
                      onClick={handleSyncFacultyHandheldGps}
                      disabled={isSyncingGps}
                      className="px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/50 text-blue-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
                    >
                      <RefreshCw className={`w-3 h-3 ${isSyncingGps ? 'animate-spin' : ''}`} />
                      {isSyncingGps ? 'Syncing...' : 'Sync Device GPS'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Latitude / Longitude</span>
                    <span className="font-mono font-bold text-white text-[11px]">
                      {facultyCoords.latitude.toFixed(5)}°, {facultyCoords.longitude.toFixed(5)}°
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Enforced Geofence Radius</span>
                    <span className="font-bold text-emerald-400 text-[11px] flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Under 100 Meters Only
                    </span>
                  </div>
                </div>

                {gpsError && (
                  <div className="text-[11px] text-rose-300 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" /> {gpsError}
                  </div>
                )}
              </div>

              {/* Status & Quick Stats */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="text-xs text-slate-300 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span><strong>{attendanceCount}</strong> attendance records verified in this session</span>
                </div>

                <button
                  onClick={handleDownloadQR}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> Download QR Image
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen / Projector Mode Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-between p-6 sm:p-10 animate-fade-in text-white overflow-y-auto">
          {/* Top Bar */}
          <div className="w-full max-w-5xl flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg">
                {lecture.subjectCode}
              </span>
              <div>
                <h2 className="text-xl sm:text-2xl font-black">{lecture.subjectName}</h2>
                <p className="text-xs text-slate-400">
                  {lecture.room} • Faculty: {lecture.facultyName} • Radius: 100m
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsFullscreen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Minimize2 className="w-4 h-4" /> Exit Fullscreen
            </button>
          </div>

          {/* Center Projector Content */}
          <div className="flex flex-col items-center justify-center my-auto py-6 text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold animate-pulse">
              <Radio className="w-4 h-4" />
              Active 100-Meter Classroom Geofence: Scan to Mark Present
            </div>

            <div className="p-6 bg-white rounded-3xl shadow-2xl border-8 border-slate-800 inline-block">
              <img
                src={qrDataUrl}
                alt="Attendance QR Large"
                className="w-72 h-72 sm:w-96 sm:h-96 object-contain"
              />
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Backup Passcode (if camera blocked)
              </div>
              <div className="font-mono text-4xl sm:text-5xl font-black text-amber-300 tracking-widest">
                {passcode}
              </div>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Attendance is strictly verified within 100 meters of faculty handheld device. Single email ID rule active.
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>Token auto-rotates in <strong className="text-white">{countdown}s</strong></span>
              <span>•</span>
              <span>{attendanceCount} Present</span>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="w-full max-w-5xl flex items-center justify-between border-t border-slate-800 pt-4 text-xs text-slate-500">
            <span>Smart College Attendance System • 100M QR Proximity Engine</span>
            <span>Faculty Handheld GPS Active: {facultyCoords.latitude.toFixed(4)}°, {facultyCoords.longitude.toFixed(4)}°</span>
          </div>
        </div>
      )}
    </>
  );
};
