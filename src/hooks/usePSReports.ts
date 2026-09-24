import { useCallback, useState } from 'react';
import { apiErrorText } from '../api/client';
import { fetchPSBalanceForm, fetchPSBIT60057, fetchPSBIT61091, fetchPSBIT61118, fetchPSBIT63022, fetchPSSummary } from '../api/psReports';
import { PSBalanceItem, PSBIT60057Report, PSBIT61091Report, PSBIT61118Report, PSBIT63022Report, PSReportResponse } from '../types/psReport';

export function usePSSummaryReport(token?: string) {
  const [data, setData] = useState<PSReportResponse<PSBalanceItem> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [last, setLast] = useState<{ dateFrom: string; dateTo: string; departmentId: string; wfStep?: number } | null>(null);
  const search = useCallback(async (dateFrom: string, dateTo: string, departmentId = '', wfStep?: number) => {
    setLoading(true); setError(''); setData(null); setLast({ dateFrom, dateTo, departmentId, wfStep });
    try { const response = await fetchPSSummary(dateFrom, dateTo, departmentId, wfStep, token); setData({ ...response, items: Array.isArray(response.items) ? response.items : [] }); }
    catch (reason) { setError(apiErrorText(reason, 'โหลดรายงาน Print ของ PS ไม่สำเร็จ')); }
    finally { setLoading(false); }
  }, [token]);
  const retry = useCallback(() => { if (last) void search(last.dateFrom, last.dateTo, last.departmentId, last.wfStep); }, [last, search]);
  return { data, loading, error, search, retry };
}

export function usePSBalanceReport(token?: string) {
  const [data, setData] = useState<PSReportResponse<PSBalanceItem> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [last, setLast] = useState<{ year: number; month: number } | null>(null);
  const search = useCallback(async (year: number, month: number) => {
    setLoading(true); setError(''); setData(null); setLast({ year, month });
    try { const response = await fetchPSBalanceForm(year, month, token); setData({ ...response, items: Array.isArray(response.items) ? response.items : [] }); }
    catch (reason) { setError(apiErrorText(reason, 'โหลด Print Summary ของ PS ไม่สำเร็จ')); }
    finally { setLoading(false); }
  }, [token]);
  const retry = useCallback(() => { if (last) void search(last.year, last.month); }, [last, search]);
  return { data, loading, error, search, retry };
}

export function usePSBIT60057Report(token?: string) {
  const [data, setData] = useState<PSBIT60057Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [last, setLast] = useState<{ year: number; month: number } | null>(null);
  const search = useCallback(async (year: number, month: number) => {
    setLoading(true); setError(''); setData(null); setLast({ year, month });
    try { const response = await fetchPSBIT60057(year, month, token); setData({ ...response, items: response.items ?? [], breakdown: response.breakdown ?? [] }); }
    catch (reason) { setError(apiErrorText(reason, 'โหลดรายงานการขอราคาประจำเดือนไม่สำเร็จ')); }
    finally { setLoading(false); }
  }, [token]);
  const retry = useCallback(() => { if (last) void search(last.year, last.month); }, [last, search]);
  return { data, loading, error, search, retry };
}

export function usePSBIT61118Report(groupBy: 'quantity' | 'department' | 'month', token?: string) {
  const [data, setData] = useState<PSBIT61118Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [last, setLast] = useState<{ dateFrom: string; dateTo: string; rpId: string; rpDetailId: string } | null>(null);
  const search = useCallback(async (dateFrom: string, dateTo: string, rpId = '', rpDetailId = '') => {
    setLoading(true); setError(''); setData(null); setLast({ dateFrom, dateTo, rpId, rpDetailId });
    try { const response = await fetchPSBIT61118(groupBy, dateFrom, dateTo, rpId, rpDetailId, token); setData({ ...response, groups: response.groups ?? [], items: response.items ?? [] }); }
    catch (reason) { setError(apiErrorText(reason, 'โหลดรายงานใบขอราคาไม่สำเร็จ')); }
    finally { setLoading(false); }
  }, [groupBy, token]);
  const retry = useCallback(() => { if (last) void search(last.dateFrom, last.dateTo, last.rpId, last.rpDetailId); }, [last, search]);
  return { data, loading, error, search, retry };
}

export function usePSBIT61091Report(token?: string) {
  const [data, setData] = useState<PSBIT61091Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [last, setLast] = useState<{ dateFrom?: string; dateTo?: string } | null>(null);
  const search = useCallback(async (dateFrom?: string, dateTo?: string) => {
    setLoading(true); setError(''); setData(null); setLast({ dateFrom, dateTo });
    try { const response = await fetchPSBIT61091(dateFrom, dateTo, token); setData({ ...response, step2Items: response.step2Items ?? [], step3Items: response.step3Items ?? [] }); }
    catch (reason) { setError(apiErrorText(reason, 'โหลดรายงานการขอมาตรฐานขอราคาไม่สำเร็จ')); }
    finally { setLoading(false); }
  }, [token]);
  const retry = useCallback(() => { if (last) void search(last.dateFrom, last.dateTo); }, [last, search]);
  return { data, loading, error, search, retry };
}

export function usePSBIT63022Report(token?: string) {
  const [data, setData] = useState<PSBIT63022Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [last, setLast] = useState<{ dateFrom: string; dateTo: string } | null>(null);
  const search = useCallback(async (dateFrom: string, dateTo: string) => {
    setLoading(true); setError(''); setData(null); setLast({ dateFrom, dateTo });
    try { const response = await fetchPSBIT63022(dateFrom, dateTo, token); setData({ ...response, items: response.items ?? [], weekly: response.weekly ?? [] }); }
    catch (reason) { setError(apiErrorText(reason, 'โหลดรายงานใบขอราคาประจำเดือนไม่สำเร็จ')); }
    finally { setLoading(false); }
  }, [token]);
  const retry = useCallback(() => { if (last) void search(last.dateFrom, last.dateTo); }, [last, search]);
  return { data, loading, error, search, retry };
}
