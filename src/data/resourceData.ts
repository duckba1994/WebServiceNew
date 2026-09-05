import { DriverStatus, Machine, MachineStatus } from '../types/resource';

// ── ขอบเขตข้อมูลที่ผู้ใช้เห็น (mock จนกว่าจะต่อ API สิทธิ์ผู้ใช้) ──
export const DASHBOARD_SCOPE = 'Admin (สมุทรปราการ + ระยอง)';

// ── สถานะเครื่องจักร: ป้ายสี + ลำดับที่แสดงบนแถบสรุป ───────────
export const MACHINE_STATUS_META: Record<
  MachineStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  available: { label: 'ว่าง', color: 'var(--tint-green-fg)', bg: 'var(--tint-green-bg)', border: 'var(--tint-green-bd)' },
  booked: { label: 'จองแล้ว', color: 'var(--tint-blue-fg)', bg: 'var(--tint-blue-bg)', border: 'var(--tint-blue-bd)' },
  preparing: { label: 'เตรียมส่ง', color: 'var(--tint-purple-fg)', bg: 'var(--tint-purple-bg)', border: 'var(--tint-purple-bd)' },
  onsite: { label: 'อยู่หน้างาน', color: 'var(--tint-orange-fg)', bg: 'var(--tint-orange-bg)', border: 'var(--tint-orange-bd)' },
  returning: { label: 'รอรับกลับ', color: 'var(--tint-amber-fg)', bg: 'var(--tint-amber-bg)', border: 'var(--tint-amber-bd)' },
  repair: { label: 'ซ่อม', color: 'var(--tint-red-fg)', bg: 'var(--tint-red-bg)', border: 'var(--tint-red-bd)' },
};

export const MACHINE_SUMMARY: { status: MachineStatus; count: number }[] = [
  { status: 'available', count: 18 },
  { status: 'booked', count: 9 },
  { status: 'preparing', count: 4 },
  { status: 'onsite', count: 24 },
  { status: 'returning', count: 3 },
  { status: 'repair', count: 3 },
];

// ยอดเครื่องจักรทั้งฝูง — ไม่ใช่ผลรวมของ 6 สถานะข้างบน เพราะยังมีคันที่อยู่นอกสถานะเหล่านี้
// (เช่น จอดพัก / รอจำหน่าย) จึงเก็บเป็นค่าแยกที่จะดึงจาก API ภายหลัง
export const TOTAL_MACHINES = 78;

// ── เครื่องจักรที่มีความเคลื่อนไหว (mock รอต่อ API) ─────────────
export const MOCK_ACTIVE_MACHINES: Machine[] = [
  { code: 'CR-25-014', type: 'เครน 25 ตัน', status: 'booked', job: 'ศรีไทยก่อสร้าง' },
  { code: 'FL-10-006', type: 'รถยก 10 ตัน', status: 'onsite', job: 'รุ่งเรืองวัสดุ' },
  { code: 'EX-20-003', type: 'รถขุด PC200', status: 'repair', job: 'รอ SA ประเมิน' },
  { code: 'FK-03-011', type: 'โฟล์คลิฟท์ 3 ตัน', status: 'available', job: '—' },
  { code: 'CR-50-002', type: 'เครน 50 ตัน', status: 'preparing', job: 'เอเชียคอนกรีต' },
  { code: 'TR-40-008', type: 'เทรลเลอร์หางลาก', status: 'returning', job: 'ทีพีเอ็น' },
];

// ── สถานะคนขับ ──────────────────────────────────────────────
export const DRIVER_STATUS_META: Record<DriverStatus, { label: string; color: string }> = {
  available: { label: 'ว่าง (พร้อมจ่ายงาน)', color: '#16a34a' },
  onsite: { label: 'ปฏิบัติงานหน้างาน', color: '#ea580c' },
  leave: { label: 'ลา / หยุด', color: '#94a3b8' },
};

export const DRIVER_SUMMARY: { status: DriverStatus; count: number }[] = [
  { status: 'available', count: 12 },
  { status: 'onsite', count: 20 },
  { status: 'leave', count: 2 },
];

export const TOTAL_DRIVERS = DRIVER_SUMMARY.reduce((s, d) => s + d.count, 0);

// จำนวนใบเซอร์คนขับที่ใกล้หมดอายุใน 30 วัน (0 = ไม่แสดงกล่องเตือน)
export const EXPIRING_DRIVER_CERTS = 2;
