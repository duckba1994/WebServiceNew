import { apiGet, apiSend } from './client';

// ── ใบแจ้งเรื่อง HR-PR (บุคคล/ธุรการบุคคล) ──────────────────────
// contract: HR-PR-frontend-guide.md ของ backend (10 ก.ย. 2026)
//
//   สร้าง/แก้ไข → /api/v1/HRPRRequest       · master /MasterData/hr
//   เส้นกลาง     → /api/v1/Requests/HR_PR/...
//
// ⚠️ ชื่อย่อแผนกใน /MasterData/departments คือ 'HR-PR' (ขีด) แต่ code ของโมดูล
//    ในเส้นกลางคือ 'HR_PR' (ขีดล่าง) — คนละสตริงกัน ห้ามเอามาใช้แทนกันตรง ๆ
//    (ดู moduleOfDepartment ใน src/data/requestListData.ts)
export const HR_PR_MODULE = 'HR_PR';

// ⚠️ เลขที่เอกสารของ HR-PR มี '/' อยู่ข้างใน (BCT03-ER01/69-0001)
//    ทุกเส้นจึง encodeURIComponent เสมอ ไม่งั้น '/' จะกลายเป็นตัวแบ่ง path
const docPath = (docNo: string) => `/HRPRRequest/${encodeURIComponent(docNo)}`;

// รายการย่อย 1 แถวตอนส่งขึ้น API (recNo ใช้เฉพาะตอน PUT — บอกว่าแถวไหนคือแถวเดิม)
export interface HrPrRequestLineInput {
  recNo?: string | null;
  item: string;
  qty?: number;
  unit?: string;
  remark?: string;
}

export interface HrPrRequestLine {
  recNo: string;
  item: string;
  qty: number;
  received: number | null;
  unit: string | null;
  remark: string | null;
  cancel: boolean;
  cancelBy: string | null;
  cancelDate: string | null;
}

// ── สร้างใบใหม่ — POST /HRPRRequest ────────────────────────────
// site / requestBy / departid / docDate ไม่ส่งได้ (backend ใช้ BC / JWT / เวลาปัจจุบัน)
// backend เลือกชุดเลขที่เอกสารและ workflow จาก requestType ให้เอง
export interface HrPrRequestPayload {
  requestType: string; // ต้องตรงกับ requestTypes ของ GET /MasterData/hr
  // บังคับเฉพาะ "สแกนลายนิ้วมือ" กับ "หนังสือรับรองการทำงาน" (guide §สร้างใบ)
  requestDetail?: string;
  position?: string;
  reference?: string;
  site?: string;
  docDate?: string;
  requestBy?: string;
  departid?: string;
  lines?: HrPrRequestLineInput[];
}

export interface HrPrRequestResult {
  docNo: string;
  jobStatus: number;
  jobStatusName?: string;
  wfStep: number;
  wfStatus: string;
  description?: string;
  site: string;
  requestBy: string;
  departid: string;
  position?: string | null;
  reference?: string | null;
  requestType?: string | null;
  requestDetail?: string | null;
  docDate: string;
  requestDate: string;
  lines: HrPrRequestLine[];
}

// GET /HRPRRequest/{docNo} — เปิดฟอร์มดู/แก้ไข
// เส้นนี้ไม่บล็อกใคร คนที่แก้ไม่ได้ก็เปิดดูได้ → ดูที่ canEdit เท่านั้น
export interface HrPrRequestDetail extends Omit<Partial<HrPrRequestResult>, 'lines' | 'docNo'> {
  docNo: string;
  lines?: HrPrRequestLine[] | null;
  canEdit?: boolean;
  editBlockedReason?: string | null;
}

// ── แก้ไขใบเดิม — PUT /HRPRRequest/{docNo} ─────────────────────
// ⚠️ lines: null/ไม่ส่ง = ไม่แตะของเดิม · array = sync ทั้งชุด (แถวเดิมที่ไม่ส่งกลับ "ถูกลบ")
// ⚠️ ไม่ส่ง departid โดยตั้งใจ — ส่งค่าใหม่ = ใบย้ายหน่วยงาน แล้วแผนกเดิมแก้ใบไม่ได้อีก
export interface HrPrRequestUpdatePayload {
  requestBy: string;
  requestType: string;
  requestDetail?: string;
  position?: string;
  reference?: string;
  docDate?: string;
  lines?: HrPrRequestLineInput[];
}

export const createHrPrRequest = (
  payload: HrPrRequestPayload,
  token?: string
): Promise<HrPrRequestResult> => apiSend<HrPrRequestResult>('/HRPRRequest', 'POST', payload, token);

export const fetchHrPrRequest = (docNo: string, token?: string): Promise<HrPrRequestDetail> =>
  apiGet<HrPrRequestDetail>(docPath(docNo), token);

export const updateHrPrRequest = (
  docNo: string,
  payload: HrPrRequestUpdatePayload,
  token?: string
): Promise<HrPrRequestResult> => apiSend<HrPrRequestResult>(docPath(docNo), 'PUT', payload, token);

// GET /HRPRRequest/{docNo}/lines — โหลดรายการย่อยซ้ำโดยไม่ต้องดึงหัวใบ
export const fetchHrPrRequestLines = (docNo: string, token?: string): Promise<HrPrRequestLine[]> =>
  apiGet<HrPrRequestLine[]>(`${docPath(docNo)}/lines`, token);
