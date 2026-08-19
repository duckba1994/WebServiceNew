import { RequestListItem, StatusFilter } from '../types/requestList';
import { PHASE_META, phaseIndex, phaseLabel, phaseOf, isRequesterSide } from './requestPhase';

// คีย์ประจำแถว — ตารางรวมหลายแผนกไว้ด้วยกัน docNo อย่างเดียวไม่ unique
// (แต่ละแผนกออกเลขของตัวเอง เลข "2600043" มีได้ทั้งของ IT และ AF)
export const requestKey = (row: RequestListItem): string => `${row.module}::${row.docNo}`;

// ── ป้ายสถานะงาน ─────────────────────────────────────────────
// ชื่อ  ← jobStatusName จาก API (แต่ละแผนกเรียกไม่เหมือนกัน — API แปลมาให้แล้ว)
// สี   ← จังหวะงาน (phase) ไม่ใช่รหัส jobStatus
//
// ห้ามผูกสีกับรหัส jobStatus เพราะรหัสเดียวกันคนละความหมายในแต่ละแผนก
// (SQA 1 = รอรับเรื่อง / แผนกอื่น 1 = รอ Mgr อนุมัติ) — ดู requestPhase.ts
export const jobStatusMeta = (item: RequestListItem) => {
  const meta = PHASE_META[phaseOf(item)];
  return {
    label: item.jobStatusName || item.jobStatus || meta.label,
    color: meta.color,
    bg: meta.bg,
    border: meta.border,
  };
};

export const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'All', label: 'ทั้งหมด' },
  { key: 'Open', label: 'ยังไม่ปิด' },
  { key: 'Closed', label: 'ปิดงานแล้ว' },
  { key: 'Cancelled', label: 'ยกเลิก' },
];

// ── นิยามคอลัมน์ ─────────────────────────────────────────────
export type ReqColGroup = 'core' | 'more';
export type ReqColKind = 'mono' | 'date' | 'text' | 'status' | 'turn' | 'phase' | 'module' | 'ourTurn' | 'step';

export interface RequestColumn {
  id: string;
  key: keyof RequestListItem;
  label: string;
  group: ReqColGroup;
  width: number;
  align: 'left' | 'center' | 'right';
  kind: ReqColKind;
}

// id แยกจาก key เพราะบางคอลัมน์คำนวณจากหลายฟิลด์ (เช่น ourTurn / phase)
const col = (
  id: string,
  key: keyof RequestListItem,
  label: string,
  group: ReqColGroup,
  width: number,
  align: 'left' | 'center' | 'right',
  kind: ReqColKind
): RequestColumn => ({ id, key, label, group, width, align, kind });

// เรื่องที่แจ้งออกไป — รวมทุกแผนกปลายทางไว้ตารางเดียว
// คำถามในใจผู้ใช้คือ "เรื่องที่แจ้งไปถึงไหนแล้ว" ไม่ใช่ "เรื่องของแผนก IT"
// จึงต้องมี "แจ้งไปที่" (module) และ "จังหวะงาน" (phase) ที่เทียบข้ามแผนกได้
export const OUTGOING_COLUMNS: RequestColumn[] = [
  col('ourTurn', 'currentDepartId', 'คิวเรา', 'core', 96, 'center', 'ourTurn'),
  col('docNo', 'docNo', 'เลขที่ใบแจ้ง', 'core', 130, 'left', 'mono'),
  col('module', 'module', 'แจ้งไปที่', 'core', 110, 'center', 'module'),
  col('requestDate', 'requestDate', 'วันที่แจ้ง', 'core', 110, 'center', 'date'),
  col('requestBy', 'requestBy', 'ผู้แจ้ง', 'core', 140, 'left', 'text'),
  col('detail', 'detail', 'รายละเอียด', 'core', 280, 'left', 'text'),
  col('phase', 'wfStatus', 'จังหวะงาน', 'core', 150, 'left', 'phase'),
  col('jobStatus', 'jobStatus', 'สถานะ (ตามแผนก)', 'core', 190, 'left', 'status'),
  col('currentDepartmentName', 'currentDepartmentName', 'อยู่ที่แผนก', 'core', 150, 'left', 'text'),
  col('description', 'description', 'ขั้นตอนปัจจุบัน', 'more', 260, 'left', 'text'),
  col('wfStep', 'wfStep', 'ขั้นที่', 'more', 90, 'center', 'step'),
  col('departmentName', 'departmentName', 'แผนกผู้แจ้ง', 'more', 160, 'left', 'text'),
];

