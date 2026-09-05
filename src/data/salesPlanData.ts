import { SaleStatus, SalesPlanLineApi } from '../types/salesPlan';

// ── สไตล์ป้ายสถานะการขาย ────────────────────────────────────
export const SALE_STATUS_META: Record<
  SaleStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  quote: { label: 'เสนอราคา', color: 'var(--tint-blue-fg)', bg: 'var(--tint-blue-bg)', border: 'var(--tint-blue-bd)' },
  progress: { label: 'ระหว่างเสนอ', color: 'var(--tint-purple-fg)', bg: 'var(--tint-purple-bg)', border: 'var(--tint-purple-bd)' },
  booked: { label: 'จองแล้ว รอออกงาน', color: 'var(--tint-amber-fg)', bg: 'var(--tint-amber-bg)', border: 'var(--tint-amber-bd)' },
  won: { label: 'ออกงานแล้ว', color: 'var(--tint-green-fg)', bg: 'var(--tint-green-bg)', border: 'var(--tint-green-bd)' },
  lost: { label: 'LOST SALES', color: 'var(--tint-red-fg)', bg: 'var(--tint-red-bg)', border: 'var(--tint-red-bd)' },
};

// ── นิยามคอลัมน์ + ชุดมุมมอง ─────────────────────────────────
// key = ชื่อฟิลด์ของ API ตรง ๆ (TS ตรวจให้) ; ลำดับใน array = ลำดับคอลัมน์บนตาราง
// group ใช้เลือกว่ามุมมองไหนแสดงคอลัมน์ไหน — 'core' อยู่ทุกมุมมอง, g1/g2 แทรกตามตำแหน่งจริง
export type ColumnGroup = 'core' | 'g1' | 'g2' | 'g3';
export type ColumnKind = 'plan' | 'date' | 'dept' | 'status' | 'mono' | 'money' | 'tag' | 'check' | 'num';

export interface SalesPlanColumn {
  id: string; // ไอดีเฉพาะของคอลัมน์ (บางฟิลด์ถูกใช้ซ้ำสองคอลัมน์ เช่น actualValue)
  key: keyof SalesPlanLineApi;
  label: string;
  group: ColumnGroup;
  width: number;
  align: 'left' | 'center' | 'right';
  kind?: ColumnKind;
}

// ตัวช่วยประกาศคอลัมน์ (id ใช้ค่า key เว้นแต่ระบุเอง)
const col = (
  key: keyof SalesPlanLineApi,
  label: string,
  group: ColumnGroup,
  width: number,
  align: 'left' | 'center' | 'right',
  kind?: ColumnKind,
  id?: string
): SalesPlanColumn => ({ id: id ?? key, key, label, group, width, align, kind });

