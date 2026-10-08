import React, { useEffect, useState } from 'react';
import { Student, Lecture, AttendanceRecord, CollegeSettings } from '../types';
import { db } from '../services/db';
import { getCurrentDeviceLocation, verifyLocationGeofence, GeofenceVerificationResult } from '../services/gps';
import { GeofenceCard } from '../components/GeofenceCard';
import { StatusBadge } from '../components/StatusBadge';
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Award,
  BookOpen,
  Camera
} from 'lucide-react';

interface StudentDashboardProps {
  student: Student;
  onNavigateToMarkAttendance: (lecture: Lecture) => void;
  onNavigateToEnrollment: () => void;
  onNavigateToHistory: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  student,
  onNavigateToMarkAttendance,
  onNavigateToEnrollment,
  onNavigateToHistory
}) => {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [settings, setSettings] = useState<CollegeSettings>(db.getCollegeSettings());
  const [geofenceResult, setGeofenceResult] = useState<GeofenceVerificationResult | undefined>();
  const [loadingGps, setLoadingGps] = useState(false);

  useEffect(() => {
    // Load student's lectures for their semester & division
    const allLecs = db.getAllLectures();
    const studentLecs = allLecs.filter(
      l => l.semester === student.semester && l.division.toUpperCase() === student.division.toUpperCase()
    );
    setLectures(studentLecs);

    // Load attendance records
    const records = db.getAttendanceForStudent(student.id);
    setAttendance(records);

    // Initial GPS check
    checkLocation();
  }, [student]);

  const checkLocation = async (simulatedDistance?: number) => {
    setLoadingGps(true);
    try {
      const loc = await getCurrentDeviceLocation();
      const currentLat = simulatedDistance 
        ? settings.latitude + (simulatedDistance / 111000) 
        : loc.latitude;
      const currentLon = loc.longitude;

      const res = verifyLocationGeofence(
        currentLat,
        currentLon,
        loc.accuracy,
        settings.latitude,
        settings.longitude,
        settings.allowedRadiusMeters,
        settings.minimumGpsAccuracy
      );
      setGeofenceResult(res);
    } catch (e) {
      console.warn('GPS check failed', e);
    } finally {
      setLoadingGps(false);
    }
  };

  const totalConducted = Math.max(lectures.length * 5, 20);
  const presentCount = attendance.filter(a => a.status === 'PRESENT').length;
  const lateCount = attendance.filter(a => a.status === 'LATE').length;
  const absentCount = Math.max(0, totalConducted - presentCount - lateCount);
  const overallPercentage = ((presentCount + (lateCount * 0.8)) / totalConducted) * 100;

  // Subject-wise percentage analytics
  const subjects = db.getAllSubjects().slice(0, 4);
  const subjectStats = subjects.map((sub, i) => {
    const basePct = [85, 78, 92, 88][i] || 82;
    return {
      name: sub.subjectName,
      code: sub.subjectCode,
      pct: basePct
    };
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Face enrollment warning banner if not enrolled */}
      {!student.faceEnrollmentStatus && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">Biometric Face Setup Required</h4>
              <p className="text-xs text-amber-700">
                You must complete face enrollment before you can mark lecture attendance.
              </p>
            </div>
          </div>
          <button
            onClick={onNavigateToEnrollment}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition shrink-0"
          >
            <Camera className="w-4 h-4" />
            Enroll Face ID Now
          </button>
        </div>
      )}

      {/* Top Banner / Student Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Welcome, {student.name}</h2>
          <p className="text-xs text-slate-500">
            Enrollment: <strong className="text-slate-700">{student.enrollmentNumber}</strong> • Roll No: {student.rollNumber} • Sem {student.semester} (Div {student.division})
          </p>
        </div>

        <button
          onClick={onNavigateToHistory}
          className="self-start sm:self-auto px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
        >
          View Attendance History →
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Percentage */}
        <div className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white rounded-2xl p-5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs text-blue-200 font-medium">Overall Attendance</span>
            <TrendingUp className="w-4 h-4 text-blue-300" />
          </div>
          <div className="text-3xl font-black mt-2">
            {overallPercentage.toFixed(1)}%
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
              overallPercentage >= 75 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
            }`}>
              {overallPercentage >= 75 ? 'ELIGIBLE (>=75%)' : 'LOW ATTENDANCE'}
            </span>
            <span className="text-blue-200 text-[11px]">{totalConducted} Lectures</span>
          </div>
        </div>

        {/* Present */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Present</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{presentCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">Verified with Face & GPS</p>
        </div>

        {/* Late */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Late Marked</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{lateCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">Outside grace window</p>
        </div>

        {/* Absent */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Absent Count</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{absentCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">Conducted missed</p>
        </div>
      </div>

      {/* GPS Geofence Card */}
      <GeofenceCard
        result={geofenceResult}
        collegeLat={settings.latitude}
        collegeLon={settings.longitude}
        allowedRadius={settings.allowedRadiusMeters}
        onSimulate={(dist) => checkLocation(dist)}
      />

      {/* Today's Lectures */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Today's Active Lectures</h3>
            <p className="text-xs text-slate-500">
              Only active lectures inside the 2 KM college zone can be marked with face recognition
            </p>
          </div>
          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
            Sem {student.semester} - Div {student.division}
          </span>
        </div>

        {lectures.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No lectures scheduled for your batch today.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-3">Subject</th>
                  <th className="pb-3">Time</th>
                  <th className="pb-3">Faculty</th>
                  <th className="pb-3">Room</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lectures.map((lec) => {
                  const alreadyMarked = attendance.find(a => a.lectureId === lec.id);
                  const isReady = lec.status === 'ACTIVE';

                  return (
                    <tr key={lec.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 pr-3 font-semibold text-slate-800">
                        <div>{lec.subjectName}</div>
                        <span className="text-[10px] text-slate-400 font-normal">{lec.subjectCode}</span>
                      </td>
                      <td className="py-3.5 pr-3 text-slate-600 font-medium whitespace-nowrap">
                        {lec.startTime} - {lec.endTime}
                      </td>
                      <td className="py-3.5 pr-3 text-slate-600">{lec.facultyName}</td>
                      <td className="py-3.5 pr-3 text-slate-600">{lec.room}</td>
                      <td className="py-3.5 pr-3">
                        {alreadyMarked ? (
                          <StatusBadge status={alreadyMarked.status} />
                        ) : (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isReady ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {lec.status}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 text-right whitespace-nowrap">
                        {alreadyMarked ? (
                          <span className="text-[11px] font-semibold text-slate-400">
                            Marked at {alreadyMarked.markedTimeStr}
                          </span>
                        ) : isReady ? (
                          <button
                            onClick={() => onNavigateToMarkAttendance(lec)}
                            disabled={!student.faceEnrollmentStatus}
                            className={`px-3 py-1.5 font-bold rounded-lg text-xs transition shadow-sm ${
                              student.faceEnrollmentStatus
                                ? 'bg-blue-700 hover:bg-blue-800 text-white'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            MARK ATTENDANCE
                          </button>
                        ) : (
                          <span className="text-slate-400 font-medium">NOT ACTIVE</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Subject-wise Attendance Analytics */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
        <h3 className="text-base font-bold text-slate-900 mb-1">Subject-wise Attendance</h3>
        <p className="text-xs text-slate-500 mb-4">
          Minimum 75% required per subject to appear in final semester examinations
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {subjectStats.map((stat) => (
            <div key={stat.code} className="p-4 rounded-xl border border-slate-100 bg-slate-50/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 truncate pr-2">{stat.name}</span>
                <span className={`text-xs font-extrabold ${stat.pct >= 75 ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {stat.pct}%
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full ${stat.pct >= 75 ? 'bg-emerald-600' : 'bg-amber-500'}`}
                  style={{ width: `${stat.pct}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Code: {stat.code}</span>
                <span>{stat.pct >= 75 ? 'Exam Eligible' : 'Short Attendance'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
