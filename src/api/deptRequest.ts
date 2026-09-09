import { apiGet, apiSend } from './client';

// ── ใบแจ้งเรื่อง GA (ธุรการ) และ IM (ซ่อมบำรุง) ────────────────
// สองโมดูลนี้ใช้ payload ชุดเดียวกันทุกช่อง ต่างกันแค่ base path กับลิสต์ "เรื่องที่แจ้ง"
// จึงเป็นไฟล์เดียว รับ module เข้ามาเป็นพารามิเตอร์
// (contract: GA-IM-create-frontend-guide.md ของ backend)
//
//   GA → /api/v1/GARequest   · master /MasterData/ga · แผนกปลายทาง 06
//   IM → /api/v1/IMRequest   · master /MasterData/im · แผนกปลายทาง 18
//
// ⚠️ สองโมดูลนี้ "ไม่มีเส้นอัปโหลดไฟล์" — ฐานไม่มีคอลัมน์เก็บไฟล์
// ช่อง attach* ด้านล่างเป็นแค่เช็คลิสต์ (ติ๊กว่าส่งเอกสารแนบมาด้วย) คนละเรื่องกับรูปแนบ
export type DeptRequestModule = 'GA' | 'IM';

// โมดูลที่ใช้สัญญานี้ — ใช้คัดว่าใบใบหนึ่งยิงเส้นนี้ได้ไหม
export const DEPT_REQUEST_MODULES: DeptRequestModule[] = ['GA', 'IM'];

export const isDeptRequestModule = (module: string): module is DeptRequestModule =>
  (DEPT_REQUEST_MODULES as string[]).includes(module);

const basePath = (module: DeptRequestModule) => `/${module}Request`;

// รายการย่อย 1 แถวตอนส่งขึ้น API
export interface DeptRequestLineInput {
  // ตอนสร้างใบใหม่ recNo ถูกเมิน (ระบบออกเลขให้) — ใช้ตอน PUT เพื่อบอกว่าแถวไหนคือแถวเดิม
  recNo?: string | null;
  item: string; // รายการที่ขอ (สูงสุด 1000) — ห้ามว่าง
  qty?: number; // จำนวน — ไม่ส่ง = 1 · ต้องมากกว่า 0
  unit?: string; // ชื่อหน่วยจาก master units (ไม่ส่ง = "หน่วย") — ส่งชื่อที่ไม่มีในลิสต์ = 400
  remark?: string; // หมายเหตุของแถว (สูงสุด 1000)
}

