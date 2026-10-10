export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  platform: string;
  browser: string;
  ipAddress: string;
  ipSimulated?: string;
  registeredAt?: number;
}

/**
 * Returns deterministic IP address for student / enrollment, or browser host IP
 */
export function getSimulatedIpAddress(enrollmentNumber?: string): string {
  if (enrollmentNumber) {
    const sum = enrollmentNumber.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const subNet = 100 + (sum % 150);
    const host = 10 + ((sum * 7) % 240);
    return `192.168.${subNet}.${host}`;
  }
  let storedIp = localStorage.getItem('sca_device_ip_address');
  if (!storedIp) {
    const octet3 = 10 + Math.floor(Math.random() * 50);
    const octet4 = 20 + Math.floor(Math.random() * 200);
    storedIp = `192.168.${octet3}.${octet4}`;
    localStorage.setItem('sca_device_ip_address', storedIp);
  }
  return storedIp;
}

export function getDeviceInfo(enrollmentNumber?: string): DeviceInfo {
  let deviceId = localStorage.getItem('sca_device_fingerprint_id');
  if (!deviceId) {
    deviceId = `DEV-SSIT-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    localStorage.setItem('sca_device_fingerprint_id', deviceId);
  }

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : 'Browser';
  let deviceName = 'Student Laptop (Chrome)';
  let platform = 'Desktop Web';
  let browser = 'Chrome';

  if (/iPhone|iPad|iPod/i.test(ua)) {
    deviceName = 'Apple iPhone / iOS';
    platform = 'Mobile iOS';
    browser = 'Safari Mobile';
  } else if (/Android/i.test(ua)) {
    deviceName = 'Android Smartphone';
    platform = 'Mobile Android';
    browser = 'Chrome Mobile';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    deviceName = 'MacBook Pro (macOS)';
    platform = 'macOS';
    browser = 'Safari / Chrome';
  } else if (/Windows/i.test(ua)) {
    deviceName = 'Windows PC (Chrome / Edge)';
    platform = 'Windows 11';
    browser = 'Chrome Browser';
  } else if (/Linux/i.test(ua)) {
    deviceName = 'Linux Workstation';
    platform = 'Linux';
    browser = 'Firefox / Chrome';
  }

  const ipAddress = getSimulatedIpAddress(enrollmentNumber);

  return {
    deviceId,
    deviceName,
    platform,
    browser,
    ipAddress,
    ipSimulated: ipAddress
  };
}

/**
 * Generates an authentic SVG avatar representation of a student's facial biometric record
 */
export function generateStudentFaceSvg(name: string, enrollmentNumber: string): string {
  const colors = ['#1d4ed8', '#4338ca', '#047857', '#b45309', '#7e22ce'];
  const hash = (name + enrollmentNumber).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const bgCol = colors[Math.abs(hash) % colors.length];
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map(p => p[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'ST';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgCol}" />
        <stop offset="100%" stop-color="#0f172a" />
      </linearGradient>
      <linearGradient id="glow" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.6"/>
        <stop offset="100%" stop-color="#38bdf8" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect width="240" height="240" rx="32" fill="#f8fafc"/>
    <rect x="6" y="6" width="228" height="228" rx="28" fill="url(#grad)"/>
    <!-- Biometric Face Oval Guide -->
    <ellipse cx="120" cy="105" rx="52" ry="65" fill="#ffffff" fill-opacity="0.12" stroke="#38bdf8" stroke-width="2.5" stroke-dasharray="6 3"/>
    <!-- Face Silhouette -->
    <circle cx="120" cy="95" r="42" fill="#ffffff" fill-opacity="0.95"/>
    <path d="M50 216 C50 165, 190 165, 190 216 Z" fill="#ffffff" fill-opacity="0.88"/>
    <!-- Facial initials -->
    <text x="120" y="105" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="30" font-weight="900" fill="${bgCol}" text-anchor="middle" dominant-baseline="middle">${initials}</text>
    <!-- Biometric Crosshair & Landmark Points -->
    <circle cx="102" cy="85" r="3.5" fill="#0284c7"/>
    <circle cx="138" cy="85" r="3.5" fill="#0284c7"/>
    <circle cx="120" cy="105" r="2.5" fill="#0284c7"/>
    <line x1="90" y1="125" x2="150" y2="125" stroke="#0284c7" stroke-width="2" stroke-linecap="round"/>
    <line x1="120" y1="25" x2="120" y2="40" stroke="#38bdf8" stroke-width="3"/>
    <line x1="120" y1="170" x2="120" y2="185" stroke="#38bdf8" stroke-width="3"/>
    <line x1="45" y1="105" x2="60" y2="105" stroke="#38bdf8" stroke-width="3"/>
    <line x1="180" y1="105" x2="195" y2="105" stroke="#38bdf8" stroke-width="3"/>
    <!-- Watermark Badge -->
    <rect x="30" y="196" width="180" height="26" rx="13" fill="#0f172a" fill-opacity="0.9" stroke="#38bdf8" stroke-width="1.5"/>
    <text x="120" y="213" font-family="monospace" font-size="10" font-weight="bold" fill="#38bdf8" text-anchor="middle">BIOMETRIC FACE RECORD</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
