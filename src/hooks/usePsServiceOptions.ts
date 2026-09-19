import { useCallback, useEffect, useState } from 'react';
import { fetchPsActions, fetchPsWorkResults } from '../api/masterData';
import { fetchPsReportDetails, PsReportStatusOption } from '../api/psRequest';
import { apiErrorText } from '../api/client';

export function usePsServiceOptions(docNo: string, token?: string) {
  const [actions, setActions] = useState<string[]>([]);
  const [workResults, setWorkResults] = useState<string[]>([]);
  const [report, setReport] = useState<PsReportStatusOption | null>(null);
  const [errors, setErrors] = useState<{ actions?: string; workResults?: string; report?: string }>({});
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let alive = true;
    setLoading(true); setErrors({});
    Promise.allSettled([
      fetchPsActions(token), fetchPsWorkResults(token), fetchPsReportDetails(docNo, token),
    ]).then(([a, w, r]) => {
      if (!alive) return;
      const next: typeof errors = {};
      if (a.status === 'fulfilled') setActions(a.value); else { setActions([]); next.actions = apiErrorText(a.reason, 'โหลดรายการดำเนินการโดยไม่สำเร็จ'); }
      if (w.status === 'fulfilled') setWorkResults(w.value); else { setWorkResults([]); next.workResults = apiErrorText(w.reason, 'โหลดรายการผลการดำเนินการไม่สำเร็จ'); }
      if (r.status === 'fulfilled') setReport(r.value); else { setReport(null); next.report = apiErrorText(r.reason, 'โหลด Status งานค้างไม่สำเร็จ'); }
      setErrors(next); setLoading(false);
    });
    return () => { alive = false; };
  }, [docNo, token, revision]);
  const reload = useCallback(() => setRevision(value => value + 1), []);
  return { actions, workResults, report, errors, loading, reload };
}
