export type ReportDepartment = 'IT' | 'PL' | 'SV' | 'HR' | 'PS';
export type ITReportKey = 'it-satisfaction-summary' | 'it-request-register';
export type HRReportKey = 'hr-request-summary' | 'hr-request-summary-year';
export type PSReportKey =
  | 'ps-summary'
  | 'ps-balance-form'
  | 'ps-bit60-057'
  | 'ps-bit61-091'
  | 'ps-bit61-118-quantity'
  | 'ps-bit61-118-department'
  | 'ps-bit61-118-month'
  | 'ps-bit63-022';
export type ReportKey = ITReportKey | HRReportKey | PSReportKey | 'pl-request-report' | 'sv-request-summary';

export interface ReportDefinition {
  key: ReportKey;
  department: ReportDepartment;
  title: string;
  description: string;
  path: string;
  pending?: boolean;
}

export const REPORTS: ReportDefinition[] = [
  {
    key: 'it-satisfaction-summary',
    department: 'IT',
    title: 'รายงานสรุปความพึงพอใจหน่วยงาน IT',
    description: 'สรุปผลประเมินความพึงพอใจจากใบรับเรื่องของหน่วยงาน IT',
    path: '/reports/it/satisfaction-summary',
  },
  {
    key: 'it-request-register',
    department: 'IT',
    title: 'รายงานทะเบียนคุมใบ Service Form',
    description: 'ทะเบียนรายการรับเรื่องและสถานะการดำเนินงานของหน่วยงาน IT',
    path: '/reports/it/request-register',
  },
  {
    key: 'pl-request-report',
    department: 'PL',
    title: 'รายงานใบรับเรื่อง',
    description: 'รายงานรายละเอียดใบรับเรื่อง PL พร้อมสรุปสถานะและเรื่องที่แจ้ง',
    path: '/reports/pl/request-report',
  },
  {
    key: 'sv-request-summary',
    department: 'SV',
    title: 'รายงานสรุปประเภทการแจ้งเรื่อง',
    description: 'สรุปจำนวนใบแจ้งเรื่อง SV รายเดือน แยกตามส่วนงาน หน่วยงานผู้แจ้ง และประเภทเรื่อง',
    path: '/reports/sv/request-summary',
  },
  {
    key: 'hr-request-summary',
    department: 'HR',
    title: 'สรุปรายงานการรับเรื่อง',
    description: 'รายละเอียดใบรับเรื่อง HR พร้อมตารางสรุปตามเรื่องที่แจ้ง แผนก และสถานะ',
    path: '/reports/hr/request-summary',
  },
  {
    key: 'hr-request-summary-year',
    department: 'HR',
    title: 'สรุปรายงานการรับเรื่อง (ปี)',
    description: 'สรุปจำนวนใบรับเรื่อง HR รายเดือน แยกตามเรื่องที่แจ้ง สถานะ และแผนก',
    path: '/reports/hr/request-summary-year',
  },
  {
    key: 'ps-summary',
    department: 'PS',
    title: 'Print',
    description: 'รายงานสรุปใบขอราคา แสดงรายละเอียดเอกสารและสถานะ workflow',
    path: '/reports/ps/summary',
  },
  {
    key: 'ps-balance-form',
    department: 'PS',
    title: 'Print Summary',
    description: 'สรุปรายการใบรับเรื่องขอราคาประจำเดือน',
    path: '/reports/ps/balance-form',
  },
  {
    key: 'ps-bit60-057',
    department: 'PS',
    title: 'รายงานการขอราคาประจำเดือน (2017)',
    description: 'สรุปรายงานการขอราคาประจำเดือน พร้อมสถานะรายแผนกและรายละเอียดเอกสาร',
    path: '/reports/ps/bit60-057',
  },
  {
    key: 'ps-bit61-091',
    department: 'PS',
    title: 'รายงานการขอมาตรฐานขอราคา',
    description: 'รายงานการรับและตอบกลับใบขอราคา พร้อมผลตามมาตรฐานภายใน 3 วัน',
    path: '/reports/ps/bit61-091',
  },
  {
    key: 'ps-bit61-118-quantity',
    department: 'PS',
    title: 'รายงานใบขอราคา แยกตามจำนวน',
    description: 'สรุปจำนวนใบขอราคา แยกตามสถานะและรายละเอียดสถานะ',
    path: '/reports/ps/bit61-118/quantity',
  },
  {
    key: 'ps-bit61-118-department',
    department: 'PS',
    title: 'รายงานใบขอราคา แยกตามแผนก',
    description: 'รายละเอียดและยอดรวมใบขอราคา แยกตามแผนก',
    path: '/reports/ps/bit61-118/department',
  },
  {
    key: 'ps-bit61-118-month',
    department: 'PS',
    title: 'รายงานใบขอราคา แยกตามเดือน',
    description: 'สรุปจำนวนใบขอราคา แยกตามปีและเดือน',
    path: '/reports/ps/bit61-118/month',
  },
  {
    key: 'ps-bit63-022',
    department: 'PS',
    title: 'รายงานใบขอราคาประจำเดือน',
    description: 'รายละเอียดใบขอราคาและตัวชี้วัดผลดำเนินงานแยกรายสัปดาห์',
    path: '/reports/ps/bit63-022',
  },
];

const REPORT_DEPARTMENT_ALIASES: Record<string, ReportDepartment> = {
  'HR-PR': 'HR',
  HR_PR: 'HR',
  'SV-HV': 'SV',
  SV_HV: 'SV',
};

export const reportDepartmentOf = (departmentShort?: string): string => {
  const department = (departmentShort ?? '').trim().toUpperCase();
  return REPORT_DEPARTMENT_ALIASES[department] ?? department;
};

export const canAccessReportDepartment = (
  reportDepartment: ReportDepartment,
  departmentShort?: string,
  isAdmin = false,
): boolean => isAdmin || reportDepartmentOf(departmentShort) === reportDepartment;

export const reportsForDepartment = (departmentShort?: string, isAdmin = false): ReportDefinition[] => {
  if (isAdmin) return REPORTS;
  const department = reportDepartmentOf(departmentShort);
  return REPORTS.filter((report) => report.department === department);
};

export const reportByKey = (key: ReportKey): ReportDefinition => REPORTS.find((report) => report.key === key)!;
