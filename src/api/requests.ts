import { apiGet } from './client';
import {
  RequestDirection,
  RequestListResponse,
  RequestModule,
  SortBy,
  SortDir,
  StatusFilter,
} from '../types/requestList';

// ── Requests API (ใบแจ้งเรื่อง 2 ทิศทาง) ──────────────────────
// GET /api/v1/Requests/outgoing — ใบที่แผนกเราเป็นคนแจ้ง
// GET /api/v1/Requests/incoming — ใบที่แผนกเรามีขั้นตอนอยู่ใน workflow
// สำคัญ: ห้ามส่ง departid ไปเป็นตัวกรอง — API อ่านแผนกจาก claim ใน token เอง

export interface RequestListQuery {
  module: string; // บังคับ — ไม่ส่ง = 400
  status?: StatusFilter;
  onlyMyTurn?: boolean; // ใช้ได้กับ incoming เท่านั้น (outgoing จะถูกเมิน)
  dateFrom?: string; // YYYY-MM-DD (กรองจาก requestDate)
  dateTo?: string; // YYYY-MM-DD — API รวมทั้งวันให้แล้ว ไม่ต้องบวกวันเผื่อ
  sortBy?: SortBy;
  sortDir?: SortDir;
}

const buildQuery = (q: RequestListQuery): string => {
  const p = new URLSearchParams({ module: q.module });
  if (q.status && q.status !== 'All') p.set('status', q.status);
  if (q.onlyMyTurn) p.set('onlyMyTurn', 'true');
  if (q.dateFrom) p.set('dateFrom', q.dateFrom);
  if (q.dateTo) p.set('dateTo', q.dateTo);
  if (q.sortBy) p.set('sortBy', q.sortBy);
  if (q.sortDir) p.set('sortDir', q.sortDir);
  return p.toString();
};

export const fetchRequestList = (
  direction: RequestDirection,
  query: RequestListQuery,
  token?: string
): Promise<RequestListResponse> =>
  apiGet<RequestListResponse>(`/Requests/${direction}?${buildQuery(query)}`, token);

// รายการโมดูลที่ API รองรับ — ใช้เติม dropdown แทน hardcode
// (เปิดแผนกใหม่แล้วหน้าเว็บไม่ต้อง deploy ใหม่)
export const fetchRequestModules = (token?: string): Promise<RequestModule[]> =>
  apiGet<RequestModule[]>('/Requests/modules', token);
