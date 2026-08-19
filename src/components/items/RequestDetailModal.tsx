import React from 'react';
import {
  IconX,
  IconFilePlus,
  IconInbox,
  IconTool,
  IconCircleCheck,
  IconBan,
  IconBell,
} from '@tabler/icons-react';
import { RequestAction, RequestListItem } from '../../types/requestList';
import { fmtDate, fmtDateTime, jobStatusMeta, stepText } from '../../data/requestListData';
import { PHASE_META, phaseOf, phaseLabel, isRequesterSide } from '../../data/requestPhase';
import { actionBtnClass } from './RequestActionDialog';
import { fieldSpec } from '../../data/requestActionFields';

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

// สร้าง timeline จาก resolution ที่ API ส่งมา (ไม่ใช่ข้อมูลจำลอง)
// แสดงเฉพาะขั้นที่มีวันที่จริง — ขั้นที่ยังไม่เกิดจะไม่ถูกแสดง
function buildTimeline(item: RequestListItem) {
  const r = item.resolution;
  const steps: { icon: typeof IconInbox; color: string; bg: string; label: string; by: string | null; at: string | null }[] = [
    { icon: IconFilePlus, color: '#475569', bg: '#f1f5f9', label: 'แจ้งเรื่อง', by: item.requestBy, at: item.requestDate },
  ];
  if (!r) return steps;
  if (r.receivedDate || r.receivedBy)
    steps.push({ icon: IconInbox, color: '#0e7490', bg: '#ecfeff', label: 'รับเรื่อง', by: r.receivedBy, at: r.receivedDate });
  if (r.servicedDate || r.servicedBy)
    steps.push({ icon: IconTool, color: '#b45309', bg: '#fffbeb', label: 'ดำเนินการซ่อม/แก้ไข', by: r.servicedBy, at: r.servicedDate });
  if (r.closedDate || r.closedBy)
    steps.push({ icon: IconCircleCheck, color: '#047857', bg: '#ecfdf5', label: 'ปิดงาน', by: r.closedBy, at: r.closedDate });
  if (r.cancelledDate || r.cancelledBy)
    steps.push({ icon: IconBan, color: '#9f1239', bg: '#fff1f2', label: 'ยกเลิกรายการ', by: r.cancelledBy, at: r.cancelledDate });
  return steps;
}

