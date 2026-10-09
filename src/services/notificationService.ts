import { Student, Lecture, AttendanceRecord, CollegeSettings, GmailNotification } from '../types';

const STORAGE_KEY = 'sca_gmail_notifications';

class NotificationService {
  private getStored(): GmailNotification[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveStored(items: GmailNotification[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  public getAllNotifications(): GmailNotification[] {
    return this.getStored().sort((a, b) => b.sentAt - a.sentAt);
  }

  public getNotificationsForEmail(email: string): GmailNotification[] {
    if (!email) return [];
    const normalized = email.trim().toLowerCase();
    return this.getAllNotifications().filter(
      n => n.recipientEmail.toLowerCase() === normalized
    );
  }

  public getNotificationsForLecture(lectureId: string): GmailNotification[] {
    return this.getAllNotifications().filter(n => n.lectureId === lectureId);
  }

  public sendAttendanceGmailNotification(
    student: Student,
    lecture: Lecture,
    record: AttendanceRecord,
    collegeSettings: CollegeSettings
  ): GmailNotification {
    const studentEmail = student.email || `${student.enrollmentNumber.toLowerCase()}@college.edu`;
    const collegeName = collegeSettings.collegeName || 'Engineering & Technology College';
    
    const subject = `[Attendance Confirmed] ${lecture.subjectName} (${lecture.subjectCode}) - Present`;
    
    const body = `Dear ${student.name},

Your attendance has been successfully recorded in the Smart College Attendance System.

══════════════════════════════════════
📋 OFFICIAL ATTENDANCE CONFIRMATION
══════════════════════════════════════
• Subject: ${lecture.subjectName} (${lecture.subjectCode})
• Faculty: ${lecture.facultyName}
• Classroom / Lab: ${lecture.room}
• Date: ${lecture.date}
• Time Recorded: ${record.markedTimeStr}
• Status: PRESENT
• Verification Method: ${record.verificationMethod === 'QR_100M_GEOFENCE' || record.verificationMethod === 'QR_50M_GEOFENCE' ? 'Handheld Dynamic QR Code + 100m Proximity' : record.verificationMethod}
• Faculty Device Proximity: Verified Under 100m (${Math.round(record.facultyDistanceMeters || record.distanceMeters)}m away)
• Registered Email ID: ${studentEmail}
• Enrollment No: ${student.enrollmentNumber}
• Roll No: ${student.rollNumber}
• Semester / Division: Sem ${student.semester} - Div ${student.division}
• College Campus: ${collegeName}
• Attendance Reference ID: ${record.id}

══════════════════════════════════════
⚠️ 100-METER GEOFENCE & SINGLE ATTENDANCE POLICY:
1. Strict 100-Meter Radius: Attendance is only valid when verified within 100 meters of the faculty's handheld device in ${lecture.room}.
2. Single Attendance: Only 1 attendance is permitted per registered Email ID (${studentEmail}) for this subject lecture session. Duplicates are strictly blocked.

This is an automated system confirmation.
Academic Attendance Department
${collegeName}
`;

    const encodedTo = encodeURIComponent(studentEmail);
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodedTo}&su=${encodedSubject}&body=${encodedBody}`;
    const mailtoUrl = `mailto:${encodedTo}?subject=${encodedSubject}&body=${encodedBody}`;

    const notification: GmailNotification = {
      id: `gmail_notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      recipientEmail: studentEmail,
      recipientName: student.name,
      subject,
      body,
      sentAt: Date.now(),
      sentTimeStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      lectureId: lecture.id,
      subjectName: lecture.subjectName,
      subjectCode: lecture.subjectCode,
      status: 'DELIVERED',
      gmailUrl,
      mailtoUrl
    };

    const stored = this.getStored();
    stored.unshift(notification);
    this.saveStored(stored);

    // Dispatch custom browser event so UI can display instant toast
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('sca_gmail_notification_dispatched', {
          detail: notification
        })
      );
    }

    return notification;
  }

  public deleteNotification(id: string): void {
    const filtered = this.getStored().filter(n => n.id !== id);
    this.saveStored(filtered);
  }

  public clearAllNotifications(): void {
    this.saveStored([]);
  }
}

export const notificationService = new NotificationService();
