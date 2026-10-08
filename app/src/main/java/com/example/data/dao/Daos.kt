package com.example.data.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.example.data.model.AttendanceEntity
import com.example.data.model.CollegeSettingsEntity
import com.example.data.model.FacultyEntity
import com.example.data.model.LectureEntity
import com.example.data.model.StudentEntity
import com.example.data.model.SubjectEntity
import com.example.data.model.UserEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface UserDao {
    @Insert(onConflict = OnConflictStrategy.ABORT)
    suspend fun insertUser(user: UserEntity): Long

    @Query("SELECT * FROM users WHERE email = :email LIMIT 1")
    suspend fun getUserByEmail(email: String): UserEntity?

    @Query("SELECT * FROM users WHERE id = :id LIMIT 1")
    suspend fun getUserById(id: Long): UserEntity?
}

@Dao
interface StudentDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertStudent(student: StudentEntity): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAllStudents(students: List<StudentEntity>)

    @Query("SELECT * FROM students WHERE userId = :userId LIMIT 1")
    suspend fun getStudentByUserId(userId: Long): StudentEntity?

    @Query("SELECT * FROM students WHERE id = :id LIMIT 1")
    suspend fun getStudentById(id: Long): StudentEntity?

    @Query("SELECT * FROM students WHERE enrollmentNumber = :enrollmentNumber LIMIT 1")
    suspend fun getStudentByEnrollment(enrollmentNumber: String): StudentEntity?

    @Query("SELECT * FROM students ORDER BY rollNumber ASC")
    fun getAllStudentsFlow(): Flow<List<StudentEntity>>

    @Query("SELECT * FROM students ORDER BY rollNumber ASC")
    suspend fun getAllStudents(): List<StudentEntity>

    @Query("SELECT * FROM students WHERE semester = :semester AND division = :division ORDER BY rollNumber ASC")
    suspend fun getStudentsBySemesterAndDivision(semester: Int, division: String): List<StudentEntity>

    @Query("SELECT COUNT(*) FROM students")
    suspend fun getStudentCount(): Int

    @Query("UPDATE students SET faceEnrollmentStatus = :status, faceEmbedding = :embedding WHERE id = :studentId")
    suspend fun updateFaceEnrollment(studentId: Long, status: Boolean, embedding: String)
}

@Dao
interface FacultyDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertFaculty(faculty: FacultyEntity): Long

    @Query("SELECT * FROM faculty WHERE userId = :userId LIMIT 1")
    suspend fun getFacultyByUserId(userId: Long): FacultyEntity?

    @Query("SELECT * FROM faculty WHERE id = :id LIMIT 1")
    suspend fun getFacultyById(id: Long): FacultyEntity?

    @Query("SELECT * FROM faculty")
    suspend fun getAllFaculty(): List<FacultyEntity>
}

@Dao
interface SubjectDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSubject(subject: SubjectEntity): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAllSubjects(subjects: List<SubjectEntity>)

    @Query("SELECT * FROM subjects ORDER BY subjectName ASC")
    fun getAllSubjectsFlow(): Flow<List<SubjectEntity>>

    @Query("SELECT * FROM subjects ORDER BY subjectName ASC")
    suspend fun getAllSubjects(): List<SubjectEntity>

    @Query("SELECT * FROM subjects WHERE id = :id LIMIT 1")
    suspend fun getSubjectById(id: Long): SubjectEntity?
}

@Dao
interface LectureDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertLecture(lecture: LectureEntity): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAllLectures(lectures: List<LectureEntity>)

    @Query("SELECT * FROM lectures WHERE id = :id LIMIT 1")
    suspend fun getLectureById(id: Long): LectureEntity?

    @Query("SELECT * FROM lectures ORDER BY id DESC")
    fun getAllLecturesFlow(): Flow<List<LectureEntity>>

    @Query("SELECT * FROM lectures WHERE semester = :semester AND division = :division ORDER BY id DESC")
    fun getLecturesForStudentFlow(semester: Int, division: String): Flow<List<LectureEntity>>

    @Query("SELECT * FROM lectures WHERE facultyId = :facultyId ORDER BY id DESC")
    fun getLecturesByFacultyFlow(facultyId: Long): Flow<List<LectureEntity>>

    @Query("SELECT * FROM lectures WHERE status = 'ACTIVE'")
    suspend fun getActiveLectures(): List<LectureEntity>

    @Query("UPDATE lectures SET status = :status WHERE id = :lectureId")
    suspend fun updateLectureStatus(lectureId: Long, status: String)
}

@Dao
interface AttendanceDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAttendance(attendance: AttendanceEntity): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAllAttendance(list: List<AttendanceEntity>)

    @Update
    suspend fun updateAttendance(attendance: AttendanceEntity)

    @Query("SELECT * FROM attendance WHERE lectureId = :lectureId AND studentId = :studentId LIMIT 1")
    suspend fun getAttendance(lectureId: Long, studentId: Long): AttendanceEntity?

    @Query("SELECT * FROM attendance WHERE lectureId = :lectureId ORDER BY rollNumber ASC")
    fun getAttendanceForLectureFlow(lectureId: Long): Flow<List<AttendanceEntity>>

    @Query("SELECT * FROM attendance WHERE lectureId = :lectureId ORDER BY rollNumber ASC")
    suspend fun getAttendanceForLecture(lectureId: Long): List<AttendanceEntity>

    @Query("SELECT * FROM attendance WHERE studentId = :studentId ORDER BY markedAt DESC")
    fun getAttendanceForStudentFlow(studentId: Long): Flow<List<AttendanceEntity>>

    @Query("SELECT * FROM attendance WHERE studentId = :studentId ORDER BY markedAt DESC")
    suspend fun getAttendanceForStudent(studentId: Long): List<AttendanceEntity>

    @Query("SELECT * FROM attendance ORDER BY markedAt DESC")
    fun getAllAttendanceFlow(): Flow<List<AttendanceEntity>>

    @Query("SELECT * FROM attendance ORDER BY markedAt DESC")
    suspend fun getAllAttendance(): List<AttendanceEntity>

    @Query("SELECT COUNT(*) FROM attendance WHERE lectureId = :lectureId AND status = 'PRESENT'")
    suspend fun countPresentForLecture(lectureId: Long): Int

    @Query("SELECT COUNT(*) FROM attendance WHERE lectureId = :lectureId AND status = 'LATE'")
    suspend fun countLateForLecture(lectureId: Long): Int

    @Query("SELECT COUNT(*) FROM attendance")
    suspend fun getTotalAttendanceCount(): Int
}

@Dao
interface CollegeSettingsDao {
    @Query("SELECT * FROM college_settings WHERE id = 1 LIMIT 1")
    fun getSettingsFlow(): Flow<CollegeSettingsEntity?>

    @Query("SELECT * FROM college_settings WHERE id = 1 LIMIT 1")
    suspend fun getSettings(): CollegeSettingsEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveSettings(settings: CollegeSettingsEntity)
}
