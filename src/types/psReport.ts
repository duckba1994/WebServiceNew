export interface PSBalanceItem {
  docNo: string;
  docDate: string | null;
  type: string | null;
  requestDetail: string | null;
  requestType: string | null;
  planDate: string | null;
  action: string | null;
  workResults: string | null;
  department: string | null;
  departmentId: string | null;
  requestBy: string | null;
  requestDate: string | null;
  remark: string | null;
  description: string | null;
  wfStep: number | null;
  wfStatus: string | null;
  jobStatus: number | null;
  jobStatusName: string;
  serviceBy: string | null;
  serviceDate: string | null;
  actionDetail: string | null;
  cancelBy: string | null;
  cancelDate: string | null;
}

export interface PSReportResponse<T> {
  dateFrom: string;
  dateTo: string;
  total: number;
  items: T[];
}

export interface PSBIT60057Breakdown {
  category: number;
  categoryName: string;
  department: string | null;
  quantity: number;
}

export interface PSBIT60057Report extends PSReportResponse<PSBalanceItem> {
  cancelledTotal: number;
  breakdown: PSBIT60057Breakdown[];
}

export interface PSBIT61118Item {
  docNo: string;
  docDate: string | null;
  prelimId: string | null;
  prelimDate: string | null;
  prelimCarId: string | null;
  groupName: string | null;
  subGroupName: string | null;
  requestDetail: string | null;
  planDate: string | null;
  requestBy: string | null;
  department: string | null;
  remark: string | null;
  changeDate: string | null;
  rpName: string;
  wrDetail: string | null;
  refPR: string | null;
  approveDate: string | null;
  refPO: string | null;
  rpDetailName: string | null;
  rpDetailId: string | null;
  serviceDate: string | null;
  approveDateService: string | null;
  rpId: string | null;
}

export interface PSBIT61118Group {
  key: string;
  rpName: string | null;
  rpDetailName: string | null;
  department: string | null;
  year: number | null;
  month: number | null;
  quantity: number;
}

export interface PSBIT61118Report {
  dateFrom: string;
  dateTo: string;
  groupBy: 'quantity' | 'department' | 'month';
  rpId: string | null;
  rpDetailId: string | null;
  total: number;
  groups: PSBIT61118Group[];
  items: PSBIT61118Item[];
}

export interface PSBIT61091Item {
  reportStep: number;
  rowNumber: number;
  docNo: string;
  docTime: string | null;
  requestDetail: string | null;
  psApprove: string | null;
  prelimId: string | null;
  prelimCarId: string | null;
  groupName: string | null;
  leadTime: number | null;
  remark: string | null;
  step: number | null;
  wfStatus: string | null;
  department: string | null;
  requestWFStatus: string | null;
}

export interface PSBIT61091Report {
  dateFrom: string | null;
  dateTo: string | null;
  mode: 'date' | 'status';
  total: number;
  step2Items: PSBIT61091Item[];
  step3Items: PSBIT61091Item[];
}

export interface PSBIT63022Item {
  docNo: string;
  docDate: string | null;
  priceDate: string | null;
  planPrice: string | null;
  prelimId: string | null;
  prelimCarId: string | null;
  groupName: string | null;
  department: string | null;
  requestDetail: string | null;
  approveDateStep2: string | null;
  approveDateStep3: string | null;
  approvedStep3: boolean | null;
  description: string | null;
  supplier: string | null;
  weekNumber: number;
  quoteStatus: string;
  sendLeadTimeDays: number;
  standardStatus: string;
  requiredDateVarianceDays: number;
  requiredDateStatus: string;
  planVarianceDays: number;
  planDateStatus: string;
}

export type PSWeeklyMeasure = 'standard' | 'required-date' | 'quote-result' | 'plan-date';

export interface PSBIT63022Weekly {
  weekNumber: number;
  measure: PSWeeklyMeasure;
  result: string;
  quantity: number;
  total: number;
  percent: number;
}

export interface PSBIT63022Report extends PSReportResponse<PSBIT63022Item> {
  weekly: PSBIT63022Weekly[];
}
