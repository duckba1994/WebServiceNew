import { apiFetch } from './client';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResult {
  token: string;
  // เก็บ payload ดิบไว้เผื่อ API ส่งข้อมูล user มาด้วย
  raw: unknown;
}

// เรียก POST /api/v1/Auth/login
// API ตอบ accept: text/plain — รองรับทั้งกรณีตอบเป็น token string ตรง ๆ
// และกรณีตอบเป็น JSON { token / accessToken / ... }
// noAuthEvent: true — ที่นี่ 401 = รหัส/ชื่อผู้ใช้ผิด (ไม่ใช่เซสชันหมด) จึงไม่ยิง event เด้งออก
export async function login(body: LoginRequest): Promise<LoginResult> {
  const res = await apiFetch('/Auth/login', {
    method: 'POST',
    accept: 'text/plain',
    contentType: 'application/json',
    body: JSON.stringify(body),
    noAuthEvent: true,
  });

  const text = await res.text();

  if (!res.ok) {
    // พยายามดึงข้อความ error จาก body
    let message = `เข้าสู่ระบบไม่สำเร็จ (HTTP ${res.status})`;
    try {
      const j = JSON.parse(text);
      message = j.message || j.error || j.title || message;
    } catch {
      if (text) message = text;
    }
    throw new Error(message);
  }

  // ตอบกลับอาจเป็น JSON หรือ plain token
  try {
    const j = JSON.parse(text);
    const token =
      j.token || j.accessToken || j.access_token || j.jwt || '';
    return { token, raw: j };
  } catch {
    return { token: text.trim(), raw: text };
  }
}
