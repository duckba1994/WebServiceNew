// ══════════════════════════════════════════════════════════════════════════
// Central layer ของ Master Data ใบจองสินค้า — แปลง master data (จาก API) เป็น
// โครงตัวเลือก/ตาราง ที่ "ใช้ร่วมกันทั้งหน้าสร้างใบจอง และเอกสารพิมพ์ (รายงาน)"
//
// * แต่ละ selector มี STATIC FALLBACK = ค่าจริงบนฟอร์มกระดาษ (P)FM-BC/SL-001/12
//   เพราะ master API ปัจจุบันยังส่งข้อมูลตัวอย่าง (placeholder) — ถ้า wire ตรง ๆ
//   รายงานจะกลายเป็นข้อมูลตัวอย่างแทน label จริง จึงใช้ fallback จนกว่า backend
//   จะเติมค่าจริง แล้วระบบจะสลับไปใช้ master data อัตโนมัติ (list ไม่ว่าง = ใช้ master)
// * เรียงตาม seq เมื่อ master มีฟิลด์นั้น ; ตัดรายการ isDeleted ออก
// ══════════════════════════════════════════════════════════════════════════
import {
  PurposeApi,
  PlanTypeApi,
  JobCharacterApi,
  JobGroupApi,
  JobGroupDetailApi,
  PresentWorkApi,
  OperatorServiceTypeApi,
  FuelConditionApi,
  SurveyWorkSiteApi,
  SurveyWorkSiteDetailApi,
  MachineConditionApi,
  DriverConditionApi,
  DocumentBookingApi,
  TechnicianConditionApi,
  CreditTypeApi,
  CarAssignmentsPLApi,
  CarVerificationsSVApi,
} from '../types/masterData';

// ── รูปแบบข้อมูลดิบทั้งชุด (เก็บใน useBookingMasterData) ──
export interface BookingMaster {
  purposes: PurposeApi[];
  planTypes: PlanTypeApi[];
  jobCharacters: JobCharacterApi[];
  jobGroups: JobGroupApi[];
  jobGroupDetails: JobGroupDetailApi[];
  presentWorks: PresentWorkApi[];
  operatorServiceTypes: OperatorServiceTypeApi[];
  fuelConditions: FuelConditionApi[];
  surveyWorkSites: SurveyWorkSiteApi[];
  surveyWorkSiteDetails: SurveyWorkSiteDetailApi[];
  machineConditions: MachineConditionApi[];
  driverConditions: DriverConditionApi[];
  documentBookings: DocumentBookingApi[];
  technicianConditions: TechnicianConditionApi[];
  creditTypes: CreditTypeApi[];
  carAssignmentsPL: CarAssignmentsPLApi[];
  carVerificationsSV: CarVerificationsSVApi[];
}

export const EMPTY_BOOKING_MASTER: BookingMaster = {
  purposes: [],
  planTypes: [],
  jobCharacters: [],
  jobGroups: [],
  jobGroupDetails: [],
  presentWorks: [],
  operatorServiceTypes: [],
  fuelConditions: [],
  surveyWorkSites: [],
  surveyWorkSiteDetails: [],
  machineConditions: [],
  driverConditions: [],
  documentBookings: [],
  technicianConditions: [],
  creditTypes: [],
  carAssignmentsPL: [],
  carVerificationsSV: [],
};

// ── ตัวเลือกมาตรฐาน 1 รายการ (id ใช้อ้างอิงตอน lookup/บันทึกในอนาคต) ──
export interface Opt {
  id: number;
  name: string;
  // ประเภทการกรอกเพิ่มของตัวเลือกนี้ (1 = ต้องมีช่องกรอกข้อความ "ระบุ")
  inputTypeID?: number;
  // คำอธิบายเพิ่มเติมของตัวเลือก (แสดงต่อท้าย label)
  description?: string | null;
}

// สร้างรายการ Opt: ตัด isDeleted, เรียงตาม seq (ถ้ามี), map เป็น id+name (+inputTypeID/description)
function toOpts<T extends { isDeleted: boolean; description: string | null; inputTypeID?: number }>(
  list: T[],
  id: (x: T) => number,
  name: (x: T) => string,
  seq?: (x: T) => number
): Opt[] {
  const arr = list.filter((x) => !x.isDeleted);
  if (seq) arr.sort((a, b) => seq(a) - seq(b));
  return arr.map((x) => ({
    id: id(x),
    name: name(x),
    inputTypeID: x.inputTypeID,
    description: x.description,
  }));
}

