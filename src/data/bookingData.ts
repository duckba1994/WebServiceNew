import { BookingApi, BookingAuditEntry, BookingChangeDoc, BookingDocStatus, BookingRow } from '../types/booking';

// ── สไตล์ป้ายสถานะเอกสาร ────────────────────────────────────
export const BOOKING_STATUS_META: Record<
  BookingDocStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  created: { label: 'สร้างเอกสาร', color: 'var(--tint-blue-fg)', bg: 'var(--tint-blue-bg)', border: 'var(--tint-blue-bd)' },
  creatorConfirmed: { label: 'ผู้สร้างยืนยันเอกสาร', color: 'var(--tint-blue-fg)', bg: 'var(--tint-blue-bg)', border: 'var(--tint-blue-bd)' },
  creatorMgrApproved: { label: 'Mgr ผู้สร้างอนุมัติเอกสาร', color: 'var(--tint-indigo-fg)', bg: 'var(--tint-indigo-bg)', border: 'var(--tint-indigo-bd)' },
  plAssigned: { label: 'PL ระบุเบอร์รถ', color: 'var(--tint-purple-fg)', bg: 'var(--tint-purple-bg)', border: 'var(--tint-purple-bd)' },
  plMgrApproved: { label: 'Mgr PL อนุมัติ', color: 'var(--tint-purple-fg)', bg: 'var(--tint-purple-bg)', border: 'var(--tint-purple-bd)' },
  svConfirmed: { label: 'SV ยืนยันเบอร์รถ', color: 'var(--tint-amber-fg)', bg: 'var(--tint-amber-bg)', border: 'var(--tint-amber-bd)' },
  svMgrApproved: { label: 'Mgr SV อนุมัติ', color: 'var(--tint-amber-fg)', bg: 'var(--tint-amber-bg)', border: 'var(--tint-amber-bd)' },
  approved: { label: 'อนุมัติแล้ว (จบ)', color: 'var(--tint-green-fg)', bg: 'var(--tint-green-bg)', border: 'var(--tint-green-bd)' },
  rejected: { label: 'ไม่อนุมัติ (ตีกลับ)', color: 'var(--tint-red-fg)', bg: 'var(--tint-red-bg)', border: 'var(--tint-red-bd)' },
  cancelled: { label: 'ยกเลิกเอกสาร', color: 'var(--tint-slate-fg)', bg: 'var(--tint-slate-bg)', border: 'var(--tint-slate-bd)' },
};

// ── สีป้ายสถานะเอกสารตาม StateCode (BWS.StateCode) ───────────
// อ้างอิงสีจากฝั่ง WinForms (VB): แต่ละ StateCode → โทนสีเดียวกัน (ปรับเป็นพาเลตต์ pill ให้อ่านง่ายบนเว็บ)
export interface StateColor { color: string; bg: string; border: string }
export const BOOKING_STATE_COLORS: Record<string, StateColor> = {
  CREATE: { color: 'var(--tint-slate-fg)', bg: 'var(--tint-slate-bg)', border: 'var(--tint-slate-bd)' }, // White → เทา/ขาว (neutral)
  DOC_CONFIRMED: { color: 'var(--tint-red-fg)', bg: 'var(--tint-red-bg)', border: 'var(--tint-red-bd)' }, // Red
  MGR_DOC_APPROVAL: { color: 'var(--tint-salmon-fg)', bg: 'var(--tint-salmon-bg)', border: 'var(--tint-salmon-bd)' }, // LightSalmon
  PL_ASSIGN_VEHICLE: { color: 'var(--tint-salmon-fg)', bg: 'var(--tint-salmon-bg)', border: 'var(--tint-salmon-bd)' }, // LightSalmon
  PL_MGR_APPROVAL: { color: 'var(--tint-choco-fg)', bg: 'var(--tint-choco-bg)', border: 'var(--tint-choco-bd)' }, // Chocolate
  SV_CONFIRM_VEHICLE: { color: 'var(--tint-pink-fg)', bg: 'var(--tint-pink-bg)', border: 'var(--tint-pink-bd)' }, // Pink
  SV_MGR_APPROVAL: { color: 'var(--tint-gold-fg)', bg: 'var(--tint-gold-bg)', border: 'var(--tint-gold-bd)' }, // Gold
  FINAL_MGR_APPROVAL: { color: 'var(--tint-blue-fg)', bg: 'var(--tint-blue-bg)', border: 'var(--tint-blue-bd)' }, // Blue
  REJECTED: { color: 'var(--tint-purple-fg)', bg: 'var(--tint-purple-bg)', border: 'var(--tint-purple-bd)' }, // Violet
  CANCEL: { color: 'var(--tint-sky-fg)', bg: 'var(--tint-sky-bg)', border: 'var(--tint-sky-bd)' }, // SkyBlue
};

// StateCode → สีป้าย (fallback = โทนเทากลาง ถ้าไม่รู้จักรหัส)
export function stateColorOf(stateCode: string): StateColor {
  return BOOKING_STATE_COLORS[stateCode] ?? { color: 'var(--tint-slate-fg)', bg: 'var(--tint-slate-bg)', border: 'var(--tint-slate-bd)' };
}

