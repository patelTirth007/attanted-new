import React from 'react';
import { Role } from '../types';
import {
  LayoutDashboard,
  CalendarCheck,
  History,
  User,
  Radio,
  Calendar,
  Users,
  MapPin,
  Mail
} from 'lucide-react';

interface MobileNavProps {
  role: Role;
  currentRoute: string;
  onNavigate: (route: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ role, currentRoute, onNavigate }) => {
  const studentLinks = [
    { id: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: '/student/attendance', label: 'Attendance', icon: CalendarCheck },
    { id: '/student/notifications', label: 'Gmail', icon: Mail },
    { id: '/student/history', label: 'History', icon: History },
    { id: '/student/profile', label: 'Profile', icon: User }
  ];

  const facultyLinks = [
    { id: '/faculty/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: '/faculty/attendance', label: 'Live', icon: Radio },
    { id: '/faculty/lectures', label: 'Lectures', icon: Calendar },
    { id: '/faculty/notifications', label: 'Gmail', icon: Mail },
    { id: '/faculty/students', label: 'Students', icon: Users },
    { id: '/faculty/settings', label: 'Location', icon: MapPin }
  ];

  const links = role === 'STUDENT' ? studentLinks : facultyLinks;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 px-2 py-1 shadow-lg">
      <div className="flex items-center justify-around">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = currentRoute === link.id;
          return (
            <button
              key={link.id}
              onClick={() => onNavigate(link.id)}
              className={`flex flex-col items-center py-1 px-1.5 rounded-xl transition ${
                isActive ? 'text-blue-700 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-blue-700' : 'text-slate-400'}`} />
              <span className="text-[10px] mt-0.5">{link.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
