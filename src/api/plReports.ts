import { apiGet } from './client';
import { PLRequestFormReport, PLRequestFormReportType, PLRequestReport } from '../types/plReport';

export const fetchPLRequestFormReport = (
  docNo: string,
  reportType: PLRequestFormReportType,
  token?: string
): Promise<PLRequestFormReport> =>
  apiGet<PLRequestFormReport>(
    `/PLRequest/reports/request-form/${encodeURIComponent(docNo)}?reportType=${reportType}`,
    token
  );

export const fetchPLRequestReport = (
  dateFrom: string,
  dateTo: string,
  token?: string
): Promise<PLRequestReport> => {
  const query = new URLSearchParams({ dateFrom, dateTo });
  return apiGet<PLRequestReport>(`/PLRequest/reports/request-summary?${query.toString()}`, token);
};
