import React from 'react';
import { ItemStatus, ItemPriority } from '../../types/item';
import { STATUS_STYLE, PRIORITY_STYLE } from '../../data/mockData';

function Pill({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

export function StatusBadge({ status }: { status: ItemStatus }) {
  const s = STATUS_STYLE[status];
  return <Pill label={s.label} className={s.className} />;
}

export function PriorityBadge({ priority }: { priority: ItemPriority }) {
  const p = PRIORITY_STYLE[priority];
  return <Pill label={p.label} className={p.className} />;
}

export function CountBadge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-semibold">
      {count}
    </span>
  );
}
