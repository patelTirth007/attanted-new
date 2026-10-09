import { 
  User, Student, Faculty, Subject, Lecture, AttendanceRecord, CollegeSettings, AttendanceStatus 
} from '../types';
import { notificationService } from './notificationService';

const STORAGE_KEYS = {
  VERSION: 'sca_db_version_v8_semesters',
  USERS: 'sca_users',
  STUDENTS: 'sca_students',
  FACULTY: 'sca_faculty',
  SUBJECTS: 'sca_subjects',
  LECTURES: 'sca_lectures',
  ATTENDANCE: 'sca_attendance',
  SETTINGS: 'sca_settings',
  AUTH: 'sca_active_session'
};

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
  /**
   * Initializes baseline authentic college records with email ID support and distinct subjects.
   */
  public resetToCleanOriginalData(force = false) {
    if (!force && localStorage.getItem(STORAGE_KEYS.VERSION)) return;

    // Clear old storage keys
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.STUDENTS);
    localStorage.removeItem(STORAGE_KEYS.FACULTY);
    localStorage.removeItem(STORAGE_KEYS.SUBJECTS);
    localStorage.removeItem(STORAGE_KEYS.LECTURES);
    localStorage.removeItem(STORAGE_KEYS.ATTENDANCE);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);

    // 1. Initial College Settings (Configurable in Faculty Panel)
    const defaultSettings: CollegeSettings = {
      id: 'settings_1',
      collegeName: 'Engineering & Technology College Campus',
      latitude: 23.2156,
      longitude: 72.6369,
      allowedRadiusMeters: 2000, // 2 KM allowed geofence radius
      minimumGpsAccuracy: 50,
      updatedAt: Date.now()
    };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));

    // 2. Faculty & Student Admin Accounts
    const fPass = hashPassword('faculty123');
    const aPass = hashPassword('admin123');
    const sPass = hashPassword('student123');

    const users: User[] = [
      { id: 'u_fac_1', email: 'faculty@college.edu', passwordHash: fPass, role: 'FACULTY', createdAt: Date.now() },
      { id: 'u_fac_2', email: 'admin@college.edu', passwordHash: aPass, role: 'FACULTY', createdAt: Date.now() },
      { id: 'u_stu_1', email: 'tirthpatel1112005@gmail.com', passwordHash: sPass, role: 'STUDENT', createdAt: Date.now() }
    ];

    const facultyList: Faculty[] = [
      { id: 'fac_1', userId: 'u_fac_1', name: 'Dr. Rajesh Sharma', department: 'Information Technology', email: 'faculty@college.edu', phone: '+91 98765 43210' },
      { id: 'fac_2', userId: 'u_fac_2', name: 'Prof. Ananya Sen', department: 'Computer Science', email: 'admin@college.edu', phone: '+91 98765 43211' }
    ];

    // 3. Different Subjects across Semesters (Sem 1, Sem 3, Sem 5, Sem 7)
    const subjects: Subject[] = [
      // Semester 1
      { id: 'sub_sem1_1', subjectCode: '3110003', subjectName: 'Programming in C & Problem Solving', semester: 1, department: 'Information Technology' },
      { id: 'sub_sem1_2', subjectCode: '3110014', subjectName: 'Engineering Mathematics-I', semester: 1, department: 'Information Technology' },
      // Semester 3
      { id: 'sub_sem3_1', subjectCode: '3130702', subjectName: 'Data Structures & Algorithms-I', semester: 3, department: 'Information Technology' },
      { id: 'sub_sem3_2', subjectCode: '3130704', subjectName: 'Digital Fundamentals & Logic Design', semester: 3, department: 'Information Technology' },
      // Semester 5
      { id: 'sub_1', subjectCode: '3150703', subjectName: 'Data Structures & Algorithms', semester: 5, department: 'Information Technology' },
      { id: 'sub_2', subjectCode: '3150704', subjectName: 'Database Management Systems', semester: 5, department: 'Information Technology' },
      { id: 'sub_3', subjectCode: '3150710', subjectName: 'Computer Networks', semester: 5, department: 'Information Technology' },
      { id: 'sub_4', subjectCode: '3150711', subjectName: 'Software Engineering', semester: 5, department: 'Information Technology' },
      // Semester 7
      { id: 'sub_sem7_1', subjectCode: '3170716', subjectName: 'Artificial Intelligence & Machine Learning', semester: 7, department: 'Information Technology' },
      { id: 'sub_sem7_2', subjectCode: '3170720', subjectName: 'Cloud Computing & DevOps', semester: 7, department: 'Information Technology' }
    ];

    // 4. Initial Student Account with registered Email ID
    const students: Student[] = [
      {
        id: 'stu_1',
        userId: 'u_stu_1',
        email: 'tirthpatel1112005@gmail.com',
        enrollmentNumber: '23IT001',
        name: 'Tirth Patel',
        department: 'Information Technology',
        semester: 5,
        division: 'A',
        rollNumber: '01',
        phone: '+91 91234 56789',
        faceEnrollmentStatus: true,
        createdAt: Date.now()
      }
    ];

    // 5. Active Lectures for different subjects across Semesters
    const today = new Date().toISOString().split('T')[0];
    const lectures: Lecture[] = [
      // Semester 1 Lecture
      {
        id: 'lec_sem1_1',
        subjectId: 'sub_sem1_1',
        facultyId: 'fac_1',
        facultyName: 'Dr. Rajesh Sharma',
        subjectName: 'Programming in C & Problem Solving',
        subjectCode: '3110003',
        semester: 1,
        division: 'A',
        room: 'Computing Lab 101',
        date: today,
        startTime: '08:30 AM',
        endTime: '09:30 AM',
        attendanceStart: '08:30 AM',
        attendanceEnd: '11:59 PM',
        status: 'ACTIVE',
        facultyLatitude: 23.21562,
        facultyLongitude: 72.63692,
        geofenceRadiusMeters: 100,
        qrSessionToken: 'QR-PROG-100M-519201',
        qrPasscode: '519201',
        qrGeneratedAt: Date.now()
      },
      // Semester 3 Lecture
      {
        id: 'lec_sem3_1',
        subjectId: 'sub_sem3_1',
        facultyId: 'fac_2',
        facultyName: 'Prof. Ananya Sen',
        subjectName: 'Data Structures & Algorithms-I',
        subjectCode: '3130702',
        semester: 3,
        division: 'A',
        room: 'Lecture Hall 202',
        date: today,
        startTime: '09:30 AM',
        endTime: '10:30 AM',
        attendanceStart: '09:30 AM',
        attendanceEnd: '11:59 PM',
        status: 'ACTIVE',
        facultyLatitude: 23.21610,
        facultyLongitude: 72.63730,
        geofenceRadiusMeters: 100,
        qrSessionToken: 'QR-DS1-100M-429103',
        qrPasscode: '429103',
        qrGeneratedAt: Date.now()
      },
      // Semester 5 Lectures
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
        attendanceEnd: '11:59 PM',
        status: 'ACTIVE',
        facultyLatitude: 23.21562,
        facultyLongitude: 72.63692,
        geofenceRadiusMeters: 100,
        qrSessionToken: 'QR-DSA-100M-849201',
        qrPasscode: '849201',
        qrGeneratedAt: Date.now()
      },
      {
        id: 'lec_2',
        subjectId: 'sub_2',
        facultyId: 'fac_2',
        facultyName: 'Prof. Ananya Sen',
        subjectName: 'Database Management Systems',
        subjectCode: '3150704',
        semester: 5,
        division: 'A',
        room: 'Lecture Hall 102',
        date: today,
        startTime: '10:15 AM',
        endTime: '11:15 AM',
        attendanceStart: '10:15 AM',
        attendanceEnd: '11:59 PM',
        status: 'ACTIVE',
        facultyLatitude: 23.21610,
        facultyLongitude: 72.63730,
        geofenceRadiusMeters: 100,
        qrSessionToken: 'QR-DBMS-100M-631094',
        qrPasscode: '631094',
        qrGeneratedAt: Date.now()
      },
      {
        id: 'lec_3',
        subjectId: 'sub_3',
        facultyId: 'fac_1',
        facultyName: 'Dr. Rajesh Sharma',
        subjectName: 'Computer Networks',
        subjectCode: '3150710',
        semester: 5,
        division: 'A',
        room: 'Networking Lab 204',
        date: today,
        startTime: '11:30 AM',
        endTime: '12:30 PM',
        attendanceStart: '11:30 AM',
        attendanceEnd: '11:59 PM',
        status: 'ACTIVE',
        facultyLatitude: 23.21520,
        facultyLongitude: 72.63650,
        geofenceRadiusMeters: 100,
        qrSessionToken: 'QR-CN-100M-719542',
        qrPasscode: '719542',
        qrGeneratedAt: Date.now()
      },
      // Semester 7 Lecture
      {
        id: 'lec_sem7_1',
        subjectId: 'sub_sem7_1',
        facultyId: 'fac_1',
        facultyName: 'Dr. Rajesh Sharma',
        subjectName: 'Artificial Intelligence & Machine Learning',
        subjectCode: '3170716',
        semester: 7,
        division: 'A',
        room: 'Seminar Hall 401',
        date: today,
        startTime: '01:30 PM',
        endTime: '02:30 PM',
        attendanceStart: '01:30 PM',
        attendanceEnd: '11:59 PM',
        status: 'ACTIVE',
        facultyLatitude: 23.21562,
        facultyLongitude: 72.63692,
        geofenceRadiusMeters: 100,
        qrSessionToken: 'QR-AIML-100M-918204',
        qrPasscode: '918204',
        qrGeneratedAt: Date.now()
      }
    ];

    const attendance: AttendanceRecord[] = [];

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEYS.FACULTY, JSON.stringify(facultyList));
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    localStorage.setItem(STORAGE_KEYS.LECTURES, JSON.stringify(lectures));
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));
    localStorage.setItem(STORAGE_KEYS.VERSION, 'clean_v8_semesters');
  }

  /**
   * Completely purges all placeholder/demo records for 100% original college data insertion.
   * Keeps active faculty accounts so admin login remains seamless.
   */
  public purgeAllDemoData() {
    const fPass = hashPassword('faculty123');
    const existingFacultyUsers = this.getFacultyUsers();
    
    // Keep registered faculty accounts, or fallback to default admin
    const users: User[] = existingFacultyUsers.length > 0 
      ? existingFacultyUsers 
      : [{ id: 'u_fac_1', email: 'faculty@college.edu', passwordHash: fPass, role: 'FACULTY', createdAt: Date.now() }];

    const facultyList = this.getAllFaculty();
    const cleanFaculty: Faculty[] = facultyList.length > 0 
      ? facultyList 
      : [{ id: 'fac_1', userId: 'u_fac_1', name: 'Faculty Administrator', department: 'Academic Department', email: 'faculty@college.edu', phone: '' }];

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEYS.FACULTY, JSON.stringify(cleanFaculty));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.LECTURES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.VERSION, 'pure_original_v5');
  }

  public hasDemoData(): boolean {
    const students = this.getAllStudents();
    return students.some(s => s.id === 'stu_1' && s.enrollmentNumber === '23IT001' && s.name === 'Tirth Patel');
  }

  constructor() {
    this.resetToCleanOriginalData();
  }

  // --- College Settings ---
  getCollegeSettings(): CollegeSettings {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return raw ? JSON.parse(raw) : {
      id: 'settings_1',
      collegeName: 'Engineering & Technology College Campus',
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

  getUserById(userId: string): User | undefined {
    const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    return users.find(u => u.id === userId);
  }

  getFacultyUsers(): User[] {
    const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    return users.filter(u => u.role === 'FACULTY' || u.role === 'ADMIN');
  }

  getAllFaculty(): Faculty[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.FACULTY) || '[]');
  }

  getStudentByUserId(userId: string): Student | undefined {
    const students: Student[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS) || '[]');
    const s = students.find(item => item.userId === userId);
    if (s && !s.email) {
      const u = this.getUserById(userId);
      if (u) s.email = u.email;
    }
    return s;
  }

  getStudentById(id: string): Student | undefined {
    const students: Student[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS) || '[]');
    const s = students.find(item => item.id === id);
    if (s && !s.email) {
      const u = this.getUserById(s.userId);
      if (u) s.email = u.email;
    }
    return s;
  }

  getStudentByEmail(email: string): Student | undefined {
    const students = this.getAllStudents();
    const normalized = email.trim().toLowerCase();
    return students.find(s => s.email?.toLowerCase() === normalized);
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

    const emailTrimmed = params.email.trim().toLowerCase();
    if (users.some(u => u.email.toLowerCase() === emailTrimmed)) {
      return { success: false, error: 'An account with this email already exists.' };
    }
    if (students.some(s => s.enrollmentNumber.toLowerCase() === params.enrollmentNumber.trim().toLowerCase())) {
      return { success: false, error: 'A student with this enrollment number is already registered.' };
    }

    const userId = `u_stu_${Date.now()}`;
    const studentId = `stu_${Date.now()}`;
    const newUser: User = {
      id: userId,
      email: emailTrimmed,
      passwordHash: hashPassword(params.password),
      role: 'STUDENT',
      createdAt: Date.now()
    };

    const newStudent: Student = {
      id: studentId,
      userId: userId,
      email: emailTrimmed,
      enrollmentNumber: params.enrollmentNumber.trim().toUpperCase(),
      name: params.fullName.trim(),
      department: params.department,
      semester: params.semester,
      division: params.division.trim().toUpperCase(),
      rollNumber: params.rollNumber.trim(),
      phone: params.mobile.trim(),
      faceEnrollmentStatus: true,
      createdAt: Date.now()
    };

    users.push(newUser);
    students.push(newStudent);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));

    return { success: true, user: newUser, student: newStudent };
  }

  registerFaculty(params: {
    name: string;
    email: string;
    department: string;
    phone: string;
    password: string;
  }): { success: boolean; error?: string; user?: User; faculty?: Faculty } {
    const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const facultyList: Faculty[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.FACULTY) || '[]');

    const emailTrimmed = params.email.trim().toLowerCase();
    if (users.some(u => u.email.toLowerCase() === emailTrimmed)) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    const userId = `u_fac_${Date.now()}`;
    const facultyId = `fac_${Date.now()}`;
    const newUser: User = {
      id: userId,
      email: emailTrimmed,
      passwordHash: hashPassword(params.password),
      role: 'FACULTY',
      createdAt: Date.now()
    };

    const newFaculty: Faculty = {
      id: facultyId,
      userId: userId,
      name: params.name.trim(),
      department: params.department.trim(),
      email: emailTrimmed,
      phone: params.phone.trim()
    };

    users.push(newUser);
    facultyList.push(newFaculty);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEYS.FACULTY, JSON.stringify(facultyList));

    return { success: true, user: newUser, faculty: newFaculty };
  }

  // --- Students List & Management ---
  getAllStudents(): Student[] {
    const students: Student[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS) || '[]');
    const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    
    // Ensure email is populated on each student
    return students.map(s => {
      if (!s.email) {
        const u = users.find(user => user.id === s.userId);
        return {
          ...s,
          email: u ? u.email : `${s.enrollmentNumber.toLowerCase()}@college.edu`
        };
      }
      return s;
    });
  }

  getStudentsBySemester(semester?: number): Student[] {
    const list = this.getAllStudents();
    if (!semester || semester <= 0) return list;
    return list.filter(s => s.semester === semester);
  }

  addStudent(studentData: Omit<Student, 'id' | 'userId' | 'createdAt'>, password = 'password123'): Student {
    const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const students: Student[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS) || '[]');

    const userId = `u_stu_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const studentId = `stu_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

    const email = studentData.email 
      ? studentData.email.trim().toLowerCase() 
      : `${studentData.enrollmentNumber.toLowerCase()}@college.edu`;

    const newUser: User = {
      id: userId,
      email: email,
      passwordHash: hashPassword(password),
      role: 'STUDENT',
      createdAt: Date.now()
    };

    const newStudent: Student = {
      ...studentData,
      id: studentId,
      userId: userId,
      email: email,
      faceEnrollmentStatus: true,
      createdAt: Date.now()
    };

    users.push(newUser);
    students.push(newStudent);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    return newStudent;
  }

  deleteStudent(studentId: string) {
    let students = this.getAllStudents();
    const st = students.find(s => s.id === studentId);
    students = students.filter(s => s.id !== studentId);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));

    if (st) {
      let users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
      users = users.filter(u => u.id !== st.userId);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
  }

  clearAllStudents() {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify([]));
  }

  addStudentsBatch(list: Array<Omit<Student, 'id' | 'userId' | 'createdAt'>>): number {
    let added = 0;
    for (const item of list) {
      this.addStudent(item);
      added++;
    }
    return added;
  }

  // --- Subjects ---
  getAllSubjects(): Subject[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SUBJECTS) || '[]');
  }

  getSubjectsBySemester(semester?: number): Subject[] {
    const list = this.getAllSubjects();
    if (!semester || semester <= 0) return list;
    return list.filter(s => s.semester === semester);
  }

  addSubject(subjectData: Omit<Subject, 'id'>): Subject {
    const subjects = this.getAllSubjects();
    const newSubject: Subject = {
      ...subjectData,
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`
    };
    subjects.push(newSubject);
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
    return newSubject;
  }

  deleteSubject(subjectId: string) {
    let subjects = this.getAllSubjects();
    subjects = subjects.filter(s => s.id !== subjectId);
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
  }

  clearAllSubjects() {
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify([]));
  }

  // --- Lectures ---
  getAllLectures(): Lecture[] {
    const raw: Lecture[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.LECTURES) || '[]');
    return raw.map(l => ({
      ...l,
      geofenceRadiusMeters: l.geofenceRadiusMeters === 50 || !l.geofenceRadiusMeters ? 100 : l.geofenceRadiusMeters
    }));
  }

  getLecturesBySemester(semester?: number): Lecture[] {
    const list = this.getAllLectures();
    if (!semester || semester <= 0) return list;
    return list.filter(l => l.semester === semester);
  }

  getAvailableSemesters(): number[] {
    const lecs = this.getAllLectures();
    const subs = this.getAllSubjects();
    const semSet = new Set<number>();
    lecs.forEach(l => { if (l.semester) semSet.add(l.semester); });
    subs.forEach(s => { if (s.semester) semSet.add(s.semester); });
    [1, 2, 3, 4, 5, 6, 7, 8].forEach(s => semSet.add(s));
    return Array.from(semSet).sort((a, b) => a - b);
  }

  getLectureById(id: string): Lecture | undefined {
    return this.getAllLectures().find(l => l.id === id);
  }

  createLecture(lec: Omit<Lecture, 'id'>): Lecture {
    const lectures = this.getAllLectures();
    const newLec: Lecture = {
      ...lec,
      geofenceRadiusMeters: lec.geofenceRadiusMeters ?? 100,
      id: `lec_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`
    };
    lectures.unshift(newLec);
    localStorage.setItem(STORAGE_KEYS.LECTURES, JSON.stringify(lectures));
    return newLec;
  }

  deleteLecture(lectureId: string) {
    let lectures = this.getAllLectures();
    lectures = lectures.filter(l => l.id !== lectureId);
    localStorage.setItem(STORAGE_KEYS.LECTURES, JSON.stringify(lectures));
  }

  clearAllLectures() {
    localStorage.setItem(STORAGE_KEYS.LECTURES, JSON.stringify([]));
  }

  updateLectureStatus(lectureId: string, status: 'ACTIVE' | 'UPCOMING' | 'CLOSED') {
    const lectures = this.getAllLectures();
    const idx = lectures.findIndex(l => l.id === lectureId);
    if (idx !== -1) {
      lectures[idx].status = status;
      localStorage.setItem(STORAGE_KEYS.LECTURES, JSON.stringify(lectures));
    }
  }

  updateLectureQRSession(
    lectureId: string,
    params: {
      facultyLatitude: number;
      facultyLongitude: number;
      geofenceRadiusMeters?: number;
      qrSessionToken: string;
      qrPasscode: string;
    }
  ): Lecture | undefined {
    const lectures = this.getAllLectures();
    const idx = lectures.findIndex(l => l.id === lectureId);
    if (idx !== -1) {
      lectures[idx].facultyLatitude = params.facultyLatitude;
      lectures[idx].facultyLongitude = params.facultyLongitude;
      lectures[idx].geofenceRadiusMeters = params.geofenceRadiusMeters ?? 100;
      lectures[idx].qrSessionToken = params.qrSessionToken;
      lectures[idx].qrPasscode = params.qrPasscode;
      lectures[idx].qrGeneratedAt = Date.now();
      localStorage.setItem(STORAGE_KEYS.LECTURES, JSON.stringify(lectures));
      return lectures[idx];
    }
    return undefined;
  }

  // --- Attendance Management ---
  getAllAttendance(): AttendanceRecord[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE) || '[]');
  }

  getAttendanceForLecture(lectureId: string): AttendanceRecord[] {
    return this.getAllAttendance().filter(a => a.lectureId === lectureId);
  }

  getAttendanceBySemester(semester: number): AttendanceRecord[] {
    const lectures = this.getLecturesBySemester(semester);
    const lectureIds = new Set(lectures.map(l => l.id));
    return this.getAllAttendance().filter(a => lectureIds.has(a.lectureId));
  }

  getAttendanceForStudent(studentId: string): AttendanceRecord[] {
    return this.getAllAttendance().filter(a => a.studentId === studentId);
  }

  getAttendanceForEmail(email: string): AttendanceRecord[] {
    if (!email) return [];
    const norm = email.trim().toLowerCase();
    return this.getAllAttendance().filter(a => a.studentEmail?.toLowerCase() === norm);
  }

  hasMarkedAttendance(lectureId: string, studentId: string): boolean {
    return this.getAllAttendance().some(a => a.lectureId === lectureId && a.studentId === studentId);
  }

  /**
   * Checks whether this email ID has already marked attendance for this subject lecture.
   * Strict Single-Attendance Rule: Only 1 attendance per Email ID per subject session.
   */
  hasEmailMarkedAttendance(lectureId: string, email: string): boolean {
    if (!email) return false;
    const norm = email.trim().toLowerCase();
    return this.getAllAttendance().some(
      a => a.lectureId === lectureId && a.studentEmail?.toLowerCase() === norm
    );
  }

  /**
   * Marks attendance with strict Single-Email and Single-Subject Session rules,
   * then immediately dispatches an automated Gmail confirmation message!
   */
  markAttendance(record: Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt'>): AttendanceRecord {
    const attendance = this.getAllAttendance();
    const student = this.getStudentById(record.studentId);
    const lecture = this.getLectureById(record.lectureId);
    const settings = this.getCollegeSettings();

    const normalizedEmail = (record.studentEmail || student?.email || '').trim().toLowerCase();
    if (!normalizedEmail) {
      throw new Error('Valid student email ID is required to mark attendance.');
    }

    // 1. Strict Single-Attendance Rule:
    // Only 1 email ID can mark attendance for this subject lecture
    const existing = attendance.find(a => 
      a.lectureId === record.lectureId && (
        a.studentId === record.studentId || 
        (a.studentEmail && a.studentEmail.trim().toLowerCase() === normalizedEmail)
      )
    );

    if (existing) {
      throw new Error(
        `Attendance already active: Email ID "${normalizedEmail}" has already recorded attendance for this subject lecture (Recorded at ${existing.markedTimeStr}). Only 1 attendance per Email ID per subject session is allowed.`
      );
    }

    const newRecordId = `att_${record.studentId}_${record.lectureId}_${Date.now()}`;
    const newRecord: AttendanceRecord = {
      ...record,
      id: newRecordId,
      studentEmail: normalizedEmail,
      verificationMethod: record.verificationMethod || 'QR_100M_GEOFENCE',
      qrVerified: record.qrVerified !== undefined ? record.qrVerified : true,
      facultyDistanceMeters: record.facultyDistanceMeters !== undefined ? record.facultyDistanceMeters : record.distanceMeters,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // 2. Automatically generate and dispatch Gmail notification message
    if (student && lecture) {
      try {
        const notif = notificationService.sendAttendanceGmailNotification(
          { ...student, email: normalizedEmail },
          lecture,
          newRecord,
          settings
        );
        newRecord.gmailNotificationSent = true;
        newRecord.gmailNotificationId = notif.id;
      } catch (e) {
        console.warn('Gmail notification dispatch notice:', e);
      }
    }

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

  deleteAttendanceRecord(attendanceId: string) {
    let attendance = this.getAllAttendance();
    attendance = attendance.filter(a => a.id !== attendanceId);
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));
  }

  clearAttendanceRecords() {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify([]));
  }
}

export const db = new DatabaseService();
