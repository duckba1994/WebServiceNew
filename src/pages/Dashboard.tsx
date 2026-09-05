import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  IconAlertTriangle,
  IconArrowRight,
  IconChecks,
  IconInbox,
  IconPlus,
  IconRefresh,
} from '@tabler/icons-react';
import { Layout } from '../components/layout/Layout';
import { RequestDetailModal } from '../components/items/RequestDetailModal';
import { RequestActionDialog } from '../components/items/RequestActionDialog';
import { useAuth } from '../context/AuthContext';
import { useRequestList } from '../hooks/useRequestList';
import { useRequestModules } from '../hooks/useRequestModules';
import { useRequestAction } from '../hooks/useRequestAction';
import { PHASE_META, phaseIndex, phaseLabel, phaseOf } from '../data/requestPhase';
import { TODO_ORIGIN_META, TodoRow, buildTodoRows, totalOf } from '../data/dashboardData';
import { fmtDate } from '../data/requestListData';
import { ActionFieldValues } from '../data/requestActionFields';
import { rangeOf, rangeText } from '../data/dateRange';
import { RequestAction, RequestListItem, RequestPhase, RequestPhaseSummary } from '../types/requestList';

// ── หน้าภาพรวม — "งานที่แผนกเราต้องทำ" ──────────────────────────
// ไม่ใช่หน้ารายงาน: ทุกบล็อกต้องคลิกไปทำงานต่อได้ ตัวเลขที่ดูแล้วทำอะไรไม่ได้
// ไม่ควรอยู่ที่นี่ (per user decision, 5 ก.ย. 2026 — เลิกใช้ dashboard เครื่องจักร
// ซึ่งเป็น mock ล้วนและคนละโดเมนกับระบบใบรับเรื่อง ย้ายไป /resources)
//
// ลำดับความสำคัญ: งานที่รอเราลงมือ → คิวงานเข้าของแผนก → (ท้ายสุด) เรื่องที่แจ้งออกไป
//
// ยิง 2 เส้น ทั้งคู่กรองด้วยช่วง "เดือนนี้" เหมือนหน้า /my:
//   /Requests/incoming?module={แผนกเรา}  ← คิวงานของแผนก (ต้องมี module ไม่งั้น 400)
//   /Requests/outgoing                   ← เอามาเฉพาะใบที่วนกลับมาหาเรา
export function Dashboard() {
  const { user } = useAuth();
  // ใบที่กำลังเปิดดู — เก็บเป็นคีย์ (module::docNo) ไม่ใช่ตัว object
  // เพราะพอ reload แล้ว object เป็นตัวใหม่ modal ต้องเกาะกับใบเดิมให้ได้
  const [viewKey, setViewKey] = useState<string | null>(null);
  // ใบ + ปุ่มที่รอยืนยัน — ทุก action ย้อนกลับไม่ได้ จึงต้องถามก่อนเสมอ
  const [confirm, setConfirm] = useState<{ item: RequestListItem; action: RequestAction } | null>(
    null
  );

  // ช่วงเดือนปัจจุบัน — คิดครั้งเดียวต่อการเปิดหน้า (ข้ามวันแล้วกดรีเฟรชได้ค่าใหม่)
  const range = useMemo(() => rangeOf('month'), []);

  // โมดูลของแผนกตัวเอง — vocabulary เดียวกับ module ('IT'/'PL'/'CR'…)
  // ห้ามฮาร์ดโค้ด ไม่งั้นทุกแผนกจะเห็นคิวของ IT (เหมือนที่ Inbox.tsx ทำ)
  const myModule = user?.departmentShort?.trim() ?? '';
  const {
    has: hasModule,
    loading: modulesLoading,
    error: modulesError,
  } = useRequestModules(user?.token);

  // แผนกที่ไม่ได้เป็นปลายทาง (แจ้งออกอย่างเดียว) ไม่มีคิวงานเข้า — ไม่ต้องยิง
  const isTargetDept = hasModule(myModule);

  const incoming = useRequestList(
    'incoming',
    {
      module: myModule,
      status: 'All', // ต้อง All ไม่งั้นการ์ด "ปิดงานแล้ว" เป็น 0 ตลอด
      dateFrom: range.from,
      dateTo: range.to,
      sortBy: 'RequestDate',
      sortDir: 'Desc',
    },
    user?.token,
    isTargetDept
  );

  const outgoing = useRequestList(
    'outgoing',
    { status: 'All', dateFrom: range.from, dateTo: range.to, sortBy: 'RequestDate', sortDir: 'Desc' },
    user?.token
  );

  const todo = useMemo(
    () => buildTodoRows(incoming.items, outgoing.items),
    [incoming.items, outgoing.items]
  );

  const outgoingWaitingUs = useMemo(
    () => todo.filter((r) => r.origin === 'outgoing').length,
    [todo]
  );
  const myTurnCount = useMemo(
    () => incoming.items.filter((r) => r.isMyTurn).length,
    [incoming.items]
  );

  const loading = modulesLoading || incoming.loading || outgoing.loading;
  const error = incoming.error || outgoing.error || modulesError;

  const reload = () => {
    incoming.reload();
    outgoing.reload();
  };

  // ใบที่เปิดอยู่ — หาใหม่ทุกครั้งจาก rows ปัจจุบัน ข้อมูลใน modal จะได้สดเสมอ
  // ใบที่หลุดจากรายการงานค้าง (กดจนไม่ใช่คิวเราแล้ว) → view เป็น null แล้ว modal ปิดเอง
  const view = useMemo(() => todo.find((r) => r.key === viewKey)?.item ?? null, [todo, viewKey]);

  const { run, pending: actionPending, notice, dismissNotice } = useRequestAction(user?.token);

  // ใบใบเดียวกันอาจอยู่ทั้ง 2 ลิสต์ (แผนกแจ้งหาตัวเอง) — applyItem ทั้งคู่
  // ตัวที่ไม่มีใบนี้จะไม่มีอะไรเปลี่ยน แล้วค่อย reload เพราะ phaseSummary คิดที่ backend
  const handleAction = async (
    item: RequestListItem,
    action: RequestAction,
    note: string,
    fields?: ActionFieldValues
  ) => {
    const res = await run(item, action, note, fields);
    if (res) {
      incoming.applyItem(res.item);
      outgoing.applyItem(res.item);
    }
    reload();
  };

  return (
    <Layout title="หน้าหลัก" subtitle="งานที่แผนกเราต้องทำ">
      <div className="flex flex-col gap-4">
        {/* ===== แถบกำกับหน้า ===== */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0">
            <div className="truncate text-[15px] font-bold text-gray-800">
              สวัสดี {user?.name || user?.username || 'ผู้ใช้งาน'}
            </div>
            <div className="truncate text-[12.5px] text-gray-500">
              {user?.departmentName || user?.departid || 'ไม่ทราบแผนก'}
              {myModule && <span className="mono ml-1.5 text-gray-400">({myModule})</span>}
            </div>
          </div>

          <span className="mono ml-auto rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-500">
            เดือนนี้ · {rangeText(range)}
          </span>
          <button
            onClick={reload}
            disabled={loading}
            title="โหลดข้อมูลใหม่"
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[12.5px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <IconRefresh size={14} className={loading ? 'animate-spin' : ''} />
            รีเฟรช
          </button>
          <Link
            to="/create"
            className="flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-[12.5px] font-semibold text-white shadow-sm transition hover:brightness-110"
          >
            <IconPlus size={15} />
            เปิดใบรับเรื่องใหม่
          </Link>
        </div>

        {error && (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
            <IconAlertTriangle size={16} className="shrink-0" />
            <span className="min-w-0 flex-1">{error}</span>
            <button
              onClick={reload}
              className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-[12.5px] font-semibold text-red-700 transition hover:bg-red-50"
            >
              ลองใหม่
            </button>
          </div>
        )}

        {/* ===== คิวงานที่แจ้งเข้ามาที่แผนกเรา (การ์ดสรุปอยู่บน ตารางงานค้างอยู่ล่าง) ===== */}
        {isTargetDept ? (
          <IncomingSection
            module={myModule}
            summary={incoming.phaseSummary}
            myTurnCount={myTurnCount}
            loading={incoming.loading}
          />
        ) : (
          !modulesLoading && (
            <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 text-[13px] text-gray-500 shadow-sm">
              แผนกนี้ไม่ได้เป็นแผนกปลายทางในระบบใบรับเรื่อง จึงไม่มีคิวงานที่แจ้งเข้ามา
            </div>
          )
        )}

        {/* ===== งานที่รอแผนกเราลงมือ ===== */}
        <TodoSection
          rows={todo}
          loading={loading}
          outgoingWaitingUs={outgoingWaitingUs}
          onOpen={(r) => setViewKey(r.key)}
        />

        {/* ===== เรื่องที่แจ้งออกไป (ท้ายสุด — เป็นข้อมูลติดตาม ไม่ใช่งานที่ต้องทำ) ===== */}
        <OutgoingStrip
          summary={outgoing.phaseSummary}
          waitingUs={outgoingWaitingUs}
          loading={outgoing.loading}
        />
      </div>

      {/* คลิกแถวในตาราง = เปิดหน้ารายละเอียดแบบ stepper ตัวเดียวกับในหน้ารายการ
          (ทุก action ต้องกดจากในนี้ ไม่มีปุ่มลัดในแถว — คนอนุมัติต้องเห็นก่อนว่าขออะไรมา) */}
      {view && (
        <RequestDetailModal
          item={view}
          onClose={() => setViewKey(null)}
          onPickAction={(action) => setConfirm({ item: view, action })}
          // เปิดการแก้ไขใบให้เหมือนหน้ารายการ ไม่งั้นเปิดจากหน้านี้แล้วปุ่มแก้ไขหายไปเฉย ๆ
          // การแก้ข้อมูลไม่เลื่อนขั้น จึงแค่แทนแถวเดิม ไม่ต้อง reload ยอดในการ์ด
          onEdited={(updated) => {
            incoming.applyItem(updated);
            outgoing.applyItem(updated);
          }}
          // ฟอร์มในแท็บกำหนด code/fields มาเองแล้ว ไม่ต้องผ่านกล่องยืนยันซ้ำ
          onStepSubmit={(action, fields) => handleAction(view, action, '', fields)}
          actionPending={actionPending}
          notice={notice}
          onDismissNotice={dismissNotice}
        />
      )}

      {confirm && (
        <RequestActionDialog
          item={confirm.item}
          action={confirm.action}
          pending={actionPending}
          onCancel={() => setConfirm(null)}
          onConfirm={async (note, fields) => {
            await handleAction(confirm.item, confirm.action, note, fields);
            setConfirm(null);
          }}
        />
      )}
    </Layout>
  );
}

// ── บล็อกหลัก: ใบที่รอเราลงมือ ──────────────────────────────────
// รวม 2 กองที่คนละ endpoint ไว้ที่เดียว เพราะสำหรับผู้ใช้มันคือ "งานค้างของแผนก"
// กองเดียวกัน (ดู buildTodoRows ใน data/dashboardData.ts)
function TodoSection({
  rows,
  loading,
  outgoingWaitingUs,
  onOpen,
}: {
  rows: TodoRow[];
  loading: boolean;
  outgoingWaitingUs: number;
  onOpen: (row: TodoRow) => void;
}) {
  const shown = rows.slice(0, 6);
  const oldest = rows.find((r) => r.days !== null)?.days ?? null;

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 bg-[#0b1220] px-5 py-3.5">
        <IconChecks size={20} className="text-white/70" />
        <div className="min-w-0">
          <div className="text-[13px] text-white/70">งานที่รอแผนกเราลงมือ</div>
          <div className="mono text-2xl font-bold leading-tight text-white">
            {loading ? '—' : `${rows.length} ใบ`}
          </div>
        </div>
        {!loading && oldest !== null && rows.length > 0 && (
          <div className="ml-auto text-right">
            <div className="text-[12px] text-white/60">ค้างนานสุด</div>
            <div className="mono text-[15px] font-bold text-amber-300">{oldest} วัน</div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col gap-2 p-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-9 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-1.5 px-5 py-9 text-center">
          <IconChecks size={26} className="text-emerald-500" />
          <div className="text-[14px] font-semibold text-gray-700">ไม่มีใบที่รอแผนกเราลงมือ</div>
          <div className="text-[12.5px] text-gray-500">
            ทั้งคิวงานที่แจ้งเข้ามาและใบที่เราแจ้งออกไป ไม่มีอะไรค้างอยู่ที่เราในเดือนนี้
          </div>
        </div>
      ) : (
        <>
          {shown.map((r) => (
            <TodoRowView key={r.key} row={r} onOpen={() => onOpen(r)} />
          ))}
          <div className="flex flex-wrap items-center gap-3 bg-slate-50 px-5 py-2.5 text-[12px]">
            {rows.length > shown.length && (
              <span className="text-slate-500">
                และอีก <b className="mono">{rows.length - shown.length}</b> ใบ
              </span>
            )}
            <Link to="/inbox?myturn=1" className="ml-auto font-semibold text-accent hover:underline">
              คิวงานเข้าทั้งหมด
            </Link>
            {outgoingWaitingUs > 0 && (
              <Link to="/my?ourturn=1" className="font-semibold text-accent hover:underline">
                ใบที่เราแจ้งแล้วรอเรากด ({outgoingWaitingUs})
              </Link>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function TodoRowView({ row, onOpen }: { row: TodoRow; onOpen: () => void }) {
  const { item, origin, days } = row;
  const meta = PHASE_META[phaseOf(item)];
  const om = TODO_ORIGIN_META[origin];
  // ป้ายวันเป็นสีแดงเมื่อค้างเกินสัปดาห์ — ไม่ใช่เกณฑ์ KPI จริง (KPI คิดที่ backend
  // เพราะต้องหักวันหยุด/นอกเวลาทำงาน) แค่ชี้ว่าใบไหนควรหยิบก่อน
  const late = days !== null && days >= 7;

  return (
    <button
      onClick={onOpen}
      className="flex w-full flex-wrap items-center gap-2.5 border-b border-[#eef1f6] px-5 py-2.5 text-left transition hover:bg-slate-50"
    >
      <span
        className="shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-semibold"
        title={om.hint}
        style={
          origin === 'incoming'
            ? { background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' }
            : { background: '#fffbeb', color: '#b45309', borderColor: '#fde68a' }
        }
      >
        {om.label}
      </span>
      <span className="mono shrink-0 text-[12.5px] font-semibold text-accent">{item.docNo}</span>
      <span className="mono shrink-0 rounded border border-gray-200 px-1.5 py-0.5 text-[11px] text-slate-500">
        {item.module}
      </span>
      <span className="min-w-0 flex-1 truncate text-[13px] text-slate-700">
        {item.detail || item.requestType || '—'}
      </span>
      <span className="shrink-0 text-[12px] text-gray-400">
        {item.requestBy || '—'} · {fmtDate(item.requestDate) || '—'}
      </span>
      <span
        className="shrink-0 rounded-md border px-2 py-0.5 text-[11.5px] font-semibold"
        style={{ background: meta.bg, color: meta.color, borderColor: meta.border }}
      >
        {phaseLabel(item)}
      </span>
      {days !== null && (
        <span
          className={`mono shrink-0 rounded-md px-2 py-0.5 text-[11.5px] font-bold ${
            late ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'
          }`}
          title="นับจากครั้งล่าสุดที่ใบขยับ"
        >
          {days} วัน
        </span>
      )}
      <IconArrowRight size={14} className="shrink-0 text-gray-300" />
    </button>
  );
}

// ── คิวงานที่แจ้งเข้ามาที่แผนกเรา ────────────────────────────────
// การ์ดสร้างจาก phaseSummary ที่ API ส่งมา ไม่ใช่ลิสต์ phase ที่ฝังไว้
// → แผนกที่ workflow ไม่มีขั้นนั้นจะไม่มีการ์ดเปล่าโผล่มา
function IncomingSection({
  module,
  summary,
  myTurnCount,
  loading,
}: {
  module: string;
  summary: RequestPhaseSummary[];
  myTurnCount: number;
  loading: boolean;
}) {
  const total = totalOf(summary);
  const sorted = useMemo(
    () => [...summary].sort((a, b) => phaseIndex(a.phase) - phaseIndex(b.phase)),
    [summary]
  );

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2.5">
        <IconInbox size={18} className="text-slate-400" />
        <h2 className="text-[14.5px] font-bold text-gray-800">งานที่แจ้งเข้ามาที่แผนกเรา</h2>
        <span className="mono rounded border border-gray-200 px-1.5 py-0.5 text-[11px] text-slate-500">
          {module}
        </span>
        <span className="text-[12.5px] text-gray-500">
          {loading ? 'กำลังโหลด…' : `แจ้งเข้ามาในเดือนนี้ ${total} ใบ`}
        </span>
        <Link to="/inbox" className="ml-auto text-[12.5px] font-semibold text-accent hover:underline">
          เปิดกล่องงานเข้า
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <PhaseCard
          label="ถึงคิวเราต้องลงมือ"
          value={loading ? null : myTurnCount}
          color="#1d4ed8"
          bg="#eff6ff"
          border="#bfdbfe"
          to="/inbox?myturn=1"
        />
        {sorted.map((p) => {
          const meta = PHASE_META[p.phase] ?? PHASE_META.other;
          return (
            <PhaseCard
              key={p.phase}
              label={p.phaseName || meta.short}
              value={loading ? null : p.count}
              color={meta.color}
              bg={meta.bg}
              border={meta.border}
              to={`/inbox?phase=${p.phase}`}
            />
          );
        })}
      </div>

      {/* "ปิดงานแล้ว" = ใบที่ *แจ้งเข้ามา* ในเดือนนี้แล้วปิดไปแล้ว ไม่ใช่ "ใบที่ปิดในเดือนนี้"
          — API กรองช่วงวันที่จาก RequestDate เท่านั้น ใบที่แจ้งเดือนก่อนแล้วเพิ่งปิด
          เดือนนี้จึงไม่ถูกนับ ต้องเขียนกำกับไว้ ไม่ปล่อยให้ตีความเอง */}
      <p className="mt-2.5 text-[11.5px] text-gray-400">
        ทุกตัวเลขนับจากใบที่แจ้งเข้ามาในเดือนนี้ (ตามวันที่แจ้ง ไม่ใช่วันที่ปิดงาน)
      </p>
    </section>
  );
}

function PhaseCard({
  label,
  value,
  color,
  bg,
  border,
  to,
}: {
  label: string;
  value: number | null;
  color: string;
  bg: string;
  border: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="rounded-xl border p-3.5 transition hover:shadow-md"
      style={{ background: bg, borderColor: border }}
    >
      <div className="mb-1 truncate text-[12px] font-semibold" style={{ color }} title={label}>
        {label}
      </div>
      <div className="mono text-2xl font-bold leading-none" style={{ color }}>
        {value === null ? '—' : value}
      </div>
    </Link>
  );
}

// ── เรื่องที่แจ้งออกไป — แถบสรุปบาง ๆ ไม่ใช่พระเอกของหน้านี้ ─────
function OutgoingStrip({
  summary,
  waitingUs,
  loading,
}: {
  summary: RequestPhaseSummary[];
  waitingUs: number;
  loading: boolean;
}) {
  const total = totalOf(summary);
  const pick = (phase: RequestPhase): number => summary.find((p) => p.phase === phase)?.count ?? 0;
  const open = total - pick('closed') - pick('cancelled');

  return (
    <section className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-gray-200 bg-white px-5 py-3.5 text-[13px] shadow-sm">
      <span className="font-bold text-gray-800">เรื่องที่แผนกเราแจ้งออกไป</span>
      <span className="text-slate-600">
        เดือนนี้ <b className="mono">{loading ? '—' : total}</b> ใบ
      </span>
      <span className="text-slate-600">
        ยังไม่ปิด <b className="mono">{loading ? '—' : open}</b> ใบ
      </span>
      <span className="text-slate-600">
        รอเรากดต่อ <b className="mono text-amber-600">{loading ? '—' : waitingUs}</b> ใบ
      </span>
      <Link to="/my" className="ml-auto font-semibold text-accent hover:underline">
        ดูทั้งหมด
      </Link>
    </section>
  );
}
