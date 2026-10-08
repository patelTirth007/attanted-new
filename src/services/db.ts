import { 
  User, Student, Faculty, Subject, Lecture, AttendanceRecord, CollegeSettings, AttendanceStatus 
} from '../types';

const STORAGE_KEYS = {
  USERS: 'sca_users',
  STUDENTS: 'sca_students',
  FACULTY: 'sca_faculty',
  SUBJECTS: 'sca_subjects',
  LECTURES: 'sca_lectures',
  ATTENDANCE: 'sca_attendance',
  SETTINGS: 'sca_settings',
  AUTH: 'sca_auth_session'
};

// Simple secure hash function for demo
export function hashPassword(pass: string): string {
  let hash = 0;
  for (let i = 0; i < pass.length; i++) {
    const char = pass.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'h_' + Math.abs(hash).toString(16) + '_sec';
}

class DatabaseService {
  private initDatabase() {
    if (localStorage.getItem(STORAGE_KEYS.USERS)) return;

    // 1. College Settings
    const defaultSettings: CollegeSettings = {
      id: 'settings_1',
      collegeName: 'Gujarat Technological University (Campus)',
      latitude: 23.2156,
      longitude: 72.6369,
      allowedRadiusMeters: 2000, // 2 KM default
      minimumGpsAccuracy: 50,
      updatedAt: Date.now()
    };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));

    // 2. Faculty
    const fPass = hashPassword('faculty123');
    const aPass = hashPassword('admin123');
    const sPass = hashPassword('student123');

    const users: User[] = [
      { id: 'u_fac_1', email: 'faculty@college.edu', passwordHash: fPass, role: 'FACULTY', createdAt: Date.now() },
      { id: 'u_fac_2', email: 'admin@college.edu', passwordHash: aPass, role: 'FACULTY', createdAt: Date.now() },
      { id: 'u_stu_1', email: 'student@college.edu', passwordHash: sPass, role: 'STUDENT', createdAt: Date.now() }
    ];

    const facultyList: Faculty[] = [
      { id: 'fac_1', userId: 'u_fac_1', name: 'Dr. Rajesh Sharma', department: 'Information Technology', email: 'faculty@college.edu', phone: '+91 98765 43210' },
      { id: 'fac_2', userId: 'u_fac_2', name: 'Prof. Ananya Sen', department: 'Computer Science', email: 'admin@college.edu', phone: '+91 98765 43211' }
    ];

    // 3. 10 Subjects
    const subjects: Subject[] = [
      { id: 'sub_1', subjectCode: '3150703', subjectName: 'Data Structures & Algorithms', semester: 5, department: 'Information Technology' },
      { id: 'sub_2', subjectCode: '3150710', subjectName: 'Computer Networks', semester: 5, department: 'Information Technology' },
      { id: 'sub_3', subjectCode: '3150711', subjectName: 'Software Engineering', semester: 5, department: 'Information Technology' },
      { id: 'sub_4', subjectCode: '3150702', subjectName: 'Operating Systems', semester: 5, department: 'Information Technology' },
      { id: 'sub_5', subjectCode: '3150714', subjectName: 'Artificial Intelligence', semester: 5, department: 'Information Technology' },
      { id: 'sub_6', subjectCode: '3150704', subjectName: 'Database Management Systems', semester: 5, department: 'Information Technology' },
      { id: 'sub_7', subjectCode: '3150712', subjectName: 'Web Technologies', semester: 5, department: 'Information Technology' },
      { id: 'sub_8', subjectCode: '3150715', subjectName: 'Cyber Security', semester: 5, department: 'Information Technology' },
      { id: 'sub_9', subjectCode: '3150716', subjectName: 'Cloud Computing', semester: 5, department: 'Information Technology' },
      { id: 'sub_10', subjectCode: '3150717', subjectName: 'Machine Learning', semester: 5, department: 'Information Technology' }
    ];

    // 4. 105 Students (Realistic 100+ students batch)
    const firstNames = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
      'Shaurya', 'Atharva', 'Dhruv', 'Kabir', 'Rudra', 'Diya', 'Saanvi', 'Ananya', 'Aadhya', 'Pari',
      'Isha', 'Navya', 'Kiara', 'Myra', 'Riya', 'Anvi', 'Tanvi', 'Avani', 'Meera', 'Ahana',
      'Kavya', 'Prisha', 'Sara', 'Sneha', 'Aditi', 'Bhavya', 'Dev', 'Het', 'Keval', 'Meet',
      'Nisarg', 'Parth', 'Pranav', 'Rohan', 'Sahil', 'Tanmay', 'Utkarsh', 'Varun', 'Yash', 'Zeel'];
    const lastNames = ['Patel', 'Shah', 'Mehta', 'Desai', 'Joshi', 'Pandya', 'Trivedi', 'Sharma', 'Verma', 'Gupta',
      'Prajapati', 'Panchal', 'Barot', 'Rathod', 'Solanki', 'Chauhan', 'Makwana', 'Vaghela', 'Bhatt', 'Dave'];

    const defaultEmbedding = Array.from({ length: 64 }, () => 0.125).join(',');

    const students: Student[] = [
      {
        id: 'stu_1',
        userId: 'u_stu_1',
        enrollmentNumber: '23IT001',
        name: 'Tirth Patel',
        department: 'Information Technology',
        semester: 5,
        division: 'A',
        rollNumber: '01',
        phone: '+91 91234 56789',
        faceEnrollmentStatus: true,
        faceEmbedding: defaultEmbedding,
        createdAt: Date.now()
      }
    ];

    for (let i = 2; i <= 105; i++) {
      const rollStr = i < 10 ? `0${i}` : `${i}`;
      const enrollNum = `23IT${i < 10 ? '00' : i < 100 ? '0' : ''}${i}`;
      const fName = firstNames[(i * 3 + 7) % firstNames.length];
      const lName = lastNames[(i * 5 + 11) % lastNames.length];
      const division = i <= 60 ? 'A' : 'B';

      students.push({
        id: `stu_${i}`,
        userId: `u_stu_${i}`,
        enrollmentNumber: enrollNum,
        name: `${fName} ${lName}`,
        department: 'Information Technology',
        semester: 5,
        division: division,
        rollNumber: rollStr,
        phone: `+91 98000 ${10000 + i}`,
        faceEnrollmentStatus: i % 6 !== 0,
        faceEmbedding: i % 6 !== 0 ? defaultEmbedding : undefined,
        createdAt: Date.now()
      });
    }

    // 5. Lectures (Today's Active Lectures & Upcoming)
    const today = new Date().toISOString().split('T')[0];
    const lectures: Lecture[] = [
      {
        id: 'lec_1',
        subjectId: 'sub_1',
        facultyId: 'fac_1',
        facultyName: 'Dr. Rajesh Sharma',
        subjectName: 'Data Structures & Algorithms',
        subjectCode: '3150703',
        semester: 5,
        division: 'A',
        room: 'Lab 301 - IT Block',
        date: today,
        startTime: '09:00 AM',
        endTime: '10:00 AM',
        attendanceStart: '09:00 AM',
        attendanceEnd: '11:59 PM', // Active window open today
        status: 'ACTIVE'
      },
      {
        id: 'lec_2',
        subjectId: 'sub_2',
        facultyId: 'fac_1',
        facultyName: 'Dr. Rajesh Sharma',
        subjectName: 'Computer Networks',
        subjectCode: '3150710',
        semester: 5,
        division: 'A',
        room: 'Classroom 402',
        date: today,
        startTime: '10:15 AM',
        endTime: '11:15 AM',
        attendanceStart: '10:15 AM',
        attendanceEnd: '11:30 AM',
        status: 'ACTIVE'
      },
      {
        id: 'lec_3',
        subjectId: 'sub_3',
        facultyId: 'fac_2',
        facultyName: 'Prof. Ananya Sen',
        subjectName: 'Software Engineering',
        subjectCode: '3150711',
        semester: 5,
        division: 'A',
        room: 'Seminar Hall 2',
        date: today,
        startTime: '11:30 AM',
        endTime: '12:30 PM',
        attendanceStart: '11:30 AM',
        attendanceEnd: '11:45 AM',
        status: 'UPCOMING'
      },
      {
        id: 'lec_4',
        subjectId: 'sub_4',
        facultyId: 'fac_1',
        facultyName: 'Dr. Rajesh Sharma',
        subjectName: 'Operating Systems',
        subjectCode: '3150702',
        semester: 5,
        division: 'A',
        room: 'Lab 204',
        date: '2026-10-06',
        startTime: '09:00 AM',
        endTime: '10:00 AM',
        attendanceStart: '09:00 AM',
        attendanceEnd: '09:15 AM',
        status: 'CLOSED'
      }
    ];

    // 6. Pre-seed Attendance for Lecture 1 (Showing 42 Present, 5 Late, Absent un-marked)
    const attendance: AttendanceRecord[] = [];
    const divAStudents = students.filter(s => s.division === 'A' && s.id !== 'stu_1');

    divAStudents.forEach((student, idx) => {
      if (idx < 42) {
        attendance.push({
          id: `att_${student.id}_lec1`,
          lectureId: 'lec_1',
          studentId: student.id,
          studentName: student.name,
          rollNumber: student.rollNumber,
          enrollmentNumber: student.enrollmentNumber,
          status: 'PRESENT',
          markedAt: Date.now() - (15 * 60 * 1000) + (idx * 15000),
          markedTimeStr: `09:0${(idx % 9) + 1} AM`,
          latitude: 23.2156 + (0.0001 * (idx % 4)),
          longitude: 72.6369 + (0.0001 * (idx % 3)),
          gpsAccuracy: 12,
          distanceMeters: 380 + (idx * 20),
          faceVerified: true,
          faceConfidence: 94 + (idx % 5),
          livenessVerified: true,
          verificationMethod: 'BIOMETRIC_GPS',
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      } else if (idx < 47) {
        attendance.push({
          id: `att_${student.id}_lec1`,
          lectureId: 'lec_1',
          studentId: student.id,
          studentName: student.name,
          rollNumber: student.rollNumber,
          enrollmentNumber: student.enrollmentNumber,
          status: 'LATE',
          markedAt: Date.now() - (5 * 60 * 1000),
          markedTimeStr: '09:18 AM',
          latitude: 23.2160,
          longitude: 72.6372,
          gpsAccuracy: 15,
          distanceMeters: 820,
          faceVerified: true,
          faceConfidence: 91,
          livenessVerified: true,
          verificationMethod: 'BIOMETRIC_GPS',
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      }
    });

    // Past attendance for student Tirth Patel
    attendance.push({
      id: 'att_stu1_lec4',
      lectureId: 'lec_4',
      studentId: 'stu_1',
      studentName: 'Tirth Patel',
      rollNumber: '01',
      enrollmentNumber: '23IT001',
      status: 'PRESENT',
      markedAt: Date.now() - 86400000,
      markedTimeStr: '09:04 AM',
      latitude: 23.2158,
      longitude: 72.6368,
      gpsAccuracy: 10,
      distanceMeters: 420,
      faceVerified: true,
      faceConfidence: 97,
      livenessVerified: true,
      verificationMethod: 'BIOMETRIC_GPS',
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now() - 86400000
    });

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEYS.FACULTY, JSON.stringify(facultyList));
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    localStorage.setItem(STORAGE_KEYS.LECTURES, JSON.stringify(lectures));
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));
  }

  constructor() {
    this.initDatabase();
  }

  // --- College Settings ---
  getCollegeSettings(): CollegeSettings {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return raw ? JSON.parse(raw) : {
      id: 'settings_1',
      collegeName: 'Gujarat Technological University (Campus)',
      latitude: 23.2156,
      longitude: 72.6369,
      allowedRadiusMeters: 2000,
      minimumGpsAccuracy: 50,
      updatedAt: Date.now()
    };
  }

  updateCollegeSettings(settings: CollegeSettings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ ...settings, updatedAt: Date.now() }));
  }

  // --- Auth & Users ---
  getUserByEmail(email: string): User | undefined {
    const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    return users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  }

  getStudentByUserId(userId: string): Student | undefined {
    const students: Student[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS) || '[]');
    return students.find(s => s.userId === userId);
  }

  getStudentById(id: string): Student | undefined {
    const students: Student[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS) || '[]');
    return students.find(s => s.id === id);
  }

  getFacultyByUserId(userId: string): Faculty | undefined {
    const faculty: Faculty[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.FACULTY) || '[]');
    return faculty.find(f => f.userId === userId);
  }

  registerStudent(params: {
    enrollmentNumber: string;
    fullName: string;
    email: string;
    mobile: string;
    department: string;
    semester: number;
    division: string;
    rollNumber: string;
    password: string;
  }): { success: boolean; error?: string; user?: User; student?: Student } {
    const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const students: Student[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS) || '[]');

    if (users.some(u => u.email.toLowerCase() === params.email.trim().toLowerCase())) {
      return { success: false, error: 'An account with this email already exists.' };
    }
    if (students.some(s => s.enrollmentNumber.toLowerCase() === params.enrollmentNumber.trim().toLowerCase())) {
      return { success: false, error: 'A student with this enrollment number is already registered.' };
    }

    const userId = `u_stu_${Date.now()}`;
    const studentId = `stu_${Date.now()}`;
    const newUser: User = {
      id: userId,
      email: params.email.trim().toLowerCase(),
      passwordHash: hashPassword(params.password),
      role: 'STUDENT',
      createdAt: Date.now()
    };

    const newStudent: Student = {
      id: studentId,
      userId: userId,
      enrollmentNumber: params.enrollmentNumber.trim().toUpperCase(),
      name: params.fullName.trim(),
      department: params.department,
      semester: params.semester,
      division: params.division.trim().toUpperCase(),
      rollNumber: params.rollNumber.trim(),
      phone: params.mobile.trim(),
      faceEnrollmentStatus: false,
      createdAt: Date.now()
    };

    users.push(newUser);
    students.push(newStudent);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));

    return { success: true, user: newUser, student: newStudent };
  }

  updateStudentFaceEnrollment(studentId: string, embeddingStr: string) {
    const students: Student[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS) || '[]');
    const idx = students.findIndex(s => s.id === studentId);
    if (idx !== -1) {
      students[idx].faceEnrollmentStatus = true;
      students[idx].faceEmbedding = embeddingStr;
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    }
  }

  // --- Students List ---
  getAllStudents(): Student[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS) || '[]');
  }

  // --- Subjects ---
  getAllSubjects(): Subject[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SUBJECTS) || '[]');
  }

  // --- Lectures ---
  getAllLectures(): Lecture[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.LECTURES) || '[]');
  }

  getLectureById(id: string): Lecture | undefined {
    return this.getAllLectures().find(l => l.id === id);
  }

  createLecture(lec: Omit<Lecture, 'id'>): Lecture {
    const lectures = this.getAllLectures();
    const newLec: Lecture = {
      ...lec,
      id: `lec_${Date.now()}`
    };
    lectures.unshift(newLec);
    localStorage.setItem(STORAGE_KEYS.LECTURES, JSON.stringify(lectures));
    return newLec;
  }

  updateLectureStatus(lectureId: string, status: 'ACTIVE' | 'UPCOMING' | 'CLOSED') {
    const lectures = this.getAllLectures();
    const idx = lectures.findIndex(l => l.id === lectureId);
    if (idx !== -1) {
      lectures[idx].status = status;
      localStorage.setItem(STORAGE_KEYS.LECTURES, JSON.stringify(lectures));
    }
  }

  // --- Attendance ---
  getAllAttendance(): AttendanceRecord[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE) || '[]');
  }

  getAttendanceForLecture(lectureId: string): AttendanceRecord[] {
    return this.getAllAttendance().filter(a => a.lectureId === lectureId);
  }

  getAttendanceForStudent(studentId: string): AttendanceRecord[] {
    return this.getAllAttendance().filter(a => a.studentId === studentId);
  }

  hasMarkedAttendance(lectureId: string, studentId: string): boolean {
    return this.getAllAttendance().some(a => a.lectureId === lectureId && a.studentId === studentId);
  }

  markAttendance(record: Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt'>): AttendanceRecord {
    const attendance = this.getAllAttendance();
    // Unique constraint: lectureId + studentId
    if (attendance.some(a => a.lectureId === record.lectureId && a.studentId === record.studentId)) {
      throw new Error('Attendance has already been marked for this lecture.');
    }

    const newRecord: AttendanceRecord = {
      ...record,
      id: `att_${record.studentId}_${record.lectureId}_${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    attendance.push(newRecord);
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));
    return newRecord;
  }

  correctAttendance(attendanceId: string, newStatus: AttendanceStatus, reason: string, facultyId: string) {
    const attendance = this.getAllAttendance();
    const idx = attendance.findIndex(a => a.id === attendanceId);
    if (idx !== -1) {
      attendance[idx].status = newStatus;
      attendance[idx].correctionReason = reason;
      attendance[idx].correctedByFacultyId = facultyId;
      attendance[idx].updatedAt = Date.now();
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));
    }
  }
}

export const db = new DatabaseService();
