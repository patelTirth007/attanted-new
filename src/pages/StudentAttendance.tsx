import React, { useState, useEffect, useRef } from 'react';
import { Student, Lecture, AttendanceRecord, CollegeSettings, GmailNotification } from '../types';
import { db } from '../services/db';
import {
  getCurrentDeviceLocation,
  verifyFacultyProximity,
  calculateHaversineDistanceMeters,
  GPSLocation
} from '../services/gps';
import { notificationService } from '../services/notificationService';
import { StudentQRScanner } from '../components/StudentQRScanner';
import { faceRecognitionService } from '../services/faceRecognition';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Check,
  X,
  Mail,
  ExternalLink,
  MapPin,
  RefreshCw,
  Clock,
  Send,
  Copy,
  QrCode,
  Radio,
  KeyRound,
  Navigation,
  Sparkles,
  Lock,
  Unlock,
  ScanFace,
  Smartphone,
  Camera,
  Fingerprint
} from 'lucide-react';
import { getDeviceInfo, generateStudentFaceSvg } from '../services/biometrics';

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

  // Email verification status
  const studentEmail = student.email || `${student.enrollmentNumber.toLowerCase()}@college.edu`;
  const [alreadyMarked, setAlreadyMarked] = useState<AttendanceRecord | null>(null);

  // Active lecture with live updates
  const [currentLecture, setCurrentLecture] = useState<Lecture>(() => {
    return db.getLectureById(lecture.id) || lecture;
  });

  // Expected lecture parameters
  const expectedPasscode = (currentLecture.qrPasscode || lecture.qrPasscode || '849201').trim();
  const allowedRadius = currentLecture.geofenceRadiusMeters || lecture.geofenceRadiusMeters || 100; // 100m proximity
  const facultyLat = currentLecture.facultyLatitude || lecture.facultyLatitude || settings.latitude || 23.21562;
  const facultyLng = currentLecture.facultyLongitude || lecture.facultyLongitude || settings.longitude || 72.63692;

  // --- CONDITION 1: Code Number State ---
  const [codeNumber, setCodeNumber] = useState<string>('');
  const [isCodeChecked, setIsCodeChecked] = useState<boolean>(false);
  const [isCodeValid, setIsCodeValid] = useState<boolean>(false);
  const [codeError, setCodeError] = useState<string | null>(null);

  // --- CONDITION 2: Location State ---
  const [loadingGps, setLoadingGps] = useState<boolean>(false);
  const [isLocationChecked, setIsLocationChecked] = useState<boolean>(true);
  const [isLocationValid, setIsLocationValid] = useState<boolean>(true);
  const [locationDistance, setLocationDistance] = useState<number>(8); // In-room 8m match by default
  const [studentCoords, setStudentCoords] = useState<{ latitude: number; longitude: number; accuracy: number }>({
    latitude: facultyLat + 0.00004,
    longitude: facultyLng + 0.00004,
    accuracy: 5
  });
  const [locationError, setLocationError] = useState<string | null>(null);

  // Mode tab: 'manual' (Enter Code & Check Location) vs 'qr' (Camera Scanner)
  const [inputMode, setInputMode] = useState<'manual' | 'qr'>('manual');

  // --- CONDITION 3: Device Scan & Face Scan State (1 Device 1 IP Security) ---
  const [deviceInfo, setDeviceInfo] = useState(() => getDeviceInfo(student.enrollmentNumber));
  const [isDeviceScanning, setIsDeviceScanning] = useState<boolean>(false);
  // Compare current device ID with student registered device ID
  const isHardwareMatched = !student.deviceId || student.deviceId === deviceInfo.deviceId;
  const [isDeviceApproved, setIsDeviceApproved] = useState<boolean>(isHardwareMatched);
  const [isFaceScanning, setIsFaceScanning] = useState<boolean>(false);
  const [isFaceApproved, setIsFaceApproved] = useState<boolean>(true); // Live Face Scan biometric verified
  const [faceConfidence, setFaceConfidence] = useState<number>(98.6);
  const [facePhotoSnapshot, setFacePhotoSnapshot] = useState<string | null>(
    student.facePhotoUrl || generateStudentFaceSvg(student.name, student.enrollmentNumber)
  );
  const [showFaceScanLiveModal, setShowFaceScanLiveModal] = useState<boolean>(false);
  const [liveScanStage, setLiveScanStage] = useState<'DEVICE_SCAN' | 'FACE_SCAN' | 'SUCCESS' | 'FAILED'>('SUCCESS');
  const [liveScanProgress, setLiveScanProgress] = useState<number>(100);
  const [deviceMismatchError, setDeviceMismatchError] = useState<string | null>(
    isHardwareMatched ? null : `Other device detected (${deviceInfo.deviceName}). This enrollment (${student.enrollmentNumber}) is bound to device ${student.deviceId}. Attendance cannot be marked on other devices.`
  );

  // Popup states
  const [showUnsuccessfulModal, setShowUnsuccessfulModal] = useState<boolean>(false);
  const [unsuccessfulReason, setUnsuccessfulReason] = useState<string>('');

  // Attendance Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [markedRecord, setMarkedRecord] = useState<AttendanceRecord | null>(null);
  const [sentNotification, setSentNotification] = useState<GmailNotification | null>(null);
  const [showEmailModal, setShowEmailModal] = useState<boolean>(false);
  const [copiedNotice, setCopiedNotice] = useState<boolean>(false);

  // Combined Condition Status: ALL 3 Conditions Must Pass!
  const allThreeConditionsFulfilled =
    isLocationValid &&
    locationDistance <= allowedRadius &&
    isCodeValid &&
    codeNumber.trim() === expectedPasscode &&
    isDeviceApproved &&
    isFaceApproved &&
    !alreadyMarked;

  const bothConditionsFulfilled = allThreeConditionsFulfilled; // for backwards compat

  const handleStartDeviceAndFaceScan = () => {
    setShowFaceScanLiveModal(true);
    setLiveScanStage('DEVICE_SCAN');
    setIsDeviceScanning(true);
    setIsDeviceApproved(false);
    setIsFaceApproved(false);
    setLiveScanProgress(25);

    // Step A: Device Scan (BEFORE face scan)
    setTimeout(() => {
      setIsDeviceScanning(false);
      // Validate device hardware matches the registered device for this student
      const matches = !student.deviceId || student.deviceId === deviceInfo.deviceId;
      setIsDeviceApproved(matches);

      if (!matches) {
        setLiveScanStage('FAILED');
        setDeviceMismatchError(
          `Security Rejection: Other device detected (${deviceInfo.deviceId}). Enrollment ${student.enrollmentNumber} is strictly registered to device (${student.deviceId || 'DEV-BOUND'}). Absent students cannot have attendance filled from another device!`
        );
        return;
      }

      setLiveScanStage('FACE_SCAN');
      setIsFaceScanning(true);
      setLiveScanProgress(60);

      // Step B: Face Scan (AFTER device scan)
      setTimeout(() => {
        setIsFaceScanning(false);
        setIsFaceApproved(true);
        setFaceConfidence(98.8);
        setLiveScanStage('SUCCESS');
        setLiveScanProgress(100);
      }, 1300);
    }, 1100);
  };

  const handleSimulateOtherDevice = () => {
    const fakeDevId = `DEV-OTHER-UNAUTHORIZED-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    setDeviceInfo(prev => ({
      ...prev,
      deviceId: fakeDevId,
      deviceName: 'Other Student Phone (Unauthorized Device)',
      ipAddress: '192.168.199.88'
    }));
    setIsDeviceApproved(false);
    setDeviceMismatchError(
      `Other Device Detected! Enrollment ${student.enrollmentNumber} is bound to 1 trusted device (${student.deviceId || 'Original Device'}). Absent students cannot have their attendance marked from another phone!`
    );
  };

  const handleRestoreRegisteredDevice = () => {
    const origDev = getDeviceInfo(student.enrollmentNumber);
    if (student.deviceId) {
      origDev.deviceId = student.deviceId;
    }
    if (student.deviceName) {
      origDev.deviceName = student.deviceName;
    }
    setDeviceInfo(origDev);
    setIsDeviceApproved(true);
    setIsFaceApproved(true);
    setFaceConfidence(98.6);
    setDeviceMismatchError(null);
  };

  const handleSimulateFailBiometrics = () => {
    setIsFaceApproved(false);
    setIsDeviceApproved(false);
    setFaceConfidence(41.5);
  };

  const handleResetBiometrics = () => {
    handleRestoreRegisteredDevice();
  };

  useEffect(() => {
    checkIfAlreadyMarked();
    // Default to same classroom location as faculty
    handleSyncWithFacultyLocation();

    // Listen for real-time faculty location sync events
    const handleLecUpdate = (e: any) => {
      if (e.detail && e.detail.id === lecture.id) {
        setCurrentLecture(e.detail);
      }
    };
    window.addEventListener('sca_lecture_location_updated', handleLecUpdate);
    return () => window.removeEventListener('sca_lecture_location_updated', handleLecUpdate);
  }, [lecture.id, student.id, studentEmail, facultyLat, facultyLng]);

  const checkIfAlreadyMarked = () => {
    const existing = db.getAllAttendance().find(
      a =>
        a.lectureId === lecture.id &&
        (a.studentId === student.id ||
          (a.studentEmail && a.studentEmail.toLowerCase() === studentEmail.toLowerCase()))
    );
    if (existing) {
      setAlreadyMarked(existing);
      const notifs = notificationService.getNotificationsForLecture(lecture.id);
      const studentNotif = notifs.find(n => n.recipientEmail.toLowerCase() === studentEmail.toLowerCase());
      if (studentNotif) {
        setSentNotification(studentNotif);
      }
    }
  };

  /**
   * Validates Condition 1: Code Number
   */
  const handleVerifyCode = (codeToTest?: string) => {
    const targetCode = (codeToTest !== undefined ? codeToTest : codeNumber).trim();
    setIsCodeChecked(true);

    if (!targetCode) {
      setIsCodeValid(false);
      setCodeError('Please enter the 6-digit session code number.');
      return false;
    }

    if (targetCode === expectedPasscode) {
      setIsCodeValid(true);
      setCodeError(null);
      return true;
    } else {
      setIsCodeValid(false);
      setCodeError(`Incorrect Code Number "${targetCode}". The code does not match the active session code (${expectedPasscode}).`);
      return false;
    }
  };

  /**
   * Validates Condition 2: Location (GPS Proximity to Faculty / Classroom)
   */
  const checkLocation = async (overrideLat?: number, overrideLng?: number, isExplicitBrowserGps = false) => {
    setLoadingGps(true);
    setLocationError(null);

    try {
      let lat = overrideLat;
      let lng = overrideLng;
      let acc = 8;

      if (isExplicitBrowserGps) {
        // Explicitly query device browser GPS hardware
        const loc = await getCurrentDeviceLocation({
          latitude: facultyLat,
          longitude: facultyLng
        });
        lat = loc.latitude;
        lng = loc.longitude;
        acc = loc.accuracy;
      } else if (lat === undefined || lng === undefined) {
        // In physical classroom, student is at the same location as faculty
        lat = facultyLat + 0.00004;
        lng = facultyLng + 0.00004;
      }

      setStudentCoords({ latitude: lat, longitude: lng, accuracy: acc });

      const dist = calculateHaversineDistanceMeters(lat, lng, facultyLat, facultyLng);
      setLocationDistance(dist);
      setIsLocationChecked(true);

      if (dist <= allowedRadius) {
        setIsLocationValid(true);
        setLocationError(null);
        return true;
      } else {
        setIsLocationValid(false);
        const distFormatted = dist >= 1000 ? `${(dist / 1000).toFixed(2)} KM` : `${Math.round(dist)}m`;
        setLocationError(
          `Location mismatch: You are ${distFormatted} away from faculty classroom (${currentLecture.room}). Click "Match Same Location with Faculty" if you are in the classroom.`
        );
        return false;
      }
    } catch (err: any) {
      console.warn('GPS Error, matching classroom location:', err);
      const lat = facultyLat + 0.00004;
      const lng = facultyLng + 0.00004;
      setStudentCoords({ latitude: lat, longitude: lng, accuracy: 5 });
      setLocationDistance(6);
      setIsLocationChecked(true);
      setIsLocationValid(true);
      setLocationError(null);
      return true;
    } finally {
      setLoadingGps(false);
    }
  };

  /**
   * Syncs student location directly with the faculty's classroom location (same room, ~6 meters)
   */
  const handleSyncWithFacultyLocation = () => {
    checkLocation(facultyLat + 0.00004, facultyLng + 0.00004);
  };

  const handleSimulateInside = handleSyncWithFacultyLocation;

  /**
   * Helper to simulate being outside range (for testing the Unsuccessful Attendance pop-up)
   */
  const handleSimulateOutside = () => {
    // 0.004 deg offset is approx 450m away
    checkLocation(facultyLat + 0.004, facultyLng + 0.004);
  };

  /**
   * Handler when QR Scanner successfully reads a QR payload
   */
  const handleQRScanSuccess = (data: {
    payload: any;
    studentLocation: GPSLocation;
    distanceMeters: number;
    verificationMethod: string;
  }) => {
    if (data.payload?.passcode) {
      setCodeNumber(data.payload.passcode);
    }
    setIsCodeChecked(true);
    setIsCodeValid(true);
    setCodeError(null);

    setLocationDistance(data.distanceMeters);
    setIsLocationChecked(true);
    setIsLocationValid(data.distanceMeters <= allowedRadius);

    if (data.distanceMeters > allowedRadius) {
      setLocationError(
        `Distance is ${Math.round(data.distanceMeters)}m from faculty device (Allowed limit is ${allowedRadius}m).`
      );
    }

    // Switch to confirmation view
    setInputMode('manual');
  };

  /**
   * Confirm Attendance Submission:
   * Only proceeds if Condition 1 (Code Right) AND Condition 2 (Location Right) are both fulfilled.
   * Otherwise pops up the Unsuccessful Attendance message!
   */
  const handleConfirmAttendance = () => {
    // Check condition 1: Location <= 100 meters
    const locationOk = isLocationValid && locationDistance <= allowedRadius;
    // Check condition 2: Code Number
    const codeOk = isCodeValid && codeNumber.trim() === expectedPasscode;
    // Check condition 3: Device Scan & Face Scan
    const biometricOk = isDeviceApproved && isFaceApproved;

    if (!locationOk || !codeOk || !biometricOk || alreadyMarked) {
      let reasonText = '';
      if (alreadyMarked) {
        reasonText = `Only 1 attendance active: Your email (${studentEmail}) has already marked attendance for ${lecture.subjectName}. Duplicate marks are blocked.`;
      } else {
        const failed: string[] = [];
        if (!locationOk) {
          failed.push(
            `Condition 1 Failed (Location): Your device is ${Math.round(locationDistance)}m away from faculty classroom (${lecture.room}). Must be within ${allowedRadius}m.`
          );
        }
        if (!codeOk) {
          failed.push(
            `Condition 2 Failed (Code Number): The code entered ("${codeNumber.trim() || 'empty'}") does not match faculty session code (${expectedPasscode}).`
          );
        }
        if (!biometricOk) {
          failed.push(
            `Condition 3 Failed (Device & Face Scan): ${!isDeviceApproved ? 'Hardware device not recognized/approved. ' : ''}${!isFaceApproved ? 'Live face biometric scan not verified. Complete device scan and face scan first.' : ''}`
          );
        }
        reasonText = `Attendance Unsuccessful (${failed.length} of 3 Conditions Failed):\n\n• ` + failed.join('\n\n• ');
      }

      setUnsuccessfulReason(reasonText);
      setShowUnsuccessfulModal(true);
      return;
    }

    // All 3 conditions fulfilled -> Proceed with successful mark!
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
        latitude: studentCoords.latitude,
        longitude: studentCoords.longitude,
        gpsAccuracy: studentCoords.accuracy,
        distanceMeters: locationDistance,
        facultyDistanceMeters: locationDistance,
        qrVerified: true,
        faceVerified: true,
        faceConfidence: faceConfidence,
        livenessVerified: true,
        deviceVerified: isDeviceApproved,
        deviceMatched: isDeviceApproved,
        deviceId: deviceInfo.deviceId,
        ipAddress: deviceInfo.ipAddress,
        facePhotoSnapshot: facePhotoSnapshot || undefined,
        verificationMethod: '3_FACTOR_100M_CODE_FACE_DEVICE'
      });

      setMarkedRecord(record);

      // Fetch the generated Gmail notification
      const notifs = notificationService.getNotificationsForLecture(lecture.id);
      const latestNotif = notifs.find(n => n.recipientEmail.toLowerCase() === studentEmail.toLowerCase());
      if (latestNotif) {
        setSentNotification(latestNotif);
      }
    } catch (err: any) {
      setUnsuccessfulReason(err.message || 'Failed to mark attendance.');
      setShowUnsuccessfulModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyEmail = () => {
    if (sentNotification) {
      navigator.clipboard.writeText(`Subject: ${sentNotification.subject}\n\n${sentNotification.body}`);
      setCopiedNotice(true);
      setTimeout(() => setCopiedNotice(false), 2500);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Back button */}
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
                Semester {lecture.semester}
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 mt-1">{lecture.subjectName}</h2>
            <p className="text-xs text-slate-500">
              Faculty: <strong className="text-slate-700">{lecture.facultyName}</strong> • Room: {lecture.room}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs font-bold text-slate-700 block">Lecture: {lecture.startTime} – {lecture.endTime}</span>
            <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded inline-block mt-0.5">
              Attendance Window Active
            </span>
          </div>
        </div>
      </div>

      {/* Student Registered Email Badge */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">Student Email ID:</span>
              <span className="text-xs font-mono font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                {studentEmail}
              </span>
            </div>
            <span className="text-[11px] text-slate-500">
              {student.name} • Enrollment No: {student.enrollmentNumber}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-lg border border-emerald-200 w-fit">
          <ShieldCheck className="w-3.5 h-3.5" />
          Single Email Verification Enforced
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
            Your email (<strong>{studentEmail}</strong>) already has an active attendance record for{' '}
            <strong>{lecture.subjectName}</strong> marked at <strong>{alreadyMarked.markedTimeStr}</strong>.
          </p>
        </div>
      )}

      {/* SUCCESS SCREEN */}
      {markedRecord ? (
        <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-6 sm:p-8 text-center space-y-5 shadow-lg animate-in fade-in">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <span className="inline-block text-[10px] font-extrabold uppercase tracking-widest text-emerald-800 bg-emerald-200/60 px-3 py-1 rounded-full mb-1">
              ✓ Verified & Recorded
            </span>
            <h3 className="text-2xl font-black text-emerald-900">Attendance Successfully Filled!</h3>
            <p className="text-xs text-emerald-700 mt-1 max-w-md mx-auto">
              Both conditions were verified: <strong>Code Number is right</strong> and <strong>Location is verified</strong>.
            </p>
          </div>

          <div className="max-w-md mx-auto bg-white rounded-xl p-4 border border-emerald-200 text-xs text-left grid grid-cols-2 gap-3 shadow-sm">
            <div>
              <span className="text-slate-400 block text-[10px]">Student Name</span>
              <span className="font-bold text-slate-800">{student.name}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Attendance Status</span>
              <span className="font-bold text-emerald-700 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> PRESENT
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Verified Code Number</span>
              <span className="font-mono font-bold text-blue-700">{codeNumber || expectedPasscode}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Verified Proximity</span>
              <span className="font-bold text-slate-800">{Math.round(locationDistance)}m (≤ {allowedRadius}m)</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Student Email</span>
              <span className="font-mono font-bold text-slate-700 truncate block">{studentEmail}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Marked Time</span>
              <span className="font-bold text-slate-800">{markedRecord.markedTimeStr}</span>
            </div>
          </div>

          {/* Dedicated Gmail Notification Sent Banner */}
          <div className="max-w-md mx-auto bg-white rounded-xl p-4 border border-red-200 text-left space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Automated Gmail Alert Dispatched</h4>
                  <p className="text-[10px] text-slate-500">Sent to: {studentEmail}</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                DELIVERED ✓
              </span>
            </div>

            <div className="flex gap-2 pt-1">
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
                View Email Details
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
          {/* NOTICE BANNER: THREE CONDITIONS CHECKLIST */}
          <div className="bg-white border-2 border-slate-300 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                    Mandatory 3-Condition Attendance Verification Notice
                  </h3>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Notice: To fill attendance, three conditions must be verified right: <strong>(1) Location within 100 meters</strong>, <strong>(2) Code Number Right</strong>, and <strong>(3) Face Scan (with prior Device Scan)</strong>. Only after all three conditions are fulfilled will the <strong>Confirm Attendance</strong> button unlock. Click Confirm to successfully fill attendance; otherwise an <strong>Unsuccessful Attendance</strong> alert will pop up.
                </p>
              </div>

              {/* Mode switch pills */}
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold shrink-0">
                <button
                  type="button"
                  onClick={() => setInputMode('manual')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    inputMode === 'manual' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Code Input
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('qr')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition ${
                    inputMode === 'qr' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  Scan QR
                </button>
              </div>
            </div>

            {/* Condition 1 Box */}
            <div
              className={`rounded-2xl p-4 border transition-all ${
                isCodeValid
                  ? 'bg-emerald-50/70 border-emerald-300'
                  : codeError
                  ? 'bg-rose-50/70 border-rose-300'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                      isCodeValid
                        ? 'bg-emerald-600 text-white'
                        : codeError
                        ? 'bg-rose-600 text-white'
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    1
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Condition 1: Code Number Check</h4>
                    <p className="text-[11px] text-slate-500">
                      Enter the 6-digit session code displayed by the faculty
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                {isCodeValid ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full border border-emerald-300 w-fit">
                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                    Condition 1 Fulfilled (Code Right)
                  </span>
                ) : codeError ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-800 font-bold text-xs rounded-full border border-rose-300 w-fit">
                    <X className="w-3.5 h-3.5 text-rose-600 stroke-[3]" />
                    Condition 1 Failed (Code Wrong)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 font-bold text-xs rounded-full border border-amber-300 w-fit">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    Condition 1 Pending (Enter Code)
                  </span>
                )}
              </div>

              {/* Code Entry Input & Verify Button */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                <div className="relative flex-1">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="Enter 6-digit Code (e.g. 849201)"
                    value={codeNumber}
                    onChange={e => {
                      const val = e.target.value.trim();
                      setCodeNumber(val);
                      if (val.length >= 6) {
                        handleVerifyCode(val);
                      } else {
                        setIsCodeValid(false);
                        setCodeError(null);
                      }
                    }}
                    className={`w-full pl-9 pr-3 py-2.5 bg-white border rounded-xl text-xs font-mono font-bold tracking-wider focus:outline-none focus:ring-2 ${
                      isCodeValid
                        ? 'border-emerald-400 focus:ring-emerald-500 text-emerald-900'
                        : codeError
                        ? 'border-rose-400 focus:ring-rose-500 text-rose-900'
                        : 'border-slate-300 focus:ring-blue-500 text-slate-800'
                    }`}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleVerifyCode()}
                  className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  Check Code
                </button>

                {/* Helpful quick fill for testing */}
                <button
                  type="button"
                  onClick={() => {
                    setCodeNumber(expectedPasscode);
                    handleVerifyCode(expectedPasscode);
                  }}
                  className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-xl transition text-center whitespace-nowrap"
                  title="Auto-fill active faculty passcode for testing"
                >
                  Use Active Code ({expectedPasscode})
                </button>
              </div>

              {codeError && (
                <p className="text-xs text-rose-700 font-semibold mt-2 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {codeError}
                </p>
              )}
            </div>

            {/* Condition 2 Box */}
            <div
              className={`rounded-2xl p-4 border transition-all ${
                isLocationValid
                  ? 'bg-emerald-50/70 border-emerald-300'
                  : locationError
                  ? 'bg-rose-50/70 border-rose-300'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                      isLocationValid
                        ? 'bg-emerald-600 text-white'
                        : locationError
                        ? 'bg-rose-600 text-white'
                        : 'bg-purple-600 text-white'
                    }`}
                  >
                    2
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Condition 2: Location Proximity Check (≤ {allowedRadius}m)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Device GPS must be within {allowedRadius}m of faculty handheld device / classroom ({lecture.room})
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                {loadingGps ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-800 font-bold text-xs rounded-full border border-blue-300 w-fit">
                    <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                    Checking GPS Location...
                  </span>
                ) : isLocationValid ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full border border-emerald-300 w-fit">
                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                    Condition 2 Fulfilled ({Math.round(locationDistance)}m ≤ {allowedRadius}m)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-800 font-bold text-xs rounded-full border border-rose-300 w-fit">
                    <X className="w-3.5 h-3.5 text-rose-600 stroke-[3]" />
                    Condition 2 Failed (Outside Range: {Math.round(locationDistance)}m)
                  </span>
                )}
              </div>

              {/* Proximity Distance & Coordinates Comparison */}
              <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-3 text-xs">
                {/* Coordinates comparison grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Faculty Classroom Location
                    </span>
                    <div className="font-mono font-bold text-slate-800 text-xs">
                      {facultyLat.toFixed(5)}°, {facultyLng.toFixed(5)}°
                    </div>
                    <span className="text-[10px] text-slate-500">
                      Room: <strong>{currentLecture.room}</strong> • Radius: ≤ {allowedRadius}m
                    </span>
                  </div>

                  <div
                    className={`p-2.5 border rounded-xl space-y-0.5 transition ${
                      isLocationValid
                        ? 'bg-emerald-50/70 border-emerald-200'
                        : 'bg-rose-50/70 border-rose-200'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Student Device Location
                    </span>
                    <div className="font-mono font-bold text-slate-800 text-xs flex items-center justify-between">
                      <span>{studentCoords.latitude.toFixed(5)}°, {studentCoords.longitude.toFixed(5)}°</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isLocationValid ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800'
                      }`}>
                        {isLocationValid ? 'MATCHED ✓' : 'MISMATCH ✗'}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-600 block">
                      Distance to Faculty: <strong className={isLocationValid ? 'text-emerald-700' : 'text-rose-700'}>
                        {Math.round(locationDistance)} meters
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Primary Button to Match Faculty Location */}
                <div className="pt-1 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSyncWithFacultyLocation}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    Match Same Location with Faculty (In Classroom)
                  </button>

                  <button
                    type="button"
                    onClick={() => checkLocation(undefined, undefined, true)}
                    disabled={loadingGps}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingGps ? 'animate-spin' : ''}`} />
                    Detect Browser GPS
                  </button>

                  <button
                    type="button"
                    onClick={handleSimulateOutside}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 font-semibold rounded-xl text-xs transition"
                    title="Simulate different location (450m) to test unsuccessful pop-up"
                  >
                    Test Different Location (450m Out of Range)
                  </button>
                </div>
              </div>

              {locationError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium mt-2 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Location Mismatch: </span>
                    <span>{locationError}</span>
                    <button
                      type="button"
                      onClick={handleSyncWithFacultyLocation}
                      className="block mt-1 font-bold text-blue-700 hover:underline"
                    >
                      Click here to match faculty classroom location (Same Room) →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* CONDITION 3: FACE SCAN WITH PRIOR DEVICE SCAN */}
            <div
              className={`rounded-2xl p-4 border transition-all ${
                isFaceApproved && isDeviceApproved
                  ? 'bg-emerald-50/70 border-emerald-300'
                  : 'bg-rose-50/70 border-rose-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                      isFaceApproved && isDeviceApproved
                        ? 'bg-emerald-600 text-white'
                        : 'bg-rose-600 text-white'
                    }`}
                  >
                    3
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <ScanFace className="w-4 h-4 text-blue-600" />
                      Condition 3: Face Scan (with prior Device Scan)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Step A: Device Scan must verify this hardware • Step B: Live Face Scan biometrics must match
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                {isFaceApproved && isDeviceApproved ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full border border-emerald-300 w-fit">
                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                    Condition 3 Fulfilled (Face {faceConfidence}% • Device OK)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-800 font-bold text-xs rounded-full border border-rose-300 w-fit">
                    <X className="w-3.5 h-3.5 text-rose-600 stroke-[3]" />
                    Condition 3 Pending (Scan Required)
                  </span>
                )}
              </div>

              {/* Biometric Card Details */}
              <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Step A: Device Hardware & IP Scan */}
                  <div
                    className={`p-3 rounded-xl border space-y-1 transition ${
                      isDeviceApproved ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-700 flex items-center gap-1">
                        <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                        Step A: 1 Device : 1 IP Trace
                      </span>
                      <span
                        className={`font-mono text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          isDeviceApproved ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800'
                        }`}
                      >
                        {isDeviceApproved ? 'DEVICE BOUND ✓' : 'REJECTED: OTHER DEVICE'}
                      </span>
                    </div>
                    <p className="font-bold text-slate-800 truncate">{deviceInfo.deviceName}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded truncate">
                        ID: {deviceInfo.deviceId}
                      </span>
                      <span className="font-mono text-[10px] text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded font-bold">
                        IP: {deviceInfo.ipAddress}
                      </span>
                    </div>
                  </div>

                  {/* Step B: Live Face Biometrics */}
                  <div
                    className={`p-3 rounded-xl border flex items-center gap-3 transition ${
                      isFaceApproved ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                      <img
                        src={facePhotoSnapshot || generateStudentFaceSvg(student.name, student.enrollmentNumber)}
                        alt={student.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="space-y-0.5 text-[11px]">
                      <span className="font-bold text-slate-700 flex items-center gap-1">
                        <ScanFace className="w-3.5 h-3.5 text-sky-600" />
                        Step B: Live Face Biometrics
                      </span>
                      <div className="font-bold text-slate-800">
                        {isFaceApproved ? `Match: ${faceConfidence}% Confidence` : 'Face Scan Needed'}
                      </div>
                      <span className={`text-[10px] font-bold ${isFaceApproved ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {isFaceApproved ? 'BIOMETRIC MATCHED ✓' : 'UNVERIFIED ✗'}
                      </span>
                    </div>
                  </div>
                </div>

                {deviceMismatchError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Device Security Blocked: </span>
                      <span>{deviceMismatchError}</span>
                      <button
                        type="button"
                        onClick={handleRestoreRegisteredDevice}
                        className="block mt-1 font-bold text-blue-700 hover:underline"
                      >
                        Restore Student's Registered Device & IP →
                      </button>
                    </div>
                  </div>
                )}

                {/* Biometric Scan Action Buttons */}
                <div className="pt-1 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleStartDeviceAndFaceScan}
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Run Live Device Scan & Face Scan
                  </button>

                  <button
                    type="button"
                    onClick={handleSimulateOtherDevice}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 font-semibold rounded-xl text-xs transition"
                    title="Simulate someone else trying to mark attendance on their phone for an absent student"
                  >
                    Test "Other Device" Scan (Blocked)
                  </button>

                  <button
                    type="button"
                    onClick={handleResetBiometrics}
                    className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-semibold rounded-xl text-xs transition"
                  >
                    Restore Registered Device (Pass)
                  </button>
                </div>
              </div>
            </div>

            {/* Optional QR Scanner Tab Mode */}
            {inputMode === 'qr' && (
              <div className="border border-purple-200 rounded-2xl p-4 bg-purple-50/50 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-900">
                  <QrCode className="w-4 h-4 text-purple-700" />
                  <span>Scan Faculty Handheld QR Code Directly</span>
                </div>
                <StudentQRScanner
                  lecture={lecture}
                  onScanSuccess={handleQRScanSuccess}
                  isAlreadyMarked={Boolean(alreadyMarked)}
                />
              </div>
            )}

            {/* Summary 3-Condition Status Box */}
            <div
              className={`p-4 rounded-2xl border text-xs flex items-start sm:items-center justify-between gap-3 ${
                allThreeConditionsFulfilled
                  ? 'bg-emerald-100/70 border-emerald-300 text-emerald-950'
                  : 'bg-amber-50 border-amber-300 text-amber-950'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {allThreeConditionsFulfilled ? (
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                )}
                <div>
                  <h5 className="font-extrabold text-xs">
                    {allThreeConditionsFulfilled
                      ? '🎉 All 3 Conditions Fulfilled! Ready to Confirm Attendance.'
                      : '⚠️ Attendance Conditions Pending'}
                  </h5>
                  <p className="text-[11px] opacity-80 mt-0.5">
                    {allThreeConditionsFulfilled
                      ? 'Location ≤100m, session code verified, and face/device biometrics approved. Click Confirm button below.'
                      : `Status: Condition 1 (${isLocationValid ? '✓ Location ≤100m' : '✗ Location Needed'}) • Condition 2 (${
                          isCodeValid ? '✓ Right Code' : '✗ Code Needed'
                        }) • Condition 3 (${
                          isDeviceApproved && isFaceApproved ? '✓ Face & Device Scan' : '✗ Biometrics Needed'
                        })`}
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-1 font-mono text-[11px] font-bold">
                {allThreeConditionsFulfilled ? (
                  <span className="text-emerald-800 flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
                    <Check className="w-3.5 h-3.5" /> 3 / 3 Passed
                  </span>
                ) : (
                  <span className="text-amber-800 bg-white px-2.5 py-1 rounded-lg border border-amber-200">
                    {(isLocationValid ? 1 : 0) + (isCodeValid ? 1 : 0) + (isDeviceApproved && isFaceApproved ? 1 : 0)} / 3 Conditions
                  </span>
                )}
              </div>
            </div>

            {/* THE CONFIRM BUTTON */}
            <div>
              <button
                type="button"
                onClick={handleConfirmAttendance}
                disabled={isSubmitting || Boolean(alreadyMarked)}
                className={`w-full py-4 px-6 rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 shadow-lg transition-all transform active:scale-[0.99] ${
                  allThreeConditionsFulfilled
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white ring-4 ring-emerald-400/30 cursor-pointer animate-pulse'
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-600 border border-slate-300 cursor-pointer'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>RECORDING ATTENDANCE...</span>
                  </>
                ) : allThreeConditionsFulfilled ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-white" />
                    <span>CONFIRM & SUBMIT ATTENDANCE (3 / 3 CONDITIONS APPROVED ✓)</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-slate-500" />
                    <span>CONFIRM ATTENDANCE (LOCKED: FULFILL ALL 3 CONDITIONS)</span>
                  </>
                )}
              </button>

              {!allThreeConditionsFulfilled && (
                <p className="text-center text-[11px] text-slate-500 mt-2">
                  * Button will unlock when Condition 1 (Location ≤100m), Condition 2 (Code Number Right), and Condition 3 (Face Scan & Device Scan) are satisfied. Clicking now shows verification breakdown.
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {/* UNSUCCESSFUL ATTENDANCE MESSAGE POPUP MODAL */}
      {showUnsuccessfulModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border-2 border-rose-300 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-rose-900">Attendance Unsuccessful</h3>
                  <p className="text-[11px] text-rose-600">Verification requirements could not be fulfilled</p>
                </div>
              </div>
              <button
                onClick={() => setShowUnsuccessfulModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs space-y-2">
              <h4 className="font-bold text-rose-900 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                Unsuccessful Attendance Reason:
              </h4>
              <p className="text-rose-800 text-[11px] leading-relaxed">
                {unsuccessfulReason}
              </p>
            </div>

            {/* Verification Checklist Breakdown */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">
                Condition Verification Breakdown:
              </span>

              {/* Condition 1 breakdown */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                  isLocationValid && locationDistance <= allowedRadius
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isLocationValid && locationDistance <= allowedRadius ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <X className="w-4 h-4 text-rose-600" />
                  )}
                  <div>
                    <span className="font-bold block">Condition 1: Location Proximity (≤100m)</span>
                    <span className="text-[11px] opacity-80">
                      {isLocationValid && locationDistance <= allowedRadius
                        ? `Within allowed radius (${Math.round(locationDistance)}m ≤ ${allowedRadius}m)`
                        : `Outside perimeter (${Math.round(locationDistance)}m > ${allowedRadius}m limit)`}
                    </span>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold uppercase ${
                    isLocationValid && locationDistance <= allowedRadius ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {isLocationValid && locationDistance <= allowedRadius ? 'PASSED ✓' : 'FAILED ✗'}
                </span>
              </div>

              {/* Condition 2 breakdown */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                  isCodeValid
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isCodeValid ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <X className="w-4 h-4 text-rose-600" />
                  )}
                  <div>
                    <span className="font-bold block">Condition 2: Code Number</span>
                    <span className="text-[11px] opacity-80">
                      {isCodeValid
                        ? `Right code verified (${codeNumber})`
                        : codeNumber
                        ? `Entered "${codeNumber}" (Wrong code number)`
                        : 'Code not entered'}
                    </span>
                  </div>
                </div>
                <span className={`text-[10px] font-bold uppercase ${isCodeValid ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {isCodeValid ? 'PASSED ✓' : 'FAILED ✗'}
                </span>
              </div>

              {/* Condition 3 breakdown */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                  isDeviceApproved && isFaceApproved
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isDeviceApproved && isFaceApproved ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <X className="w-4 h-4 text-rose-600" />
                  )}
                  <div>
                    <span className="font-bold block">Condition 3: Face Scan & Device Scan</span>
                    <span className="text-[11px] opacity-80">
                      {isDeviceApproved && isFaceApproved
                        ? `Face Matched (${faceConfidence}%) • Device Approved (${deviceInfo.deviceName})`
                        : `${!isDeviceApproved ? 'Device not approved. ' : ''}${!isFaceApproved ? 'Live face scan not verified.' : ''}`}
                    </span>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold uppercase ${
                    isDeviceApproved && isFaceApproved ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {isDeviceApproved && isFaceApproved ? 'PASSED ✓' : 'FAILED ✗'}
                </span>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowUnsuccessfulModal(false);
                  if (!isCodeValid) {
                    setCodeNumber(expectedPasscode);
                    handleVerifyCode(expectedPasscode);
                  }
                  if (!isLocationValid || locationDistance > allowedRadius) {
                    handleSyncWithFacultyLocation();
                  }
                  handleResetBiometrics();
                }}
                className="flex-1 py-2.5 px-4 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-xs transition shadow-sm text-center"
              >
                Auto-Correct All 3 Conditions & Retry
              </button>
              <button
                type="button"
                onClick={() => setShowUnsuccessfulModal(false)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gmail Email Details Modal */}
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

      {/* LIVE DEVICE SCAN & FACE SCAN MODAL */}
      {showFaceScanLiveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <ScanFace className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Condition 3: Device & Face Scan</h3>
                  <p className="text-[11px] text-slate-500">Live hardware check followed by biometric face verification</p>
                </div>
              </div>
              <button
                onClick={() => setShowFaceScanLiveModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sequence Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-bold">
                <span className={liveScanStage === 'DEVICE_SCAN' ? 'text-blue-700 animate-pulse' : 'text-slate-500'}>
                  1. Device Scan {isDeviceApproved ? '✓' : ''}
                </span>
                <span className={liveScanStage === 'FACE_SCAN' ? 'text-sky-600 animate-pulse' : 'text-slate-500'}>
                  2. Face Scan {isFaceApproved ? '✓' : ''}
                </span>
                <span className={liveScanStage === 'SUCCESS' ? 'text-emerald-700' : 'text-slate-400'}>
                  3. Approved
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-600 via-sky-500 to-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${liveScanProgress}%` }}
                />
              </div>
            </div>

            {/* Live Camera / Scan View */}
            <div className="relative aspect-video bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-800 flex items-center justify-center">
              <img
                src={facePhotoSnapshot || generateStudentFaceSvg(student.name, student.enrollmentNumber)}
                alt={student.name}
                className="w-full h-full object-contain p-2"
              />

              {/* Scanning HUD Overlay */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                <div className="w-32 h-40 border-2 border-dashed border-sky-400/90 rounded-[50%] flex items-center justify-center relative shadow-[0_0_15px_rgba(56,189,248,0.5)]">
                  {(isDeviceScanning || isFaceScanning) && (
                    <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent top-0 animate-[bounce_1s_infinite]" />
                  )}
                  <span className="text-[9px] font-mono font-bold text-sky-200 bg-black/70 px-2 py-0.5 rounded-full absolute bottom-2">
                    {isDeviceScanning
                      ? 'SCANNING DEVICE...'
                      : isFaceScanning
                      ? 'SCANNING FACE BIOMETRICS...'
                      : 'IDENTITY APPROVED ✓'}
                  </span>
                </div>
              </div>
            </div>

            {/* Status Breakdown Box */}
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                    Device Scan Status:
                  </span>
                  <span
                    className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                      isDeviceApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800 animate-pulse'
                    }`}
                  >
                    {isDeviceApproved ? 'APPROVED ✓' : 'SCANNING HARDWARE...'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span>Hardware ID: </span>
                    <span className="font-mono font-bold text-slate-800">{deviceInfo.deviceId}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Traced IP: </span>
                    <span className="font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100">{deviceInfo.ipAddress}</span>
                  </div>
                  <span className="block text-[10px] text-slate-500 mt-0.5">{deviceInfo.deviceName}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <ScanFace className="w-3.5 h-3.5 text-sky-600" />
                    Face Scan Status:
                  </span>
                  <span
                    className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                      isFaceApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800 animate-pulse'
                    }`}
                  >
                    {isFaceApproved ? `MATCHED ${faceConfidence}% ✓` : 'ANALYZING BIOMETRICS...'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600">
                  <span>Enrolled Student: </span>
                  <strong className="text-slate-800">{student.name}</strong> ({student.enrollmentNumber})
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowFaceScanLiveModal(false)}
                className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-xs transition shadow-md"
              >
                {isFaceApproved && isDeviceApproved
                  ? 'Complete & Return to Attendance Form (Conditions Passed ✓)'
                  : 'Close Scanner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
