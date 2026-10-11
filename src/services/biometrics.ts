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
 * Generates an SVG avatar for a student with their initials and academic styling
 */
export function generateStudentAvatarSvg(name: string, enrollmentNumber: string): string {
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
      <linearGradient id="avatarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgCol}" />
        <stop offset="100%" stop-color="#0f172a" />
      </linearGradient>
    </defs>
    <rect width="240" height="240" rx="32" fill="#f8fafc"/>
    <rect x="6" y="6" width="228" height="228" rx="28" fill="url(#avatarGrad)"/>
    <circle cx="120" cy="100" r="50" fill="#ffffff" fill-opacity="0.15"/>
    <text x="120" y="105" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="44" font-weight="900" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${initials}</text>
    <rect x="36" y="172" width="168" height="32" rx="16" fill="#ffffff" fill-opacity="0.95"/>
    <text x="120" y="193" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="12" font-weight="bold" fill="#0f172a" text-anchor="middle">${enrollmentNumber}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
