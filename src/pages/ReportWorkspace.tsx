import React, { useState } from 'react';
import { IconArrowLeft, IconDatabaseOff, IconPrinter, IconSearch } from '@tabler/icons-react';
import { Link, Navigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { DateQuickPick } from '../components/ui/DateQuickPick';
import { useAuth } from '../context/AuthContext';
import { reportByKey, ReportKey } from '../data/reportData';

const INPUT = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] outline-none transition focus:border-accent dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100';

export function ReportWorkspace({ reportKey }: { reportKey: ReportKey }) {
  const { user } = useAuth();
  const report = reportByKey(reportKey);
  const allowed = user?.role === 'admin' || (user?.departmentShort ?? '').trim().toUpperCase() === report.department;
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  if (!allowed) return <Navigate to="/reports" replace />;

  return (
    <Layout title={report.title} subtitle={`${report.department} Report`}>
      <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-gray-200 px-5 py-3 dark:border-slate-700">
          <Link to="/reports" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-slate-500 transition hover:border-accent hover:text-accent dark:border-slate-700 dark:text-slate-300" title="กลับหน้ารายงาน"><IconArrowLeft size={17} /></Link>
          <div><h2 className="text-sm font-bold text-gray-900 dark:text-white">{report.title}</h2><p className="text-[11.5px] text-slate-400">{report.description}</p></div>
          <button type="button" disabled className="ml-auto inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3.5 py-2 text-[12.5px] font-semibold text-slate-400 disabled:cursor-not-allowed dark:border-slate-700"><IconPrinter size={16} />พิมพ์รายงาน</button>
        </div>
        <div className="grid shrink-0 gap-3 border-b border-gray-200 bg-slate-50 px-5 py-3 dark:border-slate-700 dark:bg-slate-800/60 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label><span className="mb-1.5 block text-[11.5px] font-semibold text-slate-500 dark:text-slate-400">วันที่เริ่มต้น</span><DateQuickPick value={dateFrom} onChange={setDateFrom} inputClass={INPUT} /></label>
          <label><span className="mb-1.5 block text-[11.5px] font-semibold text-slate-500 dark:text-slate-400">วันที่สิ้นสุด</span><DateQuickPick value={dateTo} onChange={setDateTo} inputClass={INPUT} min={dateFrom || undefined} /></label>
          <button type="button" disabled className="inline-flex h-[38px] items-center justify-center gap-2 rounded-lg bg-accent px-4 text-[12.5px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"><IconSearch size={16} />แสดงรายงาน</button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center bg-white px-5 text-center dark:bg-slate-900">
          <IconDatabaseOff size={42} stroke={1.5} className="text-slate-300 dark:text-slate-600" />
          <p className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">เตรียมหน้ารายงานเรียบร้อยแล้ว</p>
          <p className="mt-1 max-w-lg text-[12px] leading-5 text-slate-400">รอ API รายงานเพื่อโหลดข้อมูลจริง คำนวณยอดสรุป และเปิดใช้งานการพิมพ์ โดยระบบจะไม่สร้างข้อมูลจำลองแทนผลรายงาน</p>
        </div>
      </section>
    </Layout>
  );
}
