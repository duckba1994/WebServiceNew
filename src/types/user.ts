// ปรับ Department/Role ตาม domain ของโปรเจกต์ใหม่ได้
export type Department = 'IT' | 'HR' | 'SV' | 'PL' | 'Sales';

export interface User {
  // เวอร์ชันโครงสร้างที่เก็บใน localStorage (ดู AuthContext) — record เก่าจะถูกทิ้ง
  schemaVersion?: number;
  id: string;
  username: string;
  name: string;
  email?: string;
  token: string;
  department?: Department;
  role?: 'admin' | 'staff';
  avatarUrl?: string;
  // รหัสพนักงานขายของผู้ใช้ (จาก login response) — ใช้ preselect ชื่อพนักงานขายในฟอร์มแผนขาย
  salemanId?: string | null;
  // ── ข้อมูลหน่วยงานของผู้ใช้ (จาก login response) ──
  // ใช้เติม "ผู้แจ้งเรื่อง / หน่วยงาน" ในใบแจ้งเรื่องอัตโนมัติ ผู้ใช้ไม่ต้องกรอกเอง
  departid?: string;
  departmentShort?: string;
  departmentName?: string;
  // เป็นหัวหน้าแผนก (มีสิทธิ์อนุมัติเอกสาร) ไหม — มาจากคีย์ `approve` ใน login response
  // ใช้ตัดสินว่าจะเห็นปุ่มอนุมัติ/ไม่อนุมัติในใบแจ้งเรื่อง
  isHead?: boolean;
  // ชื่อเครื่องคอมพิวเตอร์จาก AD — เบราว์เซอร์อ่านเองไม่ได้ ต้องให้ backend ส่งมาตอน login
  computerName?: string;
}
