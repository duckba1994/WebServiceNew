import { useCallback, useState } from 'react';
import { apiErrorText } from '../api/client';
import { fetchSVRequestSummary } from '../api/svReports';
import { SVRequestSummaryReport } from '../types/svReport';

export function useSVRequestSummary(token?: string) {
  const [data, setData] = useState<SVRequestSummaryReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastQuery, setLastQuery] = useState<{ dateFrom: string; dateTo: string } | null>(null);

  const search = useCallback(async (dateFrom: string, dateTo: string) => {
    setLoading(true);
    setError('');
    setData(null);
    setLastQuery({ dateFrom, dateTo });
    try {
      const response = await fetchSVRequestSummary(dateFrom, dateTo, token);
      setData({ ...response, items: Array.isArray(response.items) ? response.items : [] });
    } catch (reason) {
      setError(apiErrorText(reason, 'โหลดรายงานสรุปใบแจ้งเรื่อง SV ไม่สำเร็จ'));
    } finally {
      setLoading(false);
    }
  }, [token]);

  const retry = useCallback(() => {
    if (lastQuery) void search(lastQuery.dateFrom, lastQuery.dateTo);
  }, [lastQuery, search]);

  return { data, loading, error, search, retry };
}
