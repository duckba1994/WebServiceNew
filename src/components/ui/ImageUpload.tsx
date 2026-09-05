import React, { useEffect, useMemo, useRef } from 'react';
import { IconPhotoPlus, IconX } from '@tabler/icons-react';

// ── อัปโหลดรูป + พรีวิวย่อ (reusable) ─────────────────────────
// ใช้ในฟอร์มที่ต้องแนบรูป เช่น แจ้งซ่อม (SV) / พฤติกรรมคนขับ (PL) / จัดซื้อ (PU)
export function ImageUpload({
  value,
  onChange,
  accentColor = '#1a5fb4',
  max = 8,
  invalid,
}: {
  value: File[];
  onChange: (files: File[]) => void;
  accentColor?: string;
  max?: number;
  invalid?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  // สร้าง object URL สำหรับพรีวิว และคืนหน่วยความจำเมื่อรายการเปลี่ยน/unmount
  const previews = useMemo(() => value.map((f) => ({ file: f, url: URL.createObjectURL(f) })), [value]);
  useEffect(() => {
    return () => previews.forEach((p) => URL.revokeObjectURL(p.url));
  }, [previews]);

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const picked = Array.from(e.target.files).filter((f) => f.type.startsWith('image/'));
    onChange([...value, ...picked].slice(0, max));
    e.target.value = ''; // เลือกไฟล์เดิมซ้ำได้
  };

  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const full = value.length >= max;

  return (
    <div className="flex flex-col gap-2.5">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={full}
        style={!full && !invalid ? { borderColor: accentColor, color: accentColor } : undefined}
        className={`flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed py-5 text-[13px] font-semibold transition ${
          invalid
            ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400'
            : full
            ? 'cursor-not-allowed border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/60 text-gray-400 dark:text-slate-500'
            : 'hover:bg-slate-50 dark:hover:bg-slate-800'
        }`}
      >
        <IconPhotoPlus size={18} />
        {full ? `แนบรูปครบ ${max} รูปแล้ว` : 'คลิกเพื่อแนบรูป'}
      </button>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={pick} />

      {previews.length > 0 && (
        <div className="grid grid-cols-4 gap-2.5">
          {previews.map((p, i) => (
            <div key={p.url} className="group relative aspect-square overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
              <img src={p.url} alt={p.file.name} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => remove(i)}
                title="ลบรูปนี้"
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-lg bg-slate-900/60 text-white opacity-0 transition group-hover:opacity-100 hover:bg-red-600"
              >
                <IconX size={14} />
              </button>
              <span className="absolute inset-x-0 bottom-0 truncate bg-slate-900/60 px-1.5 py-0.5 text-[10px] text-white">
                {p.file.name}
              </span>
            </div>
          ))}
        </div>
      )}
      <span className="text-[11px] text-gray-400 dark:text-slate-500">
        แนบได้สูงสุด {max} รูป ({value.length}/{max})
      </span>
    </div>
  );
}
