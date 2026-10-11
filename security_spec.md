# Firestore Security Specifications & Threat Model

## 1. Data Invariants
1. **Semester Boundary Integrity**: A student assigned to Semester X cannot mark attendance for a lecture scheduled for Semester Y (where X != Y).
2. **Single Email Verification per Subject Lecture**: Only 1 verified attendance record can exist per student email per lecture session to prevent proxy attendance.
3. **Proximity Geofence Guard**: Distance from faculty/campus must not be forged beyond the allowed perimeter.
4. **Enrollment Registry Truth**: Student enrollment numbers cannot be duplicated across distinct students.
5. **Role Separation**: A user registered as STUDENT cannot update lecture records, create subjects, or alter campus GPS geofence settings.
6. **Promotion Authorization**: Student semester promotions must preserve historical attendance logs and enrollment numbers.
7. **Document Size Bounds**: String inputs must have strict maximum lengths to prevent denial-of-wallet resource attacks.
8. **Valid Identifiers**: All document path keys must conform to `^[a-zA-Z0-9_\-]+$` and not exceed 128 characters.

## 2. The Dirty Dozen Payloads (Security Edge Cases)
1. **D1: Fake Faculty Lecture Insertion**: Unauthenticated or student client attempts writing to `/lectures/{lectureId}` with forged `facultyId`.
2. **D2: Cross-Semester Attendance Spoof**: Semester 2 student attempts submitting attendance to Semester 3 lecture `/attendances/{attendanceId}`.
3. **D3: Duplicate Attendance Ingestion**: Student attempts submitting a second attendance record with the same email for an already marked lecture.
4. **D4: Geofence Override Attack**: Client sends a distance of 15,000 meters but marks `verifiedByGps: true` while campus limit is 2,000m.
5. **D5: Secret Code Tampering**: Non-faculty user attempts to read or mutate another faculty member's secret authorization code.
6. **D6: Promotion Self-Elevation**: Student attempts mutating their own `semester` field from 1 to 8 in `/students/{studentId}`.
7. **D7: Jumbo Payload Attack**: Attacker attempts writing 1.5MB junk characters into `topic` or `name` field to inflate Firestore write & storage costs.
8. **D8: ID Path Poisoning**: Attacker generates an ID containing control characters or path traversal strings (`../../admin`).
9. **D9: Status Terminal Tampering**: Changing attendance status from `PRESENT` back to `ABSENT` after official lecture conclusion.
10. **D10: Ghost Field Injection**: Writing unauthorized fields such as `isAdmin: true` or `bypassed: true` to a user document.
11. **D11: Orphaned Attendance Submission**: Submitting attendance with non-existent `lectureId`.
12. **D12: Registry Hijack**: Modifying the master `enrollmentRegistry` without faculty/admin privileges.
