import { JobStatusCode, RequestListItem, StatusFilter } from '../types/requestList';

// ── ป้ายสถานะงาน (jobStatus จาก API) ─────────────────────────
// ไม่มีรหัส 7 และ 8 — เลขกระโดดจาก 6 ไป 9 (ห้ามวนลูป 1..9)
export const JOB_STATUS_META: Record<
  JobStatusCode,
  { label: string; color: string; bg: string; border: string; group: Exclude<StatusFilter, 'All'> }
> = {
  '1': { label: 'แจ้งซ่อมแล้ว', color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', group: 'Open' },
  '2': { label: 'รับเรื่องแจ้งซ่อมแล้ว', color: '#0e7490', bg: '#ecfeff', border: '#a5f3fc', group: 'Open' },
  '3': { label: 'อยู่ระหว่างดำเนินการซ่อม', color: '#b45309', bg: '#fffbeb', border: '#fde68a', group: 'Open' },
  '4': { label: 'อยู่ระหว่างสำรวจความพึงพอใจ', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', group: 'Open' },
  '5': { label: 'อยู่ระหว่างปิดงาน', color: '#0f766e', bg: '#f0fdfa', border: '#99f6e4', group: 'Open' },
  '6': { label: 'ปิดงานซ่อมแล้ว', color: '#047857', bg: '#ecfdf5', border: '#a7f3d0', group: 'Closed' },
  '9': { label: 'ยกเลิกรายการ', color: '#9f1239', bg: '#fff1f2', border: '#fecdd3', group: 'Cancelled' },
};

const UNKNOWN_STATUS = { color: '#475569', bg: '#f1f5f9', border: '#e2e8f0' };

// meta ของสถานะ — ใช้ jobStatusName จาก API เป็นชื่อ (API แปลมาให้แล้ว)
// รหัสที่ไม่รู้จักยังแสดงได้ ไม่พัง (API เพิ่มสถานะใหม่ได้โดยหน้าเว็บไม่ต้องแก้)
export const jobStatusMeta = (item: RequestListItem) => {
  const known = JOB_STATUS_META[item.jobStatus as JobStatusCode];
  if (known) return { ...known, label: item.jobStatusName || known.label };
  return { ...UNKNOWN_STATUS, label: item.jobStatusName || item.jobStatus || '—', group: 'Open' as const };
};

export const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'All', label: 'ทั้งหมด' },
  { key: 'Open', label: 'ยังไม่ปิด' },
  { key: 'Closed', label: 'ปิดงานแล้ว' },
  { key: 'Cancelled', label: 'ยกเลิก' },
];

// ── นิยามคอลัมน์ ─────────────────────────────────────────────
export type ReqColGroup = 'core' | 'more';
export type ReqColKind = 'mono' | 'date' | 'text' | 'status' | 'turn';

export interface RequestColumn {
  id: string;
  key: keyof RequestListItem;
  label: string;
  group: ReqColGroup;
  width: number;
  align: 'left' | 'center' | 'right';
  kind: ReqColKind;
}

const col = (
  key: keyof RequestListItem,
  label: string,
  group: ReqColGroup,
  width: number,
  align: 'left' | 'center' | 'right',
  kind: ReqColKind
): RequestColumn => ({ id: key, key, label, group, width, align, kind });

// เรื่องที่แจ้งออกไป — อยากรู้ว่า "ตอนนี้เรื่องไปค้างที่ใคร"
export const OUTGOING_COLUMNS: RequestColumn[] = [
  col('docNo', 'เลขที่ใบแจ้ง', 'core', 130, 'left', 'mono'),
  col('requestDate', 'วันที่แจ้ง', 'core', 110, 'center', 'date'),
  col('requestBy', 'ผู้แจ้ง', 'core', 150, 'left', 'text'),
  col('detail', 'รายละเอียด', 'core', 300, 'left', 'text'),
  col('jobStatus', 'สถานะ', 'core', 190, 'left', 'status'),
  col('currentDepartmentName', 'อยู่ที่แผนก', 'core', 160, 'left', 'text'),
  col('description', 'ขั้นตอนปัจจุบัน', 'more', 260, 'left', 'text'),
  col('wfStep', 'ขั้นที่', 'more', 80, 'center', 'text'),
  col('departmentName', 'แผนกผู้แจ้ง', 'more', 160, 'left', 'text'),
];