// แปลงลิสต์ label แบบ static → Opt[] (id ลบ เพื่อไม่ชนกับ id จริงจาก DB)
const fallback = (labels: string[]): Opt[] => labels.map((name, i) => ({ id: -(i + 1), name }));

// ตัวเลือกนี้ต้องมีช่องกรอกข้อความเพิ่มหรือไม่ (inputTypeID = 1 → มีช่อง "ระบุ")
export const hasTextInput = (o: Opt): boolean => o.inputTypeID === 1;

// ลักษณะงาน "อื่นๆ" (JobCharacterID = 7) — ผู้ใช้กรอกข้อความยาว จึงให้กินพื้นที่ 2 คอลัมน์
// เช็คชื่อด้วย เพื่อให้ fallback (ที่ id เป็นค่าลบ) ทำงานเหมือนกัน
export const OTHER_JOB_CHARACTER_ID = 7;
export const isOtherJobChar = (o: Opt): boolean =>
  o.id === OTHER_JOB_CHARACTER_ID || isOtherLabel(o);

// ตัวเลือก "อื่นๆ" ตรวจจากชื่อเท่านั้น — ใช้กับ job-group-details ที่ id เป็นคนละชุดกัน
export const isOtherLabel = (o: Opt): boolean => o.name.startsWith('อื่นๆ');

// ── ค่า fallback (ตรงตามฟอร์มกระดาษจริง) ────────────────────
export const FALLBACK = {
  purposes: [
    'จองเพื่อสอบถามเครื่องจักร',
    'จองเพื่อทดแทนรถเสีย',
    'จองเพื่อทดแทนรถเกรด อบ.',
    'จองเพื่อนำรถออกไปซ่อมภายนอก',
    'จองเพื่อ Support งานภายใน',
    'จองเพื่อสลับรถใหม่ตรงกับ Order',
  ],
  jobCharacters: [
    'งานยกทั่วไป',
    'งาน Safety',
    'งานต่อจิ๊บ / บูม',
    'ทำงานบนที่สูง',
    'งานรวมกระเช้าปลายบูม',
    'งานยกคู่ (ต้องมีผู้ควบคุม 1 คน , ผู้ให้สัญญาณ 1 คน)',
    'เพื่อ Support งานภายใน',
    'อื่นๆ (ระบุ)',
  ],
  presentWorks: ['งานเดือน', 'งานวัน', 'งานเหมาเที่ยว', 'งานเหมาชิ้น'],
  operatorServiceTypes: ['รวม อปต.', 'ไม่รวม อปต. / ใช้ อปต. หน่วยงาน'],
  fuelConditions: ['รวมน้ำมันเชื้อเพลิง', 'ไม่รวมน้ำมันเชื้อเพลิง', 'เติมน้ำมันเต็มถัง'],
  surveyWorkSites: [
    'ต้องสำรวจหน้างาน',
    'ยังไม่ได้ดูหน้างาน มีแผนจะไปดูวันที่',
    'ไม่ต้องสำรวจหน้างาน (ฝ่ายขายสำรวจหน้างานแล้ว)',
    'ไม่ต้องสำรวจหน้างาน (เฉพาะจองเพื่อทดแทนรถเสีย,ทดแทนรถเกรด อบ.,เพื่อนำรถออกไปซ่อมภายนอก,เพื่อ Support งานภายใน,เพื่อสลับรถใหม่ตรงกับ Order)',
  ],
  documentBookings: [
    'ส่ง อปต. อบรมวันที่',
    'ต้องตรวจสุขภาพ 5โรคร้าย + สารเสพติด',
    'ต้องตรวจสุขภาพทั่วไป + สารเสพติด',
    'รพ. รัฐบาล',
    'คลีนิก / รพ. เอกชน',
    'มาตรฐานการแต่งกายอปต.',
    'มาตรฐานเอกสารอปต.',
    'วันที่ต้องการเอกสาร ระบุ',
    'ส่งเอกสาร Email',
    'อื่นๆ',
  ],
  technicianConditions: [
    'ส่งช่างอบรมวันที่',
    'ต้องตรวจสุขภาพ 5 โรคร้าย + สารเสพติด',
    'ต้องตรวจสุขภาพทั่วไป + สารเสพติด',
    'รพ. รัฐบาล',
    'คลีนิก / รพ. เอกชน',
    'แจ้งช่างประกอบบูม / ต่อรับ วันที่',
    'มาตรฐานการแต่งกายช่าง.',
    'มาตรฐานเอกสารช่าง.',
    'วันที่ต้องการเอกสาร ระบุ',
    'ส่งเอกสาร Email',
    'อื่นๆ',
  ],
  creditTypes: ['ไม่ตัดวงเงิน', 'ตัดวงเงิน', 'กรณีตัดวงเงิน อ้างอิงใบขออนุมัติวงเงิน'],
  // สถานะฝ่าย PL (ส่วนที่ 2) — 7 ตัวเลือก
  carAssignmentsPL: [
    'เครื่องจักรและอปต. พร้อม',
    'เครื่องจักรพร้อมแต่ อปต. ไม่พร้อม สามารถจัดหาได้ภายในวันที่',
    'เครื่องจักรพร้อมแต่ อปต. ไม่พร้อม ไม่สามารถยืนยันวันจัดหาได้',
    'เครื่องจักรไม่พร้อม แต่อปต. พร้อม (ตอบในส่วนที่ 3 SV ยืนยันข้อมูลเบอร์รถ)',
    'เครื่องจักรและ อปต. ไม่พร้อม',
    'ไม่มีเครื่องจักรที่ตรงตามที่ต้องการ แต่สามารถจัดหาเครื่องจักรทดแทนได้',
    'ไม่มีเครื่องจักรเลย(เครื่องจักรออกงานหมดและไม่มีค้างในแผนซ่อม)',
  ],
  // สถานะฝ่าย SV (ส่วนที่ 3)
  carVerificationsSV: [
    'ยืนยันข้อมูลเบอร์รถ ตามที่ PL ระบุและสามารถผลิตได้ตามวันที่ต้องการ',
    'ยืนยันข้อมูลเบอร์รถ ตามที่ PL ระบุแต่ไม่สามารถผลิตได้ตามวันที่ต้องการ',
    'ไม่ยืนยันข้อมูลเบอร์รถตามที่ PL ระบุ',
    'ไม่มีเครื่องจักรเลย (เครื่องจักรออกงานหมดและไม่มีค้างในแผนซ่อม)',
  ],
};

