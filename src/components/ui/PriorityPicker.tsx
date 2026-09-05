import React from 'react';
import { ItemPriority } from '../../types/item';
import { PRIORITY_STYLE } from '../../data/mockData';

interface PriorityPickerProps {
  value: ItemPriority;
  onChange: (p: ItemPriority) => void;
  accentColor?: string;
}

const ORDER: ItemPriority[] = ['low', 'normal', 'high'];

// ตัวเลือกแบบการ์ด — reusable
export function PriorityPicker({ value, onChange, accentColor = '#1a5fb4' }: PriorityPickerProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {ORDER.map((p) => {
        const selected = value === p;
        return (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            style={selected ? { borderColor: accentColor, color: accentColor } : undefined}
            className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
              selected ? 'border-2 bg-gray-50 dark:bg-slate-800/60' : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
            }`}
          >
            {PRIORITY_STYLE[p].label}
          </button>
        );
      })}
    </div>
  );
}
