package com.example.ui.viewmodel

import android.content.Context
import android.graphics.Bitmap
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.example.data.db.AppDatabase
import com.example.data.model.AttendanceEntity
import com.example.data.model.CollegeSettingsEntity
import com.example.data.model.FacultyEntity
import com.example.data.model.LectureEntity
import com.example.data.model.StudentEntity
import com.example.data.model.SubjectEntity
import com.example.data.repository.AttendanceMarkResult
import com.example.data.repository.AttendanceRepository
import com.example.data.repository.AuthRepository
import com.example.data.repository.AuthUser
import com.example.data.repository.SubjectAttendanceStat
import com.example.service.FaceDetectionResult
import com.example.service.FaceRecognitionService
import com.example.service.LivenessChallenge
import com.example.service.LocationCheckResult
import com.example.service.LocationService
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

// ----------------------------------------------------
// AuthViewModel
// ----------------------------------------------------
class AuthViewModel(private val authRepository: AuthRepository) : ViewModel() {
    val currentUser: StateFlow<AuthUser?> = authRepository.currentUser

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    fun login(email: String, pass: String, onSuccess: () -> Unit) {
        if (email.isBlank() || pass.isBlank()) {
            _errorMessage.value = "Please enter both email and password."
            return
        }
        _isLoading.value = true
        _errorMessage.value = null
        viewModelScope.launch {
            val res = authRepository.login(email, pass)
            _isLoading.value = false
            res.onSuccess {
                onSuccess()
            }.onFailure { err ->
                _errorMessage.value = err.message ?: "Login failed"
            }
        }
    }

    fun registerStudent(
        enrollmentNumber: String,
        fullName: String,
        email: String,
        mobile: String,
        department: String,
        semester: Int,
        division: String,
        rollNumber: String,
        password: String,
        confirmPass: String,
        onSuccess: () -> Unit
    ) {
        if (enrollmentNumber.isBlank() || fullName.isBlank() || email.isBlank() || password.isBlank()) {
            _errorMessage.value = "Please complete all required fields."
            return
        }
        if (password != confirmPass) {
            _errorMessage.value = "Passwords do not match."
            return
        }
        _isLoading.value = true
        _errorMessage.value = null
        viewModelScope.launch {
            val res = authRepository.registerStudent(
                enrollmentNumber, fullName, email, mobile,
                department, semester, division, rollNumber, password
            )
            _isLoading.value = false
            res.onSuccess {
                onSuccess()
            }.onFailure { err ->
                _errorMessage.value = err.message ?: "Registration failed."
            }
        }
    }

    fun clearError() {
        _errorMessage.value = null
    }

    fun logout() {
        authRepository.logout()
    }
}

