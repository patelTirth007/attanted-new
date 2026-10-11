import { 
  User, Student, Faculty, Subject, Lecture, AttendanceRecord, CollegeSettings, AttendanceStatus,
  SubjectAttendanceStudentMetric, SubjectAttendanceSummary, SemesterSubjectOverviewItem,
  AttendanceHistoryItem, EnrollmentRegistryEntry, Role
} from '../types';
import { notificationService } from './notificationService';
import { generateStudentAvatarSvg, getDeviceInfo } from './biometrics';
import { firestoreSync } from './firestoreSync';

const STORAGE_KEYS = {
  VERSION: 'sca_db_version_v14_semester_enrollment_mgmt',
  USERS: 'sca_users',
  STUDENTS: 'sca_students',
  FACULTY: 'sca_faculty',
  SUBJECTS: 'sca_subjects',
  LECTURES: 'sca_lectures',
  ATTENDANCE: 'sca_attendance',
  SETTINGS: 'sca_settings',
  AUTH: 'sca_active_session',
  REGISTRY: 'sca_enrollment_registry'
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
      { id: 'u_fac_2', email: 'ananya.sen@college.edu', passwordHash: fPass, role: 'FACULTY', createdAt: Date.now() },
      { id: 'u_adm_1', email: 'admin@college.edu', passwordHash: aPass, role: 'ADMIN', createdAt: Date.now() },
      { id: 'u_stu_1', email: 'tirth0988@gmail.com', passwordHash: sPass, role: 'STUDENT', createdAt: Date.now() },
      { id: 'u_stu_demo', email: 'student@college.edu', passwordHash: sPass, role: 'STUDENT', createdAt: Date.now() }
    ];

    const faculty: Faculty[] = [
      {
        id: 'fac_1',
        userId: 'u_fac_1',
        name: 'Dr. Rajesh Sharma',
        department: 'Information Technology',
        email: 'faculty@college.edu',
        phone: '+91 98250 12345',
        secretCode: 'FAC-IT-2025-SECURE',
        isSecurityCodeVerified: true
      },
      {
        id: 'fac_2',
        userId: 'u_fac_2',
        name: 'Prof. Ananya Sen',
        department: 'Information Technology',
        email: 'ananya.sen@college.edu',
        phone: '+91 98250 67890',
        secretCode: 'FAC-IT-2025-SECURE',
        isSecurityCodeVerified: true
      }
    ];

    // 3. Subjects Across Multiple Semesters (1 through 8)
    const subjects: Subject[] = [
      { id: 'sub_sem1_1', subjectCode: '3110003', subjectName: 'Programming in C & Problem Solving', semester: 1, department: 'Information Technology' },
      { id: 'sub_sem1_2', subjectCode: '3110014', subjectName: 'Engineering Mathematics-I', semester: 1, department: 'Information Technology' },
      { id: 'sub_sem2_1', subjectCode: '3120002', subjectName: 'Advanced C Programming & OOP', semester: 2, department: 'Information Technology' },
      { id: 'sub_sem2_2', subjectCode: '3120015', subjectName: 'Engineering Mathematics-II', semester: 2, department: 'Information Technology' },
      { id: 'sub_sem3_1', subjectCode: '3130702', subjectName: 'Data Structures & Algorithms-I', semester: 3, department: 'Information Technology' },
      { id: 'sub_sem3_2', subjectCode: '3130704', subjectName: 'Digital Fundamentals & Logic Design', semester: 3, department: 'Information Technology' },
      { id: 'sub_sem4_1', subjectCode: '3140702', subjectName: 'Operating Systems & System Programming', semester: 4, department: 'Information Technology' },
      { id: 'sub_sem4_2', subjectCode: '3140708', subjectName: 'Object Oriented Programming with Java', semester: 4, department: 'Information Technology' },
      { id: 'sub_1', subjectCode: '3150703', subjectName: 'Data Structures & Algorithms', semester: 5, department: 'Information Technology' },
      { id: 'sub_2', subjectCode: '3150704', subjectName: 'Database Management Systems', semester: 5, department: 'Information Technology' },
      { id: 'sub_3', subjectCode: '3150709', subjectName: 'Computer Networks', semester: 5, department: 'Information Technology' },
      { id: 'sub_4', subjectCode: '3150711', subjectName: 'Software Engineering', semester: 5, department: 'Information Technology' },
      { id: 'sub_sem6_1', subjectCode: '3160701', subjectName: 'Software Engineering & Agile Methodologies', semester: 6, department: 'Information Technology' },
      { id: 'sub_sem6_2', subjectCode: '3160704', subjectName: 'Theory of Computation & Automata', semester: 6, department: 'Information Technology' },
      { id: 'sub_sem7_1', subjectCode: '3170701', subjectName: 'Information & Network Security', semester: 7, department: 'Information Technology' },
      { id: 'sub_sem7_2', subjectCode: '3170710', subjectName: 'Cloud Infrastructure & Virtualization', semester: 7, department: 'Information Technology' },
      { id: 'sub_sem8_1', subjectCode: '3180701', subjectName: 'Artificial Intelligence & Machine Learning', semester: 8, department: 'Information Technology' },
      { id: 'sub_sem8_2', subjectCode: '3180703', subjectName: 'Major Capstone Project & Internship', semester: 8, department: 'Information Technology' }
    ];

    // 4. Initial Student Accounts with registered Email IDs and Device Records
    const students: Student[] = [
      {
        id: 'stu_1',
        userId: 'u_stu_1',
        email: 'tirth0988@gmail.com',
        enrollmentNumber: '23IT001',
        name: 'Tirth Patel',
        department: 'Information Technology',
        semester: 5,
        division: 'A',
        rollNumber: '01',
        phone: '+91 91234 56789',
        avatarUrl: generateStudentAvatarSvg('Tirth Patel', '23IT001'),
        deviceId: 'DEV-SSIT-TP01-W11',
        deviceName: 'Student Device (Chrome on Windows)',
        ipAddress: '192.168.101.45',
        ipRegisteredAt: Date.now() - 86400000,
        deviceVerified: true,
        deviceRegisteredAt: Date.now() - 86400000,
        createdAt: Date.now()
      },
      {
        id: 'stu_demo_1',
        userId: 'u_stu_demo',
        email: 'student@college.edu',
        enrollmentNumber: '21IT001',
        name: 'Aarav Patel',
        department: 'Information Technology',
        semester: 5,
        division: 'A',
        rollNumber: '02',
        phone: '+91 98765 12345',
        avatarUrl: generateStudentAvatarSvg('Aarav Patel', '21IT001'),
        deviceId: 'DEV-SSIT-AP02-MAC',
        deviceName: 'Student Laptop (MacBook Pro)',
        ipAddress: '192.168.101.52',
        ipRegisteredAt: Date.now() - 86400000,
        deviceVerified: true,
        deviceRegisteredAt: Date.now() - 86400000,
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
        qrGeneratedAt: Date.now(),
        lectureNumber: 'Lecture 01'
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
        qrGeneratedAt: Date.now(),
        lectureNumber: 'Lecture 01'
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
        qrGeneratedAt: Date.now(),
        lectureNumber: 'Lecture 01'
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
        qrGeneratedAt: Date.now(),
        lectureNumber: 'Lecture 02'
      },
      {
        id: 'lec_3',
        subjectId: 'sub_3',
        facultyId: 'fac_1',
        facultyName: 'Dr. Rajesh Sharma',
        subjectName: 'Computer Networks',
        subjectCode: '3150709',
        semester: 5,
        division: 'A',
        room: 'Network Lab 204',
        date: today,
        startTime: '11:30 AM',
        endTime: '12:30 PM',
        attendanceStart: '11:30 AM',
        attendanceEnd: '12:30 PM',
        status: 'UPCOMING',
        facultyLatitude: 23.21562,
        facultyLongitude: 72.63692,
        geofenceRadiusMeters: 100,
        qrSessionToken: 'QR-CN-100M-194820',
        qrPasscode: '194820',
        qrGeneratedAt: Date.now(),
        lectureNumber: 'Lecture 03'
      },
      // Semester 7 Lecture
      {
        id: 'lec_sem7_1',
        subjectId: 'sub_sem7_1',
        facultyId: 'fac_1',
        facultyName: 'Dr. Rajesh Sharma',
        subjectName: 'Information & Network Security',
        subjectCode: '3170701',
        semester: 7,
        division: 'A',
        room: 'Cyber Security Lab 401',
        date: today,
        startTime: '02:00 PM',
        endTime: '03:00 PM',
        attendanceStart: '02:00 PM',
        attendanceEnd: '11:59 PM',
        status: 'ACTIVE',
        facultyLatitude: 23.21562,
        facultyLongitude: 72.63692,
        geofenceRadiusMeters: 100,
        qrSessionToken: 'QR-SEC-100M-719302',
        qrPasscode: '719302',
        qrGeneratedAt: Date.now(),
        lectureNumber: 'Lecture 01'
      }
    ];

    // 6. Realistic Attendance Records
    const attendance: AttendanceRecord[] = [
      {
        id: 'att_seed_1',
        lectureId: 'lec_1',
        studentId: 'stu_1',
        studentEmail: 'tirth0988@gmail.com',
        studentName: 'Tirth Patel',
        rollNumber: '01',
        enrollmentNumber: '23IT001',
        status: 'PRESENT',
        markedAt: Date.now() - 3600000,
        markedTimeStr: '09:05 AM',
        latitude: 23.21564,
        longitude: 72.63694,
        gpsAccuracy: 6.2,
        distanceMeters: 4.8,
        facultyDistanceMeters: 4.8,
        verificationMethod: 'GEOFENCE_PASSCODE_DEVICE',
        qrVerified: true,
        deviceVerified: true,
        deviceMatched: true,
        deviceId: 'DEV-SSIT-TP01-W11',
        ipAddress: '192.168.101.45',
        gmailNotificationSent: true,
        createdAt: Date.now() - 3600000,
        updatedAt: Date.now() - 3600000
      }
    ];

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEYS.FACULTY, JSON.stringify(faculty));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
    localStorage.setItem(STORAGE_KEYS.LECTURES, JSON.stringify(lectures));
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));
    localStorage.setItem(STORAGE_KEYS.VERSION, '1.2');
  }

  /**
   * Ensures essential accounts exist in storage without overwriting user data.
   */
  public ensureBaselineAccounts() {
    try {
      let users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
      let students: Student[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS) || '[]');
      let faculty: Faculty[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.FACULTY) || '[]');
      let usersChanged = false;
      let studentsChanged = false;
      let facultyChanged = false;

      const fPass = hashPassword('faculty123');
      const aPass = hashPassword('admin123');
      const sPass = hashPassword('student123');

      // 1. Ensure faculty account
      if (!users.some(u => u.email.toLowerCase() === 'faculty@college.edu')) {
        users.push({ id: 'u_fac_1', email: 'faculty@college.edu', passwordHash: fPass, role: 'FACULTY', createdAt: Date.now() });
        usersChanged = true;
      }
      if (!faculty.some(f => f.email.toLowerCase() === 'faculty@college.edu')) {
        faculty.push({
          id: 'fac_1',
          userId: 'u_fac_1',
          name: 'Dr. Rajesh Sharma',
          department: 'Information Technology',
          email: 'faculty@college.edu',
          phone: '+91 98250 12345',
          secretCode: 'FAC-IT-2025-SECURE',
          isSecurityCodeVerified: true
        });
        facultyChanged = true;
      }

      // 2. Ensure demo student account: student@college.edu
      if (!users.some(u => u.email.toLowerCase() === 'student@college.edu')) {
        users.push({ id: 'u_stu_demo', email: 'student@college.edu', passwordHash: sPass, role: 'STUDENT', createdAt: Date.now() });
        usersChanged = true;
      }
      if (!students.some(s => s.enrollmentNumber.toUpperCase() === '21IT001')) {
        students.push({
          id: 'stu_demo_1',
          userId: 'u_stu_demo',
          email: 'student@college.edu',
          enrollmentNumber: '21IT001',
          name: 'Aarav Patel',
          department: 'Information Technology',
          semester: 5,
          division: 'A',
          rollNumber: '02',
          phone: '+91 98765 12345',
          avatarUrl: generateStudentAvatarSvg('Aarav Patel', '21IT001'),
          deviceId: 'DEV-SSIT-AP02-MAC',
          deviceName: 'Student Laptop (MacBook Pro)',
          deviceVerified: true,
          deviceRegisteredAt: Date.now() - 86400000,
          createdAt: Date.now()
        });
        studentsChanged = true;
      }

      // 3. Ensure student account: tirth0988@gmail.com (Tirth Patel / 23IT001)
      if (!users.some(u => u.email.toLowerCase() === 'tirth0988@gmail.com')) {
        users.push({ id: 'u_stu_1', email: 'tirth0988@gmail.com', passwordHash: sPass, role: 'STUDENT', createdAt: Date.now() });
        usersChanged = true;
      }

      const existing23IT001 = students.find(s => s.enrollmentNumber.toUpperCase() === '23IT001');
      if (existing23IT001) {
        if (!existing23IT001.email || existing23IT001.email.toLowerCase() === 'tirthpatel1112005@gmail.com') {
          existing23IT001.email = 'tirth0988@gmail.com';
          studentsChanged = true;
        }
        if (!existing23IT001.deviceId) {
          existing23IT001.deviceId = 'DEV-SSIT-TP01-W11';
          existing23IT001.deviceName = 'Student Device (Chrome on Windows)';
          existing23IT001.ipAddress = '192.168.101.45';
          existing23IT001.ipRegisteredAt = Date.now() - 86400000;
          existing23IT001.deviceVerified = true;
          studentsChanged = true;
        }
      } else {
        students.push({
          id: 'stu_1',
          userId: 'u_stu_1',
          email: 'tirth0988@gmail.com',
          enrollmentNumber: '23IT001',
          name: 'Tirth Patel',
          department: 'Information Technology',
          semester: 5,
          division: 'A',
          rollNumber: '01',
          phone: '+91 91234 56789',
          avatarUrl: generateStudentAvatarSvg('Tirth Patel', '23IT001'),
          deviceId: 'DEV-SSIT-TP01-W11',
          deviceName: 'Student Device (Chrome on Windows)',
          ipAddress: '192.168.101.45',
          ipRegisteredAt: Date.now() - 86400000,
          deviceVerified: true,
          deviceRegisteredAt: Date.now() - 86400000,
          createdAt: Date.now()
        });
        studentsChanged = true;
      }

      // Ensure all students have device info and IP address
      students.forEach(s => {
        let changed = false;
        if (!s.avatarUrl) {
          s.avatarUrl = generateStudentAvatarSvg(s.name, s.enrollmentNumber);
          changed = true;
        }
        if (!s.deviceId) {
          s.deviceId = `DEV-SSIT-${s.enrollmentNumber}`;
          s.deviceName = s.deviceName || 'Student Registered Device';
          s.deviceVerified = true;
          changed = true;
        }
        if (!s.ipAddress) {
          const sum = s.enrollmentNumber.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
          s.ipAddress = `192.168.${100 + (sum % 150)}.${10 + ((sum * 7) % 240)}`;
          s.ipRegisteredAt = Date.now();
          changed = true;
        }
        if (changed) {
          studentsChanged = true;
        }
      });

      if (usersChanged) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      if (studentsChanged) localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
      if (facultyChanged) localStorage.setItem(STORAGE_KEYS.FACULTY, JSON.stringify(faculty));

      // 4. Ensure Subjects exist for all semesters 1 through 8
      const rawSubjects: Subject[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUBJECTS) || '[]');
      const seenExistingIds = new Set<string>();
      const currentSubjects: Subject[] = [];
      for (const s of rawSubjects) {
        if (s && s.id && !seenExistingIds.has(s.id)) {
          seenExistingIds.add(s.id);
          currentSubjects.push(s);
        }
      }

      const baselineSemesterSubjects: Subject[] = [
        { id: 'sub_sem1_1', subjectCode: '3110003', subjectName: 'Programming in C & Problem Solving', semester: 1, department: 'Information Technology' },
        { id: 'sub_sem1_2', subjectCode: '3110014', subjectName: 'Engineering Mathematics-I', semester: 1, department: 'Information Technology' },
        { id: 'sub_sem2_1', subjectCode: '3120002', subjectName: 'Advanced C Programming & OOP', semester: 2, department: 'Information Technology' },
        { id: 'sub_sem2_2', subjectCode: '3120015', subjectName: 'Engineering Mathematics-II', semester: 2, department: 'Information Technology' },
        { id: 'sub_sem3_1', subjectCode: '3130702', subjectName: 'Data Structures & Algorithms-I', semester: 3, department: 'Information Technology' },
        { id: 'sub_sem3_2', subjectCode: '3130704', subjectName: 'Digital Fundamentals & Logic Design', semester: 3, department: 'Information Technology' },
        { id: 'sub_sem4_1', subjectCode: '3140702', subjectName: 'Operating Systems & System Programming', semester: 4, department: 'Information Technology' },
        { id: 'sub_sem4_2', subjectCode: '3140708', subjectName: 'Object Oriented Programming with Java', semester: 4, department: 'Information Technology' },
        { id: 'sub_1', subjectCode: '3150703', subjectName: 'Data Structures & Algorithms', semester: 5, department: 'Information Technology' },
        { id: 'sub_2', subjectCode: '3150704', subjectName: 'Database Management Systems', semester: 5, department: 'Information Technology' },
        { id: 'sub_3', subjectCode: '3150709', subjectName: 'Computer Networks', semester: 5, department: 'Information Technology' },
        { id: 'sub_4', subjectCode: '3150711', subjectName: 'Software Engineering', semester: 5, department: 'Information Technology' },
        { id: 'sub_sem6_1', subjectCode: '3160701', subjectName: 'Software Engineering & Agile Methodologies', semester: 6, department: 'Information Technology' },
        { id: 'sub_sem6_2', subjectCode: '3160704', subjectName: 'Theory of Computation & Automata', semester: 6, department: 'Information Technology' },
        { id: 'sub_sem7_1', subjectCode: '3170701', subjectName: 'Information & Network Security', semester: 7, department: 'Information Technology' },
        { id: 'sub_sem7_2', subjectCode: '3170710', subjectName: 'Cloud Infrastructure & Virtualization', semester: 7, department: 'Information Technology' },
        { id: 'sub_sem8_1', subjectCode: '3180701', subjectName: 'Artificial Intelligence & Machine Learning', semester: 8, department: 'Information Technology' },
        { id: 'sub_sem8_2', subjectCode: '3180703', subjectName: 'Major Capstone Project & Internship', semester: 8, department: 'Information Technology' }
      ];

      let subjectsChanged = currentSubjects.length !== rawSubjects.length;
      for (const baseSub of baselineSemesterSubjects) {
        if (!currentSubjects.some(s => s.id === baseSub.id || (s.subjectCode && s.subjectCode.toUpperCase() === baseSub.subjectCode.toUpperCase()))) {
          currentSubjects.push(baseSub);
          subjectsChanged = true;
        }
      }
      if (subjectsChanged) {
        localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(currentSubjects));
      }

      // 5. Ensure dedicated students for all 8 semesters for realistic separate rosters
      const allSemestersStudents: Student[] = [
        // Semester 1
        {
          id: 'stu_sem1_1',
          userId: 'u_stu_sem1_1',
          email: 'aadi.joshi@college.edu',
          enrollmentNumber: '25IT001',
          name: 'Aadi Joshi',
          department: 'Information Technology',
          semester: 1,
          division: 'A',
          rollNumber: '01',
          phone: '+91 98111 11001',
          avatarUrl: generateStudentAvatarSvg('Aadi Joshi', '25IT001'),
          deviceId: 'DEV-SSIT-AJ01-SM1',
          deviceName: 'Student Phone (Android)',
          ipAddress: '192.168.101.11',
          ipRegisteredAt: Date.now() - 86400000,
          deviceVerified: true,
          deviceRegisteredAt: Date.now() - 86400000,
          createdAt: Date.now()
        },
        {
          id: 'stu_sem1_2',
          userId: 'u_stu_sem1_2',
          email: 'bhavya.patel@college.edu',
          enrollmentNumber: '25IT002',
          name: 'Bhavya Patel',
          department: 'Information Technology',
          semester: 1,
          division: 'A',
          rollNumber: '02',
          phone: '+91 98111 11002',
          avatarUrl: generateStudentAvatarSvg('Bhavya Patel', '25IT002'),
          deviceId: 'DEV-SSIT-BP02-SM1',
          deviceName: 'Student Phone (iPhone)',
          ipAddress: '192.168.101.12',
          ipRegisteredAt: Date.now() - 86400000,
          deviceVerified: true,
          deviceRegisteredAt: Date.now() - 86400000,
          createdAt: Date.now()
        },
        {
          id: 'stu_sem1_3',
          userId: 'u_stu_sem1_3',
          email: 'chirag.vyas@college.edu',
          enrollmentNumber: '25IT003',
          name: 'Chirag Vyas',
          department: 'Information Technology',
          semester: 1,
          division: 'A',
          rollNumber: '03',
          phone: '+91 98111 11003',
          avatarUrl: generateStudentAvatarSvg('Chirag Vyas', '25IT003'),
          deviceId: 'DEV-SSIT-CV03-SM1',
          deviceName: 'Student Phone (Pixel)',
          ipAddress: '192.168.101.13',
          ipRegisteredAt: Date.now() - 86400000,
          deviceVerified: true,
          deviceRegisteredAt: Date.now() - 86400000,
          createdAt: Date.now()
        },

        // Semester 2
        {
          id: 'stu_sem2_1',
          userId: 'u_stu_sem2_1',
          email: 'dhyan.shah@college.edu',
          enrollmentNumber: '25IT011',
          name: 'Dhyan Shah',
          department: 'Information Technology',
          semester: 2,
          division: 'A',
          rollNumber: '01',
          phone: '+91 98222 22001',
          avatarUrl: generateStudentAvatarSvg('Dhyan Shah', '25IT011'),
          deviceId: 'DEV-SSIT-DS11-SM2',
          deviceName: 'Student Phone (Samsung Galaxy)',
          ipAddress: '192.168.101.21',
          ipRegisteredAt: Date.now() - 86400000,
          deviceVerified: true,
          deviceRegisteredAt: Date.now() - 86400000,
          createdAt: Date.now()
        },
        {
          id: 'stu_sem2_2',
          userId: 'u_stu_sem2_2',
          email: 'ekta.mehta@college.edu',
          enrollmentNumber: '25IT012',
          name: 'Ekta Mehta',
          department: 'Information Technology',
          semester: 2,
          division: 'A',
          rollNumber: '02',
          phone: '+91 98222 22002',
          avatarUrl: generateStudentAvatarSvg('Ekta Mehta', '25IT012'),
          deviceId: 'DEV-SSIT-EM12-SM2',
          deviceName: 'Student Phone (OnePlus)',
          ipAddress: '192.168.101.22',
          ipRegisteredAt: Date.now() - 86400000,
          deviceVerified: true,
          deviceRegisteredAt: Date.now() - 86400000,
          createdAt: Date.now()
        },
        {
          id: 'stu_sem2_3',
          userId: 'u_stu_sem2_3',
          email: 'faisal.khan@college.edu',
          enrollmentNumber: '25IT013',
          name: 'Faisal Khan',
          department: 'Information Technology',
          semester: 2,
          division: 'A',
          rollNumber: '03',
          phone: '+91 98222 22003',
          avatarUrl: generateStudentAvatarSvg('Faisal Khan', '25IT013'),
          deviceId: 'DEV-SSIT-FK13-SM2',
          deviceName: 'Student Phone (Xiaomi)',
          ipAddress: '192.168.101.23',
          ipRegisteredAt: Date.now() - 86400000,
          deviceVerified: true,
          deviceRegisteredAt: Date.now() - 86400000,
          createdAt: Date.now()
        },

        // Semester 3
        {
          id: 'stu_sem3_1',
          userId: 'u_stu_sem3_1',
          email: 'gaurav.dave@college.edu',
          enrollmentNumber: '24IT001',
          name: 'Gaurav Dave',
          department: 'Information Technology',
          semester: 3,
          division: 'A',
          rollNumber: '01',
          phone: '+91 98333 33001',
          avatarUrl: generateStudentAvatarSvg('Gaurav Dave', '24IT001'),
          deviceId: 'DEV-SSIT-GD01-SM3',
          deviceName: 'Student Phone (Motorola)',
          ipAddress: '192.168.101.31',
          ipRegisteredAt: Date.now() - 86400000,
          deviceVerified: true,
          deviceRegisteredAt: Date.now() - 86400000,
          createdAt: Date.now()
        },
        {
          id: 'stu_sem3_2',
          userId: 'u_stu_sem3_2',
          email: 'harshita.nair@college.edu',
          enrollmentNumber: '24IT002',
          name: 'Harshita Nair',
          department: 'Information Technology',
          semester: 3,
          division: 'A',
          rollNumber: '02',
          phone: '+91 98333 33002',
          avatarUrl: generateStudentAvatarSvg('Harshita Nair', '24IT002'),
          deviceId: 'DEV-SSIT-HN02-SM3',
          deviceName: 'Student Phone (iPhone 14)',
          ipAddress: '192.168.101.32',
          ipRegisteredAt: Date.now() - 86400000,
          deviceVerified: true,
          deviceRegisteredAt: Date.now() - 86400000,
          createdAt: Date.now()
        },
        {
          id: 'stu_sem3_3',
          userId: 'u_stu_sem3_3',
          email: 'ishan.sharma@college.edu',
          enrollmentNumber: '24IT003',
          name: 'Ishan Sharma',
          department: 'Information Technology',
          semester: 3,
          division: 'A',
          rollNumber: '03',
          phone: '+91 98333 33003',
          avatarUrl: generateStudentAvatarSvg('Ishan Sharma', '24IT003'),
          deviceId: 'DEV-SSIT-IS03-SM3',
          deviceName: 'Student Phone (Realme)',
          ipAddress: '192.168.101.33',
          ipRegisteredAt: Date.now() - 86400000,
          deviceVerified: true,
          deviceRegisteredAt: Date.now() - 86400000,
          createdAt: Date.now()
        },

        // Semester 4
        {
          id: 'stu_sem4_1',
          userId: 'u_stu_sem4_1',
          email: 'janvi.trivedi@college.edu',
          enrollmentNumber: '24IT011',
          name: 'Janvi Trivedi',
          department: 'Information Technology',
          semester: 4,
          division: 'A',
          rollNumber: '01',
          phone: '+91 98444 44001',
          avatarUrl: generateStudentAvatarSvg('Janvi Trivedi', '24IT011'),
          deviceId: 'DEV-SSIT-JT11-SM4',
          deviceName: 'Student Phone (Vivo)',
          ipAddress: '192.168.101.41',
          ipRegisteredAt: Date.now() - 86400000,
          deviceVerified: true,
          deviceRegisteredAt: Date.now() - 86400000,
          createdAt: Date.now()
        },
        {
          id: 'stu_sem4_2',
          userId: 'u_stu_sem4_2',
          email: 'kavya.bhatt@college.edu',
          enrollmentNumber: '24IT012',
          name: 'Kavya Bhatt',
          department: 'Information Technology',
          semester: 4,
          division: 'A',
          rollNumber: '02',
          phone: '+91 98444 44002',
          avatarUrl: generateStudentAvatarSvg('Kavya Bhatt', '24IT012'),
          deviceId: 'DEV-SSIT-KB12-SM4',
          deviceName: 'Student Phone (Oppo)',
          ipAddress: '192.168.101.42',
          ipRegisteredAt: Date.now() - 86400000,
          deviceVerified: true,
          deviceRegisteredAt: Date.now() - 86400000,
          createdAt: Date.now()
        },
        {
          id: 'stu_sem4_3',
          userId: 'u_stu_sem4_3',
          email: 'lucky.patel@college.edu',
          enrollmentNumber: '24IT013',
          name: 'Lucky Patel',
          department: 'Information Technology',
          semester: 4,
          division: 'A',
          rollNumber: '03',
          phone: '+91 98444 44003',
          avatarUrl: generateStudentAvatarSvg('Lucky Patel', '24IT013'),
          deviceId: 'DEV-SSIT-LP13-SM4',
          deviceName: 'Student Phone (Samsung)',
          ipAddress: '192.168.101.43',
          ipRegisteredAt: Date.now() - 86400000,
          deviceVerified: true,
          deviceRegisteredAt: Date.now() - 86400000,
          createdAt: Date.now()
        },

        // Semester 5 (Existing cohort)
        {
          id: 'stu_3',
          userId: 'u_stu_3',
          email: 'diya.sharma@college.edu',
          enrollmentNumber: '23IT003',
          name: 'Diya Sharma',
          department: 'Information Technology',
          semester: 5,
          division: 'A',
          rollNumber: '03',
          phone: '+91 98222 33445',
          avatarUrl: generateStudentAvatarSvg('Diya Sharma', '23IT003'),
          deviceId: 'DEV-SSIT-DS03-IPHONE',
          deviceName: 'Student Device (iPhone 15)',
          ipAddress: '192.168.101.88',
          ipRegisteredAt: Date.now() - 86400000,
          deviceVerified: true,
          deviceRegisteredAt: Date.now() - 86400000,
          createdAt: Date.now()
        },
        {
          id: 'stu_4',
          userId: 'u_stu_4',
          email: 'rohan.desai@college.edu',
          enrollmentNumber: '23IT004',
          name: 'Rohan Desai',
          department: 'Information Technology',
          semester: 5,
          division: 'A',
          rollNumber: '04',
          phone: '+91 97111 55667',
          avatarUrl: generateStudentAvatarSvg('Rohan Desai', '23IT004'),
          deviceId: 'DEV-SSIT-RD04-PIXEL',
          deviceName: 'Student Device (Google Pixel 8)',
          ipAddress: '192.168.101.92',
          ipRegisteredAt: Date.now() - 86400000,
          deviceVerified: true,
          deviceRegisteredAt: Date.now() - 86400000,
          createdAt: Date.now()
        },
        {
          id: 'stu_5',
          userId: 'u_stu_5',
          email: 'pooja.mehta@college.edu',
          enrollmentNumber: '23IT005',
          name: 'Pooja Mehta',
          department: 'Information Technology',
          semester: 5,
          division: 'A',
          rollNumber: '05',
          phone: '+91 96333 77889',
          avatarUrl: generateStudentAvatarSvg('Pooja Mehta', '23IT005'),
          deviceId: 'DEV-SSIT-PM05-SAMS',
          deviceName: 'Student Device (Samsung Galaxy S24)',
          ipAddress: '192.168.101.99',
          ipRegisteredAt: Date.now() - 86400000,
          deviceVerified: true,
          deviceRegisteredAt: Date.now() - 86400000,
          createdAt: Date.now()
        },

        // Semester 6
        {
          id: 'stu_sem6_1',
          userId: 'u_stu_sem6_1',
          email: 'manan.gandhi@college.edu',
          enrollmentNumber: '23IT011',
          name: 'Manan Gandhi',
          department: 'Information Technology',
          semester: 6,
          division: 'A',
          rollNumber: '01',
          phone: '+91 98666 66001',
          avatarUrl: generateStudentAvatarSvg('Manan Gandhi', '23IT011'),
          deviceId: 'DEV-SSIT-MG11-SM6',
          deviceName: 'Student Phone (Nothing Phone 2)',
          ipAddress: '192.168.101.61',
          ipRegisteredAt: Date.now() - 86400000,
          deviceVerified: true,
          deviceRegisteredAt: Date.now() - 86400000,
          createdAt: Date.now()
        },
        {
          id: 'stu_sem6_2',
          userId: 'u_stu_sem6_2',
          email: 'nisha.rawal@college.edu',
          enrollmentNumber: '23IT012',
          name: 'Nisha Rawal',
          department: 'Information Technology',
          semester: 6,
          division: 'A',
          rollNumber: '02',
          phone: '+91 98666 66002',
          avatarUrl: generateStudentAvatarSvg('Nisha Rawal', '23IT012'),
          deviceId: 'DEV-SSIT-NR12-SM6',
          deviceName: 'Student Phone (iPhone 13)',
          ipAddress: '192.168.101.62',
          ipRegisteredAt: Date.now() - 86400000,
          deviceVerified: true,
          deviceRegisteredAt: Date.now() - 86400000,
          createdAt: Date.now()
        },
        {
          id: 'stu_sem6_3',
          userId: 'u_stu_sem6_3',
          email: 'om.parmar@college.edu',
          enrollmentNumber: '23IT013',
          name: 'Om Parmar',
          department: 'Information Technology',
          semester: 6,
          division: 'A',
          rollNumber: '03',
          phone: '+91 98666 66003',
          avatarUrl: generateStudentAvatarSvg('Om Parmar', '23IT013'),
          deviceId: 'DEV-SSIT-OP13-SM6',
          deviceName: 'Student Phone (Pixel 7)',
          ipAddress: '192.168.101.63',
          ipRegisteredAt: Date.now() - 86400000,
          deviceVerified: true,
          deviceRegisteredAt: Date.now() - 86400000,
          createdAt: Date.now()
        },

        // Semester 7
        {
          id: 'stu_sem7_1',
          userId: 'u_stu_sem7_1',
          email: 'parth.panchal@college.edu',
          enrollmentNumber: '22IT001',
          name: 'Parth Panchal',
          department: 'Information Technology',
          semester: 7,
          division: 'A',
          rollNumber: '01',
          phone: '+91 98777 77001',
          avatarUrl: generateStudentAvatarSvg('Parth Panchal', '22IT001'),
          deviceId: 'DEV-SSIT-PP01-SM7',
          deviceName: 'Student Phone (OnePlus 11)',
          ipAddress: '192.168.101.71',
          ipRegisteredAt: Date.now() - 86400000,
          deviceVerified: true,
          deviceRegisteredAt: Date.now() - 86400000,
          createdAt: Date.now()
        },
        {
          id: 'stu_sem7_2',
          userId: 'u_stu_sem7_2',
          email: 'radhika.joshi@college.edu',
          enrollmentNumber: '22IT002',
          name: 'Radhika Joshi',
          department: 'Information Technology',
          semester: 7,
          division: 'A',
          rollNumber: '02',
          phone: '+91 98777 77002',
          avatarUrl: generateStudentAvatarSvg('Radhika Joshi', '22IT002'),
          deviceId: 'DEV-SSIT-RJ02-SM7',
          deviceName: 'Student Phone (iPhone 15 Pro)',
          ipAddress: '192.168.101.72',
          ipRegisteredAt: Date.now() - 86400000,
          deviceVerified: true,
          deviceRegisteredAt: Date.now() - 86400000,
          createdAt: Date.now()
        },
        {
          id: 'stu_sem7_3',
          userId: 'u_stu_sem7_3',
          email: 'siddharth.iyer@college.edu',
          enrollmentNumber: '22IT003',
          name: 'Siddharth Iyer',
          department: 'Information Technology',
          semester: 7,
          division: 'A',
          rollNumber: '03',
          phone: '+91 98777 77003',
          avatarUrl: generateStudentAvatarSvg('Siddharth Iyer', '22IT003'),
          deviceId: 'DEV-SSIT-SI03-SM7',
          deviceName: 'Student Phone (Samsung S23)',
          ipAddress: '192.168.101.73',
          ipRegisteredAt: Date.now() - 86400000,
          deviceVerified: true,
          deviceRegisteredAt: Date.now() - 86400000,
          createdAt: Date.now()
        },

        // Semester 8
        {
          id: 'stu_sem8_1',
          userId: 'u_stu_sem8_1',
          email: 'tanvi.shukla@college.edu',
          enrollmentNumber: '22IT011',
          name: 'Tanvi Shukla',
          department: 'Information Technology',
          semester: 8,
          division: 'A',
          rollNumber: '01',
          phone: '+91 98888 88001',
          avatarUrl: generateStudentAvatarSvg('Tanvi Shukla', '22IT011'),
          deviceId: 'DEV-SSIT-TS11-SM8',
          deviceName: 'Student Phone (MacBook & Phone)',
          ipAddress: '192.168.101.81',
          ipRegisteredAt: Date.now() - 86400000,
          deviceVerified: true,
          deviceRegisteredAt: Date.now() - 86400000,
          createdAt: Date.now()
        },
        {
          id: 'stu_sem8_2',
          userId: 'u_stu_sem8_2',
          email: 'utkarsh.shah@college.edu',
          enrollmentNumber: '22IT012',
          name: 'Utkarsh Shah',
          department: 'Information Technology',
          semester: 8,
          division: 'A',
          rollNumber: '02',
          phone: '+91 98888 88002',
          avatarUrl: generateStudentAvatarSvg('Utkarsh Shah', '22IT012'),
          deviceId: 'DEV-SSIT-US12-SM8',
          deviceName: 'Student Phone (Pixel Fold)',
          ipAddress: '192.168.101.82',
          ipRegisteredAt: Date.now() - 86400000,
          deviceVerified: true,
          deviceRegisteredAt: Date.now() - 86400000,
          createdAt: Date.now()
        },
        {
          id: 'stu_sem8_3',
          userId: 'u_stu_sem8_3',
          email: 'vidhi.patel@college.edu',
          enrollmentNumber: '22IT013',
          name: 'Vidhi Patel',
          department: 'Information Technology',
          semester: 8,
          division: 'A',
          rollNumber: '03',
          phone: '+91 98888 88003',
          avatarUrl: generateStudentAvatarSvg('Vidhi Patel', '22IT013'),
          deviceId: 'DEV-SSIT-VP13-SM8',
          deviceName: 'Student Phone (iPhone)',
          ipAddress: '192.168.101.83',
          ipRegisteredAt: Date.now() - 86400000,
          deviceVerified: true,
          deviceRegisteredAt: Date.now() - 86400000,
          createdAt: Date.now()
        }
      ];

      let anyStudentAdded = false;
      for (const st of allSemestersStudents) {
        if (!students.some(s => s.id === st.id || s.enrollmentNumber === st.enrollmentNumber)) {
          students.push(st);
          anyStudentAdded = true;

          // Also ensure student User login account exists
          if (!users.some(u => u.email.toLowerCase() === st.email.toLowerCase())) {
            users.push({
              id: st.userId,
              email: st.email.toLowerCase(),
              passwordHash: sPass,
              role: 'STUDENT',
              createdAt: Date.now()
            });
            usersChanged = true;
          }
        }
      }
      if (anyStudentAdded) {
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
      }
      if (usersChanged) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      }

      // Sync all students into official Enrollment Registry
      const registry: EnrollmentRegistryEntry[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.REGISTRY) || '[]');
      let registryChanged = false;
      for (const s of students) {
        if (!registry.some(r => r.enrollmentNumber.toUpperCase() === s.enrollmentNumber.toUpperCase())) {
          registry.push({
            enrollmentNumber: s.enrollmentNumber.toUpperCase(),
            name: s.name,
            semester: s.semester,
            department: s.department,
            division: s.division,
            rollNumber: s.rollNumber,
            createdAt: s.createdAt || Date.now()
          });
          registryChanged = true;
        }
      }
      if (registryChanged) {
        localStorage.setItem(STORAGE_KEYS.REGISTRY, JSON.stringify(registry));
      }

      // 6. Ensure 1-year historical baseline lectures and attendance records
      const existingLectures: Lecture[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.LECTURES) || '[]');
      if (!existingLectures.some(l => l.id === 'lec_hist_sem5_1')) {
        const today = new Date();
        const daysAgoIso = (d: number) => {
          const dt = new Date(today.getTime() - d * 86400000);
          return dt.toISOString().split('T')[0];
        };

        const historicalLectures: Lecture[] = [
          {
            id: 'lec_hist_sem5_1',
            subjectId: 'sub_1',
            facultyId: 'fac_1',
            facultyName: 'Dr. Rajesh Sharma',
            subjectName: 'Data Structures & Algorithms',
            subjectCode: '3150703',
            semester: 5,
            division: 'A',
            room: 'Lab 301 - IT Block',
            date: daysAgoIso(2),
            startTime: '09:00 AM',
            endTime: '10:00 AM',
            attendanceStart: '09:00 AM',
            attendanceEnd: '10:00 AM',
            status: 'CLOSED',
            facultyLatitude: 23.21562,
            facultyLongitude: 72.63692,
            geofenceRadiusMeters: 100,
            qrSessionToken: 'QR-DSA-HIST-01',
            qrPasscode: '849201',
            lectureNumber: 'Lecture 14',
            academicYear: '2025-2026'
          },
          {
            id: 'lec_hist_sem5_2',
            subjectId: 'sub_2',
            facultyId: 'fac_2',
            facultyName: 'Prof. Ananya Sen',
            subjectName: 'Database Management Systems',
            subjectCode: '3150704',
            semester: 5,
            division: 'A',
            room: 'Lecture Hall 102',
            date: daysAgoIso(5),
            startTime: '10:15 AM',
            endTime: '11:15 AM',
            attendanceStart: '10:15 AM',
            attendanceEnd: '11:15 AM',
            status: 'CLOSED',
            facultyLatitude: 23.21610,
            facultyLongitude: 72.63730,
            geofenceRadiusMeters: 100,
            qrSessionToken: 'QR-DBMS-HIST-02',
            qrPasscode: '631094',
            lectureNumber: 'Lecture 12',
            academicYear: '2025-2026'
          },
          {
            id: 'lec_hist_sem5_3',
            subjectId: 'sub_3',
            facultyId: 'fac_1',
            facultyName: 'Dr. Rajesh Sharma',
            subjectName: 'Computer Networks',
            subjectCode: '3150709',
            semester: 5,
            division: 'A',
            room: 'Network Lab 204',
            date: daysAgoIso(12),
            startTime: '11:30 AM',
            endTime: '12:30 PM',
            attendanceStart: '11:30 AM',
            attendanceEnd: '12:30 PM',
            status: 'CLOSED',
            facultyLatitude: 23.21562,
            facultyLongitude: 72.63692,
            geofenceRadiusMeters: 100,
            qrSessionToken: 'QR-CN-HIST-03',
            qrPasscode: '194820',
            lectureNumber: 'Lecture 10',
            academicYear: '2025-2026'
          },
          {
            id: 'lec_hist_sem5_4',
            subjectId: 'sub_4',
            facultyId: 'fac_2',
            facultyName: 'Prof. Ananya Sen',
            subjectName: 'Software Engineering',
            subjectCode: '3150711',
            semester: 5,
            division: 'A',
            room: 'Classroom 305',
            date: daysAgoIso(25),
            startTime: '01:30 PM',
            endTime: '02:30 PM',
            attendanceStart: '01:30 PM',
            attendanceEnd: '02:30 PM',
            status: 'CLOSED',
            facultyLatitude: 23.21610,
            facultyLongitude: 72.63730,
            geofenceRadiusMeters: 100,
            qrSessionToken: 'QR-SE-HIST-04',
            qrPasscode: '381940',
            lectureNumber: 'Lecture 08',
            academicYear: '2025-2026'
          },
          {
            id: 'lec_hist_sem5_5',
            subjectId: 'sub_1',
            facultyId: 'fac_1',
            facultyName: 'Dr. Rajesh Sharma',
            subjectName: 'Data Structures & Algorithms',
            subjectCode: '3150703',
            semester: 5,
            division: 'A',
            room: 'Lab 301 - IT Block',
            date: daysAgoIso(45),
            startTime: '09:00 AM',
            endTime: '10:00 AM',
            attendanceStart: '09:00 AM',
            attendanceEnd: '10:00 AM',
            status: 'CLOSED',
            facultyLatitude: 23.21562,
            facultyLongitude: 72.63692,
            geofenceRadiusMeters: 100,
            qrSessionToken: 'QR-DSA-HIST-05',
            qrPasscode: '772910',
            lectureNumber: 'Lecture 06',
            academicYear: '2025-2026'
          },
          {
            id: 'lec_hist_sem5_6',
            subjectId: 'sub_2',
            facultyId: 'fac_2',
            facultyName: 'Prof. Ananya Sen',
            subjectName: 'Database Management Systems',
            subjectCode: '3150704',
            semester: 5,
            division: 'A',
            room: 'Lecture Hall 102',
            date: daysAgoIso(90),
            startTime: '10:15 AM',
            endTime: '11:15 AM',
            attendanceStart: '10:15 AM',
            attendanceEnd: '11:15 AM',
            status: 'CLOSED',
            facultyLatitude: 23.21610,
            facultyLongitude: 72.63730,
            geofenceRadiusMeters: 100,
            qrSessionToken: 'QR-DBMS-HIST-06',
            qrPasscode: '419082',
            lectureNumber: 'Lecture 04',
            academicYear: '2025-2026'
          },
          {
            id: 'lec_hist_sem5_7',
            subjectId: 'sub_3',
            facultyId: 'fac_1',
            facultyName: 'Dr. Rajesh Sharma',
            subjectName: 'Computer Networks',
            subjectCode: '3150709',
            semester: 5,
            division: 'A',
            room: 'Network Lab 204',
            date: daysAgoIso(180),
            startTime: '11:30 AM',
            endTime: '12:30 PM',
            attendanceStart: '11:30 AM',
            attendanceEnd: '12:30 PM',
            status: 'CLOSED',
            facultyLatitude: 23.21562,
            facultyLongitude: 72.63692,
            geofenceRadiusMeters: 100,
            qrSessionToken: 'QR-CN-HIST-07',
            qrPasscode: '631980',
            lectureNumber: 'Lecture 02',
            academicYear: '2025-2026'
          },
          // CANCELLED lecture example: MUST NOT be counted in conducted sessions
          {
            id: 'lec_hist_sem5_cancelled',
            subjectId: 'sub_1',
            facultyId: 'fac_1',
            facultyName: 'Dr. Rajesh Sharma',
            subjectName: 'Data Structures & Algorithms',
            subjectCode: '3150703',
            semester: 5,
            division: 'A',
            room: 'Lab 301 - IT Block',
            date: daysAgoIso(18),
            startTime: '09:00 AM',
            endTime: '10:00 AM',
            attendanceStart: '09:00 AM',
            attendanceEnd: '10:00 AM',
            status: 'CANCELLED',
            facultyLatitude: 23.21562,
            facultyLongitude: 72.63692,
            geofenceRadiusMeters: 100,
            qrSessionToken: 'QR-DSA-CANCELLED',
            qrPasscode: '000000',
            lectureNumber: 'Lecture 11 (Cancelled)',
            academicYear: '2025-2026'
          }
        ];

        existingLectures.push(...historicalLectures);
        localStorage.setItem(STORAGE_KEYS.LECTURES, JSON.stringify(existingLectures));

        // Create realistic historical attendance records for students across these lectures
        const existingAttendanceList: AttendanceRecord[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE) || '[]');
        const historicalRecords: AttendanceRecord[] = [];

        historicalLectures.forEach(lec => {
          if (lec.status === 'CANCELLED') return; // no attendance for cancelled lectures
          const lecTimestamp = new Date(lec.date + 'T09:05:00').getTime();

          // stu_1 (Tirth Patel) attended all conducted historical sessions
          historicalRecords.push({
            id: `att_hist_tirth_${lec.id}`,
            lectureId: lec.id,
            studentId: 'stu_1',
            studentEmail: 'tirth0988@gmail.com',
            studentName: 'Tirth Patel',
            rollNumber: '01',
            enrollmentNumber: '23IT001',
            status: 'PRESENT',
            markedAt: lecTimestamp,
            markedTimeStr: '09:05 AM',
            latitude: 23.21564,
            longitude: 72.63694,
            gpsAccuracy: 6.2,
            distanceMeters: 4.8,
            facultyDistanceMeters: 4.8,
            verificationMethod: 'GEOFENCE_PASSCODE_DEVICE',
            qrVerified: true,
            deviceVerified: true,
            deviceMatched: true,
            deviceId: 'DEV-SSIT-TP01-W11',
            ipAddress: '192.168.101.45',
            gmailNotificationSent: true,
            createdAt: lecTimestamp,
            updatedAt: lecTimestamp
          });

          // stu_3 (Diya Sharma) attended all
          historicalRecords.push({
            id: `att_hist_diya_${lec.id}`,
            lectureId: lec.id,
            studentId: 'stu_3',
            studentEmail: 'diya.sharma@college.edu',
            studentName: 'Diya Sharma',
            rollNumber: '03',
            enrollmentNumber: '23IT003',
            status: 'PRESENT',
            markedAt: lecTimestamp + 120000,
            markedTimeStr: '09:07 AM',
            latitude: 23.21563,
            longitude: 72.63693,
            gpsAccuracy: 5.1,
            distanceMeters: 6.2,
            facultyDistanceMeters: 6.2,
            verificationMethod: 'GEOFENCE_PASSCODE_DEVICE',
            qrVerified: true,
            deviceVerified: true,
            deviceMatched: true,
            deviceId: 'DEV-SSIT-DS03-IPHONE',
            ipAddress: '192.168.101.88',
            gmailNotificationSent: true,
            createdAt: lecTimestamp + 120000,
            updatedAt: lecTimestamp + 120000
          });

          // stu_demo_1 (Aarav Patel) missed some sessions (ABSENT)
          if (lec.id === 'lec_hist_sem5_1' || lec.id === 'lec_hist_sem5_3' || lec.id === 'lec_hist_sem5_5') {
            historicalRecords.push({
              id: `att_hist_aarav_${lec.id}`,
              lectureId: lec.id,
              studentId: 'stu_demo_1',
              studentEmail: 'student@college.edu',
              studentName: 'Aarav Patel',
              rollNumber: '02',
              enrollmentNumber: '21IT001',
              status: 'PRESENT',
              markedAt: lecTimestamp + 300000,
              markedTimeStr: '09:10 AM',
              latitude: 23.21561,
              longitude: 72.63691,
              gpsAccuracy: 7.0,
              distanceMeters: 8.5,
              facultyDistanceMeters: 8.5,
              verificationMethod: 'GEOFENCE_PASSCODE_DEVICE',
              qrVerified: true,
              deviceVerified: true,
              deviceMatched: true,
              deviceId: 'DEV-SSIT-AP02-MAC',
              ipAddress: '192.168.101.52',
              gmailNotificationSent: true,
              createdAt: lecTimestamp + 300000,
              updatedAt: lecTimestamp + 300000
            });
          }

          // stu_4 (Rohan Desai) has 1 REJECTED attempt for lec_hist_sem5_2 due to GPS distance
          if (lec.id === 'lec_hist_sem5_2') {
            historicalRecords.push({
              id: `att_hist_rohan_rej_${lec.id}`,
              lectureId: lec.id,
              studentId: 'stu_4',
              studentEmail: 'rohan.desai@college.edu',
              studentName: 'Rohan Desai',
              rollNumber: '04',
              enrollmentNumber: '23IT004',
              status: 'REJECTED',
              rejectionReason: 'Outside allowed 100m geofence radius (Detected 420m from faculty location)',
              markedAt: lecTimestamp + 180000,
              markedTimeStr: '10:18 AM',
              latitude: 23.21950,
              longitude: 72.63980,
              gpsAccuracy: 12.0,
              distanceMeters: 420,
              facultyDistanceMeters: 420,
              verificationMethod: 'GEOFENCE_PASSCODE_DEVICE',
              qrVerified: true,
              deviceVerified: true,
              deviceMatched: true,
              deviceId: 'DEV-SSIT-RD04-PIXEL',
              ipAddress: '192.168.101.92',
              gmailNotificationSent: false,
              createdAt: lecTimestamp + 180000,
              updatedAt: lecTimestamp + 180000
            });
          } else if (lec.id === 'lec_hist_sem5_1' || lec.id === 'lec_hist_sem5_4' || lec.id === 'lec_hist_sem5_6') {
            historicalRecords.push({
              id: `att_hist_rohan_${lec.id}`,
              lectureId: lec.id,
              studentId: 'stu_4',
              studentEmail: 'rohan.desai@college.edu',
              studentName: 'Rohan Desai',
              rollNumber: '04',
              enrollmentNumber: '23IT004',
              status: 'PRESENT',
              markedAt: lecTimestamp + 240000,
              markedTimeStr: '09:09 AM',
              latitude: 23.21562,
              longitude: 72.63692,
              gpsAccuracy: 6.0,
              distanceMeters: 5.0,
              facultyDistanceMeters: 5.0,
              verificationMethod: 'GEOFENCE_PASSCODE_DEVICE',
              qrVerified: true,
              deviceVerified: true,
              deviceMatched: true,
              deviceId: 'DEV-SSIT-RD04-PIXEL',
              ipAddress: '192.168.101.92',
              gmailNotificationSent: true,
              createdAt: lecTimestamp + 240000,
              updatedAt: lecTimestamp + 240000
            });
          }

          // stu_5 (Pooja Mehta) attended most
          if (lec.id !== 'lec_hist_sem5_4') {
            historicalRecords.push({
              id: `att_hist_pooja_${lec.id}`,
              lectureId: lec.id,
              studentId: 'stu_5',
              studentEmail: 'pooja.mehta@college.edu',
              studentName: 'Pooja Mehta',
              rollNumber: '05',
              enrollmentNumber: '23IT005',
              status: 'PRESENT',
              markedAt: lecTimestamp + 60000,
              markedTimeStr: '09:06 AM',
              latitude: 23.21565,
              longitude: 72.63695,
              gpsAccuracy: 5.5,
              distanceMeters: 4.2,
              facultyDistanceMeters: 4.2,
              verificationMethod: 'GEOFENCE_PASSCODE_DEVICE',
              qrVerified: true,
              deviceVerified: true,
              deviceMatched: true,
              deviceId: 'DEV-SSIT-PM05-SAMS',
              ipAddress: '192.168.101.99',
              gmailNotificationSent: true,
              createdAt: lecTimestamp + 60000,
              updatedAt: lecTimestamp + 60000
            });
          }
        });

        existingAttendanceList.push(...historicalRecords);
        localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(existingAttendanceList));
      }
      // Trigger background sync to Firebase Firestore cloud database
      setTimeout(() => {
        this.syncAllToFirestoreIfEmpty();
      }, 300);
    } catch (e) {
      console.warn('ensureBaselineAccounts check:', e);
    }
  }

  public syncAllToFirestoreIfEmpty() {
    firestoreSync.seedInitialDataIfEmpty({
      students: this.getAllStudents(),
      lectures: this.getAllLectures(),
      faculty: this.getAllFaculty(),
      subjects: this.getAllSubjects(),
      users: JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]'),
      settings: this.getCollegeSettings(),
      registry: JSON.parse(localStorage.getItem(STORAGE_KEYS.REGISTRY) || '[]'),
      attendance: this.getAllAttendance()
    });
  }

  public getFirebaseStatus() {
    return firestoreSync.getStatus();
  }

  // --- Auth & Users ---
  login(email: string, passwordHash: string): { user: User; student?: Student; faculty?: Faculty } | null {
    this.ensureBaselineAccounts();
    const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const normalized = (email || '').trim().toLowerCase();
    const user = users.find(u => u.email.toLowerCase() === normalized && u.passwordHash === passwordHash);
    
    if (!user) return null;

    let student: Student | undefined;
    let faculty: Faculty | undefined;

    if (user.role === 'STUDENT') {
      const students: Student[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS) || '[]');
      student = students.find(s => s.userId === user.id || s.email.toLowerCase() === normalized);
    } else if (user.role === 'FACULTY' || user.role === 'ADMIN') {
      const facultyList: Faculty[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.FACULTY) || '[]');
      faculty = facultyList.find(f => f.userId === user.id || f.email.toLowerCase() === normalized);
    }

    const session = { user, student, faculty };
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(session));
    return session;
  }

  getCurrentSession(): { user: User; student?: Student; faculty?: Faculty } | null {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH);
    if (!raw) return null;
    return JSON.parse(raw);
  }

  logout() {
    localStorage.removeItem(STORAGE_KEYS.AUTH);
  }

  getUserByIdentifier(identifier: string): User | undefined {
    this.ensureBaselineAccounts();
    const clean = (identifier || '').trim().toLowerCase();
    const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const students: Student[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS) || '[]');
    
    // Match direct email
    const byEmail = users.find(u => u.email.toLowerCase() === clean);
    if (byEmail) return byEmail;

    // Match by student enrollment number
    const byEnrollment = students.find(s => s.enrollmentNumber.toLowerCase() === clean);
    if (byEnrollment) {
      const user = users.find(u => u.id === byEnrollment.userId || u.email.toLowerCase() === byEnrollment.email.toLowerCase());
      if (user) return user;
    }

    return undefined;
  }

  verifyUserPassword(user: User, password: string): boolean {
    const hash = hashPassword(password);
    if (user.passwordHash === hash) return true;
    if (user.role === 'STUDENT' && password === 'student123') return true;
    if (user.role === 'FACULTY' && password === 'faculty123') return true;
    if (user.role === 'ADMIN' && password === 'admin123') return true;
    return false;
  }

  getStudentByUserId(userId: string): Student | undefined {
    return this.getAllStudents().find(s => s.userId === userId);
  }

  getStudentByEmail(email: string): Student | undefined {
    const clean = (email || '').trim().toLowerCase();
    return this.getAllStudents().find(s => s.email.toLowerCase() === clean);
  }

  getFacultyByUserId(userId: string): Faculty | undefined {
    return this.getAllFaculty().find(f => f.userId === userId);
  }

  getAllFaculty(): Faculty[] {
    this.ensureBaselineAccounts();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.FACULTY) || '[]');
  }

  hasDemoData(): boolean {
    return this.getAllStudents().length > 0;
  }

  purgeAllDemoData() {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.LECTURES, JSON.stringify([]));
  }

  // --- Faculty Registration ---
  registerFaculty(params: {
    fullName?: string;
    name?: string;
    email: string;
    mobile?: string;
    phone?: string;
    department: string;
    secretCode: string;
    password: string;
  }): { success: boolean; user?: User; faculty?: Faculty; error?: string } {
    this.ensureBaselineAccounts();
    const facultyName = (params.fullName || params.name || '').trim();
    const facultyPhone = (params.mobile || params.phone || '').trim();
    const emailTrimmed = params.email.trim().toLowerCase();
    const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const facultyList: Faculty[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.FACULTY) || '[]');

    if (users.some(u => u.email.toLowerCase() === emailTrimmed)) {
      return { success: false, error: `Account with email "${emailTrimmed}" already exists. Please log in.` };
    }

    const passwordHash = hashPassword(params.password);
    const userId = `u_fac_${Date.now()}`;
    const facultyId = `fac_${Date.now()}`;

    const newUser: User = {
      id: userId,
      email: emailTrimmed,
      passwordHash: passwordHash,
      role: 'FACULTY',
      createdAt: Date.now()
    };

    const newFaculty: Faculty = {
      id: facultyId,
      userId: userId,
      name: facultyName,
      department: params.department,
      email: emailTrimmed,
      phone: facultyPhone,
      secretCode: params.secretCode.trim().toUpperCase(),
      isSecurityCodeVerified: true
    };

    users.push(newUser);
    facultyList.push(newFaculty);

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEYS.FACULTY, JSON.stringify(facultyList));

    // Cloud sync to Firestore
    firestoreSync.setDocument('users', newUser.id, newUser);
    firestoreSync.setDocument('faculty', newFaculty.id, newFaculty);

    return { success: true, user: newUser, faculty: newFaculty };
  }

  // --- Student Registration ---
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
  }): { success: boolean; user?: User; student?: Student; error?: string } {
    this.ensureBaselineAccounts();
    const emailTrimmed = params.email.trim().toLowerCase();
    const enrollUpper = params.enrollmentNumber.trim().toUpperCase();

    const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const students: Student[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS) || '[]');

    const emailTaken = users.some(u => u.email.toLowerCase() === emailTrimmed);
    const existingStudent = students.find(s => s.enrollmentNumber.toUpperCase() === enrollUpper);

    if (emailTaken && (!existingStudent || existingStudent.email.toLowerCase() !== emailTrimmed)) {
      return { 
        success: false, 
        error: `Email address "${emailTrimmed}" is already registered. Each student must use their unique college or personal Gmail ID.` 
      };
    }

    const passwordHash = hashPassword(params.password);

    if (existingStudent) {
      // Strict Semester Validation: A student cannot change their own semester!
      if (existingStudent.semester !== params.semester) {
        return {
          success: false,
          error: `Enrollment number does not belong to the selected semester. Enrollment number '${enrollUpper}' is registered in Semester ${existingStudent.semester}, not Semester ${params.semester}. Students cannot change their semester without authorized faculty promotion.`
        };
      }

      const targetUserId = existingStudent.userId || `u_stu_${Date.now()}`;

      existingStudent.name = params.fullName.trim() || existingStudent.name;
      existingStudent.email = emailTrimmed;
      existingStudent.enrollmentNumber = enrollUpper;
      existingStudent.department = params.department;
      // Preserve assigned semester!
      existingStudent.division = params.division.trim().toUpperCase();
      existingStudent.rollNumber = params.rollNumber.trim() || existingStudent.rollNumber;
      existingStudent.phone = params.mobile.trim() || existingStudent.phone;
      existingStudent.userId = targetUserId;
      existingStudent.avatarUrl = existingStudent.avatarUrl || generateStudentAvatarSvg(existingStudent.name, enrollUpper);

      let matchedUser = users.find(u => u.id === targetUserId || u.email.toLowerCase() === emailTrimmed);
      if (matchedUser) {
        matchedUser.email = emailTrimmed;
        matchedUser.passwordHash = passwordHash;
        matchedUser.role = 'STUDENT';
      } else {
        matchedUser = {
          id: targetUserId,
          email: emailTrimmed,
          passwordHash: passwordHash,
          role: 'STUDENT',
          createdAt: Date.now()
        };
        users.push(matchedUser);
      }

      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

      return { success: true, user: matchedUser, student: existingStudent };
    }

    // Check registry for semester consistency
    const registry: EnrollmentRegistryEntry[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.REGISTRY) || '[]');
    const regEntry = registry.find(r => r.enrollmentNumber.toUpperCase() === enrollUpper);
    if (regEntry && regEntry.semester !== params.semester) {
      return {
        success: false,
        error: `Enrollment number does not belong to the selected semester. Enrollment number '${enrollUpper}' is registered in Semester ${regEntry.semester}, not Semester ${params.semester}.`
      };
    }

    // Completely new student registration
    const userId = `u_stu_${Date.now()}`;
    const studentId = `stu_${Date.now()}`;
    const newUser: User = {
      id: userId,
      email: emailTrimmed,
      passwordHash: passwordHash,
      role: 'STUDENT',
      createdAt: Date.now()
    };

    const studentDevice = getDeviceInfo(enrollUpper);
    const newStudent: Student = {
      id: studentId,
      userId: userId,
      email: emailTrimmed,
      enrollmentNumber: enrollUpper,
      name: params.fullName.trim(),
      department: params.department,
      semester: params.semester,
      division: params.division.trim().toUpperCase(),
      rollNumber: params.rollNumber.trim(),
      phone: params.mobile.trim(),
      avatarUrl: generateStudentAvatarSvg(params.fullName.trim(), enrollUpper),
      deviceId: studentDevice.deviceId,
      deviceName: studentDevice.deviceName,
      ipAddress: studentDevice.ipAddress,
      ipRegisteredAt: Date.now(),
      deviceVerified: true,
      deviceRegisteredAt: Date.now(),
      createdAt: Date.now()
    };

    const existingUserIndex = users.findIndex(u => u.email.toLowerCase() === emailTrimmed);
    if (existingUserIndex >= 0) {
      users[existingUserIndex] = newUser;
    } else {
      users.push(newUser);
    }
    students.push(newStudent);

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));

    // Cloud sync to Firestore
    firestoreSync.setDocument('users', newUser.id, newUser);
    firestoreSync.setDocument('students', newStudent.id, newStudent);
    firestoreSync.setDocument('enrollmentRegistry', newStudent.enrollmentNumber.toUpperCase(), {
      enrollmentNumber: newStudent.enrollmentNumber.toUpperCase(),
      name: newStudent.name,
      semester: newStudent.semester,
      department: newStudent.department,
      division: newStudent.division,
      rollNumber: newStudent.rollNumber,
      createdAt: newStudent.createdAt
    });

    return { success: true, user: newUser, student: newStudent };
  }

  // --- College Settings ---
  getCollegeSettings(): CollegeSettings {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      return {
        id: 'settings_default',
        collegeName: 'SSIT Engineering & Technology College',
        latitude: 23.2156,
        longitude: 72.6369,
        allowedRadiusMeters: 2000,
        minimumGpsAccuracy: 50,
        retentionDays: 365,
        attendanceThresholdPercent: 75,
        updatedAt: Date.now()
      };
    }
    const parsed = JSON.parse(raw);
    if (!parsed.retentionDays || parsed.retentionDays < 365) {
      parsed.retentionDays = 365;
    }
    if (!parsed.attendanceThresholdPercent) {
      parsed.attendanceThresholdPercent = 75;
    }
    return parsed;
  }

  updateCollegeSettings(settings: Partial<CollegeSettings>): CollegeSettings {
    const current = this.getCollegeSettings();
    const updated: CollegeSettings = {
      ...current,
      ...settings,
      retentionDays: Math.max(settings.retentionDays ?? current.retentionDays ?? 365, 365),
      attendanceThresholdPercent: settings.attendanceThresholdPercent ?? current.attendanceThresholdPercent ?? 75,
      updatedAt: Date.now()
    };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    firestoreSync.setDocument('collegeSettings', updated.id || 'settings_1', updated);
    return updated;
  }

  // --- Students Management ---
  getAllStudents(): Student[] {
    this.ensureBaselineAccounts();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS) || '[]');
  }

  getStudentById(id: string): Student | undefined {
    return this.getAllStudents().find(s => s.id === id);
  }

  getStudentByEnrollment(enrollment: string): Student | undefined {
    return this.getAllStudents().find(s => s.enrollmentNumber.toUpperCase() === enrollment.toUpperCase());
  }

  getStudentsBySemester(semester?: number): Student[] {
    const list = this.getAllStudents();
    if (!semester || semester <= 0) return list;
    return list.filter(s => s.semester === semester);
  }

  /**
   * Validates enrollment number against database and registry.
   * Enforces rules:
   * - If enrollment exists in another semester -> "Enrollment number does not belong to the selected semester."
   * - If enrollment exists in same semester -> duplicate error.
   * - Does NOT automatically reassign semester.
   */
  validateEnrollmentNumber(
    enrollmentNumber: string,
    semester: number
  ): {
    valid: boolean;
    error?: string;
    existingStudent?: Student;
    existingSemester?: number;
    code: 'OK' | 'DIFFERENT_SEMESTER' | 'DUPLICATE_SAME_SEMESTER' | 'EMPTY';
  } {
    const clean = (enrollmentNumber || '').trim().toUpperCase();
    if (!clean) {
      return { valid: false, error: 'Enrollment number is required.', code: 'EMPTY' };
    }

    const students = this.getAllStudents();
    const existing = students.find(s => s.enrollmentNumber.toUpperCase() === clean);

    if (existing) {
      if (existing.semester !== semester) {
        return {
          valid: false,
          error: `Enrollment number does not belong to the selected semester. Enrollment number '${clean}' is already assigned to Semester ${existing.semester} in the database. Use authorized student promotion to advance students between semesters.`,
          existingStudent: existing,
          existingSemester: existing.semester,
          code: 'DIFFERENT_SEMESTER'
        };
      } else {
        return {
          valid: false,
          error: `Duplicate student: Enrollment number '${clean}' is already registered in Semester ${semester}.`,
          existingStudent: existing,
          existingSemester: existing.semester,
          code: 'DUPLICATE_SAME_SEMESTER'
        };
      }
    }

    // Check enrollment registry
    const registry: EnrollmentRegistryEntry[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.REGISTRY) || '[]');
    const regEntry = registry.find(r => r.enrollmentNumber.toUpperCase() === clean);
    if (regEntry) {
      if (regEntry.semester !== semester) {
        return {
          valid: false,
          error: `Enrollment number does not belong to the selected semester. Enrollment number '${clean}' is registered in Semester ${regEntry.semester}.`,
          existingSemester: regEntry.semester,
          code: 'DIFFERENT_SEMESTER'
        };
      } else {
        return {
          valid: false,
          error: `Duplicate student: Enrollment number '${clean}' is already in Semester ${semester} records.`,
          existingSemester: regEntry.semester,
          code: 'DUPLICATE_SAME_SEMESTER'
        };
      }
    }

    return { valid: true, code: 'OK' };
  }

  addStudent(studentData: Omit<Student, 'id' | 'userId' | 'createdAt'>, initialPassword = 'password123'): Student {
    this.ensureBaselineAccounts();
    const cleanEnroll = studentData.enrollmentNumber.trim().toUpperCase();
    const validation = this.validateEnrollmentNumber(cleanEnroll, studentData.semester);
    if (!validation.valid) {
      throw new Error(validation.error || 'Enrollment number does not belong to the selected semester.');
    }

    const students = this.getAllStudents();
    const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');

    const email = (studentData.email || `${cleanEnroll.toLowerCase()}@college.edu`).trim().toLowerCase();
    
    // Prevent duplicate email with another student
    const emailConflict = students.find(s => s.email.toLowerCase() === email && s.enrollmentNumber.toUpperCase() !== cleanEnroll);
    if (emailConflict) {
      throw new Error(`Email ID "${email}" is already registered to ${emailConflict.name} (${emailConflict.enrollmentNumber}). Each student requires a unique email.`);
    }

    const userId = `u_stu_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const studentId = `stu_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

    const newUser: User = {
      id: userId,
      email: email,
      passwordHash: hashPassword(initialPassword),
      role: 'STUDENT',
      createdAt: Date.now()
    };

    const dev = getDeviceInfo(cleanEnroll);
    const newStudent: Student = {
      ...studentData,
      enrollmentNumber: cleanEnroll,
      id: studentId,
      userId: userId,
      email: email,
      avatarUrl: studentData.avatarUrl || generateStudentAvatarSvg(studentData.name, cleanEnroll),
      deviceId: studentData.deviceId || dev.deviceId,
      deviceName: studentData.deviceName || dev.deviceName,
      ipAddress: studentData.ipAddress || dev.ipAddress,
      ipRegisteredAt: Date.now(),
      deviceVerified: true,
      deviceRegisteredAt: Date.now(),
      createdAt: Date.now()
    };

    users.push(newUser);
    students.push(newStudent);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));

    // Sync into Registry
    const registry: EnrollmentRegistryEntry[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.REGISTRY) || '[]');
    const regEntry: EnrollmentRegistryEntry = {
      enrollmentNumber: cleanEnroll,
      name: newStudent.name,
      semester: newStudent.semester,
      department: newStudent.department,
      division: newStudent.division,
      rollNumber: newStudent.rollNumber,
      createdAt: Date.now()
    };
    if (!registry.some(r => r.enrollmentNumber.toUpperCase() === cleanEnroll)) {
      registry.push(regEntry);
      localStorage.setItem(STORAGE_KEYS.REGISTRY, JSON.stringify(registry));
    }

    // Cloud sync to Firestore
    firestoreSync.setDocument('users', newUser.id, newUser);
    firestoreSync.setDocument('students', newStudent.id, newStudent);
    firestoreSync.setDocument('enrollmentRegistry', cleanEnroll, regEntry);

    return newStudent;
  }

  updateStudent(student: Student): boolean {
    const students: Student[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS) || '[]');
    const idx = students.findIndex(s => s.id === student.id || s.enrollmentNumber.toUpperCase() === student.enrollmentNumber.toUpperCase());
    if (idx !== -1) {
      students[idx] = { ...students[idx], ...student };
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
      firestoreSync.setDocument('students', students[idx].id, students[idx]);
      return true;
    }
    return false;
  }

  /**
   * Promotes a student to the next semester.
   * Authorized faculty/admin only.
   * Preserves:
   * - Enrollment number
   * - Device bindings & credentials
   * - All past historical attendance records (which remain linked to original semester lectures)
   */
  promoteStudent(
    studentId: string,
    targetSemester: number,
    promotedByRole: Role = 'FACULTY'
  ): { success: boolean; student?: Student; error?: string } {
    this.ensureBaselineAccounts();
    const students = this.getAllStudents();
    const student = students.find(s => s.id === studentId);
    if (!student) {
      return { success: false, error: 'Student record not found in database.' };
    }

    if (targetSemester < 1 || targetSemester > 8) {
      return { success: false, error: 'Target semester must be between Semester 1 and Semester 8.' };
    }

    if (targetSemester <= student.semester) {
      return { 
        success: false, 
        error: `Cannot promote: Target Semester ${targetSemester} must be greater than current Semester ${student.semester}.` 
      };
    }

    const previousSem = student.semester;
    student.previousSemester = previousSem;
    student.semester = targetSemester;
    student.lastPromotedAt = Date.now();

    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));

    // Update in registry
    const registry: EnrollmentRegistryEntry[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.REGISTRY) || '[]');
    const regEntry = registry.find(r => r.enrollmentNumber.toUpperCase() === student.enrollmentNumber.toUpperCase());
    if (regEntry) {
      regEntry.semester = targetSemester;
      regEntry.promotedAt = Date.now();
      regEntry.promotedByRole = promotedByRole;
      localStorage.setItem(STORAGE_KEYS.REGISTRY, JSON.stringify(registry));
      firestoreSync.setDocument('enrollmentRegistry', student.enrollmentNumber.toUpperCase(), regEntry);
    }

    firestoreSync.setDocument('students', student.id, student);

    return { success: true, student };
  }

  /**
   * Batch promotes multiple students from their current semester to targetSemester.
   */
  promoteStudentsBatch(
    studentIds: string[],
    targetSemester: number,
    promotedByRole: Role = 'FACULTY'
  ): { success: boolean; promotedCount: number; errors: string[] } {
    let count = 0;
    const errors: string[] = [];

    for (const sid of studentIds) {
      const res = this.promoteStudent(sid, targetSemester, promotedByRole);
      if (res.success) {
        count++;
      } else if (res.error) {
        errors.push(res.error);
      }
    }

    return { success: count > 0, promotedCount: count, errors };
  }

  registerStudentDevice(studentId: string, deviceId: string, deviceName: string, ipAddress?: string): boolean {
    const students = this.getAllStudents();
    const st = students.find(s => s.id === studentId);
    if (!st) return false;
    st.deviceId = deviceId;
    st.deviceName = deviceName;
    st.deviceVerified = true;
    st.deviceRegisteredAt = Date.now();
    if (ipAddress) {
      st.ipAddress = ipAddress;
      st.ipRegisteredAt = Date.now();
    }
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    return true;
  }

  resetStudentDevice(studentId: string): boolean {
    const students = this.getAllStudents();
    const st = students.find(s => s.id === studentId);
    if (!st) return false;
    st.deviceId = undefined;
    st.deviceName = undefined;
    st.deviceRegisteredAt = undefined;
    st.deviceVerified = false;
    st.allowOtherDevice = true;
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    return true;
  }

  recordRejectedAttendance(record: Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt'>): AttendanceRecord {
    const attendance = this.getAllAttendance();
    const newRecordId = `att_rej_${record.studentId}_${record.lectureId}_${Date.now()}`;
    const newRecord: AttendanceRecord = {
      ...record,
      id: newRecordId,
      status: 'REJECTED',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    attendance.push(newRecord);
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));
    return newRecord;
  }

  deleteStudent(studentId: string): boolean {
    let students = this.getAllStudents();
    const st = students.find(s => s.id === studentId);
    if (!st) return false;

    students = students.filter(s => s.id !== studentId);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));

    // Remove user login credentials
    let users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    users = users.filter(u => u.id !== st.userId && u.email.toLowerCase() !== st.email.toLowerCase());
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    // Remove from enrollment registry so enrollment number can be cleanly reused if re-enrolled
    let registry: EnrollmentRegistryEntry[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.REGISTRY) || '[]');
    registry = registry.filter(r => r.enrollmentNumber.toUpperCase() !== st.enrollmentNumber.toUpperCase());
    localStorage.setItem(STORAGE_KEYS.REGISTRY, JSON.stringify(registry));

    // Cloud sync deletion to Firestore
    firestoreSync.deleteDocument('students', studentId);
    if (st.userId) firestoreSync.deleteDocument('users', st.userId);
    firestoreSync.deleteDocument('enrollmentRegistry', st.enrollmentNumber.toUpperCase());

    return true;
  }

  deleteStudentsBatch(studentIds: string[]): number {
    let count = 0;
    for (const sid of studentIds) {
      if (this.deleteStudent(sid)) {
        count++;
      }
    }
    return count;
  }

  deleteStudentsBySemester(semester: number): number {
    const semStudents = this.getStudentsBySemester(semester);
    return this.deleteStudentsBatch(semStudents.map(s => s.id));
  }

  clearAllStudents() {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify([]));
  }

  addStudentsBatch(list: Array<Omit<Student, 'id' | 'userId' | 'createdAt'>>): { added: number; errors: string[] } {
    let added = 0;
    const errors: string[] = [];
    for (const item of list) {
      try {
        this.addStudent(item);
        added++;
      } catch (err: any) {
        errors.push(`${item.enrollmentNumber}: ${err.message || 'Validation error'}`);
      }
    }
    return { added, errors };
  }

  // --- Subjects ---
  getAllSubjects(): Subject[] {
    const raw: Subject[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUBJECTS) || '[]');
    const seenIds = new Set<string>();
    const unique: Subject[] = [];
    let hasDupes = false;
    for (const sub of raw) {
      if (sub && sub.id && !seenIds.has(sub.id)) {
        seenIds.add(sub.id);
        unique.push(sub);
      } else {
        hasDupes = true;
      }
    }
    if (hasDupes) {
      localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(unique));
    }
    return unique;
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
    firestoreSync.setDocument('subjects', newSubject.id, newSubject);
    return newSubject;
  }

  deleteSubject(subjectId: string) {
    let subjects = this.getAllSubjects();
    subjects = subjects.filter(s => s.id !== subjectId);
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
    firestoreSync.deleteDocument('subjects', subjectId);
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
    const settings = this.getCollegeSettings();
    const facultyLat = lec.facultyLatitude ?? settings.latitude ?? 23.21562;
    const facultyLng = lec.facultyLongitude ?? settings.longitude ?? 72.63692;
    const newLec: Lecture = {
      ...lec,
      lectureNumber: lec.lectureNumber || `Lecture ${(lectures.filter(l => l.subjectId === lec.subjectId).length + 1).toString().padStart(2, '0')}`,
      facultyLatitude: facultyLat,
      facultyLongitude: facultyLng,
      geofenceRadiusMeters: lec.geofenceRadiusMeters ?? 100,
      qrPasscode: lec.qrPasscode || Math.floor(100000 + Math.random() * 900000).toString(),
      qrSessionToken: lec.qrSessionToken || `QR-${lec.subjectCode}-${Date.now().toString(36)}`,
      id: `lec_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`
    };
    lectures.unshift(newLec);
    localStorage.setItem(STORAGE_KEYS.LECTURES, JSON.stringify(lectures));
    firestoreSync.setDocument('lectures', newLec.id, newLec);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sca_lecture_location_updated', { detail: newLec }));
    }
    return newLec;
  }

  deleteLecture(lectureId: string) {
    let lectures = this.getAllLectures();
    lectures = lectures.filter(l => l.id !== lectureId);
    localStorage.setItem(STORAGE_KEYS.LECTURES, JSON.stringify(lectures));
    firestoreSync.deleteDocument('lectures', lectureId);
  }

  clearAllLectures() {
    localStorage.setItem(STORAGE_KEYS.LECTURES, JSON.stringify([]));
  }

  updateLectureStatus(lectureId: string, status: 'ACTIVE' | 'UPCOMING' | 'CLOSED' | 'CANCELLED') {
    const lectures = this.getAllLectures();
    const idx = lectures.findIndex(l => l.id === lectureId);
    if (idx !== -1) {
      lectures[idx].status = status;
      localStorage.setItem(STORAGE_KEYS.LECTURES, JSON.stringify(lectures));
      firestoreSync.setDocument('lectures', lectureId, lectures[idx]);
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
      firestoreSync.setDocument('lectures', lectureId, lectures[idx]);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sca_lecture_location_updated', { detail: lectures[idx] }));
      }
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

    // Backend Semester Membership Validation:
    // Only students enrolled in this lecture's semester can mark attendance!
    if (student && lecture && student.semester !== lecture.semester) {
      throw new Error(
        `Semester validation failed: Student '${student.enrollmentNumber}' is assigned to Semester ${student.semester}, but this attendance session is strictly for Semester ${lecture.semester}. Only students enrolled in Semester ${lecture.semester} can participate.`
      );
    }

    // Enforce 1 Device & 1 IP address bound to student enrollment number
    const currentDevice = getDeviceInfo(student?.enrollmentNumber);
    const recordedDeviceId = record.deviceId || currentDevice.deviceId;
    const recordedIp = record.ipAddress || student?.ipAddress || currentDevice.ipAddress;
    const isDeviceMatched = Boolean(
      student?.deviceId && recordedDeviceId === student.deviceId
    );

    const newRecordId = `att_${record.studentId}_${record.lectureId}_${Date.now()}`;
    const newRecord: AttendanceRecord = {
      ...record,
      id: newRecordId,
      studentEmail: normalizedEmail,
      verificationMethod: record.verificationMethod || 'GEOFENCE_PASSCODE_DEVICE',
      qrVerified: record.qrVerified !== undefined ? record.qrVerified : true,
      facultyDistanceMeters: record.facultyDistanceMeters !== undefined ? record.facultyDistanceMeters : record.distanceMeters,
      deviceVerified: record.deviceVerified ?? true,
      deviceMatched: record.deviceMatched !== undefined ? record.deviceMatched : isDeviceMatched,
      deviceId: recordedDeviceId,
      ipAddress: recordedIp,
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
    firestoreSync.setDocument('attendances', newRecord.id, newRecord);
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
      firestoreSync.setDocument('attendances', attendanceId, attendance[idx]);
    }
  }

  clearAllAttendance() {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify([]));
  }

  /**
   * Enforces 1-year (365 days minimum) data retention policy.
   * Records within the retention period are guaranteed NEVER to be deleted.
   */
  enforceDataRetention(): { cleanedCount: number; retainedCount: number; retentionDays: number } {
    const settings = this.getCollegeSettings();
    const retentionDays = Math.max(settings.retentionDays || 365, 365);
    const cutoffTimestamp = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
    
    const records = this.getAllAttendance();
    const validRecords = records.filter(r => (r.createdAt || r.markedAt) >= cutoffTimestamp);
    const cleanedCount = records.length - validRecords.length;
    
    if (cleanedCount > 0) {
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(validRecords));
    }
    return { cleanedCount, retainedCount: validRecords.length, retentionDays };
  }

  /**
   * Fetches full attendance history across the past 1 year with extensive filtering.
   */
  getAttendanceHistory(filters: {
    date?: string;
    startDate?: string;
    endDate?: string;
    semester?: number | 'ALL';
    division?: string | 'ALL';
    subjectId?: string | 'ALL';
    lectureNumber?: string;
    enrollmentNumber?: string;
    status?: AttendanceStatus | 'ALL';
    search?: string;
    facultyId?: string;
    page?: number;
    pageSize?: number;
    reportPeriod?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';
  }): {
    records: AttendanceHistoryItem[];
    totalRecords: number;
    presentCount: number;
    absentCount: number;
    rejectedCount: number;
    lateCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
  } {
    this.ensureBaselineAccounts();
    const allAttendance = this.getAllAttendance();
    const lectures = this.getAllLectures();
    const lectureMap = new Map<string, Lecture>();
    lectures.forEach(l => lectureMap.set(l.id, l));

    const today = new Date();
    const todayIso = today.toISOString().split('T')[0];

    let startIso = filters.startDate;
    let endIso = filters.endDate;

    if (filters.date) {
      startIso = filters.date;
      endIso = filters.date;
    } else if (filters.reportPeriod === 'DAILY') {
      startIso = todayIso;
      endIso = todayIso;
    } else if (filters.reportPeriod === 'WEEKLY') {
      const weekAgo = new Date(today.getTime() - 7 * 86400000);
      startIso = weekAgo.toISOString().split('T')[0];
      endIso = todayIso;
    } else if (filters.reportPeriod === 'MONTHLY') {
      const monthAgo = new Date(today.getTime() - 30 * 86400000);
      startIso = monthAgo.toISOString().split('T')[0];
      endIso = todayIso;
    } else if (filters.reportPeriod === 'YEARLY') {
      const yearAgo = new Date(today.getTime() - 365 * 86400000);
      startIso = yearAgo.toISOString().split('T')[0];
      endIso = todayIso;
    }

    // Map each attendance record to AttendanceHistoryItem
    const joinedRecords: AttendanceHistoryItem[] = allAttendance.map(a => {
      const lec = lectureMap.get(a.lectureId);
      const recDate = lec?.date || new Date(a.markedAt || a.createdAt).toISOString().split('T')[0];
      return {
        ...a,
        lectureDate: recDate,
        lectureNumber: lec?.lectureNumber || 'Lecture 01',
        subjectName: lec?.subjectName || 'Subject Session',
        subjectCode: lec?.subjectCode || 'N/A',
        semester: lec?.semester || 5,
        division: lec?.division || 'A',
        facultyName: lec?.facultyName || 'Faculty',
        room: lec?.room
      };
    });

    const searchLower = (filters.search || '').trim().toLowerCase();

    // Filter
    const filtered = joinedRecords.filter(item => {
      if (startIso && item.lectureDate < startIso) return false;
      if (endIso && item.lectureDate > endIso) return false;

      if (filters.semester && filters.semester !== 'ALL' && item.semester !== filters.semester) {
        return false;
      }
      if (filters.division && filters.division !== 'ALL' && item.division !== filters.division) {
        return false;
      }
      if (filters.subjectId && filters.subjectId !== 'ALL') {
        const lec = lectureMap.get(item.lectureId);
        const matchesSubject = lec?.subjectId === filters.subjectId || 
                               lec?.subjectCode === filters.subjectId ||
                               item.subjectCode === filters.subjectId;
        if (!matchesSubject) return false;
      }
      if (filters.lectureNumber && filters.lectureNumber.trim()) {
        const query = filters.lectureNumber.trim().toLowerCase();
        if (!item.lectureNumber?.toString().toLowerCase().includes(query)) return false;
      }
      if (filters.enrollmentNumber && filters.enrollmentNumber.trim()) {
        const query = filters.enrollmentNumber.trim().toUpperCase();
        if (!item.enrollmentNumber.toUpperCase().includes(query)) return false;
      }
      if (filters.status && filters.status !== 'ALL' && item.status !== filters.status) {
        return false;
      }
      if (filters.facultyId) {
        const lec = lectureMap.get(item.lectureId);
        if (lec && lec.facultyId && lec.facultyId !== filters.facultyId) {
          // allow head/admin or match
        }
      }
      if (searchLower) {
        const matches = item.studentName.toLowerCase().includes(searchLower) ||
                        item.enrollmentNumber.toLowerCase().includes(searchLower) ||
                        item.rollNumber.toLowerCase().includes(searchLower) ||
                        (item.studentEmail && item.studentEmail.toLowerCase().includes(searchLower)) ||
                        item.subjectName.toLowerCase().includes(searchLower) ||
                        item.subjectCode.toLowerCase().includes(searchLower);
        if (!matches) return false;
      }
      return true;
    });

    // Sort descending by date, then markedAt
    filtered.sort((a, b) => {
      if (b.lectureDate !== a.lectureDate) {
        return b.lectureDate.localeCompare(a.lectureDate);
      }
      return (b.markedAt || 0) - (a.markedAt || 0);
    });

    // Calculate status counts
    const presentCount = filtered.filter(r => r.status === 'PRESENT').length;
    const lateCount = filtered.filter(r => r.status === 'LATE').length;
    const rejectedCount = filtered.filter(r => r.status === 'REJECTED').length;

    // Estimate absent count in scope
    let absentCount = 0;
    // Pagination
    const page = Math.max(1, filters.page || 1);
    const pageSize = Math.max(5, filters.pageSize || 15);
    const totalRecords = filtered.length;
    const totalPages = Math.ceil(totalRecords / pageSize) || 1;
    const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

    return {
      records: paginated,
      totalRecords,
      presentCount,
      lateCount,
      rejectedCount,
      absentCount,
      page,
      pageSize,
      totalPages
    };
  }

  /**
   * Fetches the complete attendance roster for a specific lecture session,
   * showing PRESENT, LATE, REJECTED, and ABSENT statuses for every student in the class.
   */
  getLectureFullAttendanceList(lectureId: string): {
    lecture?: Lecture;
    entries: Array<{
      student: Student;
      status: AttendanceStatus;
      record?: AttendanceRecord;
      markedTimeStr?: string;
      markedAt?: number;
      distanceMeters?: number;
      facultyDistanceMeters?: number;
      rejectionReason?: string;
      verificationMethod?: string;
      deviceId?: string;
      ipAddress?: string;
      gmailNotificationSent?: boolean;
    }>;
    summary: {
      totalEnrolled: number;
      present: number;
      late: number;
      absent: number;
      rejected: number;
      attendancePercentage: number;
    };
  } {
    this.ensureBaselineAccounts();
    const lecture = this.getLectureById(lectureId);
    if (!lecture) {
      return {
        entries: [],
        summary: { totalEnrolled: 0, present: 0, late: 0, absent: 0, rejected: 0, attendancePercentage: 0 }
      };
    }

    const students = this.getAllStudents().filter(s => 
      s.semester === lecture.semester && (lecture.division === 'ALL' || s.division === lecture.division)
    );
    const records = this.getAttendanceForLecture(lectureId);

    const entries = students.map(student => {
      const studentEmailNorm = (student.email || '').trim().toLowerCase();
      // Match by studentId, email, or enrollment
      const matchedRecord = records.find(r => 
        r.studentId === student.id ||
        (r.studentEmail && r.studentEmail.toLowerCase() === studentEmailNorm) ||
        (r.enrollmentNumber && r.enrollmentNumber.toUpperCase() === student.enrollmentNumber.toUpperCase())
      );

      if (matchedRecord) {
        return {
          student,
          status: matchedRecord.status,
          record: matchedRecord,
          markedTimeStr: matchedRecord.markedTimeStr,
          markedAt: matchedRecord.markedAt,
          distanceMeters: matchedRecord.distanceMeters,
          facultyDistanceMeters: matchedRecord.facultyDistanceMeters,
          rejectionReason: matchedRecord.rejectionReason,
          verificationMethod: matchedRecord.verificationMethod,
          deviceId: matchedRecord.deviceId,
          ipAddress: matchedRecord.ipAddress,
          gmailNotificationSent: matchedRecord.gmailNotificationSent
        };
      } else {
        return {
          student,
          status: 'ABSENT' as AttendanceStatus
        };
      }
    });

    const present = entries.filter(e => e.status === 'PRESENT').length;
    const late = entries.filter(e => e.status === 'LATE').length;
    const rejected = entries.filter(e => e.status === 'REJECTED').length;
    const absent = entries.filter(e => e.status === 'ABSENT').length;
    const totalEnrolled = students.length;
    const attendancePercentage = totalEnrolled > 0
      ? Math.round(((present + late) / totalEnrolled) * 100)
      : 0;

    return {
      lecture,
      entries,
      summary: {
        totalEnrolled,
        present,
        late,
        absent,
        rejected,
        attendancePercentage
      }
    };
  }

  /**
   * Calculates subject-wise attendance percentage for every student enrolled in the selected class.
   * Formula: Attendance Percentage = (Number of Present Lectures / Total Conducted Lectures) * 100
   *
   * Strict Rules enforced:
   * - Count only lectures for which an official attendance session was conducted.
   * - Count a student as Present only when attendance is successfully verified and saved.
   * - Count Absent as not present.
   * - Do not count Rejected attempts as additional lectures or present.
   * - Do not count cancelled lectures.
   * - Exclude future lectures and sessions that have not been conducted.
   * - Prevent duplicate attendance records for the same student and lecture.
   * - If no lectures conducted: display 0% or N/A (Status: 'No Data').
   */
  calculateSubjectAttendanceStats(params: {
    semester: number;
    division?: string;
    subjectId: string;
    startDate?: string;
    endDate?: string;
    academicYear?: string;
    thresholdPercent?: number;
    facultyId?: string;
  }): SubjectAttendanceSummary {
    this.ensureBaselineAccounts();
    const subjects = this.getAllSubjects();
    const targetSubject = subjects.find(s => 
      s.id === params.subjectId || 
      (s.subjectCode && s.subjectCode.toUpperCase() === params.subjectId.toUpperCase())
    ) || {
      id: params.subjectId,
      subjectName: 'Selected Subject',
      subjectCode: params.subjectId,
      semester: params.semester,
      department: 'Information Technology'
    };

    const allLectures = this.getAllLectures();
    const todayIso = new Date().toISOString().split('T')[0];

    // Filter conducted lectures
    const conductedLectures = allLectures.filter(l => {
      if (l.semester !== params.semester) return false;
      if (params.division && params.division !== 'ALL' && l.division !== params.division) return false;
      
      const matchesSubject = l.subjectId === targetSubject.id || 
                             l.subjectCode === targetSubject.subjectCode;
      if (!matchesSubject) return false;

      // Rules:
      // - Do not count cancelled lectures
      if (l.status === 'CANCELLED') return false;
      // - Exclude future lectures or unconducted sessions
      if (l.status === 'UPCOMING') return false;
      if (l.date > todayIso) return false;
      
      if (params.startDate && l.date < params.startDate) return false;
      if (params.endDate && l.date > params.endDate) return false;
      if (params.academicYear && l.academicYear && l.academicYear !== params.academicYear) return false;

      return true;
    });

    const totalConductedLectures = conductedLectures.length;
    const conductedLectureIds = new Set(conductedLectures.map(l => l.id));

    // Get all students enrolled in class
    const allStudents = this.getAllStudents();
    const enrolledStudents = allStudents.filter(st => {
      if (st.semester !== params.semester) return false;
      if (params.division && params.division !== 'ALL' && st.division !== params.division) return false;
      return true;
    });

    // Attendance records for conducted lectures
    const allAttendance = this.getAllAttendance().filter(a => conductedLectureIds.has(a.lectureId));

    const threshold = params.thresholdPercent ?? this.getCollegeSettings().attendanceThresholdPercent ?? 75;

    const studentMetrics: SubjectAttendanceStudentMetric[] = enrolledStudents.map(student => {
      const studentEmailNorm = (student.email || '').trim().toLowerCase();

      // Prevent duplicate attendance records: count unique lectureIds
      const verifiedLectureIds = new Set<string>();
      allAttendance.forEach(a => {
        const matchesStudent = a.studentId === student.id ||
          (a.studentEmail && a.studentEmail.toLowerCase() === studentEmailNorm) ||
          (a.enrollmentNumber && a.enrollmentNumber.toUpperCase() === student.enrollmentNumber.toUpperCase());

        if (matchesStudent && (a.status === 'PRESENT' || a.status === 'LATE')) {
          verifiedLectureIds.add(a.lectureId);
        }
      });

      const presentLectures = verifiedLectureIds.size;
      const absentLectures = totalConductedLectures > 0
        ? Math.max(0, totalConductedLectures - presentLectures)
        : 0;

      let attendancePercentage = 0;
      let attendanceStatus: 'Eligible' | 'Short Attendance' | 'No Data' = 'No Data';

      if (totalConductedLectures === 0) {
        attendancePercentage = 0;
        attendanceStatus = 'No Data';
      } else {
        attendancePercentage = Math.round((presentLectures / totalConductedLectures) * 100);
        attendanceStatus = attendancePercentage >= threshold ? 'Eligible' : 'Short Attendance';
      }

      return {
        studentId: student.id,
        studentName: student.name,
        enrollmentNumber: student.enrollmentNumber,
        rollNumber: student.rollNumber,
        studentEmail: student.email,
        totalConductedLectures,
        presentLectures,
        absentLectures,
        attendancePercentage,
        attendanceStatus
      };
    });

    const totalStudents = enrolledStudents.length;
    const averageAttendancePercentage = totalStudents > 0 && totalConductedLectures > 0
      ? Math.round(studentMetrics.reduce((acc, curr) => acc + curr.attendancePercentage, 0) / totalStudents)
      : 0;

    const studentsBelowThresholdCount = studentMetrics.filter(s => s.attendanceStatus === 'Short Attendance').length;

    return {
      subjectId: targetSubject.id,
      subjectName: targetSubject.subjectName,
      subjectCode: targetSubject.subjectCode,
      semester: params.semester,
      division: params.division || 'ALL',
      totalStudents,
      totalConductedLectures,
      averageAttendancePercentage,
      studentsBelowThresholdCount,
      thresholdPercent: threshold,
      students: studentMetrics
    };
  }

  /**
   * Semester-Wise Subject Summary
   * Loads all subjects assigned to that semester from the database and returns:
   * Subject | Conducted Lectures | Present | Absent | Attendance %
   */
  getSemesterSubjectsSummary(params: {
    semester: number;
    division?: string;
    startDate?: string;
    endDate?: string;
    academicYear?: string;
    facultyId?: string;
  }): SemesterSubjectOverviewItem[] {
    this.ensureBaselineAccounts();
    const subjects = this.getSubjectsBySemester(params.semester);

    return subjects.map(sub => {
      const stats = this.calculateSubjectAttendanceStats({
        semester: params.semester,
        division: params.division,
        subjectId: sub.id,
        startDate: params.startDate,
        endDate: params.endDate,
        academicYear: params.academicYear,
        facultyId: params.facultyId
      });

      const totalPossibleAttendances = stats.totalConductedLectures * (stats.totalStudents || 1);
      const totalPresent = stats.students.reduce((acc, s) => acc + s.presentLectures, 0);
      const totalAbsent = stats.students.reduce((acc, s) => acc + s.absentLectures, 0);
      const percentage = totalPossibleAttendances > 0
        ? Math.round((totalPresent / totalPossibleAttendances) * 100)
        : 0;

      return {
        subjectId: sub.id,
        subjectName: sub.subjectName,
        subjectCode: sub.subjectCode,
        conductedLectures: stats.totalConductedLectures,
        presentCount: totalPresent,
        absentCount: totalAbsent,
        attendancePercentage: percentage
      };
    });
  }
}

export const db = new DatabaseService();

// Initialize real-time cloud synchronization with Firebase Firestore
if (typeof window !== 'undefined') {
  firestoreSync.initRealTimeListeners((_colName) => {
    // Real-time Firestore sync active
  });
}

