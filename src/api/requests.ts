import { apiGet, apiSend } from './client';
import {
  RequestDetailResponse,
  RequestDirection,
  RequestListResponse,
  RequestModule,
  RequestActionResult,
  RequestPhase,
  RequestWorkflow,
  SortBy,
  SortDir,
  StatusFilter,
} from '../types/requestList';

// ── Requests API v2 (ใบแจ้งเรื่อง 2 ทิศทาง) ────────────────────
// GET /api/v1/Requests/outgoing — ใบที่แผนกเราเป็นคนแจ้ง (module ไม่บังคับ)
// GET /api/v1/Requests/incoming — ใบที่แผนกเรามีขั้นตอนอยู่ใน workflow (module บังคับ)
// สำคัญ: ห้ามส่ง departid ไปเป็นตัวกรอง — API อ่านแผนกจาก claim ใน token เอง

export interface RequestListQuery {
  // ไม่ส่ง = ทุกโมดูลที่แผนกนี้แจ้งออกไป (ใช้ได้กับ outgoing เท่านั้น
  // — incoming ไม่ส่ง = 400 เพราะ "คิวของแผนกเรา" ผูกกับ workflow ต่อโมดูล)
  module?: string;
  status?: StatusFilter;
  onlyMyTurn?: boolean; // ใช้ได้กับ incoming เท่านั้น
  phase?: RequestPhase[]; // กรองตามจังหวะงาน — ส่งหลายค่าได้ (API รับ comma-separated)
  dateFrom?: string; // YYYY-MM-DD (กรองจาก requestDate)
  dateTo?: string; // YYYY-MM-DD — API รวมทั้งวันให้แล้ว ไม่ต้องบวกวันเผื่อ
  sortBy?: SortBy;
  sortDir?: SortDir;
  page?: number; // เริ่มที่ 1 — ไม่ส่ง = คืนทั้งหมด (ไม่แบ่งหน้า)
  pageSize?: number; // default 50, API clamp ที่ 200
}

const buildQuery = (q: RequestListQuery): string => {
  const p = new URLSearchParams();
  if (q.module) p.set('module', q.module);
  if (q.status && q.status !== 'All') p.set('status', q.status);
  if (q.onlyMyTurn) p.set('onlyMyTurn', 'true');
  if (q.phase && q.phase.length > 0) p.set('phase', q.phase.join(','));
  if (q.dateFrom) p.set('dateFrom', q.dateFrom);
  if (q.dateTo) p.set('dateTo', q.dateTo);
  if (q.sortBy) p.set('sortBy', q.sortBy);
  if (q.sortDir) p.set('sortDir', q.sortDir);
  if (q.page) p.set('page', String(q.page));
  if (q.pageSize) p.set('pageSize', String(q.pageSize));
  const s = p.toString();
  return s ? `?${s}` : '';
};

export const fetchRequestList = (
  direction: RequestDirection,
  query: RequestListQuery,
  token?: string
): Promise<RequestListResponse> =>
  apiGet<RequestListResponse>(`/Requests/${direction}${buildQuery(query)}`, token);

// รายการโมดูลที่ API รองรับ — ใช้เติม dropdown แทน hardcode
// (เปิดแผนกใหม่แล้วหน้าเว็บไม่ต้อง deploy ใหม่)
export const fetchRequestModules = (token?: string, includeWorkflow = false): Promise<RequestModule[]> =>
  apiGet<RequestModule[]>(`/Requests/modules${includeWorkflow ? '?includeWorkflow=true' : ''}`, token);

// นิยาม workflow ของโมดูลเดียว — จำนวนขั้น/ชื่อขั้น/สถานะ มาจาก backend ทั้งหมด
export const fetchRequestWorkflow = (module: string, token?: string): Promise<RequestWorkflow> =>
  apiGet<RequestWorkflow>(`/Requests/workflow?module=${encodeURIComponent(module)}`, token);

// ใบเต็ม 1 ใบ + logs (timeline) + workflow — โหลดตอนเปิดหน้ารายละเอียด (กดดวงตา)
// list ไม่ส่งข้อมูลพวกนี้มา เพราะเปิดดูจริงทีละใบ (ดู API_SPEC_REQUESTS_V2.md §4)
export const fetchRequestDetail = (module: string, docNo: string, token?: string): Promise<RequestDetailResponse> =>
  apiGet<RequestDetailResponse>(
    `/Requests/${encodeURIComponent(module)}/${encodeURIComponent(docNo)}`,
    token
  );

// ── กดทำรายการกับใบแจ้งเรื่อง ─────────────────────────────────
// POST /api/v1/Requests/{module}/{docNo}/action
// action ที่ส่งได้มาจาก item.availableActions เท่านั้น — อย่าคิดชื่อ action เอง
// backend ตรวจสิทธิ์ซ้ำทุกครั้ง ปุ่มบนหน้าเว็บเป็นแค่ UX ไม่ใช่ security
export interface RequestActionBody {
  action: string;
  note?: string | null;
  // ใส่เฉพาะที่ requiredFields ของ action นั้นระบุ (+ ฟิลด์เสริมที่ผู้ใช้กรอก)
  // ฟิลด์ที่ไม่ส่งไป = API คงค่าเดิมใน DB ไว้ ไม่ได้ล้างเป็น null
  fields?: Record<string, string | number | Record<string, number>>;
}

export const postRequestAction = (
  module: string,
  docNo: string,
  body: RequestActionBody,
  token?: string
): Promise<RequestActionResult> =>
  apiSend<RequestActionResult>(
    `/Requests/${encodeURIComponent(module)}/${encodeURIComponent(docNo)}/action`,
    'POST',
    body,
    token
  );
