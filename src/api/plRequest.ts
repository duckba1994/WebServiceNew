import { apiGet, apiSend, apiSendForm } from './client';

// ── ใบแจ้งเรื่อง PL ─────────────────────────────────────────
// POST /api/v1/PLRequest — ชื่อฟิลด์ตาม contract ของ backend (ห้ามเปลี่ยนชื่อ
// แม้แต่ที่สะกดแปลก เช่น attachQuatation ซึ่งเป็นการสะกดของฝั่ง API)
//
// ฟิลด์หัวใบเกือบทั้งหมด "ไม่ส่ง = ใช้ค่า default ของ backend" จึงเป็น optional:
//   requestBy  ไม่ส่ง = fullName จาก token
//   departid   ไม่ส่ง = แผนกของ token (ห้ามเป็น "01")
//   site       ไม่ส่ง = "BC" (ตอนนี้มีตัวเลือกเดียว) — และแก้ทีหลังไม่ได้
//   docDate    ไม่ส่ง = เวลาปัจจุบัน (ใช้เป็น requestDate ด้วย)
// หน้าเว็บจึงส่งเฉพาะที่ผู้ใช้กรอกจริง ปล่อยที่เหลือให้ token/ค่า default ตัดสิน

// รายการย่อย 1 แถวตอนส่งขึ้น API
export interface PlRequestLineInput {
  // ตอนสร้างใบใหม่ recNo ถูกเมิน (ระบบออกเลขให้) — ใช้ตอน PUT เพื่อบอกว่าแถวไหนคือแถวเดิม
  recNo?: string | null;
  item: string; // รายการที่ขอ (สูงสุด 2000) — ห้ามว่าง
  qty: number; // จำนวน — ต้อง > 0
  unit?: string; // ชื่อหน่วยจาก master (ไม่ส่ง = "หน่วย")
  remark?: string; // หมายเหตุของแถว (สูงสุด 1000)
}

export interface PlRequestPayload {
  requestDetail: string; // ระบุเรื่องที่แจ้ง (สูงสุด 1000) — ห้ามว่าง
  requestDetailRemark?: string; // เหตุผลในการขอ (สูงสุด 500)
  requestBy?: string; // ผู้แจ้ง (สูงสุด 50)
  departid?: string; // รหัสหน่วยงานผู้แจ้ง (2 ตัวอักษร)
  site?: string; // รหัสไซต์ (3 ตัวอักษร)
  docDate?: string; // ISO 8601 — ใช้เป็น requestDate ด้วย
  planDate?: string; // วันที่ต้องการ — ISO 8601
  type?: string; // ประเภทผู้แจ้ง — "ชื่อ" จาก master types (ไม่ใช่ id)
  requestType?: string; // เรื่องที่แจ้ง — "ชื่อ" จาก master requestTypes (ไม่ใช่ id)
  // เช็คลิสต์เอกสารแนบ (ค่าเริ่มต้น false) — คนละเรื่องกับรูปแนบด้านล่าง
  attachBudget?: boolean;
  budgetDocNo?: string;
  attachExBudget?: boolean;
  exBudgetDocNo?: string;
  attachSpec?: boolean;
  attachQuatation?: boolean;
  attachPicture?: boolean;
  attachCustDocConfirm?: boolean;
  attachOther?: boolean;
  attachOtherDetail?: string;
  // ไม่ส่ง / [] = ใบไม่มีรายการย่อย
  lines?: PlRequestLineInput[];
}

// รายการย่อยที่ API คืนกลับมา (มี recNo + ฟิลด์ของขั้นดำเนินการ)
export interface PlRequestLine {
  recNo: string;
  item: string;
  qty: number;
  received: number;
  unit: string | null;
  remark: string | null;
  cancel: boolean;
  cancelBy: string | null;
  cancelDate: string | null;
}

// 201 Created — เลขที่เอกสารที่ระบบออกให้ + รายการย่อยที่บันทึกจริง
export interface PlRequestResult {
  docNo: string;
  jobStatus: number;
  wfStep: number;
  wfStatus: string;
  description?: string;
  site: string;
  requestBy: string;
  departid: string;
  docDate: string;
  requestDate: string;
  planDate: string | null;
  lines: PlRequestLine[];
}

