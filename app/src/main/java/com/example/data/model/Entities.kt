package com.example.data.model

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "users",
    indices = [Index(value = ["email"], unique = true)]
)
data class UserEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val email: String,
    val passwordHash: String,
    val role: String, // "STUDENT", "FACULTY", "ADMIN"
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(
    tableName = "students",
    indices = [
        Index(value = ["enrollmentNumber"], unique = true),
        Index(value = ["userId"])
    ]
)
data class StudentEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val userId: Long,
    val enrollmentNumber: String,
    val name: String,
    val department: String,
    val semester: Int,
    val division: String,
    val rollNumber: String,
    val phone: String,
    val faceEnrollmentStatus: Boolean = false,
    val faceEmbedding: String = "", // serialized float array template
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(
    tableName = "faculty",
    indices = [Index(value = ["userId"])]
)
data class FacultyEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val userId: Long,
    val name: String,
    val department: String,
    val email: String,
    val phone: String = ""
)

@Entity(
    tableName = "subjects",
    indices = [Index(value = ["subjectCode"], unique = true)]
)
data class SubjectEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val subjectCode: String,
    val subjectName: String,
    val semester: Int,
    val department: String
)

@Entity(
    tableName = "lectures",
    indices = [Index(value = ["subjectId"]), Index(value = ["facultyId"])]
)
data class LectureEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val subjectId: Long,
    val facultyId: Long,
    val facultyName: String,
    val subjectName: String,
    val subjectCode: String,
    val semester: Int,
    val division: String,
    val room: String,
    val date: String, // YYYY-MM-DD
    val startTime: String, // "09:00 AM"
    val endTime: String, // "10:00 AM"
    val attendanceStart: String, // "09:00 AM"
    val attendanceEnd: String, // "09:15 AM"
    val status: String = "ACTIVE" // "UPCOMING", "ACTIVE", "CLOSED"
)

@Entity(
    tableName = "attendance",
    indices = [
        Index(value = ["lectureId", "studentId"], unique = true),
        Index(value = ["studentId"]),
        Index(value = ["lectureId"])
    ]
)
data class AttendanceEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val lectureId: Long,
    val studentId: Long,
    val studentName: String,
    val rollNumber: String,
    val enrollmentNumber: String,
    val status: String, // "PRESENT", "ABSENT", "LATE", "EXCUSED", "MANUALLY_CORRECTED"
    val markedAt: Long = System.currentTimeMillis(),
    val markedTimeStr: String,
    val latitude: Double,
    val longitude: Double,
    val gpsAccuracy: Float,
    val distanceMeters: Double,
    val faceVerified: Boolean,
    val faceConfidence: Int, // e.g. 96
    val livenessVerified: Boolean,
    val verificationMethod: String = "BIOMETRIC_GPS",
    val correctionReason: String = "",
    val correctedByFacultyId: Long = 0,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "college_settings")
data class CollegeSettingsEntity(
    @PrimaryKey val id: Long = 1,
    val collegeName: String = "Gujarat Technological University",
    val latitude: Double = 23.2156, // Realistic campus coordinates
    val longitude: Double = 72.6369,
    val allowedRadiusMeters: Double = 2000.0, // Default 2 KM
    val minimumGpsAccuracy: Float = 50.0f, // in meters
    val updatedAt: Long = System.currentTimeMillis()
)
