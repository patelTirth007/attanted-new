import React, { useState } from 'react';
import { db } from '../services/db';
import { User } from '../types';
import { GraduationCap, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, KeyRound } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
  onNavigateToRegister: () => void;
  onNavigateToFacultyRegister?: () => void;
}

export const Login: React.FC<LoginProps> = ({ 
  onLoginSuccess, 
  onNavigateToRegister,
  onNavigateToFacultyRegister
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const user = db.getUserByEmail(email);
    if (!user) {
      setError('No registered account found with this email. Please verify credentials or register.');
      return;
    }

    onLoginSuccess(user);
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
            Dynamic Handheld 100m QR Code • Subject-Wise Attendance • Instant Gmail Notifications
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-8">
          <h3 className="text-lg font-bold text-slate-900 mb-1">Official Portal Sign In</h3>
          <p className="text-xs text-slate-500 mb-6">Enter your registered college credentials</p>

          {/* Quick 1-Click Demo Login Selector */}
          <div className="mb-6 p-3 bg-blue-50/70 border border-blue-200 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block mb-2">
              ⚡ Quick Demo 1-Click Website Access:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmail('faculty@college.edu');
                  setPassword('demo123');
                  const u = db.getUserByEmail('faculty@college.edu');
                  if (u) onLoginSuccess(u);
                }}
                className="px-2.5 py-1.5 bg-white border border-blue-300 hover:border-blue-600 rounded-lg text-left transition text-[11px] shadow-sm"
              >
                <div className="font-bold text-blue-900 flex items-center gap-1">
                  👨‍🏫 Faculty
                </div>
                <div className="text-[10px] text-slate-500 truncate">Dr. Rajesh Sharma</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('student@college.edu');
                  setPassword('demo123');
                  const u = db.getUserByEmail('student@college.edu');
                  if (u) onLoginSuccess(u);
                }}
                className="px-2.5 py-1.5 bg-white border border-emerald-300 hover:border-emerald-600 rounded-lg text-left transition text-[11px] shadow-sm"
              >
                <div className="font-bold text-emerald-900 flex items-center gap-1">
                  🎓 Student
                </div>
                <div className="text-[10px] text-slate-500 truncate">Aarav Patel (21IT001)</div>
              </button>
            </div>
          </div>

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
                  placeholder="e.g. faculty@college.edu or student enrollment email"
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

          {/* Registration Options */}
          <div className="mt-6 pt-5 border-t border-slate-100 space-y-2.5 text-center">
            <div>
              <button
                type="button"
                onClick={onNavigateToRegister}
                className="text-xs font-bold text-blue-700 hover:text-blue-900 transition flex items-center justify-center gap-1 mx-auto"
              >
                <UserCheck className="w-3.5 h-3.5" />
                New Student? Register Real Student ID & Email →
              </button>
            </div>

            {onNavigateToFacultyRegister && (
              <div>
                <button
                  type="button"
                  onClick={onNavigateToFacultyRegister}
                  className="text-xs font-semibold text-slate-500 hover:text-purple-700 transition flex items-center justify-center gap-1 mx-auto"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  New Faculty / Staff? Register Faculty Account →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
