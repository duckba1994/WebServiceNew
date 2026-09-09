import { useEffect, useState } from 'react';
import { DeptRequestDetail, DeptRequestModule, fetchDeptRequest } from '../api/deptRequest';

// ── ใบ GA / IM แบบเต็มฟอร์ม (GET /{module}Request/{docNo}) ─────
// ส่ง module = null เมื่อใบไม่ใช่ GA/IM → ไม่ยิง API
//
// ทำไมต้องยิงแยกจาก /Requests/{module}/{docNo}: เส้นกลางส่งมาแค่หัวใบชุดกลาง
// ส่วนรายการย่อย เช็คลิสต์เอกสารแนบ และ canEdit อยู่ในเส้นของฟอร์มเท่านั้น
//
// ⚠️ canEdit ของสองโมดูลนี้เป็น "แหล่งเดียว" ที่ตัดสินสิทธิ์แก้ไข — หน้าเว็บห้าม
// คำนวณเงื่อนไขเอง (guide §5.2) เพราะช่วงที่แก้ได้แคบกว่า PL มาก:
// ผู้แจ้งแก้ได้เฉพาะก่อน Mgr อนุมัติ · ขั้นรอรับเรื่องล็อกทั้งใบ · หลังรับเรื่องเป็นสิทธิ์
// ของแผนกปลายทางเท่านั้น (06 ของ GA, 18 ของ IM)
//
// error ไม่ทำให้จอพัง แต่ต้องบอกผู้ใช้ ไม่ใช่โชว์ตารางว่างเหมือนใบที่ไม่มีรายการ
export function useDeptRequest(
  module: DeptRequestModule | null,
  docNo: string | null,
  token?: string,
  refreshKey?: string | number | null
) {
  const [doc, setDoc] = useState<DeptRequestDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!module || !docNo) {
      setDoc(null);
      setError(null);
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    setError(null);

    fetchDeptRequest(module, docNo, token)
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
  }, [module, docNo, token, refreshKey]);

  return { doc, loading, error };
}
