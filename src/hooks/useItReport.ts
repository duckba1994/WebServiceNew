import { useCallback, useState } from 'react';
import { apiErrorText } from '../api/client';
import { fetchItReport } from '../api/itReports';
import { DateRangeReport, ITReportName } from '../types/itReport';

export function useItReport<T>(report: ITReportName, token?: string) {
  const [data, setData] = useState<DateRangeReport<T> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastQuery, setLastQuery] = useState<{ dateFrom: string; dateTo: string } | null>(null);

  const search = useCallback(async (dateFrom: string, dateTo: string) => {
    setLoading(true);
    setError('');
    setData(null);
    try {
      const response = await fetchItReport<T>(report, dateFrom, dateTo, token);
      setData({ ...response, items: Array.isArray(response.items) ? response.items : [] });
      setLastQuery({ dateFrom, dateTo });
    } catch (reason) {
      setError(apiErrorText(reason, 'โหลดรายงานไม่สำเร็จ'));
    } finally {
      setLoading(false);
    }
  }, [report, token]);

  const retry = useCallback(() => {
    if (lastQuery) void search(lastQuery.dateFrom, lastQuery.dateTo);
  }, [lastQuery, search]);

  return { data, loading, error, search, retry };
}