// apiSend โยน ApiError ที่ถือ message ไทยจาก body มาให้แล้ว (400 ระบุลำดับแถวด้วย
// เช่น "รายการที่ 2 จำนวนต้องมากกว่า 0") — หน้าเว็บเอาไปแสดงตรง ๆ ได้เลย
export const createPlRequest = (payload: PlRequestPayload, token?: string): Promise<PlRequestResult> =>
  apiSend<PlRequestResult>('/PLRequest', 'POST', payload, token);

// ── เปิดใบ PL แบบเต็มฟอร์ม ─────────────────────────────────────
// GET /api/v1/PLRequest/{docNo} — ยิงครั้งเดียวได้ หัวใบทุกฟิลด์ที่ PUT แก้ได้
// + lines + attachments + canEdit ใช้ทั้งแท็บ Attachment และฟอร์มแก้ไข
//
// คนที่แก้ไม่ได้ยังเปิดดูได้ปกติ (ไม่ 403) — ใช้ canEdit คุมปุ่มแทน
export interface PlRequestDetail {
  docNo: string;
  site?: string | null; // อ่านอย่างเดียว — ผูกกับเลขที่เอกสารที่ออกไปแล้ว
  requestBy?: string | null;
  departid?: string | null;
  docDate?: string | null;
  requestDetail?: string | null;
  requestDetailRemark?: string | null;
  type?: string | null;
  requestType?: string | null;
  planDate?: string | null;
  // เช็คลิสต์เอกสารแนบ — เป็น bool ทุกตัว ไม่มี null (DB null = ไม่ติ๊ก)
  attachBudget?: boolean;
  budgetDocNo?: string | null;
  attachExBudget?: boolean;
  exBudgetDocNo?: string | null;
  attachSpec?: boolean;
  attachQuatation?: boolean;
  attachPicture?: boolean;
  attachCustDocConfirm?: boolean;
  attachOther?: boolean;
  attachOtherDetail?: string | null;
  lines?: PlRequestLine[] | null;
  attachments?: PlAttachment[] | null;
  canEdit?: boolean;
  editBlockedReason?: string | null; // ข้อความไทยพร้อมโชว์เมื่อ canEdit = false
  // สิทธิ์ "แนบ/ลบรูป" เป็นคนละชุดกับ canEdit (backend แยกให้แล้ว 27 ส.ค. 2026):
  // ผู้แจ้งแนบได้ก่อนปลายทางลงมือ · แผนกปลายทางแนบได้ตลอดจนกว่าใบจะปิด/ยกเลิก
  // → ห้ามเอา canEdit มาปิดปุ่มแนบ ไม่งั้นปลายทางแนบรูปไม่ได้ทั้งที่ API เปิดให้แล้ว
  canAttach?: boolean;
  attachBlockedReason?: string | null; // ข้อความไทยพร้อมโชว์เมื่อ canAttach = false
  // เช็คลิสต์เอกสารแนบก็เป็นงานของปลายทางเช่นกัน มีสิทธิ์ชุดของตัวเอง
  // (เงื่อนไขเดียวกับ canAttach เป๊ะ แต่ backend ส่งมาแยกตัว อย่ารวมเป็นตัวเดียว)
  canEditChecklist?: boolean;
  checklistBlockedReason?: string | null;
}

export const fetchPlRequest = (docNo: string, token?: string): Promise<PlRequestDetail> =>
  apiGet<PlRequestDetail>(`/PLRequest/${encodeURIComponent(docNo)}`, token);

