import { RequestListItem } from '../types/requestList';
import { User } from '../types/user';
import { ItRequestUpdatePayload } from '../api/itRequest';
import { DETAIL_MAX_LEN } from './requestForm';

// ── แก้ไขใบแจ้งเรื่อง IT "ก่อนที่ IT จะกดรับงาน" ─────────────────
// PURE logic (ไม่มี JSX/hooks) — สิทธิ์แก้ไข + ฟิลด์ที่แก้ได้ + validate
// ผูกกับ PUT /api/v1/ITRequest/{jobNo} (ดู api/itRequest.ts)

// โมดูลที่รองรับการแก้ไข — endpoint เป็นของ IT โดยเฉพาะ (/ITRequest/…)
// แผนกอื่นยังไม่มีเส้นแก้ไข → ปุ่มต้องไม่โผล่ในใบของโมดูลอื่น
export const EDITABLE_MODULE = 'IT';

// ขั้นที่ยังแก้ได้ — ตามที่ backend กำหนดไว้สำหรับ IT
//   Approved-Request = รอ Mgr ต้นสังกัดอนุมัติ
//   Receive-Request  = อนุมัติแล้ว รอ IT กดรับเรื่อง
// พ้นสองขั้นนี้ (IT รับงานแล้ว / ปิด / ยกเลิก) backend ตอบ 409
// ⚠️ รหัส WFStatus ชุดนี้เป็นของโมดูล IT เท่านั้น ห้ามเอาไปเทียบข้ามแผนก
//    (จึงต้องเช็ค module === 'IT' คู่กันเสมอ)
const EDITABLE_WF_STATUS = ['Approved-Request', 'Receive-Request'];

// ใครแก้ได้: คนที่หน่วยงานตรงกับหน่วยงานผู้แจ้ง
// backend ดูแค่ departId ไม่ได้ดู flag ผู้อนุมัติ → Mgr กับลูกทีมสิทธิ์เท่ากัน
// หน้าเว็บจึงไม่ต้องแยกปุ่มตามตำแหน่ง
export function canEditRequest(item: RequestListItem, user?: User | null): boolean {
  if (item.module !== EDITABLE_MODULE) return false;
  if (!user?.departid || !item.departId) return false;
  if (String(user.departid).trim() !== String(item.departId).trim()) return false;
  return !!item.wfStatus && EDITABLE_WF_STATUS.includes(item.wfStatus.trim());
}

// เหตุผลที่แก้ไม่ได้ — เอาไปขึ้นเป็นข้อความบอกผู้ใช้แทนปุ่มที่หายไป
// บอกเฉพาะคนในแผนกผู้แจ้ง (คนที่ "น่าจะ" มองหาปุ่มแก้ไข) — ฝั่ง IT เปิดดูใบ
// ของแผนกอื่นไม่ต้องเจอข้อความนี้ทุกใบให้รก
export function editBlockedReason(item: RequestListItem, user?: User | null): string | null {
  if (canEditRequest(item, user)) return null;
  if (item.module !== EDITABLE_MODULE) return null;
  if (!user?.departid || !item.departId) return null;
  if (String(user.departid).trim() !== String(item.departId).trim()) return null;
  return 'แก้ไขข้อมูลไม่ได้แล้ว — แผนก IT รับงานไปแล้ว หรือใบปิด/ยกเลิกไปแล้ว';
}

// ── ฟิลด์ที่แก้ได้ ─────────────────────────────────────────────
// ชื่อ key = ชื่อฟิลด์ที่ส่งขึ้น API (ห้ามเปลี่ยนชื่อ — ดู API_NAMING.md)
// ผู้แจ้ง/หน่วยงาน/วันที่แจ้ง แก้ไม่ได้โดยตั้งใจ (เป็นตัวตนของใบ ไม่ใช่เนื้อหา)
// โดยเฉพาะ departid ที่ถ้าส่งค่าใหม่ = ย้ายหน่วยงาน แล้วแผนกเดิมแก้ใบไม่ได้อีก
// "หมายเหตุ" (remark) ตั้งใจไม่ให้แก้ — อยากเพิ่มอะไรให้ใส่ในรายละเอียดแทน
// (ตกลงไว้ 21 ส.ค. 2026)
export interface EditFieldDef {
  key: keyof RequestEditForm;
  label: string;
  kind: 'text' | 'textarea';
  required?: boolean;
  span2?: boolean;
  maxLen?: number;
  placeholder?: string;
}

