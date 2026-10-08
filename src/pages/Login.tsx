import React, { useState } from 'react';
import { db } from '../services/db';
import { User } from '../types';
import { GraduationCap, Lock, Mail, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
  onNavigateToRegister: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, onNavigateToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const user = db.getUserByEmail(email);
    if (!user) {
      setError('No registered account found with this email.');
      return;
    }

    onLoginSuccess(user);
  };

  const handleDemoLogin = (demoEmail: string) => {
    const user = db.getUserByEmail(demoEmail);
    if (user) {
      onLoginSuccess(user);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-700 text-white shadow-lg mb-3">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Smart College Attendance</h2>
          <p className="text-xs text-slate-500 mt-1">
            Biometric Face Recognition • GPS 2 KM Geofence • Lecture Tracking
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-8">
          <h3 className="text-lg font-bold text-slate-900 mb-1">Sign In</h3>
          <p className="text-xs text-slate-500 mb-6">Enter your college credentials to access your portal</p>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">College Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="e.g. student@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition"
            >
              Sign In to Portal
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Demo quick logins */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 text-center">
              One-Click Demonstration Logins
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('student@college.edu')}
                className="p-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-left transition"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-800">
                  <UserCheck className="w-3.5 h-3.5" />
                  Student Demo
                </div>
                <div className="text-[10px] text-blue-600 truncate">Tirth Patel (23IT001)</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('faculty@college.edu')}
                className="p-2.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl text-left transition"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-800">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Faculty Demo
                </div>
                <div className="text-[10px] text-purple-600 truncate">Dr. Rajesh Sharma</div>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={onNavigateToRegister}
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 transition"
            >
              New Student? Register with Biometric Face ID →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
