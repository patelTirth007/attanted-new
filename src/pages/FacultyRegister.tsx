import React, { useState } from 'react';
import { db } from '../services/db';
import { User, Faculty } from '../types';
import { ShieldCheck, ArrowLeft, ArrowRight, KeyRound, Sparkles } from 'lucide-react';

interface FacultyRegisterProps {
  onSuccess: (user: User, faculty: Faculty) => void;
  onBackToLogin: () => void;
}

export const FacultyRegister: React.FC<FacultyRegisterProps> = ({ onSuccess, onBackToLogin }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Information Technology');
  const [phone, setPhone] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (secretCode.trim() !== 'SSIT@1900') {
      setError('Invalid Faculty Secret Security Code. Please enter the authorized college code "SSIT@1900" to complete registration.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const res = db.registerFaculty({
      name: fullName.trim(),
      email: email.trim(),
      department: department.trim(),
      phone: phone.trim(),
      password,
      secretCode: secretCode.trim()
    });

    if (!res.success || !res.user || !res.faculty) {
      setError(res.error || 'Registration failed.');
      return;
    }

    onSuccess(res.user, res.faculty);
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-8">
        <button
          onClick={onBackToLogin}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-4 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Faculty & Staff Registration</h3>
            <p className="text-xs text-slate-500">Create an official faculty administration account</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Full Name with Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Dr. Rajesh Sharma / Prof. John Smith"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">College Email Address *</label>
              <input
                type="email"
                required
                placeholder="e.g. professor@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Department *</label>
              <input
                type="text"
                required
                placeholder="e.g. Information Technology"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
            <input
              type="tel"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>

          {/* Faculty Secret Security Authorization Code Box */}
          <div className="p-3.5 bg-purple-50/80 border-2 border-purple-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-purple-950 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-purple-700" />
                Faculty Secret Security Authorization Code *
              </label>
              <button
                type="button"
                onClick={() => setSecretCode('SSIT@1900')}
                className="text-[11px] font-bold text-purple-700 hover:text-purple-900 bg-white px-2 py-0.5 rounded-lg border border-purple-200 transition flex items-center gap-1 shadow-xs"
              >
                <Sparkles className="w-3 h-3 text-purple-600" />
                Fill SSIT@1900
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="Enter secret code: SSIT@1900"
                value={secretCode}
                onChange={(e) => setSecretCode(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 font-mono text-xs font-bold text-purple-900 tracking-wide"
              />
            </div>
            <p className="text-[11px] text-purple-700/90 leading-tight">
              🔐 <strong>Security Policy:</strong> Faculty registration requires the institutional authorization key (<strong>SSIT@1900</strong>). This secret code is tied to your administrative faculty panel.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Password *</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Confirm Password *</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              className="w-full py-3 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition"
            >
              Register Faculty Account
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
