import { apiFetch } from './client';

// ── ใบแจ้งเรื่อง IT ─────────────────────────────────────────
// POST /api/v1/ITRequest — ชื่อฟิลด์ตาม contract ของ backend (ห้ามเปลี่ยนชื่อ)
export interface ItRequestPayload {
  requestBy: string; // ชื่อ-นามสกุลผู้แจ้ง (fullName จาก login)
  departid: string; // รหัสหน่วยงานของผู้แจ้ง (departid จาก login)
  phoneNumber: string; // เบอร์ติดต่อที่ผู้แจ้งกรอก
  comName: string; // ชื่อเครื่องคอมพิวเตอร์ (จาก AD)
  requestDate: string; // ISO 8601 (UTC)
  requestDetail: string; // รายละเอียดที่แจ้ง (สูงสุด 1000 ตัวอักษร)
  remark: string; // หมายเหตุ — ยังไม่มีช่องในฟอร์ม ส่งค่าว่างไปก่อน
}

// หมายเหตุ: รูปภาพยังส่งไม่ได้ — payload ของ endpoint นี้ยังไม่มีช่องรับไฟล์
// (รอ backend ทำ endpoint อัปโหลดแยก หรือเปลี่ยนเป็น multipart)
export async function createItRequest(payload: ItRequestPayload, token?: string): Promise<void> {
  const res = await apiFetch('/ITRequest', {
    method: 'POST',
    token,
    contentType: 'application/json',
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    // พยายามดึงข้อความ error จาก body ให้ผู้ใช้เห็นสาเหตุจริง
    let message = `บันทึกใบแจ้งเรื่องไม่สำเร็จ (HTTP ${res.status})`;
    try {
      const text = await res.text();
      if (text) {
        try {
          const j = JSON.parse(text);
          message = j.message || j.error || j.title || message;
        } catch {
          message = text;
        }
      }
    } catch {
      /* อ่าน body ไม่ได้ ใช้ข้อความ default */
    }
    throw new Error(message);
  }
}