// เรื่องที่แจ้งเข้ามา — อยากรู้ว่า "ใบไหนถึงคิวเราต้องลงมือ"
export const INCOMING_COLUMNS: RequestColumn[] = [
  col('isMyTurn', 'isMyTurn', 'คิวเรา', 'core', 90, 'center', 'turn'),
  col('docNo', 'docNo', 'เลขที่ใบแจ้ง', 'core', 130, 'left', 'mono'),
  col('requestDate', 'requestDate', 'วันที่แจ้ง', 'core', 110, 'center', 'date'),
  col('requestBy', 'requestBy', 'ผู้แจ้ง', 'core', 150, 'left', 'text'),
  col('departmentName', 'departmentName', 'แผนกผู้แจ้ง', 'core', 160, 'left', 'text'),
  col('detail', 'detail', 'รายละเอียด', 'core', 280, 'left', 'text'),
  col('phase', 'wfStatus', 'จังหวะงาน', 'core', 150, 'left', 'phase'),
  col('jobStatus', 'jobStatus', 'สถานะ (ตามแผนก)', 'core', 190, 'left', 'status'),
  col('description', 'description', 'ขั้นตอนปัจจุบัน', 'more', 260, 'left', 'text'),
  col('wfStep', 'wfStep', 'ขั้นที่', 'more', 90, 'center', 'step'),
  col('currentDepartmentName', 'currentDepartmentName', 'อยู่ที่แผนก', 'more', 160, 'left', 'text'),
];

export type ReqPresetKey = 'default' | 'all';
export const REQ_COLUMN_PRESETS: Record<ReqPresetKey, { label: string; groups: ReqColGroup[] }> = {
  default: { label: 'มาตรฐาน', groups: ['core'] },
  all: { label: 'ทั้งหมด', groups: ['core', 'more'] },
};

export const REQ_STICKY_IDS = ['isMyTurn', 'ourTurn', 'docNo'];
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

// ขั้นที่ — "2 จาก 5" เมื่อ API ส่ง wfStepTotal มา (ยังไม่ส่ง → เหลือแค่ "2")
// ตัวเลขขั้นเดี่ยว ๆ ตีความข้ามแผนกไม่ได้: 2 จาก 3 (เกือบเสร็จ) กับ
// 2 จาก 6 (เพิ่งเริ่ม) หน้าตาเหมือนกันทั้งที่คนละเรื่อง
export const stepText = (row: RequestListItem): string => {
  if (row.wfStep === null || row.wfStep === undefined) return '';
  return row.wfStepTotal ? `${row.wfStep} จาก ${row.wfStepTotal}` : String(row.wfStep);
};

// ข้อความที่แสดงจริงในเซลล์ — เป็นค่าเปรียบเทียบของตัวกรอง Excel ด้วย
export function cellText(row: RequestListItem, c: RequestColumn): string {
  const v = row[c.key];
  if (c.kind === 'turn') return row.isMyTurn ? 'ถึงคิวเรา' : 'ยังไม่ถึงคิว';
  if (c.kind === 'ourTurn') return isRequesterSide(row) ? 'รอเราลงมือ' : 'รอแผนกปลายทาง';
  if (c.kind === 'phase') return phaseLabel(row);
  if (c.kind === 'status') return jobStatusMeta(row).label;
  if (c.kind === 'step') return stepText(row);
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
  if (c.kind === 'ourTurn') return Number(isRequesterSide(a)) - Number(isRequesterSide(b));
  // จังหวะงานเรียงตามลำดับของ workflow ไม่ใช่ตามตัวอักษรไทย
  if (c.kind === 'phase') return phaseIndex(a.phase) - phaseIndex(b.phase);
  if (c.kind === 'step') return (a.wfStep ?? -1) - (b.wfStep ?? -1);
  // docNo เป็น string ที่เป็นตัวเลขล้วน — เทียบแบบตัวเลขเพื่อไม่ให้ "9" มาก่อน "10"
  // ตารางรวมหลายแผนก docNo ซ้ำกันได้ → เท่ากันแล้วเรียงต่อด้วยโมดูล
  if (c.id === 'docNo') {
    const d = a.docNo.localeCompare(b.docNo, undefined, { numeric: true });
    return d !== 0 ? d : a.module.localeCompare(b.module);
  }
  return cellText(a, c).localeCompare(cellText(b, c), 'th');
}

// ค้นหารวมในตาราง (เลขที่ / ผู้แจ้ง / รายละเอียด / สถานะ / แผนก)
export function matchesSearch(row: RequestListItem, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return [
    row.docNo,
    row.module,
    row.requestBy,
    row.detail,
    row.jobStatusName,
    row.departmentName,
    row.currentDepartmentName,
    row.description,
  ].some((v) => (v ?? '').toLowerCase().includes(s));
}