export const SALES_PLAN_COLUMNS: SalesPlanColumn[] = [
  // ── ส่วนหัว (ทุกมุมมอง) ──
  col('no', 'ลำดับ', 'core', 84, 'center', 'num'),
  col('spid', 'เลขที่แผนขาย', 'core', 120, 'left', 'plan'),
  col('createFDate', 'วันที่ทำแผนขาย', 'core', 112, 'center', 'date'),
  col('custName', 'ชื่อลูกค้า', 'core', 220, 'left'),
  col('deliveryAddress', 'สถานที่ทำงาน', 'core', 180, 'left'),
  col('city', 'จังหวัด', 'core', 96, 'left'),
  col('salemanId', 'ฝ่ายขาย', 'core', 90, 'center', 'dept'),
  col('machineTypeId', 'ประเภทเครื่องจักร', 'core', 128, 'left', 'mono'),
  col('mark', 'รุ่น', 'core', 88, 'left', 'mono'),
  col('planStatus', 'สถานะการขาย', 'core', 150, 'left', 'status'),
  col('planCategory', 'ประเภทแผนขาย', 'core', 116, 'left', 'tag'),
  col('startFromDate', 'วันที่ประมาณการขาย', 'core', 130, 'center', 'date'),
  col('lateDate', 'วันที่เลื่อน', 'core', 108, 'center', 'date'),
  col('lateWeek', 'สัปดาห์ที่เลื่อน', 'core', 104, 'center', 'num'),
  col('planActualDate', 'วันที่ออกงานจริง', 'core', 120, 'center', 'date'),

  // ── กลุ่มปัญหา (มุมมอง 1 และ 2) ──
  col('issueGroup', 'หมวดปัญหา', 'g1', 130, 'left'),
  col('issueDetail', 'รายละเอียดปัญหา', 'g1', 190, 'left'),
  col('planDateMax', 'Plan', 'g1', 76, 'right', 'num'),
  col('actualDateMax', 'Actual', 'g1', 76, 'right', 'num'),

  // ── ส่วนกลาง (ทุกมุมมอง) ──
  col('carId', 'รหัสเครื่องจักร', 'core', 118, 'left', 'mono'),
  col('conditionMonth', 'งานเดือน', 'core', 84, 'center', 'check'),
  col('conditionDay', 'งานวัน', 'core', 78, 'center', 'check'),
  col('periodNotLess', 'จำนวน', 'core', 74, 'right', 'num'),
  col('actualPrice', 'มูลค่าแผนขาย', 'core', 124, 'right', 'money'),
  col('actualValue', 'มูลค่าที่ขายได้', 'core', 124, 'right', 'money', 'actualValueStd'),
  col('remark', 'หมายเหตุ', 'core', 160, 'left'),

  // ── กลุ่มมูลค่า/เอกสาร (เฉพาะมุมมอง 2) ──
  col('planValue', 'มูลค่าแผนขาย', 'g2', 124, 'right', 'money', 'planValueG2'),
  col('actualValue', 'มูลค่าที่ขายแล้ว', 'g2', 124, 'right', 'money', 'actualValueG2'),
  col('subValue', 'คงเหลือ', 'g2', 118, 'right', 'money'),
  col('lostSale', 'Lost Sales', 'g2', 118, 'right', 'money'),
  col('issueCarId', 'สาเหตุไม่ใส่เบอร์รถ', 'g2', 170, 'left'),
  col('quotationId', 'เลขที่ใบเสนอราคา', 'g2', 138, 'left', 'mono'),
  col('poid', 'เลขที่ PO', 'g2', 124, 'left', 'mono'),

  // ── ส่วนท้าย (ทุกมุมมอง) ──
  col('aoId', 'เลขที่ใบจองสินค้า', 'core', 138, 'left', 'mono'),
  col('logId', 'เลขที่ใบจัดส่ง', 'core', 132, 'left', 'mono'),
  col('car', 'เบอร์รถที่ออกงาน', 'core', 138, 'left', 'mono'),
  col('pl6RequestDateTime', 'วันที่ยืนยันออกงาน', 'core', 134, 'center', 'date'),
  col('jobType', 'ลักษณะงาน', 'core', 140, 'left'),

  // ── เฉพาะมุมมอง "ทั้งหมด" ──
  col('planId', 'เลขที่เอกสารแผน', 'g3', 150, 'left', 'mono'),
  col('custAccount', 'รหัสลูกค้า', 'g3', 118, 'left', 'mono'),
  col('module', 'โมดูล', 'g3', 84, 'center'),
  col('planType', 'ประเภทแผน (Type)', 'g3', 120, 'left'),
  col('salesCode', 'รหัสฝ่ายขาย', 'g3', 104, 'right', 'num'),
  col('probability', 'ความคาดหวัง (%)', 'g3', 118, 'right', 'num'),
  col('weekNum', 'สัปดาห์', 'g3', 84, 'center', 'num'),
  col('planActualWeek', 'สัปดาห์ที่ออกงานจริง', 'g3', 140, 'center', 'num'),
  col('checkPlan', 'แผนการขาย', 'g3', 110, 'left'),
  col('weekActual', 'สัปดาห์ที่ขาย', 'g3', 110, 'center', 'num'),
  col('dateActual', 'วันที่ขาย', 'g3', 108, 'center', 'date'),
  col('checkPlanActual', 'แผนขายจริง', 'g3', 110, 'left'),
  col('actualMcStatus', 'สถานะเครื่องจักรตามแผน', 'g3', 160, 'left'),
  col('actualMachineTypeId', 'ประเภทเครื่องจักร1', 'g3', 140, 'left', 'mono'),
  col('week1Plan', 'W1 แผน', 'g3', 78, 'center', 'check'),
  col('week1ValuePlan', 'W1 มูลค่าแผน', 'g3', 112, 'right', 'money'),
  col('week1Actual', 'W1 จริง', 'g3', 78, 'center', 'check'),
  col('week1ValueActual', 'W1 มูลค่าจริง', 'g3', 112, 'right', 'money'),
  col('week2Plan', 'W2 แผน', 'g3', 78, 'center', 'check'),
  col('week2ValuePlan', 'W2 มูลค่าแผน', 'g3', 112, 'right', 'money'),
  col('week2Actual', 'W2 จริง', 'g3', 78, 'center', 'check'),
  col('week2ValueActual', 'W2 มูลค่าจริง', 'g3', 112, 'right', 'money'),
  col('week3Plan', 'W3 แผน', 'g3', 78, 'center', 'check'),
  col('week3ValuePlan', 'W3 มูลค่าแผน', 'g3', 112, 'right', 'money'),
  col('week3Actual', 'W3 จริง', 'g3', 78, 'center', 'check'),
  col('week3ValueActual', 'W3 มูลค่าจริง', 'g3', 112, 'right', 'money'),
  col('week4Plan', 'W4 แผน', 'g3', 78, 'center', 'check'),
  col('week4ValuePlan', 'W4 มูลค่าแผน', 'g3', 112, 'right', 'money'),
  col('week4Actual', 'W4 จริง', 'g3', 78, 'center', 'check'),
  col('week4ValueActual', 'W4 มูลค่าจริง', 'g3', 112, 'right', 'money'),
  col('week5Plan', 'W5 แผน', 'g3', 78, 'center', 'check'),
  col('week5ValuePlan', 'W5 มูลค่าแผน', 'g3', 112, 'right', 'money'),
  col('week5Actual', 'W5 จริง', 'g3', 78, 'center', 'check'),
  col('week5ValueActual', 'W5 มูลค่าจริง', 'g3', 112, 'right', 'money'),
  col('problemName', 'ชื่อปัญหา', 'g3', 140, 'left'),
  col('statusTracking', 'ติดตามสถานะ', 'g3', 130, 'left'),
  col('mktUsability', 'การใช้งานการตลาด', 'g3', 150, 'left'),
  col('isInterchangeable', 'ใช้รถทดแทนได้', 'g3', 110, 'center', 'check'),
  col('interchangeableRemarks', 'หมายเหตุรถทดแทน', 'g3', 160, 'left'),
  col('contactChannelNameEn', 'แผนขายจาก', 'g3', 120, 'left'),
  col('leadSourceNameTh', 'แหล่งข้อมูลจาก', 'g3', 130, 'left'),
  col('leadSourceRemark', 'แหล่งข้อมูลอื่นๆ', 'g3', 170, 'left'),
  col('revise', 'ครั้งที่แก้ไข', 'g3', 100, 'center'),
  col('recNo', 'เลขที่ระเบียน', 'g3', 110, 'right', 'num'),
];