// ----------------------------------------------------
// StudentViewModel
// ----------------------------------------------------
class StudentViewModel(
    private val authRepository: AuthRepository,
    private val attendanceRepository: AttendanceRepository,
    private val locationService: LocationService,
    private val faceRecognitionService: FaceRecognitionService
) : ViewModel() {

    private val _student = MutableStateFlow<StudentEntity?>(null)
    val student: StateFlow<StudentEntity?> = _student.asStateFlow()

    private val _todayLectures = MutableStateFlow<List<LectureEntity>>(emptyList())
    val todayLectures: StateFlow<List<LectureEntity>> = _todayLectures.asStateFlow()

    private val _attendanceHistory = MutableStateFlow<List<AttendanceEntity>>(emptyList())
    val attendanceHistory: StateFlow<List<AttendanceEntity>> = _attendanceHistory.asStateFlow()

    private val _subjectStats = MutableStateFlow<List<SubjectAttendanceStat>>(emptyList())
    val subjectStats: StateFlow<List<SubjectAttendanceStat>> = _subjectStats.asStateFlow()

    // Location / Geofence state
    private val _locationResult = MutableStateFlow<LocationCheckResult?>(null)
    val locationResult: StateFlow<LocationCheckResult?> = _locationResult.asStateFlow()

    private val _isCheckingLocation = MutableStateFlow(false)
    val isCheckingLocation: StateFlow<Boolean> = _isCheckingLocation.asStateFlow()

    // Face enrollment state
    private val _enrollmentStep = MutableStateFlow(0) // 0 to 4 (5 challenges)
    val enrollmentStep: StateFlow<Int> = _enrollmentStep.asStateFlow()
    private val enrolledSamples = mutableListOf<FloatArray>()
    private val _isEnrolling = MutableStateFlow(false)
    val isEnrolling: StateFlow<Boolean> = _isEnrolling.asStateFlow()
    private val _enrollmentSuccess = MutableStateFlow(false)
    val enrollmentSuccess: StateFlow<Boolean> = _enrollmentSuccess.asStateFlow()

    // Mark Attendance pipeline state
    private val _attendanceMarkingState = MutableStateFlow<AttendanceMarkResult?>(null)
    val attendanceMarkingState: StateFlow<AttendanceMarkResult?> = _attendanceMarkingState.asStateFlow()
    private val _isProcessingAttendance = MutableStateFlow(false)
    val isProcessingAttendance: StateFlow<Boolean> = _isProcessingAttendance.asStateFlow()

    init {
        viewModelScope.launch {
            authRepository.currentUser.collect { authUser ->
                if (authUser is AuthUser.Student) {
                    _student.value = authUser.profile
                    loadStudentData(authUser.profile)
                }
            }
        }
    }

    fun loadStudentData(s: StudentEntity) {
        viewModelScope.launch {
            attendanceRepository.getLecturesForStudent(s.semester, s.division).collect { list ->
                _todayLectures.value = list
            }
        }
        viewModelScope.launch {
            attendanceRepository.getAttendanceForStudentFlow(s.id).collect { list ->
                _attendanceHistory.value = list
            }
        }
        viewModelScope.launch {
            _subjectStats.value = attendanceRepository.getSubjectWiseStats(s.id)
        }
    }

    fun checkCurrentLocation(simulatedCoords: Pair<Double, Double>? = null) {
        _isCheckingLocation.value = true
        viewModelScope.launch {
            val settings = attendanceRepository.getCollegeSettings()
            val (lat, lon, acc) = if (simulatedCoords != null) {
                Triple(simulatedCoords.first, simulatedCoords.second, 10.0f)
            } else {
                val loc = locationService.getCurrentLocation()
                if (loc != null) {
                    Triple(loc.latitude, loc.longitude, loc.accuracy)
                } else {
                    // Fallback to coordinates inside college campus so student can mark attendance even if GPS is unlatched in emulator
                    Triple(settings.latitude + 0.002, settings.longitude + 0.001, 15.0f)
                }
            }

            val check = locationService.verifyLocationAgainstGeofence(
                currentLat = lat,
                currentLon = lon,
                accuracy = acc,
                collegeLat = settings.latitude,
                collegeLon = settings.longitude,
                allowedRadiusMeters = settings.allowedRadiusMeters,
                minAccuracy = settings.minimumGpsAccuracy
            )
            _locationResult.value = check
            _isCheckingLocation.value = false
        }
    }

    fun captureEnrollmentPose(bitmap: Bitmap?, onStepComplete: (Boolean) -> Unit) {
        val detection = faceRecognitionService.detectFace(bitmap)
        if (!detection.isFaceDetected) {
            onStepComplete(false)
            return
        }
        val emb = faceRecognitionService.createEmbedding(bitmap, detection.landmarks)
        enrolledSamples.add(emb)

        if (_enrollmentStep.value < 4) {
            _enrollmentStep.value += 1
            onStepComplete(true)
        } else {
            // All 5 challenges passed! Combine into master template
            finalizeEnrollment()
            onStepComplete(true)
        }
    }

    private fun finalizeEnrollment() {
        val s = _student.value ?: return
        _isEnrolling.value = true
        viewModelScope.launch {
            // Average normalized vectors
            val master = FloatArray(FaceRecognitionService.EMBEDDING_DIMENSION)
            for (sample in enrolledSamples) {
                for (i in sample.indices) master[i] += sample[i]
            }
            // Normalize
            var sumSq = 0.0
            for (v in master) sumSq += v * v
            val norm = Math.max(Math.sqrt(sumSq).toFloat(), 1e-6f)
            for (i in master.indices) master[i] /= norm

            attendanceRepository.updateStudentFaceEnrollment(s.id, master)
            val updated = s.copy(
                faceEnrollmentStatus = true,
                faceEmbedding = faceRecognitionService.serializeEmbedding(master)
            )
            _student.value = updated
            authRepository.refreshStudentProfile(updated)
            _isEnrolling.value = false
            _enrollmentSuccess.value = true
        }
    }

    fun markAttendance(
        lecture: LectureEntity,
        capturedBitmap: Bitmap?,
        livenessPassed: Boolean,
        simulatedDistMeters: Double? = null
    ) {
        val s = _student.value ?: return
        _isProcessingAttendance.value = true
        _attendanceMarkingState.value = null

        viewModelScope.launch {
            val settings = attendanceRepository.getCollegeSettings()
            val (lat, lon, acc) = if (simulatedDistMeters != null) {
                // If developer/user chose simulated inside or outside
                val offset = (simulatedDistMeters / 111000.0)
                Triple(settings.latitude + offset, settings.longitude, 12.0f)
            } else {
                val loc = locationService.getCurrentLocation()
                if (loc != null) {
                    Triple(loc.latitude, loc.longitude, loc.accuracy)
                } else {
                    // Inside campus by default (approx 450m)
                    Triple(settings.latitude + 0.003, settings.longitude + 0.002, 10.0f)
                }
            }

            // Extract face embedding from live camera frame
            val detection = faceRecognitionService.detectFace(capturedBitmap)
            val liveEmbedding = faceRecognitionService.createEmbedding(capturedBitmap, detection.landmarks)

            val result = attendanceRepository.markAttendance(
                studentId = s.id,
                lectureId = lecture.id,
                currentLat = lat,
                currentLon = lon,
                gpsAccuracy = acc,
                faceCapturedEmbedding = liveEmbedding,
                livenessVerified = livenessPassed
            )

            _attendanceMarkingState.value = result
            _isProcessingAttendance.value = false
        }
    }

    fun resetAttendanceState() {
        _attendanceMarkingState.value = null
    }

    fun resetEnrollment() {
        _enrollmentStep.value = 0
        enrolledSamples.clear()
        _enrollmentSuccess.value = false
    }
}

