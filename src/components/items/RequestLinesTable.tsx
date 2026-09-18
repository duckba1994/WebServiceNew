import React from 'react';
import { IconLoader2, IconAlertTriangle } from '@tabler/icons-react';
import { PlRequestLine } from '../../api/plRequest';

export function RequestLinesTable({
  lines,
  loading,
  error,
  showReceived,
}: {
  lines: PlRequestLine[] | null;
  loading: boolean;
  error: string | null;
  // "รับจำนวน" มีความหมายหลังปลายทางเริ่มจ่ายของแล้ว — ตอนขอยังเป็น 0 ทุกแถว
  // จึงโชว์เฉพาะแท็บ Attachment / Service ไม่ใช่หน้า General
  showReceived?: boolean;
}) {
  if (loading)
    return (
      <span className="flex items-center gap-1.5 text-[13px] text-slate-400 dark:text-slate-500">
        <IconLoader2 size={14} className="animate-spin" />
        กำลังโหลดรายการ…
      </span>
    );

  if (error)
    return (
      <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-amber-700 dark:text-amber-300">
        <IconAlertTriangle size={14} className="shrink-0" />
        {error}
      </span>
    );

  if (!lines || lines.length === 0)
    return <span className="text-[13px] text-slate-400 dark:text-slate-500">— ใบนี้ไม่มีรายการที่ขอ</span>;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-[#0b1220] text-[11.5px] font-semibold text-slate-300 dark:text-slate-600">
            <th className="w-10 px-2 py-2 text-center">#</th>
            <th className="px-2 py-2 text-left">รายการ</th>
            <th className="w-20 px-2 py-2 text-center">จำนวน</th>
            {showReceived && <th className="w-20 px-2 py-2 text-center">รับจำนวน</th>}
            <th className="w-24 px-2 py-2 text-center">หน่วย</th>
            <th className="px-2 py-2 text-left">หมายเหตุ</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((li, i) => (
            <tr
              key={li.recNo}
              className={`border-b border-[#eef1f6] dark:border-slate-800 text-[12.5px] last:border-b-0 ${
                li.cancel ? 'bg-slate-50 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 line-through' : 'bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-100'
              }`}
              title={li.cancel ? `ยกเลิกโดย ${li.cancelBy || '—'}` : undefined}
            >
              <td className="mono px-2 py-2 text-center text-slate-400 dark:text-slate-500">{i + 1}</td>
              <td className="px-2 py-2">{li.item}</td>
              <td className="mono px-2 py-2 text-center">{li.qty}</td>
              {showReceived && (
                <td className="mono px-2 py-2 text-center">
                  {/* รับครบแล้วเน้นเขียว ยังไม่ครบเป็นสีส้ม — เห็นได้ทันทีว่าค้างแถวไหน */}
                  <span className={li.received >= li.qty ? 'font-semibold text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}>
                    {li.received}
                  </span>
                </td>
              )}
              <td className="px-2 py-2 text-center">{li.unit || '—'}</td>
              <td className="px-2 py-2">{li.remark || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
