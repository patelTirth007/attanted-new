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
  enrollmentNumber: string;
  name: string;
  department: string;
  semester: number;
  division: string;
  rollNumber: string;
  phone: string;
  faceEnrollmentStatus: boolean;
  faceEmbedding?: string; // serialized float array
  createdAt: number;
}

export interface Faculty {
  id: string;
  userId: string;
  name: string;
  department: string;
  email: string;
  phone: string;
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
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'MANUALLY_CORRECTED';

export interface AttendanceRecord {
  id: string;
  lectureId: string;
  studentId: string;
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
  faceVerified: boolean;
  faceConfidence: number;
  livenessVerified: boolean;
  verificationMethod: string;
  correctionReason?: string;
  correctedByFacultyId?: string;
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
