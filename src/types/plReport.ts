export interface PLReportCount {
  key: string;
  label: string;
  count: number;
}

export interface PLRequestReportItem {
  docNo: string;
  docDate: string | null;
  type: string | null;
  requestType: string | null;
  requestDetail: string | null;
  requestDetailRemark: string | null;
  requestBy: string | null;
  department: string | null;
  wfStep: number | null;
  wfStep2AppDate: string | null;
  dateService: number | null;
  wrDetail: string | null;
  actionDetail: string | null;
  wfStep3AppDate: string | null;
  jobStatus: number | null;
  description: string | null;
}

export interface PLRequestReport {
  dateFrom: string;
  dateTo: string;
  total: number;
  summary: {
    jobStatuses: PLReportCount[];
    requestTypes: PLReportCount[];
  };
  items: PLRequestReportItem[];
}

export type PLRequestFormReportType = 'master' | 'approve' | 'header';

export interface PLRequestFormHeader {
  docNo: string;
  docDate: string | null;
  company: string | null;
  type: string | null;
  requestDetail: string | null;
  requestType: string | null;
  attachBudget: boolean;
  budgetDocNo: string | null;
  attachExBudget: boolean;
  exBudgetDocNo: string | null;
  attachSpec: boolean;
  attachQuatation: boolean;
  attachPicture: boolean;
  attachCustDocConfirm: boolean;
  attachOther: boolean;
  attachOtherDetail: string | null;
  planDate: string | null;
  action: string | null;
  refPR: string | null;
  leadTime: number | null;
  workResults: string | null;
  departName: string | null;
  requestBy: string | null;
  actionDetail: string | null;
  wrDetail: string | null;
  requestDate: string | null;
  remark: string | null;
}

export interface PLRequestFormLine {
  recNo: string;
  item: string;
  qty: number;
  unit: string | null;
  remark: string | null;
}

export interface PLRequestFormApproval {
  step: number;
  approveBy: string | null;
  approveDate: string | null;
  description: string | null;
  docNo: string;
}

export interface PLRequestFormReport {
  reportType: PLRequestFormReportType;
  header: PLRequestFormHeader;
  lines: PLRequestFormLine[];
  approvals: PLRequestFormApproval[];
}
