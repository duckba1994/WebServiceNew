import { RequestListItem } from '../types/requestList';
import { User } from '../types/user';
import { ItRequestUpdatePayload } from '../api/itRequest';
import {
  PlChecklistPayload,
  PlRequestDetail,
  PlRequestLine,
  PlRequestUpdatePayload,
} from '../api/plRequest';
import { DETAIL_MAX_LEN, FieldOption, MasterListKey } from './requestForm';

// ── แก้ไขใบแจ้งเรื่อง "ก่อน Mgr อนุมัติ" เท่านั้น ─────────────────
// PURE logic (ไม่มี JSX/hooks) — สิทธิ์แก้ไข + ฟิลด์ที่แก้ได้ + validate
// ผูกกับ PUT /api/v1/ITRequest/{jobNo} และ PUT /api/v1/PLRequest/{docNo}

// โมดูลที่แก้ไขได้ = โมดูลที่ backend มีเส้น PUT ให้ + ขั้นที่ยังยอมให้แก้
//   Approved-Request = รอ Mgr ต้นสังกัดอนุมัติ — ขั้นเดียวที่แก้ได้
// พอ Mgr กดอนุมัติแล้วใบถือว่าถูก "รับรอง" ไปแล้ว แก้เนื้อหาต่อไม่ได้ทั้ง IT และ PL
// (ตกลงไว้ 26 ส.ค. 2026) — ไม่งั้นคนแจ้งแก้ของที่ผู้อนุมัติเซ็นไปแล้วได้
// ⚠️ รหัส WFStatus ตีความข้ามแผนกไม่ได้ — ต้องแยกรายโมดูลเสมอ ที่ IT กับ PL
//    ใช้รหัสเดียวกันเป็นเรื่องบังเอิญของ 2 workflow นี้ ไม่ใช่กติกากลาง
//    (ทางที่ยั่งยืนกว่าคือให้ API ส่ง canEdit มาให้ แล้วเลิกเดารหัสตรงนี้)
const EDITABLE_WF_STATUS: Record<string, string[]> = {
  IT: ['Approved-Request'],
  PL: ['Approved-Request'],
};

// ใครแก้ได้: คนที่หน่วยงานตรงกับหน่วยงานผู้แจ้ง
// backend ดูแค่ departId ไม่ได้ดู flag ผู้อนุมัติ → Mgr กับลูกทีมสิทธิ์เท่ากัน
// หน้าเว็บจึงไม่ต้องแยกปุ่มตามตำแหน่ง
export function canEditRequest(item: RequestListItem, user?: User | null): boolean {
  const allowed = EDITABLE_WF_STATUS[item.module];
  if (!allowed) return false;
  if (!user?.departid || !item.departId) return false;
  if (String(user.departid).trim() !== String(item.departId).trim()) return false;
  return !!item.wfStatus && allowed.includes(item.wfStatus.trim());
}

// เหตุผลที่แก้ไม่ได้ — เอาไปขึ้นเป็นข้อความบอกผู้ใช้แทนปุ่มที่หายไป
// บอกเฉพาะคนในแผนกผู้แจ้ง (คนที่ "น่าจะ" มองหาปุ่มแก้ไข) — ฝั่งปลายทางเปิดดูใบ
// ของแผนกอื่นไม่ต้องเจอข้อความนี้ทุกใบให้รก
export function editBlockedReason(item: RequestListItem, user?: User | null): string | null {
  if (canEditRequest(item, user)) return null;
  if (!EDITABLE_WF_STATUS[item.module]) return null;
  if (!user?.departid || !item.departId) return null;
  if (String(user.departid).trim() !== String(item.departId).trim()) return null;
  return 'แก้ไขข้อมูลไม่ได้แล้ว — ใบนี้ผ่านการอนุมัติจาก Mgr ไปแล้ว ถ้าต้องแก้ต้องแจ้งผู้รับเรื่องโดยตรง';
}

