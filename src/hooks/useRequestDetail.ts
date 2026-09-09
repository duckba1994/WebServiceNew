import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchRequestDetail } from '../api/requests';
import { RequestDetailResponse, RequestListItem } from '../types/requestList';

// ── โหลดใบเต็ม 1 ใบ (item + logs + workflow) ตอนเปิดหน้ารายละเอียด ──
// ส่ง module/docNo = null เมื่อยังไม่มีใบเปิดอยู่ (modal ปิด) → ไม่ยิง API
//
// เส้นนี้ (GET /Requests/{module}/{docNo}) อาจยังไม่พร้อมที่ backend —
// ถ้า error หน้ารายละเอียดจะ fallback ไปใช้ข้อมูลจาก list ที่มีอยู่แล้ว
// (timeline จาก resolution) ไม่ทำให้จอพัง แค่ยังไม่มีประวัติละเอียด
// refreshKey — เปลี่ยนค่าเมื่อไรก็โหลดใบใหม่ (เช่นส่ง item.updatedDate มา
// หลังกด action ใบขยับ updatedDate เปลี่ยน → ดึง logs/resolution/steps ล่าสุด)
export function useRequestDetail(
  module: string | null,
  docNo: string | null,
  token?: string,
  refreshKey?: string | number | null
) {
  const version = useRef(0);
  const [detail, setDetail] = useState<RequestDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!module || !docNo) {
      setDetail(null);
      setError(null);
      setLoading(false);
      return;
    }
    let alive = true;
    const requestVersion = ++version.current;
    setLoading(true);
    setError(null);
    setDetail(null);

    fetchRequestDetail(module, docNo, token)
      .then((d) => {
        if (alive && requestVersion === version.current) setDetail(d);
      })
      .catch((e: unknown) => {
        if (!alive || requestVersion !== version.current) return;
        const msg = e instanceof Error ? e.message : '';
        // 404 = API หาใบไม่เจอ · apiGet ไม่ได้แกะ message จาก body มาให้ (ได้แค่รหัส HTTP)
        // ส่วน apiSend แปลข้อความ debug ภาษาอังกฤษให้แล้ว — รับไว้ทั้งสองทาง
        if (/HTTP 404/.test(msg) || /was not found|ไม่พบใบแจ้งเรื่อง/i.test(msg)) {
          setError('ไม่พบใบแจ้งเรื่องนี้ในระบบ');
          return;
        }
        setError(msg || 'โหลดรายละเอียดใบไม่สำเร็จ');
      })
      .finally(() => {
        if (alive && requestVersion === version.current) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [module, docNo, token, refreshKey]);

  const applyItem = useCallback((item: RequestListItem) => {
    ++version.current; // A POST result is newer than any GET already in flight.
    setDetail((previous) => ({
      item, logs: previous?.logs ?? null,
      workflow: previous?.workflow ?? null, attachments: previous?.attachments ?? null,
    }));
    setLoading(false);
    setError(null);
  }, []);
  return { detail, loading, error, applyItem };
}
