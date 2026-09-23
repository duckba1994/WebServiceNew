import { apiGet } from './client';
import { PLRequestReport } from '../types/plReport';

export const fetchPLRequestReport = (
  dateFrom: string,
  dateTo: string,
  token?: string
): Promise<PLRequestReport> => {
  const query = new URLSearchParams({ dateFrom, dateTo });
  return apiGet<PLRequestReport>(`/PLRequest/reports/request-summary?${query.toString()}`, token);
};
