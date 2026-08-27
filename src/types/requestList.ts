// โครงข้อมูลจาก Requests API v2 (GET /api/v1/Requests/{outgoing|incoming})
// ชื่อฟิลด์ต้องตรงกับ API เป๊ะ ๆ — ห้ามเปลี่ยนชื่อ

// รหัสสถานะงานของ IT: "1"–"6" และ "9" (ไม่มี 7, 8 — เลขกระโดด)
// แผนกอื่นใช้รหัสคนละชุด — ห้ามเอารหัสไปเทียบความหมายข้ามแผนก ให้ใช้ phase แทน
export type JobStatusCode = '1' | '2' | '3' | '4' | '5' | '6' | '9';

// กลุ่มสถานะที่ API ใช้กรอง
export type StatusFilter = 'All' | 'Open' | 'Closed' | 'Cancelled';

export type RequestDirection = 'outgoing' | 'incoming';

export type SortBy = 'DocNo' | 'RequestDate' | 'Status' | 'CloseDate';
export type SortDir = 'Asc' | 'Desc';

// ── จังหวะงาน (phase) — ศัพท์กลางที่เทียบข้ามแผนกได้ ────────────
// API map มาจาก WFStatus ให้แล้ว (v2) หน้าเว็บไม่ต้องรู้จัก WFStatus ของแผนกไหนเลย
export type RequestPhase =
  | 'waiting_approve'
  | 'waiting_accept'
  | 'in_progress'
  | 'waiting_review'
  | 'waiting_close'
  | 'closed'
  | 'cancelled'
  | 'other';

// ขั้นปัจจุบันเป็นของฝั่งไหน — null เมื่อใบปิด/ยกเลิกแล้ว (ไม่มีขั้นค้าง)
export type RequestOwnerType = 'requester' | 'target';

// ── นิยาม workflow ที่ API ส่งมา (workflow เป็นข้อมูล ไม่ใช่โค้ด) ─
// ownerType ของ "ขั้น" ใช้คำต่างจากของ "item" (requesterDepart / targetDepart)
export interface WorkflowStep {
  step: number;
  code: string; // WFStatus
  name: string;
  ownerType: 'requesterDepart' | 'targetDepart' | null;
  departId: string | null; // null = แผนกผู้แจ้ง (placeholder "00" ใน DB)
  permission: number | null; // 3 = Mgr, 2 = เจ้าหน้าที่
  jobStatus: string | null;
  phase: RequestPhase | null;
}

export interface WorkflowStatus {
  code: string;
  name: string;
  group: Exclude<StatusFilter, 'All'>;
  phase: RequestPhase | null;
}

export interface RequestWorkflow {
  module: string;
  name: string;
  stepCount: number;
  steps: WorkflowStep[];
  statuses: WorkflowStatus[];
}

// ปุ่มที่ผู้ใช้คนนี้กดได้กับใบนี้ — [] = กดอะไรไม่ได้ตอนนี้
export interface RequestAction {
  code: string;
  label: string;
  style: 'primary' | 'success' | 'danger' | 'neutral';
  requireNote: boolean;
  requiredFields: string[];
}