// ── ตาราง matrix ประเภทงาน (ส่วนที่ 4) — กลุ่มงาน × ประเภทงาน ──
export interface MatrixGroup {
  id: number;
  label: string;
  cells: Opt[];
}

const FALLBACK_MATRIX: MatrixGroup[] = [
  { label: 'กลุ่มโครงสร้างพื้นฐาน :', cells: ['ทางหลวง', 'ทางด่วน / ยกระดับ', 'รถไฟฟ้า', 'รถไฟรางคู่', 'สะพาน', 'สะพานลอยหรือ U-Turn', 'งานยก/ล้ม ถังไซโล', 'อื่นๆ'] },
  { label: 'กลุ่มที่พักอาศัย :', cells: ['บ้านเดี่ยว', 'ยกประกอบแผ่นพรีคาสท์', 'ดึงแบบ', 'ยกแบบชาแนล', 'ยกผลิตภัณฑ์คอนกรีต', 'งานเสาเข็ม', 'ทาวน์เฮ้าส์', 'คอนโดมิเนียม (ฐานราก)'] },
  { label: 'กลุ่มก่อสร้างอาคาร :', cells: ['โรงแรม', 'ห้างสรรพสินค้า', 'อาคารพาณิชย์', 'ฐานรากก่อสร้าง', 'ยกป้าย', 'โรงงาน', 'อื่นๆ'] },
  { label: 'กลุ่มโรงงานอุตสาหกรรม :', cells: ['ติดตั้งเครื่องจักร', 'ติดตั้งงานระบบ', 'รื้อถอนงานระบบ', 'หม้อแปลง', 'งานประกอบโครงสร้าง', 'อื่นๆ'] },
  { label: 'กลุ่มงานเขื่อน/อุโมงค์ระบายน้ำ :', cells: ['ติดตั้งเครื่องจักร', 'งานขุดดิน', 'งานวางท่อ', 'ติดตั้งผนังอุโมงค์', 'งานขุดปรับหน้าดิน', 'อื่นๆ'] },
  { label: 'กลุ่มพลังงาน/ท่อก๊าซ (งาน Safety) :', cells: ['โรงไฟฟ้า', 'โรงกลั่นน้ำมัน', 'โรงปูน', 'โรงหล่อ', 'ติดตั้งท่อก๊าซ', 'งานกังหันลม', 'อื่นๆ'] },
].map((g, gi) => ({ id: -(gi + 1), label: g.label, cells: fallback(g.cells) }));

