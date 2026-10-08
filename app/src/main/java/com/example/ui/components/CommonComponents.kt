package com.example.ui.components

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.view.ViewGroup
import androidx.camera.core.CameraSelector
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.example.service.LocationCheckResult
import com.example.ui.theme.*

@Composable
fun StatusBadge(status: String, modifier: Modifier = Modifier) {
    val (bg, textColor, icon) = when (status.uppercase()) {
        "PRESENT" -> Triple(SuccessGreenBg, SuccessGreen, Icons.Default.CheckCircle)
        "LATE" -> Triple(WarningAmberBg, WarningAmber, Icons.Default.Schedule)
        "ABSENT" -> Triple(ErrorRedBg, ErrorRed, Icons.Default.Cancel)
        "EXCUSED" -> Triple(InfoBlueBg, InfoBlue, Icons.Default.Info)
        "MANUALLY_CORRECTED" -> Triple(Color(0xFFF3E8FF), Color(0xFF9333EA), Icons.Default.EditNote)
        else -> Triple(Slate100, Slate700, Icons.Default.Help)
    }

    Surface(
        color = bg,
        shape = RoundedCornerShape(16.dp),
        modifier = modifier
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = status,
                tint = textColor,
                modifier = Modifier.size(14.dp)
            )
            Spacer(modifier = Modifier.width(4.dp))
            Text(
                text = status,
                color = textColor,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
fun GeofenceStatusCard(
    result: LocationCheckResult?,
    collegeLat: Double,
    collegeLon: Double,
    allowedRadiusMeters: Double,
    onSimulateLocation: ((Double) -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val isInside = result?.isInsideZone ?: true
    val distance = result?.distanceToCollegeMeters ?: 450.0
    val accuracy = result?.accuracy ?: 12.0f

    Card(
        colors = CardDefaults.cardColors(
            containerColor = if (isInside) Color.White else ErrorRedBg
        ),
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = modifier
            .fillMaxWidth()
            .border(
                1.dp,
                if (isInside) SuccessGreen.copy(alpha = 0.5f) else ErrorRed,
                RoundedCornerShape(16.dp)
            )
            .testTag("geofence_status_card")
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = if (isInside) Icons.Default.LocationOn else Icons.Default.LocationOff,
                        contentDescription = "GPS Zone",
                        tint = if (isInside) SuccessGreen else ErrorRed,
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = if (isInside) "INSIDE COLLEGE ZONE" else "OUTSIDE COLLEGE ZONE",
                        fontWeight = FontWeight.Bold,
                        color = if (isInside) SuccessGreen else ErrorRed,
                        fontSize = 14.sp
                    )
                }

                Surface(
                    color = if (isInside) SuccessGreenBg else ErrorRed.copy(alpha = 0.1f),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(
                        text = "${distance.toInt()}m / ${allowedRadiusMeters.toInt()}m",
                        color = if (isInside) SuccessGreen else ErrorRed,
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))
            Divider(color = Slate200)
            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text("College Coordinates", fontSize = 11.sp, color = Slate600)
                    Text(
                        "%.4f, %.4f".format(collegeLat, collegeLon),
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 12.sp
                    )
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text("GPS Accuracy", fontSize = 11.sp, color = Slate600)
                    Text("±${accuracy.toInt()} meters", fontWeight = FontWeight.SemiBold, fontSize = 12.sp)
                }
            }

            if (!isInside) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "⚠️ Attendance cannot be marked because you are outside the 2 KM college attendance zone.",
                    color = ErrorRed,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium
                )
            }

            // Quick emulator testing controls
            if (onSimulateLocation != null) {
                Spacer(modifier = Modifier.height(12.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedButton(
                        onClick = { onSimulateLocation(450.0) },
                        modifier = Modifier.weight(1f).testTag("simulate_inside_button"),
                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text("Simulate Inside (450m)", fontSize = 11.sp)
                    }
                    OutlinedButton(
                        onClick = { onSimulateLocation(3200.0) },
                        modifier = Modifier.weight(1f).testTag("simulate_outside_button"),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = ErrorRed),
                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text("Simulate Outside (3.2km)", fontSize = 11.sp)
                    }
                }
            }
        }
    }
}

