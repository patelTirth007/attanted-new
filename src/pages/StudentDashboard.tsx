import React, { useEffect, useState } from 'react';
import { Student, Lecture, AttendanceRecord, CollegeSettings } from '../types';
import { db } from '../services/db';
import { getCurrentDeviceLocation, verifyLocationGeofence, GeofenceVerificationResult } from '../services/gps';
import { notificationService } from '../services/notificationService';
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
  Mail,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  QrCode,
  ScanFace,
  Smartphone,
  Camera,
  Sparkles,
  GraduationCap
} from 'lucide-react';
import { StudentBiometricModal } from '../components/StudentBiometricModal';
import { generateStudentFaceSvg } from '../services/biometrics';

interface StudentDashboardProps {
  student: Student;
  onNavigateToMarkAttendance: (lecture: Lecture) => void;
  onNavigateToHistory: () => void;
  onNavigateToNotifications?: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  student,
  onNavigateToMarkAttendance,
  onNavigateToHistory,
  onNavigateToNotifications
}) => {
  const [currentStudent, setCurrentStudent] = useState<Student>(() => {
    return db.getStudentById(student.id) || student;
  });
  const studentEmail = currentStudent.email || `${currentStudent.enrollmentNumber.toLowerCase()}@college.edu`;
  const [activeSemester, setActiveSemester] = useState<number>(currentStudent.semester || 5);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('ALL');
  const [allLecturesList, setAllLecturesList] = useState<Lecture[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [settings] = useState<CollegeSettings>(db.getCollegeSettings());
  const [geofenceResult, setGeofenceResult] = useState<GeofenceVerificationResult | undefined>();
  const [loadingGps, setLoadingGps] = useState(false);
  const [unreadEmailsCount, setUnreadEmailsCount] = useState(0);
  const [showBiometricModal, setShowBiometricModal] = useState<boolean>(false);

  const availableSemesters = [1, 2, 3, 4, 5, 6, 7, 8];

  const handleSemesterChange = (newSem: number) => {
    setActiveSemester(newSem);
    setSelectedSubjectId('ALL');
  };

  const loadData = () => {
    // Load student's lectures for active semester
    const allLecs = db.getAllLectures();
    setAllLecturesList(allLecs);

    const semLecs = allLecs.filter(l => l.semester === activeSemester);
    setLectures(semLecs);

    // Load attendance records for this student and email
    const records = db.getAllAttendance().filter(
      a => a.studentId === student.id || (a.studentEmail && a.studentEmail.toLowerCase() === studentEmail.toLowerCase())
    );
    setAttendance(records);

    // Notifications count
    const notifs = notificationService.getNotificationsForEmail(studentEmail);
    setUnreadEmailsCount(notifs.length);
  };

  useEffect(() => {
    loadData();
    checkLocation();

    const handleNotifEvent = () => loadData();
    window.addEventListener('sca_gmail_notification_dispatched', handleNotifEvent);
    return () => window.removeEventListener('sca_gmail_notification_dispatched', handleNotifEvent);
  }, [student, studentEmail, activeSemester]);

  const checkLocation = async () => {
    setLoadingGps(true);
    try {
      const loc = await getCurrentDeviceLocation({
        latitude: settings.latitude,
        longitude: settings.longitude
      });
      const res = verifyLocationGeofence(
        loc.latitude,
        loc.longitude,
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

  const semesterAttendance = attendance.filter(a => {
    const l = allLecturesList.find(lec => lec.id === a.lectureId);
    return l?.semester === activeSemester;
  });

  const totalConducted = Math.max(lectures.length, 1);
  const presentCount = semesterAttendance.filter(a => a.status === 'PRESENT').length;
  const lateCount = semesterAttendance.filter(a => a.status === 'LATE').length;
  const absentCount = Math.max(0, totalConducted - presentCount - lateCount);
  const overallPercentage = ((presentCount + (lateCount * 0.8)) / totalConducted) * 100;

  // Distinct subjects for active semester and their attendance analytics
  const allSubjects = db.getAllSubjects();
  const semesterSubjects = allSubjects.filter(s => s.semester === activeSemester);
  const subjectsToDisplay = semesterSubjects.length > 0 
    ? semesterSubjects 
    : allSubjects.filter(s => s.semester === student.semester);

  const subjectsWithStats = subjectsToDisplay.map((sub) => {
    const subjectLecs = lectures.filter(l => l.subjectId === sub.id || l.subjectCode === sub.subjectCode);
    const subTotal = subjectLecs.length || 1;
    const subPresent = semesterAttendance.filter(a => {
      const lec = lectures.find(l => l.id === a.lectureId);
      return lec?.subjectId === sub.id || lec?.subjectCode === sub.subjectCode;
    }).length;
    const pct = Math.min(100, Math.round((subPresent / subTotal) * 100));

    return {
      id: sub.id,
      name: sub.subjectName,
      code: sub.subjectCode,
      semester: sub.semester,
      total: subTotal,
      present: subPresent,
      pct: pct > 0 ? pct : (subPresent > 0 ? 100 : 0)
    };
  });

  // Statistics across ALL 8 semesters
  const allSemestersStats = availableSemesters.map(sem => {
    const semLecs = allLecturesList.filter(l => l.semester === sem);
    const semAtt = attendance.filter(a => {
      const l = allLecturesList.find(lec => lec.id === a.lectureId);
      return l?.semester === sem;
    });
    const conducted = semLecs.length;
    const attended = semAtt.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
    const percentage = conducted > 0 ? Math.round((attended / conducted) * 100) : 0;
    const semSubs = allSubjects.filter(s => s.semester === sem);
    return {
      semester: sem,
      coursesCount: semSubs.length,
      conducted,
      attended,
      percentage,
      isEligible: percentage >= 75
    };
  });

  const totalAllConducted = allSemestersStats.reduce((acc, s) => acc + s.conducted, 0);
  const totalAllAttended = allSemestersStats.reduce((acc, s) => acc + s.attended, 0);
  const cumulativeAllPercentage = totalAllConducted > 0 
    ? Math.round((totalAllAttended / totalAllConducted) * 100) 
    : 0;

  // Filter lectures by selected subject
  const displayedLectures = lectures.filter(lec => {
    if (selectedSubjectId === 'ALL') return true;
    return lec.subjectId === selectedSubjectId || lec.subjectCode === selectedSubjectId;
  });

  // Filter subject stats if selectedSubjectId is chosen
  const filteredSubjectsWithStats = selectedSubjectId === 'ALL'
    ? subjectsWithStats
    : subjectsWithStats.filter(s => s.id === selectedSubjectId || s.code === selectedSubjectId);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Student Greeting & Email Badge */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              Sem {student.semester} - Div {student.division}
            </span>
            <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
              Roll No: {student.rollNumber}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              1 Email = 1 Subject Attendance Active
            </span>
          </div>

          <h2 className="text-2xl font-black text-slate-900">Welcome, {student.name}</h2>
          
          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-600">
            <span>Official Email ID:</span>
            <span className="font-mono font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              {studentEmail}
            </span>
            <span>• Enrollment: <strong className="text-slate-800">{student.enrollmentNumber}</strong></span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowBiometricModal(true)}
            className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition flex items-center gap-1.5 shadow-sm"
          >
            <ScanFace className="w-4 h-4 text-blue-600" />
            Face Scan & Device Profile
          </button>

          {onNavigateToNotifications && (
            <button
              onClick={onNavigateToNotifications}
              className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl border border-red-200 transition flex items-center gap-1.5 shadow-sm"
            >
              <Mail className="w-4 h-4 text-red-600" />
              Gmail Notifications ({unreadEmailsCount})
            </button>
          )}

          <button
            onClick={onNavigateToHistory}
            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            Attendance History →
          </button>
        </div>
      </div>

      {/* Step 1: Student Biometric Face Scan & Registered Device Card */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-2xl p-4 sm:p-5 text-white shadow-md border border-blue-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-sky-400 shadow-md bg-slate-800 shrink-0">
            <img
              src={currentStudent.facePhotoUrl || generateStudentFaceSvg(currentStudent.name, currentStudent.enrollmentNumber)}
              alt={currentStudent.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-sky-300 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-400/40">
                Step 1 Biometric Security
              </span>
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Face Enrolled in Faculty Section
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-xs font-bold text-slate-200">Registered Device:</span>
              <span className="font-mono text-xs text-sky-200 bg-white/10 px-2 py-0.5 rounded">
                {currentStudent.deviceName || 'Trusted Student Device'}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                ({currentStudent.deviceId || 'DEV-VERIFIED'})
              </span>
            </div>
            <p className="text-[11px] text-slate-300/80 mt-1">
              Required for attendance: At lecture time, <strong>(1) 100m Location</strong>, <strong>(2) Session Code</strong>, and <strong>(3) Device & Face Scan</strong> must all match to approve attendance.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowBiometricModal(true)}
          className="self-start sm:self-auto px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-slate-950 font-black text-xs rounded-xl shadow transition flex items-center gap-1.5 shrink-0"
        >
          <Camera className="w-3.5 h-3.5 text-slate-950" />
          Update Face Scan / Device
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

        {/* Present Count */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Marked Present</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{presentCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">Verified via Email & GPS</p>
        </div>

        {/* Gmail Notifications Dispatched */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Gmail Confirmations</span>
            <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{unreadEmailsCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">Official messages sent</p>
        </div>

        {/* Absent */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Missed Sessions</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{absentCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">Pending attendance</p>
        </div>
      </div>

      {/* GPS Campus Geofence Status */}
      <GeofenceCard
        result={geofenceResult}
        collegeLat={settings.latitude}
        collegeLon={settings.longitude}
        allowedRadius={settings.allowedRadiusMeters}
        onRefreshGPS={checkLocation}
        isRefreshing={loadingGps}
      />

      {/* Semester Selection Tabs & Subject Select Option */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold text-slate-800">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-blue-700" />
            <span>Select Semester (Sem 1 to 8):</span>
          </div>
          {activeSemester !== student.semester && (
            <button
              onClick={() => handleSemesterChange(student.semester)}
              className="text-blue-600 hover:text-blue-800 font-semibold self-start sm:self-auto"
            >
              Back to My Enrolled Semester ({student.semester}) →
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
          {availableSemesters.map((sem) => {
            const isEnrolled = student.semester === sem;
            const isSelected = activeSemester === sem;
            const count = allLecturesList.filter(l => l.semester === sem).length;

            return (
              <button
                key={sem}
                onClick={() => handleSemesterChange(sem)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-700 text-white shadow-sm'
                    : isEnrolled
                    ? 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>Sem {sem}</span>
                {isEnrolled && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold ${
                    isSelected ? 'bg-blue-800 text-blue-100' : 'bg-blue-600 text-white'
                  }`}>
                    My Batch
                  </span>
                )}
                {count > 0 && !isEnrolled && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Dynamic Subject Select Option for Selected Semester */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-600">
              📚 Subject Select Option (Semester {activeSemester}):
            </span>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Subjects in Semester {activeSemester} ({semesterSubjects.length} courses)</option>
              {semesterSubjects.map(sub => (
                <option key={sub.id} value={sub.id}>
                  {sub.subjectName} ({sub.subjectCode})
                </option>
              ))}
            </select>
          </div>

          {selectedSubjectId !== 'ALL' && (
            <button
              onClick={() => setSelectedSubjectId('ALL')}
              className="text-xs text-blue-700 hover:text-blue-900 font-bold self-start sm:self-auto bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200"
            >
              Show All Subjects (Reset Filter)
            </button>
          )}
        </div>
      </div>

      {/* MANDATORY ATTENDANCE VERIFICATION NOTICE BANNER */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 rounded-3xl p-5 shadow-sm space-y-2">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-2xl bg-blue-700 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-md">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-xs font-black text-blue-950 uppercase tracking-wider">
                Official Attendance Verification Notice
              </h4>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">
                2 Conditions Required
              </span>
            </div>
            <p className="text-xs text-slate-700 mt-1 leading-relaxed">
              To mark attendance for any session, both conditions must be verified right:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-xs">
              <div className="p-2.5 bg-white/80 rounded-xl border border-blue-100 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center">1</span>
                <span className="font-bold text-slate-800">Condition 1: Code Number Right</span>
                <span className="text-[11px] text-slate-500">(Enter active 6-digit session code)</span>
              </div>
              <div className="p-2.5 bg-white/80 rounded-xl border border-blue-100 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center">2</span>
                <span className="font-bold text-slate-800">Condition 2: Location Match</span>
                <span className="text-[11px] text-slate-500">(Same classroom location ≤ 100m)</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-600 mt-2">
              🔒 The <strong>Confirm Attendance</strong> button unlocks only after fulfilling both conditions. When fulfilled, attendance is successfully filled & Gmail alert is sent; otherwise an <strong>Unsuccessful Attendance</strong> popup appears.
            </p>
          </div>
        </div>
      </div>

      {/* Today's Lectures (Filtered by Semester & Subject Select Option) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">Today's Subject Lecture Sessions</h3>
              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                Different Subjects • Different Attendance
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Each subject has its own attendance session. 1 attendance per email ID ({studentEmail}) is enforced.
            </p>
          </div>
          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg self-start sm:self-auto">
            Sem {activeSemester} {selectedSubjectId !== 'ALL' ? `• Filtered Subject` : `• All Subjects`}
          </span>
        </div>

        {displayedLectures.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No lectures scheduled for {selectedSubjectId !== 'ALL' ? 'the selected subject in' : ''} Semester {activeSemester} today.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-3">Subject & Code</th>
                  <th className="pb-3">Time Window</th>
                  <th className="pb-3">Faculty</th>
                  <th className="pb-3">Room</th>
                  <th className="pb-3">Email Attendance Status</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedLectures.map((lec) => {
                  const alreadyMarked = attendance.find(a => 
                    a.lectureId === lec.id && (
                      a.studentId === student.id || 
                      (a.studentEmail && a.studentEmail.toLowerCase() === studentEmail.toLowerCase())
                    )
                  );
                  const isReady = lec.status === 'ACTIVE';

                  return (
                    <tr key={lec.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 pr-3 font-semibold text-slate-800">
                        <div className="font-bold text-slate-900">{lec.subjectName}</div>
                        <span className="text-[10px] text-blue-700 font-mono font-medium">{lec.subjectCode}</span>
                      </td>
                      <td className="py-3.5 pr-3 text-slate-600 font-medium whitespace-nowrap">
                        <div>{lec.startTime} - {lec.endTime}</div>
                        <span className="text-[10px] text-slate-400">Window: {lec.attendanceStart} - {lec.attendanceEnd}</span>
                      </td>
                      <td className="py-3.5 pr-3 text-slate-600">{lec.facultyName}</td>
                      <td className="py-3.5 pr-3 text-slate-600">{lec.room}</td>
                      <td className="py-3.5 pr-3">
                        {alreadyMarked ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              PRESENT (Marked {alreadyMarked.markedTimeStr})
                            </span>
                            <span className="text-[10px] text-red-600 flex items-center gap-1 font-semibold pl-1">
                              <Mail className="w-2.5 h-2.5" /> Gmail Sent
                            </span>
                          </div>
                        ) : (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isReady ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {isReady ? 'SESSION OPEN' : lec.status}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 text-right whitespace-nowrap">
                        {alreadyMarked ? (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                            ✓ Verified Active
                          </span>
                        ) : isReady ? (
                          <button
                            onClick={() => onNavigateToMarkAttendance(lec)}
                            className="px-3 py-1.5 font-bold rounded-lg text-xs transition shadow-sm bg-blue-700 hover:bg-blue-800 text-white flex items-center gap-1.5 ml-auto"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            FILL ATTENDANCE
                          </button>
                        ) : (
                          <span className="text-slate-400 font-medium">SESSION CLOSED</span>
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

      {/* Subject-wise Attendance Analytics (Filtered by Selected Semester & Subject) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Subject-wise Attendance Registry (Semester {activeSemester})
            </h3>
            <p className="text-xs text-slate-500">
              Each subject tracks attendance independently. Minimum 75% attendance required per subject for exam eligibility.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg self-start sm:self-auto">
            Showing {filteredSubjectsWithStats.length} Course{filteredSubjectsWithStats.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubjectsWithStats.map((sub) => (
            <div key={sub.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 hover:border-blue-300 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 truncate pr-2" title={sub.name}>{sub.name}</span>
                <span className={`text-xs font-black px-2 py-0.5 rounded ${
                  sub.pct >= 75 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {sub.pct}%
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${sub.pct >= 75 ? 'bg-emerald-600' : 'bg-rose-500'}`}
                  style={{ width: `${Math.max(sub.pct, 5)}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1">
                <span className="font-mono text-slate-600 font-bold">{sub.code}</span>
                <span className="font-semibold text-slate-700">{sub.present} / {sub.total} Attended</span>
              </div>
              <div className="text-[10px] font-bold text-right pt-0.5">
                {sub.pct >= 75 ? (
                  <span className="text-emerald-700">✓ Exam Eligible</span>
                ) : (
                  <span className="text-rose-700">⚠️ Low Attendance Warning</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ALL 8 SEMESTERS PERFORMANCE & ATTENDANCE PERCENTAGE MATRIX */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-black text-white">All Semesters Attendance Matrix (Sem 1 to 8)</h3>
            </div>
            <p className="text-xs text-blue-200/80 mt-1">
              Consolidated attendance percentages across all academic semesters.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-2xl border border-white/15">
            <span className="text-xs text-blue-200 font-medium">Cumulative Attendance:</span>
            <span className={`text-base font-black ${
              cumulativeAllPercentage >= 75 ? 'text-emerald-300' : 'text-amber-300'
            }`}>
              {cumulativeAllPercentage}%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {allSemestersStats.map((st) => (
            <div
              key={st.semester}
              onClick={() => handleSemesterChange(st.semester)}
              className={`p-3 rounded-2xl border cursor-pointer transition text-center space-y-1.5 ${
                activeSemester === st.semester
                  ? 'bg-blue-600/40 border-blue-400 shadow-lg ring-2 ring-blue-400'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200 block">
                Sem {st.semester}
              </span>
              <div className="text-base font-black text-white">
                {st.percentage}%
              </div>
              <div className="text-[10px] text-blue-200/70">
                {st.attended}/{st.conducted} classes
              </div>
              <span className={`inline-block text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                st.isEligible ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
              }`}>
                {st.isEligible ? 'Eligible' : 'Shortage'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
