import { RequestListItem, RequestPhase } from '../types/requestList';

// ═══════════════════════════════════════════════════════════════
//  จังหวะงาน (phase) — หน้าตาบน UI
// ═══════════════════════════════════════════════════════════════
//
//  การ map "WFStatus ของแต่ละแผนก → phase" ย้ายไปอยู่ที่ backend แล้ว (API v2)
//  ไฟล์นี้เหลือแค่เรื่องการแสดงผล: สี ลำดับ และป้ายสำรอง
//  → หน้าเว็บไม่รู้จัก WFStatus ของแผนกไหนเลย เปิดแผนกใหม่ก็ไม่ต้องแก้อะไร
//
//  ห้ามนับ/ให้สีด้วย jobStatus ข้ามแผนกเด็ดขาด — รหัสเดียวกันคนละความหมาย
//  (SQA "1" = รอรับเรื่อง แต่แผนกอื่น "1" = รอ Mgr อนุมัติ, PS มีรหัสซ้ำ 2 ขั้น,
//   รหัส "ปิดงานแล้ว" ไม่เท่ากันสักแผนก) — ใช้ phase จาก API เท่านั้น
// ───────────────────────────────────────────────────────────────

export interface PhaseMeta {
  label: string; // ป้ายสำรอง ใช้เมื่อ API ไม่ได้ส่ง phaseName มา
  short: string; // ป้ายสั้นสำหรับการ์ด KPI
  color: string;
  bg: string;
  border: string;
}

export const PHASE_META: Record<RequestPhase, PhaseMeta> = {
  waiting_approve: { label: 'รออนุมัติ', short: 'รออนุมัติ', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  waiting_accept: { label: 'รอปลายทางรับเรื่อง', short: 'รอรับเรื่อง', color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
  in_progress: { label: 'กำลังดำเนินการ', short: 'กำลังดำเนินการ', color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  waiting_review: { label: 'รอตรวจรับ / ประเมิน', short: 'รอตรวจรับ', color: '#0e7490', bg: '#ecfeff', border: '#a5f3fc' },
  waiting_close: { label: 'รอปิดงาน', short: 'รอปิดงาน', color: '#0f766e', bg: '#f0fdfa', border: '#99f6e4' },
  closed: { label: 'ปิดงานแล้ว', short: 'ปิดงานแล้ว', color: '#047857', bg: '#ecfdf5', border: '#a7f3d0' },
  cancelled: { label: 'ยกเลิก', short: 'ยกเลิก', color: '#9f1239', bg: '#fff1f2', border: '#fecdd3' },
  other: { label: 'อื่น ๆ (ยังไม่รู้จัก)', short: 'อื่น ๆ', color: '#475569', bg: '#f1f5f9', border: '#e2e8f0' },
};

// ลำดับการแสดงการ์ด KPI — ไล่ตามจังหวะของงานจริง
// ใช้เรียงเท่านั้น ไม่ใช่รายการการ์ดที่ต้องมี: การ์ดสร้างจาก phaseSummary ที่ API
// ส่งมา แผนกที่ไม่มีขั้นนั้นจึงไม่มีการ์ดโผล่มาให้รก (GA/IM ไม่มีขั้นรอปิดงาน,
// มีแต่ IT ที่มีขั้น Survey)
export const PHASE_ORDER: RequestPhase[] = [
  'waiting_approve',
  'waiting_accept',
  'in_progress',
  'waiting_review',
  'waiting_close',
  'closed',
  'cancelled',
  'other',
];

export const phaseIndex = (p: RequestPhase | null): number => {
  const i = PHASE_ORDER.indexOf(p ?? 'other');
  return i === -1 ? PHASE_ORDER.length : i;
};

// phase ที่ API ยังไม่รู้จักตกมาเป็น 'other' — ต้องเห็นในการ์ด ไม่ใช่ซ่อน
// (นับใบที่ยังค้างเป็น "เสร็จแล้ว" คือความผิดพลาดที่ไม่มีใครจับได้)
export const phaseOf = (item: RequestListItem): RequestPhase =>
  item.phase && item.phase in PHASE_META ? item.phase : 'other';

export const phaseMetaOf = (item: RequestListItem): PhaseMeta => PHASE_META[phaseOf(item)];

// ป้ายไทย — ใช้ชื่อจาก API ก่อนเสมอ (แผนกใหม่เรียกชื่อของตัวเองได้)
export const phaseLabel = (item: RequestListItem): string =>
  item.phaseName || PHASE_META[phaseOf(item)].label;

// ── ลูกอยู่ฝั่งไหน ────────────────────────────────────────────
// หลาย workflow วนกลับมาหาผู้แจ้งตอนท้าย (Survey / Received-Service /
// Request-Close-Job) → ใบที่งานเสร็จหมดแล้วรอแค่เรากดปิด จะค้างเงียบ ๆ
// ถ้าไม่มีตัวชี้นี้ — API v2 คำนวณมาให้แล้วใน ownerType
export const isRequesterSide = (item: RequestListItem): boolean => item.ownerType === 'requester';