export type PresetKey = 'all' | 'default' | 'show1' | 'show2';

export const COLUMN_PRESETS: Record<PresetKey, { label: string; groups: ColumnGroup[] }> = {
  all: { label: 'ทั้งหมด', groups: ['core', 'g1', 'g2', 'g3'] },
  default: { label: 'มาตรฐาน', groups: ['core'] },
  show1: { label: 'มุมมอง 1', groups: ['core', 'g1'] },
  show2: { label: 'มุมมอง 2', groups: ['core', 'g1', 'g2'] },
};

export const formatMoney = (n: number | null | undefined) =>
  n == null ? '—' : Number(n).toLocaleString('en-US');

// ── แปลงข้อมูลดิบจาก API → แถวในตาราง (best-effort mapping) ───
// แปลง ISO date → dd/mm/yyyy ('—' ถ้าว่าง/ไม่ถูกต้อง)
const fmtApiDate = (iso?: string): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB'); // dd/mm/yyyy
};

// แปลง planStatus (string) → SaleStatus enum (สำหรับป้ายสถานะสี) — ค่าที่ไม่รู้จัก default 'progress'
export function mapPlanStatus(raw?: string): SaleStatus {
  const s = (raw || '').toLowerCase();
  if (/lost|แพ้/.test(s)) return 'lost';
  if (/won|ออกงาน|success|ได้/.test(s)) return 'won';
  if (/book|จอง/.test(s)) return 'booked';
  // ตรวจ 'ระหว่าง/ดำเนิน' ก่อน 'เสนอราคา' — 'ระหว่างเสนอราคา' = กำลังดำเนินการ (progress)
  if (/progress|ระหว่าง|ดำเนิน/.test(s)) return 'progress';
  if (/quote|เสนอราคา/.test(s)) return 'quote';
  return 'progress';
}