// ── แก้ไขใบ PL ที่เปิดไปแล้ว ───────────────────────────────────
// PUT /api/v1/PLRequest/{docNo}
// ฟิลด์ที่ "ไม่ส่ง" = ไม่แตะของเดิมใน DB (แบบเดียวกับ PUT /ITRequest) — จึงตั้งใจ
// ไม่ส่ง departid / docDate / site: ส่งค่าผิดทีเดียวใบย้ายหน่วยงาน แล้วแผนกเดิม
// แก้ใบตัวเองไม่ได้อีก
//
// ⚠️ lines: ส่งทุกแถวที่ยังต้องการเก็บไว้เสมอ (แถวเดิมต้องมี recNo กำกับ)
// แถวที่หายไปจาก payload = ถูกลบทิ้ง — ไม่ใช่ "ไม่เปลี่ยน"
export interface PlRequestUpdatePayload {
  requestDetail: string;
  requestDetailRemark?: string;
  requestBy?: string;
  type?: string; // "ชื่อ" จาก master ไม่ใช่ id (เหมือนตอนสร้าง)
  requestType?: string;
  planDate?: string; // ISO 8601 แบบไม่มี timezone
  // เช็คลิสต์เอกสารแนบ — หน้าเว็บยังไม่มี UI ให้แก้ แต่ต้องส่งค่าเดิมกลับไปทุกครั้ง
  // ไม่งั้นเสี่ยงโดนเขียนทับเป็น false (ค่าที่ผู้แจ้งติ๊กไว้หายโดยไม่มีใครสั่ง)
  attachBudget?: boolean;
  budgetDocNo?: string;
  attachExBudget?: boolean;
  exBudgetDocNo?: string;
  attachSpec?: boolean;
  attachQuatation?: boolean;
  attachPicture?: boolean;
  attachCustDocConfirm?: boolean;
  attachOther?: boolean;
  attachOtherDetail?: string;
  // ⚠️ ส่งเป็น "ชุดสมบูรณ์": แถวมี recNo = แก้แถวเดิม, ไม่มี recNo = เพิ่มใหม่,
  // แถวเดิมที่ไม่อยู่ในชุด = ถูกลบ · ไม่ส่งฟิลด์นี้เลย = ไม่แตะรายการเดิม · [] = ลบหมด
  lines?: PlRequestLineInput[];
}

export const updatePlRequest = (
  docNo: string,
  payload: PlRequestUpdatePayload,
  token?: string
): Promise<PlRequestResult> =>
  apiSend<PlRequestResult>(`/PLRequest/${encodeURIComponent(docNo)}`, 'PUT', payload, token);

// GET /api/v1/PLRequest/{docNo}/lines — รายการย่อยของใบ เรียงตาม recNo
// ใบที่ไม่มีรายการคืน [] — ใช้ตอนเปิดดู/แก้ไขใบ เพราะ /Requests/PL/{docNo}
// ไม่ได้ส่ง lines มาด้วย
export const fetchPlRequestLines = (docNo: string, token?: string): Promise<PlRequestLine[]> =>
  apiGet<PlRequestLine[]>(`/PLRequest/${encodeURIComponent(docNo)}/lines`, token);

// ── เช็คลิสต์เอกสารแนบ "ส่งแนบมาด้วย" ──────────────────────────
// PUT /api/v1/PLRequest/{docNo}/attach-checklist
//
// แยกจาก PUT /{docNo} เพราะเป็นงานของแผนกปลายทาง ไม่ใช่ของผู้แจ้ง —
// เส้นนี้แตะได้แค่ 10 ฟิลด์นี้เท่านั้น ส่งหัวใบหรือ lines ปนมาก็ถูกเมิน
// จึงไม่มีทางที่ปลายทางจะเผลอเขียนทับใบของผู้แจ้ง
//
// ⚠️ ส่งครบทั้ง 10 ฟิลด์ทุกครั้ง (ไม่ใช่ patch) — ไม่ติ๊ก = false,
// เลขเอกสารที่ไม่มี = "" ซึ่งแปลว่า "ล้างค่าใน DB"
export interface PlChecklistPayload {
  attachBudget: boolean;
  budgetDocNo: string; // สูงสุด 50
  attachExBudget: boolean;
  exBudgetDocNo: string; // สูงสุด 50
  attachSpec: boolean;
  attachQuatation: boolean;
  // แค่ช่องติ๊กว่า "มีรูปแนบมาด้วย" — ไม่เกี่ยวกับไฟล์รูปใน /attachments/{slot}
  attachPicture: boolean;
  attachCustDocConfirm: boolean;
  attachOther: boolean;
  attachOtherDetail: string; // สูงสุด 500
}

