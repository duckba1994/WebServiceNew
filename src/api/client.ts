// ตัวกลางเรียก API ตัวเดียว — แนบ Bearer token + จัดการ 401 รวมศูนย์
// เจอ 401 (เซสชันหมดอายุ) → ยิง event 'auth:unauthorized' ให้ AuthProvider จับ (logout + เด้ง login)
// api layer อยู่นอก React จึงสื่อสารผ่าน window event แทนการเรียก context ตรง ๆ
import { apiUrl } from '../config';

// ชื่อ event ที่ AuthProvider ฟังเพื่อเด้งออกเมื่อเซสชันหมดอายุ
export const AUTH_UNAUTHORIZED_EVENT = 'auth:unauthorized';

export interface ApiOptions {
  token?: string;
  method?: string;
  body?: BodyInit;
  accept?: string; // ค่าเริ่มต้น application/json
  contentType?: string;
  // true = ไม่ยิง event เมื่อเจอ 401 (ใช้กับ login: 401 = รหัสผิด ไม่ใช่เซสชันหมด)
  noAuthEvent?: boolean;
}

export async function apiFetch(path: string, opts: ApiOptions = {}): Promise<Response> {
  const headers: Record<string, string> = { accept: opts.accept ?? 'application/json' };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  if (opts.contentType) headers['Content-Type'] = opts.contentType;

  const res = await fetch(apiUrl(path), {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body,
  });

  if (res.status === 401 && !opts.noAuthEvent) {
    window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
    throw new Error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
  }
  return res;
}

// helper สำหรับ GET + parse JSON (โยน error พร้อม HTTP status)
export async function apiGet<T>(path: string, token?: string): Promise<T> {
  const res = await apiFetch(path, { token });
  if (!res.ok) throw new Error(`โหลดข้อมูลไม่สำเร็จ (HTTP ${res.status})`);
  return res.json();
}
