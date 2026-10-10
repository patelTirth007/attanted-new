export type Role = 'STUDENT' | 'FACULTY' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: number;
}

export interface Student {
  id: string;
  userId: string;
  email: string;
  enrollmentNumber: string;
  name: string;
  department: string;
  semester: number;
  division: string;
  rollNumber: string;
  phone: string;
  faceEnrollmentStatus?: boolean;
  faceEmbedding?: string;
  facePhotoUrl?: string;
  deviceId?: string;
  deviceName?: string;
  deviceRegisteredAt?: number;
  deviceVerified?: boolean;
  ipAddress?: string;
  ipRegisteredAt?: number;
  allowOtherDevice?: boolean;
  createdAt: number;
}

export interface Faculty {
  id: string;
  userId: string;
  name: string;
  department: string;
  email: string;
  phone: string;
  secretCode?: string;
  isSecurityCodeVerified?: boolean;
}

export interface Subject {
  id: string;
  subjectCode: string;
  subjectName: string;
  semester: number;
  department: string;
}

export type LectureStatus = 'ACTIVE' | 'UPCOMING' | 'CLOSED';

export interface Lecture {
  id: string;
  subjectId: string;
  facultyId: string;
  facultyName: string;
  subjectName: string;
  subjectCode: string;
  semester: number;
  division: string;
  room: string;
  date: string; // YYYY-MM-DD
  startTime: string; // e.g. "09:00 AM"
  endTime: string; // e.g. "10:00 AM"
  attendanceStart: string; // e.g. "09:00 AM"
  attendanceEnd: string; // e.g. "09:15 AM"
  status: LectureStatus;
  facultyLatitude?: number;
  facultyLongitude?: number;
  geofenceRadiusMeters?: number; // 100m handheld proximity
  qrSessionToken?: string;
  qrPasscode?: string;
  qrGeneratedAt?: number;
}

export interface AttendanceQRPayload {
  lectureId: string;
  subjectCode: string;
  subjectName: string;
  facultyId: string;
  facultyName: string;
  room: string;
  facultyLat: number;
  facultyLng: number;
  allowedRadiusMeters: number; // 100 meters handheld proximity
  passcode: string;
  token: string;
  timestamp: number;
  expiresAt: number;
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'MANUALLY_CORRECTED';

export interface AttendanceRecord {
  id: string;
  lectureId: string;
  studentId: string;
  studentEmail: string;
  studentName: string;
  rollNumber: string;
  enrollmentNumber: string;
  status: AttendanceStatus;
  markedAt: number;
  markedTimeStr: string;
  latitude: number;
  longitude: number;
  gpsAccuracy: number;
  distanceMeters: number;
  verificationMethod: string;
  qrVerified?: boolean;
  facultyDistanceMeters?: number;
  faceVerified?: boolean;
  faceConfidence?: number;
  livenessVerified?: boolean;
  deviceVerified?: boolean;
  deviceMatched?: boolean;
  deviceId?: string;
  ipAddress?: string;
  facePhotoSnapshot?: string;
  correctionReason?: string;
  correctedByFacultyId?: string;
  gmailNotificationSent?: boolean;
  gmailNotificationId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface CollegeSettings {
  id: string;
  collegeName: string;
  latitude: number;
  longitude: number;
  allowedRadiusMeters: number;
  minimumGpsAccuracy: number;
  updatedAt: number;
}

export interface GmailNotification {
  id: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  body: string;
  sentAt: number;
  sentTimeStr: string;
  lectureId: string;
  subjectName: string;
  subjectCode: string;
  status: 'SENT' | 'DELIVERED';
  gmailUrl: string;
  mailtoUrl: string;
}
