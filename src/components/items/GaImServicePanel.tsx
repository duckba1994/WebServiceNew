import React, { useEffect, useMemo, useRef, useState } from 'react';
import { RequestAction, RequestActionResult, RequestListItem } from '../../types/requestList';
import { ActionFieldValues } from '../../data/requestActionFields';
import { DEPT_SERVICE_ACTIONS, DEPT_SERVICE_RESULTS, DeptServiceForm, toDeptServiceFields, toDeptServiceForm, validateDeptServiceForm } from '../../data/deptServiceForm';
import { fmtDate, fmtDateTime } from '../../data/requestListData';
import { SearchSelect } from '../ui/SearchSelect';
import { actionBtnClass } from './RequestActionDialog';

const INPUT = 'w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-[13px] text-gray-800 dark:text-slate-100 outline-none focus:border-accent disabled:bg-slate-100 dark:disabled:bg-slate-800';
const LABEL = 'mb-1 block text-[12px] font-semibold text-gray-600 dark:text-slate-300';

export function GaImServicePanel({ item, actions, pending, onSubmit }: {
  item: RequestListItem;
  actions: RequestAction[];
  pending: boolean;
  onSubmit?: (action: RequestAction, fields: ActionFieldValues) => Promise<RequestActionResult | null | void>;
}) {
  const [form, setForm] = useState(() => toDeptServiceForm(item));
  const [error, setError] = useState<string | null>(null);
  const dirty = useRef(false);
  const submitting = useRef(false);
  const [busy, setBusy] = useState(false);
  const isGa = item.module === 'GA';
  const save = actions.find((a) => a.code === 'saveService');
  const done = actions.find((a) => a.code === 'service');
  const editable = !!onSubmit && !!(save || done) && item.phase !== 'closed' && item.phase !== 'cancelled';
  const locked = !editable || pending || busy;
  const resolution = item.resolution;

  useEffect(() => {
    if (!dirty.current || !editable) setForm(toDeptServiceForm(item));
  }, [item, editable]);

  const actionOptions = useMemo(() => {
    const values = DEPT_SERVICE_ACTIONS[item.module] ?? [];
    return (form.repairStatus && !values.includes(form.repairStatus) ? [form.repairStatus, ...values] : values)
      .map((value) => ({ value, label: value }));
  }, [item.module, form.repairStatus]);
  const resultOptions = useMemo(() =>
    (form.workResults && !DEPT_SERVICE_RESULTS.includes(form.workResults) ? [form.workResults, ...DEPT_SERVICE_RESULTS] : DEPT_SERVICE_RESULTS)
      .map((value) => ({ value, label: value })), [form.workResults]);

  const set = (key: keyof DeptServiceForm, value: string) => {
    dirty.current = true;
    setForm((previous) => ({ ...previous, [key]: value }));
    setError(null);
  };
  const validate = (completing: boolean) => {
    const message = validateDeptServiceForm(item.module, form, completing);
    setError(message);
    return !message;
  };
  const submit = async (action: RequestAction) => {
    if (locked || submitting.current || !onSubmit || !validate(action.code === 'service')) return;
    submitting.current = true;
    setBusy(true);
    try {
      const result = await onSubmit(action, toDeptServiceFields(item.module, form));
      if (result) {
        dirty.current = false;
        setForm(toDeptServiceForm(result.item));
      }
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div><label className={LABEL}>ดำเนินการโดย</label><SearchSelect value={form.repairStatus} options={actionOptions} disabled={locked} onChange={(value) => set('repairStatus', value)} /></div>
        <div><label htmlFor="dept-service-pr" className={LABEL}>{isGa ? 'Referent PR.' : 'PR'}</label><input id="dept-service-pr" className={`${INPUT} mono`} value={form.exPrNo} maxLength={20} disabled={locked} onChange={(e) => set('exPrNo', e.target.value)} /></div>
        {isGa && <div><label htmlFor="dept-service-duration" className={LABEL}>ระยะเวลา (วัน)</label><input id="dept-service-duration" className={`${INPUT} mono`} inputMode="decimal" value={form.leadTime} disabled={locked} onChange={(e) => set('leadTime', e.target.value)} /><p className="mt-1 text-[11px] text-gray-500 dark:text-slate-400">0–100 วัน · เว้นว่างเพื่อคงค่าเดิม</p></div>}
        {(isGa || resolution?.servicedBy) && <div><label htmlFor="dept-service-by" className={LABEL}>ผู้ดำเนินการ</label><input id="dept-service-by" className={INPUT} value={resolution?.servicedBy ?? ''} placeholder="ระบบระบุผู้กดเมื่อดำเนินการเสร็จ" readOnly /></div>}
        <div><label htmlFor="dept-service-date" className={LABEL}>วันที่</label><input id="dept-service-date" className={`${INPUT} mono`} value={resolution?.servicedDate ? fmtDateTime(resolution.servicedDate) : editable ? fmtDate(new Date().toISOString()) : '—'} readOnly /></div>
        <div><label className={LABEL}>ผลการดำเนินงาน</label><SearchSelect value={form.workResults} options={resultOptions} disabled={locked} onChange={(value) => set('workResults', value)} /></div>
        <div className="sm:col-span-2"><label htmlFor="dept-service-remark" className={LABEL}>หมายเหตุ</label><textarea id="dept-service-remark" className={INPUT} rows={3} value={form.remark} maxLength={500} disabled={locked} onChange={(e) => set('remark', e.target.value)} /><p className="mt-1 text-[11px] text-gray-500 dark:text-slate-400">{form.remark.length}/500 ตัวอักษร</p></div>
      </div>
      {error && <p role="alert" className="text-[12px] text-red-600 dark:text-red-400">{error}</p>}
      {editable && <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 dark:border-slate-800 pt-4">
        {save && <button type="button" disabled={locked} className={`rounded-lg border px-4 py-2 text-[13px] font-semibold disabled:opacity-50 ${actionBtnClass(save.style)}`} onClick={() => void submit(save)}>{save.label}</button>}
        {done && <button type="button" disabled={locked} className={`rounded-lg border px-4 py-2 text-[13px] font-semibold disabled:opacity-50 ${actionBtnClass(done.style)}`} onClick={() => void submit(done)}>ดำเนินการเสร็จ</button>}
        <span className="text-[11px] text-gray-500 dark:text-slate-400">บันทึกแก้ไขได้จนกว่าจะดำเนินการเสร็จและปิดใบ</span>
      </div>}
    </div>
  );
}
