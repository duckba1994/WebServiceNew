import { apiGet } from './client';
import { DateRangeReport, ITReportName } from '../types/itReport';

export const fetchItReport = <T>(
  report: ITReportName,
  dateFrom: string,
  dateTo: string,
  token?: string
): Promise<DateRangeReport<T>> => {
  const query = new URLSearchParams({ dateFrom, dateTo });
  return apiGet<DateRangeReport<T>>(`/ITRequest/reports/${report}?${query.toString()}`, token);
};