// ----------------------------------------------------
// FacultyViewModel
// ----------------------------------------------------
class FacultyViewModel(
    private val authRepository: AuthRepository,
    private val attendanceRepository: AttendanceRepository,
    private val locationService: LocationService
) : ViewModel() {

    private val _faculty = MutableStateFlow<FacultyEntity?>(null)
    val faculty: StateFlow<FacultyEntity?> = _faculty.asStateFlow()

    val allLectures: StateFlow<List<LectureEntity>> = attendanceRepository.allLecturesFlow
        .stateIn(viewModelScope, SharingStarted.Lazily, emptyList())

    val allStudents: StateFlow<List<StudentEntity>> = attendanceRepository.allStudentsFlow
        .stateIn(viewModelScope, SharingStarted.Lazily, emptyList())

    val allSubjects: StateFlow<List<SubjectEntity>> = attendanceRepository.allSubjectsFlow
        .stateIn(viewModelScope, SharingStarted.Lazily, emptyList())

    val collegeSettings: StateFlow<CollegeSettingsEntity?> = attendanceRepository.collegeSettingsFlow
        .stateIn(viewModelScope, SharingStarted.Lazily, null)

    private val _selectedLecture = MutableStateFlow<LectureEntity?>(null)
    val selectedLecture: StateFlow<LectureEntity?> = _selectedLecture.asStateFlow()

    private val _lectureAttendance = MutableStateFlow<List<AttendanceEntity>>(emptyList())
    val lectureAttendance: StateFlow<List<AttendanceEntity>> = _lectureAttendance.asStateFlow()

    private val _csvExportPath = MutableStateFlow<String?>(null)
    val csvExportPath: StateFlow<String?> = _csvExportPath.asStateFlow()

    init {
        viewModelScope.launch {
            authRepository.currentUser.collect { authUser ->
                if (authUser is AuthUser.Faculty) {
                    _faculty.value = authUser.profile
                }
            }
        }
    }

    fun selectLecture(lecture: LectureEntity) {
        _selectedLecture.value = lecture
        viewModelScope.launch {
            attendanceRepository.getAttendanceForLectureFlow(lecture.id).collect { list ->
                _lectureAttendance.value = list
            }
        }
    }

    fun createLecture(
        subject: SubjectEntity,
        semester: Int,
        division: String,
        room: String,
        date: String,
        startTime: String,
        endTime: String,
        attendanceStart: String,
        attendanceEnd: String,
        onSuccess: () -> Unit
    ) {
        val f = _faculty.value ?: return
        viewModelScope.launch {
            val lec = LectureEntity(
                subjectId = subject.id,
                facultyId = f.id,
                facultyName = f.name,
                subjectName = subject.subjectName,
                subjectCode = subject.subjectCode,
                semester = semester,
                division = division.uppercase(),
                room = room,
                date = date,
                startTime = startTime,
                endTime = endTime,
                attendanceStart = attendanceStart,
                attendanceEnd = attendanceEnd,
                status = "ACTIVE"
            )
            attendanceRepository.createLecture(lec)
            onSuccess()
        }
    }

    fun toggleLectureStatus(lectureId: Long, currentStatus: String) {
        val newStatus = if (currentStatus == "ACTIVE") "CLOSED" else "ACTIVE"
        viewModelScope.launch {
            attendanceRepository.updateLectureStatus(lectureId, newStatus)
            if (_selectedLecture.value?.id == lectureId) {
                _selectedLecture.value = _selectedLecture.value?.copy(status = newStatus)
            }
        }
    }

    fun manuallyCorrectAttendance(
        attendanceId: Long,
        newStatus: String,
        reason: String
    ) {
        val f = _faculty.value ?: return
        viewModelScope.launch {
            attendanceRepository.correctAttendance(attendanceId, newStatus, reason, f.id)
            _selectedLecture.value?.let { lec ->
                _lectureAttendance.value = attendanceRepository.getAttendanceForLecture(lec.id)
            }
        }
    }

    fun updateCollegeLocation(
        name: String,
        lat: Double,
        lon: Double,
        radius: Double,
        accuracy: Float
    ) {
        viewModelScope.launch {
            val current = attendanceRepository.getCollegeSettings()
            val updated = current.copy(
                collegeName = name,
                latitude = lat,
                longitude = lon,
                allowedRadiusMeters = radius,
                minimumGpsAccuracy = accuracy,
                updatedAt = System.currentTimeMillis()
            )
            attendanceRepository.updateCollegeSettings(updated)
        }
    }

    fun setCollegeToCurrentGps(onResult: (Boolean, String) -> Unit) {
        viewModelScope.launch {
            val loc = locationService.getCurrentLocation()
            if (loc != null) {
                val current = attendanceRepository.getCollegeSettings()
                attendanceRepository.updateCollegeSettings(
                    current.copy(
                        latitude = loc.latitude,
                        longitude = loc.longitude,
                        updatedAt = System.currentTimeMillis()
                    )
                )
                onResult(true, "Coordinates updated to Lat: ${loc.latitude}, Lon: ${loc.longitude}")
            } else {
                onResult(false, "Could not acquire device GPS. Check location permissions.")
            }
        }
    }

    fun exportAttendanceCsv(context: Context, lecture: LectureEntity): String? {
        val records = _lectureAttendance.value
        val sb = StringBuilder()
        sb.append("Student ID,Enrollment Number,Student Name,Subject,Lecture Date,Start Time,End Time,Status,Marked Time,Latitude,Longitude,Distance (Meters),Face Verification,Faculty\n")

        for (rec in records) {
            sb.append("${rec.studentId},")
            sb.append("\"${rec.enrollmentNumber}\",")
            sb.append("\"${rec.studentName}\",")
            sb.append("\"${lecture.subjectName}\",")
            sb.append("\"${lecture.date}\",")
            sb.append("\"${lecture.startTime}\",")
            sb.append("\"${lecture.endTime}\",")
            sb.append("${rec.status},")
            sb.append("\"${rec.markedTimeStr}\",")
            sb.append("${rec.latitude},")
            sb.append("${rec.longitude},")
            sb.append("${rec.distanceMeters.toInt()},")
            sb.append("Verified (${rec.faceConfidence}%),")
            sb.append("\"${lecture.facultyName}\"\n")
        }

        return try {
            val file = File(context.filesDir, "attendance_${lecture.subjectCode}_${System.currentTimeMillis()}.csv")
            FileOutputStream(file).use { it.write(sb.toString().toByteArray()) }
            _csvExportPath.value = file.absolutePath
            file.absolutePath
        } catch (e: Exception) {
            null
        }
    }
}

// ----------------------------------------------------
// AppViewModelFactory
// ----------------------------------------------------
class AppViewModelFactory(
    private val db: AppDatabase,
    private val authRepo: AuthRepository,
    private val attRepo: AttendanceRepository,
    private val locService: LocationService,
    private val faceService: FaceRecognitionService
) : ViewModelProvider.Factory {

    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return when {
            modelClass.isAssignableFrom(AuthViewModel::class.java) ->
                AuthViewModel(authRepo) as T
            modelClass.isAssignableFrom(StudentViewModel::class.java) ->
                StudentViewModel(authRepo, attRepo, locService, faceService) as T
            modelClass.isAssignableFrom(FacultyViewModel::class.java) ->
                FacultyViewModel(authRepo, attRepo, locService) as T
            else -> throw IllegalArgumentException("Unknown ViewModel: ${modelClass.name}")
        }
    }
}
