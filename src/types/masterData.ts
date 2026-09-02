// โครงสร้างข้อมูล Master Data (GET /api/v1/MasterData/*) — ใช้เติมตัวเลือกในฟอร์มเพิ่มแผนขาย

// /MasterData/departments — แผนก (ใช้เลือกแผนกปลายทางของใบแจ้งเรื่อง)
export interface DepartmentApi {
  departid: string;
  departmentShort: string;
  departmentName: string;
}

// /MasterData/salesmen — พนักงานขาย
export interface SalesmanApi {
  code: string;
  nameShort: string;
  fullNameTH: string;
  username: string;
}

// /MasterData/contact-channels — แผนขายมาจากที่ไหน
export interface ContactChannelApi {
  contactChannelID: number;
  contactChannelCode: string;
  contactChannelNameTH: string;
  contactChannelNameEN: string;
  description: string;
}

// /MasterData/lead-sources — แหล่งที่มาของข้อมูล
export interface LeadSourceApi {
  leadSourceID: number;
  leadSourceCode: string;
  leadSourceNameTH: string;
  leadSourceNameEN: string;
  description: string;
}

// /MasterData/customers — ลูกค้า
export interface CustomerApi {
  customerID: string;
  customerName: string;
  customerNamealias: string;
  customerGroup: string;
  customerType: string;
}

// /MasterData/provinces — จังหวัด
export interface ProvinceApi {
  nameTH: string;
  nameEN: string;
}

// /MasterData/machine-types — ประเภทเครื่องจักร
export interface MachineTypeApi {
  machineTypeId: string;
}

// /MasterData/machine-models?machineTypeId= — รุ่นของประเภทเครื่องจักรที่เลือก
export interface MachineModelApi {
  machineTypeID: string;
  machineModel1: string;
}

// /MasterData/plan-status — สถานะการขาย
export interface PlanStatusApi {
  name: string;
  no: number;
}

// ══════════════════════════════════════════════════════════════════════════
// Master Data สำหรับฟอร์มใบจองสินค้า (Booking) — GET /api/v1/MasterData/*
// ชื่อฟิลด์คงตาม response ของ backend ทุกตัว (case-sensitive) ห้ามเปลี่ยน
// (ดู API_NAMING.md) — สังเกตชื่อที่ไม่สม่ำเสมอ เช่น machineConditionTH/EN (ไม่มี
// "Name"), jobGroupDetailINameTH (มี "I"), carAssignments_PLID (มี underscore)
// ══════════════════════════════════════════════════════════════════════════

// ฟิลด์ตรวจสอบ (audit) ที่ master data ใหม่ทุกชุดมีเหมือนกัน
export interface MasterAuditFields {
  description: string | null;
  isDeleted: boolean;
  createdByUserID: number;
  creationDT: string;
  lastUpdateByUserID: number | null;
  lastUpdateDT: string | null;
}

// /MasterData/purposes — วัตถุประสงค์การจอง
export interface PurposeApi extends MasterAuditFields {
  purposeID: number;
  purposeCode: string;
  purposeNameTH: string;
  purposeNameEN: string;
  inputTypeID: number;
}

// /MasterData/plan-types — ประเภทแผน
export interface PlanTypeApi extends MasterAuditFields {
  planTypeID: number;
  planTypeCode: string;
  planTypeNameTH: string;
  planTypeNameEN: string;
  inputTypeID: number;
}

// /MasterData/job-characters — ลักษณะงาน
export interface JobCharacterApi extends MasterAuditFields {
  jobCharacterID: number;
  jobCharacterCode: string;
  jobCharacterNameTH: string;
  jobCharacterNameEN: string;
  inputTypeID: number;
  seq: number;
}

// /MasterData/job-groups — กลุ่มงาน
export interface JobGroupApi extends MasterAuditFields {
  jobGroupID: number;
  jobGroupCode: string;
  jobGroupNameTH: string;
  jobGroupNameEN: string;
  inputTypeID: number;
  seq: number;
}

// /MasterData/job-group-details — ประเภทงาน (รายการย่อยของกลุ่มงาน jobGroupID)
export interface JobGroupDetailApi extends MasterAuditFields {
  jobGroupDetailID: number;
  jobGroupID: number;
  jobGroupDetailICode: string;
  jobGroupDetailINameTH: string;
  jobGroupDetailINameEN: string;
  inputTypeID: number;
  seq: number;
}

// /MasterData/present-works — ต้องการนำเสนองาน
export interface PresentWorkApi extends MasterAuditFields {
  presentWorkID: number;
  presentWorkCode: string;
  presentWorkNameTH: string;
  presentWorkNameEN: string;
  inputTypeID: number;
}

// /MasterData/operator-service-types — เงื่อนไขการใช้งาน อปต. (ไม่มี inputTypeID)
export interface OperatorServiceTypeApi extends MasterAuditFields {
  operatorServiceTypeID: number;
  operatorServiceTypeCode: string;
  operatorServiceTypeNameTH: string;
  operatorServiceTypeNameEN: string;
}

