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

