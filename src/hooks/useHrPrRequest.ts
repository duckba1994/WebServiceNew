import { useEffect, useState } from 'react';
import { HrPrRequestDetail, fetchHrPrRequest } from '../api/hrPrRequest';

// ── ค่าดิบของใบ HR-PR — GET /HRPRRequest/{docNo} ────────────────
// แหล่งเดียวที่ให้ canEdit / position / reference / lines ของใบ
// (เส้นกลาง /Requests/HR_PR/{docNo} ไม่ได้ส่งสามอย่างหลังมาครบ)
export function useHrPrRequest(docNo: string | null, token?: string, refreshKey?: string | number | null) {
  const [doc, setDoc] = useState<HrPrRequestDetail | null>(null);
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
    fetchHrPrRequest(docNo, token)
      .then((value) => alive && setDoc(value))
      .catch((e: unknown) => alive && setError(e instanceof Error ? e.message : 'โหลดใบ HR-PR ไม่สำเร็จ'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [docNo, token, refreshKey]);

  return { doc, loading, error };
}
