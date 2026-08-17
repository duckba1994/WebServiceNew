import { Item, ItemStatus, ItemPriority } from '../types/item';

// ── ค่าคงที่ design (สี/สไตล์) ───────────────────────────────
// accent ตามหมวด — ปรับได้ (ดู PROJECT_STRUCTURE.md §6)
export const DEPT_COLORS: Record<string, string> = {
  IT: '#1a5fb4',
  HR: '#2d7d46',
  SV: '#b45309',
  PL: '#5b3fa6',
  Sales: '#9b3068',
};

export const STATUS_STYLE: Record<ItemStatus, { label: string; className: string }> = {
  new: { label: 'เปิดใหม่', className: 'bg-blue-100 text-blue-700' },
  pending: { label: 'รอดำเนินการ', className: 'bg-amber-100 text-amber-700' },
  urgent: { label: 'เร่งด่วน', className: 'bg-red-100 text-red-700' },
  done: { label: 'เสร็จสิ้น', className: 'bg-green-100 text-green-700' },
};

export const PRIORITY_STYLE: Record<ItemPriority, { label: string; className: string }> = {
  low: { label: 'ต่ำ', className: 'bg-gray-100 text-gray-600' },
  normal: { label: 'ปกติ', className: 'bg-sky-100 text-sky-700' },
  high: { label: 'สูง', className: 'bg-rose-100 text-rose-700' },
};

// ── mock data ────────────────────────────────────────────────
// กิจกรรมล่าสุด — แสดงในคอลัมน์ขวาของหน้าเมนูหลัก (mock จนกว่าจะต่อ API)
export type ActivityType = 'create' | 'approved' | 'pending' | 'update' | 'done';

export interface Activity {
  id: string;
  prefix: string;
  docNo?: string;
  suffix?: string;
  time: string;
  type: ActivityType;
}

export const MOCK_ACTIVITIES: Activity[] = [
  { id: 'a1', prefix: 'สมชาย สร้าง ใบจองสินค้า', docNo: '#CR-2401', time: '5 นาทีที่แล้ว', type: 'create' },
  { id: 'a2', prefix: 'ใบแจ้งจัดส่ง', docNo: '#DL-1187', suffix: 'ได้รับการอนุมัติ', time: '32 นาทีที่แล้ว', type: 'approved' },
  { id: 'a3', prefix: 'ใบเบิกน้ำมันดีเซล', docNo: '#PL-0442', suffix: 'รออนุมัติ', time: '1 ชั่วโมงที่แล้ว', type: 'pending' },
  { id: 'a4', prefix: 'แผนการขายประจำเดือน อัปเดตแล้ว', time: '3 ชั่วโมงที่แล้ว', type: 'update' },
  { id: 'a5', prefix: 'ใบสั่งปล่อยรถเข้า', docNo: '#GA-0090', suffix: 'เสร็จสิ้น', time: 'เมื่อวานนี้', type: 'done' },
];

export const MOCK_ITEMS: Item[] = [
  { id: 'IT-001', title: 'ตัวอย่างรายการที่ 1', status: 'new', priority: 'normal', createdAt: '2026-06-01', ownerId: 'wichit.t', tags: ['demo'] },
  { id: 'IT-002', title: 'ตัวอย่างรายการที่ 2', status: 'pending', priority: 'high', createdAt: '2026-06-03', ownerId: 'wichit.t' },
  { id: 'IT-003', title: 'ตัวอย่างรายการที่ 3', status: 'done', priority: 'low', createdAt: '2026-06-05', ownerId: 'wichit.t' },
];
