// สถานะการขายของแผนขาย
export type SaleStatus = 'quote' | 'progress' | 'booked' | 'won' | 'lost';

// ประเภทแผนขาย
export type SalesPlanType = 'Positive' | 'Insert';

// ── โครงสร้างข้อมูลดิบจาก API ────────────────────────────────
// GET /api/v1/SalesPlans — หัวเอกสารแผนขาย (ใช้ planId เป็นตัวเลือกใน combobox)
export interface SalesPlanApi {
  planId: string;
  planDate: string;
  planType: string;
  revise: string;
  createBy: string;
  createDate: string;
  modifyBy: string;
  modifyDate: string;
  getPlanDate: string;
  recNo: number;
}

// GET /api/v1/SalesPlans/lines?planId= — บรรทัดรายละเอียดของแผนขาย
// ประกาศครบทุกฟิลด์ตามที่ API ส่งมา (ไม่ใช้ index signature เพื่อให้ TS ตรวจชื่อฟิลด์ผิดได้)
export interface SalesPlanLineApi {
  planId: string;
  planDate: string;
  planType: string;
  module: string;
  no: number;
  custAccount: string;
  custName: string;
  deliveryAddress: string;
  city: string;
  salesCode: number;
  salemanId: string;
  machineTypeId: string;
  planStatus: string;
  probability: number;
  startFromDate: string;
  weekNum: number;
  lateDate: string;
  lateWeek: number;
  planActualDate: string;
  planActualWeek: number;
  issueGroup: string;
  issueDetail: string;
  planDateMax: number;
  actualDateMax: number;
  carId: string;
  checkPlan: string;
  conditionMonth: boolean;
  conditionDay: boolean;
  periodNotLess: number;
  week1Plan: boolean;
  week1ValuePlan: number;
  week1Actual: boolean;
  week1ValueActual: number;
  week2Plan: boolean;
  week2ValuePlan: number;
  week2Actual: boolean;
  week2ValueActual: number;
  week3Plan: boolean;
  week3ValuePlan: number;
  week3Actual: boolean;
  week3ValueActual: number;
  week4Plan: boolean;
  week4ValuePlan: number;
  week4Actual: boolean;
  week4ValueActual: number;
  week5Plan: boolean;
  week5ValuePlan: number;
  week5Actual: boolean;
  week5ValueActual: number;
  actualPrice: number;
  remark: string;
  weekActual: number;
  dateActual: string;
  checkPlanActual: string;
  actualMcStatus: string;
  actualMachineTypeId: string;
  planValue: number;
  actualValue: number;
  subValue: number;
  lostSale: number;
  revise: string;
  createBy: string;
  createDate: string;
  modifyBy: string;
  modifyDate: string;
  recNo: number;
  quotationId: string;
  poid: string;
  logId: string;
  issueCarId: string;
  aoId: string;
  planCategory: string;
  spid: string;
  createFDate: string;
  mark: string;
  statusTracking: string;
  mktUsability: string;
  problemName: string;
  startFromDate1: string;
  isInterchangeable: boolean;
  interchangeableRemarks: string;
  contactChannelId: number;
  leadSourceId: number;
  leadSourceRemark: string;
  // ── ฟิลด์เพิ่มเติมจาก response จริง (ชื่อคีย์ตรงตามที่ API ส่งมา) ──
  car: string | null; // เบอร์รถที่ออกงาน (คอลัมน์คำนวณ 'รถบริษัท : x' / 'รถทดแทน' / 'รถเช่าช่วง')
  pl6RequestDateTime: string | null; // วันที่ยืนยันออกงาน (l.PL6_RequestDateTime)
  contactChannelNameEn: string | null; // แผนขายจาก (ชื่อช่องทาง)
  leadSourceNameTh: string | null; // แหล่งข้อมูลจาก (ชื่อแหล่งที่มา)
  actualValue1: number | null; // sp.ActualValue AS ActualValue1
  jobType?: string; // ลักษณะงาน (ยังหาฟิลด์ต้นทางไม่พบทั้งใน API และ SQL)
}

// หมายเหตุ: ตารางและฟอร์มอ่านจาก SalesPlanLineApi โดยตรง (ไม่มีชั้น projection กลาง)
// เพื่อให้ชื่อคอลัมน์/ฟิลด์ตรงกับ API 1:1 และไม่ต้องเดาค่าที่ API ไม่ได้ส่งมา