// docStatus (enum ภายใน) → StateCode ของ backend (ใช้กับ mock / เดาสีเมื่อ API ไม่ส่ง StateCode)
export const STATUS_TO_STATE_CODE: Record<BookingDocStatus, string> = {
  created: 'CREATE',
  creatorConfirmed: 'DOC_CONFIRMED',
  creatorMgrApproved: 'MGR_DOC_APPROVAL',
  plAssigned: 'PL_ASSIGN_VEHICLE',
  plMgrApproved: 'PL_MGR_APPROVAL',
  svConfirmed: 'SV_CONFIRM_VEHICLE',
  svMgrApproved: 'SV_MGR_APPROVAL',
  approved: 'FINAL_MGR_APPROVAL',
  rejected: 'REJECTED',
  cancelled: 'CANCEL',
};

// ── ขั้นตอนการอนุมัติ (Workflow) ─────────────────────────────
// 8 ขั้นตามลำดับ ; แต่ละขั้นผูกกับ "ส่วนของเอกสาร" (section 1–4) ที่จะแสดงข้อมูลในหน้าอนุมัติ
export const BOOKING_WORKFLOW: {
  short: string; // ป้ายสั้นบนแถบ workflow
  title: string; // ชื่อเต็มของขั้น
  role: string; // ตำแหน่งผู้ดำเนินการ
  section: 1 | 2 | 3 | 4; // ส่วนข้อมูลที่ขั้นนี้เกี่ยวข้อง
}[] = [
  { short: 'สร้าง', title: 'สร้าง', role: 'ฝ่ายขาย / ผู้จอง', section: 1 },
  { short: 'ยืนยัน', title: 'ผู้สร้างยืนยันเอกสาร', role: 'ฝ่ายขาย / ผู้จอง', section: 1 },
  { short: 'MGR', title: 'MGR อนุมัติ', role: 'ผจก. ฝ่ายผู้จัดทำ', section: 1 },
  { short: 'PL เบอร์รถ', title: 'PL ระบุเบอร์รถ', role: 'เจ้าหน้าที่ฝ่าย PL', section: 2 },
  { short: 'PL MGR', title: 'PL MGR อนุมัติ', role: 'ผจก. ฝ่าย PL', section: 2 },
  { short: 'SV ข้อมูล', title: 'SV ยืนยันข้อมูล', role: 'เจ้าหน้าที่ฝ่าย SV', section: 3 },
  { short: 'SV MGR', title: 'SV MGR อนุมัติ', role: 'ผจก. ฝ่าย SV', section: 3 },
  { short: 'MGR ต้นสังกัด', title: 'MGR ต้นสังกัดยืนยันทวนสอบข้อมูล', role: 'ผจก. ฝ่ายผู้จัดทำ', section: 4 },
];

export const WORKFLOW_LEN = BOOKING_WORKFLOW.length; // = 8

// ── 4 ขั้นหลัก (แสดงบนแถบสถานะ) — map จาก section ของขั้นย่อย ──
export const BOOKING_STAGES: { section: 1 | 2 | 3 | 4; label: string }[] = [
  { section: 1, label: 'สร้าง' },
  { section: 2, label: 'PL ระบุเบอร์รถ' },
  { section: 3, label: 'SV ยืนยันข้อมูล' },
  { section: 4, label: 'MGR ต้นสังกัดทวนสอบข้อมูล' },
];

// จำนวนขั้นที่ดำเนินการเสร็จแล้วตามสถานะเอกสาร (0–8)
// สถานะจบพิเศษ (rejected/cancelled) เก็บจำนวนขั้นที่ผ่านก่อนหยุด (mock)
export const STATUS_STEPS_DONE: Record<BookingDocStatus, number> = {
  created: 1,
  creatorConfirmed: 2,
  creatorMgrApproved: 3,
  plAssigned: 4,
  plMgrApproved: 5,
  svConfirmed: 6,
  svMgrApproved: 7,
  approved: 8,
  rejected: 2, // ผ่าน 2 ขั้น แล้วถูก ผจก.ผู้สร้าง ตีกลับที่ขั้นที่ 3 (mock)
  cancelled: 1, // สร้างแล้วถูกยกเลิกที่ขั้นยืนยันเอกสาร (mock)
};

// สถานะจบแบบพิเศษ (null = ยัง in-progress หรืออนุมัติจบปกติ)
export function docTermination(s: BookingDocStatus): 'rejected' | 'cancelled' | null {
  return s === 'rejected' ? 'rejected' : s === 'cancelled' ? 'cancelled' : null;
}

// ══════════════════════════════════════════════════════════════
// แปลงข้อมูลดิบจาก API (GET /api/v1/Bookings) → แถวในตาราง
// ══════════════════════════════════════════════════════════════

// ISO datetime → dd/mm/yyyy ('' ถ้าว่าง/ผิดรูปแบบ)
function fmtApiDate(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB'); // dd/mm/yyyy
}

