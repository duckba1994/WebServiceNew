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
