import { useEffect, useRef, useState } from 'react';
import { RequestAction, RequestResolution } from '../../types/requestList';
import { ActionFieldValues, cleanFieldValues } from '../../data/requestActionFields';
import { actionBtnClass } from './RequestActionDialog';

export function AfServicePanel({
  actions,
  resolution,
  pending,
  onSubmit,
}: {
  actions: RequestAction[];
  resolution?: RequestResolution | null;
  pending: boolean;
  onSubmit?: (action: RequestAction, fields: ActionFieldValues) => void | Promise<void>;
}) {
  const [serviceDetail, setServiceDetail] = useState('');
  const [attachRef, setAttachRef] = useState('');
  const [planCompleteDate, setPlanCompleteDate] = useState('');
  const [touched, setTouched] = useState(false);
  const dirty = useRef(false);

  useEffect(() => {
    if (dirty.current) return;
    setServiceDetail(resolution?.resolutionDetail ?? '');
    setAttachRef(resolution?.attachRef ?? '');
    setPlanCompleteDate(resolution?.planCompleteDate?.slice(0, 10) ?? '');
  }, [resolution]);

  const save = actions.find((action) => action.code === 'saveService');
  const done = actions.find((action) => action.code === 'service');
  const editable = (!!save || !!done) && !!onSubmit;
  const fields = (): ActionFieldValues =>
    cleanFieldValues({
      serviceDetail,
      attachRef,
      planCompleteDate: planCompleteDate ? `${planCompleteDate}T00:00:00` : '',
    }) ?? {};

  if (!editable) {
    return (
      <div className="grid grid-cols-2 gap-4 text-[12.5px]">
        <div className="col-span-2"><div className="mb-1 font-semibold text-slate-500">รายละเอียดการปิด</div><div className="rounded-lg border border-slate-200 p-3">{resolution?.resolutionDetail || '—'}</div></div>
        <div><div className="mb-1 font-semibold text-slate-500">เอกสารแนบการปิด</div>{resolution?.attachRef || '—'}</div>
        <div><div className="mb-1 font-semibold text-slate-500">วันที่ปิดเรื่อง</div>{resolution?.planCompleteDate?.slice(0, 10) || '—'}</div>
      </div>
    );
  }

  const input = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] outline-none focus:border-accent dark:border-slate-700 dark:bg-slate-800';
  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block text-[12px] font-semibold">รายละเอียดการปิด <span className="text-rose-600">*</span></label>
        <textarea rows={5} maxLength={100} value={serviceDetail} disabled={pending} onChange={(e) => { dirty.current = true; setServiceDetail(e.target.value); }} className={`${input} resize-y`} />
        <div className="mt-1 text-[11px] text-slate-400">{serviceDetail.length}/100 ตัวอักษร</div>
        {touched && !serviceDetail.trim() && <div className="mt-1 text-[11px] font-semibold text-rose-600">กรุณากรอกรายละเอียดการปิด</div>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="mb-1 block text-[12px] font-semibold">เอกสารแนบการปิด</label><input maxLength={100} value={attachRef} disabled={pending} onChange={(e) => { dirty.current = true; setAttachRef(e.target.value); }} className={input} /></div>
        <div>
          <label className="mb-1 block text-[12px] font-semibold">วันที่ปิดเรื่อง <span className="text-rose-600">*</span></label>
          <input type="date" value={planCompleteDate} disabled={pending} onChange={(e) => { dirty.current = true; setPlanCompleteDate(e.target.value); }} className={`${input} ${touched && !planCompleteDate ? 'border-rose-300 bg-rose-50/40 dark:border-rose-800' : ''}`} />
          {touched && !planCompleteDate && <div className="mt-1 text-[11px] font-semibold text-rose-600">กรุณาระบุวันที่ปิดเรื่อง</div>}
        </div>
      </div>
      <div className="flex gap-2 border-t border-slate-100 pt-4">
        {save && <button type="button" disabled={pending} onClick={() => { dirty.current = false; void onSubmit?.(save, fields()); }} className={`rounded-lg border px-4 py-2 text-[13px] font-semibold ${actionBtnClass(save.style)}`}>{save.label}</button>}
        {done && <button type="button" disabled={pending} onClick={() => { setTouched(true); if (!serviceDetail.trim() || !planCompleteDate) return; dirty.current = false; void onSubmit?.(done, fields()); }} className={`rounded-lg border px-4 py-2 text-[13px] font-semibold ${actionBtnClass(done.style)}`}>ดำเนินการเสร็จ</button>}
      </div>
    </div>
  );
}
