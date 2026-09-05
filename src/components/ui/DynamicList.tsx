import React, { useState } from 'react';
import { IconPlus, IconTrash } from '@tabler/icons-react';

interface DynamicListProps {
  label?: string;
  placeholder?: string;
  value: string[];
  onChange: (items: string[]) => void;
  accentColor?: string;
}

// เพิ่ม/ลบรายการ (add-remove list) — reusable, ไม่ผูก business
export function DynamicList({ label, placeholder, value, onChange, accentColor = '#1a5fb4' }: DynamicListProps) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const v = draft.trim();
    if (!v) return;
    onChange([...value, v]);
    setDraft('');
  };

  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">{label}</label>}
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder={placeholder}
          style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
          className="flex-1 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-800 dark:text-slate-100 focus:ring-2 focus:border-transparent outline-none"
        />
        <button
          type="button"
          onClick={add}
          style={{ backgroundColor: accentColor }}
          className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-white"
        >
          <IconPlus size={16} /> เพิ่ม
        </button>
      </div>
      {value.length > 0 && (
        <ul className="mt-2 space-y-1">
          {value.map((item, i) => (
            <li key={i} className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-slate-700 px-3 py-1.5 text-sm">
              <span>{item}</span>
              <button type="button" onClick={() => remove(i)} className="text-gray-400 dark:text-slate-500 hover:text-red-500">
                <IconTrash size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