// ── ตัวช่วยอ่าน/แปลงค่าของเซลล์ (ใช้ทั้งแสดงผล, เรียงลำดับ, และตัวกรอง) ──
// ข้อความที่แสดงจริงในเซลล์ — ใช้เป็นค่าเปรียบเทียบของตัวกรองแบบ Excel ด้วย
export function cellText(line: SalesPlanLineApi, c: SalesPlanColumn): string {
  const v = line[c.key];
  if (v === undefined || v === null || v === '') return '';
  switch (c.kind) {
    case 'status':
      return String(v); // แสดงข้อความสถานะจริงจาก API (สีมาจาก mapPlanStatus)
    case 'date':
      return fmtApiDate(String(v));
    case 'check':
      return v ? 'ใช่' : 'ไม่ใช่';
    case 'money':
      return formatMoney(Number(v));
    default:
      return String(v);
  }
}

// ค่าที่ใช้เรียงลำดับ — ตัวเลข/วันที่เรียงตามค่าจริง ไม่ใช่ตามข้อความ
export function sortValue(line: SalesPlanLineApi, c: SalesPlanColumn): number | string {
  const v = line[c.key];
  if (v === undefined || v === null || v === '') return c.kind === 'date' || c.kind === 'num' || c.kind === 'money' ? -Infinity : '';
  if (c.kind === 'date') {
    const t = new Date(String(v)).getTime();
    return isNaN(t) ? -Infinity : t;
  }
  if (c.kind === 'num' || c.kind === 'money') return Number(v) || 0;
  if (c.kind === 'check') return v ? 1 : 0;
  return cellText(line, c);
}

// เปรียบเทียบสองแถวตามคอลัมน์ที่เลือก (ข้อความใช้กฎการเรียงภาษาไทย)
export function compareLines(a: SalesPlanLineApi, b: SalesPlanLineApi, c: SalesPlanColumn): number {
  const va = sortValue(a, c);
  const vb = sortValue(b, c);
  if (typeof va === 'number' && typeof vb === 'number') return va - vb;
  return String(va).localeCompare(String(vb), 'th');
}

// ── ฟอร์มแก้ไข (drawer) — ใช้โครงเดียวกับ API 1:1 ────────────
// แปลง ISO date → yyyy-MM-dd สำหรับ <input type="date"> ('' ถ้าว่าง/ไม่ถูกต้อง)
export const toDateInput = (iso?: string): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
};