@Composable
fun CameraFaceScanner(
    currentChallengeText: String,
    statusText: String,
    isVerified: Boolean,
    onCaptureFrame: (Bitmap) -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    var hasCameraSupport by remember { mutableStateOf(true) }

    // Creates sample face bitmap for analysis
    fun generateSampleBitmap(): Bitmap {
        val bmp = Bitmap.createBitmap(320, 320, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bmp)
        val paint = Paint()
        paint.color = android.graphics.Color.rgb(225, 230, 240)
        canvas.drawRect(0f, 0f, 320f, 320f, paint)
        paint.color = android.graphics.Color.rgb(50, 80, 150)
        canvas.drawCircle(160f, 160f, 90f, paint)
        return bmp
    }

    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(280.dp)
            .clip(RoundedCornerShape(20.dp))
            .background(Slate900)
            .testTag("camera_face_scanner"),
        contentAlignment = Alignment.Center
    ) {
        // CameraX Preview
        AndroidView(
            factory = { ctx ->
                val previewView = PreviewView(ctx).apply {
                    layoutParams = ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                    )
                }

                try {
                    val cameraProviderFuture = ProcessCameraProvider.getInstance(ctx)
                    cameraProviderFuture.addListener({
                        try {
                            val cameraProvider = cameraProviderFuture.get()
                            val preview = Preview.Builder().build().also {
                                it.setSurfaceProvider(previewView.surfaceProvider)
                            }
                            val cameraSelector = CameraSelector.DEFAULT_FRONT_CAMERA
                            cameraProvider.unbindAll()
                            cameraProvider.bindToLifecycle(lifecycleOwner, cameraSelector, preview)
                        } catch (e: Exception) {
                            hasCameraSupport = false
                        }
                    }, ContextCompat.getMainExecutor(ctx))
                } catch (e: Exception) {
                    hasCameraSupport = false
                }
                previewView
            },
            modifier = Modifier.fillMaxSize()
        )

        // Face Guide Oval Overlay
        Box(
            modifier = Modifier
                .size(width = 170.dp, height = 220.dp)
                .border(
                    width = if (isVerified) 3.dp else 2.dp,
                    color = if (isVerified) SuccessGreen else CollegePrimaryLight.copy(alpha = 0.8f),
                    shape = RoundedCornerShape(85.dp)
                )
        )

        // Challenge Banner at top
        Surface(
            color = CollegeNavy.copy(alpha = 0.85f),
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier
                .align(Alignment.TopCenter)
                .padding(top = 12.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Face,
                    contentDescription = null,
                    tint = if (isVerified) SuccessGreen else CollegePrimaryLight,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = currentChallengeText,
                    color = Color.White,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        // Status pill at bottom
        Surface(
            color = if (isVerified) SuccessGreen else Slate800.copy(alpha = 0.9f),
            shape = RoundedCornerShape(20.dp),
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 12.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp)
            ) {
                if (isVerified) {
                    Icon(
                        imageVector = Icons.Default.CheckCircle,
                        contentDescription = "Verified",
                        tint = Color.White,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                } else {
                    CircularProgressIndicator(
                        modifier = Modifier.size(14.dp),
                        strokeWidth = 2.dp,
                        color = CollegePrimaryLight
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                }
                Text(
                    text = statusText,
                    color = Color.White,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium
                )
            }
        }

        // Trigger / Capture button to evaluate face
        IconButton(
            onClick = {
                onCaptureFrame(generateSampleBitmap())
            },
            modifier = Modifier
                .align(Alignment.CenterEnd)
                .padding(end = 8.dp)
                .background(CollegePrimary.copy(alpha = 0.7f), CircleShape)
                .testTag("capture_frame_button")
        ) {
            Icon(
                imageVector = Icons.Default.CameraAlt,
                contentDescription = "Capture Frame",
                tint = Color.White
            )
        }
    }
}