// เดา docStatus จาก nextStateName (ขั้นที่ "กำลังรอ") → ขั้นที่เพิ่งเสร็จก่อนหน้า
// best-effort: เมื่อ backend ส่งตารางสถานะ workflow ที่แน่นอนมาแล้ว ควรแม็พจาก wfStateId แทน
export function mapBookingStatus(api: BookingApi): BookingDocStatus {
  if (api.remarkReject) return 'rejected';
  if (api.remarkCancel) return 'cancelled';
  const n = (api.nextStateName || '').toLowerCase();
  if (!n) return 'approved'; // ไม่มีขั้นถัดไป = อนุมัติจบ
  const hasMgr = /mgr|ผจก|ผู้จัดการ/.test(n);
  // ฝ่าย PL: "รอ PL ระบุเบอร์รถ" = ยังไม่ระบุ (creatorMgrApproved) ; "รอ PL Mgr ยืนยัน" = ระบุแล้ว (plAssigned)
  if (/pl/.test(n)) return hasMgr ? 'plAssigned' : 'creatorMgrApproved';
  // ฝ่าย SV: "รอ SV ยืนยัน" = PL Mgr อนุมัติแล้ว (plMgrApproved) ; "รอ SV Mgr" = SV ยืนยันแล้ว (svConfirmed)
  if (/sv/.test(n)) return hasMgr ? 'svConfirmed' : 'plMgrApproved';
  // section 4: "รอ MGR ต้นสังกัดทวนสอบ" = SV Mgr อนุมัติแล้ว
  if (/ทวนสอบ|ต้นสังกัด/.test(n)) return 'svMgrApproved';
  if (hasMgr) return 'creatorConfirmed'; // รอ Mgr ผู้สร้างอนุมัติเอกสาร
  return 'created'; // รอผู้สร้างยืนยันเอกสาร
}

// เดาธงเน้นแถว: เกินกำหนดเริ่มงานแต่ยังไม่จบ = urgent (best-effort)
function mapBookingFlag(api: BookingApi, status: BookingDocStatus): BookingRow['flag'] {
  if (status === 'approved' || status === 'rejected' || status === 'cancelled') return '';
  const start = api.startWorkDt ? new Date(api.startWorkDt).getTime() : NaN;
  if (!isNaN(start) && start < Date.now()) return 'urgent';
  return '';
}

export function mapBookingApi(api: BookingApi): BookingRow {
  const status = mapBookingStatus(api);
  const durationText = [api.duration ?? '', api.description ?? ''].join(' ').trim();
  const svReadyDate = fmtApiDate(api.machineAvailableOnDateSv);
  const remarkSv = api.remarkSv || '';
  return {
    id: api.bookingId,
    book: api.bookingNo || '',
    createDate: fmtApiDate(api.bookingDt),
    docStatus: status,
    // แสดงข้อความสถานะตรงตาม nextStateName ; ถ้าว่าง (จบ/ตีกลับ/ยกเลิก) ใช้ label ของสถานะที่เดาได้แทน
    docStatusText: api.nextStateName || BOOKING_STATUS_META[status].label,
    // ใช้ StateCode จาก backend ถ้ามี ; ไม่มีก็เดาจากสถานะ (เพื่อคงสี badge)
    stateCode: api.stateCode || STATUS_TO_STATE_CODE[status],
    purpose: api.purposeNameTh || '',
    customer: api.customerName || '',
    jobType: api.workDetail || '',
    site: api.workAddress || '',
    startDate: fmtApiDate(api.startWorkDt),
    endDate: fmtApiDate(api.endWorkDt),
    duration: durationText,
    machine: api.machineTypeId || '',
    truckPL: api.machineTypeIdPl || '—',
    truckSV: api.machineTypeIdSv || '—',
    replyPL: api.carAssignmentsPlNameTh || '',
    quotationNo: api.quotationNo || '',
    contactName: api.contactName || '',
    contactPhone: api.contactPhone || '',
    deliveryNo: api.deliveryNo || '',
    plSupplyDate: fmtApiDate(api.machineAvailableOnDatePl),
    remarkPL: api.remarkPl || '',
    replySV: api.carVerificationsSvNameTh || '',
    svReadyDate,
    // สาเหตุผลิตรถไม่ทัน = remarkSv เมื่อมีวันที่ SV ผลิตรถทัน
    svLateReason: svReadyDate ? remarkSv : '',
    // สาเหตุการระบุเบอร์รถใหม่ = remarkSv เมื่อ SV ระบุเบอร์รถใหม่
    svNewTruckReason: api.machineTypeIdSv ? remarkSv : '',
    remarkReject: api.remarkReject || '',
    remarkCancel: api.remarkCancel || '',
    salesperson: api.saleserName || '',
    reply: api.machineTypeIdSv || api.carVerificationsSvId != null ? 'ready' : '',
    flag: mapBookingFlag(api, status),
  };
}

// ชื่อผู้ดำเนินการ + เวลา mock ประจำแต่ละขั้น (รอต่อ API)
const WORKFLOW_ACTORS = [
  'สมชาย ใจดี',
  'สมชาย ใจดี',
  'ธนา วงศ์ใหญ่',
  'อชิรญา เจนชล',
  'กมล ศรีสุข',
  'อำนาจ เฉลิมวงศ์ HV',
  'ปรีชา ทองมาก',
  'วิชัย เจริญสุข',
];
const WORKFLOW_TIMES = ['11:20', '11:45', '13:05', '14:14', '14:40', '15:10', '15:35', '16:05'];

