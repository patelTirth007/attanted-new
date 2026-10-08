package com.example

import android.Manifest
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.data.db.AppDatabase
import com.example.data.db.DatabaseInitializer
import com.example.data.model.LectureEntity
import com.example.data.repository.AttendanceRepository
import com.example.data.repository.AuthRepository
import com.example.data.repository.AuthUser
import com.example.service.FaceRecognitionService
import com.example.service.LocationService
import com.example.ui.screens.*
import com.example.ui.theme.MyApplicationTheme
import com.example.ui.theme.Slate50
import com.example.ui.viewmodel.AppViewModelFactory
import com.example.ui.viewmodel.AuthViewModel
import com.example.ui.viewmodel.FacultyViewModel
import com.example.ui.viewmodel.StudentViewModel
import kotlinx.coroutines.launch

sealed class Screen {
    object Login : Screen()
    object Register : Screen()
    object StudentDashboard : Screen()
    object StudentFaceEnrollment : Screen()
    data class StudentMarkAttendance(val lecture: LectureEntity) : Screen()
    object StudentHistory : Screen()
    object StudentAnalytics : Screen()

    object FacultyDashboard : Screen()
    object FacultyCreateLecture : Screen()
    data class FacultyLiveAttendance(val lecture: LectureEntity) : Screen()
    object FacultyStudentsList : Screen()
    object FacultyReports : Screen()
    object FacultySettings : Screen()
}

class MainActivity : ComponentActivity() {

    private lateinit var database: AppDatabase
    private lateinit var locationService: LocationService
    private lateinit var faceService: FaceRecognitionService
    private lateinit var authRepository: AuthRepository
    private lateinit var attendanceRepository: AttendanceRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        database = AppDatabase.getInstance(this)
        locationService = LocationService(this)
        faceService = FaceRecognitionService()
        authRepository = AuthRepository(database)
        attendanceRepository = AttendanceRepository(database, locationService, faceService)

        // Seed 100+ students, default college coordinates, subjects, and sample lectures
        lifecycleScope.launch {
            DatabaseInitializer.seedDatabaseIfEmpty(database)
        }

