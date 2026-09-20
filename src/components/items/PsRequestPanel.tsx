import { useSessionDraft } from '../../hooks/useSessionDraft';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { IconUser, IconFileText, IconPaperclip, IconList, IconShieldCheck, IconPencil, IconDeviceFloppy, IconCircleCheck } from '@tabler/icons-react';
import { DetailRow, InfoCard } from './RequestInfoCard';
import { fmtDate, fmtDateTime } from '../../data/requestListData';
import { RequestLog } from '../../types/requestList';
import { RequestLinesTable } from './RequestLinesTable';
import { PsRequestDetail, updatePsRequest } from '../../api/psRequest';
import { apiErrorText } from '../../api/client';
import { usePsRequest } from '../../hooks/usePsRequest';
import { useDeptMasterData } from '../../hooks/useDeptMasterData';
import { prelimToFields, usePsPrelims } from '../../hooks/usePsPrelims';
import { DEPT_FORMS, PS_ATTACH } from '../../data/requestForm';
import { fromPsAttachment, toPsAttachment, toPsUpdate } from '../../data/psRequestForm';
import { SearchSelect } from '../ui/SearchSelect';
import { DateQuickPick } from '../ui/DateQuickPick';
import { PsQuoteAttachmentTable } from '../ui/PsQuoteAttachmentTable';
import { INPUT_CLS } from '../ui/FormControls';
import { useAuthedImage } from '../../hooks/useAuthedImage';

function Photo({ url, name, token }: { url: string | null; name: string; token?: string }) {
  const src = useAuthedImage(url, token);
  return src ? <a href={src} target="_blank" rel="noreferrer"><img src={src} alt={name} className="max-h-56 rounded-lg" /></a> : <span>{name}</span>;
}

