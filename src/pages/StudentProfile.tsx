import React from 'react';
import { Student } from '../types';
import { User, Shield, Camera, Lock, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';

interface StudentProfileProps {
  student: Student;
  onReEnrollFace: () => void;
}

export const StudentProfile: React.FC<StudentProfileProps> = ({ student, onReEnrollFace }) => {
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-900">Student Profile & Security</h2>
        <p className="text-xs text-slate-500">
          Manage your enrolled academic identity and biometric verification template.
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

        {/* Biometrics Card */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-700" />
              Facial Biometric Status
            </h4>
            {student.faceEnrollmentStatus ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Enrolled & Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                <AlertTriangle className="w-3.5 h-3.5" />
                Setup Pending
              </span>
            )}
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Your face is represented as an encrypted 64-dimensional feature vector. Raw camera images are never stored on server disks, safeguarding student biometric privacy while guaranteeing authentic lecture attendance.
          </p>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Biometric Template</span>
              <span className="text-[11px] text-slate-500">
                {student.faceEnrollmentStatus ? 'Multi-sample normalized vector saved' : 'No biometric template found'}
              </span>
            </div>
            <button
              onClick={onReEnrollFace}
              className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5" />
              {student.faceEnrollmentStatus ? 'Re-enroll Face ID' : 'Enroll Face ID'}
            </button>
          </div>

          {/* Privacy Policy / Notice (Section 30) */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Biometric & Geolocation Privacy Notice
            </h5>
            <div className="text-[11px] text-slate-500 space-y-1.5 leading-relaxed bg-blue-50/50 p-3 rounded-xl border border-blue-100">
              <p>• <strong>Purpose:</strong> Biometric facial matching and GPS geofencing are used exclusively to authenticate physical presence in college lectures.</p>
              <p>• <strong>Data Storage:</strong> Only mathematical vector representations (embeddings) and coordinate logs are stored. Raw photographs are discarded immediately upon feature extraction.</p>
              <p>• <strong>Access Control:</strong> Attendance logs are restricted to designated faculty members and academic administrators. No peer student can access another student's biometric or GPS telemetry.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
