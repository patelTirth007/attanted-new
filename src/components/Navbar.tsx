import React from 'react';
import { User } from '../types';
import { GraduationCap, LogOut, User as UserIcon, Shield } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  profileName: string;
  onLogout: () => void;
  collegeName: string;
}

export const Navbar: React.FC<NavbarProps> = ({ user, profileName, onLogout, collegeName }) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 lg:px-8 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center shadow">
          <GraduationCap className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-900 leading-tight">Smart Attendance System</h1>
          <p className="text-xs text-slate-500 hidden sm:block">{collegeName}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
              user.role === 'FACULTY' 
                ? 'bg-purple-100 text-purple-700' 
                : 'bg-blue-100 text-blue-700'
            }`}>
              {user.role}
            </span>
            <div className="hidden sm:block text-right">
              <span className="text-xs font-semibold text-slate-800 block">{profileName}</span>
              <span className="text-[10px] text-slate-400 block">{user.email}</span>
            </div>
            <button
              onClick={onLogout}
              className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
