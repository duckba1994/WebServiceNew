import { useEffect, useRef, useState } from 'react';
import { RequestAction, RequestActionResult, RequestListItem } from '../../types/requestList';
import { ActionFieldValues } from '../../data/requestActionFields';
import {
  HR_PR_REPAIR_STATUSES,
  HR_PR_STATUS_NOT_STARTED,
  HrServiceForm,
  toHrServiceFields,
  toHrServiceForm,
  validateHrServiceForm,
} from '../../data/hrServiceForm';
import { fmtDate, fmtDateTime } from '../../data/requestListData';
import { actionBtnClass } from './RequestActionDialog';

const INPUT =
  'w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-[13px] text-gray-800 dark:text-slate-100 outline-none focus:border-accent disabled:bg-slate-100 dark:disabled:bg-slate-800';
const LABEL = 'mb-1 block text-[12px] font-semibold text-gray-600 dark:text-slate-300';

// ── ขั้นดำเนินการของใบ HR-PR (WFStatus = Service And Close-Job) ──
// สองปุ่มยิงเส้นเดียวกัน ต่างกันที่ผลลัพธ์:
//   saveService = บันทึกความคืบหน้า กดซ้ำได้ ไม่เลื่อนขั้น ไม่ประทับชื่อ/วันที่
//   service     = ดำเนินการเสร็จ — ใบแบบ 3 ขั้นปิดทันที ใบแบบ 4 ขั้นวนไปให้ผู้แจ้งรับงาน
// ปุ่มทั้งคู่หิ้วค่าจากฟอร์มไปด้วย จึงวาดเองในแผงนี้ (panelCodes) ไม่ใช่บล็อกปุ่มมาตรฐาน
export function HrServicePanel({
  item,
  actions,
  pending,
  onSubmit,
}: {
  item: RequestListItem;
  actions: RequestAction[];
  pending: boolean;
  onSubmit?: (action: RequestAction, fields: ActionFieldValues) => Promise<RequestActionResult | null | void>;
}) {
  const [form, setForm] = useState(() => toHrServiceForm(item));
  const [error, setError] = useState<string | null>(null);
  const dirty = useRef(false);
  const submitting = useRef(false);
  const [busy, setBusy] = useState(false);

  const save = actions.find((a) => a.code === 'saveService');
  const done = actions.find((a) => a.code === 'service');
  const editable = !!onSubmit && !!(save || done) && item.phase !== 'closed' && item.phase !== 'cancelled';
  const locked = !editable || pending || busy;
  const resolution = item.resolution;

  // ใบขยับแล้วดึงค่าใหม่มาแสดง — แต่ห้ามทับสิ่งที่ผู้ใช้กำลังพิมพ์ค้างไว้
  useEffect(() => {
    if (!dirty.current || !editable) setForm(toHrServiceForm(item));
  }, [item, editable]);

  const set = (key: keyof HrServiceForm, value: string) => {
    dirty.current = true;
    setForm((previous) => ({ ...previous, [key]: value }));
    setError(null);
  };

  const submit = async (action: RequestAction) => {
    if (locked || submitting.current || !onSubmit) return;
    const message = validateHrServiceForm(form, action.code === 'service');
    setError(message);
    if (message) return;
    submitting.current = true;
    setBusy(true);
    try {
      const result = await onSubmit(action, toHrServiceFields(form));
      if (result) {
        dirty.current = false;
        setForm(toHrServiceForm(result.item));
      }
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };

  // ค่าเดิมที่ไม่มีในรายการแล้ว ต้องยังโชว์เป็นตัวเลือกที่เลือกอยู่
  const statuses = HR_PR_REPAIR_STATUSES.includes(form.repairStatus) || !form.repairStatus
    ? HR_PR_REPAIR_STATUSES
    : [form.repairStatus, ...HR_PR_REPAIR_STATUSES];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="hr-service-status" className={LABEL}>
            สถานะการดำเนินการ {editable && <span className="text-rose-600">*</span>}
          </label>
          <select
            id="hr-service-status"
            className={`${INPUT} cursor-pointer`}
            value={form.repairStatus}
            disabled={locked}
            onChange={(e) => set('repairStatus', e.target.value)}
          >
            <option value="">— เลือก —</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-gray-500 dark:text-slate-400">
            “{HR_PR_STATUS_NOT_STARTED}” บันทึกความคืบหน้าได้ แต่ปิดขั้นดำเนินการไม่ได้
          </p>
        </div>
        <div>
          <label htmlFor="hr-service-by" className={LABEL}>ผู้ดำเนินการ</label>
          <input
            id="hr-service-by"
            className={INPUT}
            value={resolution?.servicedBy ?? ''}
            placeholder="ระบบระบุผู้กดเมื่อดำเนินการเสร็จ"
            readOnly
          />
        </div>
        <div>
          <label htmlFor="hr-service-date" className={LABEL}>วันที่</label>
          <input
            id="hr-service-date"
            className={`${INPUT} mono`}
            value={
              resolution?.servicedDate
                ? fmtDateTime(resolution.servicedDate)
                : editable
                ? fmtDate(new Date().toISOString())
                : '—'
            }
            readOnly
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="hr-service-detail" className={LABEL}>รายละเอียดผลการดำเนินการ</label>
          <textarea
            id="hr-service-detail"
            className={`${INPUT} resize-y`}
            rows={4}
            maxLength={500}
            value={form.serviceDetail}
            disabled={locked}
            onChange={(e) => set('serviceDetail', e.target.value)}
          />
          <p className="mt-1 text-[11px] text-gray-500 dark:text-slate-400">{form.serviceDetail.length}/500 ตัวอักษร</p>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="hr-service-remark" className={LABEL}>หมายเหตุ</label>
          <textarea
            id="hr-service-remark"
            className={`${INPUT} resize-y`}
            rows={3}
            maxLength={500}
            value={form.remark}
            disabled={locked}
            onChange={(e) => set('remark', e.target.value)}
          />
          <p className="mt-1 text-[11px] text-gray-500 dark:text-slate-400">{form.remark.length}/500 ตัวอักษร</p>
        </div>
      </div>
      {error && (
        <p role="alert" className="text-[12px] text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {editable && (
        <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 dark:border-slate-800 pt-4">
          {save && (
            <button
              type="button"
              disabled={locked}
              className={`rounded-lg border px-4 py-2 text-[13px] font-semibold disabled:opacity-50 ${actionBtnClass(save.style)}`}
              onClick={() => void submit(save)}
            >
              {save.label}
            </button>
          )}
          {done && (
            <button
              type="button"
              disabled={locked}
              className={`rounded-lg border px-4 py-2 text-[13px] font-semibold disabled:opacity-50 ${actionBtnClass(done.style)}`}
              onClick={() => void submit(done)}
            >
              ดำเนินการเสร็จ
            </button>
          )}
          <span className="text-[11px] text-gray-500 dark:text-slate-400">บันทึกแก้ไขได้จนกว่าจะกดดำเนินการเสร็จ</span>
        </div>
      )}
    </div>
  );
}