// ── ฟิลด์ที่แก้ได้ ─────────────────────────────────────────────
// ชื่อ key = ชื่อฟิลด์ที่ส่งขึ้น API (ห้ามเปลี่ยนชื่อ — ดู API_NAMING.md)
// ผู้แจ้ง/หน่วยงาน/วันที่แจ้ง แก้ไม่ได้โดยตั้งใจ (เป็นตัวตนของใบ ไม่ใช่เนื้อหา)
// โดยเฉพาะ departid ที่ถ้าส่งค่าใหม่ = ย้ายหน่วยงาน แล้วแผนกเดิมแก้ใบไม่ได้อีก
// IT: "หมายเหตุ" (remark) ตั้งใจไม่ให้แก้ — อยากเพิ่มอะไรให้ใส่ในรายละเอียดแทน
// (ตกลงไว้ 21 ส.ค. 2026)
export type EditFieldKey =
  | 'requestDetail'
  | 'phoneNumber'
  | 'comName'
  | 'requestDetailRemark'
  | 'type'
  | 'requestType'
  | 'planDate';

export interface EditFieldDef {
  key: EditFieldKey;
  label: string;
  kind: 'text' | 'textarea' | 'select' | 'date';
  required?: boolean;
  span2?: boolean;
  maxLen?: number;
  placeholder?: string;
  // ใช้กับ kind = 'select' — value ต้องเป็น "ชื่อ" ไม่ใช่ id เพราะ API เก็บชื่อลง DB
  options?: FieldOption[];
  // ตัวเลือกมาจาก master data ตอน runtime (หน้ารายละเอียดเป็นคนโหลดแล้วเติมให้)
  // — ใบเก็บ "ชื่อ" จึงต้องให้ value เป็นชื่อ ไม่ใช่ id ไม่งั้นค่าที่โหลดมาจะไม่ตรงกับ
  // ตัวเลือกไหนเลยแล้ว select เด้งว่าง
  master?: MasterListKey;
}

