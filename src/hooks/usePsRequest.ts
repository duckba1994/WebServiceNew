import { useEffect, useState } from 'react';
import { fetchPsRequest, PsRequestDetail } from '../api/psRequest';
import { apiErrorText } from '../api/client';

export function usePsRequest(docNo: string, token?: string, refreshKey?: string) {
  const [doc, setDoc] = useState<PsRequestDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let alive = true;
    setDoc(null); setError(null);
    fetchPsRequest(docNo, token).then(value => { if (alive) setDoc(value); })
      .catch(e => { if (alive) setError(apiErrorText(e, 'โหลดใบแจ้งเรื่อง PS ไม่สำเร็จ')); });
    return () => { alive = false; };
  }, [docNo, token, refreshKey, revision]);
  return { doc, error, reload: () => setRevision(n => n + 1) };
}
