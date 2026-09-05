import React from 'react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  accentColor?: string;
}

// คอมโพเนนต์เฉพาะ domain (business-specific) — เปลี่ยนชื่อโฟลเดอร์ items/ ตามโปรเจกต์
export function StatCard({ label, value, icon, accentColor = '#1a5fb4' }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 dark:text-slate-400">{label}</span>
        {icon && (
          <span style={{ color: accentColor }} className="shrink-0">
            {icon}
          </span>
        )}
      </div>
      <div className="mt-2 text-2xl font-semibold text-gray-800 dark:text-slate-100">{value}</div>
    </div>
  );
}