// ── รายละเอียดใบแจ้งเรื่อง ─────────────────────────────────────
// ปุ่มท้ายหน้ามาจาก item.availableActions ที่ API ส่งมา ไม่ได้ฝังไว้ในโค้ด
// → แผนกใหม่มีปุ่มอะไร หน้านี้ขึ้นให้เองโดยไม่ต้องแก้อะไร
export function RequestDetailModal({
  item,
  onClose,
  onPickAction,
  actionPending,
}: {
  item: RequestListItem;
  onClose: () => void;
  onPickAction?: (action: RequestAction) => void; // ไม่ส่งมา = อ่านอย่างเดียว
  actionPending?: boolean;
}) {
  const actions = onPickAction ? item.availableActions ?? [] : [];
  const status = jobStatusMeta(item);
  const timeline = buildTimeline(item);
  const r = item.resolution;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="backdrop-fade-in absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <div className="modal-pop relative flex max-h-[92vh] w-[min(720px,96vw)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center gap-3.5 border-b border-gray-200 bg-white px-5 py-4">
          <div className="min-w-0">
            <div className="mono text-xs text-slate-400">เลขที่ใบแจ้ง</div>
            <div className="mono truncate text-base font-bold text-gray-900">{item.docNo}</div>
          </div>
          <button
            onClick={onClose}
            className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white transition hover:bg-slate-100"
            aria-label="ปิด"
          >
            <IconX size={18} className="text-slate-700" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 bg-slate-50 px-5 py-3">
          <span className="mono rounded-md border border-gray-200 bg-white px-2 py-0.5 text-[11.5px] font-bold text-slate-700">
            {item.module}
          </span>
          {/* จังหวะงานแบบข้ามแผนก + สถานะตามที่แผนกนั้นเรียก */}
          <Pill meta={{ ...PHASE_META[phaseOf(item)], label: phaseLabel(item) }} />
          <Pill meta={status} dot />
          {(item.isMyTurn || isRequesterSide(item)) && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[11.5px] font-bold text-amber-700">
              <IconBell size={13} />
              {isRequesterSide(item) ? 'รอแผนกผู้แจ้งลงมือ' : 'ถึงคิวแผนกเรา'}
            </span>
          )}
          {item.wfStep !== null && (
            <span className="rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-[11.5px] font-semibold text-slate-500">
              ขั้นที่ <span className="mono">{stepText(item)}</span>
              {item.wfStepName ? ` · ${item.wfStepName}` : ''}
            </span>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-x-5 gap-y-4 px-5 py-5">
            <DetailRow label="ผู้แจ้ง">{item.requestBy || '—'}</DetailRow>
            <DetailRow label="แผนกผู้แจ้ง">{item.departmentName || '—'}</DetailRow>
            <DetailRow label="วันที่แจ้ง">{fmtDate(item.requestDate) || '—'}</DetailRow>
            {/* ใบที่ปิดแล้วจะไม่มีแผนกที่ถืองาน (null) */}
            <DetailRow label="อยู่ที่แผนก">{item.currentDepartmentName || '— (ปิดงานแล้ว)'}</DetailRow>
            <div className="col-span-2">
              <DetailRow label="ขั้นตอนปัจจุบัน">{item.description || '—'}</DetailRow>
            </div>
            {/* เรื่องที่ผู้แจ้งขอมา — เน้นไว้เพราะเป็นสิ่งที่คนอนุมัติต้องอ่านก่อนตัดสินใจ
                (ไม่มีปุ่มลัดในตารางแล้ว ทุกการอนุมัติต้องเปิดมาอ่านตรงนี้) */}
            <div className="col-span-2">
              <span className="mb-1 block text-[11.5px] font-semibold text-gray-500">รายละเอียดที่แจ้ง</span>
              <div className="rounded-lg border border-gray-200 bg-slate-50 px-3.5 py-3 text-[13px] leading-relaxed text-gray-800">
                <span className="whitespace-pre-wrap">{item.detail || '— (ผู้แจ้งไม่ได้กรอกรายละเอียด)'}</span>
              </div>
            </div>
          </div>

          {/* ผลการแก้ไข — มีเมื่อเรื่องเริ่มเดินแล้ว */}
          {r && (r.repairStatus || r.solution || r.resolutionDetail) && (
            <div className="border-t border-gray-100 px-5 py-5">
              <h4 className="mb-3 text-[12.5px] font-bold text-gray-700">ผลการดำเนินการ</h4>
              <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                <DetailRow label="สถานะการซ่อม">{r.repairStatus || '—'}</DetailRow>
                <DetailRow label="วิธีแก้ไข">{r.solution || '—'}</DetailRow>
                <div className="col-span-2">
                  <DetailRow label="รายละเอียดการแก้ไข">
                    <span className="whitespace-pre-wrap">{r.resolutionDetail || '—'}</span>
                  </DetailRow>
                </div>
              </div>
            </div>
          )}

          {/* timeline จากวันที่จริงใน resolution */}
          <div className="border-t border-gray-100 px-5 py-5">
            <h4 className="mb-3 text-[12.5px] font-bold text-gray-700">ประวัติการดำเนินการ</h4>
            <ol className="flex flex-col">
              {timeline.map((s, i) => {
                const Icon = s.icon;
                const last = i === timeline.length - 1;
                return (
                  <li key={s.label} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                        style={{ background: s.bg, color: s.color }}
                      >
                        <Icon size={15} />
                      </span>
                      {!last && <span className="w-px flex-1 bg-gray-200" />}
                    </div>
                    <div className={`min-w-0 ${last ? 'pb-0' : 'pb-4'}`}>
                      <div className="text-[13px] font-semibold text-gray-800">{s.label}</div>
                      <div className="text-[11.5px] text-slate-500">
                        {s.by || '—'}
                        {s.at && (
                          <>
                            {' · '}
                            <span className="mono">{fmtDateTime(s.at)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>

        {/* ปุ่มดำเนินการ — [] = ตอนนี้ผู้ใช้คนนี้กดอะไรกับใบนี้ไม่ได้ (ไม่ใช่คิวเรา /
            สิทธิ์ไม่ถึง / ใบปิดแล้ว) API เป็นคนตัดสิน หน้าเว็บแค่เรนเดอร์ตามที่ได้รับ */}
        {actions.length > 0 && (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-gray-200 bg-slate-50 px-5 py-3">
            {actions.map((a) => {
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
      </div>
    </div>
  );
}
