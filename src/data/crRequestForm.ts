import { CrRequestPayload } from '../api/crRequest';
import { CR_OTHER_TYPE, RequestFormState } from './requestForm';

// ── PURE mapping: ฟอร์มใบแจ้งเรื่อง CR → payload ของ POST /CRRequest ──
// ไม่มี JSX/hooks ในไฟล์นี้ (เทสได้) — ดู CLAUDE.md §"Separate data/logic from UI"

// วันที่จาก <input type="date"> ('YYYY-MM-DD') → datetime ที่ API รับ
// ส่งเป็นเวลาท้องถิ่นแบบไม่มี timezone ตามที่ API ใช้ — ถ้าแปลงเป็น ISO UTC
// จะโดน timezone ไทย (+07) ดึงวันที่ถอยไป 1 วัน
const toApiDate = (ymd: string): string | undefined => (ymd ? `${ymd}T00:00:00` : undefined);

export function toCrRequestPayload(f: RequestFormState): CrRequestPayload {
  const v = f.values;
  // ประเภทอื่นส่งมาก็ถูกเมิน แต่ไม่ส่งไปเลยชัดกว่า (ฟอร์มล้างค่าให้ตอนสลับประเภทอยู่แล้ว)
  const other = v.requestType === CR_OTHER_TYPE ? (v.requestSubOther ?? '').trim() : '';

  return {
    section: v.section ?? '',
    requestType: v.requestType ?? '',
    requestSubType: v.requestSubType ?? '',
    requestSubOther: other || null,
    // ไม่ส่ง requestBy / departid — ให้ backend ใช้ค่าจาก token
    // (ส่งเองแล้วผิดจะทำให้ใบไปอยู่ผิดหน่วยงาน แก้ทีหลังไม่ได้)
    // requestDate = "วันที่ต้องการ" ที่ผู้ใช้กรอก (ยืนยัน 1 ก.ย. 2026)
    requestDate: toApiDate(v.requireDate ?? ''),
    // ไม่ส่ง jobDate — คือ DocDate = วันที่สร้างเอกสาร/วันที่แจ้งเรื่อง
    // ให้ backend ใส่เวลาปัจจุบันเอง (นาฬิกาเครื่องผู้ใช้เชื่อไม่ได้)
    requestDetail: f.detail,
  };
}
