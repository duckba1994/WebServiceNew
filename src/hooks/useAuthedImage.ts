import { useEffect, useState } from 'react';
import { apiAbsUrl } from '../config';

// ── โหลดรูปที่ต้องใช้ token ─────────────────────────────────────
// ⚠️ <img src="/api/v1/ITRequest/…/attachments/1"> ใช้ไม่ได้ — เบราว์เซอร์ไม่แนบ
//    Authorization header ให้กับการโหลดรูป จะได้ 401 เสมอ
//    (ไฟล์เก็บนอกโฟลเดอร์แอปเพื่อกัน deploy ทับ จึงต้องเสิร์ฟผ่าน API ที่มี [Authorize])
// → ต้อง fetch เองแล้วแปลงเป็น object URL แล้ว revoke ทิ้งตอน unmount ไม่งั้น memory leak
//
// url ที่ส่งเข้ามาคือค่าที่ API คืนมาใน attachments[].url (มี prefix มาแล้ว)
// คืน null = ยังโหลดไม่เสร็จ หรือโหลดไม่ได้ (404 = ช่องว่าง → ให้ผู้เรียกโชว์ placeholder)
export function useAuthedImage(url: string | null | undefined, token?: string): string | null {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    setSrc(null);
    if (!url || !token) return;

    let objectUrl: string | null = null;
    let alive = true;
    const ac = new AbortController();

    fetch(apiAbsUrl(url), {
      headers: { Authorization: `Bearer ${token}` },
      signal: ac.signal,
    })
      .then((r) => (r.ok ? r.blob() : null))
      .then((blob) => {
        if (!blob) return;
        objectUrl = URL.createObjectURL(blob);
        // unmount ไปแล้วระหว่างรอ → คืนหน่วยความจำทันที อย่าค้างไว้
        if (!alive) {
          URL.revokeObjectURL(objectUrl);
          objectUrl = null;
          return;
        }
        setSrc(objectUrl);
      })
      .catch(() => {
        /* abort หรือเน็ตล่ม — ปล่อยเป็น null ให้ผู้เรียกโชว์ placeholder */
      });

    return () => {
      alive = false;
      ac.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url, token]);

  return src;
}
