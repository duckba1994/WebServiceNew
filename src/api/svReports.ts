import { apiGet } from './client';
import { SVRequestSummaryReport } from '../types/svReport';

export const fetchSVRequestSummary = (
  dateFrom: string,
  dateTo: string,
  token?: string
): Promise<SVRequestSummaryReport> => {
  const query = new URLSearchParams({ dateFrom, dateTo });
  return apiGet<SVRequestSummaryReport>(`/SVRequest/reports/request-summary?${query.toString()}`, token);
};
