import React, { useEffect, useMemo, useState } from 'react';
import {
  IconX,
  IconBell,
  IconCheck,
  IconCircleCheck,
  IconAlertTriangle,
  IconLoader2,
  IconPaperclip,
} from '@tabler/icons-react';
import {
  RequestAction,
  RequestAttachment,
  RequestDetailResponse,
  RequestListItem,
  RequestLog,
} from '../../types/requestList';
import { fmtDateTime, jobStatusMeta } from '../../data/requestListData';
import { isRequesterSide } from '../../data/requestPhase';
import { actionBtnClass } from './RequestActionDialog';
import { ActionFieldValues, cleanFieldValues, fieldSpec } from '../../data/requestActionFields';
import { useRequestDetail } from '../../hooks/useRequestDetail';
import { useAuth } from '../../context/AuthContext';

type Meta = { label: string; color: string; bg: string; border: string };

function Pill({ meta, dot }: { meta: Meta; dot?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11.5px] font-semibold"
      style={{ background: meta.bg, color: meta.color, borderColor: meta.border }}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />}
      {meta.label}
    </span>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11.5px] font-semibold text-gray-500">{label}</span>
      <span className="text-[13px] text-gray-800">{children}</span>
    </div>
  );
}

// ── นิยาม 5 ขั้นของ stepper (อิงงานฝั่ง IT ตาม WinForms) ────────
// reachedStep = wfStep ที่ขั้นนี้กลายเป็น "ขั้นปัจจุบัน"
//   (IT: 1 อนุมัติ → 2 รับเรื่อง → 3 ดำเนินการ/ปิดงานรับเรื่อง → 4 สำรวจ → 5 ปิดงาน)
//   "ดำเนินการ" กับ "ปิดงานรับเรื่อง" อยู่ใน step 3 เดียวกัน (ดำเนินการเสร็จก็ปิดรับเรื่องได้
//    หรือกดปิดรับเรื่องเลยโดยไม่ผ่านดำเนินการ) จึงใช้ reachedStep เท่ากัน
// logAction = action code ที่บันทึกลง logs ของขั้นนี้ (ใช้ดึงว่าใคร/เมื่อไร)
interface StepTab {
  key: string;
  label: string;
  reachedStep: number;
  logAction: string;
  // ปุ่มที่ยอมให้ขึ้นในแท็บนี้ — กรอง item.availableActions ด้วย code ชุดนี้
  // ([] = ไม่มีปุ่ม workflow ในแท็บนี้, undefined = โชว์ทุกปุ่มที่ API ส่งมา)
  // ทำให้แท็บ "รับเรื่อง" เหลือปุ่มรับเรื่องปุ่มเดียว ไม่ปนปุ่มดำเนินการ
  actionCodes?: string[];
}
const STEP_TABS: StepTab[] = [
  { key: 'general', label: 'General', reachedStep: 0, logAction: 'create', actionCodes: [] },
  { key: 'receive', label: 'รับเรื่อง', reachedStep: 2, logAction: 'receive', actionCodes: ['receive'] },
  { key: 'service', label: 'ดำเนินการ', reachedStep: 3, logAction: 'service', actionCodes: [] },
  { key: 'closeReceive', label: 'ปิดงานรับเรื่อง', reachedStep: 3, logAction: 'service', actionCodes: [] },
  { key: 'survey', label: 'สำรวจความพึงพอใจ', reachedStep: 4, logAction: 'survey', actionCodes: [] },
  { key: 'close', label: 'ปิดงาน', reachedStep: 5, logAction: 'close', actionCodes: [] },
];

type StepState = 'done' | 'current' | 'upcoming';

// ผ่านแล้ว / กำลังทำ / ยังไม่ถึง — คิดจาก wfStep ปัจจุบันของใบ
// General = ข้อมูลใบที่แจ้งเข้ามา มีอยู่แล้วเสมอ จึงถือว่า "ทำแล้ว" ตลอด
function stepStateOf(tab: StepTab, wfStep: number | null | undefined, closed: boolean): StepState {
  if (tab.key === 'general') return 'done';
  if (closed) return 'done';
  if (wfStep === null || wfStep === undefined) return 'upcoming';
  if (wfStep > tab.reachedStep) return 'done';
  if (wfStep === tab.reachedStep) return 'current';
  return 'upcoming';
}

