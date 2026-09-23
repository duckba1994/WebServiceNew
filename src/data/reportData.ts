export type ReportDepartment = 'IT' | 'PL';
export type ITReportKey = 'it-satisfaction-summary' | 'it-request-register';
export type ReportKey = ITReportKey | 'pl-request-report';

export interface ReportDefinition {
  key: ReportKey;
  department: ReportDepartment;
  title: string;
  description: string;
  path: string;
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
];

export const reportsForDepartment = (departmentShort?: string, isAdmin = false): ReportDefinition[] => {
  if (isAdmin) return REPORTS;
  const department = (departmentShort ?? '').trim().toUpperCase();
  return REPORTS.filter((report) => report.department === department);
};

export const reportByKey = (key: ReportKey): ReportDefinition => REPORTS.find((report) => report.key === key)!;
