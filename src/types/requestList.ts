// โครงข้อมูลจาก Requests API (GET /api/v1/Requests/{outgoing|incoming})
// ชื่อฟิลด์ต้องตรงกับ API เป๊ะ ๆ — ห้ามเปลี่ยนชื่อ

// รหัสสถานะงาน: "1"–"6" และ "9" (ไม่มี 7, 8 — เลขกระโดด)
export type JobStatusCode = '1' | '2' | '3' | '4' | '5' | '6' | '9';

// กลุ่มสถานะที่ API ใช้กรอง
export type StatusFilter = 'All' | 'Open' | 'Closed' | 'Cancelled';

export type RequestDirection = 'outgoing' | 'incoming';

export type SortBy = 'DocNo' | 'RequestDate' | 'Status' | 'CloseDate';
export type SortDir = 'Asc' | 'Desc';

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
  docNo: string; // เลขที่ใบ เช่น "2600043" — เป็น string เสมอ ห้ามแปลงเป็นตัวเลข (เลข 0 นำหน้าจะหาย)
  requestBy: string | null;
  departId: string | null; // แผนกผู้แจ้ง
  departmentName: string | null;
  requestDate: string | null;
  detail: string | null;
  jobStatus: JobStatusCode | string | null;
  jobStatusName: string; // ชื่อสถานะไทย — API แปลมาให้แล้ว
  wfStep: number | null;
  wfStatus: string | null;
  description: string | null; // ข้อความสถานะพร้อมชื่อแผนก
  currentDepartId: string | null; // null เมื่อใบปิดแล้ว
  currentDepartmentName: string | null;
  isMyTurn: boolean;
  resolution: RequestResolution | null;
}

export interface RequestStatusSummary {
  jobStatus: string;
  jobStatusName: string;
  count: number;
}

export interface RequestListResponse {
  module: string;
  direction: RequestDirection;
  departId: string; // แผนกที่ API ใช้กรอง (มาจาก token)
  totalCount: number;
  summary: RequestStatusSummary[];
  items: RequestListItem[];
}

export interface RequestModule {
  code: string;
  name: string;
}
