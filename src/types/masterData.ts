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
