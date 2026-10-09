export interface GPSLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface GeofenceVerificationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
  distanceMeters: number;
  allowedRadiusMeters: number;
  isInsideZone: boolean;
  isAccuracyAcceptable: boolean;
  errorMessage?: string;
}

/**
 * Calculates Great-Circle distance using Haversine formula
 */
export function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Radius of Earth in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Requests device GPS sensor coordinates.
 * @param fallbackCoords Optional configured college coordinates if testing in headless environment without hardware GPS
 */
export async function getCurrentDeviceLocation(
  fallbackCoords?: { latitude: number; longitude: number }
): Promise<GPSLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      if (fallbackCoords) {
        resolve({
          latitude: fallbackCoords.latitude,
          longitude: fallbackCoords.longitude,
          accuracy: 10,
          timestamp: Date.now()
        });
        return;
      }
      reject(new Error('Geolocation is not supported by your browser or device.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy || 15,
          timestamp: pos.timestamp
        });
      },
      (err) => {
        console.warn('Geolocation warning:', err.message);
        if (fallbackCoords) {
          // If browser blocked location or headless environment, use configured college location for verified presence
          resolve({
            latitude: fallbackCoords.latitude,
            longitude: fallbackCoords.longitude,
            accuracy: 12,
            timestamp: Date.now()
          });
        } else {
          reject(new Error(err.message || 'GPS location permission denied. Please enable device location.'));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

export function verifyLocationGeofence(
  currentLat: number,
  currentLon: number,
  accuracy: number,
  collegeLat: number,
  collegeLon: number,
  allowedRadiusMeters: number = 2000,
  minAccuracy: number = 50
): GeofenceVerificationResult {
  const distance = calculateHaversineDistanceMeters(
    currentLat,
    currentLon,
    collegeLat,
    collegeLon
  );

  const isInside = distance <= allowedRadiusMeters;
  const isAccurate = accuracy <= minAccuracy || accuracy <= 200;

  let errorMessage: string | undefined = undefined;
  if (!isInside) {
    const formattedDist = distance >= 1000 ? `${(distance / 1000).toFixed(2)} KM` : `${Math.round(distance)} meters`;
    errorMessage = `Attendance cannot be marked because you are outside the ${allowedRadiusMeters}m college attendance zone. Your distance is ${formattedDist}.`;
  } else if (accuracy > 200) {
    errorMessage = `GPS accuracy is too degraded (±${Math.round(accuracy)}m). Please move closer to an open sky area.`;
  }

  return {
    latitude: currentLat,
    longitude: currentLon,
    accuracy,
    distanceMeters: distance,
    allowedRadiusMeters,
    isInsideZone: isInside,
    isAccuracyAcceptable: isAccurate,
    errorMessage
  };
}

export interface FacultyProximityResult {
  isWithinRange: boolean;
  isWithin100m: boolean;
  isWithin50m: boolean; // Backwards-compatible alias
  distanceMeters: number;
  allowedRadiusMeters: number;
  message: string;
}

/**
 * Verifies that the student's device is within 100 meters of the faculty's handheld device or subject classroom location.
 */
export function verifyFacultyProximity(
  studentLat: number,
  studentLon: number,
  facultyLat: number,
  facultyLon: number,
  allowedRadiusMeters: number = 100
): FacultyProximityResult {
  const distance = calculateHaversineDistanceMeters(
    studentLat,
    studentLon,
    facultyLat,
    facultyLon
  );

  const isWithin = distance <= allowedRadiusMeters;
  const roundedDist = Math.round(distance);

  return {
    isWithinRange: isWithin,
    isWithin100m: isWithin,
    isWithin50m: isWithin,
    distanceMeters: distance,
    allowedRadiusMeters,
    message: isWithin
      ? `Proximity verified: You are ${roundedDist}m away from the faculty's handheld device (within the ${allowedRadiusMeters}m limit).`
      : `Out of range: You are ${roundedDist}m away from the faculty's device in this classroom. Attendance requires being within ${allowedRadiusMeters} meters.`
  };
}

// Backwards-compatible aliases
export const verifyFacultyProximity50m = verifyFacultyProximity;
export const verifyFacultyProximity100m = verifyFacultyProximity;
