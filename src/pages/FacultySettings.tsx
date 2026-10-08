import React, { useState, useEffect } from 'react';
import { CollegeSettings } from '../types';
import { db } from '../services/db';
import { getCurrentDeviceLocation } from '../services/gps';
import { MapPin, Navigation, Save, CheckCircle2, AlertCircle } from 'lucide-react';

export const FacultySettings: React.FC = () => {
  const [settings, setSettings] = useState<CollegeSettings>(db.getCollegeSettings());
  const [collegeName, setCollegeName] = useState(settings.collegeName);
  const [latitude, setLatitude] = useState(settings.latitude.toString());
  const [longitude, setLongitude] = useState(settings.longitude.toString());
  const [allowedRadius, setAllowedRadius] = useState(settings.allowedRadiusMeters.toString());
  const [minAccuracy, setMinAccuracy] = useState(settings.minimumGpsAccuracy.toString());
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: CollegeSettings = {
      ...settings,
      collegeName,
      latitude: parseFloat(latitude) || 23.2156,
      longitude: parseFloat(longitude) || 72.6369,
      allowedRadiusMeters: parseFloat(allowedRadius) || 2000,
      minimumGpsAccuracy: parseFloat(minAccuracy) || 50,
      updatedAt: Date.now()
    };
    db.updateCollegeSettings(updated);
    setSettings(updated);
    setFeedback('College Geofence coordinates successfully updated and deployed!');
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleUseCurrentGPS = async () => {
    try {
      const loc = await getCurrentDeviceLocation();
      setLatitude(loc.latitude.toFixed(6));
      setLongitude(loc.longitude.toFixed(6));
      setFeedback(`Acquired device GPS lock: Lat ${loc.latitude.toFixed(4)}, Lon ${loc.longitude.toFixed(4)}`);
    } catch (err: any) {
      setFeedback('Failed to acquire GPS lock: ' + err.message);
    }
  };

  const handlePreset = (lat: number, lon: number, name: string) => {
    setLatitude(lat.toString());
    setLongitude(lon.toString());
    setFeedback(`Selected Preset: ${name}`);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-900">College Location & GPS Geofence</h2>
        <p className="text-xs text-slate-500">
          Set the official latitude, longitude, and allowed radial attendance perimeter (Default 2 KM).
        </p>
      </div>

      {feedback && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">College / University Name</label>
          <input
            type="text"
            required
            value={collegeName}
            onChange={(e) => setCollegeName(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Campus Latitude</label>
            <input
              type="text"
              required
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Campus Longitude</label>
            <input
              type="text"
              required
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Allowed Radius (Meters)</label>
            <input
              type="number"
              required
              value={allowedRadius}
              onChange={(e) => setAllowedRadius(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">Default allowed boundary is 2000 meters (2 KM)</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Min GPS Accuracy Required (Meters)</label>
            <input
              type="number"
              required
              value={minAccuracy}
              onChange={(e) => setMinAccuracy(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">Rejects GPS spoofers with degraded signals</span>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
          <button
            type="button"
            onClick={handleUseCurrentGPS}
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
          >
            <Navigation className="w-3.5 h-3.5 text-blue-600" />
            Set to Current Device Location
          </button>

          <div className="hidden sm:block text-slate-300">|</div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-[11px] text-slate-400 font-medium">Presets:</span>
            <button
              type="button"
              onClick={() => handlePreset(23.2156, 72.6369, 'GTU Campus Gate')}
              className="px-2.5 py-1 text-[11px] font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200"
            >
              Main Campus
            </button>
            <button
              type="button"
              onClick={() => handlePreset(23.0225, 72.5714, 'City Tech Park')}
              className="px-2.5 py-1 text-[11px] font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200"
            >
              City Tech Park
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <button
            type="submit"
            className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition"
          >
            <Save className="w-4 h-4" />
            Save & Deploy Geofence Settings
          </button>
        </div>
      </form>
    </div>
  );
};
