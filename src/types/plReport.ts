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
