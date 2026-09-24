import { apiGet } from './client';
import { HRRequestReport, HRRequestYearReport } from '../types/hrReport';

export type HRReportPeriod =
  | { mode: 'date'; dateFrom: string; dateTo: string }
  | { mode: 'month'; year: number; month: number }
  | { mode: 'year'; year: number };

export const fetchHRTypeStatusReport = (
  dateFrom: string,
  dateTo: string,
  requestType = '',
  token?: string
): Promise<HRRequestReport> => {
  const query = new URLSearchParams({ dateFrom, dateTo });
  if (requestType.trim()) query.set('requestType', requestType.trim());
  return apiGet<HRRequestReport>(`/HRPRRequest/reports/type-status?${query.toString()}`, token);
};

export const fetchHRTypeStatusYearReport = (period: HRReportPeriod, token?: string): Promise<HRRequestYearReport> => {
  const query = new URLSearchParams();
  if (period.mode === 'date') {
    query.set('dateFrom', period.dateFrom);
    query.set('dateTo', period.dateTo);
  } else {
    query.set('year', String(period.year));
    if (period.mode === 'month') query.set('month', String(period.month));
  }
  return apiGet<HRRequestYearReport>(`/HRPRRequest/reports/type-status-year?${query.toString()}`, token);
};