// รายการย่อยที่ API คืนกลับมา (มี recNo + ฟิลด์ของขั้นดำเนินการ)
export interface DeptRequestLine {
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

// เช็คลิสต์เอกสารแนบ — 4 ข้อ (สองข้อแรกมีช่องเลขที่เอกสารคู่กัน)
// ⚠️ attachQuatation สะกดตาม API (ห้ามแก้เป็น Quotation)
export interface DeptRequestChecklist {
  attachBudget?: boolean;
  budgetDocNo?: string | null; // สูงสุด 50
  attachExBudget?: boolean;
  exBudgetDocNo?: string | null; // สูงสุด 50
  attachSpec?: boolean;
  attachQuatation?: boolean;
}

// ── สร้างใบใหม่ — POST /{module}Request ────────────────────────
// ฟิลด์หัวใบเกือบทั้งหมด "ไม่ส่ง = ใช้ค่า default ของ backend" จึงเป็น optional:
//   requestBy  ไม่ส่ง = ชื่อเต็มจาก token
//   departid   ไม่ส่ง = แผนกของ token (ห้ามเป็น "01" — API ตอบ 400 "เลือกหน่วยงานก่อนเสมอ")
//   site       ไม่ส่ง = "BC" (ส่งค่าอื่น = 400) — และแก้ทีหลังไม่ได้เพราะผูกกับเลขที่เอกสาร
//   docDate    ไม่ส่ง = เวลาปัจจุบัน (เขียนลงทั้งวันที่เอกสารและวันที่แจ้ง)
export interface DeptRequestPayload extends DeptRequestChecklist {
  requestDetail: string; // รายละเอียดที่แจ้ง (สูงสุด 500) — ห้ามว่าง
  site?: string;
  docDate?: string; // ISO 8601 — ใช้เป็น requestDate ด้วย
  type?: string; // ประเภท — "ชื่อ" จาก master types (ไม่ใช่ id)
  requestType?: string; // เรื่องที่แจ้ง — "ชื่อ" จาก master requestTypes (ไม่ใช่ id)
  requestBy?: string;
  departid?: string;
  planDate?: string; // วันที่ต้องการให้ดำเนินการ
  remark?: string; // หมายเหตุ (สูงสุด 500)
  // ไม่ส่ง / [] = ใบไม่มีรายการย่อย (สร้างใบเปล่าได้)
  lines?: DeptRequestLineInput[];
}

// 201 Created — เลขที่เอกสารที่ระบบออกให้ + รายการย่อยที่บันทึกจริง
//
// ⚠️ jobStatus ที่ได้จากเส้นนี้เป็น "ตัวเลขดิบในฐาน" ไม่ใช่ค่าที่ normalize แล้ว
// หน้ารายการต้องเชื่อค่าจาก /Requests/... เสมอ (guide §7)
export interface DeptRequestResult {
  docNo: string;
  jobStatus: number;
  jobStatusName?: string;
  wfStep: number;
  wfStatus: string;
  description?: string;
  site: string;
  requestBy: string;
  departid: string;
  type?: string | null;
  requestType?: string | null;
  docDate: string;
  requestDate: string;
  planDate: string | null;
  lines: DeptRequestLine[];
}

// apiSend โยน ApiError ที่ถือ message ไทยจาก body มาให้แล้ว (400 ระบุลำดับแถวด้วย
// เช่น "ตรวจสอบการป้อนข้อมูล : จำนวนต้องมากกว่า 0 (แถวที่ 1)") — เอาไปแสดงตรง ๆ ได้เลย
export const createDeptRequest = (
  module: DeptRequestModule,
  payload: DeptRequestPayload,
  token?: string
): Promise<DeptRequestResult> =>
  apiSend<DeptRequestResult>(basePath(module), 'POST', payload, token);

// ── เปิดใบแบบเต็มฟอร์ม — GET /{module}Request/{docNo} ──────────
// คืนหัวใบ รายการย่อย และสถานะปัจจุบัน ครบในการยิงครั้งเดียว
//
// เส้นนี้ "ไม่บล็อกใคร" — คนที่แก้ไม่ได้ก็ยังเปิดดูได้ ให้ดูที่ canEdit
// เป็น false เมื่อไหร่ให้ปิดปุ่มบันทึกแล้วโชว์ editBlockedReason (ข้อความไทยพร้อมโชว์)
export interface DeptRequestDetail extends DeptRequestChecklist {
  docNo: string;
  site?: string | null;
  docDate?: string | null;
  requestDate?: string | null;
  planDate?: string | null;
  type?: string | null;
  requestType?: string | null;
  requestDetail?: string | null;
  requestBy?: string | null;
  departid?: string | null;
  remark?: string | null;
  jobStatus?: number;
  jobStatusName?: string | null;
  wfStep?: number;
  wfStatus?: string | null;
  description?: string | null;
  lines?: DeptRequestLine[] | null;
  canEdit?: boolean;
  editBlockedReason?: string | null;
}

export const fetchDeptRequest = (
  module: DeptRequestModule,
  docNo: string,
  token?: string
): Promise<DeptRequestDetail> =>
  apiGet<DeptRequestDetail>(`${basePath(module)}/${encodeURIComponent(docNo)}`, token);

// ── แก้ไขใบเดิม — PUT /{module}Request/{docNo} ─────────────────
// กติกาของ payload (ต่างจาก POST):
//   requestBy กับ requestDetail  บังคับส่งทุกครั้ง แม้ไม่ได้แก้
//   ฟิลด์อื่นที่เป็น null        = ไม่เปลี่ยน · สตริงว่าง = ล้างค่า
//   site                         ไม่มีให้แก้ (ผูกกับเลขที่เอกสารที่ออกไปแล้ว)
//   docDate                      เขียนลงทั้งวันที่เอกสารและวันที่แจ้งพร้อมกัน แยกกันไม่ได้
//
// ⚠️ lines: ส่งทุกแถวที่ยังอยากเก็บกลับมาเสมอ พร้อม recNo เดิมของมัน
// ไม่ส่ง/null = ไม่แตะของเดิม · [] = ลบทั้งหมด · array = sync ทั้งชุด
// (แถวเดิมที่ไม่อยู่ในชุด "ถูกลบ" ไม่ใช่ "ไม่เปลี่ยน")
// ช่อง received/cancel/cancelBy/cancelDate แก้ผ่านเส้นนี้ไม่ได้ ค่าเดิมถูกรักษาไว้
export interface DeptRequestUpdatePayload extends DeptRequestChecklist {
  requestBy: string;
  requestDetail: string;
  type?: string;
  requestType?: string;
  docDate?: string;
  planDate?: string;
  remark?: string;
  // ⚠️ ไม่ส่ง departid โดยตั้งใจ — ส่งค่าใหม่ = ใบย้ายหน่วยงาน แล้วแผนกเดิมแก้ใบไม่ได้อีก
  // (แถว workflow ขั้นรอ Mgr อนุมัติจะย้ายตามไปด้วย)
  departid?: string;
  lines?: DeptRequestLineInput[];
}

export const updateDeptRequest = (
  module: DeptRequestModule,
  docNo: string,
  payload: DeptRequestUpdatePayload,
  token?: string
): Promise<DeptRequestResult> =>
  apiSend<DeptRequestResult>(`${basePath(module)}/${encodeURIComponent(docNo)}`, 'PUT', payload, token);
