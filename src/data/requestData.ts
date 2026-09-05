import { RequestPriority, Dept } from '../types/request';

// ── ข้อมูลประกอบ "ฟอร์มสร้างใบแจ้งเรื่อง" ─────────────────────
// ป้ายสถานะ/คอลัมน์ของหน้ารายการย้ายไปที่ src/data/requestListData.ts
// (หน้ารายการต่อ Requests API จริงแล้ว จึงใช้ jobStatus จาก API แทนสถานะที่ประกาศเอง)

// ── ป้ายความเร่งด่วน ─────────────────────────────────────────
export const REQUEST_PRIORITY_META: Record<
  RequestPriority,
  { label: string; color: string; bg: string; border: string }
> = {
  low: { label: 'ต่ำ', color: 'var(--pri-low-fg)', bg: 'var(--pri-low-bg)', border: 'var(--pri-low-bd)' },
  normal: { label: 'ปกติ', color: 'var(--pri-normal-fg)', bg: 'var(--pri-normal-bg)', border: 'var(--pri-normal-bd)' },
  high: { label: 'สูง', color: 'var(--pri-high-fg)', bg: 'var(--pri-high-bg)', border: 'var(--pri-high-bd)' },
  urgent: { label: 'เร่งด่วน', color: 'var(--pri-urgent-fg)', bg: 'var(--pri-urgent-bg)', border: 'var(--pri-urgent-bd)' },
};

// ── สีหน่วยงานปลายทาง (ดู Design System ใน CLAUDE.md) ─────────
export const DEPT_META: Record<Dept, { label: string; color: string; bg: string; border: string }> = {
  HR: { label: 'HR', color: 'var(--dept-hr-fg)', bg: 'var(--dept-hr-bg)', border: 'var(--dept-hr-bd)' },
  PL: { label: 'PL', color: 'var(--dept-pl-fg)', bg: 'var(--dept-pl-bg)', border: 'var(--dept-pl-bd)' },
  SV: { label: 'SV', color: 'var(--dept-sv-fg)', bg: 'var(--dept-sv-bg)', border: 'var(--dept-sv-bd)' },
  IT: { label: 'IT', color: 'var(--dept-it-fg)', bg: 'var(--dept-it-bg)', border: 'var(--dept-it-bd)' },
  PU: { label: 'จัดซื้อ', color: 'var(--dept-pu-fg)', bg: 'var(--dept-pu-bg)', border: 'var(--dept-pu-bd)' },
  CR: { label: 'CR', color: 'var(--dept-it-fg)', bg: 'var(--dept-it-bg)', border: 'var(--dept-it-bd)' },
  GA: { label: 'GA', color: 'var(--dept-ga-fg)', bg: 'var(--dept-ga-bg)', border: 'var(--dept-ga-bd)' },
  IM: { label: 'IM', color: 'var(--dept-im-fg)', bg: 'var(--dept-im-bg)', border: 'var(--dept-im-bd)' },
  AF: { label: 'AF', color: 'var(--dept-af-fg)', bg: 'var(--dept-af-bg)', border: 'var(--dept-af-bd)' },
  SQA: { label: 'SQA', color: 'var(--dept-sqa-fg)', bg: 'var(--dept-sqa-bg)', border: 'var(--dept-sqa-bd)' },
  PS: { label: 'PS', color: 'var(--dept-ps-fg)', bg: 'var(--dept-ps-bg)', border: 'var(--dept-ps-bd)' },
};

// สีกลางสำหรับแผนกที่ยังไม่ได้กำหนดสีไว้ (master มีแผนกได้มากกว่าที่ประกาศ)
export const DEFAULT_DEPT_META = { label: '', color: 'var(--ph-other-fg)', bg: 'var(--ph-other-bg)', border: 'var(--ph-other-bd)' };

// หา meta ของแผนกจาก departmentShort — ไม่พบก็ใช้สีกลาง (label = ชื่อย่อที่ส่งเข้ามา)
export const deptMeta = (departmentShort: string) =>
  DEPT_META[departmentShort as Dept] ?? { ...DEFAULT_DEPT_META, label: departmentShort };