const IT_EDIT_FIELDS: EditFieldDef[] = [
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

// เรียงตามแบบฟอร์มตอนสร้างใบ PL (ดู REQUEST_FORMS.PL ใน requestForm.ts)
const PL_EDIT_FIELDS: EditFieldDef[] = [
  { key: 'planDate', label: 'วันที่ต้องการใช้งาน', kind: 'date', required: true },
  { key: 'type', label: 'ประเภท', kind: 'select', required: true, master: 'plTypes' },
  { key: 'requestType', label: 'เรื่องที่แจ้ง', kind: 'select', required: true, master: 'plRequestTypes' },
  {
    key: 'requestDetail',
    label: 'ระบุเรื่องที่แจ้ง',
    kind: 'textarea',
    required: true,
    span2: true,
    maxLen: 1000,
    placeholder: 'อธิบายรายละเอียดของเรื่องที่ต้องการแจ้ง',
  },
  {
    key: 'requestDetailRemark',
    label: 'เหตุผลการขอ',
    kind: 'textarea',
    required: true,
    span2: true,
    maxLen: 500,
    placeholder: 'ระบุความจำเป็น / ผลกระทบหากไม่ได้รับ',
  },
];

const EDIT_FIELDS_BY_MODULE: Record<string, EditFieldDef[]> = {
  IT: IT_EDIT_FIELDS,
  PL: PL_EDIT_FIELDS,
};

export const editFieldsOf = (module: string): EditFieldDef[] => EDIT_FIELDS_BY_MODULE[module] ?? [];

// ── เช็คลิสต์ "ส่งแนบมาด้วย" ของใบ PL ──────────────────────────
// นิยามที่เดียว ใช้ทั้งแท็บ Attachment (อ่าน) และฟอร์มแก้ไข (เขียน)
// docKey = ช่องเลขที่/รายละเอียดที่คู่กับข้อนั้น (มีแค่ 3 ข้อ)
export type PlAttachKey =
  | 'attachBudget'
  | 'attachExBudget'
  | 'attachSpec'
  | 'attachQuatation' // สะกดตาม API (ห้ามแก้เป็น Quotation)
  | 'attachPicture'
  | 'attachCustDocConfirm'
  | 'attachOther';

export type PlAttachDocKey = 'budgetDocNo' | 'exBudgetDocNo' | 'attachOtherDetail';

export interface PlAttachCheck {
  key: PlAttachKey;
  label: string;
  docKey?: PlAttachDocKey;
  docLabel?: string;
  docMax?: number; // ความยาวสูงสุดตามคอลัมน์จริงใน DB
}

// ⚠️ docKey ของสองแถวแรกสลับกันโดยตั้งใจ (27 ส.ค. 2026)
// ข้อมูลเดิมจากระบบ WinForms เก็บเลขที่งบประมาณไว้ในคอลัมน์ ExBudgetDocNo และ
// เลขที่อนุมัตินอกงบไว้ใน BudgetDocNo — สลับกันมาตั้งแต่ต้น หน้าเว็บจึงสลับ
// การอ่าน/เขียนให้ตรงกับของเดิม เพื่อไม่ให้เว็บกับ WinForms แสดงคนละเรื่องกัน
// ระหว่างที่ยังใช้คู่กันอยู่
// → วันไหน backend สลับข้อมูลใน DB ให้ถูกแล้ว ให้สลับ docKey ตรงนี้กลับ
export const PL_ATTACH_CHECKS: PlAttachCheck[] = [
  { key: 'attachBudget', label: 'งบประมาณ', docKey: 'exBudgetDocNo', docLabel: 'เลขที่งบประมาณ', docMax: 50 },
  {
    key: 'attachExBudget',
    label: 'ใบขออนุมัตินอกงบ',
    docKey: 'budgetDocNo',
    docLabel: 'เลขที่อนุมัตินอกงบ',
    docMax: 50,
  },
  { key: 'attachSpec', label: 'รายละเอียด / Spec' },
  { key: 'attachQuatation', label: 'Quotation เปรียบเทียบราคา' },
  { key: 'attachPicture', label: 'รูปถ่าย' },
  { key: 'attachCustDocConfirm', label: 'เอกสารยืนยันจากบริษัทลูกค้า' },
  { key: 'attachOther', label: 'อื่นๆ', docKey: 'attachOtherDetail', docLabel: 'รายละเอียดอื่นๆ', docMax: 500 },
];

// ใบ PL แก้ "รายการที่ขอ" ได้ด้วย — แถวเดิมต้องหิ้ว recNo ไปด้วยเสมอ
// ไม่งั้น backend มองเป็นแถวใหม่ (ของเดิมถูกลบ ประวัติจำนวนที่รับแล้วหาย)
export interface EditLine {
  recNo?: string | null; // null/undefined = แถวที่เพิ่งเพิ่มในฟอร์ม
  item: string;
  qty: string; // string เพื่อผูกกับ <input> ตรง ๆ — แปลงเป็นตัวเลขตอนสร้าง payload
  unit: string;
  remark: string;
}

// สถานะฟอร์มแก้ไข — ฟิลด์ข้อความเป็น string ล้วนเพื่อผูกกับ input ตรง ๆ
export type RequestEditForm = Record<EditFieldKey, string> & { lines: EditLine[] };

export const emptyEditLine = (): EditLine => ({ item: '', qty: '', unit: '', remark: '' });

// 'YYYY-MM-DDTHH:mm:ss' → 'YYYY-MM-DD' สำหรับ <input type="date">
// ตัดสตริงตรง ๆ ไม่ผ่าน new Date() เพื่อไม่ให้ timezone ดึงวันถอยไป 1 วัน
const toDateInput = (iso?: string | null): string => (iso ? iso.slice(0, 10) : '');

// ใบ → ฟอร์ม (null/undefined กลายเป็นสตริงว่าง)
// item.detail คือฟิลด์เดียวกับ requestDetail ที่ส่งขึ้น API (คนละชื่อคนละทิศทาง)
// lines ส่งมาเฉพาะใบ PL — แถวที่ถูกยกเลิกไปแล้วไม่เอาเข้าฟอร์ม (แก้ไม่ได้)
export const toEditForm = (item: RequestListItem, lines?: PlRequestLine[] | null): RequestEditForm => ({
  requestDetail: item.detail ?? '',
  phoneNumber: item.phoneNumber ?? '',
  comName: item.comName ?? '',
  requestDetailRemark: item.remark ?? '',
  type: item.type ?? '',
  requestType: item.requestType ?? '',
  planDate: toDateInput(item.planDate),
  lines: (lines ?? [])
    .filter((l) => !l.cancel)
    .map((l) => ({
      recNo: l.recNo,
      item: l.item ?? '',
      qty: l.qty == null ? '' : String(l.qty),
      unit: l.unit ?? '',
      remark: l.remark ?? '',
    })),
});

export type EditErrors = Partial<Record<EditFieldKey, string>> & { lines?: string };

export function validateEditForm(module: string, form: RequestEditForm): EditErrors {
  const errors: EditErrors = {};
  for (const f of editFieldsOf(module)) {
    const v = (form[f.key] ?? '').trim();
    if (f.required && !v) errors[f.key] = `กรุณากรอก${f.label}`;
    else if (f.maxLen && v.length > f.maxLen) errors[f.key] = `${f.label}ยาวเกิน ${f.maxLen} ตัวอักษร`;
  }
  // แถวว่างทั้งแถว = ผู้ใช้ยังไม่ได้กรอก ไม่ใช่ error (ตัดทิ้งตอนสร้าง payload)
  // แต่แถวที่กรอกครึ่ง ๆ ต้องเตือน ไม่งั้น backend ตอบ 400 กลับมาแบบไม่รู้ว่าแถวไหน
  const bad = form.lines.findIndex((l) => {
    const hasItem = l.item.trim() !== '';
    const qty = Number(l.qty);
    if (!hasItem) return l.qty.trim() !== '' || l.unit.trim() !== '' || l.remark.trim() !== '';
    return !(qty > 0);
  });
  if (bad !== -1) {
    const l = form.lines[bad];
    errors.lines =
      l.item.trim() === ''
        ? `รายการที่ ${bad + 1}: กรุณากรอกชื่อรายการ`
        : `รายการที่ ${bad + 1}: จำนวนต้องมากกว่า 0`;
  }
  return errors;
}

// มีการแก้อะไรไหม — ใช้ตัดสินว่าต้องยิง API ไหม (ไม่ได้แก้ก็ไม่ต้องกวน backend)
export const hasFormChanges = (original: RequestEditForm, next: RequestEditForm): boolean => {
  const keys = Object.keys(next).filter((k) => k !== 'lines') as EditFieldKey[];
  if (keys.some((k) => (original[k] ?? '').trim() !== (next[k] ?? '').trim())) return true;
  const norm = (ls: EditLine[]) =>
    JSON.stringify(
      ls
        .filter((l) => l.item.trim() !== '')
        .map((l) => [l.recNo ?? '', l.item.trim(), Number(l.qty) || 0, l.unit.trim(), l.remark.trim()])
    );
  return norm(original.lines) !== norm(next.lines);
};

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

// ช่องเลขที่/รายละเอียดขึ้นกับหัวข้อที่ติ๊ก — ไม่ติ๊ก = ส่ง "" เพื่อล้างค่าใน DB
// (ค่าเดิมยังค้างใน state ของฟอร์ม ติ๊กกลับมาแล้วได้ข้อความเดิมคืน ไม่ต้องพิมพ์ใหม่)
const docValue = (
  attach: Record<PlAttachKey, boolean>,
  attachDocs: Record<PlAttachDocKey, string>,
  docKey: PlAttachDocKey
): string => {
  const owner = PL_ATTACH_CHECKS.find((c) => c.docKey === docKey);
  return owner && !attach[owner.key] ? '' : attachDocs[docKey].trim();
};

// ติ๊กหัวข้อที่มีช่องข้อความ = ต้องกรอกช่องนั้นด้วย (ติ๊กงบประมาณแต่ไม่บอกเลขที่
// ก็ไม่มีประโยชน์กับคนที่มาอ่านใบต่อ) — คืน map ของ error, ว่าง = ผ่าน
export const validatePlChecklist = (
  attach: Record<PlAttachKey, boolean>,
  attachDocs: Record<PlAttachDocKey, string>
): Partial<Record<PlAttachDocKey, string>> => {
  const errs: Partial<Record<PlAttachDocKey, string>> = {};
  PL_ATTACH_CHECKS.forEach((c) => {
    if (!c.docKey || !attach[c.key]) return;
    if (!attachDocs[c.docKey].trim()) errs[c.docKey] = `ระบุ${c.docLabel ?? c.label}ด้วย`;
  });
  return errs;
};

// เช็คลิสต์เอกสารแนบ → payload ของ PUT /PLRequest/{docNo}/attach-checklist
// เส้นนี้แตะได้แค่ 10 ฟิลด์นี้ จึง "ไม่ต้อง" หิ้วค่าหัวใบไปด้วยเหมือนเมื่อก่อน
// (ส่งไปก็ถูกเมิน) — ต้องส่งครบทั้ง 10 ทุกครั้ง ไม่ใช่ patch
export const toPlChecklistPayload = (
  attach: Record<PlAttachKey, boolean>,
  attachDocs: Record<PlAttachDocKey, string>
): PlChecklistPayload => ({
  attachBudget: attach.attachBudget,
  budgetDocNo: docValue(attach, attachDocs, 'budgetDocNo'),
  attachExBudget: attach.attachExBudget,
  exBudgetDocNo: docValue(attach, attachDocs, 'exBudgetDocNo'),
  attachSpec: attach.attachSpec,
  attachQuatation: attach.attachQuatation,
  attachPicture: attach.attachPicture,
  attachCustDocConfirm: attach.attachCustDocConfirm,
  attachOther: attach.attachOther,
  attachOtherDetail: docValue(attach, attachDocs, 'attachOtherDetail'),
});

// ฟอร์ม → payload ของ PUT /PLRequest/{docNo}
// ไม่ใส่ departid / docDate / site ลงไปเลย (ไม่ใช่ส่ง null) = ไม่แตะของเดิม
// lines ส่งครบทุกแถวที่ยังต้องการเก็บไว้เสมอ — แถวที่หายจาก payload ถือว่าถูกลบ
//
// เช็คลิสต์เอกสารแนบเป็นงานของแผนกปลายทาง (แท็บ Attachment) ฟอร์มนี้ไม่ได้แก้ —
// แต่ต้องหิ้วค่าเดิมจากใบส่งกลับไปทุกครั้ง ไม่งั้น PUT เขียนทับเป็น false แล้วของที่
// PL ติ๊กไว้หายไปเพราะผู้แจ้งกดแก้ข้อความ
export const toPlUpdatePayload = (
  item: RequestListItem,
  form: RequestEditForm,
  doc?: PlRequestDetail | null
): PlRequestUpdatePayload => ({
  requestBy: item.requestBy ?? undefined,
  attachBudget: doc?.attachBudget,
  budgetDocNo: doc?.budgetDocNo ?? undefined,
  attachExBudget: doc?.attachExBudget,
  exBudgetDocNo: doc?.exBudgetDocNo ?? undefined,
  attachSpec: doc?.attachSpec,
  attachQuatation: doc?.attachQuatation,
  attachPicture: doc?.attachPicture,
  attachCustDocConfirm: doc?.attachCustDocConfirm,
  attachOther: doc?.attachOther,
  attachOtherDetail: doc?.attachOtherDetail ?? undefined,
  requestDetail: form.requestDetail.trim(),
  requestDetailRemark: form.requestDetailRemark.trim(),
  type: form.type || undefined,
  requestType: form.requestType || undefined,
  // เวลาท้องถิ่นแบบไม่มี timezone — ถ้าแปลงเป็น ISO UTC จะโดน +07 ดึงวันถอยไป 1 วัน
  planDate: form.planDate ? `${form.planDate}T00:00:00` : undefined,
  lines: form.lines
    .filter((l) => l.item.trim() !== '')
    .map((l) => ({
      recNo: l.recNo ?? undefined,
      item: l.item.trim(),
      qty: Number(l.qty) || 0,
      unit: l.unit.trim() || undefined,
      remark: l.remark.trim() || undefined,
    })),
});
