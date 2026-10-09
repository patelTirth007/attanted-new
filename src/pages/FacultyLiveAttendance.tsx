import React, { useState, useEffect } from 'react';
import { Lecture, AttendanceRecord, Student, AttendanceStatus } from '../types';
import { db } from '../services/db';
import { notificationService } from '../services/notificationService';
import { exportAttendanceToCSV } from '../services/csvExport';
import { StatusBadge } from '../components/StatusBadge';
import { FacultyQRCodeGenerator } from '../components/FacultyQRCodeGenerator';
import {
  Radio,
  FileSpreadsheet,
  ArrowLeft,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  Filter,
  Edit,
  ShieldCheck,
  MapPin,
  RefreshCw,
  Mail,
  ExternalLink,
  Send,
  QrCode
} from 'lucide-react';

interface FacultyLiveAttendanceProps {
  lecture: Lecture;
  facultyId: string;
  onBack: () => void;
}

export const FacultyLiveAttendance: React.FC<FacultyLiveAttendanceProps> = ({
  lecture,
  facultyId,
  onBack
}) => {
  const [currentLecture, setCurrentLecture] = useState<Lecture>(lecture);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Manual correction modal state
  const [correctingRecord, setCorrectingRecord] = useState<AttendanceRecord | null>(null);
  const [newStatus, setNewStatus] = useState<AttendanceStatus>('PRESENT');
  const [correctionReason, setCorrectionReason] = useState('');
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  const refreshData = () => {
    const updatedLec = db.getLectureById(lecture.id) || lecture;
    setCurrentLecture(updatedLec);
    setAttendance(db.getAttendanceForLecture(lecture.id));
    setStudents(db.getAllStudents());
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 3000); // 3-second live polling
    return () => clearInterval(interval);
  }, [lecture.id]);

  const matchedStudents = students.filter(
    s => s.semester === currentLecture.semester && s.division.toUpperCase() === currentLecture.division.toUpperCase()
  );
  const eligibleStudents = matchedStudents.length > 0 ? matchedStudents : students;

  const totalStudents = eligibleStudents.length || (students.length > 0 ? students.length : 1);
  const presentCount = attendance.filter(a => a.status === 'PRESENT').length;
  const lateCount = attendance.filter(a => a.status === 'LATE').length;
  const absentCount = Math.max(0, totalStudents - presentCount - lateCount);
  const attendancePercentage = totalStudents > 0 
    ? (((presentCount + (lateCount * 0.8)) / totalStudents) * 100).toFixed(1)
    : '0.0';

  const toggleAttendanceStatus = () => {
    const newStatus = currentLecture.status === 'ACTIVE' ? 'CLOSED' : 'ACTIVE';
    db.updateLectureStatus(currentLecture.id, newStatus);
    refreshData();
  };

  const handleExportCSV = () => {
    exportAttendanceToCSV(currentLecture, attendance);
  };

  const handleSaveCorrection = () => {
    if (!correctingRecord) return;
    db.correctAttendance(correctingRecord.id, newStatus, correctionReason || 'Faculty manual adjustment', facultyId);
    setCorrectingRecord(null);
    setCorrectionReason('');
    refreshData();
  };

  const handleResendGmail = (rec: AttendanceRecord) => {
    const st = students.find(s => s.id === rec.studentId);
    const settings = db.getCollegeSettings();
    if (st) {
      notificationService.sendAttendanceGmailNotification(
        { ...st, email: rec.studentEmail },
        currentLecture,
        rec,
        settings
      );
      setNotificationToast(`📧 Re-sent Gmail confirmation to ${rec.studentEmail}!`);
      setTimeout(() => setNotificationToast(null), 3500);
    }
  };

  const filteredAttendance = attendance.filter(rec => {
    const matchesFilter = statusFilter === 'ALL' || rec.status === statusFilter;
    const matchesSearch = !search ||
      rec.studentName.toLowerCase().includes(search.toLowerCase()) ||
      rec.rollNumber.includes(search) ||
      rec.studentEmail.toLowerCase().includes(search.toLowerCase()) ||
      rec.enrollmentNumber.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Toast Alert */}
      {notificationToast && (
        <div className="p-3 bg-red-50 border border-red-300 text-red-900 rounded-xl text-xs font-semibold flex items-center justify-between shadow-sm animate-fade-in">
          <span>{notificationToast}</span>
          <button onClick={() => setNotificationToast(null)} className="text-red-700 font-bold">×</button>
        </div>
      )}

      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Faculty Dashboard
      </button>

      {/* Header Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              {currentLecture.subjectCode} • Sem {currentLecture.semester} (Div {currentLecture.division})
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
              currentLecture.status === 'ACTIVE' 
                ? 'bg-emerald-100 text-emerald-800 animate-pulse' 
                : 'bg-slate-200 text-slate-700'
            }`}>
              <Radio className="w-3 h-3" />
              {currentLecture.status === 'ACTIVE' ? 'LIVE ATTENDANCE OPEN' : 'ATTENDANCE CLOSED'}
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900">{currentLecture.subjectName}</h2>
          <p className="text-xs text-slate-500">
            Room: <strong className="text-slate-700">{currentLecture.room}</strong> • Window: {currentLecture.attendanceStart} – {currentLecture.attendanceEnd}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={toggleAttendanceStatus}
            className={`px-4 py-2.5 font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 ${
              currentLecture.status === 'ACTIVE'
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <Radio className="w-4 h-4" />
            {currentLecture.status === 'ACTIVE' ? 'Close Attendance Session' : 'Reopen Attendance Session'}
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Live 100-Meter Dynamic QR Code Generator */}
      <FacultyQRCodeGenerator
        lecture={currentLecture}
        onSessionUpdated={setCurrentLecture}
        attendanceCount={presentCount + lateCount}
      />

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Eligible Roster</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalStudents}</div>
          <span className="text-[10px] text-slate-500">Students registered</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Present</span>
          <div className="text-2xl font-black text-emerald-700 mt-1">{presentCount}</div>
          <span className="text-[10px] text-emerald-600">Email verified</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Late</span>
          <div className="text-2xl font-black text-amber-600 mt-1">{lateCount}</div>
          <span className="text-[10px] text-amber-600">Outside window</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">Absent</span>
          <div className="text-2xl font-black text-rose-600 mt-1">{absentCount}</div>
          <span className="text-[10px] text-rose-600">Pending mark</span>
        </div>

        <div className="bg-gradient-to-br from-red-600 to-rose-700 text-white rounded-2xl p-4 shadow-sm col-span-2 lg:col-span-1">
          <span className="text-[10px] font-bold text-red-100 uppercase tracking-wider block">Gmail Alerts</span>
          <div className="text-2xl font-black mt-1">{attendance.length}</div>
          <span className="text-[10px] text-red-100">Confirmations sent</span>
        </div>
      </div>

      {/* Live Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student, email, or roll no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            {['ALL', 'PRESENT', 'LATE'].map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  statusFilter === filter
                    ? 'bg-blue-700 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Table: Roll No | Enrollment | Name | Verified Email ID | Gmail Notification | GPS | Time | Status | Action */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Roll No</th>
                <th className="py-3 px-4">Enrollment</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Verified Email ID</th>
                <th className="py-3 px-4">QR & 100m Proximity</th>
                <th className="py-3 px-4">Gmail Notification</th>
                <th className="py-3 px-4">Marked Time</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-400 text-xs">
                    No matching student attendance records.
                  </td>
                </tr>
              ) : (
                filteredAttendance.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{rec.rollNumber}</td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">{rec.enrollmentNumber}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">{rec.studentName}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                        {rec.studentEmail}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{Math.round(rec.facultyDistanceMeters || rec.distanceMeters)}m (≤100m)</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                        <Mail className="w-3.5 h-3.5 text-red-600" />
                        Delivered ✓
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">{rec.markedTimeStr}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={rec.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleResendGmail(rec)}
                        className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-red-50 hover:bg-red-100 text-red-700 transition inline-flex items-center gap-1 border border-red-200"
                        title="Resend Gmail notification"
                      >
                        <Send className="w-3 h-3" />
                        Resend
                      </button>
                      <button
                        onClick={() => {
                          setCorrectingRecord(rec);
                          setNewStatus(rec.status);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition inline-flex items-center gap-1"
                        title="Manually correct attendance"
                      >
                        <Edit className="w-3 h-3" />
                        Correct
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Correction Dialog */}
      {correctingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Manually Correct Attendance</h3>
            <p className="text-xs text-slate-500">
              Student: <strong className="text-slate-800">{correctingRecord.studentName}</strong> ({correctingRecord.studentEmail})
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">New Status</label>
              <div className="grid grid-cols-3 gap-2">
                {(['PRESENT', 'LATE', 'EXCUSED'] as AttendanceStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setNewStatus(st)}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${
                      newStatus === st 
                        ? 'bg-blue-50 border-blue-600 text-blue-700' 
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Correction *</label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Physically present in lecture room; email verification reconfirmed by faculty."
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCorrectingRecord(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCorrection}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow"
              >
                Save Correction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
