// สถานะเอกสารของใบจองสินค้า
// 8 สถานะแรก = ลำดับขั้น workflow (ไล่ตามลำดับ) ; 2 สถานะท้าย = สถานะจบแบบพิเศษ
export type BookingDocStatus =
  | 'created' // สร้างเอกสาร
  | 'creatorConfirmed' // ผู้สร้างยืนยันเอกสาร
  | 'creatorMgrApproved' // Mgr ผู้สร้าง อนุมัติเอกสาร
  | 'plAssigned' // PL ระบุเบอร์รถ
  | 'plMgrApproved' // Mgr PL อนุมัติ
  | 'svConfirmed' // SV ยืนยันเบอร์รถ
  | 'svMgrApproved' // Mgr SV อนุมัติ
  | 'approved' // Mgr ผู้สร้างอนุมัติ (จบ)
  | 'rejected' // Mgr ผู้สร้างไม่อนุมัติ (ตีกลับ)
  | 'cancelled'; // ยกเลิกเอกสาร

// ธงเน้นแถวในตาราง: urgent = เกินกำหนด/เร่งด่วน (แดง), warn = รอดำเนินการ (ส้ม)
export type BookingFlag = 'urgent' | 'warn' | '';

// 1 รายการในประวัติเอกสาร (Audit) — ขั้นตอนที่ผ่านการดำเนินการแล้ว
export interface BookingAuditEntry {
  step: string; // ชื่อขั้นตอน เช่น 'Sales สร้าง'
  actor: string; // ผู้ดำเนินการ
  at: string; // วัน-เวลาที่ดำเนินการ เช่น '1 ส.ค. 11:20'
}

// 1 รายการฟิลด์ที่ถูกแก้ในใบเปลี่ยนแปลง (แสดง เดิม → ใหม่ หรือรายละเอียดอย่างเดียว)
export interface BookingChangeField {
  label: string; // ชื่อเรื่องที่แก้ เช่น 'เลื่อนกำหนดจอง'
  rev: number; // Rev ของฟิลด์นี้
  beforeLabel?: string; // ป้ายฝั่งเดิม (ดีฟอลต์ 'เดิม / Before')
  afterLabel?: string; // ป้ายฝั่งใหม่ (ดีฟอลต์ 'ใหม่ / New')
  before?: string; // ค่าเดิม
  after?: string; // ค่าใหม่
  detail?: string; // กรณี 'อื่นๆ' — รายละเอียดอย่างเดียว (ไม่มี เดิม/ใหม่)
  detailLabel?: string; // ป้ายของ detail (ดีฟอลต์ 'รายละเอียดเพิ่มเติม / Detail')
  extra?: { label: string; value: string }[]; // แถวเสริม เช่น สถานะรถ / วันหมดอายุสถานะ
}

// 1 ใบเปลี่ยนแปลง (Change Document) ในประวัติการเปลี่ยนแปลงของใบจอง
export interface BookingChangeDoc {
  changeNo: string; // เลขที่ใบเปลี่ยนแปลง เช่น CA690187
  editDate: string; // วันที่แก้ไข (dd/mm/yyyy)
  rev: number; // Rev ของใบเปลี่ยนแปลง
  groupLabel: string; // หัวข้อกลุ่ม เช่น 'เรื่องที่แก้ไข / Change Details' หรือ '... (PL)'
  fields: BookingChangeField[];
  reason: string; // สาเหตุ / Reason
  changedBy: string; // ผู้เปลี่ยนแปลง / Changed By
}

// ── โครงสร้างข้อมูลดิบจาก API: GET /api/v1/Bookings ──────────
// ฟิลด์ตรงตาม response ของ backend (best-effort — เพิ่มได้เมื่อพบฟิลด์ใหม่)
export interface BookingApi {
  bookingId: number;
  bookingNo: string;
  bookingDt: string; // ISO datetime
  purposeNameTh: string | null;
  createBy: string | null; // ผู้จัดทำ (login.fullname as CreateBy)
  saleserName: string | null; // ชื่อพนักงานขาย (spsc.FullNameTH as SaleserName)
  nextStateName: string | null; // ขั้นที่กำลังรอดำเนินการ (ใช้เดา docStatus + แสดงเป็นข้อความสถานะ)
  stateCode: string | null; // รหัสสถานะเอกสาร (BWS.StateCode) — ใช้กำหนดสี badge สถานะ
  wfStateId: number | null;
  wfVersionId: number | null;
  remarkReject: string | null;
  remarkCancel: string | null;

