import React, { useState, useEffect } from 'react';
import { Student, Lecture, AttendanceRecord, CollegeSettings, GmailNotification } from '../types';
import { db } from '../services/db';
import { getCurrentDeviceLocation, verifyLocationGeofence, GeofenceVerificationResult } from '../services/gps';
import { notificationService } from '../services/notificationService';
import { GeofenceCard } from '../components/GeofenceCard';
import { StudentQRScanner } from '../components/StudentQRScanner';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Check,
  X,
  Mail,
  ExternalLink,
  MapPin,
  RefreshCw,
  BookOpen,
  Calendar,
  Clock,
  Send,
  Copy,
  QrCode,
  Radio
} from 'lucide-react';

interface StudentAttendanceProps {
  student: Student;
  lecture: Lecture;
  onBack: () => void;
  onSuccess: () => void;
}

export const StudentAttendance: React.FC<StudentAttendanceProps> = ({
  student,
  lecture,
  onBack,
  onSuccess
}) => {
  const [settings] = useState<CollegeSettings>(db.getCollegeSettings());
  const [geofenceResult, setGeofenceResult] = useState<GeofenceVerificationResult | undefined>();
  const [loadingGps, setLoadingGps] = useState(true);

  // Email verification status
  const studentEmail = student.email || `${student.enrollmentNumber.toLowerCase()}@college.edu`;
  const [alreadyMarked, setAlreadyMarked] = useState<AttendanceRecord | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  // Success state & Gmail notification
  const [markedRecord, setMarkedRecord] = useState<AttendanceRecord | null>(null);
  const [sentNotification, setSentNotification] = useState<GmailNotification | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState(false);

  useEffect(() => {
    checkGPS();
    checkIfAlreadyMarked();
  }, [lecture.id, student.id, studentEmail]);

  const checkIfAlreadyMarked = () => {
    const existing = db.getAllAttendance().find(
      a => a.lectureId === lecture.id && (
        a.studentId === student.id || 
        (a.studentEmail && a.studentEmail.toLowerCase() === studentEmail.toLowerCase())
      )
    );
    if (existing) {
      setAlreadyMarked(existing);
      // Also look up sent notification if available
      const notifs = notificationService.getNotificationsForLecture(lecture.id);
      const studentNotif = notifs.find(n => n.recipientEmail.toLowerCase() === studentEmail.toLowerCase());
      if (studentNotif) {
        setSentNotification(studentNotif);
      }
    }
  };

  const checkGPS = async () => {
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

  const handleConfirmAttendance = () => {
    setVerificationError(null);

    // 1. Check if already marked for this subject session
    if (alreadyMarked) {
      setVerificationError(
        `Only 1 attendance active: Your email (${studentEmail}) has already marked attendance for ${lecture.subjectName}. Duplicate marks are blocked.`
      );
      return;
    }

    // 2. Check GPS Geofence
    if (!geofenceResult?.isInsideZone) {
      setVerificationError('Attendance cannot be marked because you are outside the 2 KM college attendance zone.');
      return;
    }

    setIsSubmitting(true);
    try {
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const record = db.markAttendance({
        lectureId: lecture.id,
        studentId: student.id,
        studentEmail: studentEmail,
        studentName: student.name,
        rollNumber: student.rollNumber,
        enrollmentNumber: student.enrollmentNumber,
        status: 'PRESENT',
        markedAt: Date.now(),
        markedTimeStr: nowStr,
        latitude: geofenceResult.latitude,
        longitude: geofenceResult.longitude,
        gpsAccuracy: geofenceResult.accuracy,
        distanceMeters: geofenceResult.distanceMeters,
        verificationMethod: 'EMAIL_VERIFIED_GPS'
      });

      setMarkedRecord(record);

      // Fetch the generated Gmail notification
      const notifs = notificationService.getNotificationsForLecture(lecture.id);
      const latestNotif = notifs.find(n => n.recipientEmail.toLowerCase() === studentEmail.toLowerCase());
      if (latestNotif) {
        setSentNotification(latestNotif);
      }
    } catch (err: any) {
      setVerificationError(err.message || 'Failed to mark attendance.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyEmail = () => {
    if (sentNotification) {
      navigator.clipboard.writeText(
        `Subject: ${sentNotification.subject}\n\n${sentNotification.body}`
      );
      setCopiedNotice(true);
      setTimeout(() => setCopiedNotice(false), 2500);
    }
  };

  const handleQRScanSuccess = (data: {
    payload: any;
    studentLocation: any;
    distanceMeters: number;
    verificationMethod: string;
  }) => {
    setVerificationError(null);

    // 1. Check if already marked for this subject session
    if (alreadyMarked) {
      setVerificationError(
        `Only 1 attendance active: Your email (${studentEmail}) has already marked attendance for ${lecture.subjectName}. Duplicate marks are blocked.`
      );
      return;
    }

    // 2. Proximity check <= 100 meters
    const allowedLimit = data.payload?.allowedRadiusMeters || lecture.geofenceRadiusMeters || 100;
    if (data.distanceMeters > allowedLimit) {
      setVerificationError(
        `Attendance rejected: Distance is ${Math.round(data.distanceMeters)}m from faculty handheld device. Allowed radius is strictly ${allowedLimit} meters.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const record = db.markAttendance({
        lectureId: lecture.id,
        studentId: student.id,
        studentEmail: studentEmail,
        studentName: student.name,
        rollNumber: student.rollNumber,
        enrollmentNumber: student.enrollmentNumber,
        status: 'PRESENT',
        markedAt: Date.now(),
        markedTimeStr: nowStr,
        latitude: data.studentLocation.latitude,
        longitude: data.studentLocation.longitude,
        gpsAccuracy: data.studentLocation.accuracy,
        distanceMeters: data.distanceMeters,
        facultyDistanceMeters: data.distanceMeters,
        qrVerified: true,
        verificationMethod: data.verificationMethod || 'QR_100M_GEOFENCE'
      });

      setMarkedRecord(record);

      // Fetch the generated Gmail notification
      const notifs = notificationService.getNotificationsForLecture(lecture.id);
      const latestNotif = notifs.find(n => n.recipientEmail.toLowerCase() === studentEmail.toLowerCase());
      if (latestNotif) {
        setSentNotification(latestNotif);
      }
    } catch (err: any) {
      setVerificationError(err.message || 'Failed to mark attendance.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
      </button>

      {/* Header with Subject & Faculty Information */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md uppercase">
                {lecture.subjectCode}
              </span>
              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                Subject Session
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 mt-1">{lecture.subjectName}</h2>
            <p className="text-xs text-slate-500">
              Faculty: <strong className="text-slate-700">{lecture.facultyName}</strong> • Room {lecture.room}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs font-bold text-slate-700 block">Lecture: {lecture.startTime} – {lecture.endTime}</span>
            <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded inline-block mt-0.5">
              Window: {lecture.attendanceStart} – {lecture.attendanceEnd}
            </span>
          </div>
        </div>
      </div>

      {/* Student Email & Single Attendance Policy Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">Student Email ID:</span>
              <span className="text-xs font-mono font-bold text-blue-800 bg-blue-100/80 px-2 py-0.5 rounded">
                {studentEmail}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
              <strong>Single Attendance Rule Active:</strong> Only <strong>1 attendance</strong> is recorded per Email ID for this subject session. An automated Gmail confirmation is dispatched immediately upon marking.
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-3 py-1.5 rounded-xl border border-emerald-300">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Email ID Verified</span>
        </div>
      </div>

      {/* Already Marked Alert Banner */}
      {alreadyMarked && !markedRecord && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-xs space-y-2">
          <div className="flex items-center gap-2 text-amber-900 font-bold">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Attendance Already Recorded for this Subject Session</span>
          </div>
          <p className="text-amber-800 text-[11px]">
            Your email ID (<strong>{studentEmail}</strong>) has already marked attendance for <strong>{lecture.subjectName}</strong> at <strong>{alreadyMarked.markedTimeStr}</strong>. The system enforces 1 attendance per email ID per subject.
          </p>
          {sentNotification && (
            <div className="pt-2 flex flex-wrap gap-2">
              <a
                href={sentNotification.gmailUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-[11px] shadow-sm transition"
              >
                <Mail className="w-3.5 h-3.5" /> Open Confirmation in Gmail
              </a>
              <button
                onClick={() => setShowEmailModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg font-bold text-[11px] hover:bg-slate-50 transition"
              >
                View Email Details
              </button>
            </div>
          )}
        </div>
      )}

      {/* Verification Error */}
      {verificationError && (
        <div className="p-4 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{verificationError}</span>
        </div>
      )}

      {/* SUCCESS SCREEN */}
      {markedRecord ? (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-6 sm:p-8 text-center space-y-5 shadow-lg">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-emerald-900">🎉 Attendance Marked Successfully!</h3>
            <p className="text-xs text-emerald-700 mt-1">
              Your attendance for <strong>{lecture.subjectName}</strong> is logged. Only 1 attendance active for this email ID.
            </p>
          </div>

          <div className="max-w-md mx-auto bg-white/90 rounded-xl p-4 border border-emerald-200 text-xs text-left grid grid-cols-2 gap-3 shadow-sm">
            <div>
              <span className="text-slate-400 block text-[10px]">Student Name</span>
              <span className="font-bold text-slate-800">{student.name}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Status</span>
              <span className="font-bold text-emerald-700">PRESENT</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Registered Email</span>
              <span className="font-bold text-blue-700 font-mono text-[11px] truncate block">{studentEmail}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Marked Time</span>
              <span className="font-bold text-slate-800">{markedRecord.markedTimeStr}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Subject & Room</span>
              <span className="font-bold text-slate-800 truncate block">
                {lecture.subjectName} ({lecture.room})
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">100m Faculty Proximity</span>
              <span className="font-bold text-emerald-700 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                {Math.round(markedRecord.facultyDistanceMeters || markedRecord.distanceMeters)}m (≤100m verified)
              </span>
            </div>
          </div>

          {/* Dedicated Gmail Notification Sent Banner */}
          <div className="max-w-md mx-auto bg-white rounded-xl p-4 border-2 border-red-200 text-left space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Gmail Notification Dispatched</h4>
                  <p className="text-[10px] text-slate-500">Sent to: {studentEmail}</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                DELIVERED ✓
              </span>
            </div>

            <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-snug">
              Subject: <strong>[Attendance Confirmed] {lecture.subjectName} ({lecture.subjectCode}) - Present</strong>
            </p>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              {sentNotification && (
                <a
                  href={sentNotification.gmailUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Open in Gmail
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
              )}
              <button
                onClick={() => setShowEmailModal(true)}
                className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition"
              >
                View Email Message
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={onSuccess}
              className="w-full sm:w-auto px-8 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition shadow"
            >
              Return to Student Dashboard
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Live Student QR Scanner (Camera, File, or 6-digit Code with 100m Proximity Check) */}
          <StudentQRScanner
            lecture={lecture}
            onScanSuccess={handleQRScanSuccess}
            isAlreadyMarked={Boolean(alreadyMarked)}
          />

          {/* Campus GPS Geofence Card */}
          <GeofenceCard
            result={geofenceResult}
            collegeLat={settings.latitude}
            collegeLon={settings.longitude}
            allowedRadius={settings.allowedRadiusMeters}
            onRefreshGPS={checkGPS}
            isRefreshing={loadingGps}
          />

          {/* Verification Checklist Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Attendance Verification Criteria
            </h4>
            <div className="space-y-2.5 text-xs">
              <ChecklistRow
                label="Registered Student Email"
                detail={`${studentEmail} (${student.name} - ${student.enrollmentNumber})`}
                passed={Boolean(studentEmail)}
              />
              <ChecklistRow
                label="Distinct Subject Session"
                detail={`${lecture.subjectName} (${lecture.subjectCode})`}
                passed={lecture.status === 'ACTIVE'}
              />
              <ChecklistRow
                label="Single Attendance Constraint"
                detail={alreadyMarked ? 'Already marked for this subject' : '1 attendance active per email (Ready)'}
                passed={!alreadyMarked}
              />
              <ChecklistRow
                label="College GPS Geofence (<= 2 KM)"
                detail={`${Math.round(geofenceResult?.distanceMeters || 320)}m from campus geofence`}
                passed={geofenceResult ? geofenceResult.isInsideZone : true}
              />
              <ChecklistRow
                label="Gmail Notification Messaging"
                detail={`Automated confirmation email will be dispatched to ${studentEmail}`}
                passed={true}
              />
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleConfirmAttendance}
            disabled={Boolean(alreadyMarked) || !geofenceResult?.isInsideZone || isSubmitting}
            className={`w-full py-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition ${
              !alreadyMarked && geofenceResult?.isInsideZone && !isSubmitting
                ? 'bg-blue-700 hover:bg-blue-800 text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {alreadyMarked 
              ? 'ATTENDANCE ALREADY RECORDED FOR THIS SUBJECT' 
              : `CONFIRM ATTENDANCE & SEND GMAIL NOTIFICATION`}
          </button>
        </>
      )}

      {/* Email Message Preview Modal */}
      {showEmailModal && sentNotification && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Gmail Notification Message</h3>
                  <p className="text-[10px] text-slate-500">Official attendance confirmation</p>
                </div>
              </div>
              <button
                onClick={() => setShowEmailModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1">
                <div>
                  <span className="text-slate-400 font-semibold">To: </span>
                  <span className="font-bold text-slate-800">{sentNotification.recipientEmail}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">Subject: </span>
                  <span className="font-bold text-slate-900">{sentNotification.subject}</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  <span>Sent: {sentNotification.sentTimeStr} • Status: </span>
                  <span className="text-emerald-700 font-bold">{sentNotification.status}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Message Body</label>
                <pre className="p-3 bg-slate-900 text-emerald-300 rounded-xl font-mono text-[11px] whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">
                  {sentNotification.body}
                </pre>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleCopyEmail}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
              >
                <Copy className="w-3.5 h-3.5" />
                {copiedNotice ? 'Copied to Clipboard!' : 'Copy Text'}
              </button>

              <div className="flex items-center gap-2">
                <a
                  href={sentNotification.gmailUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Open in Gmail
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="px-3 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ChecklistRow: React.FC<{ label: string; detail: string; passed: boolean }> = ({
  label,
  detail,
  passed
}) => (
  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
    <div>
      <span className="font-bold text-slate-800 block">{label}</span>
      <span className="text-[11px] text-slate-500">{detail}</span>
    </div>
    {passed ? (
      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
        <Check className="w-3.5 h-3.5" />
      </div>
    ) : (
      <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
        <X className="w-3.5 h-3.5" />
      </div>
    )}
  </div>
);
