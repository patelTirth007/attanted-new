import React, { useState, useEffect } from 'react';
import { Faculty, Lecture, Student, CollegeSettings } from '../types';
import { db } from '../services/db';
import {
  Users,
  Calendar,
  Radio,
  FileSpreadsheet,
  Settings,
  Plus,
  TrendingUp,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface FacultyDashboardProps {
  faculty: Faculty;
  onCreateLecture: () => void;
  onOpenLiveAttendance: (lecture: Lecture) => void;
  onNavigateToStudents: () => void;
  onNavigateToReports: () => void;
  onNavigateToSettings: () => void;
}

export const FacultyDashboard: React.FC<FacultyDashboardProps> = ({
  faculty,
  onCreateLecture,
  onOpenLiveAttendance,
  onNavigateToStudents,
  onNavigateToReports,
  onNavigateToSettings
}) => {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [settings, setSettings] = useState<CollegeSettings>(db.getCollegeSettings());

  useEffect(() => {
    setLectures(db.getAllLectures());
    setStudents(db.getAllStudents());
  }, []);

  const activeLectures = lectures.filter(l => l.status === 'ACTIVE');
  const allAttendance = db.getAllAttendance();
  const presentCount = allAttendance.filter(a => a.status === 'PRESENT').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Faculty Management Portal</h2>
          <p className="text-xs text-slate-500">
            Welcome back, <strong className="text-slate-800">{faculty.name}</strong> • {faculty.department}
          </p>
        </div>

        <button
          onClick={onCreateLecture}
          className="self-start sm:self-auto px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          + CREATE LECTURE
        </button>
      </div>

      {/* College Campus GPS Geofence Banner */}
      <div
        onClick={onNavigateToSettings}
        className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-blue-400 cursor-pointer transition flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              Active College Geofence: {settings.collegeName}
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold px-1.5 py-0.5 rounded">
                2 KM Radius
              </span>
            </h4>
            <p className="text-[11px] text-slate-500">
              Coordinates: {settings.latitude.toFixed(4)}, {settings.longitude.toFixed(4)} • Students outside {settings.allowedRadiusMeters}m are rejected.
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold text-blue-700 flex items-center gap-1">
          Configure <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div
          onClick={onNavigateToStudents}
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Enrolled Students</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">{students.length}</div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">100+ Student Batch Enrolled</p>
        </div>

        {/* Active Lectures */}
        <div className="bg-gradient-to-br from-blue-700 to-indigo-800 text-white rounded-2xl p-5 shadow-md">
          <div className="flex items-center justify-between text-blue-200 text-xs font-semibold">
            <span>Active Attendance Window</span>
            <Radio className="w-4 h-4 text-emerald-300 animate-pulse" />
          </div>
          <div className="text-3xl font-black mt-2">{activeLectures.length}</div>
          <p className="text-[11px] text-blue-200 mt-1">Live tracking enabled</p>
        </div>

        {/* Overall Present */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Today's Total Attended</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">{presentCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">Biometrically verified</p>
        </div>

        {/* Reports shortcut */}
        <div
          onClick={onNavigateToReports}
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Attendance Reports</span>
            <FileSpreadsheet className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-sm font-black text-slate-800 mt-3">Export CSV Logs</div>
          <p className="text-[11px] text-slate-400 mt-1">With GPS and Face Confidence</p>
        </div>
      </div>

      {/* Lectures List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Lectures & Live Monitoring</h3>
            <p className="text-xs text-slate-500">
              Click on a lecture to open the live real-time attendance board and student verification logs
            </p>
          </div>
          <button
            onClick={onCreateLecture}
            className="text-xs font-bold text-blue-700 hover:text-blue-900"
          >
            + Create New
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lectures.map((lec) => {
            const lectureAttendance = allAttendance.filter(a => a.lectureId === lec.id);
            const present = lectureAttendance.filter(a => a.status === 'PRESENT').length;
            const late = lectureAttendance.filter(a => a.status === 'LATE').length;

            return (
              <div
                key={lec.id}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-300 transition space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded">
                    {lec.subjectCode} • Sem {lec.semester} (Div {lec.division})
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    lec.status === 'ACTIVE' 
                      ? 'bg-emerald-100 text-emerald-800 animate-pulse' 
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {lec.status}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900">{lec.subjectName}</h4>
                  <p className="text-xs text-slate-500">
                    Faculty: {lec.facultyName} • Room {lec.room}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-200/60">
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {lec.startTime} - {lec.endTime}
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    {present} Present • {late} Late
                  </span>
                </div>

                <button
                  onClick={() => onOpenLiveAttendance(lec)}
                  className="w-full py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
                >
                  <Radio className="w-3.5 h-3.5" />
                  OPEN LIVE ATTENDANCE DASHBOARD
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
