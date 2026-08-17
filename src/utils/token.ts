// ยูทิลตรวจอายุ token (รองรับ JWT; ถ้าไม่ใช่ JWT จะเช็คไม่ได้ → ให้ 401 interceptor จัดการแทน)

// base64url → string (UTF-8 safe) — คืน null ถ้าถอดไม่ได้
function decodeBase64Url(segment: string): string | null {
  try {
    const b64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4 ? '='.repeat(4 - (b64.length % 4)) : '';
    const bin = atob(b64 + pad);
    // แปลง Latin1 → UTF-8 ให้ JSON.parse อ่าน claim ที่มีอักขระไทยได้ถูก
    const utf8 = decodeURIComponent(
      Array.prototype.map
        .call(bin, (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return utf8;
  } catch {
    return null;
  }
}

// อ่าน exp (วินาที epoch) จาก JWT — คืน null ถ้าไม่ใช่ JWT หรือไม่มี exp
export function getTokenExp(token?: string | null): number | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null; // ไม่ใช่ JWT
  const json = decodeBase64Url(parts[1]);
  if (!json) return null;
  try {
    const payload = JSON.parse(json) as { exp?: number };
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

// true = หมดอายุแล้ว (เผื่อ skew กันเวลาเครื่องเหลื่อม)
// ถ้าอ่าน exp ไม่ได้ (opaque token / ไม่มี exp) → คืน false = "เช็คไม่ได้ ไม่ถือว่าหมด" แล้วพึ่ง 401 แทน
export function isTokenExpired(token?: string | null, skewSeconds = 30): boolean {
  const exp = getTokenExp(token);
  if (exp == null) return false;
  return Date.now() / 1000 >= exp - skewSeconds;
}
