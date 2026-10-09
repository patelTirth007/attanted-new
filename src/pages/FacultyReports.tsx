import React, { useState, useEffect } from 'react';
import { Lecture, AttendanceRecord, Student } from '../types';
import { db } from '../services/db';
import { exportAttendanceToCSV, exportSemesterAttendanceToCSV } from '../services/csvExport';
import { 
  FileSpreadsheet, 
  Download, 
  Calendar, 
  Users, 
  CheckCircle2, 
  Mail, 
  ShieldCheck, 
  QrCode, 
  GraduationCap, 
  Search, 
  Filter, 
  TrendingUp, 
  Award, 
  AlertTriangle 
} from 'lucide-react';

export const FacultyReports: React.FC = () => {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [allAttendance, setAllAttendance] = useState<AttendanceRecord[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<number | 'ALL'>('ALL');
  const [viewMode, setViewMode] = useState<'LECTURES' | 'SEMESTER_CONSOLIDATED'>('LECTURES');

  const [selectedLectureId, setSelectedLectureId] = useState<string>('');
  const [lectureRecords, setLectureRecords] = useState<AttendanceRecord[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PRESENT' | 'LATE'>('ALL');

  const availableSemesters = [1, 2, 3, 4, 5, 6, 7, 8];

  const loadData = () => {
    const lecs = db.getAllLectures();
    const stus = db.getAllStudents();
    const att = db.getAllAttendance();
    setLectures(lecs);
    setStudents(stus);
    setAllAttendance(att);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter lectures by selected semester
  const semesterLectures = selectedSemester === 'ALL'
    ? lectures
    : lectures.filter(l => l.semester === selectedSemester);

  // Sync selected lecture when semester changes or on initial load
  useEffect(() => {
    if (semesterLectures.length > 0) {
      const currentExists = semesterLectures.some(l => l.id === selectedLectureId);
      const targetId = currentExists ? selectedLectureId : semesterLectures[0].id;
      setSelectedLectureId(targetId);
      setLectureRecords(db.getAttendanceForLecture(targetId));
    } else {
      setSelectedLectureId('');
      setLectureRecords([]);
    }
  }, [selectedSemester, lectures]);

  const handleSelectLecture = (id: string) => {
    setSelectedLectureId(id);
    setLectureRecords(db.getAttendanceForLecture(id));
  };

  const selectedLecture = semesterLectures.find(l => l.id === selectedLectureId);

  // Filter lecture records by search and status
  const filteredLectureRecords = lectureRecords.filter(r => {
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesSearch = !search ||
      r.studentName.toLowerCase().includes(search.toLowerCase()) ||
      r.rollNumber.includes(search) ||
      (r.studentEmail && r.studentEmail.toLowerCase().includes(search.toLowerCase())) ||
      r.enrollmentNumber.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Calculate semester-level statistics
  const targetSemesterNum = selectedSemester === 'ALL' ? null : selectedSemester;
  const targetStudents = targetSemesterNum
    ? students.filter(s => s.semester === targetSemesterNum)
    : students;
  
  const targetAttendance = targetSemesterNum
    ? allAttendance.filter(a => {
        const l = lectures.find(lec => lec.id === a.lectureId);
        return l?.semester === targetSemesterNum;
      })
    : allAttendance;

  const totalLecturesInScope = semesterLectures.length;
  const totalEnrolledStudents = targetStudents.length;
  const totalRecordsLogged = targetAttendance.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;

  // Calculate average attendance across students
  const studentMetrics = targetStudents.map(st => {
    const stEmail = (st.email || `${st.enrollmentNumber.toLowerCase()}@college.edu`).toLowerCase();
    const stAttended = targetAttendance.filter(a => 
      (a.studentId === st.id || (a.studentEmail && a.studentEmail.toLowerCase() === stEmail)) &&
      (a.status === 'PRESENT' || a.status === 'LATE')
    ).length;

    const pct = totalLecturesInScope > 0
      ? Math.round((stAttended / totalLecturesInScope) * 100)
      : 0;

    return {
      student: st,
      attended: stAttended,
      percentage: pct,
      isEligible: pct >= 75
    };
  });

  const eligibleStudentsCount = studentMetrics.filter(m => m.isEligible).length;
  const avgAttendancePercentage = studentMetrics.length > 0
    ? (studentMetrics.reduce((acc, curr) => acc + curr.percentage, 0) / studentMetrics.length).toFixed(1)
    : '0.0';

  // Export handlers
  const handleExportLecture = () => {
    if (!selectedLecture) return;
    exportAttendanceToCSV(selectedLecture, lectureRecords);
  };

  const handleExportSemester = () => {
    const sem = selectedSemester === 'ALL' ? 5 : selectedSemester;
    exportSemesterAttendanceToCSV(sem, semesterLectures, targetAttendance, targetStudents);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-900">Semester-Wise Attendance Management</h2>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              Multi-Semester Segregated Logs
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Separate attendance auditing, individual lecture logs, student semester percentage breakdown, and official CSV exports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {viewMode === 'LECTURES' && selectedLecture && (
            <button
              onClick={handleExportLecture}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Export This Lecture CSV
            </button>
          )}

          <button
            onClick={handleExportSemester}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export Semester CSV Sheet
          </button>
        </div>
      </div>

      {/* Semester Selector Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-blue-700" />
            <span>Select Semester to Manage Attendance:</span>
          </div>
          {selectedSemester !== 'ALL' && (
            <button
              onClick={() => setSelectedSemester('ALL')}
              className="text-blue-600 hover:text-blue-800 font-semibold"
            >
              Reset to All Semesters →
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-none">
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
              {lectures.length} lecs
            </span>
          </button>

          {availableSemesters.map((sem) => {
            const count = lectures.filter(l => l.semester === sem).length;
            const attCount = allAttendance.filter(a => {
              const l = lectures.find(lec => lec.id === a.lectureId);
              return l?.semester === sem;
            }).length;
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
                <span>Semester {sem}</span>
                {count > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isSelected ? 'bg-blue-800 text-blue-100' : 'bg-blue-50 text-blue-700 font-extrabold'
                  }`}>
                    {count} lecs ({attCount} att)
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scope Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{selectedSemester === 'ALL' ? 'Total Lectures' : `Semester ${selectedSemester} Lectures`}</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{totalLecturesInScope}</div>
          <p className="text-[11px] text-slate-400 mt-1">Conducted subject sessions</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{selectedSemester === 'ALL' ? 'Enrolled Students' : `Semester ${selectedSemester} Students`}</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{totalEnrolledStudents}</div>
          <p className="text-[11px] text-slate-400 mt-1">Registered email profiles</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Logged Attendance</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{totalRecordsLogged}</div>
          <p className="text-[11px] text-slate-400 mt-1">Verified via QR + 100m GPS</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Eligible Students (≥75%)</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {eligibleStudentsCount} <span className="text-xs font-bold text-slate-400">/ {totalEnrolledStudents}</span>
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">Avg Rate: {avgAttendancePercentage}%</p>
        </div>
      </div>

      {/* View Switcher: Lecture-Wise vs Consolidated Semester Sheet */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setViewMode('LECTURES')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
            viewMode === 'LECTURES'
              ? 'bg-blue-700 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          📋 Individual Lecture Logs ({semesterLectures.length})
        </button>

        <button
          onClick={() => setViewMode('SEMESTER_CONSOLIDATED')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
            viewMode === 'SEMESTER_CONSOLIDATED'
              ? 'bg-blue-700 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          📊 Consolidated Semester Student Sheet ({targetStudents.length})
        </button>
      </div>

      {/* VIEW 1: Individual Lecture Logs */}
      {viewMode === 'LECTURES' && (
        <div className="space-y-6">
          {/* Lecture Selector Grid */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                Select Lecture to Inspect Attendance Logs {selectedSemester !== 'ALL' && `(Semester ${selectedSemester})`}
              </label>
              <span className="text-[11px] text-slate-500">
                {semesterLectures.length} lecture{semesterLectures.length !== 1 ? 's' : ''} available
              </span>
            </div>

            {semesterLectures.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                No lectures created for {selectedSemester === 'ALL' ? 'the college' : `Semester ${selectedSemester}`}.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {semesterLectures.map((lec) => {
                  const isSelected = selectedLectureId === lec.id;
                  const attCount = db.getAttendanceForLecture(lec.id).length;

                  return (
                    <button
                      key={lec.id}
                      onClick={() => handleSelectLecture(lec.id)}
                      className={`p-3.5 rounded-xl border text-left transition ${
                        isSelected
                          ? 'bg-blue-50 border-blue-600 shadow-sm'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-100/60 px-1.5 py-0.5 rounded">
                          Sem {lec.semester} ({lec.division})
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          {attCount} Present
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 truncate mt-1">{lec.subjectName}</h4>
                      <p className="text-[11px] text-slate-500">{lec.subjectCode} • {lec.room}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{lec.date} • {lec.startTime}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Lecture Details & Attendance Table */}
          {selectedLecture && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      Semester {selectedLecture.semester} • Div {selectedLecture.division}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500">{selectedLecture.subjectCode}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{selectedLecture.subjectName}</h3>
                  <p className="text-xs text-slate-500">
                    Faculty: <strong>{selectedLecture.facultyName}</strong> • {selectedLecture.date} ({selectedLecture.startTime} - {selectedLecture.endTime}) • {selectedLecture.room}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportLecture}
                    className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export CSV ({lectureRecords.length})
                  </button>
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search student, roll, or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs">
                  <Filter className="w-3 h-3 text-slate-400" />
                  <span className="text-slate-500 font-medium">Filter:</span>
                  {(['ALL', 'PRESENT', 'LATE'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                        statusFilter === st
                          ? 'bg-blue-700 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Records Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                      <th className="py-2.5 px-3">Roll No</th>
                      <th className="py-2.5 px-3">Enrollment</th>
                      <th className="py-2.5 px-3">Student Name</th>
                      <th className="py-2.5 px-3">Verified Email ID</th>
                      <th className="py-2.5 px-3">Gmail Alert</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Marked Time</th>
                      <th className="py-2.5 px-3 text-right">QR 100m Proximity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLectureRecords.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400">
                          {lectureRecords.length === 0
                            ? 'No students have marked attendance for this lecture yet.'
                            : 'No records match search/filter criteria.'}
                        </td>
                      </tr>
                    ) : (
                      filteredLectureRecords.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/60 transition">
                          <td className="py-2.5 px-3 font-bold text-slate-800">{r.rollNumber}</td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{r.enrollmentNumber}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">{r.studentName}</td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-blue-700 font-semibold">{r.studentEmail}</td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <Mail className="w-3 h-3 text-red-600" />
                              Delivered
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-bold text-emerald-700">{r.status}</td>
                          <td className="py-2.5 px-3 text-slate-600">{r.markedTimeStr}</td>
                          <td className="py-2.5 px-3 text-right">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <QrCode className="w-3 h-3 text-emerald-600" />
                              {Math.round(r.facultyDistanceMeters || r.distanceMeters)}m (≤100m)
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: Consolidated Semester Student Sheet */}
      {viewMode === 'SEMESTER_CONSOLIDATED' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  {selectedSemester === 'ALL' ? 'All College Students' : `Semester ${selectedSemester} Roster`}
                </span>
                <span className="text-xs text-slate-500">
                  Total Lectures Conducted: <strong>{totalLecturesInScope}</strong>
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                Semester Attendance Breakdown & Debarment Eligibility
              </h3>
              <p className="text-xs text-slate-500">
                Minimum 75% aggregate attendance required by college regulations to appear for semester examinations.
              </p>
            </div>

            <button
              onClick={handleExportSemester}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 self-start sm:self-auto"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export Full Semester CSV Sheet
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                  <th className="py-3 px-3">Roll No</th>
                  <th className="py-3 px-3">Enrollment</th>
                  <th className="py-3 px-3">Student Name</th>
                  <th className="py-3 px-3">Semester & Div</th>
                  <th className="py-3 px-3">Registered Email ID</th>
                  <th className="py-3 px-3 text-center">Lectures Attended</th>
                  <th className="py-3 px-3 text-center">Attendance %</th>
                  <th className="py-3 px-3 text-right">Examination Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentMetrics.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No students found enrolled for {selectedSemester === 'ALL' ? 'the college' : `Semester ${selectedSemester}`}.
                    </td>
                  </tr>
                ) : (
                  studentMetrics.map(({ student, attended, percentage, isEligible }) => (
                    <tr key={student.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-3 font-bold text-slate-800">{student.rollNumber}</td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600">{student.enrollmentNumber}</td>
                      <td className="py-3 px-3 font-semibold text-slate-900">{student.name}</td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          Sem {student.semester} ({student.division})
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-blue-800">{student.email}</td>
                      <td className="py-3 px-3 text-center font-bold text-slate-800">
                        {attended} / {totalLecturesInScope}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full ${isEligible ? 'bg-emerald-500' : 'bg-rose-500'}`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                          <span className={`font-black ${isEligible ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {percentage}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {isEligible ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ELIGIBLE (≥75%)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            DEBARRED (&lt;75%)
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
