import React from 'react';
import { IconCalendar } from '@tabler/icons-react';

// ── ช่องเลือกวันที่แบบอ่านง่าย ────────────────────────────────
// input type="date" ล้วน ๆ อ่านยาก (โชว์ 2026-09-03 แล้วผู้ใช้ต้องแปลงเอง)
// ตัวนี้เพิ่มให้ 2 อย่าง: ปุ่มลัดวันที่ที่เลือกบ่อย + ข้อความไทยกำกับว่าวันไหน
// ค่าที่เก็บยังเป็น 'YYYY-MM-DD' เหมือนเดิม (ฟอร์ม/ payload ไม่ต้องรู้เรื่องนี้)

const ymd = (d: Date): string => {
  // ห้ามใช้ toISOString() — แปลงเป็น UTC แล้ววันที่ถอยไป 1 วันในโซนไทย
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

const shift = (days: number): string => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return ymd(d);
};

// ปุ่มลัด — คำนวณตอนเรนเดอร์ ไม่ใช่ตอน import (หน้าเปิดค้างข้ามวันแล้วจะเพี้ยน)
const QUICK: { label: string; days: number }[] = [
  { label: 'วันนี้', days: 0 },
  { label: 'พรุ่งนี้', days: 1 },
  { label: 'มะรืนนี้', days: 2 },
  { label: 'อีก 7 วัน', days: 7 },
];

// 'YYYY-MM-DD' → 'พฤ. 3 ก.ย. 2569' (ปี พ.ศ. อัตโนมัติจาก locale th-TH)
export const thaiDateLabel = (value: string): string => {
  if (!value) return '';
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return '';
  const date = new Date(y, m - 1, d);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('th-TH', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export function DateQuickPick({
  value,
  onChange,
  accentColor = '#1a5fb4',
  invalid,
  min,
  inputClass,
}: {
  value: string; // 'YYYY-MM-DD' ('' = ยังไม่เลือก)
  onChange: (v: string) => void;
  accentColor?: string;
  invalid?: boolean;
  min?: string; // วันที่ย้อนหลังกว่านี้เลือกไม่ได้ (ไม่ระบุ = เลือกได้ทุกวัน)
  inputClass: string; // สไตล์ช่องกรอกของฟอร์มที่เรียกใช้ (ไม่ตั้งเอง จะได้หน้าตาเดียวกัน)
}) {
  const label = thaiDateLabel(value);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap gap-1.5">
        {QUICK.map((q) => {
          const v = shift(q.days);
          const on = value === v;
          return (
            <button
              key={q.label}
              type="button"
              onClick={() => onChange(v)}
              style={on ? { borderColor: accentColor, color: accentColor } : undefined}
              className={`rounded-lg border px-2.5 py-1 text-[12px] font-semibold transition ${
                on ? 'bg-white dark:bg-slate-900' : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {q.label}
            </button>
          );
        })}
      </div>
      {/* อยู่ในคอลัมน์แคบ ๆ ได้ — ข้อความวันที่ห้ามตัดขึ้นบรรทัดใหม่
          (ผู้ใช้สั่ง 2 ก.ย. 2026: เลือกวันแล้วป้ายแตกเป็น 2 บรรทัด) */}
      <div className="flex min-w-0 items-center gap-2">
        <input
          type="date"
          value={value}
          min={min}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} mono w-auto shrink-0`}
        />
        {label && (
          <span className="flex min-w-0 items-center gap-1 whitespace-nowrap text-[12.5px] font-semibold text-slate-600 dark:text-slate-300">
            <IconCalendar size={14} className="shrink-0 text-slate-400 dark:text-slate-500" />
            {label}
          </span>
        )}
      </div>
      {invalid && !value && <span className="text-[11.5px] font-semibold text-red-600 dark:text-red-400">ยังไม่ได้เลือกวันที่</span>}
    </div>
  );
}
