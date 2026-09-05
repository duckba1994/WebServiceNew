import React from 'react';

// คอนโทรลฟอร์มมาตรฐานของหน้าใบงาน (ใช้ร่วมกันทุกหน้า WinForms → Web)

export const INPUT_CLS =
  'rounded-lg border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3 py-2 text-[13px] text-gray-800 dark:text-slate-100 outline-none transition focus:border-accent focus:bg-white dark:focus:bg-slate-900';

export function Field({
  label,
  placeholder,
  value,
  mono,
  right,
  disabled,
  className = '',
}: {
  label: string;
  placeholder?: string;
  value?: string;
  mono?: boolean;
  right?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-[11.5px] font-semibold text-gray-500 dark:text-slate-400">{label}</span>
      <input
        defaultValue={value}
        placeholder={placeholder}
        disabled={disabled}
        className={`${INPUT_CLS} w-full ${mono ? 'mono' : ''} ${right ? 'text-right' : ''} ${
          disabled ? 'cursor-not-allowed bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500' : ''
        }`}
      />
    </label>
  );
}

export function SelectField({
  label,
  options,
  value,
  disabled,
  className = '',
}: {
  label: string;
  options: string[];
  // ค่าที่เลือกไว้ (โหมดแก้ไข) — ถ้าไม่มีใน options จะถูกเติมเข้าไปให้
  value?: string;
  disabled?: boolean;
  className?: string;
}) {
  const items = value && !options.includes(value) ? [value, ...options] : options;
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-[11.5px] font-semibold text-gray-500 dark:text-slate-400">{label}</span>
      <select
        defaultValue={value}
        disabled={disabled}
        className={`${INPUT_CLS} w-full ${disabled ? 'cursor-not-allowed bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400' : ''}`}
      >
        {items.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

export function Check({ label, disabled }: { label: string; disabled?: boolean }) {
  return (
    <label
      className={`flex items-center gap-2 py-1 text-[12.5px] text-slate-700 dark:text-slate-200 ${
        disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
      }`}
    >
      <input
        type="checkbox"
        disabled={disabled}
        className="h-[15px] w-[15px] shrink-0 cursor-[inherit] accent-[#1a5fb4]"
      />
      {label}
    </label>
  );
}

export function RadioL({ name, label, disabled }: { name: string; label: string; disabled?: boolean }) {
  return (
    <label
      className={`flex items-center gap-2 text-[13px] text-slate-700 dark:text-slate-200 ${
        disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
      }`}
    >
      <input
        type="radio"
        name={name}
        disabled={disabled}
        className="h-4 w-4 cursor-[inherit] accent-[#1a5fb4]"
      />
      {label}
    </label>
  );
}

// การ์ดหมวดในฟอร์ม — id ใช้เป็นเป้าหมายของเมนูนำทาง (scrollIntoView)
export function SectionCard({
  id,
  no,
  badgeClass,
  title,
  children,
}: {
  id: string;
  no: number;
  badgeClass: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold ${badgeClass}`}
        >
          {no}
        </span>
        <h3 className="text-[15px] font-bold text-gray-800 dark:text-slate-100">{title}</h3>
      </div>
      {children}
    </section>
  );
}

// กล่องกลุ่ม checkbox พื้นเทาอ่อน
export function CheckGroup({
  title,
  items,
  cols = 2,
  titleClass = 'text-slate-600 dark:text-slate-300',
  disabled,
}: {
  title: string;
  items: string[];
  cols?: number;
  titleClass?: string;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#eef1f6] dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-3.5">
      <div className={`mb-2 text-xs font-bold ${titleClass}`}>{title}</div>
      <div className={`grid gap-x-3.5 ${cols === 3 ? 'grid-cols-3' : cols === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {items.map((c) => (
          <Check key={c} label={c} disabled={disabled} />
        ))}
      </div>
    </div>
  );
}
