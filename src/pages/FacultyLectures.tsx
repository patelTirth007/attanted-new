import React, { useState, useEffect } from 'react';
import { Lecture, Subject } from '../types';
import { db } from '../services/db';
import { Calendar, Plus, Clock, MapPin, Radio, Check, X, Trash2 } from 'lucide-react';

interface FacultyLecturesProps {
  facultyId: string;
  facultyName: string;
  onOpenLiveAttendance: (lecture: Lecture) => void;
}

export const FacultyLectures: React.FC<FacultyLecturesProps> = ({
  facultyId,
  facultyName,
  onOpenLiveAttendance
}) => {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [filterSemester, setFilterSemester] = useState<number | 'ALL'>('ALL');

  // Form fields
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [semester, setSemester] = useState(5);
  const [division, setDivision] = useState('A');
  const [room, setRoom] = useState('Room 101 - Lecture Hall');
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('10:00 AM');
  const [attendanceStart, setAttendanceStart] = useState('09:00 AM');
  const [attendanceEnd, setAttendanceEnd] = useState('11:59 PM');

  // Custom subject creation if none in semester
  const [customSubjectCode, setCustomSubjectCode] = useState('');
  const [customSubjectName, setCustomSubjectName] = useState('');

  const loadData = () => {
    setLectures(db.getAllLectures());
    const subs = db.getAllSubjects();
    setSubjects(subs);
    if (subs.length > 0 && !selectedSubjectId) {
      const match = subs.find(s => s.semester === semester);
      setSelectedSubjectId(match ? match.id : subs[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // When form semester changes, auto-select matching subject
  const handleFormSemesterChange = (newSem: number) => {
    setSemester(newSem);
    const matchingSubs = subjects.filter(s => s.semester === newSem);
    if (matchingSubs.length > 0) {
      setSelectedSubjectId(matchingSubs[0].id);
    } else {
      setSelectedSubjectId('');
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    let sub = subjects.find(s => s.id === selectedSubjectId);
    
    // If no subject selected or custom entered
    if (!sub) {
      const code = customSubjectCode.trim() || `SEM${semester}-101`;
      const name = customSubjectName.trim() || `Course for Semester ${semester}`;
      sub = db.addSubject({
        subjectCode: code,
        subjectName: name,
        semester,
        department: 'Information Technology'
      });
    }

    db.createLecture({
      subjectId: sub.id,
      facultyId,
      facultyName,
      subjectName: sub.subjectName,
      subjectCode: sub.subjectCode,
      semester,
      division: division.toUpperCase(),
      room,
      date,
      startTime,
      endTime,
      attendanceStart,
      attendanceEnd,
      status: 'ACTIVE'
    });

    loadData();
    setShowCreateModal(false);
    setCustomSubjectCode('');
    setCustomSubjectName('');
    setFeedback(`✅ Real Lecture for Semester ${semester} (${sub.subjectName}) created!`);
    setTimeout(() => setFeedback(null), 3000);
  };

  const displayedLectures = filterSemester === 'ALL'
    ? lectures
    : lectures.filter(l => l.semester === filterSemester);

  const availableSemesters = [1, 2, 3, 4, 5, 6, 7, 8];
  const semesterSubjects = subjects.filter(s => s.semester === semester);

  const handleToggleStatus = (lecture: Lecture) => {
    const newStatus = lecture.status === 'ACTIVE' ? 'CLOSED' : 'ACTIVE';
    db.updateLectureStatus(lecture.id, newStatus);
    loadData();
  };

  const handleDeleteLecture = (lectureId: string, name: string) => {
    if (window.confirm(`Delete lecture "${name}"?`)) {
      db.deleteLecture(lectureId);
      loadData();
      setFeedback(`Removed "${name}".`);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleClearAllLectures = () => {
    if (window.confirm('Are you sure you want to delete ALL lectures?')) {
      db.clearAllLectures();
      loadData();
      setFeedback('All lectures deleted.');
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Lecture Management ({lectures.length})</h2>
          <p className="text-xs text-slate-500">
            Define real lecture schedules, rooms, and attendance windows for students to mark attendance.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {lectures.length > 0 && (
            <button
              onClick={handleClearAllLectures}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear All
            </button>
          )}

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            + Create Real Lecture
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold">
          {feedback}
        </div>
      )}

      {/* Semester Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
          <span>🎓 Filter Lectures by Semester:</span>
          {filterSemester !== 'ALL' && (
            <button
              onClick={() => setFilterSemester('ALL')}
              className="text-blue-600 hover:text-blue-800 font-semibold"
            >
              Show All Semesters →
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
          <button
            onClick={() => setFilterSemester('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
              filterSemester === 'ALL'
                ? 'bg-blue-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>All Semesters</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              filterSemester === 'ALL' ? 'bg-blue-800 text-blue-100' : 'bg-slate-200 text-slate-700'
            }`}>
              {lectures.length}
            </span>
          </button>

          {availableSemesters.map((sem) => {
            const count = lectures.filter(l => l.semester === sem).length;
            const isSelected = filterSemester === sem;

            return (
              <button
                key={sem}
                onClick={() => setFilterSemester(sem)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-700 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>Sem {sem}</span>
                {count > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isSelected ? 'bg-blue-800 text-blue-100' : 'bg-blue-50 text-blue-700 font-extrabold'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lectures Grid */}
      {displayedLectures.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
          {filterSemester === 'ALL'
            ? 'No lectures created yet. Click + Create Real Lecture to start a lecture session.'
            : `No lectures found for Semester ${filterSemester}. Click + Create Real Lecture to schedule a lecture for Semester ${filterSemester}.`}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedLectures.map((lec) => (
            <div
              key={lec.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-blue-300 transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded">
                  {lec.subjectCode} • Sem {lec.semester} ({lec.division})
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleToggleStatus(lec)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded transition ${
                      lec.status === 'ACTIVE' 
                        ? 'bg-emerald-100 text-emerald-800 animate-pulse' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    title="Click to toggle status"
                  >
                    {lec.status}
                  </button>
                  <button
                    onClick={() => handleDeleteLecture(lec.id, lec.subjectName)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                    title="Delete lecture"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">{lec.subjectName}</h3>
                <p className="text-xs text-slate-500">{lec.facultyName}</p>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{lec.date}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{lec.startTime} – {lec.endTime}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{lec.room}</span>
                </div>
                <div className="text-[11px] text-blue-700 font-semibold bg-blue-50/60 p-2 rounded-lg mt-2">
                  Window: {lec.attendanceStart} – {lec.attendanceEnd}
                </div>
              </div>

              <button
                onClick={() => onOpenLiveAttendance(lec)}
                className="w-full py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
              >
                <Radio className="w-3.5 h-3.5" />
                Open Live Attendance
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create Lecture Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Create Real Lecture Session</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              {/* Semester & Division selection first */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Semester *</label>
                  <select
                    value={semester}
                    onChange={(e) => handleFormSemesterChange(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-blue-900"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Division</label>
                  <input
                    type="text"
                    value={division}
                    onChange={(e) => setDivision(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl uppercase font-bold"
                  />
                </div>
              </div>

              {/* Subject Course for chosen semester */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Subject Course (Semester {semester}) *
                </label>
                {semesterSubjects.length > 0 ? (
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    {semesterSubjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.subjectName} ({sub.subjectCode})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-2 bg-blue-50/60 p-3 rounded-xl border border-blue-200">
                    <p className="text-[11px] text-blue-900 font-semibold">
                      No courses saved yet for Semester {semester}. Enter course details below:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Course Code (e.g. 3140702)"
                        value={customSubjectCode}
                        onChange={(e) => setCustomSubjectCode(e.target.value)}
                        className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Course Name (e.g. Microprocessors)"
                        value={customSubjectName}
                        onChange={(e) => setCustomSubjectName(e.target.value)}
                        className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Classroom / Lab *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lab 302 / Seminar Hall A"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Lecture Date *</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="text"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">End Time</label>
                  <input
                    type="text"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Attendance Window Start</label>
                  <input
                    type="text"
                    value={attendanceStart}
                    onChange={(e) => setAttendanceStart(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Attendance Window End</label>
                  <input
                    type="text"
                    value={attendanceEnd}
                    onChange={(e) => setAttendanceEnd(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl shadow"
                >
                  Deploy Lecture
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