  customerCode: string | null;
  customerName: string | null;
  customerType: string | null; // OLD / NEW
  workDetail: string | null; // ลักษณะงาน
  workAddress: string | null; // สถานที่ทำงาน
  contactName: string | null;
  contactPhone: string | null;
  startWorkDt: string | null;
  endWorkDt: string | null;
  duration: number | null;
  presentWorkNameTh: string | null; // ต้องการนำเสนองาน (เช่น งานเดือน)
  description: string | null; // หน่วยของ duration (เช่น เดือน)
  machineTypeId: string | null; // ประเภทเครื่องจักรที่ต้องการ

  // ── ฝ่าย PL (ระบุเบอร์รถ) ──
  carAssignmentsPlId: number | null;
  carAssignmentsPlNameTh: string | null;
  machineTypeIdPl: string | null; // เบอร์รถที่ PL ระบุ
  machineAvailableOnDatePl: string | null;
  remarkPl: string | null;
  creationDtpl: string | null;

  // ── ฝ่าย SV (ยืนยันเบอร์รถ) ──
  carVerificationsSvId: number | null;
  carVerificationsSvNameTh: string | null;
  machineTypeIdSv: string | null; // เบอร์รถที่ SV ยืนยัน
  machineAvailableOnDateSv: string | null;
  remarkSv: string | null;

  deliveryNo: string | null;
  quotationNo: string | null;
  createdByDepartId: string | null;
}

// 1 แถวในตารางใบจองสินค้า
export interface BookingRow {
  id: number;
  book: string; // เลขที่ใบจอง (bookingNo) เช่น PPD690259
  createDate: string; // วันที่สร้างใบจอง (bookingDt) dd/mm/yyyy
  docStatus: BookingDocStatus; // สถานะเอกสารแบบ enum (เดาจาก nextStateName — ใช้ workflow)
  docStatusText: string; // ข้อความสถานะเอกสารตรงตาม nextStateName ที่ API ส่งมา (ใช้แสดง/กรอง/เรียงในคอลัมน์)
  stateCode: string; // รหัสสถานะเอกสาร (BWS.StateCode) — ใช้กำหนดสี badge สถานะ ('' ถ้าไม่มี)
  purpose: string; // วัตถุประสงค์ (purposeNameTh)
  customer: string; // ชื่อลูกค้า (customerName)
  jobType: string; // ลักษณะงาน (workDetail)
  site: string; // สถานที่ทำงาน (workAddress)
  startDate: string; // วันที่เริ่มทำงาน (startWorkDt)
  endDate: string; // วันที่สิ้นสุดการทำงาน (endWorkDt)
  duration: string; // ระยะเวลาเช่า (duration + description) เช่น "2 เดือน"
  machine: string; // ประเภทเครื่องจักร (machineTypeId)
  truckPL: string; // เบอร์รถที่ PL ระบุ (machineTypeIdPl) — '—' ถ้ายังไม่ระบุ
  truckSV: string; // เบอร์รถใหม่ที่ SV ระบุ (machineTypeIdSv)
  replyPL: string; // สถานะการตอบกลับ PL (carAssignmentsPlNameTh)
  quotationNo: string; // เลขที่ใบเสนอราคา (quotationNo)
  contactName: string; // ชื่อผู้ติดต่อหน้างาน (contactName)
  contactPhone: string; // เบอร์ผู้ติดต่อหน้างาน (contactPhone)
  deliveryNo: string; // เลขที่ใบจัดส่ง (deliveryNo)
  plSupplyDate: string; // วันที่ PL จัดหา อปต. (machineAvailableOnDatePl)
  remarkPL: string; // หมายเหตุ PL (remarkPl)
  replySV: string; // สถานะการตอบกลับของ SV (carVerificationsSvNameTh)
  svReadyDate: string; // วันที่ SV ผลิตรถทัน (machineAvailableOnDateSv)
  svLateReason: string; // สาเหตุผลิตรถไม่ทัน (remarkSv เมื่อมี machineAvailableOnDateSv)
  svNewTruckReason: string; // สาเหตุการระบุเบอร์รถใหม่ (remarkSv เมื่อมี machineTypeIdSv)
  remarkReject: string; // สาเหตุไม่ยืนยันการจอง (remarkReject)
  remarkCancel: string; // สาเหตุยกเลิกการจอง (remarkCancel)
  salesperson: string; // ชื่อพนักงานขาย (fullNameTh)
  reply: '' | 'ready'; // สถานะตอบกลับรวม (ready = เครื่องจักรพร้อม) — ใช้ในหน้าอนุมัติ
  flag: BookingFlag;
}
