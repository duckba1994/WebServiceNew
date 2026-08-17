import React, { useState } from 'react';
import { IconBell } from '@tabler/icons-react';
import { Layout } from '../components/layout/Layout';
import { RequestGrid } from '../components/items/RequestGrid';
import { StatusTabs } from './MyItems';
import { INCOMING_COLUMNS } from '../data/requestListData';
import { StatusFilter } from '../types/requestList';
import { useRequestList } from '../hooks/useRequestList';
import { useAuth } from '../context/AuthContext';

// เรื่องที่แจ้งเข้ามาที่แผนกตัวเอง — GET /Requests/incoming
// รวมใบที่ยังไม่ถึงคิวเรา (แผนกอื่นยังไม่อนุมัติ) ด้วย → ใช้ onlyMyTurn คัดเฉพาะที่ต้องลงมือ
export function Inbox() {
  const { user } = useAuth();
  const [status, setStatus] = useState<StatusFilter>('Open');
  const [onlyMyTurn, setOnlyMyTurn] = useState(false);

  const { items, summary, departId, loading, error, reload } = useRequestList(
    'incoming',
    { module: 'IT', status, onlyMyTurn, sortBy: 'RequestDate', sortDir: 'Desc' },
    user?.token
  );

  return (
    <Layout
      title="เรื่องแจ้งเข้ามา"
      subtitle={`Incoming Requests${departId ? ` — แผนก ${departId}` : ''}`}
    >
      <RequestGrid
        columns={INCOMING_COLUMNS}
        items={items}
        summary={summary}
        loading={loading}
        error={error}
        onReload={reload}
        searchPlaceholder="ค้นหาเลขที่ / ผู้แจ้ง / รายละเอียด..."
        emptyText={
          onlyMyTurn ? 'ไม่มีงานที่ถึงคิวแผนกนี้ตอนนี้' : 'ยังไม่มีเรื่องแจ้งเข้ามาที่แผนกนี้'
        }
        toolbar={
          <>
            <StatusTabs value={status} onChange={setStatus} />
            <button
              onClick={() => setOnlyMyTurn((v) => !v)}
              title="แสดงเฉพาะใบที่ขั้นตอนปัจจุบันเป็นของแผนกเรา"
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12.5px] font-semibold transition ${
                onlyMyTurn
                  ? 'border-amber-400 bg-amber-50 text-amber-700'
                  : 'border-gray-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <IconBell size={14} />
              เฉพาะคิวของเรา
            </button>
          </>
        }
      />
    </Layout>
  );
}
