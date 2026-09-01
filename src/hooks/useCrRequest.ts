import { useEffect, useState } from 'react';
import { CrRequestDetail, fetchCrRequest } from '../api/crRequest';

// ── ใบ CR แบบค่าดิบ (GET /CRRequest/{docNo}) ───────────────────
// ส่ง docNo = null เมื่อไม่มีใบเปิดอยู่ / ใบไม่ใช่โมดูล CR → ไม่ยิง API
//
// ทำไมต้องยิงแยกจาก /Requests/CR/{docNo}: เส้นกลางรวม requestType กับ
// requestSubType เป็นข้อความเดียว ("ใบเสนอราคา / แก้ไขเอกสาร") ผูก dropdown ไม่ได้
// เส้นนี้คืนค่าดิบแยกช่อง + canEdit ที่ backend คำนวณให้
// (ดู CR-create-frontend-guide.md §7)
//
// error ไม่ทำให้จอพัง แต่ต้องบอกผู้ใช้ ไม่ใช่โชว์ฟอร์มว่างเหมือนใบที่ไม่มีข้อมูล
export function useCrRequest(docNo: string | null, token?: string, refreshKey?: string | number | null) {
  const [doc, setDoc] = useState<CrRequestDetail | null>(null);
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

    fetchCrRequest(docNo, token)
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
