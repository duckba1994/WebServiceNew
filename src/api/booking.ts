import { apiFetch } from './client';
import { BookingApi } from '../types/booking';

// พารามิเตอร์ค้นหาใบจอง (ทุกตัว optional) — ตรงกับ query params ของ GET /api/v1/Bookings
export interface BookingQuery {
  bookingNo?: string; // เลขที่ใบจอง (LIKE)
  startWork?: string; // วันที่เริ่มทำงาน — ช่วงจาก (yyyy-mm-dd)
  endWork?: string; // วันที่เริ่มทำงาน — ช่วงถึง
  startCreateDoc?: string; // วันที่สร้างเอกสาร — ช่วงจาก
  endCreateDoc?: string; // วันที่สร้างเอกสาร — ช่วงถึง
  startPL?: string; // วันที่ PL (CreationDT) — ช่วงจาก
  endPL?: string; // วันที่ PL — ช่วงถึง
  customerName?: string; // ชื่อลูกค้า (LIKE)
  machineID?: string; // เบอร์รถ (LIKE, '0' = ไม่กรอง)
  statusDoc?: string; // WFStateID สถานะเอกสาร ('0' = ไม่กรอง)
  showDataAll?: boolean; // true = ดึงทุกใบจอง ข้ามการกรองสิทธิ์
}

// yyyy-mm-dd (ค่าจาก <input type="date">) → yyyy/MM/dd ตามที่ backend ต้องการ (ดู Swagger)
// ถ้าไม่ใช่รูปแบบ ISO (หรือว่าง) ส่งค่าดั้งเดิมกลับไป
function toApiDate(v?: string): string {
  const t = (v ?? '').trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
  return m ? `${m[1]}/${m[2]}/${m[3]}` : t;
}

// GET /api/v1/Bookings — รายการใบจองสินค้า (รับพารามิเตอร์ค้นหาแบบ server-side)
export async function fetchBookings(query: BookingQuery = {}, token?: string): Promise<BookingApi[]> {
  const qs = new URLSearchParams();
  const add = (key: string, v?: string) => {
    const t = (v ?? '').trim();
    if (t !== '' && t !== '0') qs.set(key, t); // ว่าง/0 = ไม่กรอง จึงไม่ส่ง
  };
  add('BookingNo', query.bookingNo);
  // วันที่ทั้ง 3 คู่ (เริ่มงาน / สร้างเอกสาร / PL ระบุรถ) ส่งเป็น yyyy/MM/dd
  add('StartWork', toApiDate(query.startWork));
  add('EndWork', toApiDate(query.endWork));
  add('StartCreateDoc', toApiDate(query.startCreateDoc));
  add('EndCreateDoc', toApiDate(query.endCreateDoc));
  add('StartPL', toApiDate(query.startPL));
  add('EndPL', toApiDate(query.endPL));
  add('CustomerName', query.customerName);
  add('MachineID', query.machineID);
  add('StatusDoc', query.statusDoc);
  if (query.showDataAll) qs.set('showDataAll', 'true');

  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const res = await apiFetch(`/Bookings${suffix}`, { token });
  if (!res.ok) throw new Error(`โหลดรายการใบจองไม่สำเร็จ (HTTP ${res.status})`);
  return res.json();
}