// เรื่องที่แจ้งเข้ามา — อยากรู้ว่า "ใบไหนถึงคิวเราต้องลงมือ"
export const INCOMING_COLUMNS: RequestColumn[] = [
  col('isMyTurn', 'คิวเรา', 'core', 90, 'center', 'turn'),
  col('docNo', 'เลขที่ใบแจ้ง', 'core', 130, 'left', 'mono'),
  col('requestDate', 'วันที่แจ้ง', 'core', 110, 'center', 'date'),
  col('requestBy', 'ผู้แจ้ง', 'core', 150, 'left', 'text'),
  col('departmentName', 'แผนกผู้แจ้ง', 'core', 160, 'left', 'text'),
  col('detail', 'รายละเอียด', 'core', 280, 'left', 'text'),
  col('jobStatus', 'สถานะ', 'core', 190, 'left', 'status'),
  col('description', 'ขั้นตอนปัจจุบัน', 'more', 260, 'left', 'text'),
  col('wfStep', 'ขั้นที่', 'more', 80, 'center', 'text'),
  col('currentDepartmentName', 'อยู่ที่แผนก', 'more', 160, 'left', 'text'),
];

export type ReqPresetKey = 'default' | 'all';
export const REQ_COLUMN_PRESETS: Record<ReqPresetKey, { label: string; groups: ReqColGroup[] }> = {
  default: { label: 'มาตรฐาน', groups: ['core'] },
  all: { label: 'ทั้งหมด', groups: ['core', 'more'] },
};

export const REQ_STICKY_IDS = ['isMyTurn', 'docNo'];
export const REQ_RESIZABLE_IDS = ['detail', 'description'];

// ── ตัวช่วยอ่าน/แปลงค่า ───────────────────────────────────────
export const fmtDate = (iso?: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB'); // dd/mm/yyyy
};

export const fmtDateTime = (iso?: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return `${d.toLocaleDateString('en-GB')} ${d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`;
};

// ข้อความที่แสดงจริงในเซลล์ — เป็นค่าเปรียบเทียบของตัวกรอง Excel ด้วย
export function cellText(row: RequestListItem, c: RequestColumn): string {
  const v = row[c.key];
  if (c.kind === 'turn') return row.isMyTurn ? 'ถึงคิวเรา' : 'ยังไม่ถึงคิว';
  if (c.kind === 'status') return jobStatusMeta(row).label;
  if (v === undefined || v === null || v === '') return '';
  if (c.kind === 'date') return fmtDate(String(v));
  return String(v);
}

export function compareRequests(a: RequestListItem, b: RequestListItem, c: RequestColumn): number {
  if (c.kind === 'date') {
    const ta = a[c.key] ? new Date(String(a[c.key])).getTime() : -Infinity;
    const tb = b[c.key] ? new Date(String(b[c.key])).getTime() : -Infinity;
    return (isNaN(ta) ? -Infinity : ta) - (isNaN(tb) ? -Infinity : tb);
  }
  if (c.kind === 'turn') return Number(a.isMyTurn) - Number(b.isMyTurn);
  // docNo เป็น string ที่เป็นตัวเลขล้วน — เทียบแบบตัวเลขเพื่อไม่ให้ "9" มาก่อน "10"
  if (c.id === 'docNo') return a.docNo.localeCompare(b.docNo, undefined, { numeric: true });
  return cellText(a, c).localeCompare(cellText(b, c), 'th');
}

// ค้นหารวมในตาราง (เลขที่ / ผู้แจ้ง / รายละเอียด / สถานะ / แผนก)
export function matchesSearch(row: RequestListItem, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return [
    row.docNo,
    row.requestBy,
    row.detail,
    row.jobStatusName,
    row.departmentName,
    row.currentDepartmentName,
    row.description,
  ].some((v) => (v ?? '').toLowerCase().includes(s));
}