export type StepState = 'done' | 'current' | 'todo' | 'rejected' | 'cancelled';
export interface WorkflowStep {
  short: string;
  title: string;
  role: string;
  section: 1 | 2 | 3 | 4;
  actor: string;
  at: string; // วัน-เวลา ('' ถ้ายังไม่ถึงขั้นนี้)
  atShort: string; // เวลาอย่างเดียว เช่น '14:14'
  state: StepState;
}

// ขั้นหลัก (รวมสถานะจากขั้นย่อยของแต่ละ section) — ใช้วาดแถบ 4 ขั้น
export interface BookingStage {
  section: 1 | 2 | 3 | 4;
  label: string;
  state: StepState;
  repStepIndex: number; // ดัชนีขั้นย่อยตัวแทน (ใช้ตั้ง activeStep เมื่อคลิก)
  doneCount: number; // ขั้นย่อยที่เสร็จ
  total: number; // ขั้นย่อยทั้งหมดในขั้นหลัก
  lastActor: string; // ผู้ดำเนินการขั้นย่อยล่าสุดที่เสร็จ ('' ถ้ายังไม่มี)
  lastAt: string; // เวลาขั้นย่อยล่าสุดที่เสร็จ ('' ถ้ายังไม่มี)
}

// สร้างข้อมูล workflow + ผู้อนุมัติถัดไป จากแถวใบจอง (mock จนกว่าจะต่อ API)
export function buildBookingProgress(row: BookingRow): {
  steps: WorkflowStep[];
  stages: BookingStage[];
  nextApprover: string | null;
  termination: 'rejected' | 'cancelled' | null;
  audit: BookingAuditEntry[];
} {
  const done = STATUS_STEPS_DONE[row.docStatus];
  const term = docTermination(row.docStatus);
  const day = row.createDate.slice(0, 2); // dd จาก dd/mm/yyyy
  const dateLabel = `${Number(day)} ส.ค.`;

  const steps: WorkflowStep[] = BOOKING_WORKFLOW.map((s, i) => {
    let state: StepState;
    if (i < done) state = 'done';
    else if (i === done && term) state = term; // ขั้นที่หยุด (ตีกลับ/ยกเลิก)
    else if (i === done) state = 'current';
    else state = 'todo';
    return {
      short: s.short,
      title: s.title,
      role: s.role,
      section: s.section,
      actor: WORKFLOW_ACTORS[i],
      at: i < done ? `${dateLabel} ${WORKFLOW_TIMES[i]}` : '',
      atShort: WORKFLOW_TIMES[i],
      state,
    };
  });

  const nextApprover = !term && done < WORKFLOW_LEN ? WORKFLOW_ACTORS[done] : null;

  const audit: BookingAuditEntry[] = steps
    .filter((s) => s.state === 'done')
    .map((s) => ({ step: s.title, actor: s.actor, at: s.at }));

  // รวมขั้นย่อยเป็น 4 ขั้นหลักตาม section
  const stages: BookingStage[] = BOOKING_STAGES.map(({ section, label }) => {
    const idxs = steps
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => s.section === section);
    const sub = idxs.map(({ s }) => s);
    const doneIdxs = idxs.filter(({ s }) => s.state === 'done');
    const doneCount = doneIdxs.length;

    let state: StepState;
    if (sub.some((s) => s.state === 'rejected')) state = 'rejected';
    else if (sub.some((s) => s.state === 'cancelled')) state = 'cancelled';
    else if (doneCount === sub.length) state = 'done';
    else if (sub.some((s) => s.state === 'current')) state = 'current';
    else state = 'todo';

    // ขั้นย่อยตัวแทน: ขั้นที่หยุด (rejected/cancelled) > done ล่าสุด > current > ขั้นแรกของ section
    const stopped = idxs.find(({ s }) => s.state === 'rejected' || s.state === 'cancelled');
    const lastDone = doneIdxs.length ? doneIdxs[doneIdxs.length - 1] : undefined;
    const current = idxs.find(({ s }) => s.state === 'current');
    const repStepIndex = (stopped ?? lastDone ?? current ?? idxs[0]).i;

    const last = lastDone?.s;
    return {
      section,
      label,
      state,
      repStepIndex,
      doneCount,
      total: sub.length,
      lastActor: last?.actor ?? '',
      lastAt: last?.at ?? '',
    };
  });

  return { steps, stages, nextApprover, termination: term, audit };
}

// ── ข้อมูลตัวอย่างประจำแต่ละส่วน (mock — อ้างอิงหน้าจอ WinForms ที่ผู้ใช้ส่งมา) ──
export const MOCK_STEP_DETAIL = {
  pl: {
    machineStatus: 'เครื่องจักรและอปต. พร้อม',
    carStatus: 'N',
    operator: 'วสัน เรืองดี',
  },
  sv: {
    confirm: 'ยืนยันข้อมูลเบอร์รถ ตามที่ PL ระบุและสามารถผลิตได้ตามวันที่ต้องการ',
  },
  sales: {
    deliveryStatus: 'ยืนยันการจัดส่งสินค้า',
    modelYear: 'ALL || 1985',
    sizeTon: '160',
  },
};

