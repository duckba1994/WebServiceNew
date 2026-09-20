import React, { useState } from 'react';

// Shared confirmation for workflow buttons that submit the panel's form values.
export function ConfirmButton({
  label,
  className,
  question,
  pending,
  guard,
  onConfirm,
}: {
  label: string;
  className: string;
  question: string;
  pending?: boolean;
  // ตรวจฟอร์มก่อน "ติดอาวุธ" — คืน false = ยังกรอกไม่ครบ (ตัว guard เป็นคนโชว์ข้อความเอง)
  // ถ้าไปตรวจตอนกดยืนยัน ผู้ใช้จะต้องกด 2 ครั้งก่อนถึงจะรู้ว่าลืมกรอกอะไร
  guard?: () => boolean;
  onConfirm: () => void;
}) {
  const [armed, setArmed] = useState(false);

  if (!armed)
    return (
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (guard && !guard()) return;
          setArmed(true);
        }}
        className={`rounded-lg border px-4 py-2 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      >
        {label}
      </button>
    );

  return (
    <span className="inline-flex flex-wrap items-center gap-2 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1.5">
      <span className="text-[12px] font-semibold text-amber-900 dark:text-amber-200">{question}</span>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setArmed(false);
          onConfirm();
        }}
        className={`rounded-lg border px-3 py-1.5 text-[12.5px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      >
        ยืนยัน
      </button>
      <button
        type="button"
        onClick={() => setArmed(false)}
        className="rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-1.5 text-[12.5px] font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-slate-800"
      >
        ยกเลิก
      </button>
    </span>
  );
}

