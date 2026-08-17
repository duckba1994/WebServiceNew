import { useCallback, useEffect, useState } from 'react';
import { fetchDepartments } from '../api/masterData';
import { DepartmentApi } from '../types/masterData';

// ── โหลดรายชื่อแผนกจาก GET /MasterData/departments ───────────
// ใช้เป็นตัวเลือกแผนกปลายทางของใบแจ้งเรื่อง (ต้องเลือกจาก master เท่านั้น)
export function useDepartments(token?: string) {
  const [departments, setDepartments] = useState<DepartmentApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    fetchDepartments(token)
      .then((rows) => {
        if (!alive) return;
        setDepartments(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (!alive) return;
        setDepartments([]);
        setError('โหลดรายชื่อแผนกไม่สำเร็จ');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [token, reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  return { departments, loading, error, reload };
}
