import { apiGet } from './client';
import { PLRequestFormReport, PLRequestFormReportType, PLRequestReport, PLViewerSummaryReport } from '../types/plReport';

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

export const fetchPLViewerSummary = (
  dateFrom: string,
  dateTo: string,
  departId = '',
  wfStep = 0,
  token?: string,
): Promise<PLViewerSummaryReport> => {
  const query = new URLSearchParams({ dateFrom, dateTo });
  if (departId) query.set('departId', departId);
  if (wfStep > 0) query.set('wfStep', String(wfStep));
  return apiGet<PLViewerSummaryReport>(`/PLRequest/reports/viewer-summary?${query.toString()}`, token);
};
