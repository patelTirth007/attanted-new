package com.example.ui.screens

import android.content.Context
import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.AttendanceEntity
import com.example.data.model.CollegeSettingsEntity
import com.example.data.model.LectureEntity
import com.example.data.model.StudentEntity
import com.example.data.model.SubjectEntity
import com.example.ui.components.StatusBadge
import com.example.ui.theme.*
import com.example.ui.viewmodel.FacultyViewModel
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

// -------------------------------------------------------------------------
// Faculty Dashboard Screen
// -------------------------------------------------------------------------
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FacultyDashboardScreen(
    facultyViewModel: FacultyViewModel,
    onCreateLecture: () -> Unit,
    onOpenLiveAttendance: (LectureEntity) -> Unit,
    onNavigateToStudents: () -> Unit,
    onNavigateToReports: () -> Unit,
    onNavigateToSettings: () -> Unit,
    onLogout: () -> Unit
) {
    val faculty by facultyViewModel.faculty.collectAsState()
    val allLectures by facultyViewModel.allLectures.collectAsState()
    val allStudents by facultyViewModel.allStudents.collectAsState()
    val collegeSettings by facultyViewModel.collegeSettings.collectAsState()

    val activeLecturesCount = allLectures.count { it.status == "ACTIVE" }

    Scaffold(
        containerColor = Slate50,
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Faculty Portal", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                        Text(
                            text = "${faculty?.name ?: "Professor"} • ${faculty?.department ?: ""}",
                            fontSize = 11.sp,
                            color = Slate600
                        )
                    }
                },
                actions = {
                    IconButton(onClick = onNavigateToSettings) {
                        Icon(Icons.Default.Settings, contentDescription = "Settings", tint = Slate700)
                    }
                    IconButton(onClick = onNavigateToReports) {
                        Icon(Icons.Default.Assessment, contentDescription = "Reports", tint = Slate700)
                    }
                    IconButton(onClick = onNavigateToStudents) {
                        Icon(Icons.Default.People, contentDescription = "Students", tint = Slate700)
                    }
                    IconButton(onClick = onLogout) {
                        Icon(Icons.Default.Logout, contentDescription = "Logout", tint = Slate700)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = onCreateLecture,
                containerColor = CollegePrimary,
                contentColor = Color.White,
                icon = { Icon(Icons.Default.Add, contentDescription = null) },
                text = { Text("+ CREATE LECTURE", fontWeight = FontWeight.Bold) },
                modifier = Modifier.testTag("create_lecture_fab")
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item { Spacer(modifier = Modifier.height(4.dp)) }

            // College Campus & Geofence Quick Banner
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    shape = RoundedCornerShape(16.dp),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                    modifier = Modifier.fillMaxWidth().clickable { onNavigateToSettings() }
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            color = InfoBlueBg,
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.size(44.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(Icons.Default.LocationOn, contentDescription = null, tint = CollegePrimary)
                            }
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = collegeSettings?.collegeName ?: "College Campus",
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp
                            )
                            Text(
                                text = "Geofence Radius: ${collegeSettings?.allowedRadiusMeters?.toInt() ?: 2000}m • Accuracy <= ${collegeSettings?.minimumGpsAccuracy?.toInt() ?: 50}m",
                                fontSize = 11.sp,
                                color = Slate600
                            )
                        }
                        Icon(Icons.Default.ChevronRight, contentDescription = null, tint = Slate600)
                    }
                }
            }

            // Overview Metric Cards
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = CollegeNavy),
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Text("Enrolled Students", color = Slate200, fontSize = 11.sp)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "${allStudents.size}",
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                fontSize = 24.sp
                            )
                            Text("100+ Batch Ready", color = SuccessGreen, fontSize = 10.sp)
                        }
                    }

                    Card(
                        colors = CardDefaults.cardColors(containerColor = CollegePrimary),
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Text("Active Lectures", color = Color.White.copy(alpha = 0.8f), fontSize = 11.sp)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "$activeLecturesCount",
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                fontSize = 24.sp
                            )
                            Text("Live Window Open", color = Color.White, fontSize = 10.sp)
                        }
                    }
                }
            }

            // Lectures Header
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Conducted & Active Lectures",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = CollegeNavy
                    )
                    Text(
                        text = "${allLectures.size} Total",
                        fontSize = 12.sp,
                        color = Slate600
                    )
                }
            }

            if (allLectures.isEmpty()) {
                item {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier.padding(24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text("No lectures created yet.", color = Slate600)
                            Spacer(modifier = Modifier.height(8.dp))
                            Button(onClick = onCreateLecture) {
                                Text("+ Create First Lecture")
                            }
                        }
                    }
                }
            } else {
                items(allLectures) { lecture ->
                    LectureFacultyCard(
                        lecture = lecture,
                        onOpenLive = { onOpenLiveAttendance(lecture) },
                        onToggleStatus = { facultyViewModel.toggleLectureStatus(lecture.id, lecture.status) }
                    )
                }
            }

            item { Spacer(modifier = Modifier.height(72.dp)) }
        }
    }
}