// บรรทัดว่างสำหรับโหมด "เพิ่มแผนขาย" — ทุกฟิลด์เป็นค่าว่างจริง ไม่มีค่าปลอม
export function emptyLine(planId: string): SalesPlanLineApi {
  return {
    planId, planDate: '', planType: '', module: '', no: 0,
    custAccount: '', custName: '', deliveryAddress: '', city: '', salesCode: 0, salemanId: '',
    machineTypeId: '', planStatus: '', probability: 0,
    startFromDate: '', weekNum: 0, lateDate: '', lateWeek: 0,
    planActualDate: '', planActualWeek: 0,
    issueGroup: '', issueDetail: '', planDateMax: 0, actualDateMax: 0,
    carId: '', checkPlan: '', conditionMonth: false, conditionDay: false, periodNotLess: 0,
    week1Plan: false, week1ValuePlan: 0, week1Actual: false, week1ValueActual: 0,
    week2Plan: false, week2ValuePlan: 0, week2Actual: false, week2ValueActual: 0,
    week3Plan: false, week3ValuePlan: 0, week3Actual: false, week3ValueActual: 0,
    week4Plan: false, week4ValuePlan: 0, week4Actual: false, week4ValueActual: 0,
    week5Plan: false, week5ValuePlan: 0, week5Actual: false, week5ValueActual: 0,
    actualPrice: 0, remark: '', weekActual: 0, dateActual: '', checkPlanActual: '',
    actualMcStatus: '', actualMachineTypeId: '',
    planValue: 0, actualValue: 0, subValue: 0, lostSale: 0,
    revise: '', createBy: '', createDate: '', modifyBy: '', modifyDate: '', recNo: 0,
    quotationId: '', poid: '', logId: '', issueCarId: '', aoId: '',
    planCategory: '', spid: '', createFDate: '', mark: '', statusTracking: '',
    mktUsability: '', problemName: '', startFromDate1: '',
    isInterchangeable: false, interchangeableRemarks: '',
    contactChannelId: 0, leadSourceId: 0, leadSourceRemark: '',
    car: null, pl6RequestDateTime: null, contactChannelNameEn: null, leadSourceNameTh: null, actualValue1: null,
  };
}

// นิยามช่องกรอกใน drawer — key ต้องตรงกับชื่อฟิลด์ของ API (TS ตรวจให้)
export type ApiFieldKind = 'text' | 'number' | 'money' | 'date' | 'bool';

export interface ApiFieldDef {
  key: keyof SalesPlanLineApi;
  label: string; // ชื่อไทยอ่านง่าย (ชื่อฟิลด์ API แสดงกำกับใต้ label ในหน้าจอ)
  kind: ApiFieldKind;
  span2?: boolean;
  readOnly?: boolean; // ฟิลด์ที่ระบบกำหนด แก้ไม่ได้
}

export type DrawerSectionIcon = 'plan' | 'customer' | 'machine' | 'status' | 'date' | 'money' | 'issue' | 'doc' | 'lead' | 'note' | 'audit';

