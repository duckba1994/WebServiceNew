import { apiGet } from './client';
import { PSBalanceItem, PSBIT60057Report, PSBIT61091Report, PSBIT61118Report, PSBIT63022Report, PSReportResponse } from '../types/psReport';

export const fetchPSSummary = (
  dateFrom: string,
  dateTo: string,
  departmentId = '',
  wfStep?: number,
  token?: string,
): Promise<PSReportResponse<PSBalanceItem>> => {
  const query = new URLSearchParams({ dateFrom, dateTo });
  if (departmentId.trim()) query.set('departmentId', departmentId.trim());
  if (wfStep !== undefined) query.set('wfStep', String(wfStep));
  return apiGet<PSReportResponse<PSBalanceItem>>(`/PSRequest/reports/summary?${query.toString()}`, token);
};

export const fetchPSBalanceForm = (year: number, month: number, token?: string): Promise<PSReportResponse<PSBalanceItem>> =>
  apiGet<PSReportResponse<PSBalanceItem>>(`/PSRequest/reports/balance-form?year=${year}&month=${month}`, token);

export const fetchPSBIT60057 = (year: number, month: number, token?: string): Promise<PSBIT60057Report> =>
  apiGet<PSBIT60057Report>(`/PSRequest/reports/bit60-057?year=${year}&month=${month}`, token);

export const fetchPSBIT61091 = (dateFrom?: string, dateTo?: string, token?: string): Promise<PSBIT61091Report> => {
  const query = dateFrom && dateTo ? `?${new URLSearchParams({ dateFrom, dateTo }).toString()}` : '';
  return apiGet<PSBIT61091Report>(`/PSRequest/reports/bit61-091${query}`, token);
};

export const fetchPSBIT63022 = (dateFrom: string, dateTo: string, token?: string): Promise<PSBIT63022Report> => {
  const query = new URLSearchParams({ dateFrom, dateTo });
  return apiGet<PSBIT63022Report>(`/PSRequest/reports/bit63-022?${query.toString()}`, token);
};

export const fetchPSBIT61118 = (
  groupBy: 'quantity' | 'department' | 'month',
  dateFrom: string,
  dateTo: string,
  rpId = '',
  rpDetailId = '',
  token?: string,
): Promise<PSBIT61118Report> => {
  const query = new URLSearchParams({ dateFrom, dateTo });
  if (rpId.trim()) query.set('rpId', rpId.trim());
  if (rpDetailId.trim()) query.set('rpDetailId', rpDetailId.trim());
  return apiGet<PSBIT61118Report>(`/PSRequest/reports/bit61-118/${groupBy}?${query.toString()}`, token);
};
