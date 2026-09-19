import React, { useMemo, useState } from 'react';
import { IconFileText } from '@tabler/icons-react';
import { PsReportStatus } from '../../types/requestList';
import { updatePsReportDetail } from '../../api/psRequest';
import { apiErrorText } from '../../api/client';
import { usePsReportStatuses } from '../../hooks/usePsReportStatuses';
import { SearchSelect } from '../ui/SearchSelect';
import { DetailRow, InfoCard } from './RequestInfoCard';

export function PsReportStatusPanel({ status, docNo, token, canUpdate, onSaved }: {
  status: PsReportStatus; docNo: string; token?: string; canUpdate: boolean; onSaved: () => Promise<void>;
}) {
  const master = usePsReportStatuses(token);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState('');
  const options = useMemo(() => {
    // Match the complete master key: report ids can repeat across workflow steps.
    const matches = master.rows.filter(row => row.rpStep === status.rpStep && row.rpStatus === status.rpStatus && row.rpId === status.rpId);
    if (matches.length !== 1) return null;
    const list = matches[0].details.map(d => ({ value: d.rpDetailId, label: d.rpDetailName || 'ไม่ระบุรายละเอียด' }));
    if (status.rpDetailId && !list.some(o => o.value === status.rpDetailId))
      list.push({ value: status.rpDetailId, label: status.rpDetailName || status.rpDetailId });
    return list;
  }, [master.rows, status]);
  const save = async () => {
    if (pending || master.loading || master.error || !options) return;
    setPending(true); setNotice('');
    try {
      await updatePsReportDetail(docNo, value, token);
      setEditing(false);
      try { await onSaved(); setNotice('บันทึกสถานะรายงานเรียบร้อย'); }
      catch { setNotice('บันทึกแล้ว แต่โหลดข้อมูลล่าสุดไม่สำเร็จ กรุณาเปิดใบใหม่'); }
    } catch (e) { setNotice(apiErrorText(e, 'บันทึกสถานะรายงานไม่สำเร็จ')); }
    finally { setPending(false); }
  };
  return <InfoCard title="สถานะรายงาน PS" icon={IconFileText}>
    <DetailRow label="สถานะรายงาน">{status.rpName || '—'}</DetailRow>
    <DetailRow label="รายละเอียดสถานะ">{status.rpDetailName || '—'}</DetailRow>
    <div className="col-span-2 space-y-2 text-sm text-gray-700 dark:text-slate-200">
      {notice && <p role="status">{notice}</p>}
      {editing ? <>
        {master.error && <p role="alert">{master.error} <button onClick={master.reload}>ลองใหม่</button></p>}
        {!master.loading && !master.error && !options && <p role="alert">ไม่พบกลุ่มสถานะรายงานที่ตรงกัน กรุณาตรวจสอบข้อมูลกับผู้ดูแลระบบ <button onClick={master.reload}>ลองใหม่</button></p>}
        <SearchSelect value={value} options={options ?? []} disabled={pending || master.loading || !!master.error || !options} onChange={setValue} />
        <p className="text-xs text-gray-500 dark:text-slate-400">เปลี่ยนเฉพาะรายละเอียดสถานะรายงาน โดยคงขั้นตอนงานเดิม</p>
        <button type="button" disabled={pending} onClick={() => setEditing(false)} className="mr-3">ยกเลิก</button>
        <button type="button" disabled={pending || master.loading || !!master.error || !options} onClick={save} className="rounded-lg bg-accent px-3 py-2 text-white disabled:opacity-50">{pending ? 'กำลังบันทึก…' : 'บันทึกสถานะรายงาน'}</button>
      </> : canUpdate && <button type="button" className="text-accent" onClick={() => { setValue(status.rpDetailId ?? ''); setNotice(''); setEditing(true); }}>แก้ไขรายละเอียดสถานะรายงาน</button>}
    </div>
  </InfoCard>;
}
