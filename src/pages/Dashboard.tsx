import React from 'react';
import { IconAlertTriangle } from '@tabler/icons-react';
import { Layout } from '../components/layout/Layout';
import {
  DASHBOARD_SCOPE,
  DRIVER_STATUS_META,
  DRIVER_SUMMARY,
  EXPIRING_DRIVER_CERTS,
  MACHINE_STATUS_META,
  MACHINE_SUMMARY,
  MOCK_ACTIVE_MACHINES,
  TOTAL_DRIVERS,
  TOTAL_MACHINES,
} from '../data/resourceData';
import { MachineStatus } from '../types/resource';

// ป้ายสถานะเครื่องจักร — ใช้ทั้งในแถบสรุปและในตาราง
function StatusBadge({ status }: { status: MachineStatus }) {
  const m = MACHINE_STATUS_META[status];
  return (
    <span
      className="inline-flex whitespace-nowrap rounded-md border px-2 py-0.5 text-[11.5px] font-semibold"
      style={{ background: m.bg, color: m.color, borderColor: m.border }}
    >
      {m.label}
    </span>
  );
}

export function Dashboard() {
  const now = new Date();
  const updatedAt = `${now.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  })} ${now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`;

  return (
    <Layout title="หน้าหลัก" subtitle="Dashboard สถานะทรัพยากร">
      <div className="flex flex-col gap-5">
        {/* ===== แถบข้อมูลกำกับหน้า ===== */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-[13px] text-gray-500">
            ภาพรวมเครื่องจักรและคนขับแบบเรียลไทม์ · อัปเดต <span className="mono">{updatedAt}</span>
          </div>
          <div className="ml-auto text-xs text-gray-400">มุมมอง: {DASHBOARD_SCOPE}</div>
        </div>

        {/* ===== สรุปสถานะเครื่องจักร ===== */}
        <section>
          <h2 className="mb-2.5 text-sm font-bold text-gray-700">
            เครื่องจักร <span className="font-medium text-gray-400">({TOTAL_MACHINES} คัน)</span>
          </h2>
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 xl:grid-cols-6">
            {MACHINE_SUMMARY.map(({ status, count }) => {
              const meta = MACHINE_STATUS_META[status];
              return (
                <div
                  key={status}
                  className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-gray-300 hover:shadow-md"
                >
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: meta.color }} />
                    <span className="truncate text-xs font-medium text-gray-500">{meta.label}</span>
                  </div>
                  <div className="mono text-3xl font-bold leading-none text-gray-900">{count}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ===== ตารางความเคลื่อนไหว + สถานะคนขับ ===== */}
        <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          {/* เครื่องจักรที่มีความเคลื่อนไหว */}
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3.5">
              <h3 className="text-[15px] font-bold text-gray-800">เครื่องจักรที่มีความเคลื่อนไหว</h3>
              <button type="button" className="text-xs font-semibold text-accent hover:underline">
                ดูทั้งหมด
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-separate border-spacing-0">
                <thead>
                  <tr>
                    {['เบอร์รถ', 'ประเภท', 'สถานะ', 'งาน / ลูกค้า'].map((h) => (
                      <th
                        key={h}
                        className="whitespace-nowrap border-b border-gray-200 bg-slate-50 px-5 py-2.5 text-left text-[11.5px] font-semibold text-gray-500"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_ACTIVE_MACHINES.map((m) => (
                    <tr key={m.code} className="transition-colors hover:bg-slate-50">
                      <td className="mono whitespace-nowrap border-b border-[#eef1f6] px-5 py-3 text-[13px] font-semibold text-gray-900">
                        {m.code}
                      </td>
                      <td className="whitespace-nowrap border-b border-[#eef1f6] px-5 py-3 text-[13px] text-slate-700">
                        {m.type}
                      </td>
                      <td className="border-b border-[#eef1f6] px-5 py-3">
                        <StatusBadge status={m.status} />
                      </td>
                      <td className="border-b border-[#eef1f6] px-5 py-3 text-[13px] text-slate-700">
                        {m.job === '—' ? <span className="text-slate-300">—</span> : m.job}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* สถานะคนขับ */}
          <section className="flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-5 py-3.5">
              <h3 className="text-[15px] font-bold text-gray-800">
                สถานะคนขับ <span className="font-medium text-gray-400">({TOTAL_DRIVERS} คน)</span>
              </h3>
            </div>
            <div className="flex flex-col gap-1 p-5">
              {DRIVER_SUMMARY.map(({ status, count }) => {
                const meta = DRIVER_STATUS_META[status];
                return (
                  <div key={status} className="flex items-center gap-2.5 py-1.5">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: meta.color }} />
                    <span className="text-[13px] text-slate-700">{meta.label}</span>
                    <span className="mono ml-auto text-base font-bold text-gray-900">{count}</span>
                  </div>
                );
              })}

              {EXPIRING_DRIVER_CERTS > 0 && (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-[12.5px] leading-relaxed text-amber-800">
                  <IconAlertTriangle size={16} className="mt-0.5 shrink-0" />
                  <span>
                    ใบเซอร์คนขับ <b>{EXPIRING_DRIVER_CERTS} ใบ</b> ใกล้หมดอายุใน 30 วัน —
                    ควรต่ออายุก่อนจ่ายงาน
                  </span>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
