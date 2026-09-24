export interface HRRequestReportItem {
  docNo: string;
  docDate: string | null;
  site: string | null;
  requestBy: string | null;
  position: string | null;
  department: string | null;
  requestType: string | null;
  requestDetail: string | null;
  reqBy: string | null;
  reqDate: string | null;
  inspectorBy: string | null;
  inspectorDate: string | null;
  receiptBy: string | null;
  receiptDate: string | null;
  receiptInspectorBy: string | null;
  receiptInspectorDate: string | null;
  action: string | null;
  refAction: string | null;
  serviceBy: string | null;
  serviceDate: string | null;
  receiptDocBy: string | null;
  receiptDocDate: string | null;
  cancelBy: string | null;
  cancelDate: string | null;
  remark: string | null;
  status: string | null;
}

export interface HRRequestReport {
  dateFrom: string;
  dateTo: string;
  requestType: string | null;
  total: number;
  items: HRRequestReportItem[];
}

export interface HRRequestYearReportItem {
  docNo: string;
  docDate: string | null;
  department: string | null;
  requestType: string | null;
  quantity: number;
  status: string | null;
}

export interface HRRequestYearReport {
  dateFrom: string;
  dateTo: string;
  periodType: 'date' | 'month' | 'year';
  total: number;
  items: HRRequestYearReportItem[];
}
