import React, { useEffect, useMemo, useRef, useState } from 'react';
import { RequestAction } from '../../types/requestList';
import { ActionFieldValues, cleanFieldValues } from '../../data/requestActionFields';
import { usePsRequest } from '../../hooks/usePsRequest';
import { usePsServiceOptions } from '../../hooks/usePsServiceOptions';
import { SearchSelect } from '../ui/SearchSelect';
import { DateQuickPick } from '../ui/DateQuickPick';
import { actionBtnClass } from './RequestActionDialog';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { INPUT_CLS } from '../ui/FormControls';

const INPUT = `${INPUT_CLS} w-full disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-slate-800`;
const LABEL = 'mb-1 block text-[11.5px] font-semibold text-gray-500 dark:text-slate-400';

interface Form {
  repairStatus: string; workResults: string; rpDetailId: string; remark: string;
  exPrNo: string; supplier: string; exPoNo: string; leadTime: string;
  serviceBy: string; changeDate: string; otherRemark: string;
}

const emptyForm = (name: string): Form => ({ repairStatus: '', workResults: '', rpDetailId: '', remark: '',
  exPrNo: '', supplier: '', exPoNo: '', leadTime: '', serviceBy: name, changeDate: '', otherRemark: '' });

export function PsServicePanel({ docNo, token, refreshKey, userName, actions, pending, onSubmit }: {
  docNo: string; token?: string; refreshKey: string; userName: string;
  actions: RequestAction[]; pending: boolean;
  onSubmit?: (action: RequestAction, fields: ActionFieldValues) => void | Promise<void>;
}) {
  const { doc, error: docError, reload } = usePsRequest(docNo, token, refreshKey);
  const options = usePsServiceOptions(docNo, token);
  const [form, setForm] = useState<Form>(() => emptyForm(userName));
  const [error, setError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const dirty = useRef(false);
  const busy = useRef(false);
  const save = actions.find(a => a.code === 'saveService');
  const done = actions.find(a => a.code === 'service');
  const editable = !!onSubmit && !!(save || done);
  const locked = pending || submitting || !editable;
  const canComplete = form.workResults.trim() === 'จัดการเรียบร้อย';

  useEffect(() => {
    if (!doc || dirty.current) return;
    const service = doc.service ?? {};
    setForm({
      repairStatus: service.action ?? '', workResults: service.workResults ?? '',
      rpDetailId: doc.reportStatus?.rpDetailId ?? '', remark: service.remark ?? '',
      exPrNo: service.refPR ?? '', supplier: service.supplier ?? '', exPoNo: service.refPO ?? '',
      leadTime: service.leadTime == null ? '' : String(service.leadTime),
      serviceBy: service.serviceBy ?? userName, changeDate: service.changeDate?.slice(0, 10) ?? '',
      otherRemark: service.otherRemark ?? '',
    });
  }, [doc, userName]);

  const actionOptions = useMemo(() => options.actions.map(value => ({ value, label: value })), [options.actions]);
  const resultOptions = useMemo(() => options.workResults.map(value => ({ value, label: value })), [options.workResults]);
  const statusOptions = useMemo(() => {
    const values = (options.report?.details ?? [])
      .map(detail => ({ value: detail.rpDetailId, label: detail.rpDetailName || 'ไม่ระบุรายละเอียด' }));
    const current = doc?.reportStatus;
    if (current?.rpDetailId && !values.some(option => option.value === current.rpDetailId))
      values.push({ value: current.rpDetailId, label: current.rpDetailName || current.rpDetailId });
    return values;
  }, [doc?.reportStatus, options.report]);

  const set = (key: keyof Form, value: string) => {
    dirty.current = true; setForm(previous => ({ ...previous, [key]: value })); setError('');
  };
  const fields = (): ActionFieldValues => cleanFieldValues({
    repairStatus: form.repairStatus, workResults: form.workResults,
    // PS service validates this against the current form group before advancing.
    rpDetailId: form.rpDetailId,
    remark: form.remark, exPrNo: form.exPrNo, supplier: form.supplier, exPoNo: form.exPoNo,
    ...(form.leadTime === '' ? {} : { leadTime: Number(form.leadTime) }),
    serviceBy: form.serviceBy, changeDate: form.changeDate, otherRemark: form.otherRemark,
  }) ?? {};
  const submit = async (action: RequestAction) => {
    if (locked || busy.current || !onSubmit) return;
    if (action.code === 'service' && !canComplete) return;
    if (form.leadTime && (!/^\d+$/.test(form.leadTime) || Number(form.leadTime) < 0)) {
      setError('ระยะเวลา (วัน) ต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป'); return;
    }
    busy.current = true; setSubmitting(true); setError(''); setConfirmOpen(false);
    try { await onSubmit(action, fields()); dirty.current = false; }
    finally { busy.current = false; setSubmitting(false); }
  };
  const select = (label: string, value: string, options: { value: string; label: string }[], onChange: (value: string) => void, unavailable: boolean) =>
    <div><label className={LABEL}>{label}</label><SearchSelect value={value} options={options} disabled={locked || unavailable} onChange={onChange} /></div>;

  if (!doc) return <div role="status" className="text-sm text-slate-500">{docError ?? 'กำลังโหลดข้อมูลดำเนินการ PS…'}{docError && <button className="ml-2 text-accent" onClick={reload}>ลองใหม่</button>}</div>;
  return <div className="space-y-4">
    {Object.entries(options.errors).map(([source, message]) => <p key={source} role="alert" className="text-xs text-rose-600">{message} <button className="underline" onClick={options.reload}>ลองใหม่</button></p>)}
    <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
      {select('ดำเนินการโดย', form.repairStatus, actionOptions, value => set('repairStatus', value), options.loading || !!options.errors.actions)}
      {select('ผลการดำเนินการ', form.workResults, resultOptions, value => set('workResults', value), options.loading || !!options.errors.workResults)}
      {select('Status งานค้าง', form.rpDetailId, statusOptions, value => set('rpDetailId', value), options.loading || !!options.errors.report || statusOptions.length === 0)}
      <div><label className={LABEL} htmlFor="ps-remark">Remark</label><input id="ps-remark" className={INPUT} maxLength={500} value={form.remark} disabled={locked} onChange={e => set('remark', e.target.value)} /></div>
      <div><label className={LABEL} htmlFor="ps-ref-pr">Referent PR.</label><input id="ps-ref-pr" className={`${INPUT} mono`} maxLength={20} value={form.exPrNo} disabled={locked} onChange={e => set('exPrNo', e.target.value)} /></div>
      <div><label className={LABEL} htmlFor="ps-supplier">Supplier Name</label><input id="ps-supplier" className={INPUT} maxLength={250} value={form.supplier} disabled={locked} onChange={e => set('supplier', e.target.value)} /></div>
      <div><label className={LABEL} htmlFor="ps-ref-po">Referent PO</label><input id="ps-ref-po" className={`${INPUT} mono`} maxLength={20} value={form.exPoNo} disabled={locked} onChange={e => set('exPoNo', e.target.value)} /></div>
      <div><label className={LABEL} htmlFor="ps-lead-time">ระยะเวลา (วัน)</label><input id="ps-lead-time" className={`${INPUT} mono`} type="number" min="0" step="1" inputMode="numeric" value={form.leadTime} disabled={locked} onChange={e => set('leadTime', e.target.value)} /></div>
      <div><label className={LABEL} htmlFor="ps-service-by">ผู้ดำเนินการ</label><input id="ps-service-by" className={INPUT} maxLength={50} value={form.serviceBy} disabled={locked} onChange={e => set('serviceBy', e.target.value)} /></div>
      <div><label className={LABEL}>วันที่เลื่อน</label><DateQuickPick value={form.changeDate} inputClass={INPUT} disabled={locked} onChange={value => set('changeDate', value)} /></div>
      <div className="sm:col-span-2"><label className={LABEL} htmlFor="ps-postpone-reason">สาเหตุที่เลื่อน</label><textarea id="ps-postpone-reason" className={`${INPUT} resize-y`} rows={3} maxLength={500} value={form.otherRemark} disabled={locked} onChange={e => set('otherRemark', e.target.value)} /></div>
    </div>
    {error && <p role="alert" className="text-xs font-semibold text-rose-600">{error}</p>}
    {editable && <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4 dark:border-slate-800">
      {save && <button type="button" disabled={locked} onClick={() => void submit(save)} className={`rounded-lg border px-4 py-2 text-[13px] font-semibold disabled:opacity-50 ${actionBtnClass(save.style)}`}>{save.label}</button>}
      {done && <button type="button" disabled={locked || !canComplete} onClick={() => setConfirmOpen(true)}
        title={!canComplete ? 'ต้องเลือกผลการดำเนินการเป็น “จัดการเรียบร้อย” ก่อน' : undefined}
        className={`rounded-lg border px-4 py-2 text-[13px] font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${actionBtnClass(done.style)}`}>{done.label}</button>}
    </div>}
    {confirmOpen && done && editable && canComplete && <ConfirmDialog title={`ยืนยัน${done.label}`} pending={locked}
      confirmClass={actionBtnClass(done.style)} onCancel={() => setConfirmOpen(false)} onConfirm={() => void submit(done)}>
      ต้องการยืนยันดำเนินการใบ <span className="mono font-semibold">{docNo}</span> ใช่หรือไม่?
    </ConfirmDialog>}
  </div>;
}
