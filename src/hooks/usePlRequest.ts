import { useEffect, useState } from 'react';
import { PlRequestDetail, fetchPlRequest } from '../api/plRequest';

// ── ใบ PL แบบเต็มฟอร์ม (GET /PLRequest/{docNo}) ────────────────
// ส่ง docNo = null เมื่อยังไม่มีใบเปิดอยู่ / ใบไม่ใช่โมดูล PL → ไม่ยิง API
//
// ทำไมต้องยิงแยกจาก /Requests/PL/{docNo}: เส้นกลางส่งมาแค่หัวใบชุดกลาง
// (+ type/requestType/planDate) ส่วนเช็คลิสต์เอกสารแนบ / รายการย่อย / canEdit
// อยู่ในเส้นของฟอร์ม PL เท่านั้น
//
// error ไม่ทำให้จอพัง แต่ต้องบอกผู้ใช้ ไม่ใช่โชว์ตารางว่างเหมือนใบที่ไม่มีรายการ
export function usePlRequest(docNo: string | null, token?: string, refreshKey?: string | number | null) {
  const [doc, setDoc] = useState<PlRequestDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!docNo) {
      setDoc(null);
      setError(null);
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    setError(null);

    fetchPlRequest(docNo, token)
      .then((d) => {
        if (alive) setDoc(d);
      })
      .catch((e: unknown) => {
        if (alive) {
          setDoc(null);
          setError(e instanceof Error ? e.message : 'โหลดข้อมูลใบไม่สำเร็จ');
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [docNo, token, refreshKey]);

  return { doc, loading, error };
}
