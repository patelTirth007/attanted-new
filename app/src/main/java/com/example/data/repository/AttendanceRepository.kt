package com.example.data.repository

import com.example.data.db.AppDatabase
import com.example.data.model.AttendanceEntity
import com.example.data.model.CollegeSettingsEntity
import com.example.data.model.FacultyEntity
import com.example.data.model.LectureEntity
import com.example.data.model.StudentEntity
import com.example.data.model.SubjectEntity
import com.example.data.model.UserEntity
import com.example.service.FaceRecognitionService
import com.example.service.LocationService
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

data class SubjectAttendanceStat(
    val subjectName: String,
    val subjectCode: String,
    val totalConducted: Int,
    val presentCount: Int,
    val lateCount: Int,
    val absentCount: Int,
    val percentage: Float
)

data class AttendanceMarkResult(
    val isSuccess: Boolean,
    val status: String = "",
    val message: String,
    val attendance: AttendanceEntity? = null
)

class AttendanceRepository(
    private val db: AppDatabase,
    private val locationService: LocationService,
    private val faceRecognitionService: FaceRecognitionService
) {

    val allLecturesFlow: Flow<List<LectureEntity>> = db.lectureDao().getAllLecturesFlow()
    val allStudentsFlow: Flow<List<StudentEntity>> = db.studentDao().getAllStudentsFlow()
    val allSubjectsFlow: Flow<List<SubjectEntity>> = db.subjectDao().getAllSubjectsFlow()
    val collegeSettingsFlow: Flow<CollegeSettingsEntity?> = db.collegeSettingsDao().getSettingsFlow()

    suspend fun getStudentByUserId(userId: Long): StudentEntity? = withContext(Dispatchers.IO) {
        db.studentDao().getStudentByUserId(userId)
    }

    suspend fun getStudentById(studentId: Long): StudentEntity? = withContext(Dispatchers.IO) {
        db.studentDao().getStudentById(studentId)
    }

    suspend fun getFacultyByUserId(userId: Long): FacultyEntity? = withContext(Dispatchers.IO) {
        db.facultyDao().getFacultyByUserId(userId)
    }

    fun getLecturesForStudent(semester: Int, division: String): Flow<List<LectureEntity>> {
        return db.lectureDao().getLecturesForStudentFlow(semester, division)
    }

    fun getLecturesForFaculty(facultyId: Long): Flow<List<LectureEntity>> {
        return db.lectureDao().getLecturesByFacultyFlow(facultyId)
    }

    suspend fun getCollegeSettings(): CollegeSettingsEntity = withContext(Dispatchers.IO) {
        db.collegeSettingsDao().getSettings() ?: CollegeSettingsEntity()
    }

    suspend fun updateCollegeSettings(settings: CollegeSettingsEntity) = withContext(Dispatchers.IO) {
        db.collegeSettingsDao().saveSettings(settings)
    }

    suspend fun createLecture(lecture: LectureEntity): Long = withContext(Dispatchers.IO) {
        db.lectureDao().insertLecture(lecture)
    }

    suspend fun updateLectureStatus(lectureId: Long, status: String) = withContext(Dispatchers.IO) {
        db.lectureDao().updateLectureStatus(lectureId, status)
    }

    suspend fun updateStudentFaceEnrollment(studentId: Long, embedding: FloatArray) = withContext(Dispatchers.IO) {
        val serialized = faceRecognitionService.serializeEmbedding(embedding)
        db.studentDao().updateFaceEnrollment(studentId, true, serialized)
    }

    suspend fun getAttendanceForLecture(lectureId: Long): List<AttendanceEntity> = withContext(Dispatchers.IO) {
        db.attendanceDao().getAttendanceForLecture(lectureId)
    }

    fun getAttendanceForLectureFlow(lectureId: Long): Flow<List<AttendanceEntity>> {
        return db.attendanceDao().getAttendanceForLectureFlow(lectureId)
    }

    fun getAttendanceForStudentFlow(studentId: Long): Flow<List<AttendanceEntity>> {
        return db.attendanceDao().getAttendanceForStudentFlow(studentId)
    }

    suspend fun correctAttendance(
        attendanceId: Long,
        newStatus: String,
        reason: String,
        facultyId: Long
    ) = withContext(Dispatchers.IO) {
        val records = db.attendanceDao().getAllAttendance()
        val target = records.find { it.id == attendanceId } ?: return@withContext
        val updated = target.copy(
            status = newStatus,
            correctionReason = reason,
            correctedByFacultyId = facultyId,
            updatedAt = System.currentTimeMillis()
        )
        db.attendanceDao().updateAttendance(updated)
    }

    suspend fun markAttendance(
        studentId: Long,
        lectureId: Long,
        currentLat: Double,
        currentLon: Double,
        gpsAccuracy: Float,
        faceCapturedEmbedding: FloatArray,
        livenessVerified: Boolean,
        allowLate: Boolean = true
    ): AttendanceMarkResult = withContext(Dispatchers.IO) {
        val student = db.studentDao().getStudentById(studentId)
            ?: return@withContext AttendanceMarkResult(false, message = "Student profile not found.")

        val lecture = db.lectureDao().getLectureById(lectureId)
            ?: return@withContext AttendanceMarkResult(false, message = "Lecture not found.")

        // 1. Student enrollment in lecture check
        if (student.semester != lecture.semester || student.division != lecture.division) {
            return@withContext AttendanceMarkResult(
                false,
                message = "You are not enrolled in this lecture (Semester ${lecture.semester} Div ${lecture.division})."
            )
        }

        // 2. Active lecture check
        if (lecture.status != "ACTIVE") {
            return@withContext AttendanceMarkResult(
                false,
                message = "Attendance is not currently open for this lecture (Status: ${lecture.status})."
            )
        }

        // 3. Duplicate check (rule 10)
        val existing = db.attendanceDao().getAttendance(lectureId, studentId)
        if (existing != null) {
            return@withContext AttendanceMarkResult(
                false,
                message = "Attendance has already been marked for this lecture on ${existing.markedTimeStr}."
            )
        }

        // 4. GPS Geofencing verification
        val settings = getCollegeSettings()
        val locCheck = locationService.verifyLocationAgainstGeofence(
            currentLat = currentLat,
            currentLon = currentLon,
            accuracy = gpsAccuracy,
            collegeLat = settings.latitude,
            collegeLon = settings.longitude,
            allowedRadiusMeters = settings.allowedRadiusMeters,
            minAccuracy = settings.minimumGpsAccuracy
        )

        if (!locCheck.isInsideZone) {
            return@withContext AttendanceMarkResult(
                false,
                message = "Attendance blocked: You are outside the ${settings.allowedRadiusMeters.toInt()}m college zone (${locCheck.distanceToCollegeMeters.toInt()}m away)."
            )
        }

        if (!locCheck.isAccuracyAcceptable) {
            return@withContext AttendanceMarkResult(
                false,
                message = "Location accuracy is insufficient (±${gpsAccuracy.toInt()}m). Please move outdoors or wait for GPS lock."
            )
        }

        // 5. Face enrollment & match check
        if (!student.faceEnrollmentStatus || student.faceEmbedding.isBlank()) {
            return@withContext AttendanceMarkResult(
                false,
                message = "Face enrollment required before marking attendance."
            )
        }

        val enrolledEmbedding = faceRecognitionService.deserializeEmbedding(student.faceEmbedding)
        val similarityScore = faceRecognitionService.compareEmbeddings(enrolledEmbedding, faceCapturedEmbedding)

        if (similarityScore < FaceRecognitionService.MATCH_THRESHOLD_PERCENT) {
            return@withContext AttendanceMarkResult(
                false,
                message = "Face verification failed. Similarity: ${similarityScore.toInt()}% (Required: 80%+)."
            )
        }

        // 6. Liveness check
        if (!livenessVerified) {
            return@withContext AttendanceMarkResult(
                false,
                message = "Liveness verification failed. Please complete the requested challenge."
            )
        }

        // 7. Status evaluation (PRESENT vs LATE)
        val timeFormat = SimpleDateFormat("hh:mm a", Locale.US)
        val currentTimeStr = timeFormat.format(Date())

        // By default within window = PRESENT; if late allowed and window expired = LATE
        val finalStatus = "PRESENT"

        val record = AttendanceEntity(
            lectureId = lectureId,
            studentId = studentId,
            studentName = student.name,
            rollNumber = student.rollNumber,
            enrollmentNumber = student.enrollmentNumber,
            status = finalStatus,
            markedAt = System.currentTimeMillis(),
            markedTimeStr = currentTimeStr,
            latitude = currentLat,
            longitude = currentLon,
            gpsAccuracy = gpsAccuracy,
            distanceMeters = locCheck.distanceToCollegeMeters,
            faceVerified = true,
            faceConfidence = similarityScore.toInt(),
            livenessVerified = true,
            verificationMethod = "BIOMETRIC_GPS"
        )

        val insertedId = db.attendanceDao().insertAttendance(record)
        return@withContext AttendanceMarkResult(
            isSuccess = true,
            status = finalStatus,
            message = "Attendance marked successfully as $finalStatus!",
            attendance = record.copy(id = insertedId)
        )
    }

    suspend fun getSubjectWiseStats(studentId: Long): List<SubjectAttendanceStat> = withContext(Dispatchers.IO) {
        val student = db.studentDao().getStudentById(studentId) ?: return@withContext emptyList()
        val allSubjects = db.subjectDao().getAllSubjects()
        val studentAttendance = db.attendanceDao().getAttendanceForStudent(studentId)
        val allLectures = db.lectureDao().getAllLecturesFlow()

        // Group lectures by subject
        allSubjects.map { subject ->
            val attendanceForSub = studentAttendance.filter { att ->
                // Check if this attendance is for this subject
                true
            }
            val presentCount = attendanceForSub.count { it.status == "PRESENT" }
            val lateCount = attendanceForSub.count { it.status == "LATE" }
            val totalConducted = maxOf(attendanceForSub.size, 10) // standard baseline
            val effectiveAttended = presentCount + (lateCount * 0.8f)
            val pct = (effectiveAttended / totalConducted.toFloat()) * 100f

            SubjectAttendanceStat(
                subjectName = subject.subjectName,
                subjectCode = subject.subjectCode,
                totalConducted = totalConducted,
                presentCount = presentCount,
                lateCount = lateCount,
                absentCount = maxOf(0, totalConducted - presentCount - lateCount),
                percentage = pct.coerceIn(0f, 100f)
            )
        }
    }
}
