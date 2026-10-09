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
  ShieldCheck,
  Trash2,
  AlertTriangle,
  Compass
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
  const [hasDemoRecords, setHasDemoRecords] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState<number | 'ALL'>('ALL');

  const refreshData = () => {
    setLectures(db.getAllLectures());
    setStudents(db.getAllStudents());
    setSettings(db.getCollegeSettings());
    setHasDemoRecords(db.hasDemoData());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const allAttendance = db.getAllAttendance();

  // Semester filtering
  const displayedLectures = selectedSemester === 'ALL'
    ? lectures
    : lectures.filter(l => l.semester === selectedSemester);

  const activeLectures = displayedLectures.filter(l => l.status === 'ACTIVE');

  // Semester-specific attendance
  const semesterAttendance = selectedSemester === 'ALL'
    ? allAttendance
    : allAttendance.filter(a => {
        const lec = lectures.find(l => l.id === a.lectureId);
        return lec?.semester === selectedSemester;
      });

  const presentCount = semesterAttendance.filter(a => a.status === 'PRESENT').length;

  // Semester-specific students
  const semesterStudents = selectedSemester === 'ALL'
    ? students
    : students.filter(s => s.semester === selectedSemester);

  const availableSemesters = [1, 2, 3, 4, 5, 6, 7, 8];

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

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={onNavigateToSettings}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            <Compass className="w-4 h-4 text-blue-600" />
            College Location (GPS)
          </button>

          <button
            onClick={onCreateLecture}
            className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            + CREATE LECTURE
          </button>
        </div>
      </div>

      {/* Demo Records Notification Alert (if present) */}
      {hasDemoRecords && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <strong className="font-bold">Sample/Demo Records Present:</strong>
              <span className="ml-1 text-amber-800">
                You can remove sample records anytime to manage 100% original students and lectures.
              </span>
            </div>
          </div>
          <button
            onClick={onNavigateToSettings}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition self-start sm:self-auto"
          >
            Purge Demo Records in Settings →
          </button>
        </div>
      )}

      {/* College Campus GPS Geofence Banner */}
      <div
        onClick={onNavigateToSettings}
        className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-5 shadow-md hover:ring-2 hover:ring-blue-400 cursor-pointer transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-white/10 text-blue-200 flex items-center justify-center shrink-0 border border-white/20">
            <MapPin className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white">
                Official College Location: {settings.collegeName}
              </h4>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-extrabold px-2 py-0.5 rounded border border-emerald-400/30">
                {settings.allowedRadiusMeters}m Geofence Active
              </span>
            </div>
            <p className="text-xs text-blue-200/80 mt-0.5">
              Campus Coordinates: <span className="font-mono text-white">{settings.latitude.toFixed(6)}, {settings.longitude.toFixed(6)}</span> • Real GPS verification enforces student presence.
            </p>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onNavigateToSettings(); }}
          className="self-start sm:self-auto px-4 py-2 bg-white text-blue-900 hover:bg-blue-50 font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 shrink-0"
        >
          Configure Real Location <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Semester Selection Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              🎓 Semester-Wise Management:
            </span>
            <span className="text-[11px] text-slate-500">
              Filter lectures, live attendance & student records by semester
            </span>
          </div>
          {selectedSemester !== 'ALL' && (
            <button
              onClick={() => setSelectedSemester('ALL')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              Show All Semesters →
            </button>
          )}
        </div>

        {/* Semester Tab Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
          <button
            onClick={() => setSelectedSemester('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
              selectedSemester === 'ALL'
                ? 'bg-blue-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>All Semesters</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              selectedSemester === 'ALL' ? 'bg-blue-800 text-blue-100' : 'bg-slate-200 text-slate-700'
            }`}>
              {lectures.length}
            </span>
          </button>

          {availableSemesters.map((sem) => {
            const semLecCount = lectures.filter(l => l.semester === sem).length;
            const isSelected = selectedSemester === sem;

            return (
              <button
                key={sem}
                onClick={() => setSelectedSemester(sem)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-700 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>Sem {sem}</span>
                {semLecCount > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isSelected ? 'bg-blue-800 text-blue-100' : 'bg-blue-50 text-blue-700 font-extrabold'
                  }`}>
                    {semLecCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div
          onClick={onNavigateToStudents}
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>
              {selectedSemester === 'ALL' ? 'Total Enrolled' : `Sem ${selectedSemester} Students`}
            </span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">{semesterStudents.length}</div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">
            {selectedSemester === 'ALL' ? 'All Semester Batches' : `Semester ${selectedSemester} Roster`}
          </p>
        </div>

        {/* Active Lectures */}
        <div className="bg-gradient-to-br from-blue-700 to-indigo-800 text-white rounded-2xl p-5 shadow-md">
          <div className="flex items-center justify-between text-blue-200 text-xs font-semibold">
            <span>
              {selectedSemester === 'ALL' ? 'Active Lectures' : `Sem ${selectedSemester} Active`}
            </span>
            <Radio className="w-4 h-4 text-emerald-300 animate-pulse" />
          </div>
          <div className="text-3xl font-black mt-2">{activeLectures.length}</div>
          <p className="text-[11px] text-blue-200 mt-1">Live tracking enabled</p>
        </div>

        {/* Overall Present */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>
              {selectedSemester === 'ALL' ? "Today's Present" : `Sem ${selectedSemester} Present`}
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">{presentCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">QR & 100m Proximity Verified</p>
        </div>

        {/* Reports shortcut */}
        <div
          onClick={onNavigateToReports}
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>
              {selectedSemester === 'ALL' ? 'Reports & Exports' : `Sem ${selectedSemester} Reports`}
            </span>
            <FileSpreadsheet className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-sm font-black text-slate-800 mt-3">Export CSV Logs</div>
          <p className="text-[11px] text-slate-400 mt-1">With GPS and 100m QR Records</p>
        </div>
      </div>

      {/* Lectures List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                {selectedSemester === 'ALL'
                  ? `All Semesters Lectures & Monitoring`
                  : `Semester ${selectedSemester} Lectures & Monitoring`}
              </h3>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {displayedLectures.length} Sessions
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Click on a lecture to open the live real-time attendance board and student verification logs
            </p>
          </div>
          <button
            onClick={onCreateLecture}
            className="text-xs font-bold text-blue-700 hover:text-blue-900 self-start sm:self-auto"
          >
            + Create New Lecture
          </button>
        </div>

        {displayedLectures.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700">
              {selectedSemester === 'ALL'
                ? 'No lectures scheduled yet'
                : `No lectures scheduled for Semester ${selectedSemester}`}
            </h4>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Create a lecture session to begin recording attendance for this semester
            </p>
            <button
              onClick={onCreateLecture}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow"
            >
              + Create Lecture
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedLectures.map((lec) => {
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
        )}
      </div>
    </div>
  );
};
