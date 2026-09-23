export interface SVRequestSummaryItem {
  docNo: string;
  docDate: string | null;
  departid: string | null;
  departName: string | null;
  typeHV: boolean | null;
  typeFL: boolean | null;
  s1ReqRequest: string | null;
  s1ReqOther: string | null;
}

export interface SVRequestSummaryReport {
  dateFrom: string;
  dateTo: string;
  total: number;
  items: SVRequestSummaryItem[];
}
