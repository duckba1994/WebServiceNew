import { useEffect, useRef, useState } from 'react';
import { RequestAction, RequestActionResult } from '../../types/requestList';
import { ActionFieldValues, cleanFieldValues } from '../../data/requestActionFields';
import { SqaRequestDetail } from '../../api/sqaRequest';
import { actionBtnClass } from './RequestActionDialog';

const INPUT = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] outline-none focus:border-accent dark:border-slate-700 dark:bg-slate-900';
const LABEL = 'mb-1 block text-[12px] font-semibold text-gray-600 dark:text-slate-300';

type Submit = (action: RequestAction, fields: ActionFieldValues) => Promise<RequestActionResult | null | void>;

export function SqaReceivePanel({ doc, actions, pending, onSubmit }: { doc: SqaRequestDetail | null; actions: RequestAction[]; pending: boolean; onSubmit?: Submit }) {
  const [value, setValue] = useState('');
  const [touched, setTouched] = useState(false);
  useEffect(() => setValue(doc?.requestService ?? ''), [doc?.requestService]);
  const action = actions.find((item) => item.code === 'receive');
  if (!action || !onSubmit) {
    return <div><div className={LABEL}>งานที่รับดำเนินการ</div><div className="rounded-lg border border-slate-200 p-3 text-[13px]">{doc?.requestService || '—'}</div></div>;
  }
  return (
    <div className="flex flex-col gap-4">
      <div><label className={LABEL}>งานที่รับดำเนินการ <span className="text-rose-600">*</span></label><input value={value} maxLength={100} disabled={pending} onChange={(e) => setValue(e.target.value)} className={INPUT} />{touched && !value.trim() && <div className="mt-1 text-[11px] font-semibold text-rose-600">กรุณาระบุงานที่รับดำเนินการ</div>}</div>
      <div className="border-t border-slate-100 pt-4"><button type="button" disabled={pending} onClick={() => { setTouched(true); if (!value.trim()) return; void onSubmit(action, cleanFieldValues({ requestService: value }) ?? {}); }} className={`rounded-lg border px-4 py-2 text-[13px] font-semibold ${actionBtnClass(action.style)}`}>{action.label}</button></div>
    </div>
  );
}

export function SqaServicePanel({ doc, actions, pending, onSubmit }: { doc: SqaRequestDetail | null; actions: RequestAction[]; pending: boolean; onSubmit?: Submit }) {
  const [serviceStd, setServiceStd] = useState('');
  const [serviceDetail, setServiceDetail] = useState('');
  const [servicePosition, setServicePosition] = useState('');
  const [touched, setTouched] = useState(false);
  const dirty = useRef(false);
  useEffect(() => {
    if (dirty.current) return;
    setServiceStd(doc?.serviceStd ?? '');
    setServiceDetail(doc?.serviceDetail ?? '');
    setServicePosition(doc?.servicePosition ?? '');
  }, [doc]);
  const save = actions.find((item) => item.code === 'saveService');
  const done = actions.find((item) => item.code === 'service');
  const editable = !!onSubmit && !!(save || done);
  const fields = () => cleanFieldValues({ serviceStd, serviceDetail, servicePosition }) ?? {};
  if (!editable) return (
    <div className="grid grid-cols-2 gap-4 text-[13px]"><div><div className={LABEL}>มาตรฐานการดำเนินการ</div>{doc?.serviceStd || '—'}</div><div><div className={LABEL}>ตำแหน่งผู้ดำเนินการ</div>{doc?.servicePosition || '—'}</div><div className="col-span-2"><div className={LABEL}>ผลการดำเนินการ</div><div className="rounded-lg border border-slate-200 p-3 whitespace-pre-wrap">{doc?.serviceDetail || '—'}</div></div></div>
  );
  const change = (setter: (value: string) => void) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { dirty.current = true; setter(e.target.value); };
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4"><div><label className={LABEL}>มาตรฐานการดำเนินการ</label><input value={serviceStd} disabled={pending} onChange={change(setServiceStd)} className={INPUT} /></div><div><label className={LABEL}>ตำแหน่งผู้ดำเนินการ</label><input value={servicePosition} disabled={pending} onChange={change(setServicePosition)} className={INPUT} /></div></div>
      <div><label className={LABEL}>ผลการดำเนินการ <span className="text-rose-600">*</span></label><textarea rows={6} value={serviceDetail} maxLength={1000} disabled={pending} onChange={change(setServiceDetail)} className={`${INPUT} resize-y`} />{touched && !serviceDetail.trim() && <div className="mt-1 text-[11px] font-semibold text-rose-600">กรุณากรอกผลการดำเนินการ</div>}</div>
      <div className="flex gap-2 border-t border-slate-100 pt-4">
        {save && <button type="button" disabled={pending} onClick={() => { dirty.current = false; void onSubmit?.(save, fields()); }} className={`rounded-lg border px-4 py-2 text-[13px] font-semibold ${actionBtnClass(save.style)}`}>{save.label}</button>}
        {done && <button type="button" disabled={pending} onClick={() => { setTouched(true); if (!serviceDetail.trim()) return; dirty.current = false; void onSubmit?.(done, fields()); }} className={`rounded-lg border px-4 py-2 text-[13px] font-semibold ${actionBtnClass(done.style)}`}>{done.label}</button>}
      </div>
    </div>
  );
}
