import * as XLSX from 'xlsx';
import { BookingRow } from '../types/booking';
import { BookingColumn, bookingCellText } from '../data/bookingData';

// Export รายการใบจอง (เฉพาะที่ค้นหา/กรอง/เรียงแล้ว) เป็นไฟล์ .xlsx
// ส่งออก "เหมือนในตาราง": ใช้คอลัมน์ที่กำลังแสดง (ตาม preset) + ข้อความเซลล์เดียวกับที่เห็นในตาราง
export function exportBookingsToExcel(
  rows: BookingRow[],
  columns: BookingColumn[],
  fileName?: string
): void {
  // ข้ามคอลัมน์ลำดับ (ถ้ามี) — เพิ่มเลขลำดับให้เองในไฟล์แทน
  const cols = columns.filter((c) => c.key !== 'no');

  const header = ['ลำดับ', ...cols.map((c) => c.label)];
  const body = rows.map((r, i) => [i + 1, ...cols.map((c) => bookingCellText(r, c))]);

  const ws = XLSX.utils.aoa_to_sheet([header, ...body]);
  // กว้างคอลัมน์โดยประมาณจากความกว้างในตาราง (px → อักขระ)
  ws['!cols'] = [{ wch: 6 }, ...cols.map((c) => ({ wch: Math.max(10, Math.min(45, Math.round(c.width / 7))) }))];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'ใบจองสินค้า');

  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  XLSX.writeFile(wb, fileName ?? `Bookings_${stamp}.xlsx`);
}
