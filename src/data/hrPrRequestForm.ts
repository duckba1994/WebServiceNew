import { HrPrRequestPayload } from '../api/hrPrRequest';
import { HR_PR_DETAIL_REQUIRED_TOPICS, RequestFormState } from './requestForm';

// ── PURE form→payload ของใบแจ้งเรื่อง HR-PR ────────────────────
// site / departid / docDate ปล่อยให้ backend เติมจาก BC / JWT / เวลาปัจจุบัน
// (ส่ง requestBy ไปด้วยเพราะฟอร์มโชว์ชื่อผู้แจ้งให้ผู้ใช้เห็นอยู่แล้ว)
//
// ⚠️ ฟอร์ม HR มี 4 ช่องตามที่ผู้ใช้สั่งไว้ 6 ก.ย. 2026 (ชื่อ-นามสกุล / ตำแหน่ง /
//    เรื่องที่แจ้ง / รายละเอียด) — API รับ reference กับ lines ได้ด้วย แต่ฟอร์มยังไม่มี
//    ช่องให้กรอก จึงไม่ส่งไป (ไม่ส่ง = ใบไม่มีรายการย่อยและไม่มีเอกสารอ้างอิง)

// รายละเอียดบังคับกรอกไหม — ลิสต์อยู่ที่ requestForm.ts เพราะ validateRequestForm
// ใช้ตัวเดียวกันผ่าน DeptFormConfig.detailRequiredWhen
export const hrPrDetailRequired = (requestType: string): boolean =>
  HR_PR_DETAIL_REQUIRED_TOPICS.includes(requestType.trim());

export const toHrPrRequestPayload = (form: RequestFormState, requestBy: string): HrPrRequestPayload => ({
  requestType: form.values.topic ?? '',
  // ไม่กรอก = ไม่ส่ง (ช่องนี้ไม่บังคับสำหรับเรื่องส่วนใหญ่)
  requestDetail: form.detail.trim() || undefined,
  position: (form.values.position ?? '').trim() || undefined,
  requestBy,
});
