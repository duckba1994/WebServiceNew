import React from 'react';

export function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11.5px] font-semibold text-gray-500 dark:text-slate-400">{label}</span>
      <span className="text-[13px] text-gray-800 dark:text-slate-100">{children}</span>
    </div>
  );
}

export function InfoCard({ title, icon: Icon, children }: {
  title: string; icon: React.ElementType; children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700">
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-4 py-2">
        <Icon size={15} className="text-slate-400 dark:text-slate-500" />
        <h5 className="text-[12.5px] font-bold text-gray-700 dark:text-slate-200">{title}</h5>
      </div>
      <div className="grid grid-cols-1 gap-x-5 gap-y-4 px-3 py-3 sm:grid-cols-2 sm:px-4 sm:py-4">{children}</div>
    </section>
  );
}