export function PsRequestPanel({ docNo, token, refreshKey, allowEdit, onSaved, onEditingChange, toolbar, departmentName, approveLogs = [] }: {
  docNo: string; token?: string; refreshKey: string; allowEdit: boolean;
  onSaved: () => Promise<void>; onEditingChange: (value: boolean) => void;
  toolbar?: HTMLElement | null; departmentName?: string | null; approveLogs?: RequestLog[];
}) {
  const { doc, error, reload } = usePsRequest(docNo, token, refreshKey);
  const master = useDeptMasterData('ps', token);
  const prelims = usePsPrelims(token, true);
  const [draft, setDraft] = useSessionDraft<PsRequestDetail | null>('PsRequestPanel.draft', null);
  const [editing, setEditing] = useSessionDraft('PsRequestPanel.editing', false);
  const [pending, setPending] = useState(false);
  const [prelimPending, setPrelimPending] = useState(false);
  const [prelimError, setPrelimError] = useSessionDraft('PsRequestPanel.prelimError', false);
  const [prelimFields, setPrelimFields] = useSessionDraft<Record<string, string> | null>('PsRequestPanel.prelimFields', null);
  const [notice, setNotice] = useState('');
  const version = useRef(0);
  const previousDocument = useRef(`${docNo}|${refreshKey}`);
  useEffect(() => {
    const identity = `${docNo}|${refreshKey}`;
    if (previousDocument.current === identity) return;
    previousDocument.current = identity;
    setDraft.reset(null); setEditing.reset(false); setPrelimFields.reset(null);
    setPrelimPending(false); setPrelimError(false); ++version.current;
  }, [docNo, refreshKey, setDraft, setEditing, setPrelimFields, setPrelimError]);
  useEffect(() => { onEditingChange(editing); }, [editing, onEditingChange]);
  const current = draft ?? doc;
  if (!current) return <div role="status">{error ?? 'กำลังโหลดข้อมูลใบแจ้งเรื่อง PS…'}{error && <button onClick={reload}>ลองใหม่</button>}</div>;
  const general = editing && allowEdit && doc?.canEdit === true && !pending;
  const attachment = editing && allowEdit && doc?.canEditAttachment === true && !pending;
  const f = current.form;
  const set = (key: string, value: unknown) => setDraft(prev => ({ ...(prev ?? current), form: { ...(prev ?? current).form, [key]: value } }));
  const field = (label: string, child: React.ReactNode) => <label key={label} className="flex min-w-0 flex-col gap-1"><span className="text-[11.5px] font-semibold text-gray-500 dark:text-slate-400">{label}</span>{child}</label>;
  const text = (key: keyof typeof f, label: string, maxLength?: number, editable = general) => field(label,
    editing && editable ? <input className={INPUT_CLS} value={String(f[key] ?? '')} maxLength={maxLength} onChange={e => set(key, e.target.value)} /> : <span className="text-[13px] font-normal text-gray-800 dark:text-slate-100">{String(f[key] ?? '') || '—'}</span>);
  const select = (key: 'type' | 'requestType', label: string, options: { value: string; label: string }[]) => !editing ? <DetailRow key={key} label={label}>{f[key] || '—'}</DetailRow> : field(label,
    <SearchSelect value={f[key]} options={options.some(o => o.value === f[key]) ? options : [...options, { value: f[key], label: f[key] }]} disabled={!general || master.loading || !!master.error} onChange={value => set(key, value)} />);
  const date = (key: 'planDate' | 'priceDate' | 'planPrice', label: string) => field(label, general
    ? <DateQuickPick value={(f[key] ?? '').slice(0, 10)} inputClass={INPUT_CLS} onChange={value => set(key, value ? `${value}T00:00:00` : '')} />
    : <span className="text-[13px] font-normal text-gray-800 dark:text-slate-100">{fmtDate(f[key]) || '—'}</span>);
  const save = async () => {
    if (!allowEdit || !doc || pending || prelimPending || prelimError || (doc.canEdit !== true && doc.canEditAttachment !== true)) return;
    if (doc.canEdit === true && (!f.type || !f.requestType || !f.requestDetail.trim() || f.requestDetail.length > 500 || !f.planDate || !f.priceDate)) {
      setNotice('กรุณาระบุประเภท เรื่องที่แจ้ง รายละเอียด (ไม่เกิน 500 ตัวอักษร) และวันที่ต้องการ/วันที่ขอราคา'); return;
    }
    if (doc.canEdit === true && current.lines.some(l => !l.item.trim() || !(Number(l.qty) > 0))) { setNotice('กรุณาระบุรายการและจำนวนมากกว่า 0'); return; }
    if (doc.canEdit === true && doc.form.planPrice && !f.planPrice) { setNotice('backend ยังไม่รองรับการล้างวันที่กำหนดประเมินราคา'); return; }
    if (doc.canEditAttachment === true && ((f.attachSpec && !f.budgetDocNo?.trim()) || (f.attachQuatation && !f.exBudgetDocNo?.trim()))) { setNotice('กรุณาระบุเลขที่รายละเอียด/Spec และเลขที่ Quotation ที่เลือก'); return; }
    setPending(true); setNotice('');
    try {
      await updatePsRequest(docNo, toPsUpdate(current, doc), token);
      setEditing(false); setDraft(null); setPrelimFields(null); reload();
      setNotice('บันทึกข้อมูล PS เรียบร้อย');
      try { await onSaved(); } catch { setNotice('บันทึกแล้ว แต่โหลดรายการล่าสุดไม่สำเร็จ กรุณาเปิดใบใหม่'); }
    } catch (e) { setNotice(apiErrorText(e, 'บันทึกข้อมูล PS ไม่สำเร็จ')); reload(); }
    finally { setPending(false); }
  };
  const snapshot = prelimFields ?? (current.prelim ? prelimToFields(current.prelim) : {});
  const estimateFields = DEPT_FORMS.PS.sections.flatMap(section => section.fields).filter(field => field.kind === 'filled');
  const editButton = !editing && allowEdit && (doc?.canEdit === true || doc?.canEditAttachment === true) ? (
    <button type="button" aria-label="แก้ไขข้อมูล PS" className="inline-flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/5 px-3 py-1.5 text-[12.5px] font-semibold text-accent transition hover:bg-accent/10" onClick={() => { setDraft(current); setEditing(true); setNotice(''); }}><IconPencil size={14} />แก้ไขข้อมูล</button>
  ) : null;
  return <div className="space-y-4">
    {notice && <p role="status" className="text-sm text-accent">{notice}</p>}
    {toolbar ? createPortal(editButton, toolbar) : editButton}
    {!editing && (doc?.editBlockedReason || doc?.attachmentBlockedReason) && <p className="text-xs text-slate-500">{doc?.editBlockedReason} {doc?.attachmentBlockedReason}</p>}
    <InfoCard title="ผู้แจ้ง" icon={IconUser}>
      <DetailRow label="ผู้แจ้งเรื่อง">{f.requestBy || '—'}</DetailRow>
      <DetailRow label="หน่วยงาน">{departmentName || '—'}</DetailRow>
      <DetailRow label="วันที่สร้างเอกสาร">{fmtDateTime(f.docDate) || '—'}</DetailRow>
    </InfoCard>
    <InfoCard title="เรื่องที่แจ้ง" icon={IconFileText}>
      {master.error && <p>{master.error} <button onClick={master.reload}>ลองใหม่</button></p>}
      {select('type', 'ประเภท', master.typeOptions())}{select('requestType', 'เรื่องที่แจ้ง', master.requestTypeOptions())}{date('priceDate', 'วันที่ต้องการราคา')}{date('planPrice', 'Plan วันที่ต้องการราคา')}{date('planDate', 'วันที่ต้องการใช้งาน')}
      <div className="col-span-2">{field('ระบุเรื่องที่แจ้ง', editing ? <textarea className={INPUT_CLS} value={f.requestDetail ?? ''} maxLength={500} disabled={!general} onChange={e => set('requestDetail', e.target.value)} /> : <div className="rounded-lg border border-gray-200 bg-slate-50 px-3.5 py-3 text-[13px] font-normal leading-relaxed text-gray-800 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 whitespace-pre-wrap">{f.requestDetail || '—'}</div>)}</div>
    </InfoCard>
    <InfoCard title="สิ่งที่แนบมาด้วย" icon={IconPaperclip}>
      <div className="col-span-2">
      {(['attachSpec', 'attachQuatation'] as const).map(key => <div key={key} className="mb-3 flex flex-wrap items-center gap-3"><label><input type="checkbox" checked={!!f[key]} disabled={!attachment} onChange={e => set(key, e.target.checked)} /> {key === 'attachSpec' ? PS_ATTACH.spec : PS_ATTACH.quotation}</label>{f[key] && text(key === 'attachSpec' ? 'budgetDocNo' : 'exBudgetDocNo', key === 'attachSpec' ? 'เลขที่รายละเอียด/Spec' : 'เลขที่ Quotation', 50, attachment)}</div>)}
      <PsQuoteAttachmentTable token={token} value={fromPsAttachment(f.attachment)} readOnly={!editing} disabled={!attachment} onChange={value => set('attachment', toPsAttachment(value))} />
      </div>
    </InfoCard>
    <InfoCard title="ข้อมูลใบประเมินราคา" icon={IconFileText}>
      <div className="col-span-2">{!editing ? <DetailRow label="เลขที่ใบประเมินราคา">{f.prelimId || '—'}</DetailRow> : field('เลขที่ใบประเมินราคา', <SearchSelect value={f.prelimId ?? ''} options={[...prelims.options.filter(o => o.value !== f.prelimId), ...(f.prelimId ? [{ value: f.prelimId, label: f.prelimId }] : [])]} disabled={!general || prelims.loading || !!prelims.error} onChange={async id => {
        const selectedVersion = ++version.current; set('prelimId', id); setPrelimFields({}); setPrelimPending(!!id); setPrelimError(false);
        if (!id) return;
        const result = await prelims.loadDetail(id);
        if (version.current !== selectedVersion) return;
        setPrelimPending(false);
        if (result.ok) setPrelimFields(result.fields); else { setPrelimError(true); setNotice(result.error); }
      }} />)}</div>
      {prelims.error && <p>{prelims.error} <button onClick={prelims.reload}>ลองใหม่</button></p>}
      {prelimPending && <p>กำลังโหลดใบประเมิน…</p>}
      {estimateFields.map(fd => <DetailRow key={fd.key} label={fd.label}>{snapshot[fd.key] || '—'}</DetailRow>)}
    </InfoCard>
    <InfoCard title="รายการที่ขอ" icon={IconList}>
      <div className="col-span-2">
      {!editing ? <RequestLinesTable loading={false} error={null} lines={current.lines.map(line => ({ ...line, received: line.received ?? 0, unit: line.unit ?? null, remark: line.remark ?? null, cancel: line.cancel ?? false, cancelBy: line.cancelBy ?? null, cancelDate: line.cancelDate ?? null }))} /> : current.lines.map((line, index) => <div key={index} className="mb-2 grid grid-cols-5 gap-2">
        {(['item', 'qty', 'unit', 'remark'] as const).map(key => field(({ item: 'รายการ', qty: 'จำนวน', unit: 'หน่วย', remark: 'หมายเหตุ' })[key], key === 'unit' && general
          ? <SearchSelect value={line.unit ?? ''} options={[...master.unitNames.filter(u => u !== line.unit), ...(line.unit ? [line.unit] : [])].map(u => ({ value: u, label: u }))} disabled={master.loading || !!master.error} onChange={value => setDraft({ ...current, lines: current.lines.map((l, i) => i === index ? { ...l, unit: value } : l) })} />
          : <input className={INPUT_CLS} type={key === 'qty' ? 'number' : 'text'} value={line[key] ?? ''} disabled={!general} onChange={e => setDraft({ ...current, lines: current.lines.map((l, i) => i === index ? { ...l, [key]: e.target.value } : l) })} />))}
        {general && <button onClick={() => setDraft({ ...current, lines: current.lines.filter((_, i) => i !== index) })}>ลบรายการ</button>}
      </div>)}
      {general && <button onClick={() => setDraft({ ...current, lines: [...current.lines, { recNo: '', item: '', qty: 1 }] })}>เพิ่มรายการ</button>}
      </div>
    </InfoCard>
    <InfoCard title="รูปภาพ" icon={IconPaperclip}><div className="col-span-2">{current.attachments?.length ? <div className="flex flex-wrap gap-2">{current.attachments.map(file => <Photo key={file.fileId} url={file.url} name={file.fileName} token={token} />)}</div> : <span className="text-[13px] text-slate-400 dark:text-slate-500">— ไม่มีรูปแนบ</span>}</div></InfoCard>
    <InfoCard title="การอนุมัติ" icon={IconShieldCheck}><div className="col-span-2">{approveLogs.length ? <div className="flex flex-col gap-1.5">{approveLogs.map((log, index) => <div key={index} className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[12.5px] dark:border-emerald-900 dark:bg-emerald-950/40"><IconCircleCheck size={15} className="shrink-0 text-emerald-600 dark:text-emerald-400" /><span className="font-semibold text-gray-800 dark:text-slate-100">{log.actionByName || '—'}</span>{log.actionByDepartment && <span className="text-slate-500 dark:text-slate-400">· {log.actionByDepartment}</span>}{log.actionDate && <span className="mono ml-auto text-slate-500 dark:text-slate-400">{fmtDateTime(log.actionDate)}</span>}</div>)}</div> : <span className="text-[13px] text-slate-400 dark:text-slate-500">— ยังไม่มีการอนุมัติ</span>}</div></InfoCard>
    {editing && <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4 dark:border-slate-800"><button type="button" className="rounded-lg border border-gray-200 px-4 py-2 text-[13px] font-semibold text-gray-600 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300" disabled={pending} onClick={() => { ++version.current; setPrelimPending(false); setPrelimError(false); setPrelimFields(null); setDraft(null); setEditing(false); setNotice(''); }}>ยกเลิก</button><button type="button" className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-50" disabled={!allowEdit || pending || prelimPending || prelimError || !doc || (doc.canEdit !== true && doc.canEditAttachment !== true)} onClick={save}><IconDeviceFloppy size={15} />{pending ? 'กำลังบันทึก…' : 'บันทึกการแก้ไข'}</button></div>}
  </div>;
}
