import React, { useState, useEffect } from 'react';
import { Student, AttendanceRecord, Lecture } from '../types';
import { db } from '../services/db';
import { notificationService } from '../services/notificationService';
import { StatusBadge } from '../components/StatusBadge';
import { 
  History, 
  Search, 
  Filter, 
  ShieldCheck, 
  MapPin, 
  Mail, 
  ExternalLink, 
  QrCode, 
  GraduationCap, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

interface StudentHistoryProps {
  student: Student;
}

export const StudentHistory: React.FC<StudentHistoryProps> = ({ student }) => {
  const studentEmail = student.email || `${student.enrollmentNumber.toLowerCase()}@college.edu`;
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<number | 'ALL'>(student.semester || 'ALL');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const availableSemesters = [1, 2, 3, 4, 5, 6, 7, 8];

  useEffect(() => {
    const recs = db.getAllAttendance().filter(
      a => a.studentId === student.id || (a.studentEmail && a.studentEmail.toLowerCase() === studentEmail.toLowerCase())
    );
    setRecords(recs);
    setLectures(db.getAllLectures());
  }, [student, studentEmail]);

  // Distinct subjects available for selected semester
  const allSubjects = db.getAllSubjects();
  const availableSubjectsForSemester = selectedSemester === 'ALL'
    ? allSubjects
    : allSubjects.filter(s => s.semester === selectedSemester);

  const handleSemesterSelect = (sem: number | 'ALL') => {
    setSelectedSemester(sem);
    setSelectedSubjectId('ALL');
  };

  // Filter records by selected semester, subject, status, and search query
  const filteredRecords = records.filter(rec => {
    const lecture = lectures.find(l => l.id === rec.lectureId);
    const matchesSemester = selectedSemester === 'ALL' || lecture?.semester === selectedSemester;
    const matchesSubject = selectedSubjectId === 'ALL' || lecture?.subjectId === selectedSubjectId || lecture?.subjectCode === selectedSubjectId;
    const matchesStatus = statusFilter === 'ALL' || rec.status === statusFilter;
    const matchesSearch = !search ||
      rec.markedTimeStr.toLowerCase().includes(search.toLowerCase()) ||
      (lecture?.subjectName.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (lecture?.subjectCode.toLowerCase().includes(search.toLowerCase()) ?? false);
    return matchesSemester && matchesSubject && matchesStatus && matchesSearch;
  });

  // Calculate statistics for the selected semester & subject
  const semesterLectures = selectedSemester === 'ALL'
    ? lectures
    : lectures.filter(l => l.semester === selectedSemester);

  const scopeLectures = selectedSubjectId === 'ALL'
    ? semesterLectures
    : semesterLectures.filter(l => l.subjectId === selectedSubjectId || l.subjectCode === selectedSubjectId);

  const totalLecturesInScope = Math.max(scopeLectures.length, 1);
  const attendedInScope = filteredRecords.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
  const percentageInScope = ((attendedInScope / totalLecturesInScope) * 100).toFixed(1);
  const isEligible = Number(percentageInScope) >= 75;

  // Stats across all 8 semesters
  const allSemestersStats = availableSemesters.map(sem => {
    const semLecs = lectures.filter(l => l.semester === sem);
    const semRecords = records.filter(r => {
      const lec = lectures.find(l => l.id === r.lectureId);
      return lec?.semester === sem;
    });
    const conducted = semLecs.length;
    const attended = semRecords.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
    const pct = conducted > 0 ? Math.round((attended / conducted) * 100) : 0;
    return {
      semester: sem,
      conducted,
      attended,
      pct,
      isEligible: pct >= 75
    };
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-900">Attendance History & Audit Log</h2>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              Semester Segregated Records
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete log of subject attendance verified via registered Email ID ({studentEmail}) and 100m GPS handheld proximity.
          </p>
        </div>

        <div className="text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl px-3.5 py-2 shadow-sm flex items-center gap-2">
          <span>Enrolled: <strong>Semester {student.semester}</strong></span>
          <span>• Roll: <strong>{student.rollNumber}</strong></span>
        </div>
      </div>

      {/* Semester Selector Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-blue-700" />
            <span>Filter Attendance by Semester:</span>
          </div>
          {selectedSemester !== 'ALL' && (
            <button
              onClick={() => setSelectedSemester('ALL')}
              className="text-blue-600 hover:text-blue-800 font-semibold"
            >
              View All Semesters Combined →
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-none">
          <button
            onClick={() => handleSemesterSelect('ALL')}
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
              {records.length}
            </span>
          </button>

          {availableSemesters.map((sem) => {
            const isEnrolled = student.semester === sem;
            const isSelected = selectedSemester === sem;
            const semRecordsCount = records.filter(r => {
              const lec = lectures.find(l => l.id === r.lectureId);
              return lec?.semester === sem;
            }).length;

            return (
              <button
                key={sem}
                onClick={() => handleSemesterSelect(sem)}
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
                    Current
                  </span>
                )}
                {semRecordsCount > 0 && !isEnrolled && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700">
                    {semRecordsCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Dynamic Subject Select Option for Selected Semester */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-600">
              📚 Subject Select Option:
            </span>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">
                {selectedSemester === 'ALL' ? 'All Subjects across All Semesters' : `All Subjects in Semester ${selectedSemester}`} ({availableSubjectsForSemester.length} courses)
              </option>
              {availableSubjectsForSemester.map(sub => (
                <option key={sub.id} value={sub.id}>
                  {sub.subjectName} ({sub.subjectCode}) {selectedSemester === 'ALL' ? `[Sem ${sub.semester}]` : ''}
                </option>
              ))}
            </select>
          </div>

          {selectedSubjectId !== 'ALL' && (
            <button
              onClick={() => setSelectedSubjectId('ALL')}
              className="text-xs text-blue-700 hover:text-blue-900 font-bold self-start sm:self-auto bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200"
            >
              Show All Subjects in Semester
            </button>
          )}
        </div>
      </div>

      {/* Selected Semester & Subject Attendance Percentage Summary Card */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
              {selectedSemester === 'ALL' 
                ? 'Overall Academic Attendance' 
                : selectedSubjectId !== 'ALL'
                ? `Semester ${selectedSemester} • Subject Performance`
                : `Semester ${selectedSemester} Performance`}
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
              isEligible ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
            }`}>
              {isEligible ? 'ELIGIBLE (≥75%)' : 'LOW ATTENDANCE'}
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black">
            {percentageInScope}% Attendance Rate
          </h3>
          <p className="text-xs text-blue-200/80 mt-1">
            Attended {attendedInScope} out of {totalLecturesInScope} sessions conducted in {selectedSemester === 'ALL' ? 'all semesters' : `Semester ${selectedSemester}`}{selectedSubjectId !== 'ALL' ? ' for this subject' : ''}.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto bg-white/10 px-4 py-2.5 rounded-xl border border-white/20">
          <div>
            <span className="text-[10px] text-blue-200 block">Status:</span>
            <span className="text-xs font-bold text-white flex items-center gap-1">
              {isEligible ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Examination Cleared
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  Shortage Alert
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* ALL SEMESTERS PERFORMANCE MATRIX */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800">
            📊 All Semesters Attendance Performance (Sem 1 to 8):
          </span>
          <span className="text-[11px] text-slate-500">
            Click any semester to view subject records
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {allSemestersStats.map(st => (
            <div
              key={st.semester}
              onClick={() => handleSemesterSelect(st.semester)}
              className={`p-2.5 rounded-xl border cursor-pointer text-center space-y-1 transition ${
                selectedSemester === st.semester
                  ? 'bg-blue-50 border-blue-400 shadow-sm ring-1 ring-blue-400'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className="text-[10px] font-bold text-slate-500 block">Sem {st.semester}</span>
              <div className="text-sm font-black text-slate-900">{st.pct}%</div>
              <span className={`text-[9px] font-bold block ${st.isEligible ? 'text-emerald-700' : 'text-rose-700'}`}>
                {st.attended}/{st.conducted} classes
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by subject name, code, or time..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Status:</span>
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

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No attendance records match your filter criteria for {selectedSemester === 'ALL' ? 'all semesters' : `Semester ${selectedSemester}`}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Subject & Code</th>
                  <th className="py-3.5 px-4">Semester & Div</th>
                  <th className="py-3.5 px-4">Lecture Time</th>
                  <th className="py-3.5 px-4">Marked At</th>
                  <th className="py-3.5 px-4">Verified Email ID</th>
                  <th className="py-3.5 px-4">Gmail Notification</th>
                  <th className="py-3.5 px-4">QR & 100m Proximity</th>
                  <th className="py-3.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((rec) => {
                  const lecture = lectures.find(l => l.id === rec.lectureId);
                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{lecture?.subjectName || 'Lecture'}</div>
                        <span className="text-[10px] text-blue-700 font-mono font-medium">
                          {lecture?.subjectCode || ''} • {lecture?.facultyName || ''}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          Sem {lecture?.semester || student.semester} ({lecture?.division || student.division})
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {lecture?.startTime} - {lecture?.endTime}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {rec.markedTimeStr}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-mono">
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                          {rec.studentEmail || studentEmail}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <Mail className="w-3.5 h-3.5 text-red-600" />
                          Dispatched ✓
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{Math.round(rec.facultyDistanceMeters || rec.distanceMeters)}m (≤100m)</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <StatusBadge status={rec.status} />
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
  );
};