// ── ประวัติการเปลี่ยนแปลงใบจอง (mock — อ้างอิงหน้าจอ WinForms ใบเปลี่ยนแปลง) ──
export const MOCK_BOOKING_CHANGES: BookingChangeDoc[] = [
  {
    changeNo: 'CA690187',
    editDate: '22/07/2026',
    rev: 2,
    groupLabel: 'เรื่องที่แก้ไข / Change Details',
    fields: [
      { label: 'เลื่อนกำหนดจอง', rev: 1, before: '17/07/2026', after: '24/07/2026' },
      { label: 'เปลี่ยนสถานที่ทำงาน', rev: 1, before: 'นวนคร ปทุมธานี', after: 'บ้านดุง อุดรธานี' },
      { label: 'อื่นๆ', rev: 1, detail: 'ขอสลิง 5 ตัน' },
    ],
    reason: 'หน้างานไม่พร้อม',
    changedBy: 'ขนิษฐา ไทยอ่อน',
  },
  {
    changeNo: 'CA690184',
    editDate: '17/07/2026',
    rev: 1,
    groupLabel: 'เรื่องที่แก้ไข (PL) / Change Details (PL)',
    fields: [
      { label: 'เปลี่ยนพนักงานขับ', rev: 1, before: 'อภิชัย นิลเกตุ', after: 'วินัย พันธ์ดี' },
      {
        label: 'เปลี่ยนเบอร์รถ PL',
        rev: 1,
        beforeLabel: 'เบอร์รถ เดิม / Car No. (Before)',
        afterLabel: 'เบอร์รถ ใหม่ / Car No. (New)',
        before: '10/29',
        after: '10/33',
        extra: [
          { label: 'สถานะรถ / Machine Status', value: 'H' },
          { label: 'วันหมดอายุสถานะ / Status Exp.', value: '30/09/2026' },
        ],
      },
    ],
    reason: 'ปรับแผนจัดรถตามคิวงาน',
    changedBy: 'กมล ศรีสุข',
  },
];

// ── นิยามคอลัมน์ ─────────────────────────────────────────────
export type BookingColumnKind = 'book' | 'date' | 'status' | 'mono' | 'reply';
// กลุ่มคอลัมน์ (ใช้เลือกว่ามุมมองไหนแสดงคอลัมน์ไหน — เหมือนหน้าแผนขาย)
export type BookingColumnGroup = 'core' | 'more';

export interface BookingColumn {
  id: string; // ไอดีเฉพาะของคอลัมน์ (ใช้กับการเรียง/กรอง/ปรับความกว้าง)
  key: keyof BookingRow | 'no';
  label: string;
  group: BookingColumnGroup;
  width: number;
  align: 'left' | 'center' | 'right';
  kind?: BookingColumnKind;
  resizable?: boolean; // ปรับความกว้างได้ (ลากขอบขวาของหัวคอลัมน์)
}

const bcol = (
  key: keyof BookingRow | 'no',
  label: string,
  group: BookingColumnGroup,
  width: number,
  align: 'left' | 'center' | 'right',
  kind?: BookingColumnKind,
  resizable?: boolean
): BookingColumn => ({ id: String(key), key, label, group, width, align, kind, resizable });

// ลำดับคอลัมน์ตามที่ผู้ใช้กำหนด (WinForms → Web) — อย่าสลับลำดับโดยไม่จำเป็น
export const BOOKING_COLUMNS: BookingColumn[] = [
  bcol('book', 'เลขที่ใบจอง', 'core', 118, 'left', 'book'),
  bcol('createDate', 'วันที่สร้างใบจอง', 'core', 118, 'center', 'date'),
  bcol('docStatus', 'สถานะเอกสาร', 'core', 200, 'left', 'status'),
  bcol('purpose', 'วัตถุประสงค์', 'core', 160, 'left'),
  bcol('customer', 'ชื่อลูกค้า', 'core', 220, 'left', undefined, true),
  bcol('jobType', 'ลักษณะงาน', 'core', 150, 'left', undefined, true),
  bcol('site', 'สถานที่ทำงาน', 'core', 160, 'left', undefined, true),
  bcol('startDate', 'วันที่เริ่มทำงาน', 'core', 118, 'center', 'date'),
  bcol('endDate', 'วันที่สิ้นสุดการทำงาน', 'core', 128, 'center', 'date'),
  bcol('duration', 'ระยะเวลาเช่า', 'core', 110, 'center'),
  bcol('machine', 'ประเภทเครื่องจักร', 'core', 130, 'left', 'mono'),
  bcol('truckPL', 'เบอร์รถที่ PL ระบุ', 'core', 120, 'center', 'mono'),
  bcol('truckSV', 'เบอร์รถใหม่ที่ SV ระบุ', 'core', 140, 'center', 'mono'),
  bcol('replyPL', 'สถานะการตอบกลับ PL', 'more', 160, 'left'),
  bcol('quotationNo', 'เลขที่ใบเสนอราคา', 'more', 130, 'left', 'mono'),
  bcol('contactName', 'ชื่อผู้ติดต่อหน้างาน', 'more', 150, 'left', undefined, true),
  bcol('contactPhone', 'เบอร์ผู้ติดต่อหน้างาน', 'more', 140, 'left', 'mono'),
  bcol('deliveryNo', 'เลขที่ใบจัดส่ง', 'more', 120, 'left', 'mono'),
  bcol('plSupplyDate', 'วันที่ PL จัดหา อปต.', 'more', 130, 'center', 'date'),
  bcol('remarkPL', 'หมายเหตุ PL', 'more', 180, 'left', undefined, true),
  bcol('replySV', 'สถานะการตอบกลับของ SV', 'more', 170, 'left'),
  bcol('svReadyDate', 'วันที่ SV ผลิตรถทัน', 'more', 130, 'center', 'date'),
  bcol('svLateReason', 'สาเหตุผลิตรถไม่ทัน', 'more', 180, 'left', undefined, true),
  bcol('svNewTruckReason', 'สาเหตุการระบุเบอร์รถใหม่', 'more', 180, 'left', undefined, true),
  bcol('remarkReject', 'สาเหตุไม่ยืนยันการจอง', 'more', 180, 'left', undefined, true),
  bcol('remarkCancel', 'สาเหตุยกเลิกการจอง', 'more', 180, 'left', undefined, true),
  bcol('salesperson', 'ชื่อพนักงานขาย', 'core', 150, 'left', undefined, true),
];

