import { RequestPriority, Dept } from '../types/request';

// ── ข้อมูลประกอบ "ฟอร์มสร้างใบแจ้งเรื่อง" ─────────────────────
// ป้ายสถานะ/คอลัมน์ของหน้ารายการย้ายไปที่ src/data/requestListData.ts
// (หน้ารายการต่อ Requests API จริงแล้ว จึงใช้ jobStatus จาก API แทนสถานะที่ประกาศเอง)

// ── ป้ายความเร่งด่วน ─────────────────────────────────────────
export const REQUEST_PRIORITY_META: Record<
  RequestPriority,
  { label: string; color: string; bg: string; border: string }
> = {
  low: { label: 'ต่ำ', color: '#475569', bg: '#f1f5f9', border: '#e2e8f0' },
  normal: { label: 'ปกติ', color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd' },
  high: { label: 'สูง', color: '#c2410c', bg: '#fff7ed', border: '#fed7aa' },
  urgent: { label: 'เร่งด่วน', color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
};

// ── สีหน่วยงานปลายทาง (ดู Design System ใน CLAUDE.md) ─────────
export const DEPT_META: Record<Dept, { label: string; color: string; bg: string; border: string }> = {
  HR: { label: 'HR', color: '#2d7d46', bg: '#ecfdf3', border: '#bbf7d0' },
  PL: { label: 'PL', color: '#5b3fa6', bg: '#f5f3ff', border: '#ddd6fe' },
  SV: { label: 'SV', color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  IT: { label: 'IT', color: '#1a5fb4', bg: '#eff6ff', border: '#bfdbfe' },
  PU: { label: 'จัดซื้อ', color: '#0f766e', bg: '#f0fdfa', border: '#99f6e4' },
  CR: { label: 'CR', color: '#1a5fb4', bg: '#eff6ff', border: '#bfdbfe' },
};

// สีกลางสำหรับแผนกที่ยังไม่ได้กำหนดสีไว้ (master มีแผนกได้มากกว่าที่ประกาศ)
export const DEFAULT_DEPT_META = { label: '', color: '#475569', bg: '#f1f5f9', border: '#e2e8f0' };

// หา meta ของแผนกจาก departmentShort — ไม่พบก็ใช้สีกลาง (label = ชื่อย่อที่ส่งเข้ามา)
export const deptMeta = (departmentShort: string) =>
  DEPT_META[departmentShort as Dept] ?? { ...DEFAULT_DEPT_META, label: departmentShort };
