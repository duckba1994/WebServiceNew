import React, { useMemo, useState } from 'react';
import { IconBell } from '@tabler/icons-react';
import { Layout } from '../components/layout/Layout';
import { RequestGrid, SummaryCardSpec } from '../components/items/RequestGrid';
import { StatusTabs } from './MyItems';
import { INCOMING_COLUMNS } from '../data/requestListData';
import { PHASE_META, phaseIndex } from '../data/requestPhase';
import { RequestAction, RequestListItem, RequestPhase, StatusFilter } from '../types/requestList';
import { useRequestList } from '../hooks/useRequestList';
import { useRequestAction } from '../hooks/useRequestAction';
import { ActionFieldValues } from '../data/requestActionFields';
import { useAuth } from '../context/AuthContext';

// ── เรื่องที่แจ้งเข้ามาที่แผนกตัวเอง — GET /Requests/incoming ────
// หน้านี้คือคิวงานจริงของแผนกปลายทาง: รับเรื่อง → ดำเนินการ → ปิดงาน
// ปุ่มแต่ละขั้นมาจาก item.availableActions ทั้งหมด ไม่มี hardcode ต่อขั้น
//
// รวมใบที่ยังไม่ถึงคิวเรา (ต้นทางยังไม่อนุมัติ) ด้วย → ใช้ onlyMyTurn คัดเฉพาะที่ต้องลงมือ
export function Inbox() {
  const { user } = useAuth();
  const [status, setStatus] = useState<StatusFilter>('Open');
  const [onlyMyTurn, setOnlyMyTurn] = useState(false);
  const [phase, setPhase] = useState<RequestPhase | null>(null);

  const { items, phaseSummary, totalCount, departId, loading, error, reload, applyItem } =
    useRequestList(
      'incoming',
      {
        module: 'IT',
        status,
        onlyMyTurn,
        phase: phase ? [phase] : undefined,
        sortBy: 'RequestDate',
        sortDir: 'Desc',
      },
      user?.token
    );

  const { run, pending, notice, dismissNotice } = useRequestAction(user?.token);

  // สำเร็จ → แทนแถวเดิมให้เห็นผลทันที แล้วโหลดใหม่ให้ยอดสรุปตรงกับของจริง
  const handleAction = async (
    item: RequestListItem,
    action: RequestAction,
    note: string,
    fields?: ActionFieldValues
  ) => {
    const res = await run(item, action, note, fields);
    if (res) applyItem(res.item);
    reload();
  };

  // แก้ไขข้อมูลใบสำเร็จ (ก่อนปลายทางรับงาน) → แทนแถวเดิมทันที
  // ไม่ต้อง reload: การแก้ข้อมูลไม่เลื่อนขั้น ยอดใน phaseSummary จึงไม่เปลี่ยน
  const handleEdited = (updated: RequestListItem) => applyItem(updated);

  // การ์ดสร้างจาก phaseSummary ที่ API ส่งมา — ยอดไม่ขยับตอนกรอง phase
  // จึงใช้เป็น badge ที่บอกความจริงได้แม้กำลังกรองอยู่
  const summaryCards = useMemo<SummaryCardSpec[]>(() => {
    const grandTotal = phaseSummary.reduce((sum, p) => sum + p.count, 0);
    const cards: SummaryCardSpec[] = [
      {
        key: 'all',
        label: 'ทั้งหมด',
        value: grandTotal,
        color: '#475569',
        bg: '#f1f5f9',
        active: phase === null,
        onClick: () => setPhase(null),
      },
    ];
    for (const p of [...phaseSummary].sort((a, b) => phaseIndex(a.phase) - phaseIndex(b.phase))) {
      const meta = PHASE_META[p.phase] ?? PHASE_META.other;
      cards.push({
        key: p.phase,
        label: p.phaseName || meta.short,
        value: p.count,
        color: meta.color,
        bg: meta.bg,
        active: phase === p.phase,
        onClick: () => setPhase((cur) => (cur === p.phase ? null : p.phase)),
      });
    }
    return cards;
  }, [phaseSummary, phase]);

  return (
    <Layout
      title="เรื่องแจ้งเข้ามา"
      subtitle={`Incoming Requests${departId ? ` — แผนก ${departId}` : ''}`}
    >
      <RequestGrid
        columns={INCOMING_COLUMNS}
        items={items}
        totalCount={totalCount}
        summaryCards={summaryCards}
        loading={loading}
        error={error}
        onReload={reload}
        onAction={handleAction}
        onEdited={handleEdited}
        actionPending={pending}
        notice={notice}
        onDismissNotice={dismissNotice}
        searchPlaceholder="ค้นหาเลขที่ / ผู้แจ้ง / รายละเอียด..."
        emptyText={
          onlyMyTurn
            ? 'ไม่มีงานที่ถึงคิวแผนกนี้ตอนนี้'
            : phase
            ? 'ไม่มีใบในจังหวะงานนี้'
            : 'ยังไม่มีเรื่องแจ้งเข้ามาที่แผนกนี้'
        }
        toolbar={
          <>
            <StatusTabs value={status} onChange={setStatus} />
            <button
              onClick={() => setOnlyMyTurn((v) => !v)}
              title="แสดงเฉพาะใบที่ขั้นตอนปัจจุบันเป็นของแผนกเรา"
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12.5px] font-semibold transition ${
                onlyMyTurn
                  ? 'border-amber-400 bg-amber-50 text-amber-700'
                  : 'border-gray-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <IconBell size={14} />
              เฉพาะคิวของเรา
            </button>
          </>
        }
      />
    </Layout>
  );
}
