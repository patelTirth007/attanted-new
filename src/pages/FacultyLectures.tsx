import React, { useState, useEffect } from 'react';
import { Lecture, Subject } from '../types';
import { db } from '../services/db';
import { Calendar, Plus, Clock, MapPin, Radio, Check, X } from 'lucide-react';

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

  // Form fields
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [semester, setSemester] = useState(5);
  const [division, setDivision] = useState('A');
  const [room, setRoom] = useState('Lab 301 - IT Block');
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('10:00 AM');
  const [attendanceStart, setAttendanceStart] = useState('09:00 AM');
  const [attendanceEnd, setAttendanceEnd] = useState('09:15 AM');

  useEffect(() => {
    setLectures(db.getAllLectures());
    const subs = db.getAllSubjects();
    setSubjects(subs);
    if (subs.length > 0) setSelectedSubjectId(subs[0].id);
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const sub = subjects.find(s => s.id === selectedSubjectId);
    if (!sub) return;

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

    setLectures(db.getAllLectures());
    setShowCreateModal(false);
  };

  const handleToggleStatus = (lecture: Lecture) => {
    const newStatus = lecture.status === 'ACTIVE' ? 'CLOSED' : 'ACTIVE';
    db.updateLectureStatus(lecture.id, newStatus);
    setLectures(db.getAllLectures());
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Lecture Management</h2>
          <p className="text-xs text-slate-500">
            Define lecture schedules, rooms, and attendance windows for students to mark attendance.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create New Lecture
        </button>
      </div>

      {/* Lectures Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {lectures.map((lec) => (
          <div
            key={lec.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-blue-300 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded">
                {lec.subjectCode} • Sem {lec.semester} ({lec.division})
              </span>
              <button
                onClick={() => handleToggleStatus(lec)}
                className={`text-[10px] font-bold px-2 py-0.5 rounded transition ${
                  lec.status === 'ACTIVE' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                title="Click to toggle status"
              >
                {lec.status}
              </button>
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

      {/* Create Lecture Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Create New Lecture</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject *</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.subjectName} ({sub.subjectCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Semester</label>
                  <input
                    type="number"
                    value={semester}
                    onChange={(e) => setSemester(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Division</label>
                  <input
                    type="text"
                    value={division}
                    onChange={(e) => setDivision(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Room / Lab *</label>
                <input
                  type="text"
                  required
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Date *</label>
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
                  <label className="block font-bold text-slate-700 mb-1">Att. Window Start</label>
                  <input
                    type="text"
                    value={attendanceStart}
                    onChange={(e) => setAttendanceStart(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Att. Window End</label>
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
                  Create Lecture
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