// ── selectors: master ว่าง → fallback, ไม่ว่าง → master (เรียงตาม seq) ──
export const purposeOpts = (m: BookingMaster): Opt[] =>
  m.purposes.length ? toOpts(m.purposes, (x) => x.purposeID, (x) => x.purposeNameTH) : fallback(FALLBACK.purposes);

// ประเภทแผน — ไม่มี label บนฟอร์มกระดาษเดิม จึง fallback เป็น [] (แสดงเมื่อ API มีข้อมูล)
export const planTypeOpts = (m: BookingMaster): Opt[] =>
  m.planTypes.length ? toOpts(m.planTypes, (x) => x.planTypeID, (x) => x.planTypeNameTH) : [];

export const jobCharacterOpts = (m: BookingMaster): Opt[] =>
  m.jobCharacters.length
    ? toOpts(m.jobCharacters, (x) => x.jobCharacterID, (x) => x.jobCharacterNameTH, (x) => x.seq)
    : fallback(FALLBACK.jobCharacters);

export const presentWorkOpts = (m: BookingMaster): Opt[] =>
  m.presentWorks.length
    ? toOpts(m.presentWorks, (x) => x.presentWorkID, (x) => x.presentWorkNameTH)
    : fallback(FALLBACK.presentWorks);

export const operatorServiceOpts = (m: BookingMaster): Opt[] =>
  m.operatorServiceTypes.length
    ? toOpts(m.operatorServiceTypes, (x) => x.operatorServiceTypeID, (x) => x.operatorServiceTypeNameTH)
    : fallback(FALLBACK.operatorServiceTypes);

export const fuelConditionOpts = (m: BookingMaster): Opt[] =>
  m.fuelConditions.length
    ? toOpts(m.fuelConditions, (x) => x.fuelConditionID, (x) => x.fuelConditionNameTH)
    : fallback(FALLBACK.fuelConditions);

export const surveyWorkSiteOpts = (m: BookingMaster): Opt[] =>
  m.surveyWorkSites.length
    ? toOpts(m.surveyWorkSites, (x) => x.surveyWorkSiteID, (x) => x.surveyWorkSiteNameTH)
    : fallback(FALLBACK.surveyWorkSites);

export const documentBookingOpts = (m: BookingMaster): Opt[] =>
  m.documentBookings.length
    ? toOpts(m.documentBookings, (x) => x.documentBookingID, (x) => x.documentBookingNameTH)
    : fallback(FALLBACK.documentBookings);

export const technicianConditionOpts = (m: BookingMaster): Opt[] =>
  m.technicianConditions.length
    ? toOpts(m.technicianConditions, (x) => x.technicianConditionID, (x) => x.technicianConditionNameTH, (x) => x.seq)
    : fallback(FALLBACK.technicianConditions);

export const creditTypeOpts = (m: BookingMaster): Opt[] =>
  m.creditTypes.length ? toOpts(m.creditTypes, (x) => x.creditTypeID, (x) => x.creditTypeNameTH) : fallback(FALLBACK.creditTypes);

export const carAssignmentsPLOpts = (m: BookingMaster): Opt[] =>
  m.carAssignmentsPL.length
    ? toOpts(m.carAssignmentsPL, (x) => x.carAssignments_PLID, (x) => x.carAssignments_PLNameTH, (x) => x.seq)
    : fallback(FALLBACK.carAssignmentsPL);

export const carVerificationsSVOpts = (m: BookingMaster): Opt[] =>
  m.carVerificationsSV.length
    ? toOpts(m.carVerificationsSV, (x) => x.carVerifications_SVID, (x) => x.carVerifications_SVNameTH)
    : fallback(FALLBACK.carVerificationsSV);

// matrix: กลุ่มงาน (row เรียงตาม seq) + ประเภทงานของกลุ่มนั้น (cell เรียงตาม seq)
export const jobMatrix = (m: BookingMaster): MatrixGroup[] => {
  if (!m.jobGroups.length) return FALLBACK_MATRIX;
  const groups = m.jobGroups.filter((g) => !g.isDeleted).sort((a, b) => a.seq - b.seq);
  return groups.map((g) => ({
    id: g.jobGroupID,
    label: g.jobGroupNameTH,
    cells: toOpts(
      m.jobGroupDetails.filter((d) => d.jobGroupID === g.jobGroupID),
      (x) => x.jobGroupDetailID,
      (x) => x.jobGroupDetailINameTH,
      (x) => x.seq
    ),
  }));
};
