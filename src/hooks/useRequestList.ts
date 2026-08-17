import { useCallback, useEffect, useState } from 'react';
import { fetchRequestList, RequestListQuery } from '../api/requests';
import {
  RequestDirection,
  RequestListItem,
  RequestStatusSummary,
} from '../types/requestList';

// ── โหลดรายการใบแจ้งเรื่องจาก Requests API ────────────────────
// การกรองแผนกทำที่ backend จาก token — หน้าเว็บส่งแค่ module/status/onlyMyTurn
// API ไม่มี pagination: คืนมาทั้งหมดครั้งเดียว แล้วแบ่งหน้า/ค้นหาฝั่ง frontend
export function useRequestList(
  direction: RequestDirection,
  query: RequestListQuery,
  token?: string
) {
  const [items, setItems] = useState<RequestListItem[]>([]);
  const [summary, setSummary] = useState<RequestStatusSummary[]>([]);
  const [departId, setDepartId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  // แตกออกเป็นค่าเดี่ยว ๆ เพื่อไม่ให้ effect วิ่งซ้ำทุก render จาก object ใหม่
  const { module, status, onlyMyTurn, dateFrom, dateTo, sortBy, sortDir } = query;

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    fetchRequestList(direction, { module, status, onlyMyTurn, dateFrom, dateTo, sortBy, sortDir }, token)
      .then((res) => {
        if (!alive) return;
        setItems(res.items ?? []);
        setSummary(res.summary ?? []);
        setDepartId(res.departId ?? '');
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setItems([]);
        setSummary([]);
        setError(e instanceof Error ? e.message : 'โหลดรายการใบแจ้งเรื่องไม่สำเร็จ');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [direction, module, status, onlyMyTurn, dateFrom, dateTo, sortBy, sortDir, token, reloadKey]);

  return { items, summary, departId, loading, error, reload };
}
