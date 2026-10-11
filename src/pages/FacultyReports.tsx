import React, { useState, useEffect, useMemo } from 'react';
import { Lecture, AttendanceRecord, Student, Subject, AttendanceStatus, SubjectAttendanceSummary } from '../types';
import { db } from '../services/db';
import { 
  exportAttendanceToCSV, 
  exportSemesterAttendanceToCSV,
  exportAttendanceHistoryToCSV,
  exportSubjectWiseAttendanceToCSV,
  exportSemesterSubjectSummaryToCSV
} from '../services/csvExport';
import { 
  FileSpreadsheet, 
  Download, 
  Calendar, 
  Users, 
  CheckCircle2, 
  Mail, 
  ShieldCheck, 
  GraduationCap, 
  Search, 
  Filter, 
  TrendingUp, 
  Award, 
  AlertTriangle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Sliders,
  History,
  BookOpen,
  RefreshCw,
  Info,
  Check,
  Smartphone,
  MapPin,
  CalendarDays
} from 'lucide-react';

export const FacultyReports: React.FC = () => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'HISTORY' | 'SUBJECT_WISE' | 'SEMESTER_SUMMARY' | 'RETENTION_POLICY'>('HISTORY');

  // Common database states
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [allLectures, setAllLectures] = useState<Lecture[]>([]);
  const [collegeSettings, setCollegeSettings] = useState(db.getCollegeSettings());

  // Retention audit feedback
  const [retentionAuditResult, setRetentionAuditResult] = useState<{ cleanedCount: number; retainedCount: number; retentionDays: number } | null>(null);

  // ==========================================
  // TAB 1: ONE-YEAR ATTENDANCE HISTORY STATES
  // ==========================================
  const [historyPeriod, setHistoryPeriod] = useState<'ALL' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'>('YEARLY');
  const [historySemester, setHistorySemester] = useState<number | 'ALL'>('ALL');
  const [historyDivision, setHistoryDivision] = useState<string>('ALL');
  const [historySubjectId, setHistorySubjectId] = useState<string>('ALL');
  const [historyStatus, setHistoryStatus] = useState<AttendanceStatus | 'ALL'>('ALL');
  const [historyStartDate, setHistoryStartDate] = useState<string>('');
  const [historyEndDate, setHistoryEndDate] = useState<string>('');
  const [historyLectureNumber, setHistoryLectureNumber] = useState<string>('');
  const [historyEnrollmentNumber, setHistoryEnrollmentNumber] = useState<string>('');
  const [historySearch, setHistorySearch] = useState<string>('');
  const [historyPage, setHistoryPage] = useState<number>(1);
  const pageSize = 15;

  // Selected lecture modal for inspecting complete class attendance
  const [inspectLectureId, setInspectLectureId] = useState<string | null>(null);

  // ==========================================
  // TAB 2: SUBJECT MANAGEMENT & ATTENDANCE REPORT STATES
  // ==========================================
  const [selectedSemester, setSelectedSemester] = useState<number>(5);
  const [selectedDivision, setSelectedDivision] = useState<string>('A');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [academicYear, setAcademicYear] = useState<string>('2025-2026');
  const [subjectStartDate, setSubjectStartDate] = useState<string>('');
  const [subjectEndDate, setSubjectEndDate] = useState<string>('');
  const [customThreshold, setCustomThreshold] = useState<number>(collegeSettings.attendanceThresholdPercent || 75);

  // Modal to inspect a single student's attendance breakdown for the selected subject
  const [inspectStudentMetric, setInspectStudentMetric] = useState<{
    studentId: string;
    studentName: string;
    enrollmentNumber: string;
    subjectName: string;
  } | null>(null);

  // ==========================================
  // TAB 3: SEMESTER-WISE SUBJECT SUMMARY STATES
  // ==========================================
  const [summarySemester, setSummarySemester] = useState<number>(5);
  const [summaryDivision, setSummaryDivision] = useState<string>('ALL');

  // Load fresh database records
  const loadData = () => {
    const subjects = db.getAllSubjects();
    const students = db.getAllStudents();
    const lectures = db.getAllLectures();
    const settings = db.getCollegeSettings();
    setAllSubjects(subjects);
    setAllStudents(students);
    setAllLectures(lectures);
    setCollegeSettings(settings);
    if (!customThreshold) {
      setCustomThreshold(settings.attendanceThresholdPercent || 75);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // When selectedSemester changes, dynamically pick first subject in that semester
  const semesterSubjects = useMemo(() => {
    return allSubjects.filter(s => s.semester === selectedSemester);
  }, [allSubjects, selectedSemester]);

  useEffect(() => {
    if (semesterSubjects.length > 0) {
      if (!semesterSubjects.some(s => s.id === selectedSubjectId || s.subjectCode === selectedSubjectId)) {
        setSelectedSubjectId(semesterSubjects[0].id);
      }
    } else {
      setSelectedSubjectId('');
    }
  }, [selectedSemester, semesterSubjects]);

  // Available semesters list
  const availableSemesters = [1, 2, 3, 4, 5, 6, 7, 8];

  // ----------------------------------------------------
  // QUERY 1: ONE-YEAR ATTENDANCE HISTORY
  // ----------------------------------------------------
  const historyData = useMemo(() => {
    const periodMap = historyPeriod === 'ALL' ? undefined : historyPeriod;
    return db.getAttendanceHistory({
      reportPeriod: periodMap,
      startDate: historyStartDate || undefined,
      endDate: historyEndDate || undefined,
      semester: historySemester,
      division: historyDivision,
      subjectId: historySubjectId,
      lectureNumber: historyLectureNumber,
      enrollmentNumber: historyEnrollmentNumber,
      status: historyStatus,
      search: historySearch,
      page: historyPage,
      pageSize
    });
  }, [
    historyPeriod,
    historyStartDate,
    historyEndDate,
    historySemester,
    historyDivision,
    historySubjectId,
    historyLectureNumber,
    historyEnrollmentNumber,
    historyStatus,
    historySearch,
    historyPage,
    allLectures
  ]);

  // Reset page when filters change
  const handleHistoryFilterChange = (setter: (val: any) => void, val: any) => {
    setter(val);
    setHistoryPage(1);
  };

  // Inspect lecture full class roster modal data
  const inspectLectureData = useMemo(() => {
    if (!inspectLectureId) return null;
    return db.getLectureFullAttendanceList(inspectLectureId);
  }, [inspectLectureId, allLectures]);

  // ----------------------------------------------------
  // QUERY 2: SUBJECT-WISE ATTENDANCE CALCULATION
  // ----------------------------------------------------
  const subjectAttendanceSummary: SubjectAttendanceSummary = useMemo(() => {
    if (!selectedSubjectId) {
      return {
        subjectId: '',
        subjectName: 'No Subject Selected',
        subjectCode: '',
        semester: selectedSemester,
        division: selectedDivision,
        totalStudents: 0,
        totalConductedLectures: 0,
        averageAttendancePercentage: 0,
        studentsBelowThresholdCount: 0,
        thresholdPercent: customThreshold,
        students: []
      };
    }
    return db.calculateSubjectAttendanceStats({
      semester: selectedSemester,
      division: selectedDivision,
      subjectId: selectedSubjectId,
      academicYear,
      startDate: subjectStartDate || undefined,
      endDate: subjectEndDate || undefined,
      thresholdPercent: customThreshold
    });
  }, [
    selectedSemester,
    selectedDivision,
    selectedSubjectId,
    academicYear,
    subjectStartDate,
    subjectEndDate,
    customThreshold,
    allLectures,
    allStudents
  ]);

  // Single student detail breakdown in modal
  const studentLectureBreakdown = useMemo(() => {
    if (!inspectStudentMetric || !selectedSubjectId) return null;
    const conducted = allLectures.filter(l => {
      if (l.semester !== selectedSemester) return false;
      if (selectedDivision !== 'ALL' && l.division !== selectedDivision) return false;
      const matchesSub = l.subjectId === selectedSubjectId || l.subjectCode === selectedSubjectId;
      if (!matchesSub) return false;
      if (l.status === 'CANCELLED' || l.status === 'UPCOMING') return false;
      if (subjectStartDate && l.date < subjectStartDate) return false;
      if (subjectEndDate && l.date > subjectEndDate) return false;
      return true;
    });

    const studentAtt = db.getAttendanceForStudent(inspectStudentMetric.studentId);
    return conducted.map(lec => {
      const rec = studentAtt.find(a => a.lectureId === lec.id);
      return {
        lecture: lec,
        status: (rec?.status || 'ABSENT') as AttendanceStatus,
        markedTime: rec?.markedTimeStr,
        distanceMeters: rec?.distanceMeters,
        verificationMethod: rec?.verificationMethod
      };
    });
  }, [inspectStudentMetric, selectedSubjectId, selectedSemester, selectedDivision, allLectures, subjectStartDate, subjectEndDate]);

  // ----------------------------------------------------
  // QUERY 3: SEMESTER-WISE SUBJECT SUMMARY
  // ----------------------------------------------------
  const semesterSubjectsSummary = useMemo(() => {
    return db.getSemesterSubjectsSummary({
      semester: summarySemester,
      division: summaryDivision,
      academicYear
    });
  }, [summarySemester, summaryDivision, academicYear, allLectures]);

  // Handlers for exporting CSVs
  const handleExportHistoryCSV = () => {
    // Export full unfiltered history dataset
    const fullHistory = db.getAttendanceHistory({
      reportPeriod: historyPeriod === 'ALL' ? undefined : historyPeriod,
      startDate: historyStartDate || undefined,
      endDate: historyEndDate || undefined,
      semester: historySemester,
      division: historyDivision,
      subjectId: historySubjectId,
      status: historyStatus,
      search: historySearch,
      page: 1,
      pageSize: 10000
    });
    exportAttendanceHistoryToCSV(fullHistory.records, `Attendance_History_Sem${historySemester}`);
  };

  const handleExportSubjectWiseCSV = () => {
    exportSubjectWiseAttendanceToCSV(subjectAttendanceSummary);
  };

  const handleExportSemesterSummaryCSV = () => {
    exportSemesterSubjectSummaryToCSV(summarySemester, summaryDivision, semesterSubjectsSummary);
  };

  // Retention audit trigger
  const handleRunRetentionAudit = () => {
    const res = db.enforceDataRetention();
    setRetentionAuditResult(res);
  };

  const handleUpdateThreshold = (newVal: number) => {
    const val = Math.max(1, Math.min(100, newVal));
    setCustomThreshold(val);
    db.updateCollegeSettings({ attendanceThresholdPercent: val });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-black rounded-full border border-blue-200 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" />
              1-Year Retention Policy Active
            </span>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-black rounded-full border border-emerald-200 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Official Database Audit
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Attendance History & Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Store, audit, and analyze student attendance records across the entire academic year with dynamic subject selection, percentage calculation, and export capabilities.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {activeTab === 'HISTORY' && (
            <button
              onClick={handleExportHistoryCSV}
              className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export History CSV ({historyData.totalRecords})
            </button>
          )}

          {activeTab === 'SUBJECT_WISE' && (
            <button
              onClick={handleExportSubjectWiseCSV}
              className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Subject CSV ({subjectAttendanceSummary.students.length} Students)
            </button>
          )}

          {activeTab === 'SEMESTER_SUMMARY' && (
            <button
              onClick={handleExportSemesterSummaryCSV}
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export Semester Matrix CSV
            </button>
          )}
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'HISTORY'
              ? 'bg-blue-700 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>1. One-Year Attendance History ({historyData.totalRecords})</span>
        </button>

        <button
          onClick={() => setActiveTab('SUBJECT_WISE')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'SUBJECT_WISE'
              ? 'bg-blue-700 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>2. Subject Management & Percentage Report</span>
        </button>

        <button
          onClick={() => setActiveTab('SEMESTER_SUMMARY')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'SEMESTER_SUMMARY'
              ? 'bg-blue-700 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>3. Semester-Wise Subject Summary</span>
        </button>

        <button
          onClick={() => setActiveTab('RETENTION_POLICY')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'RETENTION_POLICY'
              ? 'bg-blue-700 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>4. Retention Policy (365 Days)</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* SECTION 1: ONE-YEAR ATTENDANCE HISTORY & REPORTS             */}
      {/* ============================================================ */}
      {activeTab === 'HISTORY' && (
        <div className="space-y-6">
          {/* Quick Period Filter Pills */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <CalendarDays className="w-4 h-4 text-blue-700" />
              <span>Report Period:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'YEARLY', label: 'Past 1 Year (All History)' },
                { id: 'DAILY', label: 'Daily (Today)' },
                { id: 'WEEKLY', label: 'Weekly (Last 7 Days)' },
                { id: 'MONTHLY', label: 'Monthly (Last 30 Days)' },
                { id: 'ALL', label: 'Custom Range' }
              ].map(period => (
                <button
                  key={period.id}
                  onClick={() => {
                    setHistoryPeriod(period.id as any);
                    setHistoryPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    historyPeriod === period.id
                      ? 'bg-blue-700 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Filters Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-blue-700" />
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Filter Attendance Records
                </h3>
              </div>
              <button
                onClick={() => {
                  setHistoryPeriod('YEARLY');
                  setHistorySemester('ALL');
                  setHistoryDivision('ALL');
                  setHistorySubjectId('ALL');
                  setHistoryStatus('ALL');
                  setHistoryStartDate('');
                  setHistoryEndDate('');
                  setHistoryLectureNumber('');
                  setHistoryEnrollmentNumber('');
                  setHistorySearch('');
                  setHistoryPage(1);
                }}
                className="text-xs text-blue-700 hover:text-blue-900 font-bold"
              >
                Reset All Filters
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* Semester Filter */}
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Semester</label>
                <select
                  value={historySemester}
                  onChange={e => handleHistoryFilterChange(setHistorySemester, e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="ALL">All Semesters (1 to 8)</option>
                  {availableSemesters.map(sem => (
                    <option key={sem} value={sem}>Semester {sem}</option>
                  ))}
                </select>
              </div>

              {/* Class/Division Filter */}
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Class / Division</label>
                <select
                  value={historyDivision}
                  onChange={e => handleHistoryFilterChange(setHistoryDivision, e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="ALL">All Divisions</option>
                  <option value="A">Division A</option>
                  <option value="B">Division B</option>
                  <option value="C">Division C</option>
                </select>
              </div>

              {/* Subject Filter */}
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Subject</label>
                <select
                  value={historySubjectId}
                  onChange={e => handleHistoryFilterChange(setHistorySubjectId, e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="ALL">All Subjects</option>
                  {allSubjects.map(sub => (
                    <option key={sub.id} value={sub.id}>
                      {sub.subjectName} ({sub.subjectCode} - Sem {sub.semester})
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Status</label>
                <select
                  value={historyStatus}
                  onChange={e => handleHistoryFilterChange(setHistoryStatus, e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="ALL">All Statuses (Present, Late, Rejected)</option>
                  <option value="PRESENT">Present Only</option>
                  <option value="LATE">Late Only</option>
                  <option value="REJECTED">Rejected Only</option>
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Start Date</label>
                <input
                  type="date"
                  value={historyStartDate}
                  onChange={e => handleHistoryFilterChange(setHistoryStartDate, e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-slate-500 font-semibold mb-1">End Date</label>
                <input
                  type="date"
                  value={historyEndDate}
                  onChange={e => handleHistoryFilterChange(setHistoryEndDate, e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Lecture Number */}
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Lecture Number</label>
                <input
                  type="text"
                  placeholder="e.g. Lecture 01, Lecture 14"
                  value={historyLectureNumber}
                  onChange={e => handleHistoryFilterChange(setHistoryLectureNumber, e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Enrollment Number */}
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Enrollment Number</label>
                <input
                  type="text"
                  placeholder="e.g. 23IT001, 21IT001"
                  value={historyEnrollmentNumber}
                  onChange={e => handleHistoryFilterChange(setHistoryEnrollmentNumber, e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Free Search */}
            <div className="relative pt-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student name, email, roll number, or subject..."
                value={historySearch}
                onChange={e => handleHistoryFilterChange(setHistorySearch, e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Status Counter Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Total Logged Records</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{historyData.totalRecords}</div>
              <span className="text-[10px] text-slate-400">Within filtered date range</span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <span className="text-[11px] font-bold text-emerald-700 uppercase flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Present Logs
              </span>
              <div className="text-2xl font-black text-emerald-800 mt-1">{historyData.presentCount}</div>
              <span className="text-[10px] text-emerald-600 font-medium">Verified attendance</span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <span className="text-[11px] font-bold text-amber-700 uppercase flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Late Logs
              </span>
              <div className="text-2xl font-black text-amber-800 mt-1">{historyData.lateCount}</div>
              <span className="text-[10px] text-amber-600 font-medium">Grace window marked</span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <span className="text-[11px] font-bold text-rose-700 uppercase flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Rejected Attempts
              </span>
              <div className="text-2xl font-black text-rose-800 mt-1">{historyData.rejectedCount}</div>
              <span className="text-[10px] text-rose-600 font-medium">Geofence / Device errors</span>
            </div>
          </div>

          {/* Records Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Attendance Records Separate by Date ({historyData.totalRecords} Total)
                </h3>
                <p className="text-xs text-slate-500">
                  Showing page {historyData.page} of {historyData.totalPages} (15 records per page)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={historyPage <= 1}
                  onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <span className="text-xs font-bold text-slate-600 px-2">
                  {historyPage} / {historyData.totalPages}
                </span>
                <button
                  disabled={historyPage >= historyData.totalPages}
                  onClick={() => setHistoryPage(p => Math.min(historyData.totalPages, p + 1))}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {historyData.records.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No attendance records found matching your filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-4">Student Details</th>
                      <th className="py-3 px-4">Class</th>
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-4">Lecture</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Verification & Security</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historyData.records.map(record => {
                      return (
                        <tr key={record.id} className="hover:bg-slate-50/70 transition">
                          {/* Date & Time */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="font-bold text-slate-900">{record.lectureDate}</div>
                            <span className="text-[11px] text-slate-500 font-mono">{record.markedTimeStr}</span>
                          </td>

                          {/* Student */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{record.studentName}</div>
                            <div className="text-[11px] text-blue-700 font-mono font-medium">
                              {record.enrollmentNumber} • Roll: {record.rollNumber}
                            </div>
                            <div className="text-[10px] text-slate-400">{record.studentEmail}</div>
                          </td>

                          {/* Class */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                              Sem {record.semester} ({record.division})
                            </span>
                          </td>

                          {/* Subject */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-800">{record.subjectName}</div>
                            <span className="text-[10px] font-mono text-slate-500">{record.subjectCode}</span>
                          </td>

                          {/* Lecture */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="font-medium text-slate-700">{record.lectureNumber}</div>
                            <span className="text-[10px] text-slate-400">{record.facultyName}</span>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {record.status === 'PRESENT' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                PRESENT
                              </span>
                            ) : record.status === 'LATE' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                <Clock className="w-3 h-3 text-amber-600" />
                                LATE
                              </span>
                            ) : record.status === 'REJECTED' ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                                  REJECTED
                                </span>
                                {record.rejectionReason && (
                                  <p className="text-[9px] text-rose-600 max-w-xs truncate" title={record.rejectionReason}>
                                    {record.rejectionReason}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                                {record.status}
                              </span>
                            )}
                          </td>

                          {/* Verification & Security */}
                          <td className="py-3.5 px-4 text-[10px] text-slate-500">
                            <div className="flex items-center gap-1 text-slate-700 font-semibold">
                              <MapPin className="w-3 h-3 text-blue-600" />
                              <span>{Math.round(record.distanceMeters || 5)}m distance</span>
                            </div>
                            <div className="flex items-center gap-1 text-slate-500 font-mono mt-0.5">
                              <Smartphone className="w-3 h-3 text-slate-400" />
                              <span>{record.deviceId || 'DEV-HARDWARE'}</span>
                            </div>
                          </td>

                          {/* Action: Open Lecture Full Class Roster */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => setInspectLectureId(record.lectureId)}
                              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg transition inline-flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Full Class List
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Bottom Pagination */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Showing {historyData.records.length} of {historyData.totalRecords} records</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={historyPage <= 1}
                  onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-bold rounded-lg transition"
                >
                  Prev
                </button>
                <span className="font-bold text-slate-700">{historyPage} of {historyData.totalPages}</span>
                <button
                  disabled={historyPage >= historyData.totalPages}
                  onClick={() => setHistoryPage(p => Math.min(historyData.totalPages, p + 1))}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-bold rounded-lg transition"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION 2: SUBJECT MANAGEMENT & ATTENDANCE REPORT            */}
      {/* ============================================================ */}
      {activeTab === 'SUBJECT_WISE' && (
        <div className="space-y-6">
          {/* Controls: Semester, Division, Subject Select Option */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div>
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-700" />
                <h3 className="text-base font-black text-slate-900">
                  Subject Selection & Class Attendance Parameters
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Select a semester to dynamically fetch all assigned subjects from the database, then choose a class to view calculated attendance percentages.
              </p>
            </div>

            {/* Semester Tabs */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Select Semester (1 to 8):</label>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-none">
                {availableSemesters.map(sem => {
                  const isSelected = selectedSemester === sem;
                  const subjectsCount = allSubjects.filter(s => s.semester === sem).length;
                  return (
                    <button
                      key={sem}
                      onClick={() => setSelectedSemester(sem)}
                      className={`px-4 py-2 rounded-2xl text-xs font-bold transition shrink-0 flex items-center gap-2 ${
                        isSelected
                          ? 'bg-blue-700 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <span>Semester {sem}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        isSelected ? 'bg-blue-800 text-blue-100' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {subjectsCount} Subjects
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filter Bar: Division, Dynamic Subject Selection, Date Range, Configurable Threshold */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-3 border-t border-slate-100 text-xs">
              {/* Class/Division */}
              <div>
                <label className="block text-slate-600 font-bold mb-1">Class / Division</label>
                <select
                  value={selectedDivision}
                  onChange={e => setSelectedDivision(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="A">Division A</option>
                  <option value="B">Division B</option>
                  <option value="ALL">All Divisions</option>
                </select>
              </div>

              {/* Dynamic Subject Selection */}
              <div className="lg:col-span-2">
                <label className="block text-slate-600 font-bold mb-1">
                  📚 Available Subjects in Semester {selectedSemester} ({semesterSubjects.length} Found in Database)
                </label>
                {semesterSubjects.length === 0 ? (
                  <div className="px-3 py-2 bg-rose-50 text-rose-700 text-xs rounded-xl font-medium">
                    No subjects registered for Semester {selectedSemester} yet.
                  </div>
                ) : (
                  <select
                    value={selectedSubjectId}
                    onChange={e => setSelectedSubjectId(e.target.value)}
                    className="w-full px-3 py-2 bg-blue-50/60 border border-blue-300 rounded-xl font-bold text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {semesterSubjects.map(sub => (
                      <option key={sub.id} value={sub.id}>
                        {sub.subjectName} ({sub.subjectCode})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-slate-600 font-bold mb-1">Start Date</label>
                <input
                  type="date"
                  value={subjectStartDate}
                  onChange={e => setSubjectStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-slate-600 font-bold mb-1">End Date</label>
                <input
                  type="date"
                  value={subjectEndDate}
                  onChange={e => setSubjectEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Configurable Eligibility Threshold */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-700" />
                <div>
                  <span className="font-bold text-slate-800">Minimum Attendance Threshold:</span>
                  <span className="text-slate-500 ml-1">Configurable college eligibility requirement</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <input
                    type="range"
                    min="50"
                    max="90"
                    step="5"
                    value={customThreshold}
                    onChange={e => handleUpdateThreshold(Number(e.target.value))}
                    className="w-32 accent-blue-700 cursor-pointer"
                  />
                  <span className="font-black text-blue-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
                    {customThreshold}%
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {[70, 75, 80].map(val => (
                    <button
                      key={val}
                      onClick={() => handleUpdateThreshold(val)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        customThreshold === val
                          ? 'bg-blue-700 text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {val}%
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Total Enrolled Students</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-3xl font-black text-slate-900 mt-2">
                {subjectAttendanceSummary.totalStudents}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Semester {selectedSemester} - Div {selectedDivision}</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Total Conducted Lectures</span>
                <Calendar className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-3xl font-black text-slate-900 mt-2">
                {subjectAttendanceSummary.totalConductedLectures}
              </div>
              <p className="text-[11px] text-purple-600 font-medium mt-1">Official verified sessions</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Average Class Attendance</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className={`text-3xl font-black mt-2 ${
                subjectAttendanceSummary.averageAttendancePercentage >= customThreshold ? 'text-emerald-700' : 'text-amber-600'
              }`}>
                {subjectAttendanceSummary.totalConductedLectures === 0 ? 'N/A' : `${subjectAttendanceSummary.averageAttendancePercentage}%`}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Target Threshold: ≥{customThreshold}%</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Short Attendance (&lt;{customThreshold}%)</span>
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-3xl font-black text-rose-700 mt-2">
                {subjectAttendanceSummary.studentsBelowThresholdCount}
              </div>
              <p className="text-[11px] text-rose-600 font-semibold mt-1">Requires attendance notice</p>
            </div>
          </div>

          {/* Students Subject Attendance Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900">
                    {subjectAttendanceSummary.subjectName} ({subjectAttendanceSummary.subjectCode})
                  </h3>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Sem {selectedSemester} • Div {selectedDivision}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Calculation Formula: (Present Lectures ÷ {subjectAttendanceSummary.totalConductedLectures} Conducted) × 100
                </p>
              </div>

              <button
                onClick={handleExportSubjectWiseCSV}
                className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
            </div>

            {subjectAttendanceSummary.totalConductedLectures === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs space-y-2">
                <Info className="w-8 h-8 mx-auto text-slate-300" />
                <p className="font-bold text-slate-700 text-sm">No Conducted Lectures for this Subject</p>
                <p className="text-slate-400 max-w-md mx-auto">
                  There are no official attendance sessions conducted for {subjectAttendanceSummary.subjectName} within the specified filters. All students display 0% (No Data).
                </p>
              </div>
            ) : subjectAttendanceSummary.students.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No students enrolled in Semester {selectedSemester} Division {selectedDivision}.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Roll</th>
                      <th className="py-3 px-4">Student Name & Email</th>
                      <th className="py-3 px-4">Enrollment Number</th>
                      <th className="py-3 px-4 text-center">Conducted</th>
                      <th className="py-3 px-4 text-center">Present</th>
                      <th className="py-3 px-4 text-center">Absent</th>
                      <th className="py-3 px-4">Attendance %</th>
                      <th className="py-3 px-4">Status Indicator</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {subjectAttendanceSummary.students.map(metric => {
                      const isEligible = metric.attendanceStatus === 'Eligible';
                      const isShort = metric.attendanceStatus === 'Short Attendance';

                      return (
                        <tr key={metric.studentId} className="hover:bg-slate-50/70 transition">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                            {metric.rollNumber}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{metric.studentName}</div>
                            <span className="text-[11px] text-slate-400">{metric.studentEmail}</span>
                          </td>

                          <td className="py-3.5 px-4 font-mono font-bold text-blue-900">
                            {metric.enrollmentNumber}
                          </td>

                          <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                            {metric.totalConductedLectures}
                          </td>

                          <td className="py-3.5 px-4 text-center font-bold text-emerald-700">
                            {metric.presentLectures}
                          </td>

                          <td className="py-3.5 px-4 text-center font-bold text-rose-600">
                            {metric.absentLectures}
                          </td>

                          <td className="py-3.5 px-4 w-48">
                            <div className="flex items-center justify-between text-xs font-black mb-1">
                              <span className={isEligible ? 'text-emerald-700' : isShort ? 'text-rose-700' : 'text-slate-500'}>
                                {metric.attendancePercentage}%
                              </span>
                              <span className="text-[10px] text-slate-400 font-normal">
                                {metric.presentLectures}/{metric.totalConductedLectures}
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isEligible ? 'bg-emerald-600' : isShort ? 'bg-rose-500' : 'bg-slate-400'
                                }`}
                                style={{ width: `${Math.max(metric.attendancePercentage, 4)}%` }}
                              />
                            </div>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {isEligible ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Eligible (≥{customThreshold}%)
                              </span>
                            ) : isShort ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-50 text-rose-800 border border-rose-200">
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                                Short Attendance
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                                No Data
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => setInspectStudentMetric({
                                studentId: metric.studentId,
                                studentName: metric.studentName,
                                enrollmentNumber: metric.enrollmentNumber,
                                subjectName: subjectAttendanceSummary.subjectName
                              })}
                              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg transition inline-flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Breakdown
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION 3: SEMESTER-WISE SUBJECT SUMMARY                      */}
      {/* ============================================================ */}
      {activeTab === 'SEMESTER_SUMMARY' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Semester-Wise Subject Summary Matrix
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Displays all subjects in the selected semester with aggregated conducted lectures, total student attendances, and class percentages.
                </p>
              </div>

              <button
                onClick={handleExportSemesterSummaryCSV}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 self-start sm:self-auto"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export Matrix CSV
              </button>
            </div>

            {/* Semester Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-none">
              {availableSemesters.map(sem => (
                <button
                  key={sem}
                  onClick={() => setSummarySemester(sem)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold transition shrink-0 ${
                    summarySemester === sem
                      ? 'bg-blue-700 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Semester {sem}
                </button>
              ))}
            </div>
          </div>

          {/* Matrix Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Subjects in Semester {summarySemester} ({semesterSubjectsSummary.length} Courses)
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                Class / Division: {summaryDivision}
              </span>
            </div>

            {semesterSubjectsSummary.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No subjects assigned to Semester {summarySemester}.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Subject & Code</th>
                      <th className="py-3 px-4 text-center">Conducted Lectures</th>
                      <th className="py-3 px-4 text-center">Present (Total Student Logs)</th>
                      <th className="py-3 px-4 text-center">Absent (Total Student Logs)</th>
                      <th className="py-3 px-4">Class Attendance %</th>
                      <th className="py-3 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {semesterSubjectsSummary.map(row => (
                      <tr key={row.subjectId} className="hover:bg-slate-50/70 transition">
                        <td className="py-4 px-4 font-bold text-slate-900">
                          <div>{row.subjectName}</div>
                          <span className="text-[10px] font-mono text-blue-700">{row.subjectCode}</span>
                        </td>

                        <td className="py-4 px-4 text-center font-bold text-slate-800">
                          {row.conductedLectures}
                        </td>

                        <td className="py-4 px-4 text-center font-bold text-emerald-700">
                          {row.presentCount}
                        </td>

                        <td className="py-4 px-4 text-center font-bold text-rose-600">
                          {row.absentCount}
                        </td>

                        <td className="py-4 px-4 w-44">
                          <div className="flex items-center justify-between text-xs font-black mb-1">
                            <span className={row.attendancePercentage >= 75 ? 'text-emerald-700' : 'text-amber-700'}>
                              {row.conductedLectures === 0 ? 'N/A' : `${row.attendancePercentage}%`}
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                row.attendancePercentage >= 75 ? 'bg-emerald-600' : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.max(row.attendancePercentage, 3)}%` }}
                            />
                          </div>
                        </td>

                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          {row.conductedLectures === 0 ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                              No Conducted Sessions
                            </span>
                          ) : row.attendancePercentage >= 75 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Healthy (≥75%)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              Below Benchmark
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION 4: 1-YEAR RETENTION POLICY & SAFEGUARDS               */}
      {/* ============================================================ */}
      {activeTab === 'RETENTION_POLICY' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-lg">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-white">
                  College 1-Year Attendance Data Retention Policy
                </h3>
                <p className="text-xs text-blue-200/80 max-w-2xl">
                  Mandatory academic policy: All verified student attendance records and lecture sessions are preserved for a minimum of 365 calendar days from their attendance timestamp.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10">
              <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                <span className="text-[11px] font-bold text-blue-200 uppercase">Retention Period</span>
                <div className="text-2xl font-black text-white mt-1">
                  {collegeSettings.retentionDays || 365} Days
                </div>
                <span className="text-[10px] text-emerald-300">Minimum 1 Full Year Guaranteed</span>
              </div>

              <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                <span className="text-[11px] font-bold text-blue-200 uppercase">Active Preserved Records</span>
                <div className="text-2xl font-black text-white mt-1">
                  {db.getAllAttendance().length} Records
                </div>
                <span className="text-[10px] text-blue-300">Protected against early deletion</span>
              </div>

              <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                <span className="text-[11px] font-bold text-blue-200 uppercase">Automated Cleanup Rule</span>
                <div className="text-base font-black text-white mt-1">
                  Strict Cutoff Safeguard
                </div>
                <span className="text-[10px] text-blue-300">Records &lt; 365 days are never purged</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-[11px] text-blue-200/70">
                Any automated maintenance job is programmatically prevented from removing logs earlier than the configured retention period.
              </p>
              <button
                onClick={handleRunRetentionAudit}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-2 self-start sm:self-auto shrink-0"
              >
                <RefreshCw className="w-4 h-4" />
                Run Retention Policy Audit
              </button>
            </div>

            {retentionAuditResult && (
              <div className="bg-emerald-950/60 border border-emerald-500/40 p-4 rounded-2xl text-xs space-y-1">
                <div className="flex items-center gap-2 text-emerald-300 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Retention Audit Completed Successfully</span>
                </div>
                <p className="text-emerald-100/80">
                  {retentionAuditResult.retainedCount} records verified within the {retentionAuditResult.retentionDays}-day retention period. {retentionAuditResult.cleanedCount} obsolete expired records purged.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 1: INSPECT LECTURE FULL CLASS ROSTER                   */}
      {/* ============================================================ */}
      {inspectLectureId && inspectLectureData && inspectLectureData.lecture && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/80">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                    Sem {inspectLectureData.lecture.semester} ({inspectLectureData.lecture.division})
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    {inspectLectureData.lecture.subjectCode}
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  {inspectLectureData.lecture.subjectName}
                </h3>
                <p className="text-xs text-slate-500">
                  Date: <strong>{inspectLectureData.lecture.date}</strong> • Window: {inspectLectureData.lecture.startTime} - {inspectLectureData.lecture.endTime} • Faculty: {inspectLectureData.lecture.facultyName}
                </p>
              </div>

              <button
                onClick={() => setInspectLectureId(null)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Statistics Summary */}
            <div className="grid grid-cols-4 gap-2 p-4 bg-white border-b border-slate-100 text-center">
              <div className="bg-slate-50 p-2.5 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Enrolled</span>
                <div className="text-lg font-black text-slate-800">{inspectLectureData.summary.totalEnrolled}</div>
              </div>
              <div className="bg-emerald-50 p-2.5 rounded-xl">
                <span className="text-[10px] text-emerald-600 font-bold uppercase">Present</span>
                <div className="text-lg font-black text-emerald-800">{inspectLectureData.summary.present}</div>
              </div>
              <div className="bg-rose-50 p-2.5 rounded-xl">
                <span className="text-[10px] text-rose-600 font-bold uppercase">Absent</span>
                <div className="text-lg font-black text-rose-800">{inspectLectureData.summary.absent}</div>
              </div>
              <div className="bg-amber-50 p-2.5 rounded-xl">
                <span className="text-[10px] text-amber-600 font-bold uppercase">Rejected</span>
                <div className="text-lg font-black text-amber-800">{inspectLectureData.summary.rejected}</div>
              </div>
            </div>

            {/* Modal Student List */}
            <div className="p-4 overflow-y-auto space-y-2 max-h-96">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Complete Class Attendance Log ({inspectLectureData.entries.length} Students)
              </h4>
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                {inspectLectureData.entries.map(entry => (
                  <div key={entry.student.id} className="p-3 bg-white hover:bg-slate-50 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{entry.student.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {entry.student.enrollmentNumber} • Roll: {entry.student.rollNumber}
                      </div>
                      {entry.rejectionReason && (
                        <p className="text-[10px] text-rose-600 font-semibold mt-0.5">
                          ⚠️ {entry.rejectionReason}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      {entry.status === 'PRESENT' ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            PRESENT
                          </span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            Marked at {entry.markedTimeStr || '09:05 AM'}
                          </span>
                        </div>
                      ) : entry.status === 'LATE' ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            LATE
                          </span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            Marked at {entry.markedTimeStr}
                          </span>
                        </div>
                      ) : entry.status === 'REJECTED' ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            REJECTED
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                          ABSENT
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Attendance rate: {inspectLectureData.summary.attendancePercentage}%
              </span>
              <button
                onClick={() => setInspectLectureId(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition"
              >
                Close List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: INSPECT SINGLE STUDENT BREAKDOWN                    */}
      {/* ============================================================ */}
      {inspectStudentMetric && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50">
              <div>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-mono">
                  {inspectStudentMetric.enrollmentNumber}
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  {inspectStudentMetric.studentName}
                </h3>
                <p className="text-xs text-slate-500">
                  Subject: <strong>{inspectStudentMetric.subjectName}</strong>
                </p>
              </div>

              <button
                onClick={() => setInspectStudentMetric(null)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2 max-h-96">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Lecture-by-Lecture Verification Records
              </h4>

              {studentLectureBreakdown && studentLectureBreakdown.length > 0 ? (
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                  {studentLectureBreakdown.map((item, idx) => (
                    <div key={idx} className="p-3 bg-white hover:bg-slate-50 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900">
                          {item.lecture.lectureNumber || `Lecture 0${idx + 1}`}
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {item.lecture.date} ({item.lecture.startTime} - {item.lecture.endTime})
                        </p>
                      </div>

                      <div>
                        {item.status === 'PRESENT' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            ✓ Present ({item.markedTime || 'On-Time'})
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                            ✗ Absent
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No individual sessions conducted yet.
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setInspectStudentMetric(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