export const DRAWER_SECTIONS: { title: string; icon: DrawerSectionIcon; fields: ApiFieldDef[] }[] = [
  {
    title: 'ข้อมูลแผน',
    icon: 'plan',
    fields: [
      { key: 'planId', label: 'เลขที่แผน', kind: 'text' },
      { key: 'planDate', label: 'วันที่ทำแผน', kind: 'date' },
      { key: 'planType', label: 'ประเภทแผน', kind: 'text' },
      { key: 'module', label: 'ฝ่าย / โมดูล', kind: 'text' },
      { key: 'no', label: 'ลำดับที่', kind: 'number' },
      { key: 'revise', label: 'ครั้งที่แก้ไข', kind: 'text' },
      { key: 'planCategory', label: 'หมวดแผน', kind: 'text' },
    ],
  },
  {
    title: 'ข้อมูลลูกค้า',
    icon: 'customer',
    fields: [
      { key: 'custAccount', label: 'รหัสลูกค้า', kind: 'text' },
      { key: 'custName', label: 'ชื่อลูกค้า', kind: 'text' },
      { key: 'deliveryAddress', label: 'สถานที่ทำงาน / จัดส่ง', kind: 'text', span2: true },
      { key: 'city', label: 'จังหวัด', kind: 'text' },
      { key: 'salesCode', label: 'รหัสฝ่ายขาย', kind: 'number' },
      { key: 'salemanId', label: 'รหัสพนักงานขาย', kind: 'text' },
    ],
  },
  {
    title: 'เครื่องจักร',
    icon: 'machine',
    fields: [
      { key: 'machineTypeId', label: 'ประเภทเครื่องจักร (แผน)', kind: 'text' },
      { key: 'carId', label: 'เบอร์รถ (แผน)', kind: 'text' },
      { key: 'actualMachineTypeId', label: 'ประเภทเครื่องจักร (จริง)', kind: 'text' },
      { key: 'actualMcStatus', label: 'สถานะเครื่องจักร (จริง)', kind: 'text' },
      { key: 'isInterchangeable', label: 'ใช้รถทดแทนได้', kind: 'bool' },
      { key: 'interchangeableRemarks', label: 'หมายเหตุรถทดแทน', kind: 'text' },
    ],
  },
  {
    title: 'สถานะการขาย',
    icon: 'status',
    fields: [
      { key: 'planStatus', label: 'สถานะแผน', kind: 'text' },
      { key: 'probability', label: 'ความน่าจะเป็น (%)', kind: 'number' },
      { key: 'checkPlan', label: 'ตรวจสอบแผน', kind: 'text' },
      { key: 'checkPlanActual', label: 'ตรวจสอบแผน (จริง)', kind: 'text' },
      { key: 'mark', label: 'เครื่องหมาย', kind: 'text' },
      { key: 'statusTracking', label: 'ติดตามสถานะ', kind: 'text' },
      { key: 'mktUsability', label: 'การใช้งานการตลาด', kind: 'text', span2: true },
    ],
  },
  {
    title: 'กำหนดการ',
    icon: 'date',
    fields: [
      { key: 'startFromDate', label: 'วันที่เริ่มงาน (แผน)', kind: 'date' },
      { key: 'weekNum', label: 'สัปดาห์ที่', kind: 'number' },
      { key: 'startFromDate1', label: 'วันที่เริ่มงาน (ข้อความ)', kind: 'text' },
      { key: 'lateDate', label: 'วันที่เลื่อน', kind: 'date' },
      { key: 'lateWeek', label: 'สัปดาห์ที่เลื่อน', kind: 'number' },
      { key: 'planActualDate', label: 'วันที่ออกงาน (แผน)', kind: 'date' },
      { key: 'planActualWeek', label: 'สัปดาห์ออกงาน (แผน)', kind: 'number' },
      { key: 'dateActual', label: 'วันที่ออกงานจริง', kind: 'date' },
      { key: 'weekActual', label: 'สัปดาห์ออกงานจริง', kind: 'number' },
      { key: 'createFDate', label: 'วันที่สร้างรายการ', kind: 'date' },
      { key: 'planDateMax', label: 'จำนวนวันสูงสุด (แผน)', kind: 'number' },
      { key: 'actualDateMax', label: 'จำนวนวันสูงสุด (จริง)', kind: 'number' },
      { key: 'periodNotLess', label: 'ระยะเวลาขั้นต่ำ', kind: 'number' },
      { key: 'conditionMonth', label: 'เงื่อนไขรายเดือน', kind: 'bool' },
      { key: 'conditionDay', label: 'เงื่อนไขรายวัน', kind: 'bool' },
    ],
  },
  {
    title: 'มูลค่า',
    icon: 'money',
    fields: [
      { key: 'planValue', label: 'มูลค่าแผนขาย', kind: 'money' },
      { key: 'actualValue', label: 'มูลค่าที่ขายได้', kind: 'money' },
      { key: 'subValue', label: 'มูลค่าคงเหลือ', kind: 'money' },
      { key: 'lostSale', label: 'มูลค่าที่เสียไป', kind: 'money' },
      { key: 'actualPrice', label: 'ราคาจริง', kind: 'money' },
    ],
  },
  {
    title: 'ปัญหา / อุปสรรค',
    icon: 'issue',
    fields: [
      { key: 'issueGroup', label: 'กลุ่มปัญหา', kind: 'text' },
      { key: 'issueCarId', label: 'เบอร์รถที่มีปัญหา', kind: 'text' },
      { key: 'problemName', label: 'ชื่อปัญหา', kind: 'text' },
      { key: 'issueDetail', label: 'รายละเอียดปัญหา', kind: 'text', span2: true },
    ],
  },
  {
    title: 'เอกสารอ้างอิง',
    icon: 'doc',
    fields: [
      { key: 'quotationId', label: 'เลขที่ใบเสนอราคา', kind: 'text' },
      { key: 'poid', label: 'เลขที่ใบสั่งซื้อ (PO)', kind: 'text' },
      { key: 'logId', label: 'เลขที่ Log', kind: 'text' },
      { key: 'aoId', label: 'เลขที่ AO', kind: 'text' },
      { key: 'spid', label: 'เลขที่ SP', kind: 'text' },
    ],
  },
  {
    title: 'แหล่งที่มา (Lead)',
    icon: 'lead',
    fields: [
      { key: 'contactChannelId', label: 'ช่องทางติดต่อ', kind: 'number' },
      { key: 'leadSourceId', label: 'แหล่งที่มา', kind: 'number' },
      { key: 'leadSourceRemark', label: 'หมายเหตุแหล่งที่มา', kind: 'text', span2: true },
    ],
  },
  {
    title: 'หมายเหตุ',
    icon: 'note',
    fields: [{ key: 'remark', label: 'หมายเหตุ', kind: 'text', span2: true }],
  },
  {
    title: 'ประวัติระบบ',
    icon: 'audit',
    fields: [
      { key: 'createBy', label: 'ผู้สร้าง', kind: 'text', readOnly: true },
      { key: 'createDate', label: 'วันที่สร้าง', kind: 'date', readOnly: true },
      { key: 'modifyBy', label: 'ผู้แก้ไขล่าสุด', kind: 'text', readOnly: true },
      { key: 'modifyDate', label: 'วันที่แก้ไขล่าสุด', kind: 'date', readOnly: true },
      { key: 'recNo', label: 'เลขที่ระเบียน', kind: 'number', readOnly: true },
    ],
  },
];

