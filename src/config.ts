// ค่าตั้งค่าส่วนกลางของแอป
// API_BASE_URL อ่านจาก .env (REACT_APP_API_BASE_URL) — เปลี่ยน host ได้โดยไม่ต้องแก้โค้ด
// ค่า default ใช้ตอน dev ถ้าไม่ได้ตั้ง .env
export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || 'https://localhost:44377';

// path เวอร์ชัน API
export const API_PREFIX = '/api/v1';

export const apiUrl = (path: string) =>
  `${API_BASE_URL}${API_PREFIX}${path.startsWith('/') ? path : `/${path}`}`;
