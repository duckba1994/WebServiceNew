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
import { RequestListItem } from '../../types/requestList';
import { fmtDate, fmtDateTime, jobStatusMeta } from '../../data/requestListData';

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

// ── รายละเอียดใบแจ้งเรื่อง (อ่านอย่างเดียว) ────────────────────
// ยังไม่มีปุ่มดำเนินการ เพราะ Requests API ตอนนี้มีแค่ endpoint ดึงรายการ
// (ยังไม่มี endpoint รับเรื่อง/อนุมัติ/ปิดงาน — ดู API_SPEC_REQUEST_FLOW.md §4.3)
export function RequestDetailModal({
  item,
  onClose,
}: {
  item: RequestListItem;
  onClose: () => void;
}) {
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
          <Pill meta={status} dot />
          {item.isMyTurn && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[11.5px] font-bold text-amber-700">
              <IconBell size={13} />
              ถึงคิวแผนกเรา
            </span>
          )}
          {item.wfStep !== null && (
            <span className="mono rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-[11.5px] font-semibold text-slate-500">
              step {item.wfStep}
              {item.wfStatus ? ` · ${item.wfStatus}` : ''}
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
            <div className="col-span-2">
              <DetailRow label="รายละเอียดที่แจ้ง">
                <span className="whitespace-pre-wrap">{item.detail || '—'}</span>
              </DetailRow>
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
      </div>
    </div>
  );
}
