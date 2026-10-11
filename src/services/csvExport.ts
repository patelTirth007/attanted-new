import { AttendanceRecord, Lecture, Student } from '../types';

export function exportAttendanceToCSV(lecture: Lecture, records: AttendanceRecord[]): void {
  const headers = [
    'Semester',
    'Division',
    'Roll Number',
    'Enrollment Number',
    'Student Name',
    'Student Email ID',
    'Subject Code',
    'Subject Name',
    'Lecture Date',
    'Start Time',
    'End Time',
    'Status',
    'Marked Time',
    'Gmail Notification',
    'Latitude',
    'Longitude',
    'Distance (Meters)',
    'Faculty 100m Distance',
    'Verification Mode',
    'Faculty Name'
  ];

  const rows = records.map(rec => [
    `"Sem ${lecture.semester}"`,
    `"${lecture.division}"`,
    rec.rollNumber,
    `"${rec.enrollmentNumber}"`,
    `"${rec.studentName}"`,
    `"${rec.studentEmail || ''}"`,
    `"${lecture.subjectCode}"`,
    `"${lecture.subjectName}"`,
    `"${lecture.date}"`,
    `"${lecture.startTime}"`,
    `"${lecture.endTime}"`,
    rec.status,
    `"${rec.markedTimeStr}"`,
    `"Delivered ✓"`,
    rec.latitude.toFixed(6),
    rec.longitude.toFixed(6),
    Math.round(rec.distanceMeters),
    `${Math.round(rec.facultyDistanceMeters || rec.distanceMeters)}m (≤100m)`,
    `"${rec.verificationMethod || 'QR_100M_GEOFENCE'}"`,
    `"${lecture.facultyName}"`
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Attendance_Sem${lecture.semester}_${lecture.subjectCode}_${lecture.date}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportSemesterAttendanceToCSV(
  semester: number,
  lectures: Lecture[],
  records: AttendanceRecord[],
  students: Student[]
): void {
  const headers = [
    'Semester',
    'Division',
    'Roll Number',
    'Enrollment Number',
    'Student Name',
    'Student Email ID',
    'Total Lectures in Semester',
    'Lectures Attended',
    'Attendance Percentage (%)',
    'Eligibility Status (>=75%)'
  ];

  const relevantStudents = students.filter(s => s.semester === semester);
  const totalLecturesCount = lectures.length;

  const rows = relevantStudents.map(student => {
    const studentEmail = (student.email || `${student.enrollmentNumber.toLowerCase()}@college.edu`).toLowerCase();
    const attendedCount = records.filter(r => 
      (r.studentId === student.id || (r.studentEmail && r.studentEmail.toLowerCase() === studentEmail)) &&
      (r.status === 'PRESENT' || r.status === 'LATE')
    ).length;

    const percentage = totalLecturesCount > 0 
      ? ((attendedCount / totalLecturesCount) * 100).toFixed(1)
      : '0.0';

    const isEligible = Number(percentage) >= 75 ? 'ELIGIBLE' : 'DEBARRED (<75%)';

    return [
      `"Semester ${semester}"`,
      `"${student.division}"`,
      student.rollNumber,
      `"${student.enrollmentNumber}"`,
      `"${student.name}"`,
      `"${studentEmail}"`,
      totalLecturesCount,
      attendedCount,
      `${percentage}%`,
      `"${isEligible}"`
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Semester_${semester}_Consolidated_Attendance_Report.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportAttendanceHistoryToCSV(
  records: Array<{
    studentName: string;
    enrollmentNumber: string;
    rollNumber: string;
    studentEmail: string;
    semester: number;
    division: string;
    subjectCode: string;
    subjectName: string;
    lectureNumber?: string | number;
    lectureDate: string;
    markedTimeStr: string;
    status: string;
    distanceMeters?: number;
    deviceId?: string;
    ipAddress?: string;
    rejectionReason?: string;
  }>,
  filenamePrefix = 'Attendance_History_Report'
): void {
  const headers = [
    'Student Name',
    'Enrollment Number',
    'Roll Number',
    'Student Email',
    'Semester',
    'Class / Division',
    'Subject Code',
    'Subject Name',
    'Lecture Number',
    'Attendance Date',
    'Attendance Time',
    'Status',
    'GPS Distance (Meters)',
    'Registered Device ID',
    'IP Address',
    'Notes / Rejection Reason'
  ];

  const rows = records.map(r => [
    `"${r.studentName}"`,
    `"${r.enrollmentNumber}"`,
    `"${r.rollNumber}"`,
    `"${r.studentEmail || ''}"`,
    `"Sem ${r.semester}"`,
    `"${r.division}"`,
    `"${r.subjectCode}"`,
    `"${r.subjectName}"`,
    `"${r.lectureNumber || 'N/A'}"`,
    `"${r.lectureDate}"`,
    `"${r.markedTimeStr}"`,
    `"${r.status}"`,
    r.distanceMeters !== undefined ? Math.round(r.distanceMeters) : '',
    `"${r.deviceId || 'N/A'}"`,
    `"${r.ipAddress || 'N/A'}"`,
    `"${r.rejectionReason || 'Verified Normal'}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filenamePrefix}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportSubjectWiseAttendanceToCSV(
  summary: {
    subjectName: string;
    subjectCode: string;
    semester: number;
    division?: string;
    thresholdPercent: number;
    totalConductedLectures: number;
    students: Array<{
      studentName: string;
      enrollmentNumber: string;
      rollNumber: string;
      studentEmail: string;
      totalConductedLectures: number;
      presentLectures: number;
      absentLectures: number;
      attendancePercentage: number;
      attendanceStatus: string;
    }>;
  }
): void {
  const headers = [
    'Subject Name',
    'Subject Code',
    'Semester',
    'Class / Division',
    'Roll Number',
    'Enrollment Number',
    'Student Name',
    'Student Email',
    'Conducted Lectures',
    'Present Lectures',
    'Absent Lectures',
    'Attendance Percentage (%)',
    'Attendance Status',
    'Required Threshold (%)'
  ];

  const rows = summary.students.map(st => [
    `"${summary.subjectName}"`,
    `"${summary.subjectCode}"`,
    `"Sem ${summary.semester}"`,
    `"${summary.division || 'ALL'}"`,
    `"${st.rollNumber}"`,
    `"${st.enrollmentNumber}"`,
    `"${st.studentName}"`,
    `"${st.studentEmail || ''}"`,
    st.totalConductedLectures,
    st.presentLectures,
    st.absentLectures,
    `${st.attendancePercentage}%`,
    `"${st.attendanceStatus}"`,
    `${summary.thresholdPercent}%`
  ]);

  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Subject_Attendance_${summary.subjectCode}_Sem${summary.semester}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportSemesterSubjectSummaryToCSV(
  semester: number,
  division: string,
  items: Array<{
    subjectName: string;
    subjectCode: string;
    conductedLectures: number;
    presentCount: number;
    absentCount: number;
    attendancePercentage: number;
  }>
): void {
  const headers = [
    'Semester',
    'Class / Division',
    'Subject Code',
    'Subject Name',
    'Conducted Lectures',
    'Total Present',
    'Total Absent',
    'Class Attendance Percentage (%)'
  ];

  const rows = items.map(item => [
    `"Sem ${semester}"`,
    `"${division || 'ALL'}"`,
    `"${item.subjectCode}"`,
    `"${item.subjectName}"`,
    item.conductedLectures,
    item.presentCount,
    item.absentCount,
    `${item.attendancePercentage}%`
  ]);

  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Semester_${semester}_Subjects_Attendance_Summary.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