// ความยาวสูงสุดตามคอลัมน์จริง — กรองที่หน้าเว็บก่อน (เกินแล้ว backend ตอบ 400)
export const PL_CHECKLIST_MAX: Record<string, number> = {
  budgetDocNo: 50,
  exBudgetDocNo: 50,
  attachOtherDetail: 500,
};

// 200 OK — คืนค่าชุดที่บันทึกจริง (trim แล้ว) เอาไป set ทับ state ได้เลย
export const updatePlChecklist = (
  docNo: string,
  payload: PlChecklistPayload,
  token?: string
): Promise<PlChecklistPayload> =>
  apiSend<PlChecklistPayload>(
    `/PLRequest/${encodeURIComponent(docNo)}/attach-checklist`,
    'PUT',
    payload,
    token
  );

// ── รูปแนบใบ PL — 3 "ช่อง" ตายตัว (slot 1-3) ──────────────────
// คิดเป็นช่อง ไม่ใช่ลิสต์: อัปช่องเดิมซ้ำ = เขียนทับ ไม่ใช่เพิ่มรูปที่ 4
// ต้องมีเลขที่ใบก่อนเสมอ — สร้างใบให้ได้ docNo แล้วค่อยอัปทีละช่อง
export const PL_ATTACHMENT_SLOTS = [1, 2, 3] as const;

export interface PlAttachment {
  fileId: number; // = หมายเลขช่อง
  fileName: string;
  url: string; // path เต็มพร้อม prefix — ใช้ค่านี้ตรง ๆ อย่าประกอบเอง
}

export interface PlAttachmentsResult {
  docNo: string;
  attachments: PlAttachment[]; // สถานะครบทั้ง 3 ช่องหลังทำรายการ
}

// ข้อจำกัดไฟล์ฝั่ง backend — กรองที่หน้าเว็บก่อน เพื่อไม่ให้ผู้ใช้รออัปเสร็จแล้วค่อยโดนปฏิเสธ
// (backend ตรวจ magic bytes ซ้ำอยู่ดี เปลี่ยนนามสกุลมาหลอกไม่ผ่าน)
export const PL_ATTACH_MAX_BYTES = 10 * 1024 * 1024; // 10 MB
export const PL_ATTACH_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];

// ตรวจไฟล์เบื้องต้น — คืนข้อความไทยเมื่อไม่ผ่าน, null = ผ่าน
export function checkPlAttachment(file: File): string | null {
  const dot = file.name.lastIndexOf('.');
  const ext = dot === -1 ? '' : file.name.slice(dot).toLowerCase();
  if (!PL_ATTACH_EXTENSIONS.includes(ext))
    return `นามสกุลไฟล์ไม่รองรับ (รองรับ ${PL_ATTACH_EXTENSIONS.join(' ')})`;
  if (file.size > PL_ATTACH_MAX_BYTES)
    return `ไฟล์ใหญ่เกิน ${Math.round(PL_ATTACH_MAX_BYTES / 1024 / 1024)} MB`;
  return null;
}

// POST /api/v1/PLRequest/{docNo}/attachments/{slot} — ชื่อ field ต้องเป็น 'file' เป๊ะ
// (apiSendForm ไม่ตั้ง Content-Type เอง เพื่อให้เบราว์เซอร์ใส่ boundary ให้)
export const uploadPlAttachment = (
  docNo: string,
  slot: number,
  file: File,
  token?: string
): Promise<PlAttachmentsResult> => {
  const form = new FormData();
  form.append('file', file, file.name);
  return apiSendForm<PlAttachmentsResult>(
    `/PLRequest/${encodeURIComponent(docNo)}/attachments/${slot}`,
    'POST',
    form,
    token
  );
};

export const deletePlAttachment = (
  docNo: string,
  slot: number,
  token?: string
): Promise<PlAttachmentsResult> =>
  apiSend<PlAttachmentsResult>(
    `/PLRequest/${encodeURIComponent(docNo)}/attachments/${slot}`,
    'DELETE',
    undefined,
    token
  );