// ── ชุดมุมมองคอลัมน์ (จำนวนคอลัมน์ตามที่กำหนด — เหมือนหน้าแผนขาย) ──
export type BookingPresetKey = 'default' | 'all';
export const BOOKING_COLUMN_PRESETS: Record<BookingPresetKey, { label: string; groups: BookingColumnGroup[] }> = {
  default: { label: 'มาตรฐาน', groups: ['core'] },
  all: { label: 'ทั้งหมด', groups: ['core', 'more'] },
};

// ── ตัวช่วยอ่านค่าเซลล์ (ใช้ทั้งการเรียงลำดับ และตัวกรองแบบ Excel) ──
// ข้อความที่แสดงจริงในเซลล์ — ใช้เป็นค่าเปรียบเทียบของตัวกรองด้วย
export function bookingCellText(row: BookingRow, c: BookingColumn): string {
  if (c.key === 'no') return String(row.id);
  const v = row[c.key as keyof BookingRow];
  if (v === undefined || v === null || v === '' || v === '—') return '';
  switch (c.kind) {
    case 'status':
      return row.docStatusText || BOOKING_STATUS_META[row.docStatus].label;
    case 'reply':
      return row.reply === 'ready' ? 'เครื่องจักรพร้อม' : '';
    default:
      return String(v);
  }
}

// แปลงวันที่ dd/mm/yyyy → เวลา (ms) สำหรับการเรียงตามวันจริง (-Infinity ถ้าว่าง/ผิดรูปแบบ)
function parseDMY(s: string): number {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
  if (!m) return -Infinity;
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])).getTime();
}

// เปรียบเทียบสองแถวตามคอลัมน์ที่เลือก (ข้อความใช้กฎการเรียงภาษาไทย)
export function compareBookings(a: BookingRow, b: BookingRow, c: BookingColumn): number {
  if (c.key === 'no') return a.id - b.id;
  if (c.kind === 'date') {
    return parseDMY(String(a[c.key as keyof BookingRow] ?? '')) - parseDMY(String(b[c.key as keyof BookingRow] ?? ''));
  }
  return bookingCellText(a, c).localeCompare(bookingCellText(b, c), 'th');
}

// ── ตัวเลือกในตัวกรองเพิ่มเติม ────────────────────────────────
export const FILTER_CUSTOMERS = ['-- ทั้งหมด --', 'บริษัท ฤทธา จำกัด', 'ธนาคารไทยพาณิชย์ จำกัด (มหาชน)'];
export const FILTER_TRUCKS = ['-- ทั้งหมด --', '10/27', '10/28'];
export const FILTER_DOC_STATUSES = [
  '--- ทั้งหมด ---',
  'สร้างเอกสาร',
  'ผู้สร้างยืนยันเอกสาร',
  'Mgr ผู้สร้างอนุมัติเอกสาร',
  'PL ระบุเบอร์รถ',
  'Mgr PL อนุมัติ',
  'SV ยืนยันเบอร์รถ',
  'Mgr SV อนุมัติ',
  'อนุมัติแล้ว (จบ)',
  'ไม่อนุมัติ (ตีกลับ)',
  'ยกเลิกเอกสาร',
];

// ── mock data (รอต่อ API) — ครอบคลุมทุกสถานะ workflow ────────
// ค่าเริ่มต้นของฟิลด์ที่เพิ่มใหม่ (ยังว่างในหลายแถว) — ลดความยาวของ mock แต่ละแถว
const BK_EXTRA_DEFAULTS = {
  replyPL: '',
  quotationNo: '',
  contactName: '',
  contactPhone: '',
  deliveryNo: '',
  plSupplyDate: '',
  remarkPL: '',
  replySV: '',
  svReadyDate: '',
  svLateReason: '',
  svNewTruckReason: '',
  remarkReject: '',
  remarkCancel: '',
  salesperson: '',
} as const;