        setContent {
            MyApplicationTheme {
                // Request camera and location permissions gracefully
                val permissionLauncher = rememberLauncherForActivityResult(
                    contract = ActivityResultContracts.RequestMultiplePermissions()
                ) { /* permissions evaluated */ }

                LaunchedEffect(Unit) {
                    permissionLauncher.launch(
                        arrayOf(
                            Manifest.permission.CAMERA,
                            Manifest.permission.ACCESS_FINE_LOCATION,
                            Manifest.permission.ACCESS_COARSE_LOCATION
                        )
                    )
                }

                val factory = remember {
                    AppViewModelFactory(
                        database,
                        authRepository,
                        attendanceRepository,
                        locationService,
                        faceService
                    )
                }

                val authViewModel: AuthViewModel = viewModel(factory = factory)
                val studentViewModel: StudentViewModel = viewModel(factory = factory)
                val facultyViewModel: FacultyViewModel = viewModel(factory = factory)

                var currentScreen by remember { mutableStateOf<Screen>(Screen.Login) }
                val currentUser by authViewModel.currentUser.collectAsState()

                // Route based on logged-in user state
                LaunchedEffect(currentUser) {
                    when (val user = currentUser) {
                        is AuthUser.Student -> {
                            if (!user.profile.faceEnrollmentStatus) {
                                currentScreen = Screen.StudentFaceEnrollment
                            } else {
                                currentScreen = Screen.StudentDashboard
                            }
                        }
                        is AuthUser.Faculty -> {
                            currentScreen = Screen.FacultyDashboard
                        }
                        null -> {
                            if (currentScreen !is Screen.Register) {
                                currentScreen = Screen.Login
                            }
                        }
                    }
                }

                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = Slate50
                ) {
                    when (val screen = currentScreen) {
                        is Screen.Login -> {
                            LoginScreen(
                                authViewModel = authViewModel,
                                onNavigateToRegister = { currentScreen = Screen.Register },
                                onLoginSuccess = { /* Navigation handled by LaunchedEffect */ }
                            )
                        }

                        is Screen.Register -> {
                            BackHandler { currentScreen = Screen.Login }
                            RegisterScreen(
                                authViewModel = authViewModel,
                                onNavigateBack = { currentScreen = Screen.Login },
                                onRegistrationSuccess = {
                                    currentScreen = Screen.StudentFaceEnrollment
                                }
                            )
                        }

                        is Screen.StudentFaceEnrollment -> {
                            BackHandler {
                                if (currentUser != null) {
                                    currentScreen = Screen.StudentDashboard
                                } else {
                                    currentScreen = Screen.Login
                                }
                            }
                            FaceEnrollmentScreen(
                                studentViewModel = studentViewModel,
                                onEnrollmentComplete = {
                                    currentScreen = Screen.StudentDashboard
                                }
                            )
                        }

                        is Screen.StudentDashboard -> {
                            StudentDashboardScreen(
                                studentViewModel = studentViewModel,
                                onNavigateToMarkAttendance = { lecture ->
                                    currentScreen = Screen.StudentMarkAttendance(lecture)
                                },
                                onNavigateToEnrollment = {
                                    currentScreen = Screen.StudentFaceEnrollment
                                },
                                onNavigateToHistory = {
                                    currentScreen = Screen.StudentHistory
                                },
                                onNavigateToAnalytics = {
                                    currentScreen = Screen.StudentAnalytics
                                },
                                onLogout = {
                                    authViewModel.logout()
                                    currentScreen = Screen.Login
                                }
                            )
                        }

                        is Screen.StudentMarkAttendance -> {
                            BackHandler { currentScreen = Screen.StudentDashboard }
                            MarkAttendanceScreen(
                                lecture = screen.lecture,
                                studentViewModel = studentViewModel,
                                onNavigateBack = { currentScreen = Screen.StudentDashboard }
                            )
                        }

                        is Screen.StudentHistory -> {
                            BackHandler { currentScreen = Screen.StudentDashboard }
                            StudentHistoryScreen(
                                studentViewModel = studentViewModel,
                                onNavigateBack = { currentScreen = Screen.StudentDashboard }
                            )
                        }

                        is Screen.StudentAnalytics -> {
                            BackHandler { currentScreen = Screen.StudentDashboard }
                            StudentAnalyticsScreen(
                                studentViewModel = studentViewModel,
                                onNavigateBack = { currentScreen = Screen.StudentDashboard }
                            )
                        }

                        is Screen.FacultyDashboard -> {
                            FacultyDashboardScreen(
                                facultyViewModel = facultyViewModel,
                                onCreateLecture = { currentScreen = Screen.FacultyCreateLecture },
                                onOpenLiveAttendance = { lecture ->
                                    currentScreen = Screen.FacultyLiveAttendance(lecture)
                                },
                                onNavigateToStudents = { currentScreen = Screen.FacultyStudentsList },
                                onNavigateToReports = { currentScreen = Screen.FacultyReports },
                                onNavigateToSettings = { currentScreen = Screen.FacultySettings },
                                onLogout = {
                                    authViewModel.logout()
                                    currentScreen = Screen.Login
                                }
                            )
                        }

                        is Screen.FacultyCreateLecture -> {
                            BackHandler { currentScreen = Screen.FacultyDashboard }
                            CreateLectureScreen(
                                facultyViewModel = facultyViewModel,
                                onNavigateBack = { currentScreen = Screen.FacultyDashboard },
                                onCreated = { currentScreen = Screen.FacultyDashboard }
                            )
                        }

                        is Screen.FacultyLiveAttendance -> {
                            BackHandler { currentScreen = Screen.FacultyDashboard }
                            LiveAttendanceScreen(
                                lecture = screen.lecture,
                                facultyViewModel = facultyViewModel,
                                onNavigateBack = { currentScreen = Screen.FacultyDashboard }
                            )
                        }

                        is Screen.FacultyStudentsList -> {
                            BackHandler { currentScreen = Screen.FacultyDashboard }
                            StudentsListScreen(
                                facultyViewModel = facultyViewModel,
                                onNavigateBack = { currentScreen = Screen.FacultyDashboard }
                            )
                        }

                        is Screen.FacultyReports -> {
                            BackHandler { currentScreen = Screen.FacultyDashboard }
                            FacultyReportsScreen(
                                facultyViewModel = facultyViewModel,
                                onNavigateBack = { currentScreen = Screen.FacultyDashboard }
                            )
                        }

                        is Screen.FacultySettings -> {
                            BackHandler { currentScreen = Screen.FacultyDashboard }
                            CollegeSettingsScreen(
                                facultyViewModel = facultyViewModel,
                                onNavigateBack = { currentScreen = Screen.FacultyDashboard }
                            )
                        }
                    }
                }
            }
        }
    }
}