@Composable
fun LectureFacultyCard(
    lecture: LectureEntity,
    onOpenLive: () -> Unit,
    onToggleStatus: () -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    color = InfoBlueBg,
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(
                        text = "${lecture.subjectCode} • Sem ${lecture.semester} Div ${lecture.division}",
                        color = CollegePrimary,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                    )
                }

                Surface(
                    color = if (lecture.status == "ACTIVE") SuccessGreenBg else Slate100,
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.clickable { onToggleStatus() }
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                    ) {
                        Text(
                            text = lecture.status,
                            color = if (lecture.status == "ACTIVE") SuccessGreen else Slate600,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Icon(
                            Icons.Default.SwapHoriz,
                            contentDescription = "Toggle status",
                            modifier = Modifier.size(12.dp),
                            tint = Slate600
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = lecture.subjectName,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = CollegeNavy
            )

            Text(
                text = "${lecture.date} | ${lecture.startTime} - ${lecture.endTime} | Room ${lecture.room}",
                fontSize = 12.sp,
                color = Slate600
            )

            Text(
                text = "Attendance Window: ${lecture.attendanceStart} – ${lecture.attendanceEnd}",
                fontSize = 11.sp,
                color = CollegePrimary,
                fontWeight = FontWeight.Medium
            )

            Spacer(modifier = Modifier.height(12.dp))

            Button(
                onClick = onOpenLive,
                colors = ButtonDefaults.buttonColors(containerColor = CollegePrimary),
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier.fillMaxWidth().testTag("live_attendance_btn_${lecture.id}")
            ) {
                Icon(Icons.Default.LiveTv, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text("OPEN LIVE ATTENDANCE DASHBOARD", fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}

// -------------------------------------------------------------------------
// Create Lecture Screen
// -------------------------------------------------------------------------
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateLectureScreen(
    facultyViewModel: FacultyViewModel,
    onNavigateBack: () -> Unit,
    onCreated: () -> Unit
) {
    val subjects by facultyViewModel.allSubjects.collectAsState()
    var selectedSubject by remember { mutableStateOf<SubjectEntity?>(null) }
    var semester by remember { mutableStateOf("5") }
    var division by remember { mutableStateOf("A") }
    var room by remember { mutableStateOf("Lab 301 - IT Block") }
    val todayDate = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
    var date by remember { mutableStateOf(todayDate) }
    var startTime by remember { mutableStateOf("09:00 AM") }
    var endTime by remember { mutableStateOf("10:00 AM") }
    var attendanceStart by remember { mutableStateOf("09:00 AM") }
    var attendanceEnd by remember { mutableStateOf("09:15 AM") }

    LaunchedEffect(subjects) {
        if (selectedSubject == null && subjects.isNotEmpty()) {
            selectedSubject = subjects[0]
        }
    }

    Scaffold(
        containerColor = Slate50,
        topBar = {
            TopAppBar(
                title = { Text("Create New Lecture", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
        ) {
            Text("Lecture Details", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = CollegeNavy)
            Text("Students can only mark attendance while attendance window is active.", fontSize = 12.sp, color = Slate600)

            Spacer(modifier = Modifier.height(16.dp))

            // Subject selector
            Text("Select Subject", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
            Spacer(modifier = Modifier.height(4.dp))
            var expanded by remember { mutableStateOf(false) }
            ExposedDropdownMenuBox(
                expanded = expanded,
                onExpandedChange = { expanded = !expanded }
            ) {
                OutlinedTextField(
                    value = "${selectedSubject?.subjectName ?: "Select Subject"} (${selectedSubject?.subjectCode ?: ""})",
                    onValueChange = {},
                    readOnly = true,
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
                    modifier = Modifier.fillMaxWidth().menuAnchor()
                )
                ExposedDropdownMenu(
                    expanded = expanded,
                    onDismissRequest = { expanded = false }
                ) {
                    subjects.forEach { sub ->
                        DropdownMenuItem(
                            text = { Text("${sub.subjectName} (${sub.subjectCode})") },
                            onClick = {
                                selectedSubject = sub
                                expanded = false
                            }
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = semester,
                    onValueChange = { semester = it },
                    label = { Text("Semester") },
                    modifier = Modifier.weight(1f)
                )
                OutlinedTextField(
                    value = division,
                    onValueChange = { division = it },
                    label = { Text("Division") },
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            OutlinedTextField(
                value = room,
                onValueChange = { room = it },
                label = { Text("Classroom / Lab") },
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(10.dp))

            OutlinedTextField(
                value = date,
                onValueChange = { date = it },
                label = { Text("Date (YYYY-MM-DD)") },
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(10.dp))

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = startTime,
                    onValueChange = { startTime = it },
                    label = { Text("Start Time") },
                    modifier = Modifier.weight(1f)
                )
                OutlinedTextField(
                    value = endTime,
                    onValueChange = { endTime = it },
                    label = { Text("End Time") },
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = attendanceStart,
                    onValueChange = { attendanceStart = it },
                    label = { Text("Att. Window Start") },
                    modifier = Modifier.weight(1f)
                )
                OutlinedTextField(
                    value = attendanceEnd,
                    onValueChange = { attendanceEnd = it },
                    label = { Text("Att. Window End") },
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            Button(
                onClick = {
                    val sub = selectedSubject ?: return@Button
                    val semInt = semester.toIntOrNull() ?: 5
                    facultyViewModel.createLecture(
                        subject = sub,
                        semester = semInt,
                        division = division,
                        room = room,
                        date = date,
                        startTime = startTime,
                        endTime = endTime,
                        attendanceStart = attendanceStart,
                        attendanceEnd = attendanceEnd,
                        onSuccess = onCreated
                    )
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp)
                    .testTag("submit_create_lecture_button"),
                colors = ButtonDefaults.buttonColors(containerColor = CollegePrimary),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text("CREATE LECTURE", fontWeight = FontWeight.Bold, fontSize = 15.sp)
            }
        }
    }
}

// -------------------------------------------------------------------------
// Live Attendance Screen (Real-time Dashboard + Manual Correction)
// -------------------------------------------------------------------------
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LiveAttendanceScreen(
    lecture: LectureEntity,
    facultyViewModel: FacultyViewModel,
    onNavigateBack: () -> Unit
) {
    val context = LocalContext.current
    val attendanceRecords by facultyViewModel.lectureAttendance.collectAsState()
    val allStudents by facultyViewModel.allStudents.collectAsState()
    val csvPath by facultyViewModel.csvExportPath.collectAsState()

    var searchQuery by remember { mutableStateOf("") }
    var selectedFilter by remember { mutableStateOf("ALL") }
    var correctingRecord by remember { mutableStateOf<AttendanceEntity?>(null) }
    var newCorrectionStatus by remember { mutableStateOf("PRESENT") }
    var correctionReason by remember { mutableStateOf("") }

    LaunchedEffect(lecture.id) {
        facultyViewModel.selectLecture(lecture)
    }

    val totalEligibleStudents = allStudents.filter {
        it.semester == lecture.semester && it.division.equals(lecture.division, ignoreCase = true)
    }.ifEmpty { allStudents.take(60) }

    val presentCount = attendanceRecords.count { it.status == "PRESENT" }
    val lateCount = attendanceRecords.count { it.status == "LATE" }
    val absentCount = maxOf(0, totalEligibleStudents.size - presentCount - lateCount)
    val attendancePercent = if (totalEligibleStudents.isNotEmpty()) {
        ((presentCount + (lateCount * 0.8f)) / totalEligibleStudents.size.toFloat()) * 100f
    } else 0f

    val filteredList = attendanceRecords.filter { rec ->
        (selectedFilter == "ALL" || rec.status == selectedFilter) &&
                (searchQuery.isBlank() ||
                        rec.studentName.contains(searchQuery, ignoreCase = true) ||
                        rec.rollNumber.contains(searchQuery) ||
                        rec.enrollmentNumber.contains(searchQuery, ignoreCase = true))
    }

    Scaffold(
        containerColor = Slate50,
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(lecture.subjectName, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        Text("${lecture.startTime} - ${lecture.endTime} • ${lecture.room}", fontSize = 11.sp, color = Slate600)
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = {
                        val path = facultyViewModel.exportAttendanceCsv(context, lecture)
                        if (path != null) {
                            Toast.makeText(context, "CSV exported: $path", Toast.LENGTH_LONG).show()
                        }
                    }) {
                        Icon(Icons.Default.FileDownload, contentDescription = "Export CSV", tint = CollegePrimary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
        ) {
            // Live Metric Cards
            Card(
                colors = CardDefaults.cardColors(containerColor = CollegeNavy),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Live Attendance Rate", color = Slate200, fontSize = 12.sp)
                        Text(
                            text = "%.1f%%".format(attendancePercent),
                            color = SuccessGreen,
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))
                    Divider(color = Slate700)
                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text("Total", color = Slate200, fontSize = 11.sp)
                            Text("${totalEligibleStudents.size}", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        }
                        Column {
                            Text("Present", color = Slate200, fontSize = 11.sp)
                            Text("$presentCount", color = SuccessGreen, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        }
                        Column {
                            Text("Late", color = Slate200, fontSize = 11.sp)
                            Text("$lateCount", color = WarningAmber, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        }
                        Column {
                            Text("Absent", color = Slate200, fontSize = 11.sp)
                            Text("$absentCount", color = ErrorRed, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Search Bar & Filter Chips
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text("Search by name, roll no, enrollment...") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )

            Spacer(modifier = Modifier.height(8.dp))

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf("ALL", "PRESENT", "LATE").forEach { f ->
                    FilterChip(
                        selected = selectedFilter == f,
                        onClick = { selectedFilter = f },
                        label = { Text(f) }
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Student Attendance List
            if (filteredList.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("No records match your criteria.", color = Slate600)
                }
            } else {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    items(filteredList) { rec ->
                        Card(
                            colors = CardDefaults.cardColors(containerColor = Color.White),
                            shape = RoundedCornerShape(12.dp),
                            elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier.padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Surface(
                                    color = InfoBlueBg,
                                    shape = RoundedCornerShape(8.dp),
                                    modifier = Modifier.size(36.dp)
                                ) {
                                    Box(contentAlignment = Alignment.Center) {
                                        Text(rec.rollNumber, fontWeight = FontWeight.Bold, fontSize = 13.sp, color = CollegePrimary)
                                    }
                                }

                                Spacer(modifier = Modifier.width(10.dp))

                                Column(modifier = Modifier.weight(1f)) {
                                    Text(rec.studentName, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                    Text(
                                        "${rec.enrollmentNumber} • Marked: ${rec.markedTimeStr}",
                                        fontSize = 11.sp,
                                        color = Slate600
                                    )
                                    Text(
                                        "Face: ${rec.faceConfidence}% • GPS: ${rec.distanceMeters.toInt()}m",
                                        fontSize = 11.sp,
                                        color = SuccessGreen
                                    )
                                }

                                StatusBadge(status = rec.status)

                                IconButton(onClick = { correctingRecord = rec }) {
                                    Icon(Icons.Default.Edit, contentDescription = "Correct", tint = Slate600, modifier = Modifier.size(18.dp))
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Manual Correction Dialog
    if (correctingRecord != null) {
        val target = correctingRecord!!
        AlertDialog(
            onDismissRequest = { correctingRecord = null },
            title = { Text("Manual Attendance Correction", fontWeight = FontWeight.Bold) },
            text = {
                Column {
                    Text("Student: ${target.studentName} (${target.enrollmentNumber})", fontSize = 13.sp)
                    Spacer(modifier = Modifier.height(10.dp))
                    Text("Change Status To:", fontWeight = FontWeight.SemiBold, fontSize = 12.sp)

                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        listOf("PRESENT", "LATE", "EXCUSED").forEach { st ->
                            FilterChip(
                                selected = newCorrectionStatus == st,
                                onClick = { newCorrectionStatus = st },
                                label = { Text(st) }
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    OutlinedTextField(
                        value = correctionReason,
                        onValueChange = { correctionReason = it },
                        label = { Text("Faculty Reason *") },
                        placeholder = { Text("e.g. Verified physical presence") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        facultyViewModel.manuallyCorrectAttendance(
                            attendanceId = target.id,
                            newStatus = newCorrectionStatus,
                            reason = correctionReason
                        )
                        correctingRecord = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = CollegePrimary)
                ) {
                    Text("UPDATE")
                }
            },
            dismissButton = {
                TextButton(onClick = { correctingRecord = null }) {
                    Text("CANCEL")
                }
            }
        )
    }
}

// -------------------------------------------------------------------------
// 100+ Enrolled Students Directory Screen
// -------------------------------------------------------------------------
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudentsListScreen(
    facultyViewModel: FacultyViewModel,
    onNavigateBack: () -> Unit
) {
    val allStudents by facultyViewModel.allStudents.collectAsState()
    var searchQuery by remember { mutableStateOf("") }
    var divisionFilter by remember { mutableStateOf("ALL") }

    val filteredList = allStudents.filter { s ->
        (divisionFilter == "ALL" || s.division == divisionFilter) &&
                (searchQuery.isBlank() ||
                        s.name.contains(searchQuery, ignoreCase = true) ||
                        s.enrollmentNumber.contains(searchQuery, ignoreCase = true) ||
                        s.rollNumber.contains(searchQuery))
    }

    Scaffold(
        containerColor = Slate50,
        topBar = {
            TopAppBar(
                title = { Text("Enrolled Students (${allStudents.size})", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
        ) {
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text("Search by name or enrollment...") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )

            Spacer(modifier = Modifier.height(8.dp))

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf("ALL", "A", "B").forEach { div ->
                    FilterChip(
                        selected = divisionFilter == div,
                        onClick = { divisionFilter = div },
                        label = { Text("Div $div") }
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(filteredList) { student ->
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Surface(
                                color = InfoBlueBg,
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.size(34.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Text(student.rollNumber, fontWeight = FontWeight.Bold, color = CollegePrimary, fontSize = 12.sp)
                                }
                            }

                            Spacer(modifier = Modifier.width(10.dp))

                            Column(modifier = Modifier.weight(1f)) {
                                Text(student.name, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                Text("${student.enrollmentNumber} • Div ${student.division} • ${student.department}", fontSize = 11.sp, color = Slate600)
                            }

                            Surface(
                                color = if (student.faceEnrollmentStatus) SuccessGreenBg else WarningAmberBg,
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text(
                                    text = if (student.faceEnrollmentStatus) "Face Enrolled" else "Pending",
                                    color = if (student.faceEnrollmentStatus) SuccessGreen else WarningAmber,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

// -------------------------------------------------------------------------
// Faculty Reports & Export Screen
// -------------------------------------------------------------------------
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FacultyReportsScreen(
    facultyViewModel: FacultyViewModel,
    onNavigateBack: () -> Unit
) {
    val context = LocalContext.current
    val lectures by facultyViewModel.allLectures.collectAsState()
    var selectedLecture by remember { mutableStateOf<LectureEntity?>(null) }

    LaunchedEffect(lectures) {
        if (selectedLecture == null && lectures.isNotEmpty()) {
            selectedLecture = lectures[0]
        }
    }

    Scaffold(
        containerColor = Slate50,
        topBar = {
            TopAppBar(
                title = { Text("Attendance Reports", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
        ) {
            Text("Generate & Export CSV Report", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = CollegeNavy)
            Text("Download lecture-wise attendance logs with GPS coordinates and Face verification status.", fontSize = 12.sp, color = Slate600)

            Spacer(modifier = Modifier.height(16.dp))

            LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                items(lectures) { lec ->
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(lec.subjectName, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                Text("${lec.date} • ${lec.startTime} • Div ${lec.division}", fontSize = 11.sp, color = Slate600)
                            }

                            Button(
                                onClick = {
                                    val path = facultyViewModel.exportAttendanceCsv(context, lec)
                                    Toast.makeText(context, "Exported to: $path", Toast.LENGTH_LONG).show()
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = CollegePrimary),
                                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                            ) {
                                Icon(Icons.Default.FileDownload, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("CSV", fontSize = 12.sp)
                            }
                        }
                    }
                }
            }
        }
    }
}

// -------------------------------------------------------------------------
// College Geofence Settings Screen
// -------------------------------------------------------------------------
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CollegeSettingsScreen(
    facultyViewModel: FacultyViewModel,
    onNavigateBack: () -> Unit
) {
    val context = LocalContext.current
    val settings by facultyViewModel.collegeSettings.collectAsState()

    var collegeName by remember { mutableStateOf(settings?.collegeName ?: "Gujarat Technological University") }
    var latitude by remember { mutableStateOf(settings?.latitude?.toString() ?: "23.2156") }
    var longitude by remember { mutableStateOf(settings?.longitude?.toString() ?: "72.6369") }
    var radiusMeters by remember { mutableStateOf(settings?.allowedRadiusMeters?.toString() ?: "2000.0") }
    var accuracyMeters by remember { mutableStateOf(settings?.minimumGpsAccuracy?.toString() ?: "50.0") }

    LaunchedEffect(settings) {
        settings?.let {
            collegeName = it.collegeName
            latitude = it.latitude.toString()
            longitude = it.longitude.toString()
            radiusMeters = it.allowedRadiusMeters.toString()
            accuracyMeters = it.minimumGpsAccuracy.toString()
        }
    }

    Scaffold(
        containerColor = Slate50,
        topBar = {
            TopAppBar(
                title = { Text("College Location & Geofence", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
        ) {
            Text("Admin GPS Geofence Configuration", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = CollegeNavy)
            Text("Students outside this allowed radius cannot mark attendance. Browser & device GPS will be checked against these coordinates.", fontSize = 12.sp, color = Slate600)

            Spacer(modifier = Modifier.height(16.dp))

            OutlinedTextField(
                value = collegeName,
                onValueChange = { collegeName = it },
                label = { Text("College / University Name") },
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(10.dp))

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = latitude,
                    onValueChange = { latitude = it },
                    label = { Text("Latitude") },
                    modifier = Modifier.weight(1f)
                )
                OutlinedTextField(
                    value = longitude,
                    onValueChange = { longitude = it },
                    label = { Text("Longitude") },
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = radiusMeters,
                    onValueChange = { radiusMeters = it },
                    label = { Text("Allowed Radius (meters)") },
                    modifier = Modifier.weight(1f)
                )
                OutlinedTextField(
                    value = accuracyMeters,
                    onValueChange = { accuracyMeters = it },
                    label = { Text("Min Accuracy (meters)") },
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Set to current device GPS button
            OutlinedButton(
                onClick = {
                    facultyViewModel.setCollegeToCurrentGps { success, msg ->
                        Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()
                    }
                },
                modifier = Modifier.fillMaxWidth().testTag("use_current_gps_button")
            ) {
                Icon(Icons.Default.MyLocation, contentDescription = null)
                Spacer(modifier = Modifier.width(6.dp))
                Text("Use My Current Device GPS Location")
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Presets for testing
            Text("Quick Presets for Testing:", fontWeight = FontWeight.SemiBold, fontSize = 12.sp)
            Spacer(modifier = Modifier.height(4.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(
                    onClick = {
                        latitude = "23.2156"
                        longitude = "72.6369"
                    },
                    modifier = Modifier.weight(1f)
                ) {
                    Text("Campus Gate", fontSize = 11.sp)
                }
                OutlinedButton(
                    onClick = {
                        latitude = "23.0225"
                        longitude = "72.5714"
                    },
                    modifier = Modifier.weight(1f)
                ) {
                    Text("City Center", fontSize = 11.sp)
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            Button(
                onClick = {
                    val lat = latitude.toDoubleOrNull() ?: 23.2156
                    val lon = longitude.toDoubleOrNull() ?: 72.6369
                    val rad = radiusMeters.toDoubleOrNull() ?: 2000.0
                    val acc = accuracyMeters.toFloatOrNull() ?: 50.0f
                    facultyViewModel.updateCollegeLocation(collegeName, lat, lon, rad, acc)
                    Toast.makeText(context, "Geofence settings updated!", Toast.LENGTH_SHORT).show()
                    onNavigateBack()
                },
                modifier = Modifier.fillMaxWidth().height(48.dp).testTag("save_geofence_settings_button"),
                colors = ButtonDefaults.buttonColors(containerColor = CollegePrimary),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text("SAVE GEOFENCE CONFIGURATION", fontWeight = FontWeight.Bold)
            }
        }
    }
}
