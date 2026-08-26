import { useEffect, useState } from 'react';
import { PlRequestLine, fetchPlRequestLines } from '../api/plRequest';

// ── รายการย่อยของใบ PL (GET /PLRequest/{docNo}/lines) ──────────
// ส่ง docNo = null เมื่อยังไม่มีใบเปิดอยู่ / ใบไม่ใช่โมดูล PL → ไม่ยิง API
//
// /Requests/PL/{docNo} ไม่ได้ส่ง lines มาด้วย จึงต้องดึงแยกเส้นนี้
// error ไม่ทำให้จอพัง แต่ต้องบอกผู้ใช้ ไม่ใช่โชว์ตารางว่างเหมือนใบที่ไม่มีรายการ
export function usePlRequestLines(docNo: string | null, token?: string, refreshKey?: string | number | null) {
  const [lines, setLines] = useState<PlRequestLine[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!docNo) {
      setLines(null);
      setError(null);
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    setError(null);

    fetchPlRequestLines(docNo, token)
      .then((rows) => {
        if (alive) setLines(rows);
      })
      .catch((e: unknown) => {
        if (alive) {
          setLines(null);
          setError(e instanceof Error ? e.message : 'โหลดรายการที่ขอไม่สำเร็จ');
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [docNo, token, refreshKey]);

  return { lines, loading, error };
}
