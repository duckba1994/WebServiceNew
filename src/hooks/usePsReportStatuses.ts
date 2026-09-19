import { useEffect, useState } from 'react';
import { fetchPsReportStatuses, PsReportStatusOption } from '../api/psRequest';
import { apiErrorText } from '../api/client';

export function usePsReportStatuses(token?: string) {
  const [rows, setRows] = useState<PsReportStatusOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let alive = true;
    setRows([]); setLoading(true); setError(null);
    fetchPsReportStatuses(token).then(value => { if (alive) setRows(value); })
      .catch(e => { if (alive) setError(apiErrorText(e, 'โหลดสถานะรายงาน PS ไม่สำเร็จ')); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [token, revision]);
  return { rows, loading, error, reload: () => setRevision(n => n + 1) };
}
