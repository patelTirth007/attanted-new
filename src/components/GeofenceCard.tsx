import React from 'react';
import { GeofenceVerificationResult } from '../services/gps';
import { MapPin, Navigation, ShieldCheck, ShieldAlert } from 'lucide-react';

interface GeofenceCardProps {
  result?: GeofenceVerificationResult;
  collegeLat: number;
  collegeLon: number;
  allowedRadius: number;
  onSimulate?: (simulatedDistance: number) => void;
}

export const GeofenceCard: React.FC<GeofenceCardProps> = ({
  result,
  collegeLat,
  collegeLon,
  allowedRadius,
  onSimulate
}) => {
  const isInside = result ? result.isInsideZone : true;
  const distance = result ? Math.round(result.distanceMeters) : 450;
  const accuracy = result ? Math.round(result.accuracy) : 12;

  return (
    <div className={`rounded-xl border p-4 transition-all ${
      isInside 
        ? 'bg-white border-emerald-300 shadow-sm' 
        : 'bg-rose-50/50 border-rose-300 shadow-sm'
    }`}>
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          {isInside ? (
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
          )}
          <div>
            <h4 className={`text-sm font-bold ${isInside ? 'text-emerald-800' : 'text-rose-800'}`}>
              {isInside ? 'INSIDE COLLEGE ZONE' : 'OUTSIDE ATTENDANCE ZONE'}
            </h4>
            <p className="text-xs text-slate-500">GPS Geofence Verification</p>
          </div>
        </div>

        <div className={`px-2.5 py-1 rounded-md text-xs font-bold ${
          isInside ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
        }`}>
          {distance}m / {allowedRadius}m Allowed
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 my-3 text-xs">
        <div>
          <span className="text-slate-400 block mb-0.5">Current Coordinates</span>
          <span className="font-semibold text-slate-700 flex items-center gap-1">
            <Navigation className="w-3.5 h-3.5 text-blue-600 inline" />
            {result?.latitude.toFixed(4) || '23.2185'}, {result?.longitude.toFixed(4) || '72.6395'}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block mb-0.5">College Coordinates</span>
          <span className="font-semibold text-slate-700 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-500 inline" />
            {collegeLat.toFixed(4)}, {collegeLon.toFixed(4)}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block mb-0.5">Distance from College</span>
          <span className={`font-bold ${isInside ? 'text-emerald-700' : 'text-rose-700'}`}>
            {distance} meters
          </span>
        </div>
        <div>
          <span className="text-slate-400 block mb-0.5">GPS Accuracy</span>
          <span className="font-semibold text-slate-700">±{accuracy} meters</span>
        </div>
      </div>

      {!isInside && (
        <div className="mt-2 p-2.5 bg-rose-100/70 border border-rose-200 text-rose-800 rounded-lg text-xs leading-relaxed font-medium">
          ⚠️ Attendance cannot be marked because you are outside the 2 KM college attendance zone.
        </div>
      )}

      {onSimulate && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <span className="text-[11px] text-slate-500 font-medium">Test Zone:</span>
          <div className="flex gap-2">
            <button
              onClick={() => onSimulate(450)}
              className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            >
              Simulate Inside (450m)
            </button>
            <button
              onClick={() => onSimulate(3200)}
              className="px-2.5 py-1 text-xs font-semibold rounded bg-rose-100 hover:bg-rose-200 text-rose-700 transition"
            >
              Simulate Outside (3.2km)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
