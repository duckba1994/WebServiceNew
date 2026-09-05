import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { IconBell } from '@tabler/icons-react';
import { Layout } from '../components/layout/Layout';
import { RequestGrid, SummaryCardSpec } from '../components/items/RequestGrid';
import { OUTGOING_COLUMNS, STATUS_FILTERS } from '../data/requestListData';
import { PHASE_META, isRequesterSide, phaseIndex } from '../data/requestPhase';
import { RequestAction, RequestListItem, RequestPhase, StatusFilter } from '../types/requestList';
import { useRequestList } from '../hooks/useRequestList';
import { useRequestAction } from '../hooks/useRequestAction';
import { DateRangeFilter } from '../components/ui/DateRangeFilter';
import { DateRangeKey, DateRangeValue, isRangeInvalid, rangeOf } from '../data/dateRange';
import { ActionFieldValues } from '../data/requestActionFields';
import { useAuth } from '../context/AuthContext';

// ── เรื่องที่แผนกเราแจ้งออกไป ─────────────────────────────────
// แผนกหนึ่งแจ้งไปได้ทุกแผนก และแต่ละแผนกมี workflow 2–6 ขั้น รหัสสถานะคนละชุด
// จึงเรียก /outgoing โดยไม่ระบุ module (API v2 รวมทุกโมดูลให้) แล้วนับด้วย
// "จังหวะงาน" (phase) ที่ API map มาจาก WFStatus ให้แล้ว
//
// ขอบเขตข้อมูล (แผนก) API กรองจาก token ให้เอง หน้าเว็บไม่ส่ง departid
//
// ช่วงวันที่: ส่ง dateFrom/dateTo ไปกรองที่ API (ตั้งต้น "เดือนนี้") — เมื่อก่อน
// ดึงใบทั้งหมดมาแล้วค้นหา/แบ่งหน้าที่ browser ซึ่งโตขึ้นเรื่อย ๆ ตามจำนวนใบ
// ⚠️ phaseSummary/totalCount จึงเป็นยอด "ในช่วงที่เลือก" ไม่ใช่ยอดตลอดกาล
export function MyItems() {
  const { user } = useAuth();
  // ตัวกรองเริ่มต้นรับจาก URL ได้ (หน้าภาพรวมลิงก์มา: /my?ourturn=1, /my?phase=in_progress)
  // อ่านครั้งเดียวตอน mount แล้วปล่อยให้ state คุมต่อ — ไม่งั้นผู้ใช้กดเปลี่ยนตัวกรอง
  // แล้ว URL เดิมจะดึงกลับไปค่าเดิมทุกครั้งที่ re-render
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<StatusFilter>('All');
  const [phase, setPhase] = useState<RequestPhase | null>(
    () => (searchParams.get('phase') as RequestPhase | null) || null
  );
  const [ourTurnOnly, setOurTurnOnly] = useState(() => searchParams.get('ourturn') === '1');
  // ช่วงวันที่แจ้ง — กรองที่ API (dateFrom/dateTo) ไม่ใช่กรองในตาราง
  // ตั้งต้น "เดือนนี้" (วันที่ 1 → สิ้นเดือน): ดึงทั้งฐานมาทุกครั้งไม่ไหวเมื่อใบสะสมมากขึ้น
  // ใบเก่ากว่านั้นยังหาได้ด้วยปุ่ม "3 เดือน" / "ปีนี้" / "ทั้งหมด" / กำหนดเอง
  const [rangeKey, setRangeKey] = useState<DateRangeKey>('month');
  const [range, setRange] = useState<DateRangeValue>(() => rangeOf('month'));
  const rangeInvalid = isRangeInvalid(range);

  // กรอง phase ที่ backend — phaseSummary ยังคืนยอดเต็มทุกครั้ง
  // การ์ดใบอื่นจึงยังโชว์ตัวเลขจริงแม้กำลังกรองอยู่
  const { items, phaseSummary, totalCount, departId, loading, error, reload, applyItem } =
    useRequestList(
      'outgoing',
      {
        status,
        phase: phase ? [phase] : undefined,
        // ช่วงกลับหัว (จาก > ถึง) ไม่ส่งไป — API จะคืนศูนย์รายการเงียบ ๆ
        // ปล่อยให้ตารางค้างชุดเดิมไว้ แล้วเตือนด้วยป้ายแดงในตัวกรองแทน
        dateFrom: rangeInvalid ? undefined : range.from || undefined,
        dateTo: rangeInvalid ? undefined : range.to || undefined,
        sortBy: 'RequestDate',
        sortDir: 'Desc',
      },
      user?.token
    );

  const { run, pending, notice, dismissNotice } = useRequestAction(user?.token);

  // สำเร็จ → แทนแถวเดิมให้เห็นผลทันที แล้วโหลดใหม่เพื่ออัปเดตยอดในการ์ด
  // 409 → ข้อมูลบนจอไม่ตรงกับของจริงแล้ว (มีคนกดไปก่อน) ต้องโหลดใหม่เหมือนกัน
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

  const ourTurnCount = useMemo(() => items.filter(isRequesterSide).length, [items]);

  // การ์ดสร้างจาก phaseSummary ที่ API ส่งมา ไม่ใช่รายการ phase ที่ฝังไว้
  // → แผนกที่ไม่มีขั้นนั้นจะไม่มีการ์ดโผล่มาให้รก
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
    const sorted = [...phaseSummary].sort((a, b) => phaseIndex(a.phase) - phaseIndex(b.phase));
    for (const p of sorted) {
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

  const visible = useMemo(
    () => (ourTurnOnly ? items.filter(isRequesterSide) : items),
    [items, ourTurnOnly]
  );

  return (
    <Layout
      title="เรื่องที่แจ้งออกไป"
      subtitle={`Outgoing Requests${departId ? ` — แผนก ${departId}` : ''}`}
    >
      <RequestGrid
        columns={OUTGOING_COLUMNS}
        items={visible}
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
        searchPlaceholder="ค้นหาเลขที่ / แผนก / ผู้แจ้ง / รายละเอียด..."
        emptyText={
          ourTurnOnly
            ? 'ไม่มีใบที่รอแผนกเราลงมือตอนนี้'
            : phase
            ? 'ไม่มีใบในจังหวะงานนี้'
            : range.from || range.to
            ? 'ไม่มีเรื่องที่แจ้งออกไปในช่วงวันที่นี้ — ลองขยายช่วงวันที่'
            : 'ยังไม่มีเรื่องที่แผนกนี้แจ้งออกไป'
        }
        toolbar={
          <>
            <StatusTabs value={status} onChange={setStatus} />
            <DateRangeFilter
              presetKey={rangeKey}
              value={range}
              onChange={(key, v) => {
                setRangeKey(key);
                setRange(v);
              }}
            />
            <button
              onClick={() => setOurTurnOnly((v) => !v)}
              title="ใบที่ขั้นตอนปัจจุบันวนกลับมาที่แผนกผู้แจ้ง — งานเสร็จแล้วรอเรากดต่อ"
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12.5px] font-semibold transition ${
                ourTurnOnly
                  ? 'border-amber-400 bg-amber-50 text-amber-700'
                  : 'border-gray-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <IconBell size={14} />
              รอเราลงมือ
              {ourTurnCount > 0 && (
                <span className="mono rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {ourTurnCount}
                </span>
              )}
            </button>
          </>
        }
      />
    </Layout>
  );
}

// ตัวกรองสถานะ — ส่งไปให้ API (ไม่ใช่กรองในตาราง) เพื่อลดขนาดข้อมูลที่ดึงมา
export function StatusTabs({
  value,
  onChange,
}: {
  value: StatusFilter;
  onChange: (v: StatusFilter) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11.5px] font-semibold text-gray-500">สถานะ</span>
      <div className="flex gap-0.5 rounded-lg border border-gray-200 bg-[#eef1f6] p-1">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s.key}
            onClick={() => onChange(s.key)}
            className={`rounded-md px-3 py-1.5 text-[12.5px] font-semibold transition ${
              value === s.key ? 'bg-[#0b1220] text-white shadow-sm' : 'text-slate-600 hover:text-gray-900'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
