import { useEffect, useState } from 'react';
import { fetchRequestModules } from '../api/requests';
import { RequestModule } from '../types/requestList';

// ── โมดูล (แผนกปลายทาง) ที่ API รองรับ ────────────────────────
// ใช้ตรวจว่าแผนกของผู้ใช้ "เป็นแผนกปลายทาง" ไหม ก่อนจะเรียก /Requests/incoming
// (incoming ที่ส่ง module ที่ไม่รู้จัก = 400 — แผนกอย่าง Sales ที่แจ้งออกอย่างเดียว
//  จะได้ไม่เจอ error ค้างบนหน้าแรก แค่ซ่อนบล็อกงานเข้าไป)
//
// ไม่ขอ workflow มาด้วย (includeWorkflow=false) — ที่นี่ต้องการแค่รายชื่อ code
export function useRequestModules(token?: string) {
  const [modules, setModules] = useState<RequestModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    fetchRequestModules(token)
      .then((res) => {
        if (alive) setModules(res ?? []);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setModules([]);
        setError(e instanceof Error ? e.message : 'โหลดรายชื่อแผนกปลายทางไม่สำเร็จ');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [token]);

  // มี code นี้ในระบบไหม — เทียบแบบไม่สนตัวพิมพ์ (departmentShort ใน DB เป็น nchar)
  const has = (code: string): boolean =>
    !!code && modules.some((m) => m.code.trim().toUpperCase() === code.trim().toUpperCase());

  return { modules, has, loading, error };
}
