import React from 'react';
import { IconChartBar, IconChevronRight, IconClipboardList, IconLock } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import { reportsForDepartment } from '../data/reportData';

export function Reports() {
  const { user } = useAuth();
  const reports = reportsForDepartment(user?.departmentShort, user?.role === 'admin');

  return (
    <Layout title="รายงาน" subtitle="Reports">
      <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-gray-200 px-5 py-4 dark:border-slate-700">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">รายงานหน่วยงาน</h2>
          <p className="mt-0.5 text-[12px] text-slate-500 dark:text-slate-400">แสดงเฉพาะรายงานที่บัญชีของคุณมีสิทธิ์เข้าถึง</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto bg-[#f4f6fa] p-4 dark:bg-slate-950 sm:p-5">
          {reports.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {reports.map((report, index) => {
                const Icon = index === 0 ? IconChartBar : IconClipboardList;
                return (
                  <Link key={report.key} to={report.path} className="group flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-accent hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-accent dark:bg-blue-950/40"><Icon size={22} /></span>
                    <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-gray-900 group-hover:text-accent dark:text-white">{report.title}</span><span className="mt-1 block text-[12px] leading-5 text-slate-500 dark:text-slate-400">{report.description}</span><span className="mt-3 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[10.5px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{report.department}</span></span>
                    <IconChevronRight size={18} className="mt-1 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-accent" />
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="flex h-full min-h-[260px] flex-col items-center justify-center text-center text-slate-400"><IconLock size={38} stroke={1.5} /><p className="mt-3 text-sm font-semibold">ยังไม่มีรายงานสำหรับหน่วยงานของคุณ</p></div>
          )}
        </div>
      </section>
    </Layout>
  );
}
