import { apiGet } from './client';
import { DateRangeReport, ITReportName, ITServiceFormItem } from '../types/itReport';

export const fetchItReport = <T>(
  report: ITReportName,
  dateFrom: string,
  dateTo: string,
  token?: string
): Promise<DateRangeReport<T>> => {
  const query = new URLSearchParams({ dateFrom, dateTo });
  return apiGet<DateRangeReport<T>>(`/ITRequest/reports/${report}?${query.toString()}`, token);
};

export const fetchItServiceForm = (jobNo: string, token?: string): Promise<ITServiceFormItem> =>
  apiGet<ITServiceFormItem>(`/ITRequest/reports/service-form/${encodeURIComponent(jobNo)}`, token);
