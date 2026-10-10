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

    const identifier = email.trim();
    if (!identifier) {
      setError('Please enter your registered college email or enrollment number.');
      return;
    }

    const user = db.getUserByIdentifier(identifier);
    if (!user) {
      setError(`No registered account found matching "${identifier}". You can register as a student using the link below, or click any demo button above.`);
      return;
    }

    if (password) {
      const isPasswordValid = db.verifyUserPassword(user, password);
      if (!isPasswordValid) {
        setError('Incorrect password. Demo accounts use student123 or faculty123 (or the password chosen during registration).');
        return;
      }
    }

    onLoginSuccess(user);
  };

  const handleQuickLogin = (identifier: string, pass: string) => {
    setEmail(identifier);
    setPassword(pass);
    const user = db.getUserByIdentifier(identifier);
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
            Dynamic Handheld 100m QR Code • Subject-Wise Attendance • Instant Gmail Notifications
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-8">
          <h3 className="text-lg font-bold text-slate-900 mb-1">Official Portal Sign In</h3>
          <p className="text-xs text-slate-500 mb-6">Enter your registered college credentials</p>

          {/* Quick 1-Click Institutional Access */}
          <div className="mb-6 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-2">
              Institutional One-Click Sign In:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('faculty@college.edu', 'faculty123')}
                className="px-2.5 py-2 bg-white border border-purple-200 hover:border-purple-500 rounded-lg text-left transition text-[11px] shadow-sm hover:shadow"
              >
                <div className="font-bold text-purple-950 flex items-center gap-1">
                  👨‍🏫 Faculty Portal
                </div>
                <div className="text-[10px] text-slate-500 truncate">Dr. Rajesh Sharma (Information Technology)</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('tirth0988@gmail.com', 'student123')}
                className="px-2.5 py-2 bg-white border border-blue-200 hover:border-blue-500 rounded-lg text-left transition text-[11px] shadow-sm hover:shadow"
              >
                <div className="font-bold text-blue-950 flex items-center gap-1">
                  🎓 Student Portal
                </div>
                <div className="text-[10px] text-slate-600 font-semibold truncate">Tirth Patel (23IT001)</div>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                College Email Address or Enrollment Number
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. tirth0988@gmail.com, student@college.edu, or 23IT001"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Sign in using your Email (e.g. tirth0988@gmail.com) or Student ID (e.g. 23IT001)
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Password</label>
                <span className="text-[10px] text-slate-400">faculty123 / student123</span>
              </div>
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
              <div className="pt-1">
                <button
                  type="button"
                  onClick={onNavigateToFacultyRegister}
                  className="text-xs font-semibold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-xl transition flex items-center justify-center gap-1.5 mx-auto"
                >
                  <KeyRound className="w-3.5 h-3.5 text-purple-700" />
                  New Faculty? Register with Secret Code (SSIT@1900) →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
