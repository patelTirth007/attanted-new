package com.example.service

import android.annotation.SuppressLint
import android.content.Context
import android.location.Location
import android.location.LocationManager
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.sqrt

data class LocationCheckResult(
    val latitude: Double,
    val longitude: Double,
    val accuracy: Float,
    val distanceToCollegeMeters: Double,
    val allowedRadiusMeters: Double,
    val isInsideZone: Boolean,
    val isAccuracyAcceptable: Boolean,
    val errorMessage: String? = null
)

class LocationService(private val context: Context) {

    private val fusedLocationClient = LocationServices.getFusedLocationProviderClient(context)

    companion object {
        fun calculateHaversineDistanceMeters(
            lat1: Double,
            lon1: Double,
            lat2: Double,
            lon2: Double
        ): Double {
            val r = 6371000.0 // Earth radius in meters
            val dLat = Math.toRadians(lat2 - lat1)
            val dLon = Math.toRadians(lon2 - lon1)
            val a = sin(dLat / 2) * sin(dLat / 2) +
                    cos(Math.toRadians(lat1)) * cos(Math.toRadians(lat2)) *
                    sin(dLon / 2) * sin(dLon / 2)
            val c = 2 * atan2(sqrt(a), sqrt(1 - a))
            return r * c
        }
    }

    @SuppressLint("MissingPermission")
    suspend fun getCurrentLocation(): Location? {
        return try {
            val cts = CancellationTokenSource()
            suspendCancellableCoroutine { continuation ->
                fusedLocationClient.getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY, cts.token)
                    .addOnSuccessListener { loc ->
                        if (loc != null) {
                            continuation.resume(loc)
                        } else {
                            // Fallback to last known location or system location manager
                            fallbackSystemLocation(continuation)
                        }
                    }
                    .addOnFailureListener {
                        fallbackSystemLocation(continuation)
                    }
                continuation.invokeOnCancellation {
                    cts.cancel()
                }
            }
        } catch (e: Exception) {
            null
        }
    }

    @SuppressLint("MissingPermission")
    private fun fallbackSystemLocation(continuation: kotlin.coroutines.Continuation<Location?>) {
        try {
            val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
            val gpsLoc = locationManager?.getLastKnownLocation(LocationManager.GPS_PROVIDER)
            val netLoc = locationManager?.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)
            val best = gpsLoc ?: netLoc
            continuation.resume(best)
        } catch (e: Exception) {
            continuation.resume(null)
        }
    }

    fun verifyLocationAgainstGeofence(
        currentLat: Double,
        currentLon: Double,
        accuracy: Float,
        collegeLat: Double,
        collegeLon: Double,
        allowedRadiusMeters: Double = 2000.0,
        minAccuracy: Float = 50.0f
    ): LocationCheckResult {
        val distance = calculateHaversineDistanceMeters(
            currentLat, currentLon,
            collegeLat, collegeLon
        )
        val isInside = distance <= allowedRadiusMeters
        val isAccurate = accuracy <= minAccuracy || accuracy <= 150.0f

        val error = when {
            !isInside -> "You are outside the allowed ${allowedRadiusMeters.toInt()}m college attendance zone. Distance: ${distance.toInt()}m"
            accuracy > 150.0f -> "Location accuracy is insufficient (±${accuracy.toInt()}m). Please move to an open area."
            else -> null
        }

        return LocationCheckResult(
            latitude = currentLat,
            longitude = currentLon,
            accuracy = accuracy,
            distanceToCollegeMeters = distance,
            allowedRadiusMeters = allowedRadiusMeters,
            isInsideZone = isInside,
            isAccuracyAcceptable = isAccurate,
            errorMessage = error
        )
    }
}
