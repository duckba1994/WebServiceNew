import { apiSend } from './client';

// ── ใบแจ้งเรื่อง CR (ประสานงานเอกสารฝ่ายขาย) ────────────────
// POST /api/v1/CRRequest — ชื่อฟิลด์ตาม contract ของ backend (ห้ามเปลี่ยนชื่อ)
// ดู CR-create-frontend-guide.md §3
//
// ⚠️ ค่าที่ส่งเป็น "ชื่อ" (name) ไม่ใช่ id — ตรงกับที่ DB เก็บจริง
//    id ใน master มีไว้ทำ dropdown เท่านั้น
//
// ฟิลด์ที่ "ไม่ส่ง = backend ใส่ให้" จึงเป็น optional ทั้งหมด:
//   requestBy   ไม่ส่ง = fullName จาก JWT
//   departid    ไม่ส่ง = departId จาก JWT (ห้ามเป็น "01")
//   requestDate ไม่ส่ง = วันนี้ (วันที่สร้างเอกสาร — ฟอร์มไม่มีช่องนี้ให้กรอก)
//   jobDate     ไม่ส่ง = เวลาปัจจุบัน
export interface CrRequestPayload {
  section: string; // "HV" | "FL"
  requestType: string; // ชื่อประเภทเรื่องที่แจ้ง (≤ 50) — ต้องอยู่ในส่วนงานนั้น
  requestSubType: string; // ชื่อรายการจัดทำ (≤ 50) — ต้องอยู่ใต้ requestType ที่เลือก
  requestSubOther?: string | null; // ≤ 100 — ใช้เฉพาะตอน requestType = "อื่นๆ"
  requestBy?: string | null;
  departid?: string | null;
  requestDate?: string | null;
  jobDate?: string | null;
  requestDetail: string; // ≤ 1000
}

// 201 Created — jobNo คือเลขที่ใบที่ระบบเพิ่งออกให้
// ⚠️ เลขออกตอนบันทึกเท่านั้น ไม่มี endpoint จองเลขล่วงหน้า และเลขแยกชุดตาม
//    (ส่วนงาน + ประเภทเรื่อง) รวม 32 ชุด — ห้ามเดาว่าใบถัดไปคือเลข +1
export interface CrRequestResult {
  jobNo: string;
  jobStatus: number;
  wfStep: number;
  wfStatus: string;
  description: string;
  section: string;
  requestType: string;
  requestSubType: string;
  requestSubOther: string | null;
  requestBy: string;
  departid: string;
  requestDate: string;
  jobDate: string;
  tableId: string; // ชื่อชุดเลขที่ใบนั้นใช้ — ไว้ debug ไม่ต้องแสดงผู้ใช้
}

// บันทึกล้มเหลว = ไม่มีอะไรถูกเขียนลง DB เลย (rollback ทั้งก้อน รวมเลขที่ใบ)
// → กดซ้ำได้ปลอดภัย · apiSend โยน ApiError พร้อม message ภาษาไทยของ API
export const createCrRequest = (payload: CrRequestPayload, token?: string): Promise<CrRequestResult> =>
  apiSend<CrRequestResult>('/CRRequest', 'POST', payload, token);