// ══════════════════════════════════════════════════════════════
// ตัวเลือกสำหรับฟอร์ม "เพิ่มแผนขาย" (mock — รอต่อ API / โปรแกรม insert จริง)
// insert อาจมีข้อมูลมากกว่านี้ ทำ UI ก่อนตามที่ตกลง
// ══════════════════════════════════════════════════════════════

// ค่าพิเศษของ "แหล่งที่มาของข้อมูล" ที่ต้องระบุเพิ่ม
export const LEAD_SOURCE_OTHER = 'อื่นๆ';

// ชื่อพนักงานขาย (กรณี Mgr/เจ้าหน้าที่คีย์แผนขายแทนฝ่ายขาย)
export const SALESPERSON_OPTIONS: string[] = [
  'สมชาย ใจดี',
  'สุนิสา วงศ์ทอง',
  'ประเสริฐ มั่นคง',
  'อาทิตย์ แสงเพชร',
  'กมลชนก ศรีสุข',
  'ธนวัฒน์ พูนผล',
];

// แผนขายมาจากที่ไหน
export const PLAN_SOURCE_OPTIONS: string[] = [
  'พนักงานขายเสนอเอง',
  'ลูกค้าติดต่อเข้ามา (โทรศัพท์)',
  'ลูกค้าติดต่อเข้ามา (Walk-in)',
  'เว็บไซต์ / Line OA',
  'ลูกค้าเก่า / งานต่อเนื่อง',
  'ประมูลงาน',
];

// แหล่งที่มาของข้อมูล (เลือก "อื่นๆ" แล้วต้องระบุ)
export const LEAD_SOURCE_OPTIONS: string[] = [
  'Facebook',
  'Google / เว็บค้นหา',
  'ลูกค้าแนะนำต่อ',
  'พนักงานแนะนำ',
  'งานเดิม / ลูกค้าประจำ',
  LEAD_SOURCE_OTHER,
];

