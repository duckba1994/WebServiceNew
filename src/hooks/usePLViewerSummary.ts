import { useCallback, useState } from 'react';
import { apiErrorText } from '../api/client';
import { fetchPLViewerSummary } from '../api/plReports';
import { PLViewerSummaryReport } from '../types/plReport';

interface ViewerSummaryQuery {
  dateFrom: string;
  dateTo: string;
  departId: string;
  wfStep: number;
}

export function usePLViewerSummary(token?: string) {
  const [data, setData] = useState<PLViewerSummaryReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastQuery, setLastQuery] = useState<ViewerSummaryQuery | null>(null);

  const search = useCallback(async (query: ViewerSummaryQuery) => {
    setLoading(true);
    setError('');
    setData(null);
    setLastQuery(query);
    try {
      const response = await fetchPLViewerSummary(query.dateFrom, query.dateTo, query.departId, query.wfStep, token);
      setData({ ...response, items: Array.isArray(response.items) ? response.items : [] });
    } catch (reason) {
      setError(apiErrorText(reason, 'โหลด Print Summary PL ไม่สำเร็จ'));
    } finally {
      setLoading(false);
    }
  }, [token]);

  const retry = useCallback(() => {
    if (lastQuery) void search(lastQuery);
  }, [lastQuery, search]);

  return { data, loading, error, search, retry };
}