export const MOCK_BOOKINGS: BookingRow[] = [
  { id: 1, book: 'PPD690259', createDate: '17/07/2026', docStatus: 'created', docStatusText: 'รอผู้จัดทำตรวจสอบการจอง', stateCode: 'CREATE', purpose: 'จองเพื่อสอบถามข้อมูล', customer: 'บริษัท ไนซ์ สตรีม จำกัด', jobType: 'ค่าขนส่ง-ประกอบบูม', site: 'อ.นครชัยศรี จ.นครปฐม', startDate: '31/07/2026', endDate: '31/07/2026', duration: '1 วัน', machine: '06-350TT', truckPL: '—', truckSV: '—', reply: '', flag: '', ...BK_EXTRA_DEFAULTS, contactName: 'คุณสมพร', contactPhone: '081-234-5678', salesperson: 'สมชาย ใจดี' },
  { id: 2, book: 'PPD690236', createDate: '02/07/2026', docStatus: 'creatorConfirmed', docStatusText: 'รอผจก.ฝ่ายผู้จัดทำตรวจสอบการจอง', stateCode: 'DOC_CONFIRMED', purpose: 'จองเพื่อสอบถามข้อมูล', customer: 'บริษัท ชินเท็ค คอนสตรัคชั่น จำกัด (มหาชน)', jobType: 'ช่วยงานฐานราก', site: 'โครงการโรงพยาบาล', startDate: '27/04/2026', endDate: '26/06/2026', duration: '2 เดือน', machine: '07-20EX', truckPL: '—', truckSV: '—', reply: '', flag: '', ...BK_EXTRA_DEFAULTS, contactName: 'คุณวิภา', contactPhone: '089-111-2233', quotationNo: 'QT690112', salesperson: 'สมชาย ใจดี' },
  { id: 3, book: 'PPD690235', createDate: '29/06/2026', docStatus: 'creatorMgrApproved', docStatusText: 'รอ PL ระบุเบอร์รถ', stateCode: 'MGR_DOC_APPROVAL', purpose: 'จองเพื่อสอบถามข้อมูล', customer: 'ธนาคารไทยพาณิชย์ จำกัด (มหาชน)', jobType: 'งานยกทั่วไป', site: '18/20 หมู่ 7 ถ.บางนา', startDate: '12/05/2026', endDate: '19/05/2026', duration: '8 วัน', machine: '01-55TS', truckPL: '—', truckSV: '—', reply: '', flag: 'urgent', ...BK_EXTRA_DEFAULTS, contactName: 'คุณธนกร', contactPhone: '086-555-7788', quotationNo: 'QT690118', salesperson: 'ธนา วงศ์ใหญ่' },
  { id: 4, book: 'PPD690231', createDate: '19/06/2026', docStatus: 'plAssigned', docStatusText: 'รอ PL Mgr. ยืนยันเบอร์รถ', stateCode: 'PL_ASSIGN_VEHICLE', purpose: 'จองเพื่อสอบถามข้อมูล', customer: 'บริษัท ฤทธา จำกัด', jobType: 'ยกโครงสร้าง / ส่วน', site: 'CTHH Central', startDate: '17/04/2026', endDate: '16/07/2026', duration: '3 เดือน', machine: '03-25RC', truckPL: '10/27', truckSV: '—', reply: '', flag: 'warn', ...BK_EXTRA_DEFAULTS, replyPL: 'เครื่องจักรและอปต. พร้อม', quotationNo: 'QT690120', contactName: 'คุณอนุชา', contactPhone: '092-333-1122', plSupplyDate: '15/04/2026', remarkPL: 'จัดหารถได้ตามกำหนด', salesperson: 'ธนา วงศ์ใหญ่' },
  { id: 5, book: 'PPD690230', createDate: '19/06/2026', docStatus: 'plMgrApproved', docStatusText: 'รอ SV ยืนยันเบอร์รถ', stateCode: 'PL_MGR_APPROVAL', purpose: 'จองเพื่อสอบถามข้อมูล', customer: 'บริษัท ฤทธา จำกัด', jobType: 'ยกโครงสร้าง', site: 'RNS1 ต.นาจอมเทียน', startDate: '08/04/2026', endDate: '07/06/2026', duration: '2 เดือน', machine: '03-25RC', truckPL: '160/2', truckSV: '—', reply: '', flag: 'warn', ...BK_EXTRA_DEFAULTS, replyPL: 'เครื่องจักรและอปต. พร้อม', quotationNo: 'QT690121', contactName: 'คุณอนุชา', contactPhone: '092-333-1122', plSupplyDate: '05/04/2026', remarkPL: 'พร้อมจัดส่ง', salesperson: 'ธนา วงศ์ใหญ่' },
  { id: 6, book: 'PPD690228', createDate: '12/06/2026', docStatus: 'svConfirmed', docStatusText: 'รอ SV Mgr. ยืนยันเบอร์รถ', stateCode: 'SV_CONFIRM_VEHICLE', purpose: 'จองเพื่อยืนยันงาน', customer: 'บริษัท ซิโน-ไทย เอ็นจีเนียริ่ง จำกัด', jobType: 'ยกแผ่นพื้น', site: 'ไซต์ก่อสร้าง ปทุมธานี', startDate: '01/06/2026', endDate: '30/06/2026', duration: '1 เดือน', machine: '04-50CC', truckPL: '155/1', truckSV: '155/1', reply: 'ready', flag: '', ...BK_EXTRA_DEFAULTS, replyPL: 'เครื่องจักรและอปต. พร้อม', quotationNo: 'QT690124', contactName: 'คุณมานพ', contactPhone: '084-777-9900', deliveryNo: 'DO690061', plSupplyDate: '28/05/2026', replySV: 'ยืนยันเบอร์รถตามที่ PL ระบุ', svReadyDate: '30/05/2026', salesperson: 'อชิรญา เจนชล' },
  { id: 7, book: 'PPD690222', createDate: '05/06/2026', docStatus: 'svMgrApproved', docStatusText: 'รอผจก. ฝ่ายอนุมัติการจอง', stateCode: 'SV_MGR_APPROVAL', purpose: 'จองเพื่อยืนยันงาน', customer: 'บริษัท อิตัลไทย จำกัด', jobType: 'งานยกเครื่องจักร', site: 'นิคมอมตะซิตี้', startDate: '20/05/2026', endDate: '20/08/2026', duration: '3 เดือน', machine: '01-55TS', truckPL: '210/3', truckSV: '215/1', reply: 'ready', flag: '', ...BK_EXTRA_DEFAULTS, replyPL: 'เครื่องจักรและอปต. พร้อม', quotationNo: 'QT690126', contactName: 'คุณเกรียงไกร', contactPhone: '081-909-1234', deliveryNo: 'DO690055', plSupplyDate: '18/05/2026', replySV: 'ระบุเบอร์รถใหม่แทนที่ PL ระบุ', svReadyDate: '19/05/2026', svNewTruckReason: 'รถเบอร์เดิมติดงานต่อเนื่อง จึงเปลี่ยนเป็น 215/1', salesperson: 'กมล ศรีสุข' },
  { id: 8, book: 'PPD690215', createDate: '21/05/2026', docStatus: 'approved', docStatusText: 'ผจก.ฝ่ายอนุมัติการจองแล้ว', stateCode: 'FINAL_MGR_APPROVAL', purpose: 'จองเพื่อยืนยันงาน', customer: 'ธนาคารไทยพาณิชย์ จำกัด (มหาชน)', jobType: 'งานยกทั่วไป', site: 'สำนักงานใหญ่', startDate: '13/05/2026', endDate: '12/10/2026', duration: '5 เดือน', machine: '01-25TS', truckPL: '10/28', truckSV: '10/28', reply: 'ready', flag: '', ...BK_EXTRA_DEFAULTS, replyPL: 'เครื่องจักรและอปต. พร้อม', quotationNo: 'QT690108', contactName: 'คุณธนกร', contactPhone: '086-555-7788', deliveryNo: 'DO690048', plSupplyDate: '10/05/2026', replySV: 'ยืนยันเบอร์รถตามที่ PL ระบุ', svReadyDate: '11/05/2026', salesperson: 'อชิรญา เจนชล' },
  { id: 9, book: 'PPD690210', createDate: '15/05/2026', docStatus: 'rejected', docStatusText: 'ผจก.ฝ่ายไม่อนุมัติการจอง', stateCode: 'REJECTED', purpose: 'จองเพื่อสอบถามข้อมูล', customer: 'หจก. รุ่งเรืองวัสดุ', jobType: 'ยกโครงหลังคา', site: 'อ.บางพลี จ.สมุทรปราการ', startDate: '10/05/2026', endDate: '17/05/2026', duration: '8 วัน', machine: '02-160TB', truckPL: '—', truckSV: '—', reply: '', flag: 'urgent', ...BK_EXTRA_DEFAULTS, contactName: 'คุณสุชาติ', contactPhone: '087-222-4455', remarkReject: 'ลูกค้าติดวงเงินเครดิต ยังไม่เคลียร์ยอดค้าง', salesperson: 'ปรีชา ทองมาก' },
  { id: 10, book: 'PPD690205', createDate: '08/05/2026', docStatus: 'cancelled', docStatusText: 'ยกเลิกใบจองสินค้า', stateCode: 'CANCEL', purpose: 'จองเพื่อสอบถามข้อมูล', customer: 'บริษัท พฤกษา เรียลเอสเตท จำกัด (มหาชน)', jobType: 'งานยกทั่วไป', site: 'โครงการบ้านจัดสรร', startDate: '05/05/2026', endDate: '12/05/2026', duration: '8 วัน', machine: '07-20EX', truckPL: '—', truckSV: '—', reply: '', flag: '', ...BK_EXTRA_DEFAULTS, contactName: 'คุณพิมพ์', contactPhone: '083-666-7788', remarkCancel: 'ลูกค้าเลื่อนโครงการออกไปไม่มีกำหนด', salesperson: 'ปรีชา ทองมาก' },
];
