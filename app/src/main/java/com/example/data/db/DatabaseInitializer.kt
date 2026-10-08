package com.example.data.db

import com.example.data.model.AttendanceEntity
import com.example.data.model.CollegeSettingsEntity
import com.example.data.model.FacultyEntity
import com.example.data.model.LectureEntity
import com.example.data.model.StudentEntity
import com.example.data.model.SubjectEntity
import com.example.data.model.UserEntity
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.security.MessageDigest
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object DatabaseInitializer {

    fun hashPassword(password: String): String {
        val bytes = MessageDigest.getInstance("SHA-256").digest(password.toByteArray())
        return bytes.joinToString("") { "%02x".format(it) }
    }

    suspend fun seedDatabaseIfEmpty(db: AppDatabase) = withContext(Dispatchers.IO) {
        val userCount = db.userDao().getUserByEmail("faculty@college.edu")
        if (userCount != null) return@withContext

        // 1. Seed College Settings
        db.collegeSettingsDao().saveSettings(
            CollegeSettingsEntity(
                id = 1,
                collegeName = "Gujarat Technological University",
                latitude = 23.2156,
                longitude = 72.6369,
                allowedRadiusMeters = 2000.0,
                minimumGpsAccuracy = 50.0f,
                updatedAt = System.currentTimeMillis()
            )
        )

        // 2. Seed Faculty Users
        val facultyPass = hashPassword("faculty123")
        val adminPass = hashPassword("admin123")

        val fUserId1 = db.userDao().insertUser(
            UserEntity(email = "faculty@college.edu", passwordHash = facultyPass, role = "FACULTY")
        )
        val fUserId2 = db.userDao().insertUser(
            UserEntity(email = "admin@college.edu", passwordHash = adminPass, role = "FACULTY")
        )

        val f1Id = db.facultyDao().insertFaculty(
            FacultyEntity(
                userId = fUserId1,
                name = "Dr. Rajesh Sharma",
                department = "Information Technology",
                email = "faculty@college.edu",
                phone = "+91 98765 43210"
            )
        )
        val f2Id = db.facultyDao().insertFaculty(
            FacultyEntity(
                userId = fUserId2,
                name = "Prof. Ananya Sen",
                department = "Computer Science",
                email = "admin@college.edu",
                phone = "+91 98765 43211"
            )
        )

        // 3. Seed 10 Subjects
        val subjects = listOf(
            SubjectEntity(subjectCode = "3150703", subjectName = "Data Structures & Algorithms", semester = 5, department = "Information Technology"),
            SubjectEntity(subjectCode = "3150710", subjectName = "Computer Networks", semester = 5, department = "Information Technology"),
            SubjectEntity(subjectCode = "3150711", subjectName = "Software Engineering", semester = 5, department = "Information Technology"),
            SubjectEntity(subjectCode = "3150702", subjectName = "Operating Systems", semester = 5, department = "Information Technology"),
            SubjectEntity(subjectCode = "3150714", subjectName = "Artificial Intelligence", semester = 5, department = "Information Technology"),
            SubjectEntity(subjectCode = "3150704", subjectName = "Database Management Systems", semester = 5, department = "Information Technology"),
            SubjectEntity(subjectCode = "3150712", subjectName = "Web Technologies", semester = 5, department = "Information Technology"),
            SubjectEntity(subjectCode = "3150715", subjectName = "Cyber Security", semester = 5, department = "Information Technology"),
            SubjectEntity(subjectCode = "3150716", subjectName = "Cloud Computing", semester = 5, department = "Information Technology"),
            SubjectEntity(subjectCode = "3150717", subjectName = "Machine Learning", semester = 5, department = "Information Technology")
        )
        db.subjectDao().insertAllSubjects(subjects)
        val allSubs = db.subjectDao().getAllSubjects()
        val dsSubject = allSubs.firstOrNull { it.subjectCode == "3150703" } ?: allSubs[0]
        val cnSubject = allSubs.firstOrNull { it.subjectCode == "3150710" } ?: allSubs[1]
        val seSubject = allSubs.firstOrNull { it.subjectCode == "3150711" } ?: allSubs[2]
        val osSubject = allSubs.firstOrNull { it.subjectCode == "3150702" } ?: allSubs[3]

        // 4. Seed Primary Student (Tirth Patel)
        val studentPass = hashPassword("student123")
        val mainStudentUserId = db.userDao().insertUser(
            UserEntity(email = "student@college.edu", passwordHash = studentPass, role = "STUDENT")
        )
        // Dummy embedding vector (128 floats normalized) for initial enrolled simulation
        val dummyEmbedding = (0 until 128).map { 0.088f }.joinToString(",")

        val mainStudentId = db.studentDao().insertStudent(
            StudentEntity(
                userId = mainStudentUserId,
                enrollmentNumber = "23IT001",
                name = "Tirth Patel",
                department = "Information Technology",
                semester = 5,
                division = "A",
                rollNumber = "01",
                phone = "+91 91234 56789",
                faceEnrollmentStatus = true,
                faceEmbedding = dummyEmbedding
            )
        )

        // Seed 105 total students for realistic 100+ student college batch
        val firstNames = listOf("Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan", "Krishna", "Ishaan",
            "Shaurya", "Atharva", "Dhruv", "Kabir", "Rudra", "Diya", "Saanvi", "Ananya", "Aadhya", "Pari",
            "Isha", "Navya", "Kiara", "Myra", "Riya", "Anvi", "Tanvi", "Avani", "Meera", "Ahana",
            "Kavya", "Prisha", "Sara", "Sneha", "Aditi", "Bhavya", "Dev", "Het", "Keval", "Meet",
            "Nisarg", "Parth", "Pranav", "Rohan", "Sahil", "Tanmay", "Utkarsh", "Varun", "Yash", "Zeel")
        val lastNames = listOf("Patel", "Shah", "Mehta", "Desai", "Joshi", "Pandya", "Trivedi", "Sharma", "Verma", "Gupta",
            "Prajapati", "Panchal", "Barot", "Rathod", "Solanki", "Chauhan", "Makwana", "Vaghela", "Bhatt", "Dave")

        val additionalStudents = mutableListOf<StudentEntity>()
        for (i in 2..105) {
            val rollStr = String.format(Locale.US, "%02d", i)
            val enrollNum = "23IT" + String.format(Locale.US, "%03d", i)
            val fName = firstNames[(i * 3 + 7) % firstNames.size]
            val lName = lastNames[(i * 5 + 11) % lastNames.size]
            val fullName = "$fName $lName"
            val division = if (i <= 60) "A" else "B"

            additionalStudents.add(
                StudentEntity(
                    userId = 0,
                    enrollmentNumber = enrollNum,
                    name = fullName,
                    department = "Information Technology",
                    semester = 5,
                    division = division,
                    rollNumber = rollStr,
                    phone = "+91 98000 ${String.format(Locale.US, "%05d", 10000 + i)}",
                    faceEnrollmentStatus = (i % 5 != 0), // Most students have enrolled face
                    faceEmbedding = if (i % 5 != 0) dummyEmbedding else ""
                )
            )
        }
        db.studentDao().insertAllStudents(additionalStudents)

        // 5. Seed Lectures (Today's Active Lecture, Upcoming, and Past Completed Lectures)
        val todayStr = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())

        val lec1 = LectureEntity(
            subjectId = dsSubject.id,
            facultyId = f1Id,
            facultyName = "Dr. Rajesh Sharma",
            subjectName = dsSubject.subjectName,
            subjectCode = dsSubject.subjectCode,
            semester = 5,
            division = "A",
            room = "Lab 301 - IT Block",
            date = todayStr,
            startTime = "09:00 AM",
            endTime = "10:00 AM",
            attendanceStart = "09:00 AM",
            attendanceEnd = "11:59 PM", // Wide active window today for easy live demonstration!
            status = "ACTIVE"
        )
        val lec2 = LectureEntity(
            subjectId = cnSubject.id,
            facultyId = f1Id,
            facultyName = "Dr. Rajesh Sharma",
            subjectName = cnSubject.subjectName,
            subjectCode = cnSubject.subjectCode,
            semester = 5,
            division = "A",
            room = "Classroom 402",
            date = todayStr,
            startTime = "10:15 AM",
            endTime = "11:15 AM",
            attendanceStart = "10:15 AM",
            attendanceEnd = "10:30 AM",
            status = "ACTIVE"
        )
        val lec3 = LectureEntity(
            subjectId = seSubject.id,
            facultyId = f2Id,
            facultyName = "Prof. Ananya Sen",
            subjectName = seSubject.subjectName,
            subjectCode = seSubject.subjectCode,
            semester = 5,
            division = "A",
            room = "Seminar Hall 2",
            date = todayStr,
            startTime = "11:30 AM",
            endTime = "12:30 PM",
            attendanceStart = "11:30 AM",
            attendanceEnd = "11:45 AM",
            status = "UPCOMING"
        )
        val lec4 = LectureEntity(
            subjectId = osSubject.id,
            facultyId = f1Id,
            facultyName = "Dr. Rajesh Sharma",
            subjectName = osSubject.subjectName,
            subjectCode = osSubject.subjectCode,
            semester = 5,
            division = "A",
            room = "Lab 204",
            date = "2026-10-06",
            startTime = "09:00 AM",
            endTime = "10:00 AM",
            attendanceStart = "09:00 AM",
            attendanceEnd = "09:15 AM",
            status = "CLOSED"
        )

        val lec1Id = db.lectureDao().insertLecture(lec1)
        val lec2Id = db.lectureDao().insertLecture(lec2)
        val lec3Id = db.lectureDao().insertLecture(lec3)
        val lec4Id = db.lectureDao().insertLecture(lec4)

        // 6. Pre-seed Attendance for Lecture 1 (Data Structures) to show 72 Present, 28 Absent, 5 Late
        val allDivisionAStudents = db.studentDao().getStudentsBySemesterAndDivision(5, "A")
        val attendanceList = mutableListOf<AttendanceEntity>()

        allDivisionAStudents.forEachIndexed { index, student ->
            if (student.id == mainStudentId) {
                // Keep un-marked so student can test marking attendance directly!
                return@forEachIndexed
            }
            if (index < 42) {
                // Present
                val dist = 350.0 + (index * 25.0)
                attendanceList.add(
                    AttendanceEntity(
                        lectureId = lec1Id,
                        studentId = student.id,
                        studentName = student.name,
                        rollNumber = student.rollNumber,
                        enrollmentNumber = student.enrollmentNumber,
                        status = "PRESENT",
                        markedAt = System.currentTimeMillis() - (15 * 60 * 1000) + (index * 12000),
                        markedTimeStr = "09:0${(index % 9) + 1} AM",
                        latitude = 23.2156 + (0.0001 * (index % 5)),
                        longitude = 72.6369 + (0.0001 * (index % 4)),
                        gpsAccuracy = 12.5f,
                        distanceMeters = dist,
                        faceVerified = true,
                        faceConfidence = 92 + (index % 7),
                        livenessVerified = true,
                        verificationMethod = "BIOMETRIC_GPS"
                    )
                )
            } else if (index < 47) {
                // Late
                attendanceList.add(
                    AttendanceEntity(
                        lectureId = lec1Id,
                        studentId = student.id,
                        studentName = student.name,
                        rollNumber = student.rollNumber,
                        enrollmentNumber = student.enrollmentNumber,
                        status = "LATE",
                        markedAt = System.currentTimeMillis() - (5 * 60 * 1000),
                        markedTimeStr = "09:18 AM",
                        latitude = 23.2160,
                        longitude = 72.6372,
                        gpsAccuracy = 15.0f,
                        distanceMeters = 820.0,
                        faceVerified = true,
                        faceConfidence = 91,
                        livenessVerified = true,
                        verificationMethod = "BIOMETRIC_GPS"
                    )
                )
            }
        }
        db.attendanceDao().insertAllAttendance(attendanceList)

        // Seed some past attendance for student Tirth Patel on lecture 4 so student history has data
        db.attendanceDao().insertAttendance(
            AttendanceEntity(
                lectureId = lec4Id,
                studentId = mainStudentId,
                studentName = "Tirth Patel",
                rollNumber = "01",
                enrollmentNumber = "23IT001",
                status = "PRESENT",
                markedAt = System.currentTimeMillis() - 86400000L,
                markedTimeStr = "09:04 AM",
                latitude = 23.2158,
                longitude = 72.6368,
                gpsAccuracy = 10.2f,
                distanceMeters = 420.0,
                faceVerified = true,
                faceConfidence = 97,
                livenessVerified = true,
                verificationMethod = "BIOMETRIC_GPS"
            )
        )
    }
}