// ร่องรอยการทำงานหลังบ้าน — null ถ้ายังไม่มีความคืบหน้า
export interface RequestResolution {
  receivedBy: string | null;
  receivedDate: string | null;
  servicedBy: string | null;
  servicedDate: string | null;
  closedBy: string | null;
  closedDate: string | null;
  cancelledBy: string | null;
  cancelledDate: string | null;
  repairStatus: string | null;
  solution: string | null;
  resolutionDetail: string | null;
  // ชุดปิดงานรับเรื่อง (closeReceive): solution(=solve) / hw / hwDetail / resolutionDetail(=repairDetail)
  hw?: string | null;
  hwDetail?: string | null;
  // ชุด "ส่งบริษัท" ที่ saveService เขียนไว้ (ขอ backend คืนกลับมาเพื่อ prefill ฟอร์มดำเนินการ)
  exVendor?: string | null;
  exContact?: string | null;
  exPlanDate?: string | null;
  exPrNo?: string | null;
  // ชุดสำรวจความพึงพอใจ (survey): ServiceScore / ServicePercentage / Survey_By / Survey_Date / Survey_Remark
  serviceScore?: number | null;
  servicePercentage?: number | null;
  surveyBy?: string | null;
  surveyDate?: string | null;
  surveyRemark?: string | null;
  // คะแนนรายหัวข้อ 1–5 (key เดียวกับที่ส่งขึ้นไปตอน action survey) — null = ยังไม่ประเมิน
  surveyRatings?: Record<string, number> | null;
  // ── ชุดปิดงาน (action `close`) — ขั้นสุดท้ายของ workflow ──────────
  // ⚠️ อย่าสับกับ closedBy/closedDate ด้านบน ซึ่งเป็นของขั้น "ปิดงานรับเรื่อง"
  //    (closeReceive) — คนละขั้น คนละคนกด จึงต้องใช้คีย์แยกกัน
  // แผนกที่ไม่มีเกณฑ์ KPI ให้ส่ง caseNo/kpi เป็น null → หน้าเว็บซ่อนบล็อกนั้นไปเอง
  caseNo?: string | null; // "1"–"4" กรณีตามเกณฑ์ KPI
  caseName?: string | null; // ข้อความเกณฑ์ ณ ตอนที่ปิด (เกณฑ์เปลี่ยนภายหลัง ใบเก่าต้องยังถูก)
  kpi?: string | null; // ตาม KPI / ตก KPI / ยกเลิก / ยังไม่ถึงกำหนด
  jobClosedBy?: string | null;
  jobClosedDate?: string | null;
  // ตัวเลขประกอบผล KPI — backend คำนวณให้ (ต้องหักวันหยุด/นอกเวลาทำงาน หน้าเว็บทำเองไม่ได้)
  kpiStartDate?: string | null; // นาฬิกา KPI เริ่มนับ = ตอน Mgr ต้นสังกัดอนุมัติ
  kpiDueDate?: string | null; // ครบกำหนดตาม caseNo
  kpiUsedHours?: number | null; // ชั่วโมงที่ใช้จริง
}

export interface RequestListItem {
  module: string;
  docNo: string; // เลขที่ใบ — เป็น string เสมอ ห้ามแปลงเป็นตัวเลข (เลข 0 นำหน้าจะหาย)
  requestBy: string | null;
  departId: string | null; // แผนกผู้แจ้ง
  departmentName: string | null;
  requestDate: string | null;
  detail: string | null;
  jobStatus: JobStatusCode | string | null;
  jobStatusName: string; // ชื่อสถานะไทยของแผนกนั้น — API แปลมาให้แล้ว
  wfStep: number | null;
  wfStepTotal: number | null; // จำนวนขั้นทั้งหมดของ workflow ใบนั้น (2–6 ขั้น)
  wfStepName: string | null; // ชื่อขั้นปัจจุบันแบบสั้น
  wfStatus: string | null;
  description: string | null; // ข้อความสถานะพร้อมชื่อแผนก
  currentDepartId: string | null; // null เมื่อใบปิดแล้ว
  currentDepartmentName: string | null;
  isMyTurn: boolean;
  phase: RequestPhase | null;
  phaseName: string | null;
  ownerType: RequestOwnerType | null;
  availableActions: RequestAction[] | null;
  resolution: RequestResolution | null;
  // ── เพิ่มใน API v2.3 — มาทั้งใน list และ detail ──
  // optional เพราะ backend เก่า/บาง endpoint อาจยังไม่ส่ง (อย่าพึ่งว่ามีเสมอ)
  phoneNumber?: string | null; // เบอร์ผู้แจ้ง — Mgr โทรถามก่อนตัดสินใจ
  comName?: string | null; // เครื่องที่แจ้ง
  remark?: string | null; // หมายเหตุที่ผู้แจ้งเขียนเพิ่ม
  updatedDate?: string | null; // เวลาใบขยับล่าสุด — ทำป้าย "ค้าง N วัน" ได้
  attachmentCount?: number | null; // จำนวนไฟล์แนบ (0–3)
  // ── ฟิลด์เฉพาะใบ PL ──
  // optional เพราะ /Requests/{module}/{docNo} ของโมดูลอื่นไม่มีฟิลด์พวกนี้
  // (และ backend อาจยังไม่ส่งมาแม้กับ PL) — ไม่มีค่า = หน้าเว็บแสดง "—"
  type?: string | null; // ประเภทผู้แจ้ง (ชื่อจาก master types)
  requestType?: string | null; // เรื่องที่แจ้ง (ชื่อจาก master requestTypes)
  planDate?: string | null; // วันที่ต้องการใช้งาน
  // หมายเหตุ: เช็คลิสต์เอกสารแนบ (attachBudget/attachSpec/…) ไม่ได้อยู่ในชุดนี้ —
  // มากับ GET /PLRequest/{docNo} เท่านั้น (ดู PlRequestDetail ใน api/plRequest.ts)
}

