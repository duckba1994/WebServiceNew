import { useCallback, useState } from 'react';
import { apiErrorText } from '../api/client';
import { fetchHRTypeStatusReport, fetchHRTypeStatusYearReport, HRReportPeriod } from '../api/hrReports';
import { HRRequestReport, HRRequestYearReport } from '../types/hrReport';

export function useHRRequestReport(token?: string) {
  const [data, setData] = useState<HRRequestReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastQuery, setLastQuery] = useState<{ dateFrom: string; dateTo: string; requestType: string } | null>(null);

  const search = useCallback(async (dateFrom: string, dateTo: string, requestType = '') => {
    setLoading(true);
    setError('');
    setData(null);
    setLastQuery({ dateFrom, dateTo, requestType });
    try {
      const response = await fetchHRTypeStatusReport(dateFrom, dateTo, requestType, token);
      const items = Array.isArray(response.items) ? response.items : [];
      setData({ ...response, items, total: Number.isFinite(response.total) ? response.total : items.length });
    } catch (reason) {
      setError(apiErrorText(reason, 'โหลดรายงานสรุปการรับเรื่อง HR ไม่สำเร็จ'));
    } finally {
      setLoading(false);
    }
  }, [token]);

  const retry = useCallback(() => {
    if (lastQuery) void search(lastQuery.dateFrom, lastQuery.dateTo, lastQuery.requestType);
  }, [lastQuery, search]);

  return { data, loading, error, search, retry };
}

export function useHRRequestYearReport(token?: string) {
  const [data, setData] = useState<HRRequestYearReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastQuery, setLastQuery] = useState<HRReportPeriod | null>(null);

  const search = useCallback(async (period: HRReportPeriod) => {
    setLoading(true);
    setError('');
    setData(null);
    setLastQuery(period);
    try {
      const response = await fetchHRTypeStatusYearReport(period, token);
      const items = Array.isArray(response.items) ? response.items : [];
      setData({ ...response, items, total: Number.isFinite(response.total) ? response.total : items.length });
    } catch (reason) {
      setError(apiErrorText(reason, 'โหลดสรุปรายงานการรับเรื่อง HR ประจำปีไม่สำเร็จ'));
    } finally {
      setLoading(false);
    }
  }, [token]);

  const retry = useCallback(() => {
    if (lastQuery) void search(lastQuery);
  }, [lastQuery, search]);

  return { data, loading, error, search, retry };
}
