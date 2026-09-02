import { apiGet } from './client';
import {
  DepartmentApi,
  SalesmanApi,
  ContactChannelApi,
  LeadSourceApi,
  CustomerApi,
  ProvinceApi,
  MachineTypeApi,
  MachineModelApi,
  PlanStatusApi,
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
  ItMasterDataApi,
  PlMasterDataApi,
  CrMasterDataApi,
  DeptMasterDataApi,
} from '../types/masterData';

// ── แผนก — ใช้เป็นแผนกปลายทางของใบแจ้งเรื่อง ──
export const fetchDepartments = (token?: string) =>
  apiGet<DepartmentApi[]>('/MasterData/departments', token);

// ── Master Data สำหรับฟอร์มเพิ่มแผนขาย (ผ่าน apiGet → 401 เด้ง login อัตโนมัติ) ──
export const fetchSalesmen = (token?: string) =>
  apiGet<SalesmanApi[]>('/MasterData/salesmen', token);

export const fetchContactChannels = (token?: string) =>
  apiGet<ContactChannelApi[]>('/MasterData/contact-channels', token);

export const fetchLeadSources = (token?: string) =>
  apiGet<LeadSourceApi[]>('/MasterData/lead-sources', token);

export const fetchCustomers = (token?: string) =>
  apiGet<CustomerApi[]>('/MasterData/customers', token);

export const fetchProvinces = (token?: string) =>
  apiGet<ProvinceApi[]>('/MasterData/provinces', token);

export const fetchMachineTypes = (token?: string) =>
  apiGet<MachineTypeApi[]>('/MasterData/machine-types', token);

export const fetchPlanStatuses = (token?: string) =>
  apiGet<PlanStatusApi[]>('/MasterData/plan-status', token);

// รุ่น — ส่ง machineTypeId ของประเภทที่เลือก
export const fetchMachineModels = (machineTypeId: string, token?: string) =>
  apiGet<MachineModelApi[]>(
    `/MasterData/machine-models?machineTypeId=${encodeURIComponent(machineTypeId)}`,
    token
  );

// ── Master Data สำหรับฟอร์มใบจองสินค้า (Booking) ──────────────
export const fetchPurposes = (token?: string) =>
  apiGet<PurposeApi[]>('/MasterData/purposes', token);

export const fetchPlanTypes = (token?: string) =>
  apiGet<PlanTypeApi[]>('/MasterData/plan-types', token);

export const fetchJobCharacters = (token?: string) =>
  apiGet<JobCharacterApi[]>('/MasterData/job-characters', token);

export const fetchJobGroups = (token?: string) =>
  apiGet<JobGroupApi[]>('/MasterData/job-groups', token);

export const fetchJobGroupDetails = (token?: string) =>
  apiGet<JobGroupDetailApi[]>('/MasterData/job-group-details', token);

export const fetchPresentWorks = (token?: string) =>
  apiGet<PresentWorkApi[]>('/MasterData/present-works', token);

export const fetchOperatorServiceTypes = (token?: string) =>
  apiGet<OperatorServiceTypeApi[]>('/MasterData/operator-service-types', token);

export const fetchFuelConditions = (token?: string) =>
  apiGet<FuelConditionApi[]>('/MasterData/fuel-conditions', token);

export const fetchSurveyWorkSites = (token?: string) =>
  apiGet<SurveyWorkSiteApi[]>('/MasterData/survey-work-sites', token);

export const fetchSurveyWorkSiteDetails = (token?: string) =>
  apiGet<SurveyWorkSiteDetailApi[]>('/MasterData/survey-work-site-details', token);

export const fetchMachineConditions = (token?: string) =>
  apiGet<MachineConditionApi[]>('/MasterData/machine-conditions', token);

export const fetchDriverConditions = (token?: string) =>
  apiGet<DriverConditionApi[]>('/MasterData/driver-conditions', token);

export const fetchDocumentBookings = (token?: string) =>
  apiGet<DocumentBookingApi[]>('/MasterData/document-bookings', token);

export const fetchTechnicianConditions = (token?: string) =>
  apiGet<TechnicianConditionApi[]>('/MasterData/technician-conditions', token);

export const fetchCreditTypes = (token?: string) =>
  apiGet<CreditTypeApi[]>('/MasterData/credit-types', token);

export const fetchCarAssignmentsPL = (token?: string) =>
  apiGet<CarAssignmentsPLApi[]>('/MasterData/car-assignments-pl', token);

export const fetchCarVerificationsSV = (token?: string) =>
  apiGet<CarVerificationsSVApi[]>('/MasterData/car-verifications-sv', token);

// ── Master Data ของใบแจ้งเรื่อง IT — มาเป็นก้อนเดียว 4 ชุด ────
// solutions (แนวทางการแก้ไข) · repairStatuses (การดำเนินการ) ·
// mainCauses (สาเหตุหลัก) · subCauses (สาเหตุรอง — กรองด้วย mainCauseId)
export const fetchItMasterData = (token?: string) =>
  apiGet<ItMasterDataApi>('/MasterData/it', token);

// ── Master Data ของใบแจ้งเรื่อง PL — ก้อนเดียวเหมือนของ IT ────
export const fetchPlMasterData = (token?: string) =>
  apiGet<PlMasterDataApi>('/MasterData/pl', token);

// ── Master Data ของใบแจ้งเรื่อง CR — ส่วนงาน → ประเภท → รายละเอียด ──
export const fetchCrMasterData = (token?: string) =>
  apiGet<CrMasterDataApi>('/MasterData/cr', token);

// ── Master Data ของใบแจ้งเรื่องรายแผนก (GA / IM / AF / SV / SQA) ──
// endpoint แยกตามแผนก แต่รูปร่างข้อมูลเดียวกัน (DeptMasterDataApi)
// dept = departmentShort จาก /MasterData/departments
export const fetchDeptMasterData = (dept: string, token?: string) =>
  apiGet<DeptMasterDataApi>(`/MasterData/${dept.toLowerCase()}`, token);
