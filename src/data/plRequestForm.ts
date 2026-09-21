import { PlRequestLineInput, PlRequestPayload } from '../api/plRequest';
import { checkedValues, LineItem, PL_CREATE_ATTACH, RequestFormState } from './requestForm';

// ── PURE mapping: ฟอร์มใบแจ้งเรื่อง PL → payload ของ POST /PLRequest ──
// ไม่มี JSX/hooks ในไฟล์นี้ (เทสได้) — ดู CLAUDE.md §"Separate data/logic from UI"

// วันที่จาก <input type="date"> ('YYYY-MM-DD') → datetime ที่ API รับ
// ส่งเป็นเวลาท้องถิ่นแบบไม่มี timezone ('2026-09-01T00:00:00') ตามตัวอย่างของ API
// — ถ้าแปลงเป็น ISO UTC จะโดน timezone ไทย (+07) ดึงวันที่ถอยไป 1 วัน
const toApiDate = (ymd: string): string | undefined => (ymd ? `${ymd}T00:00:00` : undefined);

// แถวที่ผู้ใช้กรอกชื่อรายการไว้จริงเท่านั้นถึงจะส่งขึ้นไป
// (ตารางมีแถวว่างค้างไว้เสมออย่างน้อย 1 แถว — ส่งไปจะโดน 400 "ห้ามว่าง")
export const toPlRequestLines = (items: LineItem[]): PlRequestLineInput[] =>
  items
    .filter((li) => li.name.trim() !== '')
    .map((li) => ({
      item: li.name.trim(),
      qty: Number(li.qty) || 0,
      // ไม่ระบุหน่วย = ให้ backend ใส่ "หน่วย" ให้เอง
      unit: li.unit.trim() || undefined,
      remark: li.note.trim() || undefined,
    }));

export function toPlRequestPayload(f: RequestFormState, requestBy: string): PlRequestPayload {
  const v = f.values;
  const lines = toPlRequestLines(f.lineItems);
  const attachDocs = checkedValues(v.plAttachDocs);
  const hasAttachment = (name: string): boolean => attachDocs.includes(name);
  const attachBudget = hasAttachment(PL_CREATE_ATTACH.budget);
  const attachExBudget = hasAttachment(PL_CREATE_ATTACH.exBudget);
  const attachOther = hasAttachment(PL_CREATE_ATTACH.other);

  return {
    requestDetail: v.topicDetail ?? '',
    requestDetailRemark: v.reason ?? '',
    requestBy,
    // ไม่ส่ง departid / site / docDate — ให้ backend ใช้ค่าจาก token และเวลาปัจจุบัน
    // (site แก้ทีหลังไม่ได้ และ departid ที่ส่งผิดจะทำให้ใบไปอยู่ผิดหน่วยงาน)
    planDate: toApiDate(v.dueDate ?? ''),
    // API รับเป็น "ชื่อ" จาก master (ไม่ใช่ id) — ช่องเลือกในฟอร์มเก็บชื่อไว้ตรง ๆ
    // (ตัวเลือกมาจาก GET /MasterData/pl) จึงส่งต่อได้เลย
    type: v.requestType ?? '',
    requestType: v.topic ?? '',
    attachBudget,
    budgetDocNo: attachBudget ? (v.plBudgetDocNo ?? '').trim() : null,
    attachExBudget,
    exBudgetDocNo: attachExBudget ? (v.plExBudgetDocNo ?? '').trim() : null,
    attachSpec: hasAttachment(PL_CREATE_ATTACH.spec),
    attachQuatation: hasAttachment(PL_CREATE_ATTACH.quotation),
    attachPicture: hasAttachment(PL_CREATE_ATTACH.picture),
    attachCustDocConfirm: hasAttachment(PL_CREATE_ATTACH.custDocConfirm),
    attachOther,
    attachOtherDetail: attachOther ? (v.plAttachOtherDetail ?? '').trim() : null,
    // รายการที่ขอไม่บังคับ — ไม่มีแถวที่กรอกจริง = ใบไม่มีรายการย่อย
    lines,
  };
}
