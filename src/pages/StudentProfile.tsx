import React, { useState } from 'react';
import { Student } from '../types';
import { db } from '../services/db';
import { notificationService } from '../services/notificationService';
import { User, Shield, Mail, CheckCircle2, FileText, Bell, BookOpen, ExternalLink } from 'lucide-react';

interface StudentProfileProps {
  student: Student;
}

export const StudentProfile: React.FC<StudentProfileProps> = ({ student }) => {
  const studentEmail = student.email || `${student.enrollmentNumber.toLowerCase()}@college.edu`;
  const notifs = notificationService.getNotificationsForEmail(studentEmail);
  const subjects = db.getAllSubjects();

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-900">Student Profile & Security</h2>
        <p className="text-xs text-slate-500">
          Manage your academic identity, registered Gmail address, and subject attendance records.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-2xl mx-auto">
            {student.name.charAt(0)}
          </div>
          <div className="text-center">
            <h3 className="text-lg font-bold text-slate-900">{student.name}</h3>
            <p className="text-xs text-slate-500">{student.enrollmentNumber}</p>
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Registered Email</span>
              <span className="font-bold text-blue-700 font-mono text-[11px] truncate max-w-[140px]">{studentEmail}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Department</span>
              <span className="font-semibold text-slate-800">{student.department}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Semester & Div</span>
              <span className="font-semibold text-slate-800">Sem {student.semester} - Div {student.division}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Roll Number</span>
              <span className="font-semibold text-slate-800">{student.rollNumber}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Mobile</span>
              <span className="font-semibold text-slate-800">{student.phone}</span>
            </div>
          </div>
        </div>

        {/* Security & Gmail Integration Card */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-700" />
              Single Email ID Attendance Security
            </h4>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Active & Verified
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Your attendance is strictly tied to your official email ID (<strong>{studentEmail}</strong>). The college portal enforces: <strong>only 1 attendance active per email ID per subject session</strong>, ensuring zero proxy attendance and complete integrity.
          </p>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">Automated Gmail Notifications</span>
                <span className="text-[11px] text-slate-500">
                  {notifs.length} confirmation messages logged and sent to your inbox.
                </span>
              </div>
            </div>

            <a
              href={`https://mail.google.com/mail/u/${studentEmail}/`}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 self-start sm:self-auto shrink-0"
            >
              <Mail className="w-3.5 h-3.5" />
              Open Gmail
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Enrolled Academic Subjects */}
          <div>
            <h5 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-700" />
              Enrolled Subjects (Different Subjects • Independent Attendance)
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {subjects.map((sub) => (
                <div key={sub.id} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/70">
                  <span className="text-[10px] font-bold text-blue-700 font-mono block">{sub.subjectCode}</span>
                  <span className="font-bold text-slate-800 truncate block">{sub.subjectName}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Attendance Security Policy Notice */}
          <div className="pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-500 leading-relaxed bg-blue-50/50 p-3 rounded-xl border border-blue-100">
            <h5 className="font-bold text-slate-800 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Official Attendance Policy Rules
            </h5>
            <p>• <strong>Strict 1 Email = 1 Attendance:</strong> A student cannot mark duplicate attendance for the same lecture with their email ID.</p>
            <p>• <strong>Campus Geofence:</strong> Must be physically inside the 2 KM college perimeter when submitting attendance.</p>
            <p>• <strong>Audit Trail:</strong> Every mark dispatches an instant Gmail alert with timestamp, location, and session code.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
