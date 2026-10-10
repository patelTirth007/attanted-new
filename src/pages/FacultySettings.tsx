import React, { useState, useEffect } from 'react';
import { CollegeSettings } from '../types';
import { db } from '../services/db';
import { getCurrentDeviceLocation, calculateHaversineDistanceMeters } from '../services/gps';
import {
  MapPin,
  Navigation,
  Save,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Building,
  Compass,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Database,
  Check,
  Plus,
  KeyRound,
  ShieldCheck
} from 'lucide-react';

export const FacultySettings: React.FC = () => {
  const [settings, setSettings] = useState<CollegeSettings>(db.getCollegeSettings());
  const [collegeName, setCollegeName] = useState(settings.collegeName);
  const [latitude, setLatitude] = useState(settings.latitude.toString());
  const [longitude, setLongitude] = useState(settings.longitude.toString());
  const [allowedRadius, setAllowedRadius] = useState(settings.allowedRadiusMeters.toString());
  const [minAccuracy, setMinAccuracy] = useState(settings.minimumGpsAccuracy.toString());
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isTestingGps, setIsTestingGps] = useState(false);
  const [testResult, setTestResult] = useState<{
    currentLat: number;
    currentLon: number;
    distance: number;
    accuracy: number;
    isInside: boolean;
  } | null>(null);

  // Database stats
  const [studentsCount, setStudentsCount] = useState(0);
  const [subjectsCount, setSubjectsCount] = useState(0);
  const [lecturesCount, setLecturesCount] = useState(0);
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [hasDemoRecords, setHasDemoRecords] = useState(false);
  const [confirmPurge, setConfirmPurge] = useState(false);

  const refreshStats = () => {
    setStudentsCount(db.getAllStudents().length);
    setSubjectsCount(db.getAllSubjects().length);
    setLecturesCount(db.getAllLectures().length);
    setAttendanceCount(db.getAllAttendance().length);
    setHasDemoRecords(db.hasDemoData());
  };

  useEffect(() => {
    refreshStats();
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const rad = parseFloat(allowedRadius);
    const acc = parseFloat(minAccuracy);

    if (isNaN(lat) || isNaN(lon)) {
      setFeedback('Error: Please enter valid numeric latitude and longitude.');
      return;
    }

    const updated: CollegeSettings = {
      ...settings,
      collegeName: collegeName.trim() || 'College Campus',
      latitude: lat,
      longitude: lon,
      allowedRadiusMeters: rad || 2000,
      minimumGpsAccuracy: acc || 50,
      updatedAt: Date.now()
    };

    db.updateCollegeSettings(updated);
    setSettings(updated);
    setFeedback('✅ Real College campus coordinates & 2 KM geofence saved successfully! All lecture attendance checks will enforce this location.');
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleUseCurrentGPS = async () => {
    setIsLocating(true);
    setFeedback(null);
    try {
      const loc = await getCurrentDeviceLocation();
      setLatitude(loc.latitude.toFixed(6));
      setLongitude(loc.longitude.toFixed(6));
      setFeedback(`📍 Real GPS Coordinates captured: Latitude ${loc.latitude.toFixed(6)}, Longitude ${loc.longitude.toFixed(6)} (GPS Accuracy: ±${Math.round(loc.accuracy)}m)`);
      setTimeout(() => setFeedback(null), 6000);
    } catch (err: any) {
      setFeedback('⚠️ GPS Access note: ' + (err.message || 'Could not access device GPS sensor. Please check browser permissions.'));
    } finally {
      setIsLocating(false);
    }
  };

  const handleTestDistance = async () => {
    setIsTestingGps(true);
    try {
      const loc = await getCurrentDeviceLocation();
      const colLat = parseFloat(latitude) || settings.latitude;
      const colLon = parseFloat(longitude) || settings.longitude;
      const dist = calculateHaversineDistanceMeters(loc.latitude, loc.longitude, colLat, colLon);
      const rad = parseFloat(allowedRadius) || settings.allowedRadiusMeters;

      setTestResult({
        currentLat: loc.latitude,
        currentLon: loc.longitude,
        distance: dist,
        accuracy: loc.accuracy,
        isInside: dist <= rad
      });
    } catch (err: any) {
      setFeedback('⚠️ GPS Test note: ' + (err.message || 'GPS location unavailable.'));
    } finally {
      setIsTestingGps(false);
    }
  };

  const handlePurgeAllDemoData = () => {
    db.purgeAllDemoData();
    refreshStats();
    setConfirmPurge(false);
    setFeedback('✅ All demo records successfully removed! Database is now 100% clean for original college data insertion.');
    setTimeout(() => setFeedback(null), 6000);
  };

  const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
            Faculty Administration Panel
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-2">College Campus Location & Real Data Config</h2>
          <p className="text-xs text-slate-500">
            Define your institution's real GPS geofence and manage real college records without demo placeholder clutter.
          </p>
        </div>

        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="self-start sm:self-auto px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
        >
          <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
          Verify on Google Maps
        </a>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2.5 shadow-sm ${
          feedback.startsWith('Error') || feedback.startsWith('⚠️')
            ? 'bg-rose-50 border border-rose-300 text-rose-800'
            : 'bg-emerald-50 border border-emerald-300 text-emerald-800'
        }`}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* SECTION 1: College Location & Geofence Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-700" />
              Real College Location Settings
            </h3>
            <p className="text-xs text-slate-500">
              Set the exact coordinates where students must be present to mark attendance.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
              <Building className="w-4 h-4 text-blue-700" />
              Official College / University Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Government Engineering College / MIT College of Engineering"
              value={collegeName}
              onChange={(e) => setCollegeName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-blue-700" />
                College Latitude *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 23.215600"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Decimal degrees format (e.g. 23.215600)</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-blue-700" />
                College Longitude *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 72.636900"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Decimal degrees format (e.g. 72.636900)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Allowed Attendance Radius (Meters) *
              </label>
              <input
                type="number"
                required
                min="50"
                max="10000"
                value={allowedRadius}
                onChange={(e) => setAllowedRadius(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Standard radius is <strong>2000 meters (2 KM)</strong>. Students outside this radius are blocked from marking attendance.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Minimum GPS Accuracy Allowed (Meters)
              </label>
              <input
                type="number"
                required
                min="10"
                max="250"
                value={minAccuracy}
                onChange={(e) => setMinAccuracy(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Rejects degraded or spoofed GPS readings (default 50 meters).
              </span>
            </div>
          </div>

          {/* Real Device Location Quick Button */}
          <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-blue-900">Are you currently at your college campus?</h4>
                <p className="text-[11px] text-blue-700">
                  Click below to capture your real phone / device GPS coordinates and set them as your institution's center.
                </p>
              </div>
              <button
                type="button"
                disabled={isLocating}
                onClick={handleUseCurrentGPS}
                className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5 shrink-0"
              >
                {isLocating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4" />
                )}
                Capture My Real GPS Coordinates
              </button>
            </div>
          </div>

          {/* Test Real Distance & Geofence Button */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-slate-800">Verify Geofence with Real Device GPS</h4>
                <p className="text-[11px] text-slate-500">
                  Test whether your current physical device location falls inside the {allowedRadius || 2000}m college perimeter.
                </p>
              </div>
              <button
                type="button"
                disabled={isTestingGps}
                onClick={handleTestDistance}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 shrink-0"
              >
                {isTestingGps ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Compass className="w-4 h-4" />
                )}
                Test Live GPS Geofence
              </button>
            </div>

            {testResult && (
              <div className={`p-3.5 rounded-xl text-xs border ${
                testResult.isInside
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}>
                <div className="font-bold flex items-center justify-between">
                  <span>
                    Status: {testResult.isInside ? 'INSIDE COLLEGE ATTENDANCE ZONE' : 'OUTSIDE COLLEGE ATTENDANCE ZONE'}
                  </span>
                  <span className="font-mono">
                    Distance: {testResult.distance >= 1000 ? `${(testResult.distance / 1000).toFixed(2)} KM` : `${Math.round(testResult.distance)} meters`}
                  </span>
                </div>
                <div className="text-[11px] mt-1 space-y-0.5 opacity-80">
                  <div>Your Device GPS: {testResult.currentLat.toFixed(6)}, {testResult.currentLon.toFixed(6)} (Accuracy ±{Math.round(testResult.accuracy)}m)</div>
                  <div>College Coordinates: {latitude}, {longitude} • Max Allowed: {allowedRadius}m</div>
                </div>
              </div>
            )}
          </div>

          {/* Save button */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition"
            >
              <Save className="w-4 h-4" />
              Save Real College Location
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 2: Faculty Secret Security Authorization Code (SSIT@1900) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-purple-700" />
              Faculty Secret Security Authorization Code
            </h3>
            <p className="text-xs text-slate-500">
              Official institutional key required to authorize faculty accounts and administrative panel access.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
            <ShieldCheck className="w-3.5 h-3.5" />
            Active Institutional Key
          </span>
        </div>

        <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 block mb-1">
              Official Faculty Registration & Administrative Code
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xl font-black text-purple-900 bg-white px-3 py-1 rounded-lg border border-purple-300 shadow-xs">
                SSIT@1900
              </span>
              <span className="text-xs font-semibold text-purple-700">SSIT Campus Authorized</span>
            </div>
            <p className="text-[11px] text-purple-600/90 mt-2">
              New faculty staff must enter this secret code (<code>SSIT@1900</code>) during account registration to receive faculty administration privileges.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText('SSIT@1900');
              alert('Copied Faculty Secret Code: SSIT@1900');
            }}
            className="px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 self-start sm:self-auto shrink-0"
          >
            <KeyRound className="w-3.5 h-3.5" />
            Copy Code (SSIT@1900)
          </button>
        </div>
      </div>

      {/* SECTION 3: Original Data Management & Clean Slate */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-700" />
              Original College Data Management
            </h3>
            <p className="text-xs text-slate-500">
              Wipe pre-seeded demo records to build your institution's live database with genuine college data.
            </p>
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md border ${
            hasDemoRecords
              ? 'bg-amber-50 text-amber-800 border-amber-300'
              : 'bg-emerald-50 text-emerald-800 border-emerald-300'
          }`}>
            {hasDemoRecords ? 'Demo Filler Present' : 'Pure Original Data Mode'}
          </span>
        </div>

        {/* Database Records Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Enrolled Students</span>
            <div className="text-xl font-black text-slate-900 mt-1">{studentsCount}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Academic Subjects</span>
            <div className="text-xl font-black text-slate-900 mt-1">{subjectsCount}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Active Lectures</span>
            <div className="text-xl font-black text-slate-900 mt-1">{lecturesCount}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Logged Attendance</span>
            <div className="text-xl font-black text-slate-900 mt-1">{attendanceCount}</div>
          </div>
        </div>

        {/* Purge Demo Data Action */}
        <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Remove All Demo Data & Start Clean
              </h4>
              <p className="text-[11px] text-rose-700">
                Purges all sample students, sample subjects, sample lectures, and test attendance. Your faculty account and college location will remain intact.
              </p>
            </div>

            {!confirmPurge ? (
              <button
                type="button"
                onClick={() => setConfirmPurge(true)}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5 shrink-0"
              >
                <Trash2 className="w-4 h-4" />
                Remove All Demo Data
              </button>
            ) : (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setConfirmPurge(false)}
                  className="px-3 py-2 bg-white border border-slate-300 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePurgeAllDemoData}
                  className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  Confirm & Wipe Demo Records
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