// ── ลูกค้า (แสดงทั้งชื่อและรหัส) ──
export interface CustomerOption {
  account: string;
  name: string;
}
export const CUSTOMER_OPTIONS: CustomerOption[] = [
  { account: 'C-00125', name: 'บริษัท ไทยคอนสตรัคชั่น จำกัด' },
  { account: 'C-00341', name: 'หจก. รุ่งเรืองการโยธา' },
  { account: 'C-00587', name: 'บริษัท เอเชีย บิลดิ้ง จำกัด' },
  { account: 'C-00742', name: 'บริษัท สยามพัฒนาที่ดิน จำกัด' },
  { account: 'C-00918', name: 'บริษัท พี.เค. เอ็นจิเนียริ่ง จำกัด' },
  { account: 'C-01033', name: 'หจก. ช.ทวีทรัพย์ก่อสร้าง' },
];

// จังหวัด
export const PROVINCE_OPTIONS: string[] = [
  'กรุงเทพมหานคร',
  'นนทบุรี',
  'ปทุมธานี',
  'สมุทรปราการ',
  'ชลบุรี',
  'ระยอง',
  'พระนครศรีอยุธยา',
  'ฉะเชิงเทรา',
  'สระบุรี',
  'นครราชสีมา',
];

// ── ประเภทเครื่องจักร + รุ่นในแต่ละประเภท (รุ่นถูกกรองตามประเภทที่เลือก) ──
export interface MachineTypeOption {
  id: string;
  models: string[];
}
export const MACHINE_TYPE_OPTIONS: MachineTypeOption[] = [
  { id: 'รถเครน 4 ล้อ', models: ['KATO NK-70', 'KATO NK-75', 'TADANO GR-160', 'TADANO GR-250'] },
  { id: 'รถเครนตีนตะขาบ', models: ['KOBELCO 7055', 'KOBELCO 7120', 'SUMITOMO SC-500'] },
  { id: 'รถเฮี๊ยบ (Boom Truck)', models: ['UNIC UR-V340', 'UNIC UR-V500', 'HIAB 190'] },
  { id: 'รถกระเช้า', models: ['AICHI SK-12', 'AICHI SK-17', 'GENIE Z-45'] },
  { id: 'รถโฟล์คลิฟท์', models: ['TOYOTA 8FD25', 'KOMATSU FD30', 'TCM FD35'] },
];

// ── ประเภทงาน + หน่วยของจำนวน (แสดง label ต่อท้ายช่องจำนวน) ──
export interface WorkKindOption {
  value: string;
  unit: string;
}
export const WORK_KIND_OPTIONS: WorkKindOption[] = [
  { value: 'งานเดือน', unit: 'เดือน' },
  { value: 'งานวัน', unit: 'วัน' },
  { value: 'เที่ยว', unit: 'เที่ยว' },
  { value: 'ชิ้น', unit: 'ชิ้น' },
];

// เลขที่ใบเสนอราคา (เลือกได้ + พิมพ์เองได้ถ้าไม่มีในรายการ)
export const QUOTATION_OPTIONS: string[] = [
  'QT-2569-0431',
  'QT-2569-0432',
  'QT-2569-0447',
  'QT-2569-0450',
  'QT-2569-0468',
];

// แผนรายสัปดาห์ W1–W5 — เรนเดอร์เป็นตารางย่อแยกจาก DRAWER_SECTIONS
export const WEEK_ROWS: {
  week: number;
  plan: keyof SalesPlanLineApi;
  valuePlan: keyof SalesPlanLineApi;
  actual: keyof SalesPlanLineApi;
  valueActual: keyof SalesPlanLineApi;
}[] = [
  { week: 1, plan: 'week1Plan', valuePlan: 'week1ValuePlan', actual: 'week1Actual', valueActual: 'week1ValueActual' },
  { week: 2, plan: 'week2Plan', valuePlan: 'week2ValuePlan', actual: 'week2Actual', valueActual: 'week2ValueActual' },
  { week: 3, plan: 'week3Plan', valuePlan: 'week3ValuePlan', actual: 'week3Actual', valueActual: 'week3ValueActual' },
  { week: 4, plan: 'week4Plan', valuePlan: 'week4ValuePlan', actual: 'week4Actual', valueActual: 'week4ValueActual' },
  { week: 5, plan: 'week5Plan', valuePlan: 'week5ValuePlan', actual: 'week5Actual', valueActual: 'week5ValueActual' },
];