// ── ประวัติการดำเนินการรายเหตุการณ์ (timeline) ────────────────
// GET /Requests/{module}/{docNo} ส่ง logs มาเรียงเก่า→ใหม่ แบบ insert-only
// action ใช้ code เดียวกับใน availableActions (create/approve/not_approve/
// receive/service/survey/close/cancel) → หน้าเว็บเลือกไอคอน/สีจากค่านี้
export interface RequestLog {
  step: number | null;
  action: string;
  actionLabel: string | null; // ป้ายไทยของเหตุการณ์ (ไม่ส่ง → fallback เป็น action)
  actionByName: string | null;
  actionByDepartment: string | null; // แยก Mgr ผู้แจ้ง vs Mgr ปลายทาง (เคส PS อนุมัติ 2 รอบ)
  actionDate: string | null;
  note: string | null; // เหตุผล — สำคัญตอน not_approve (ยังอาจเป็น null จนกว่า DB เก็บ note ได้)
}

export interface RequestAttachment {
  fileId: number | string;
  fileName: string;
  url: string | null;
}

// GET /Requests/{module}/{docNo} — item เต็ม ห่อไว้ พร้อม logs + workflow + attachments
// item = shape เดียวกับ item ในลิสต์เป๊ะ (availableActions/isMyTurn/ownerType คำนวณ
// สำหรับคนที่เปิดดู) เอาไปใช้ component เดิมได้เลย
export interface RequestDetailResponse {
  item: RequestListItem;
  logs: RequestLog[] | null; // timeline เรียงเก่า→ใหม่
  workflow: RequestWorkflow | null; // steps ครบทุกขั้น — เอา merge กับ logs วาดขั้นที่ยังไม่ถึง
  attachments: RequestAttachment[] | null; // url อาจเป็น null (ยังไม่มี endpoint เสิร์ฟไฟล์)
}

export interface RequestStatusSummary {
  jobStatus: string;
  jobStatusName: string;
  count: number;
}

// นับตามจังหวะงาน — ยอดไม่เปลี่ยนตามตัวกรอง phase (ใช้เป็น badge ของทุกการ์ดได้)
export interface RequestPhaseSummary {
  phase: RequestPhase;
  phaseName: string;
  count: number;
}

// ไม่ส่ง page ไป = ไม่แบ่งหน้า (ค่าใน paging จะเป็น null)
export interface RequestPaging {
  page: number | null;
  pageSize: number | null;
  totalCount: number;
  totalPages: number | null;
}

export interface RequestListResponse {
  module: string; // "*" เมื่อเรียก /outgoing โดยไม่ระบุ module
  direction: RequestDirection;
  departId: string; // แผนกที่ API ใช้กรอง (มาจาก token)
  workflow: RequestWorkflow | null; // null เมื่อไม่ระบุ module
  totalCount: number;
  summary: RequestStatusSummary[];
  phaseSummary: RequestPhaseSummary[];
  paging: RequestPaging | null;
  items: RequestListItem[];
}

export interface RequestModule {
  code: string;
  name: string;
  workflow: RequestWorkflow | null; // ต้องขอด้วย ?includeWorkflow=true
}

// ── ผลลัพธ์ของการกดปุ่ม (POST /Requests/{module}/{docNo}/action) ──
// item = แถวที่อัปเดตแล้วทั้งก้อน เอาไปแทนแถวเดิมในตารางได้เลย
// (แต่ badge KPI ต้องโหลด /outgoing ใหม่ เพราะ phaseSummary เปลี่ยน)
export interface RequestActionResult {
  module: string;
  docNo: string;
  action: string;
  message: string; // ข้อความไทยพร้อมแสดง เช่น "อนุมัติเรียบร้อย — ส่งต่อไปยัง …"
  previousStep: number | null;
  currentStep: number | null;
  previousJobStatus: string | null;
  currentJobStatus: string | null;
  item: RequestListItem;
}
