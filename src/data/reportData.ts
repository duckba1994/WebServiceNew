export type ReportDepartment = 'IT';
export type ReportKey = 'it-satisfaction-summary' | 'it-request-register';

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
];

export const reportsForDepartment = (departmentShort?: string, isAdmin = false): ReportDefinition[] => {
  if (isAdmin) return REPORTS;
  const department = (departmentShort ?? '').trim().toUpperCase();
  return REPORTS.filter((report) => report.department === department);
};

export const reportByKey = (key: ReportKey): ReportDefinition => REPORTS.find((report) => report.key === key)!;
