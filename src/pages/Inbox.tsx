import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  // ตัวกรองเริ่มต้นรับจาก URL ได้ (หน้าภาพรวมลิงก์มา: /inbox?myturn=1, /inbox?phase=closed)
  // อ่านครั้งเดียวตอน mount แล้วปล่อยให้ state คุมต่อ
  const [searchParams] = useSearchParams();
  const urlPhase = (searchParams.get('phase') as RequestPhase | null) || null;
  // มาจากลิงก์ "ปิดงานแล้ว" ต้องเปิด status เป็น All ไม่งั้นค่าตั้งต้น Open จะกรองทิ้งหมด
  const [status, setStatus] = useState<StatusFilter>(urlPhase ? 'All' : 'Open');
  const [onlyMyTurn, setOnlyMyTurn] = useState(() => searchParams.get('myturn') === '1');
  const [phase, setPhase] = useState<RequestPhase | null>(urlPhase);

  // โมดูลของคิวนี้ = แผนกของคนที่ล็อกอิน ไม่ใช่ค่าคงที่ — ห้ามฮาร์ดโค้ด 'IT'
  // ไม่งั้นผู้ใช้แผนกอื่น (PL/HR/SV) จะเห็นคิวของ IT แล้วนึกว่าไม่มีงานเข้า
  // departmentShort ใช้ vocabulary เดียวกับ module ('IT'/'PL'/'HR'/'SV')
  const myModule = user?.departmentShort?.trim() ?? '';

  const { items, phaseSummary, totalCount, departId, loading, error, reload, applyItem } =
    useRequestList(
      'incoming',
      {
        module: myModule,
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
        color: 'var(--ph-other-fg)',
        bg: 'var(--ph-other-bg)',
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
      subtitle={`Incoming Requests${myModule ? ` — แผนก ${myModule}` : ''}${
        departId && departId !== myModule ? ` (${departId})` : ''
      }`}
    >
      <RequestGrid
        columns={INCOMING_COLUMNS}
        items={items}
        totalCount={totalCount}
        summaryCards={summaryCards}
        loading={loading}
        error={
          myModule
            ? error
            : 'ไม่พบรหัสแผนกของผู้ใช้ — ระบบไม่รู้ว่าจะดึงคิวงานของแผนกไหน กรุณาเข้าสู่ระบบใหม่'
        }
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
                  ? 'border-amber-400 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                  : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
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
