import { useCallback, useState } from 'react';
import { apiErrorText } from '../api/client';
import { fetchPLRequestReport } from '../api/plReports';
import { PLRequestReport } from '../types/plReport';

const EMPTY_SUMMARY = { jobStatuses: [], requestTypes: [] };

export function usePLRequestReport(token?: string) {
  const [data, setData] = useState<PLRequestReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastQuery, setLastQuery] = useState<{ dateFrom: string; dateTo: string } | null>(null);

  const search = useCallback(async (dateFrom: string, dateTo: string) => {
    setLoading(true);
    setError('');
    setData(null);
    try {
      const response = await fetchPLRequestReport(dateFrom, dateTo, token);
      setData({
        ...response,
        items: Array.isArray(response.items) ? response.items : [],
        summary: response.summary ?? EMPTY_SUMMARY,
      });
      setLastQuery({ dateFrom, dateTo });
    } catch (reason) {
      setError(apiErrorText(reason, 'โหลดรายงานใบรับเรื่อง PL ไม่สำเร็จ'));
    } finally {
      setLoading(false);
    }
  }, [token]);

  const retry = useCallback(() => {
    if (lastQuery) void search(lastQuery.dateFrom, lastQuery.dateTo);
  }, [lastQuery, search]);

  return { data, loading, error, search, retry };
}
