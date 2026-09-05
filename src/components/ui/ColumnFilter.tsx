import React, { useMemo, useState } from 'react';
import { IconSearch } from '@tabler/icons-react';

// ── ตัวกรองรายคอลัมน์แบบ Excel (AutoFilter) ───────────────────
// ใช้ร่วมกันทุกหน้าที่มีตารางข้อมูล (แผนขาย / ใบจอง ฯลฯ)
// selected = ค่าที่เลือกไว้ (undefined = ไม่กรอง คือเลือกทุกค่า)
export function ColumnFilter({
  options,
  selected,
  onApply,
  onClose,
  align = 'right',
}: {
  options: string[];
  selected?: Set<string>;
  onApply: (next: Set<string> | undefined) => void;
  onClose: () => void;
  // ทิศที่กล่องกาง: 'right' = กางไปทางซ้าย (ชิดขวาของหัว), 'left' = กางไปทางขวา (ชิดซ้าย)
  // คอลัมน์ซ้ายสุด (ตรึง) ต้องใช้ 'left' ไม่งั้นกล่องจะหลุดขอบซ้ายแล้วโดนตัด
  align?: 'left' | 'right';
}) {
  const [q, setQ] = useState('');
  // เริ่มจากค่าที่กรองไว้เดิม ถ้ายังไม่เคยกรอง = เลือกทุกค่า
  const [draft, setDraft] = useState<Set<string>>(() => new Set(selected ?? options));

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? options.filter((o) => o.toLowerCase().includes(s)) : options;
  }, [q, options]);

  const allShownChecked = shown.length > 0 && shown.every((o) => draft.has(o));

  const toggle = (v: string) =>
    setDraft((prev) => {
      const n = new Set(prev);
      if (n.has(v)) n.delete(v);
      else n.add(v);
      return n;
    });

  const toggleAllShown = () =>
    setDraft((prev) => {
      const n = new Set(prev);
      if (allShownChecked) shown.forEach((o) => n.delete(o));
      else shown.forEach((o) => n.add(o));
      return n;
    });

  return (
    <>
      {/* คลิกนอกกล่องเพื่อปิด */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className={`absolute top-full z-50 mt-1 w-[248px] rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-left shadow-xl ${
          align === 'left' ? 'left-0' : 'right-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-2 py-1.5 focus-within:border-accent">
          <IconSearch size={13} className="shrink-0 text-gray-400 dark:text-slate-500" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ค้นหาค่า..."
            className="min-w-0 flex-1 bg-transparent text-[12px] text-gray-800 dark:text-slate-100 outline-none placeholder:text-gray-400 dark:placeholder:text-slate-500"
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2 border-b border-gray-100 dark:border-slate-800 px-1 py-1.5 text-[12px] font-semibold text-slate-700 dark:text-slate-200">
          <input
            type="checkbox"
            checked={allShownChecked}
            onChange={toggleAllShown}
            className="h-[14px] w-[14px] cursor-pointer accent-[#1a5fb4]"
          />
          เลือกทั้งหมด
        </label>

        <div className="max-h-[220px] overflow-y-auto py-1">
          {shown.length === 0 ? (
            <div className="px-1 py-3 text-center text-[12px] text-gray-400 dark:text-slate-500">ไม่พบค่าที่ค้นหา</div>
          ) : (
            shown.map((o) => (
              <label
                key={o}
                className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-[12px] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <input
                  type="checkbox"
                  checked={draft.has(o)}
                  onChange={() => toggle(o)}
                  className="h-[14px] w-[14px] shrink-0 cursor-pointer accent-[#1a5fb4]"
                />
                <span className="truncate" title={o}>
                  {o === '' ? <span className="text-gray-400 dark:text-slate-500">(ว่าง)</span> : o}
                </span>
              </label>
            ))
          )}
        </div>

        <div className="mt-2 flex items-center gap-1.5 border-t border-gray-100 dark:border-slate-800 pt-2">
          <button
            onClick={() => {
              onApply(undefined);
              onClose();
            }}
            className="rounded-lg px-2 py-1.5 text-[12px] font-medium text-slate-500 dark:text-slate-400 transition hover:text-gray-900 dark:hover:text-white"
          >
            ล้าง
          </button>
          <button
            onClick={onClose}
            className="ml-auto rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-[12px] font-semibold text-slate-600 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            ยกเลิก
          </button>
          <button
            onClick={() => {
              // เลือกครบทุกค่า = ไม่ต้องกรอง
              onApply(draft.size === options.length ? undefined : new Set(draft));
              onClose();
            }}
            className="rounded-lg bg-accent px-3 py-1.5 text-[12px] font-bold text-white transition hover:bg-[#134a8e]"
          >
            ตกลง
          </button>
        </div>
      </div>
    </>
  );
}