const STATE_CHIP: Record<StepState, Meta> = {
  done: { label: 'ทำแล้ว', color: '#047857', bg: '#ecfdf5', border: '#a7f3d0' },
  current: { label: 'ขั้นปัจจุบัน', color: '#1a5fb4', bg: '#eff6ff', border: '#bfdbfe' },
  upcoming: { label: 'ยังไม่ถึงขั้นนี้', color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0' },
};

// ── รายละเอียดใบแจ้งเรื่อง — wizard ตามขั้นของ workflow ─────────
// เปิดใบ = โหลด detail (item เต็ม + logs + workflow) จาก GET /Requests/{module}/{docNo}
// ถ้าเส้นนั้นยังไม่พร้อม → ใช้ item จาก list ไปก่อน (stepper ยังขึ้นตาม wfStep ได้)
//
// ปุ่มดำเนินการมาจาก item.availableActions ที่ API ส่งมา ไม่ได้ฝังไว้ในโค้ด
// และจะโชว์อยู่ใน tab ที่เป็น "ขั้นปัจจุบัน" เท่านั้น (คิวของคนที่เปิดดู)
export function RequestDetailModal({
  item,
  onClose,
  onPickAction,
  onStepSubmit,
  actionPending,
  notice,
  onDismissNotice,
}: {
  item: RequestListItem;
  onClose: () => void;
  onPickAction?: (action: RequestAction) => void; // ไม่ส่งมา = อ่านอย่างเดียว
  // ยิง action จากฟอร์มในแท็บ (ดำเนินการ/ปิดงานรับเรื่อง/สำรวจ) ตรง ไม่ผ่านกล่องยืนยัน
  onStepSubmit?: (action: RequestAction, fields: ActionFieldValues) => void | Promise<void>;
  actionPending?: boolean;
  // ผลของการกดปุ่ม — โชว์ในตัว modal เพราะแถบของตารางถูก modal บังไว้
  notice?: { kind: 'success' | 'error'; text: string } | null;
  onDismissNotice?: () => void;
}) {
  const { user } = useAuth();
  // ส่ง updatedDate เป็น refreshKey — หลังกด action ใบขยับ ค่าเปลี่ยน → โหลด detail ใหม่
  const { detail, loading: detailLoading } = useRequestDetail(
    item.module,
    item.docNo,
    user?.token,
    item.updatedDate ?? item.wfStep
  );

  // item เต็มจาก detail (คำนวณสำหรับคนที่เปิดดู) — ถ้ายังโหลดไม่เสร็จใช้ตัวจากลิสต์ไปก่อน
  const full = detail?.item ?? item;
  const actions = onPickAction ? item.availableActions ?? [] : [];
  const status = jobStatusMeta(item);
  const r = full.resolution;
  const logs = detail?.logs ?? [];
  const closed = item.phase === 'closed';

  // log ล่าสุดของแต่ละ action — ใช้ดึงว่าใคร/แผนก/เมื่อไร ของแต่ละขั้น
  const lastLogOf = (action: string): RequestLog | null => {
    let found: RequestLog | null = null;
    for (const l of logs) if (l.action === action) found = l;
    return found;
  };

  // tab เริ่มต้น = ขั้นปัจจุบัน (ตัวแรกที่ state = current) ไม่งั้นตัวสุดท้ายที่ทำแล้ว
  const defaultTab = useMemo(() => {
    const cur = STEP_TABS.findIndex((t) => stepStateOf(t, item.wfStep, closed) === 'current');
    if (cur !== -1) return cur;
    let lastDone = 0;
    STEP_TABS.forEach((t, i) => {
      if (stepStateOf(t, item.wfStep, closed) === 'done') lastDone = i;
    });
    return lastDone;
  }, [item.wfStep, closed]);

  const [selected, setSelected] = useState(defaultTab);

  // เดิน stepper ไปขั้นปัจจุบันเมื่อ wfStep เปลี่ยน (เช่นหลังกดรับเรื่อง → ไปแท็บดำเนินการ)
  // ไม่ override ตอนผู้ใช้กดดูแท็บอื่นเอง เพราะ wfStep ไม่เปลี่ยน effect จึงไม่ยิง
  const currentIndex = useMemo(
    () => STEP_TABS.findIndex((t) => stepStateOf(t, item.wfStep, closed) === 'current'),
    [item.wfStep, closed]
  );
  useEffect(() => {
    if (currentIndex !== -1) setSelected(currentIndex);
  }, [currentIndex]);
  const activeTab = STEP_TABS[selected] ?? STEP_TABS[0];
  const activeState = stepStateOf(activeTab, item.wfStep, closed);
  const activeLog = lastLogOf(activeTab.logAction);
  // ปุ่มที่โชว์ในแท็บนี้ = availableActions กรองด้วย actionCodes ของแท็บ
  // (แท็บรับเรื่องจึงเหลือแค่ปุ่มรับเรื่อง, แท็บดำเนินการไม่มีปุ่ม workflow)
  const activeActions = activeTab.actionCodes
    ? actions.filter((a) => activeTab.actionCodes!.includes(a.code))
    : actions;
  // ปุ่มอนุมัติ/ไม่อนุมัติ (ขั้น MGR ต้นสังกัด) — โชว์ในแท็บ General เพราะขั้นอนุมัติ
  // เกิดก่อนสาย workflow ฝั่งปลายทาง กด MGR ต้องอ่านข้อมูลใบก่อนตัดสินใจ
  const approveActions = actions.filter((a) => ['approve', 'not_approve', 'reject'].includes(a.code));

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="backdrop-fade-in absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <div className="modal-pop relative flex max-h-[92vh] w-[min(760px,96vw)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* หัว: เลขที่ใบ + โมดูล + สถานะย่อ + ปุ่มปิด */}
        <div className="flex shrink-0 items-center gap-3.5 border-b border-gray-200 bg-white px-5 py-4">
          <div className="min-w-0">
            <div className="mono text-xs text-slate-400">เลขที่ใบแจ้ง</div>
            <div className="flex items-center gap-2">
              <span className="mono truncate text-base font-bold text-gray-900">{item.docNo}</span>
              <span className="mono rounded-md border border-gray-200 bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                {item.module}
              </span>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Pill meta={status} dot />
            {(item.isMyTurn || isRequesterSide(item)) && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[11.5px] font-bold text-amber-700">
                <IconBell size={13} />
                {isRequesterSide(item) ? 'รอแผนกผู้แจ้ง' : 'ถึงคิวเรา'}
              </span>
            )}
            <button
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white transition hover:bg-slate-100"
              aria-label="ปิด"
            >
              <IconX size={18} className="text-slate-700" />
            </button>
          </div>
        </div>

        {/* ===== stepper คลิกได้ (แทนแถบ pill เดิม) ===== */}
        <div className="shrink-0 border-b border-gray-100 bg-slate-50 px-5 py-4">
          <div className="mb-1 flex items-center gap-2">
            {detailLoading && (
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                <IconLoader2 size={12} className="animate-spin" />
                กำลังโหลด...
              </span>
            )}
          </div>
          <div className="overflow-x-auto pb-1">
            <ol className="flex min-w-max items-start">
              {STEP_TABS.map((t, i) => {
                const state = stepStateOf(t, item.wfStep, closed);
                const done = state === 'done';
                const current = state === 'current';
                const isSel = i === selected;
                const leftOn = i > 0 && (done || current);
                const rightOn = done;
                const lg = lastLogOf(t.logAction);
                const tip = [lg?.actionByName, lg?.actionByDepartment, lg?.actionDate ? fmtDateTime(lg.actionDate) : null]
                  .filter(Boolean)
                  .join(' · ');
                return (
                  <li key={t.key} className="relative flex w-[120px] shrink-0 flex-col items-center px-1">
                    {i > 0 && (
                      <span
                        className="absolute right-1/2 top-[15px] h-[3px] w-full"
                        style={{ background: leftOn ? '#16a34a' : '#e2e8f0' }}
                      />
                    )}
                    {i < STEP_TABS.length - 1 && (
                      <span
                        className="absolute left-1/2 top-[15px] h-[3px] w-full"
                        style={{ background: rightOn ? '#16a34a' : '#e2e8f0' }}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => setSelected(i)}
                      title={tip || t.label}
                      className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full transition ${
                        isSel ? 'ring-4 ring-offset-1 ring-[#1a5fb4]/40' : current ? 'ring-4 ring-[#1a5fb4]/20' : ''
                      }`}
                      style={{ background: done ? '#16a34a' : current ? '#1a5fb4' : '#cbd5e1' }}
                    >
                      {done ? (
                        <IconCheck size={16} stroke={3} className="text-white" />
                      ) : (
                        <span className="text-[12px] font-bold text-white">{i + 1}</span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelected(i)}
                      className={`mt-2 text-center text-[11px] leading-tight transition ${
                        isSel
                          ? 'font-bold text-gray-900 underline decoration-2 underline-offset-4'
                          : done
                          ? 'text-gray-600 hover:text-gray-900'
                          : current
                          ? 'font-semibold text-[#1a5fb4]'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {t.label}
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>

        {/* ผลของการกดปุ่ม — message ไทยจาก API (สำเร็จ/ error) โชว์ในตัว modal */}
        {notice && (
          <div
            className={`flex shrink-0 items-center gap-2 border-b px-5 py-2.5 text-[12.5px] font-semibold ${
              notice.kind === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {notice.kind === 'success' ? (
              <IconCircleCheck size={16} className="shrink-0" />
            ) : (
              <IconAlertTriangle size={16} className="shrink-0" />
            )}
            <span className="min-w-0 flex-1">{notice.text}</span>
            {onDismissNotice && (
              <button onClick={onDismissNotice} title="ปิดข้อความ" className="rounded p-1 opacity-60 transition hover:bg-white/60 hover:opacity-100">
                <IconX size={14} />
              </button>
            )}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* ===== แผงของ tab ที่เลือก ===== */}
          <div className="border-b border-gray-100 px-5 py-5">
            <div className="mb-3 flex items-center gap-2">
              <h4 className="text-[13px] font-bold text-gray-800">{activeTab.label}</h4>
              {activeTab.key !== 'general' && (
                <Pill meta={STATE_CHIP[activeState]} dot={activeState === 'current'} />
              )}
            </div>

            {activeTab.key === 'general' ? (
              <GeneralPanel
                item={item}
                full={full}
                attachments={detail?.attachments ?? null}
                approveLogs={logs.filter((l) => l.action === 'approve')}
              />
            ) : activeTab.key === 'service' ? (
              <ServicePanel
                state={activeState}
                actions={actions}
                resolution={r}
                pending={!!actionPending}
                onSubmit={onStepSubmit}
                onNext={() => {
                  const i = STEP_TABS.findIndex((t) => t.key === 'closeReceive');
                  if (i !== -1) setSelected(i);
                }}
              />
            ) : activeTab.key === 'closeReceive' ? (
              <ClosePanel state={activeState} resolution={r} pending={!!actionPending} onSubmit={onStepSubmit} />
            ) : activeTab.key === 'survey' ? (
              <SurveyPanel state={activeState} pending={!!actionPending} onSubmit={onStepSubmit} />
            ) : activeTab.key === 'close' ? (
              <KpiPanel state={activeState} pending={!!actionPending} onSubmit={onStepSubmit} />
            ) : (
              <StepPanel tab={activeTab} state={activeState} log={activeLog} resolution={r} />
            )}

            {/* ปุ่มอนุมัติ/ไม่อนุมัติ ในแท็บ General — ผ่านกล่องยืนยันเหมือน action อื่น
                โผล่เมื่อ API ส่ง approve มาใน availableActions (เป็นคิวของ MGR ผู้อนุมัติ) */}
            {activeTab.key === 'general' && onPickAction && approveActions.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
                {approveActions.map((a) => (
                  <button
                    key={a.code}
                    type="button"
                    disabled={actionPending}
                    onClick={() => onPickAction(a)}
                    className={`rounded-lg border px-4 py-2 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${actionBtnClass(
                      a.style
                    )}`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            )}

            {/* ปุ่มดำเนินการของขั้นนี้ — โชว์เฉพาะ tab ที่เป็นคิวปัจจุบัน + ตรง actionCodes
                ปุ่มมาจาก availableActions ที่ API ส่งมา (กดแล้วเปิดกล่องยืนยัน+ฟอร์ม) */}
            {activeState === 'current' && activeActions.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
                {activeActions.map((a) => {
                  const needs = a.requiredFields ?? [];
                  return (
                    <button
                      key={a.code}
                      type="button"
                      disabled={actionPending}
                      onClick={() => onPickAction?.(a)}
                      title={
                        needs.length > 0
                          ? `${a.label} — ต้องกรอก ${needs.map((f) => fieldSpec(f).label).join(', ')}`
                          : a.label
                      }
                      className={`rounded-lg border px-4 py-2 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${actionBtnClass(
                        a.style
                      )}`}
                    >
                      {a.label}
                      {needs.length > 0 && <span className="ml-1 opacity-70">…</span>}
                    </button>
                  );
                })}
              </div>
            )}
            {/* ขั้นปัจจุบันแต่กดอะไรไม่ได้ = ไม่ใช่คิวของเรา (สิทธิ์ไม่ถึง / รอฝั่งอื่น)
                แท็บที่ไม่มีปุ่ม workflow (actionCodes = []) ไม่ต้องขึ้นข้อความนี้ */}
            {activeState === 'current' &&
              (activeTab.actionCodes?.length ?? 1) > 0 &&
              activeActions.length === 0 && (
                <p className="mt-3 text-[12px] text-slate-400">— ขั้นนี้ยังไม่ใช่คิวของคุณ หรือยังไม่มีสิทธิ์ดำเนินการ</p>
              )}
          </div>

        </div>
      </div>
    </div>
  );
}

// ── เนื้อหาแต่ละขั้น — โชว์ใคร/เมื่อไร + ข้อมูลที่บันทึกไว้ (เท่าที่ API ส่งมา) ──
function StepPanel({
  tab,
  state,
  log,
  resolution,
}: {
  tab: StepTab;
  state: StepState;
  log: RequestLog | null;
  resolution: RequestListItem['resolution'];
}) {
  if (state === 'upcoming') {
    return <p className="text-[12.5px] text-slate-400">ยังไม่ถึงขั้นนี้ — จะบันทึกข้อมูลเมื่อดำเนินการถึง</p>;
  }

  const who = log?.actionByName;
  const when = log?.actionDate;
  const r = resolution;

  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-4">
      {(who || when) && (
        <>
          <DetailRow label="ผู้ดำเนินการ">{who || '—'}</DetailRow>
          <DetailRow label="วันที่">{when ? fmtDateTime(when) : '—'}</DetailRow>
        </>
      )}

      {/* ข้อมูลเฉพาะขั้น — เท่าที่ resolution ที่ API ส่งมามีให้
          (ช่องละเอียดของ WinForms เช่น ส่งซ่อมภายนอก/คะแนนสำรวจ/KPI ยังไม่ได้ส่งมาใน resolution
           จะโชว์ครบเมื่อ backend เพิ่มฟิลด์ หรือกรอกผ่านฟอร์มตอนกดปุ่ม) */}
      {tab.key === 'closeReceive' && r && (r.repairStatus || r.solution || r.resolutionDetail) && (
        <>
          <DetailRow label="สถานะการซ่อม">{r.repairStatus || '—'}</DetailRow>
          <DetailRow label="แนวทางแก้ไข">{r.solution || '—'}</DetailRow>
          <div className="col-span-2">
            <DetailRow label="รายละเอียดการดำเนินการ">
              <span className="whitespace-pre-wrap">{r.resolutionDetail || '—'}</span>
            </DetailRow>
          </div>
        </>
      )}

      {!who && !when && (
        <div className="col-span-2">
          <p className="text-[12.5px] text-slate-400">
            {state === 'current'
              ? 'ยังไม่ได้บันทึกข้อมูลขั้นนี้ — กดปุ่มด้านล่างเพื่อดำเนินการ'
              : 'ระบบยังไม่ส่งรายละเอียดของขั้นนี้มา'}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Tab ดำเนินการ (step 3 Service) — ฟอร์มชุด "ส่งบริษัท" ──────
// ปุ่ม 2 ปุ่มมาจาก availableActions ที่ API ส่งมาที่ step 3:
//   saveService (บันทึกรายละเอียด, ไม่เลื่อน step กดกี่ครั้งก็ได้) / service (ดำเนินการเสร็จ → Survey)
// ฟิลด์: repairStatus(ดำเนินการ) · exVendor(ส่งบริษัท, บังคับ) · exContact(เบอร์) · exPrNo · exPlanDate
const SERVICE_MODES = ['ซ่อมเอง', 'ส่งซ่อมภายนอก', 'รออะไหล่'];
const SVC_INPUT =
  'w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none transition focus:border-accent disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500';
const SVC_LABEL = 'mb-1 block text-[11.5px] font-semibold text-gray-500';

function ServicePanel({
  state,
  actions,
  resolution,
  pending,
  onSubmit,
  onNext,
}: {
  state: StepState;
  actions: RequestAction[];
  resolution: RequestListItem['resolution'];
  pending: boolean;
  onSubmit?: (action: RequestAction, fields: ActionFieldValues) => void | Promise<void>;
  onNext?: () => void; // ไปแท็บปิดงานรับเรื่อง (แค่สลับแท็บ ไม่ยิงปิด)
}) {
  const [mode, setMode] = useState('');
  const [vendor, setVendor] = useState('');
  const [phone, setPhone] = useState('');
  const [refPr, setRefPr] = useState('');
  const [planDate, setPlanDate] = useState('');
  const [touched, setTouched] = useState(false);

  if (state === 'upcoming') {
    return <p className="text-[12.5px] text-slate-400">ยังไม่ถึงขั้นนี้ — จะกรอกได้เมื่อรับเรื่องแล้ว</p>;
  }

  // แท็บนี้เก็บแค่ "บันทึกรายละเอียด" (saveService) — ไม่ปิดใบ
  // การปิด (service → Survey) อยู่ที่แท็บปิดงานรับเรื่องเท่านั้น เพราะ
  // "ดำเนินการเสร็จ" ในโมเดลนี้ = จบงานซ่อมแล้วไปกรอกปิดงาน ไม่ใช่ปิดทันที
  const saveAction = actions.find((a) => a.code === 'saveService');
  // ถ้าถึง step 3 (มี service ให้กดได้) ก็ถือว่าแก้ไขได้ แม้ backend จะไม่ส่ง saveService มา
  const editable = !!saveAction || actions.some((a) => a.code === 'service');

  if (!editable) {
    const rp = resolution?.repairStatus;
    return (
      <div className="grid grid-cols-2 gap-x-5 gap-y-4">
        <DetailRow label="การดำเนินการ">{rp || '—'}</DetailRow>
        <div className="col-span-2 text-[11.5px] text-slate-400">
          รายละเอียดส่งบริษัท / เบอร์ / กำหนดเสร็จ ระบบยังไม่ส่งกลับมาแสดง
        </div>
      </div>
    );
  }

  // ชื่อฟิลด์ตาม backend: repairStatus(ดำเนินการ) · exVendor(ส่งบริษัท) · exContact(เบอร์) · exPrNo · exPlanDate
  // ตัดค่าว่างออกก่อนยิง — API ถือว่า "ไม่ส่ง = คงค่าเดิม" ส่ง "" ไปคือล้างค่า
  const vendorMissing = vendor.trim() === '';
  const collect = (): ActionFieldValues =>
    cleanFieldValues({
      repairStatus: mode,
      exVendor: vendor,
      exContact: phone,
      exPrNo: refPr,
      exPlanDate: planDate ? `${planDate}T00:00:00` : '',
    }) ?? {};
  const submit = (a: RequestAction) => {
    setTouched(true);
    if (vendorMissing) return; // exVendor บังคับ (requiredFields ของทั้งสองปุ่ม)
    onSubmit?.(a, collect());
  };

  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-4">
      <SelectField label="ดำเนินการ" value={mode} options={SERVICE_MODES} disabled={pending} onChange={setMode} />
      <div />
      <div className="col-span-2">
        <label className={SVC_LABEL}>
          ส่งบริษัท<span className="text-rose-600"> *</span>
        </label>
        <textarea
          rows={2}
          value={vendor}
          disabled={pending}
          onChange={(e) => setVendor(e.target.value)}
          className={`${SVC_INPUT} resize-none ${touched && vendorMissing ? 'border-rose-300 bg-rose-50/40' : ''}`}
        />
      </div>
      <div>
        <label className={SVC_LABEL}>เบอร์โทร</label>
        <input value={phone} disabled={pending} onChange={(e) => setPhone(e.target.value)} className={SVC_INPUT} />
      </div>
      <div>
        <label className={SVC_LABEL}>Ref PR</label>
        <input value={refPr} disabled={pending} onChange={(e) => setRefPr(e.target.value)} className={SVC_INPUT} />
      </div>
      <div>
        <label className={SVC_LABEL}>วันที่กำหนดเสร็จ</label>
        <input
          type="date"
          value={planDate}
          disabled={pending}
          onChange={(e) => setPlanDate(e.target.value)}
          className={SVC_INPUT}
        />
      </div>

      {touched && vendorMissing && (
        <p className="col-span-2 text-[11.5px] font-semibold text-rose-600">ต้องกรอก “ส่งบริษัท” ก่อนบันทึก/ดำเนินการเสร็จ</p>
      )}

      <div className="col-span-2 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
        {saveAction && (
          <button
            type="button"
            disabled={pending}
            onClick={() => submit(saveAction)}
            className={`rounded-lg border px-4 py-2 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${actionBtnClass(
              saveAction.style
            )}`}
          >
            {saveAction.label}
          </button>
        )}
        {onNext && (
          <button
            type="button"
            disabled={pending}
            onClick={onNext}
            className="rounded-lg border border-accent bg-accent px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[#17539f] disabled:cursor-not-allowed disabled:opacity-50"
          >
            ดำเนินการเสร็จ → ปิดงานรับเรื่อง
          </button>
        )}
        <span className="text-[11.5px] text-slate-400">บันทึกได้เรื่อย ๆ · การปิดใบทำที่แท็บ “ปิดงานรับเรื่อง”</span>
      </div>
    </div>
  );
}

// ── Tab ปิดงานรับเรื่อง — สรุปผลแล้วปิดขั้นดำเนินการ ────────────
// ช่อง: แนวทางการแก้ไข · สาเหตุหลัก · สาเหตุรอง · รายละเอียดการดำเนินการ · หมายเหตุ
// ยิง action 'service' (ดำเนินการเสร็จ) พร้อมฟิลด์ solve/hw/hwDetail/repairDetail (+closeRemark)
const CLOSE_SOLVE = ['บริการซ่อม/แก้ไข', 'ให้คำปรึกษา/แนะนำ', 'ติดตั้ง/ตั้งค่า', 'เปลี่ยน/เพิ่มอุปกรณ์', 'ส่งซ่อมภายนอก', 'อื่น ๆ'];
const CLOSE_CAUSE_MAIN = ['Hardware', 'Software'];
const CLOSE_CAUSE_SUB = ['Computer', 'Notebook', 'Printer', 'Network', 'Software', 'อื่น ๆ'];

function SelectField({
  label,
  value,
  options,
  disabled,
  invalid,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  disabled: boolean;
  invalid?: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className={SVC_LABEL}>{label}</label>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`${SVC_INPUT} cursor-pointer ${invalid ? 'border-rose-300 bg-rose-50/40' : ''}`}
      >
        <option value="">— เลือก —</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function ClosePanel({
  state,
  resolution,
  pending,
  onSubmit,
}: {
  state: StepState;
  resolution: RequestListItem['resolution'];
  pending: boolean;
  onSubmit?: (action: RequestAction, fields: ActionFieldValues) => void | Promise<void>;
}) {
  const [solve, setSolve] = useState('');
  const [causeMain, setCauseMain] = useState('');
  const [causeSub, setCauseSub] = useState('');
  const [detail, setDetail] = useState('');
  const [remark, setRemark] = useState('');
  const [touched, setTouched] = useState(false);

  if (state === 'upcoming') {
    return <p className="text-[12.5px] text-slate-400">ยังไม่ถึงขั้นนี้ — จะปิดงานได้เมื่อดำเนินการแล้ว</p>;
  }

  // ขั้นที่ทำแล้ว — โชว์สรุปที่บันทึกไว้ (เท่าที่ resolution ส่งมา) แบบอ่านอย่างเดียว
  if (state === 'done') {
    const r = resolution;
    return (
      <div className="grid grid-cols-2 gap-x-5 gap-y-4">
        <DetailRow label="แนวทางการแก้ไข">{r?.solution || '—'}</DetailRow>
        <DetailRow label="สถานะ/สาเหตุ">{r?.repairStatus || '—'}</DetailRow>
        <div className="col-span-2">
          <DetailRow label="รายละเอียดการดำเนินการ">
            <span className="whitespace-pre-wrap">{r?.resolutionDetail || '—'}</span>
          </DetailRow>
        </div>
      </div>
    );
  }

  const missing = { solve: !solve, causeMain: !causeMain, causeSub: !causeSub, detail: !detail.trim() };
  const blocked = missing.solve || missing.causeMain || missing.causeSub || missing.detail;

  const submit = () => {
    setTouched(true);
    if (blocked) return;
    onSubmit?.(
      { code: 'service', label: 'ปิดงานรับเรื่อง', style: 'success', requireNote: false, requiredFields: [] },
      cleanFieldValues({ solve, hw: causeMain, hwDetail: causeSub, repairDetail: detail, closeRemark: remark }) ?? {}
    );
  };

  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-4">
      <SelectField label="แนวทางการแก้ไข" value={solve} options={CLOSE_SOLVE} disabled={pending} invalid={touched && missing.solve} onChange={setSolve} />
      <div className="hidden md:block" />
      <SelectField label="สาเหตุหลัก" value={causeMain} options={CLOSE_CAUSE_MAIN} disabled={pending} invalid={touched && missing.causeMain} onChange={setCauseMain} />
      <SelectField label="สาเหตุรอง" value={causeSub} options={CLOSE_CAUSE_SUB} disabled={pending} invalid={touched && missing.causeSub} onChange={setCauseSub} />
      <div className="col-span-2">
        <label className={SVC_LABEL}>รายละเอียดการดำเนินการ</label>
        <textarea
          rows={3}
          value={detail}
          disabled={pending}
          onChange={(e) => setDetail(e.target.value)}
          className={`${SVC_INPUT} resize-none ${touched && missing.detail ? 'border-rose-300 bg-rose-50/40' : ''}`}
        />
      </div>
      <div className="col-span-2">
        <label className={SVC_LABEL}>หมายเหตุ</label>
        <input value={remark} disabled={pending} onChange={(e) => setRemark(e.target.value)} className={SVC_INPUT} />
      </div>

      {touched && blocked && (
        <p className="col-span-2 text-[11.5px] font-semibold text-rose-600">กรอกแนวทางแก้ไข / สาเหตุหลัก / สาเหตุรอง / รายละเอียดให้ครบก่อนปิดงาน</p>
      )}

      <div className="col-span-2 flex items-center gap-2 border-t border-gray-100 pt-4">
        <button
          type="button"
          disabled={pending || !onSubmit}
          onClick={submit}
          className="rounded-lg border border-emerald-600 bg-emerald-600 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          ปิดงานรับเรื่อง
        </button>
      </div>
    </div>
  );
}

// ── Tab สำรวจความพึงพอใจ — 5 หัวข้อ × 5 ระดับ รวม 25 คะแนน ─────
// ยิง action 'survey' พร้อม serviceScore (คะแนนรวม 1–25) + surveyRemark
const SURVEY_QUESTIONS = [
  'ให้บริการด้วยความสุภาพและเป็นมิตร',
  'ความรวดเร็วในการให้บริการ',
  'เจ้าหน้าที่กระตือรือร้น และตั้งใจทำงาน',
  'ได้รับบริการตรงตามที่คาดหวัง',
  'การแนะนำขั้นตอนและให้ความรู้ในเรื่องที่ให้บริการ',
];
const SURVEY_LEVELS = [
  { v: 5, t: 'ดีมาก' },
  { v: 4, t: 'ดี' },
  { v: 3, t: 'ปานกลาง' },
  { v: 2, t: 'น้อย' },
  { v: 1, t: 'น้อยที่สุด' },
];
const SURVEY_MAX = SURVEY_QUESTIONS.length * 5; // 25

function SurveyPanel({
  state,
  pending,
  onSubmit,
}: {
  state: StepState;
  pending: boolean;
  onSubmit?: (action: RequestAction, fields: ActionFieldValues) => void | Promise<void>;
}) {
  const [scores, setScores] = useState<number[]>(Array(SURVEY_QUESTIONS.length).fill(0));
  const [remark, setRemark] = useState('');
  const [touched, setTouched] = useState(false);

  if (state === 'upcoming') {
    return <p className="text-[12.5px] text-slate-400">ยังไม่ถึงขั้นนี้ — จะประเมินได้เมื่อปิดงานรับเรื่องแล้ว</p>;
  }
  if (state === 'done') {
    return <p className="text-[12.5px] text-emerald-700">ส่งผลประเมินแล้ว</p>;
  }

  const total = scores.reduce((s, v) => s + v, 0);
  const answered = scores.every((v) => v > 0);
  const pct = Math.round((total / SURVEY_MAX) * 100);
  const needRemark = answered && total < 20 && remark.trim() === '';
  const blocked = !answered || needRemark;

  const setScore = (i: number, v: number) => setScores((prev) => prev.map((x, k) => (k === i ? v : x)));

  const submit = () => {
    setTouched(true);
    if (blocked) return;
    onSubmit?.(
      { code: 'survey', label: 'ส่งผลประเมิน', style: 'primary', requireNote: false, requiredFields: [] },
      cleanFieldValues({ serviceScore: total, surveyRemark: remark }) ?? { serviceScore: total }
    );
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-separate border-spacing-0 text-[12px]">
          <thead>
            <tr className="text-slate-600">
              <th className="border-b border-gray-200 px-2 py-2 text-left font-semibold">หัวข้อ</th>
              {SURVEY_LEVELS.map((lv) => (
                <th key={lv.v} className="border-b border-gray-200 px-1 py-2 text-center font-semibold">
                  {lv.t}
                  <div className="mono text-[10.5px] text-slate-400">({lv.v})</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SURVEY_QUESTIONS.map((q, i) => (
              <tr key={i}>
                <td className="border-b border-gray-100 px-2 py-2 text-gray-800">
                  <span className="mono mr-1.5 text-slate-400">{i + 1}</span>
                  {q}
                </td>
                {SURVEY_LEVELS.map((lv) => (
                  <td key={lv.v} className="border-b border-gray-100 px-1 py-2 text-center">
                    <input
                      type="radio"
                      name={`q${i}`}
                      checked={scores[i] === lv.v}
                      disabled={pending}
                      onChange={() => setScore(i, lv.v)}
                      className="h-4 w-4 cursor-pointer accent-accent"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 rounded-lg border border-gray-200 bg-slate-50 px-3.5 py-2.5 text-[12.5px]">
        <span className="text-slate-500">คะแนนเต็ม <b className="mono text-gray-800">{SURVEY_MAX}</b></span>
        <span className="text-slate-500">คะแนนที่ได้ <b className="mono text-gray-800">{total}</b></span>
        <span className="text-slate-500">คิดเป็น <b className="mono text-gray-800">{pct}%</b></span>
        {!answered && <span className="text-rose-600">— ยังตอบไม่ครบทุกข้อ</span>}
      </div>

      <div className="mt-4">
        <label className={SVC_LABEL}>
          ข้อเสนอแนะอื่น ๆ
          {answered && total < 20 && <span className="text-rose-600"> * (คะแนนต่ำกว่า 20 ต้องระบุ)</span>}
        </label>
        <textarea
          rows={2}
          value={remark}
          disabled={pending}
          onChange={(e) => setRemark(e.target.value)}
          className={`${SVC_INPUT} resize-none ${touched && needRemark ? 'border-rose-300 bg-rose-50/40' : ''}`}
        />
      </div>

      {touched && blocked && (
        <p className="mt-2 text-[11.5px] font-semibold text-rose-600">
          {!answered ? 'กรุณาให้คะแนนครบทั้ง 5 ข้อ' : 'คะแนนต่ำกว่า 20 ต้องระบุข้อเสนอแนะ'}
        </p>
      )}

      <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-4">
        <button
          type="button"
          disabled={pending || !onSubmit}
          onClick={submit}
          className="rounded-lg border border-accent bg-accent px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[#17539f] disabled:cursor-not-allowed disabled:opacity-50"
        >
          ส่งผลประเมิน
        </button>
      </div>
    </div>
  );
}

// ── Tab ปิดงาน — สรุปผล KPI แล้วปิดใบ ──────────────────────────
// ตาราง 4 กรณี × 4 ผล เลือกได้ช่องเดียวทั้งตาราง → caseNo (แถว) + kpi (คอลัมน์)
// ยิง action 'close' พร้อม caseNo/kpi (ฟิลด์มีใน shim อยู่แล้ว)
const KPI_CASES = [
  'แก้ไขเองได้ (ทั้ง Software และ Hardware) ภายใน 1 ชั่วโมงทำงาน หลังจากต้นสังกัดอนุมัติในโปรแกรม ยกเว้นแจ้งก่อนเวลาเลิกงานไม่เกิน 1 ชั่วโมงหรือแจ้งในวันเสาร์ จะต้องแก้ไขให้แล้วเสร็จภายใน 9 โมงเช้าของวันทำงานถัดไป',
  'กรณีแก้ไขเองได้ (ทั้ง Software และ Hardware อาการหนัก เช่น ลง Windows ใหม่) ภายใน 3 วันทำการ หลังจากต้นสังกัดอนุมัติในโปรแกรม',
  'กรณี Software ที่ต้องปรึกษาการแก้ไขปัญหาจากบุคคลภายนอก ภายใน 7-15 วัน หลังจากต้นสังกัดอนุมัติในโปรแกรม',
  'กรณี Hardware ที่ต้องส่งซ่อมภายนอกหรือขอซื้อใหม่ทั้ง Software + Hardware ภายใน 15-30 วัน หลังจากต้นสังกัดอนุมัติในโปรแกรม',
];
const KPI_RESULTS = ['ตาม KPI', 'ตก KPI', 'ยกเลิก', 'ยังไม่ถึงกำหนด'];

function KpiPanel({
  state,
  pending,
  onSubmit,
}: {
  state: StepState;
  pending: boolean;
  onSubmit?: (action: RequestAction, fields: ActionFieldValues) => void | Promise<void>;
}) {
  // เลือกได้ช่องเดียวทั้งตาราง: sel = "แถว:คอลัมน์"
  const [sel, setSel] = useState<string>('');
  const [touched, setTouched] = useState(false);

  if (state === 'upcoming') {
    return <p className="text-[12.5px] text-slate-400">ยังไม่ถึงขั้นนี้ — จะปิดงานได้เมื่อผ่านขั้นก่อนหน้า</p>;
  }
  if (state === 'done') {
    return <p className="text-[12.5px] text-emerald-700">ปิดงานแล้ว</p>;
  }

  const [selRow, selCol] = sel ? sel.split(':').map(Number) : [-1, -1];
  const blocked = sel === '';

  const submit = () => {
    setTouched(true);
    if (blocked) return;
    onSubmit?.(
      { code: 'close', label: 'ปิดงาน', style: 'success', requireNote: false, requiredFields: [] },
      cleanFieldValues({ caseNo: String(selRow + 1), kpi: KPI_RESULTS[selCol] }) ?? {}
    );
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-separate border-spacing-0 text-[12px]">
          <thead>
            <tr className="text-slate-600">
              <th className="border-b border-gray-200 px-2 py-2 text-left font-semibold">กรณี / รายละเอียด</th>
              {KPI_RESULTS.map((res) => (
                <th key={res} className="w-20 border-b border-gray-200 px-1 py-2 text-center font-semibold">
                  {res}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {KPI_CASES.map((desc, row) => (
              <tr key={row}>
                <td className="border-b border-gray-100 px-2 py-2 align-top text-gray-800">
                  <span className="mono mr-1.5 text-slate-400">{row + 1}</span>
                  {desc}
                </td>
                {KPI_RESULTS.map((res, col) => (
                  <td key={col} className="border-b border-gray-100 px-1 py-2 text-center align-top">
                    <input
                      type="radio"
                      name="kpi-matrix"
                      checked={selRow === row && selCol === col}
                      disabled={pending}
                      onChange={() => setSel(`${row}:${col}`)}
                      className="h-4 w-4 cursor-pointer accent-accent"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {touched && blocked && (
        <p className="mt-2 text-[11.5px] font-semibold text-rose-600">เลือกผล KPI 1 ช่องก่อนปิดงาน</p>
      )}

      <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-4">
        <button
          type="button"
          disabled={pending || !onSubmit}
          onClick={submit}
          className="rounded-lg border border-emerald-600 bg-emerald-600 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          ปิดงาน
        </button>
      </div>
    </div>
  );
}

// ── Tab General — ข้อมูลเรื่องที่แจ้งเข้ามา ────────────────────
// เลขใบ / ผู้แจ้ง / หน่วยงาน / เบอร์ / ชื่อคอม / รายละเอียด / รูป / ผู้อนุมัติ(MGR)+เวลา
function GeneralPanel({
  item,
  full,
  attachments,
  approveLogs,
}: {
  item: RequestListItem;
  full: RequestListItem;
  attachments: RequestAttachment[] | null;
  approveLogs: RequestLog[];
}) {
  const imgs = attachments ?? [];
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-4">
      <DetailRow label="เลขใบแจ้งเรื่อง">
        <span className="mono font-semibold text-gray-900">{item.docNo}</span>
      </DetailRow>
      <DetailRow label="ผู้แจ้งเรื่อง">{full.requestBy || '—'}</DetailRow>
      <DetailRow label="หน่วยงาน">{full.departmentName || '—'}</DetailRow>
      <DetailRow label="เบอร์ติดต่อ">{full.phoneNumber || '—'}</DetailRow>
      <DetailRow label="ชื่อคอมพิวเตอร์">{full.comName || '—'}</DetailRow>

      <div className="col-span-2">
        <span className="mb-1 block text-[11.5px] font-semibold text-gray-500">รายละเอียดเรื่องที่แจ้ง</span>
        <div className="rounded-lg border border-gray-200 bg-slate-50 px-3.5 py-3 text-[13px] leading-relaxed text-gray-800">
          <span className="whitespace-pre-wrap">{full.detail || '— (ผู้แจ้งไม่ได้กรอกรายละเอียด)'}</span>
        </div>
      </div>

      {/* รูปภาพ (ถ้ามี) — url ยังเป็น null (ระบบยังไม่มีที่เสิร์ฟไฟล์) จึงโชว์ชื่อไฟล์ไปก่อน
          พอ backend ส่ง url มา จะเรนเดอร์เป็นรูปจริงเอง */}
      <div className="col-span-2">
        <span className="mb-1.5 block text-[11.5px] font-semibold text-gray-500">รูปภาพ</span>
        {imgs.length === 0 ? (
          <span className="text-[13px] text-slate-400">— ไม่มีรูปแนบ</span>
        ) : (
          <div className="flex flex-wrap gap-2">
            {imgs.map((f) =>
              f.url ? (
                <a key={f.fileId} href={f.url} target="_blank" rel="noreferrer" className="block">
                  <img
                    src={f.url}
                    alt={f.fileName}
                    className="h-24 w-24 rounded-lg border border-gray-200 object-cover transition hover:opacity-90"
                  />
                </a>
              ) : (
                <span
                  key={f.fileId}
                  title="ยังแสดงรูปไม่ได้ (ระบบยังไม่มีที่เสิร์ฟไฟล์)"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-slate-50 px-2.5 py-1.5 text-[12px] text-gray-700"
                >
                  <IconPaperclip size={13} className="shrink-0 text-slate-400" />
                  {f.fileName}
                </span>
              )
            )}
          </div>
        )}
      </div>

      {/* ชื่อ MGR ที่อนุมัติ พร้อมวันเวลา — จาก logs (action = approve)
          workflow ที่อนุมัติหลายรอบ (เช่น PS) จะขึ้นครบทุกคน */}
      <div className="col-span-2">
        <span className="mb-1.5 block text-[11.5px] font-semibold text-gray-500">ผู้อนุมัติ (MGR)</span>
        {approveLogs.length === 0 ? (
          <span className="text-[13px] text-slate-400">— ยังไม่มีการอนุมัติ</span>
        ) : (
          <div className="flex flex-col gap-1.5">
            {approveLogs.map((l, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[12.5px]"
              >
                <IconCircleCheck size={15} className="shrink-0 text-emerald-600" />
                <span className="font-semibold text-gray-800">{l.actionByName || '—'}</span>
                {l.actionByDepartment && <span className="text-slate-500">· {l.actionByDepartment}</span>}
                {l.actionDate && <span className="mono ml-auto text-slate-500">{fmtDateTime(l.actionDate)}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
