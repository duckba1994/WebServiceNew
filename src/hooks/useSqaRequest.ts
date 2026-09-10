import { useEffect, useState } from 'react';
import { fetchSqaRequest, SqaRequestDetail } from '../api/sqaRequest';

export function useSqaRequest(docNo: string | null, token?: string, refreshKey?: string | number | null) {
  const [doc, setDoc] = useState<SqaRequestDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!docNo) {
      setDoc(null);
      setError(null);
      return;
    }
    let alive = true;
    setLoading(true);
    setError(null);
    fetchSqaRequest(docNo, token)
      .then((value) => alive && setDoc(value))
      .catch((e: unknown) => alive && setError(e instanceof Error ? e.message : 'โหลดใบ SQA ไม่สำเร็จ'))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [docNo, token, refreshKey]);

  return { doc, loading, error };
}