// /MasterData/fuel-conditions — เงื่อนไขการใช้น้ำมัน
export interface FuelConditionApi extends MasterAuditFields {
  fuelConditionID: number;
  fuelConditionCode: string;
  fuelConditionNameTH: string;
  fuelConditionNameEN: string;
  inputTypeID: number;
}

// /MasterData/survey-work-sites — การสำรวจหน้างาน
export interface SurveyWorkSiteApi extends MasterAuditFields {
  surveyWorkSiteID: number;
  surveyWorkSiteCode: string;
  surveyWorkSiteNameTH: string;
  surveyWorkSiteNameEN: string;
  inputTypeID: number;
}

// /MasterData/survey-work-site-details — รายการย่อยของการสำรวจหน้างาน (surveyWorkSiteID)
export interface SurveyWorkSiteDetailApi extends MasterAuditFields {
  surveyWorkSiteDetailID: number;
  surveyWorkSiteID: number;
  surveyWorkSiteDetailCode: string;
  surveyWorkSiteDetailNameTH: string;
  surveyWorkSiteDetailNameEN: string;
  inputTypeID: number;
}

// /MasterData/machine-conditions — สถานะเครื่องจักร (ชื่อฟิลด์ไม่มี "Name")
export interface MachineConditionApi extends MasterAuditFields {
  machineConditionID: number;
  machineConditionCode: string;
  machineConditionTH: string;
  machineConditionEN: string;
  inputTypeID: number;
}

// /MasterData/driver-conditions — สถานะคนขับ / อปต.
export interface DriverConditionApi extends MasterAuditFields {
  driverConditionID: number;
  driverConditionCode: string;
  driverConditionNameTH: string;
  driverConditionNameEN: string;
  inputTypeID: number;
  seq: number;
}

// /MasterData/document-bookings — เอกสารประกอบการจอง
export interface DocumentBookingApi extends MasterAuditFields {
  documentBookingID: number;
  documentBookingCode: string;
  documentBookingNameTH: string;
  documentBookingNameEN: string;
  inputTypeID: number;
}

// /MasterData/technician-conditions — เงื่อนไขเกี่ยวกับช่าง
export interface TechnicianConditionApi extends MasterAuditFields {
  technicianConditionID: number;
  technicianConditionCode: string;
  technicianConditionNameTH: string;
  technicianConditionNameEN: string;
  inputTypeID: number;
  seq: number;
}

// /MasterData/credit-types — ประเภทเครดิต / วงเงิน
export interface CreditTypeApi extends MasterAuditFields {
  creditTypeID: number;
  creditTypeCode: string;
  creditTypeNameTH: string;
  creditTypeNameEN: string;
  inputTypeID: number;
}

// /MasterData/car-assignments-pl — สถานะการมอบหมายเบอร์รถ (ฝ่าย PL)
export interface CarAssignmentsPLApi extends MasterAuditFields {
  carAssignments_PLID: number;
  carAssignments_PLCode: string;
  carAssignments_PLNameTH: string;
  carAssignments_PLNameEN: string;
  inputTypeID: number;
  seq: number;
}

// /MasterData/car-verifications-sv — สถานะการยืนยันเบอร์รถ (ฝ่าย SV)
export interface CarVerificationsSVApi extends MasterAuditFields {
  carVerifications_SVID: number;
  carVerifications_SVCode: string;
  carVerifications_SVNameTH: string;
  carVerifications_SVNameEN: string;
  inputTypeID: number;
}

// ── /MasterData/it — ตัวเลือกของใบแจ้งเรื่อง IT (ก้อนเดียว 4 ชุด) ──
// ⚠️ ค่าที่ส่งกลับไปกับ action คือ "ชื่อ" (name) ไม่ใช่ id — resolution ที่ API
// คืนมา (repairStatus / solution / hw / hwDetail) เป็นข้อความล้วน จึงต้องส่งข้อความ
// ให้ตรงกัน ไม่งั้นหน้ารายละเอียดจะโชว์เลข id แทนชื่อ
export interface MasterOptionApi {
  id: number;
  name: string;
}

export type ItOptionApi = MasterOptionApi;

// สาเหตุรอง — ผูกกับสาเหตุหลักผ่าน mainCauseId (ใช้กรองตอนเลือกสาเหตุหลัก)
export interface ItSubCauseApi extends ItOptionApi {
  mainCauseId: number;
  mainCause: string;
}

export interface ItMasterDataApi {
  solutions: ItOptionApi[];
  repairStatuses: ItOptionApi[];
  mainCauses: ItOptionApi[];
  subCauses: ItSubCauseApi[];
}

