import React from 'react';
import { Item } from '../../types/item';
import { StatusBadge, PriorityBadge } from '../ui/Badge';

interface ItemTableProps {
  items: Item[];
}

// คอมโพเนนต์เฉพาะ domain (business-specific)
export function ItemTable({ items }: ItemTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-slate-800/60 text-left text-gray-500 dark:text-slate-400">
          <tr>
            <th className="px-4 py-3 font-medium">รหัส</th>
            <th className="px-4 py-3 font-medium">หัวข้อ</th>
            <th className="px-4 py-3 font-medium">สถานะ</th>
            <th className="px-4 py-3 font-medium">ความสำคัญ</th>
            <th className="px-4 py-3 font-medium">วันที่สร้าง</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-gray-400 dark:text-slate-500">
                ไม่มีข้อมูล
              </td>
            </tr>
          ) : (
            items.map((it) => (
              <tr key={it.id} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                <td className="px-4 py-3 font-mono text-gray-500 dark:text-slate-400">{it.id}</td>
                <td className="px-4 py-3 text-gray-800 dark:text-slate-100">{it.title}</td>
                <td className="px-4 py-3"><StatusBadge status={it.status} /></td>
                <td className="px-4 py-3"><PriorityBadge priority={it.priority} /></td>
                <td className="px-4 py-3 text-gray-500 dark:text-slate-400">{it.createdAt}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
