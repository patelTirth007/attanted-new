import React, { useState, useEffect } from 'react';
import { Student, AttendanceRecord, Lecture } from '../types';
import { db } from '../services/db';
import { StatusBadge } from '../components/StatusBadge';
import { History, Search, Filter, ShieldCheck, MapPin } from 'lucide-react';

interface StudentHistoryProps {
  student: Student;
}

export const StudentHistory: React.FC<StudentHistoryProps> = ({ student }) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setRecords(db.getAttendanceForStudent(student.id));
    setLectures(db.getAllLectures());
  }, [student]);

  const filteredRecords = records.filter(rec => {
    const lecture = lectures.find(l => l.id === rec.lectureId);
    const matchesStatus = statusFilter === 'ALL' || rec.status === statusFilter;
    const matchesSearch = !search ||
      rec.markedTimeStr.toLowerCase().includes(search.toLowerCase()) ||
      (lecture?.subjectName.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (lecture?.subjectCode.toLowerCase().includes(search.toLowerCase()) ?? false);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-black text-slate-900">Attendance History</h2>
        <p className="text-xs text-slate-500">
          Complete log of lecture attendance verified with biometric face recognition and GPS geofence.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by subject name or code..."
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
            No attendance records match your filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4">Lecture Time</th>
                  <th className="py-3.5 px-4">Marked At</th>
                  <th className="py-3.5 px-4">Biometric Face</th>
                  <th className="py-3.5 px-4">GPS Distance</th>
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
                        <span className="text-[10px] text-slate-400">{lecture?.subjectCode || ''} • {lecture?.facultyName || ''}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {lecture?.startTime} - {lecture?.endTime}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {rec.markedTimeStr}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Verified ({rec.faceConfidence}%)
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-blue-600" />
                          {Math.round(rec.distanceMeters)}m
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
