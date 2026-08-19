import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchRequestList, RequestListQuery } from '../api/requests';
import {
  RequestDirection,
  RequestListItem,
  RequestPaging,
  RequestPhaseSummary,
  RequestStatusSummary,
  RequestWorkflow,
} from '../types/requestList';

// ── โหลดรายการใบแจ้งเรื่องจาก Requests API v2 ──────────────────
// การกรองแผนกทำที่ backend จาก token — หน้าเว็บส่งแค่ module/status/phase/onlyMyTurn
//
// outgoing: ไม่ส่ง module = รวมทุกโมดูลที่แผนกนี้แจ้งออกไป (workflow จะเป็น null)
// incoming: ต้องส่ง module เสมอ ไม่งั้น 400
//
// ไม่ส่ง page = API คืนทั้งหมดครั้งเดียว แล้วแบ่งหน้า/ค้นหาที่ฝั่งนี้
export function useRequestList(
  direction: RequestDirection,
  query: RequestListQuery,
  token?: string
) {
  const [items, setItems] = useState<RequestListItem[]>([]);
  const [summary, setSummary] = useState<RequestStatusSummary[]>([]);
  const [phaseSummary, setPhaseSummary] = useState<RequestPhaseSummary[]>([]);
  const [workflow, setWorkflow] = useState<RequestWorkflow | null>(null);
  const [paging, setPaging] = useState<RequestPaging | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [departId, setDepartId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  // แทนแถวเดียวด้วยตัวที่ action endpoint คืนมา — ผู้ใช้เห็นผลทันทีโดยไม่ต้องรอโหลดใหม่
  // (ยอดในการ์ด KPI ยังต้อง reload เพราะ phaseSummary คำนวณที่ backend)
  // คีย์ต้องเป็น module + docNo เพราะ docNo ซ้ำข้ามแผนกได้
  const applyItem = useCallback((next: RequestListItem) => {
    setItems((prev) =>
      prev.map((r) => (r.module === next.module && r.docNo === next.docNo ? next : r))
    );
  }, []);

  // แตกออกเป็นค่าเดี่ยว ๆ เพื่อไม่ให้ effect วิ่งซ้ำทุก render จาก object ใหม่
  const { module, status, onlyMyTurn, dateFrom, dateTo, sortBy, sortDir, page, pageSize } = query;
  // phase เป็น array — เทียบด้วยสตริงกัน reference ใหม่ทุก render
  const phaseKey = (query.phase ?? []).join(',');
  const phase = useMemo(() => (phaseKey ? phaseKey.split(',') : []), [phaseKey]) as RequestListQuery['phase'];

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    fetchRequestList(
      direction,
      { module, status, onlyMyTurn, phase, dateFrom, dateTo, sortBy, sortDir, page, pageSize },
      token
    )
      .then((res) => {
        if (!alive) return;
        setItems(res.items ?? []);
        setSummary(res.summary ?? []);
        setPhaseSummary(res.phaseSummary ?? []);
        setWorkflow(res.workflow ?? null);
        setPaging(res.paging ?? null);
        setTotalCount(res.totalCount ?? 0);
        setDepartId(res.departId ?? '');
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setItems([]);
        setSummary([]);
        setPhaseSummary([]);
        setWorkflow(null);
        setPaging(null);
        setTotalCount(0);
        setError(e instanceof Error ? e.message : 'โหลดรายการใบแจ้งเรื่องไม่สำเร็จ');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [direction, module, status, onlyMyTurn, phase, dateFrom, dateTo, sortBy, sortDir, page, pageSize, token, reloadKey]);

  return { items, summary, phaseSummary, workflow, paging, totalCount, departId, loading, error, reload, applyItem };
}
