import React, { useState, useEffect } from 'react';
import { Lecture, AttendanceRecord } from '../types';
import { db } from '../services/db';
import { exportAttendanceToCSV } from '../services/csvExport';
import { FileSpreadsheet, Download, Calendar, Users, CheckCircle2 } from 'lucide-react';

export const FacultyReports: React.FC = () => {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [selectedLectureId, setSelectedLectureId] = useState<string>('');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    const lecs = db.getAllLectures();
    setLectures(lecs);
    if (lecs.length > 0) {
      setSelectedLectureId(lecs[0].id);
      setRecords(db.getAttendanceForLecture(lecs[0].id));
    }
  }, []);

  const handleSelectLecture = (id: string) => {
    setSelectedLectureId(id);
    setRecords(db.getAttendanceForLecture(id));
  };

  const selectedLecture = lectures.find(l => l.id === selectedLectureId);

  const handleExport = () => {
    if (!selectedLecture) return;
    exportAttendanceToCSV(selectedLecture, records);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Attendance Reports & CSV Export</h2>
          <p className="text-xs text-slate-500">
            Generate audited lecture logs containing biometric accuracy and GPS coordinates.
          </p>
        </div>

        {selectedLecture && (
          <button
            onClick={handleExport}
            className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 self-start sm:self-auto"
          >
            <Download className="w-4 h-4" />
            Export Official CSV Report
          </button>
        )}
      </div>

      {/* Lecture Selector */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <label className="block text-xs font-bold text-slate-700 mb-2">Select Lecture to Generate Report</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {lectures.map((lec) => (
            <button
              key={lec.id}
              onClick={() => handleSelectLecture(lec.id)}
              className={`p-3.5 rounded-xl border text-left transition ${
                selectedLectureId === lec.id
                  ? 'bg-blue-50 border-blue-600 shadow-sm'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-blue-700">{lec.subjectCode}</span>
                <span className="text-[10px] text-slate-400">{lec.date}</span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 truncate">{lec.subjectName}</h4>
              <p className="text-[11px] text-slate-500">{lec.startTime} • Sem {lec.semester} ({lec.division})</p>
            </button>
          ))}
        </div>
      </div>

      {/* Summary Box */}
      {selectedLecture && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">{selectedLecture.subjectName}</h3>
              <p className="text-xs text-slate-500">
                Conducted by {selectedLecture.facultyName} on {selectedLecture.date} ({selectedLecture.startTime} - {selectedLecture.endTime})
              </p>
            </div>
            <div className="text-xs font-semibold text-slate-600">
              Total Logged: <strong className="text-slate-900">{records.length} students</strong>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                  <th className="py-2.5 px-3">Roll No</th>
                  <th className="py-2.5 px-3">Enrollment</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Marked Time</th>
                  <th className="py-2.5 px-3">Face Verification</th>
                  <th className="py-2.5 px-3 text-right">GPS Distance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2.5 px-3 font-bold text-slate-800">{r.rollNumber}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{r.enrollmentNumber}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{r.studentName}</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-700">{r.status}</td>
                    <td className="py-2.5 px-3 text-slate-600">{r.markedTimeStr}</td>
                    <td className="py-2.5 px-3 text-emerald-700 font-semibold">{r.faceConfidence}% Verified</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{Math.round(r.distanceMeters)}m</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
