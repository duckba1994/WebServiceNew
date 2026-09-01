import { apiGet, apiSend, apiSendNoContent } from './client';

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
//   requestDate ไม่ส่ง = วันนี้ — แต่ฟอร์มส่งเสมอ: คือ "วันที่ต้องการ" ที่ผู้ใช้กรอก
//   jobDate     ไม่ส่ง = เวลาปัจจุบัน — คือ DocDate วันที่สร้างเอกสาร ฟอร์มจึงไม่ส่ง
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

// ── แก้ไขใบ CR ที่เปิดไปแล้ว ───────────────────────────────────
// PUT /api/v1/CRRequest/{jobNo} — แก้ได้ก่อน Mgr ต้นสังกัดอนุมัติเท่านั้น
//
// ⚠️ เส้นนี้ยังไม่มีในของจริง — CR-workflow-frontend-guide.md ระบุว่า "แก้ไขใบเดิม"
//    ยังไม่พอร์ตในเฟสนี้ หน้าเว็บทำรอไว้ตามสัญญานี้ เปิดเส้นเมื่อไรใช้ได้ทันที
//    (ดู MdApi/API_SPEC_CR_FLOW.md §4) · jobNo มี "/" จึงต้อง decode ฝั่ง API เหมือนเส้นอื่น
//
// ⚠️ section + requestType เป็นตัวกำหนด "ชุดเลขที่เอกสาร" (32 ชุด) แต่ **เลขที่ใบไม่เปลี่ยนตาม**
//    แก้เป็น FL แล้วเลขก็ยังขึ้นต้น BHV- อยู่ดี = ใบถือเลขของชุดหนึ่งแต่เนื้อหาเป็นอีกชุด
//    (เว็บเก่าก็เป็นแบบนี้) → หน้าเว็บต้องเตือนก่อนกดบันทึก ดู CR-create-frontend-guide.md §7
export interface CrRequestUpdatePayload {
  section: string; // "HV" | "FL" — โค้ด ไม่ใช่ชื่อ
  requestType: string; // ชื่อประเภทที่แจ้ง (≤ 50) — ต้องอยู่ในส่วนงานนั้น
  requestSubType: string; // ชื่อรายการจัดทำ (≤ 50) — ต้องอยู่ใต้ requestType ที่เลือก
  requestSubOther?: string | null; // ≤ 100 — ใช้เฉพาะตอน requestType = "อื่นๆ"
  requestDetail: string; // ≤ 1000 — "รายละเอียด"
  requestDate?: string | null; // "วันที่ต้องการ" — ไม่ส่ง = คงค่าเดิม
}

// ── ใบ CR แบบค่าดิบ (GET /api/v1/CRRequest/{docNo}) ────────────
// ⚠️ ต้องใช้เส้นนี้ ไม่ใช่ GET /Requests/CR/{docNo} เวลาจะเติมฟอร์มแก้ไข —
//    เส้นกลางรวม requestType กับ requestSubType เป็นข้อความเดียว
//    ("ใบเสนอราคา / แก้ไขเอกสาร") เอาไปผูก dropdown ไม่ได้
//
// canEdit มาจาก backend: false เมื่อใบปิด/ยกเลิกแล้วเท่านั้น (ระหว่าง step 1-5 แก้ได้ตลอด
// ตามเว็บเก่า) — หน้าเว็บบวกเงื่อนไขของตัวเองอีกชั้น: ห้ามแก้หลัง Mgr อนุมัติ
// (ผู้ใช้สั่ง 1 ก.ย. 2026) ดู canEditRequest ใน data/requestEdit.ts
export interface CrRequestDetail {
  jobNo?: string | null;
  section?: string | null;
  requestType?: string | null;
  requestSubType?: string | null;
  requestSubOther?: string | null;
  requestBy?: string | null;
  departid?: string | null;
  requestDate?: string | null;
  jobDate?: string | null;
  requestDetail?: string | null;
  canEdit?: boolean;
  cannotEditReason?: string | null; // ข้อความไทยพร้อมโชว์เมื่อ canEdit = false
  tableId?: string | null; // ชุดเลขที่ "ตามค่าปัจจุบัน" — ไม่ตรง prefix ของ jobNo = ใบหลุดชุด
}

export const fetchCrRequest = (docNo: string, token?: string): Promise<CrRequestDetail> =>
  apiGet<CrRequestDetail>(`/CRRequest/${encodeURIComponent(docNo)}`, token);

// ใช้ apiSendNoContent เพราะยังไม่รู้ว่า API จะคืน body หรือไม่ —
// รับได้ทั้งสองแบบ (คืน body มาก็ไม่พัง) แล้วให้ตัวเรียกโหลดใบใหม่เอง
export const updateCrRequest = (
  jobNo: string,
  payload: CrRequestUpdatePayload,
  token?: string
): Promise<void> =>
  apiSendNoContent(`/CRRequest/${encodeURIComponent(jobNo)}`, 'PUT', payload, token);