// ── /MasterData/pl — ตัวเลือกของใบแจ้งเรื่อง PL ────────────────
// types (ประเภทผู้แจ้ง) · requestTypes (เรื่องที่แจ้ง) · units (หน่วยของรายการที่ขอ)
// ⚠️ เหมือน IT: ค่าที่ส่งขึ้น API เป็น "ชื่อ" ไม่ใช่ id (ดู PlRequestPayload.type/requestType)
// sites = รหัสไซต์ที่เปิดใช้ (ตอนนี้มีตัวเดียว "BC" และหน้าเว็บไม่ได้ส่ง site ขึ้นไป
// — ปล่อยให้ backend ใช้ค่า default จาก token)
export interface PlMasterDataApi {
  sites: string[];
  types: MasterOptionApi[];
  requestTypes: MasterOptionApi[];
  units: MasterOptionApi[];
}

// ── /MasterData/cr — ตัวเลือกของใบแจ้งเรื่อง CR (ประสานงานฝ่ายขาย) ──
// ⚠️ id ของ requestTypes / requestSubTypes "ซ้ำข้ามส่วนงาน" (HV id 1 กับ FL id 1
//    คนละรายการ) → ตัวระบุตัวตนคือ section + id เสมอ ห้ามใช้ id ตัวเดียวหาแถว
export interface CrSectionApi {
  code: string; // 'HV' (รถใหญ่) / 'FL' (รถยก) — คีย์ที่ requestTypes.section อ้างถึง
  name: string;
}

export interface CrRequestTypeApi {
  id: number;
  name: string;
  section: string;
  tableId: string; // ตารางปลายทางฝั่ง backend (หน้าเว็บไม่ได้ใช้)
}

export interface CrRequestSubTypeApi {
  id: number;
  name: string;
  section: string;
  requestTypeId: number; // อ้างถึง requestTypes.id "ภายในส่วนงานเดียวกัน"
  requestType: string;
}

export interface CrMasterDataApi {
  sections: CrSectionApi[];
  requestTypes: CrRequestTypeApi[];
  requestSubTypes: CrRequestSubTypeApi[];
}

// ── /MasterData/{ga|im|af|sv|sqa} — ตัวเลือกของใบแจ้งเรื่องรายแผนก ──
// สัญญาเดียวใช้ได้ทุกแผนกในกลุ่มนี้ (คนละ endpoint คนละรายการ) — แผนกไหน
// ไม่มีชุดไหนก็ไม่ต้องส่ง field นั้นมา ฟอร์มจะไม่แสดงตัวเลือกของชั้นนั้นเอง
// ดู MdApi/API_SPEC_DEPT_MASTER.md สำหรับรูปแบบที่ฝั่งเว็บรออยู่
export interface MasterSectionApi {
  code: string; // 'HV' (รถใหญ่) / 'FL' (รถยก) — คีย์ที่รายการชั้นล่างอ้างถึง
  name: string;
}

// ตัวเลือกของแผนก — ผูกกับชั้นบนได้ 2 ทาง (ไม่ผูก = ไม่ต้องส่ง field นั้น)
// section  = ตัวเลือกนี้ใช้ได้เฉพาะส่วนงานนั้น (เหมือน CR)
// typeId   = ตัวเลือกนี้อยู่ใต้ "ประเภท" ตัวไหน (ใช้กับ requestSubTypes ของ SQA)
export interface DeptMasterOptionApi extends MasterOptionApi {
  section?: string;
  typeId?: number;
}

// ใบประเมินราคาที่อ้างถึงได้ในใบแจ้งเรื่อง PS — เลือกเลขที่ใบแล้วหน้าเว็บ
// เอาข้อมูลทั้งใบมาเติมช่องอ่านอย่างเดียวให้ครบชุด (ผู้ใช้ไม่ต้องพิมพ์ซ้ำ)
// ทุก field นอกจาก docNo เป็นข้อความพร้อมแสดง (backend จัดรูปแบบวันที่มาให้ได้เลย)
export interface PsEstimateApi {
  docNo: string; // เลขที่ใบประเมินราคา (คีย์ที่ฟอร์มเก็บ)
  docDate?: string; // วันที่
  machineType?: string; // ประเภทเครื่องจักร
  engineModel?: string; // รุ่นเครื่องยนต์
  serialNo?: string; // ทะเบียน S/N
  machineNo?: string; // หมายเลขเครื่องจักร
  machineModel?: string; // รุ่นเครื่องจักร
  system?: string; // ระบบ
  symptom?: string; // รายละเอียดอาการ
  remark?: string; // รายละเอียดเพิ่มเติม
}

export interface DeptMasterDataApi {
  sections?: MasterSectionApi[]; // ส่วนงาน (SV / SQA)
  types?: DeptMasterOptionApi[]; // ประเภท (GA/IM) · ประเภทเรื่องที่แจ้ง (SQA)
  requestTypes?: DeptMasterOptionApi[]; // เรื่องที่แจ้ง (GA/IM/AF/SV)
  requestSubTypes?: DeptMasterOptionApi[]; // รายละเอียดที่แจ้ง (SQA) — ผูกกับ types ผ่าน typeId
  units?: MasterOptionApi[]; // หน่วยของ "รายการที่ขอ"
  estimates?: PsEstimateApi[]; // ใบประเมินราคา (PS)
}
