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

// สีเป็น CSS variable ไม่ใช่ hex — ค่าจริงอยู่ใน index.css และสลับเองตอนเปิดโหมดมืด
// (สีชุดนี้ถูกส่งเข้า style={{}} ตรง ๆ หลายที่ Tailwind จึงเอื้อมไม่ถึง)
// ห้ามเปลี่ยนกลับเป็น hex — จะได้ตัวหนังสือสีเข้มบนพื้นเข้มในโหมดมืด
export const PHASE_META: Record<RequestPhase, PhaseMeta> = {
  waiting_approve: { label: 'รออนุมัติ', short: 'รออนุมัติ', color: 'var(--ph-approve-fg)', bg: 'var(--ph-approve-bg)', border: 'var(--ph-approve-bd)' },
  waiting_accept: { label: 'รอปลายทางรับเรื่อง', short: 'รอรับเรื่อง', color: 'var(--ph-accept-fg)', bg: 'var(--ph-accept-bg)', border: 'var(--ph-accept-bd)' },
  in_progress: { label: 'กำลังดำเนินการ', short: 'กำลังดำเนินการ', color: 'var(--ph-progress-fg)', bg: 'var(--ph-progress-bg)', border: 'var(--ph-progress-bd)' },
  waiting_review: { label: 'รอตรวจรับ / ประเมิน', short: 'รอตรวจรับ', color: 'var(--ph-review-fg)', bg: 'var(--ph-review-bg)', border: 'var(--ph-review-bd)' },
  waiting_close: { label: 'รอปิดงาน', short: 'รอปิดงาน', color: 'var(--ph-close-fg)', bg: 'var(--ph-close-bg)', border: 'var(--ph-close-bd)' },
  closed: { label: 'ปิดงานแล้ว', short: 'ปิดงานแล้ว', color: 'var(--ph-closed-fg)', bg: 'var(--ph-closed-bg)', border: 'var(--ph-closed-bd)' },
  cancelled: { label: 'ยกเลิก', short: 'ยกเลิก', color: 'var(--ph-cancel-fg)', bg: 'var(--ph-cancel-bg)', border: 'var(--ph-cancel-bd)' },
  other: { label: 'อื่น ๆ (ยังไม่รู้จัก)', short: 'อื่น ๆ', color: 'var(--ph-other-fg)', bg: 'var(--ph-other-bg)', border: 'var(--ph-other-bd)' },
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
