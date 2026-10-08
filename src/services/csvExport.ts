import { AttendanceRecord, Lecture } from '../types';

export function exportAttendanceToCSV(lecture: Lecture, records: AttendanceRecord[]): void {
  const headers = [
    'Student ID',
    'Enrollment Number',
    'Student Name',
    'Subject',
    'Lecture Date',
    'Start Time',
    'End Time',
    'Status',
    'Marked Time',
    'Latitude',
    'Longitude',
    'Distance (Meters)',
    'Face Verification',
    'Faculty'
  ];

  const rows = records.map(rec => [
    rec.studentId,
    `"${rec.enrollmentNumber}"`,
    `"${rec.studentName}"`,
    `"${lecture.subjectName}"`,
    `"${lecture.date}"`,
    `"${lecture.startTime}"`,
    `"${lecture.endTime}"`,
    rec.status,
    `"${rec.markedTimeStr}"`,
    rec.latitude.toFixed(6),
    rec.longitude.toFixed(6),
    Math.round(rec.distanceMeters),
    `"Verified (${rec.faceConfidence}%)"`,
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
  link.setAttribute('download', `Attendance_${lecture.subjectCode}_${lecture.date}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
