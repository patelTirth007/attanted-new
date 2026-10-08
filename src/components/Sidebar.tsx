import React from 'react';
import { Role } from '../types';
import {
  LayoutDashboard,
  CalendarCheck,
  Camera,
  History,
  User,
  Users,
  BookOpen,
  Calendar,
  FileSpreadsheet,
  Settings,
  Radio
} from 'lucide-react';

interface SidebarProps {
  role: Role;
  currentRoute: string;
  onNavigate: (route: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ role, currentRoute, onNavigate }) => {
  const studentLinks = [
    { id: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: '/student/attendance', label: 'Mark Attendance', icon: CalendarCheck },
    { id: '/student/face-enrollment', label: 'Face Biometrics', icon: Camera },
    { id: '/student/history', label: 'Attendance History', icon: History },
    { id: '/student/profile', label: 'My Profile', icon: User }
  ];

  const facultyLinks = [
    { id: '/faculty/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: '/faculty/attendance', label: 'Live Attendance', icon: Radio },
    { id: '/faculty/lectures', label: 'Manage Lectures', icon: Calendar },
    { id: '/faculty/students', label: 'Students (100+)', icon: Users },
    { id: '/faculty/subjects', label: 'Subjects', icon: BookOpen },
    { id: '/faculty/reports', label: 'Reports & CSV', icon: FileSpreadsheet },
    { id: '/faculty/settings', label: 'GPS Geofence', icon: Settings }
  ];

  const links = role === 'STUDENT' ? studentLinks : facultyLinks;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col shrink-0 min-h-[calc(100vh-65px)]">
      <div className="p-4 space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Navigation
        </div>
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = currentRoute === link.id;
          return (
            <button
              key={link.id}
              onClick={() => onNavigate(link.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                isActive
                  ? 'bg-blue-50 text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-700' : 'text-slate-400'}`} />
              {link.label}
            </button>
          );
        })}
      </div>

      <div className="mt-auto p-4 border-t border-slate-100">
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
          <span className="font-bold text-slate-800 block mb-0.5">Biometric Geofence</span>
          <span className="text-slate-500 text-[11px] leading-tight block">
            Liveness + 2 KM Campus GPS Geofencing active.
          </span>
        </div>
      </div>
    </aside>
  );
};
