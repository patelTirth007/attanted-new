package com.example.data.db

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.example.data.dao.AttendanceDao
import com.example.data.dao.CollegeSettingsDao
import com.example.data.dao.FacultyDao
import com.example.data.dao.LectureDao
import com.example.data.dao.StudentDao
import com.example.data.dao.SubjectDao
import com.example.data.dao.UserDao
import com.example.data.model.AttendanceEntity
import com.example.data.model.CollegeSettingsEntity
import com.example.data.model.FacultyEntity
import com.example.data.model.LectureEntity
import com.example.data.model.StudentEntity
import com.example.data.model.SubjectEntity
import com.example.data.model.UserEntity

@Database(
    entities = [
        UserEntity::class,
        StudentEntity::class,
        FacultyEntity::class,
        SubjectEntity::class,
        LectureEntity::class,
        AttendanceEntity::class,
        CollegeSettingsEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
    abstract fun studentDao(): StudentDao
    abstract fun facultyDao(): FacultyDao
    abstract fun subjectDao(): SubjectDao
    abstract fun lectureDao(): LectureDao
    abstract fun attendanceDao(): AttendanceDao
    abstract fun collegeSettingsDao(): CollegeSettingsDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "college_attendance.db"
                ).fallbackToDestructiveMigration().build()
                INSTANCE = instance
                instance
            }
        }
    }
}
