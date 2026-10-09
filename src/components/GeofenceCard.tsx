import React from 'react';
import { GeofenceVerificationResult } from '../services/gps';
import { MapPin, Navigation, ShieldCheck, ShieldAlert, RefreshCw, ExternalLink } from 'lucide-react';

interface GeofenceCardProps {
  result?: GeofenceVerificationResult;
  collegeLat: number;
  collegeLon: number;
  allowedRadius: number;
  onRefreshGPS?: () => void;
  isRefreshing?: boolean;
}

export const GeofenceCard: React.FC<GeofenceCardProps> = ({
  result,
  collegeLat,
  collegeLon,
  allowedRadius,
  onRefreshGPS,
  isRefreshing
}) => {
  const isInside = result ? result.isInsideZone : true;
  const distance = result ? Math.round(result.distanceMeters) : 450;
  const accuracy = result ? Math.round(result.accuracy) : 12;

  const mapsUrl = `https://www.google.com/maps?q=${collegeLat},${collegeLon}`;

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
            <p className="text-xs text-slate-500">Live GPS Geofence Verification</p>
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
          <span className="text-slate-400 block mb-0.5">Current Device Coordinates</span>
          <span className="font-semibold text-slate-700 flex items-center gap-1 font-mono">
            <Navigation className="w-3.5 h-3.5 text-blue-600 inline shrink-0" />
            {result?.latitude.toFixed(4) || '23.2185'}, {result?.longitude.toFixed(4) || '72.6395'}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block mb-0.5">College Campus Coordinates</span>
          <span className="font-semibold text-slate-700 flex items-center gap-1 font-mono">
            <MapPin className="w-3.5 h-3.5 text-slate-500 inline shrink-0" />
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
          <span className="text-slate-400 block mb-0.5">GPS Precision</span>
          <span className="font-semibold text-slate-700">±{accuracy} meters accuracy</span>
        </div>
      </div>

      {!isInside && (
        <div className="mt-2 p-2.5 bg-rose-100/70 border border-rose-200 text-rose-800 rounded-lg text-xs leading-relaxed font-medium">
          ⚠️ Attendance cannot be marked because you are outside the 2 KM college attendance zone.
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1"
        >
          <ExternalLink className="w-3 h-3" />
          View Campus Location
        </a>

        {onRefreshGPS && (
          <button
            onClick={onRefreshGPS}
            disabled={isRefreshing}
            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition flex items-center gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Device GPS
          </button>
        )}
      </div>
    </div>
  );
};
