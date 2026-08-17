import React, { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { RequestGrid } from '../components/items/RequestGrid';
import { OUTGOING_COLUMNS, STATUS_FILTERS } from '../data/requestListData';
import { StatusFilter } from '../types/requestList';
import { useRequestList } from '../hooks/useRequestList';
import { useAuth } from '../context/AuthContext';

// เรื่องที่แผนกตัวเองแจ้งออกไป — GET /Requests/outgoing
// ขอบเขตข้อมูล (แผนก) API กรองจาก token ให้เอง หน้าเว็บไม่ต้องส่ง departid
export function MyItems() {
  const { user } = useAuth();
  const [status, setStatus] = useState<StatusFilter>('All');

  const { items, summary, departId, loading, error, reload } = useRequestList(
    'outgoing',
    { module: 'IT', status, sortBy: 'RequestDate', sortDir: 'Desc' },
    user?.token
  );

  return (
    <Layout
      title="เรื่องที่แจ้งออกไป"
      subtitle={`Outgoing Requests${departId ? ` — แผนก ${departId}` : ''}`}
    >
      <RequestGrid
        columns={OUTGOING_COLUMNS}
        items={items}
        summary={summary}
        loading={loading}
        error={error}
        onReload={reload}
        searchPlaceholder="ค้นหาเลขที่ / ผู้แจ้ง / รายละเอียด..."
        emptyText="ยังไม่มีเรื่องที่แผนกนี้แจ้งออกไป"
        toolbar={<StatusTabs value={status} onChange={setStatus} />}
      />
    </Layout>
  );
}

// ตัวกรองสถานะ — ส่งไปให้ API (ไม่ใช่กรองในตาราง) เพื่อให้ summary ตรงกับที่แสดง
export function StatusTabs({
  value,
  onChange,
}: {
  value: StatusFilter;
  onChange: (v: StatusFilter) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11.5px] font-semibold text-gray-500">สถานะ</span>
      <div className="flex gap-0.5 rounded-lg border border-gray-200 bg-[#eef1f6] p-1">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s.key}
            onClick={() => onChange(s.key)}
            className={`rounded-md px-3 py-1.5 text-[12.5px] font-semibold transition ${
              value === s.key ? 'bg-[#0b1220] text-white shadow-sm' : 'text-slate-600 hover:text-gray-900'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