export const EDIT_FIELDS: EditFieldDef[] = [
  { key: 'phoneNumber', label: 'เบอร์ติดต่อ', kind: 'text', maxLen: 30, placeholder: 'เบอร์ที่ติดต่อกลับได้' },
  { key: 'comName', label: 'ชื่อคอมพิวเตอร์', kind: 'text', required: true, maxLen: 100, placeholder: 'ชื่อเครื่องที่มีปัญหา' },
  {
    key: 'requestDetail',
    label: 'รายละเอียดเรื่องที่แจ้ง',
    kind: 'textarea',
    required: true,
    span2: true,
    maxLen: DETAIL_MAX_LEN,
    placeholder: 'อธิบายอาการ/สิ่งที่ต้องการให้ชัดเจน',
  },
];

// สถานะฟอร์มแก้ไข — string ล้วนเพื่อผูกกับ input ตรง ๆ
export interface RequestEditForm {
  requestDetail: string;
  phoneNumber: string;
  comName: string;
}

// ใบ → ฟอร์ม (null/undefined กลายเป็นสตริงว่าง)
// item.detail คือฟิลด์เดียวกับ requestDetail ที่ส่งขึ้น API (คนละชื่อคนละทิศทาง)
export const toEditForm = (item: RequestListItem): RequestEditForm => ({
  requestDetail: item.detail ?? '',
  phoneNumber: item.phoneNumber ?? '',
  comName: item.comName ?? '',
});

export type EditErrors = Partial<Record<keyof RequestEditForm, string>>;

export function validateEditForm(form: RequestEditForm): EditErrors {
  const errors: EditErrors = {};
  for (const f of EDIT_FIELDS) {
    const v = (form[f.key] ?? '').trim();
    if (f.required && !v) errors[f.key] = `กรุณากรอก${f.label}`;
    else if (f.maxLen && v.length > f.maxLen) errors[f.key] = `${f.label}ยาวเกิน ${f.maxLen} ตัวอักษร`;
  }
  return errors;
}

// มีการแก้ข้อความไหม — ใช้ตัดสินว่าต้องยิง API ไหม (ไม่ได้แก้ก็ไม่ต้องกวน backend)
export const hasFormChanges = (original: RequestEditForm, next: RequestEditForm): boolean =>
  (Object.keys(next) as (keyof RequestEditForm)[]).some(
    (k) => (original[k] ?? '').trim() !== (next[k] ?? '').trim()
  );

// ฟอร์ม → payload ของ PUT /ITRequest/{jobNo}
// requestBy / comName / requestDetail บังคับส่งครบทั้งสามช่องเสมอ (ไม่ใช่ส่งเฉพาะที่แก้)
// requestBy เอาจากใบ ไม่ใช่จากคนที่กดแก้ — คนแก้อาจเป็นเพื่อนร่วมแผนก ไม่ใช่ผู้แจ้ง
// departid/requestDate ส่ง null เสมอ = ไม่แตะ (ดูคำเตือนเรื่องย้ายหน่วยงานใน api/itRequest.ts)
export const toUpdatePayload = (
  item: RequestListItem,
  form: RequestEditForm
): ItRequestUpdatePayload => ({
  requestBy: item.requestBy ?? '',
  comName: form.comName.trim(),
  requestDetail: form.requestDetail.trim(),
  phoneNumber: form.phoneNumber.trim(), // "" = ล้างค่า (ตั้งใจ), null = ไม่เปลี่ยน
  departid: null,
  requestDate: null,
});
