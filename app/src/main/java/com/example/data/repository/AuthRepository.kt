package com.example.data.repository

import com.example.data.db.AppDatabase
import com.example.data.db.DatabaseInitializer
import com.example.data.model.FacultyEntity
import com.example.data.model.StudentEntity
import com.example.data.model.UserEntity
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext

sealed class AuthUser {
    data class Student(val user: UserEntity, val profile: StudentEntity) : AuthUser()
    data class Faculty(val user: UserEntity, val profile: FacultyEntity) : AuthUser()
}

class AuthRepository(private val db: AppDatabase) {

    private val _currentUser = MutableStateFlow<AuthUser?>(null)
    val currentUser: StateFlow<AuthUser?> = _currentUser.asStateFlow()

    suspend fun login(email: String, pass: String): Result<AuthUser> = withContext(Dispatchers.IO) {
        val user = db.userDao().getUserByEmail(email.trim().lowercase())
            ?: return@withContext Result.failure(Exception("No account found with this email address."))

        val hash = DatabaseInitializer.hashPassword(pass)
        if (user.passwordHash != hash) {
            return@withContext Result.failure(Exception("Invalid password. Please check your credentials."))
        }

        val authUser = when (user.role) {
            "STUDENT" -> {
                val student = db.studentDao().getStudentByUserId(user.id)
                    ?: return@withContext Result.failure(Exception("Student profile record not found."))
                AuthUser.Student(user, student)
            }
            "FACULTY", "ADMIN" -> {
                val faculty = db.facultyDao().getFacultyByUserId(user.id)
                    ?: return@withContext Result.failure(Exception("Faculty profile record not found."))
                AuthUser.Faculty(user, faculty)
            }
            else -> return@withContext Result.failure(Exception("Unknown user role."))
        }

        _currentUser.value = authUser
        Result.success(authUser)
    }

    suspend fun registerStudent(
        enrollmentNumber: String,
        fullName: String,
        email: String,
        mobile: String,
        department: String,
        semester: Int,
        division: String,
        rollNumber: String,
        password: String
    ): Result<AuthUser.Student> = withContext(Dispatchers.IO) {
        val cleanEmail = email.trim().lowercase()
        val existing = db.userDao().getUserByEmail(cleanEmail)
        if (existing != null) {
            return@withContext Result.failure(Exception("An account with this email already exists."))
        }

        val existingEnrollment = db.studentDao().getStudentByEnrollment(enrollmentNumber.trim())
        if (existingEnrollment != null) {
            return@withContext Result.failure(Exception("A student with Enrollment $enrollmentNumber is already registered."))
        }

        val hash = DatabaseInitializer.hashPassword(password)
        val userId = db.userDao().insertUser(
            UserEntity(email = cleanEmail, passwordHash = hash, role = "STUDENT")
        )

        val studentEntity = StudentEntity(
            userId = userId,
            enrollmentNumber = enrollmentNumber.trim(),
            name = fullName.trim(),
            department = department.trim(),
            semester = semester,
            division = division.trim().uppercase(),
            rollNumber = rollNumber.trim(),
            phone = mobile.trim(),
            faceEnrollmentStatus = false,
            faceEmbedding = ""
        )

        val studentId = db.studentDao().insertStudent(studentEntity)
        val fullStudent = studentEntity.copy(id = studentId)
        val authUser = AuthUser.Student(
            user = UserEntity(id = userId, email = cleanEmail, passwordHash = hash, role = "STUDENT"),
            profile = fullStudent
        )
        _currentUser.value = authUser
        Result.success(authUser)
    }

    fun logout() {
        _currentUser.value = null
    }

    fun refreshStudentProfile(updated: StudentEntity) {
        val current = _currentUser.value
        if (current is AuthUser.Student) {
            _currentUser.value = AuthUser.Student(current.user, updated)
        }
    }
}
