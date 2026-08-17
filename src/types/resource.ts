// สถานะเครื่องจักร (ใช้ในหน้า Dashboard สถานะทรัพยากร)
export type MachineStatus =
  | 'available' // ว่าง
  | 'booked' // จองแล้ว
  | 'preparing' // เตรียมส่ง
  | 'onsite' // อยู่หน้างาน
  | 'returning' // รอรับกลับ
  | 'repair'; // ซ่อม

// 1 คันในตาราง "เครื่องจักรที่มีความเคลื่อนไหว"
export interface Machine {
  code: string; // เบอร์รถ เช่น CR-25-014
  type: string; // ประเภท เช่น เครน 25 ตัน
  status: MachineStatus;
  job: string; // งาน / ลูกค้า ('—' ถ้ายังไม่มีงาน)
}

// สถานะคนขับ
export type DriverStatus =
  | 'available' // ว่าง (พร้อมจ่ายงาน)
  | 'onsite' // ปฏิบัติงานหน้างาน
  | 'leave'; // ลา / หยุด
