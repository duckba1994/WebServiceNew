// สถานะเอกสารของใบแจ้งจัดส่ง (ตามลำดับขั้นอนุมัติ)
export type DeliveryDocStatus = 'confirmed' | 'waiting' | 'rejected';

// ธงสีแถวในตาราง: ok = PL ยืนยันเบอร์รถแล้ว (เขียว), rejected = ไม่อนุมัติ (ชมพู)
export type DeliveryFlag = 'ok' | 'rejected' | '';

// 1 แถวในตารางใบแจ้งจัดส่ง
export interface DeliveryRow {
  id: number;
  delivery: string; // เลขที่ใบแจ้งจัดส่ง เช่น PDR690163
  deliveryDate: string; // วันที่แจ้งจัดส่ง (dd/mm/yyyy)
  docStatus: DeliveryDocStatus;
  creator: string; // ผู้สร้างเอกสาร
  quoteNo: string; // เลขที่ใบเสนอราคา ('—' ถ้าไม่มี)
  bookingNo: string; // เลขที่ใบจองสินค้า
  customer: string;
  jobType: string; // ลักษณะงาน
  site: string; // ที่อยู่ลูกค้า / สถานที่ทำงาน
  startDate: string;
  endDate: string;
  duration: string; // รวมระยะเวลาเช่า
  machine: string; // ประเภทเครื่องจักร
  plReply: string; // สถานะการตอบกลับ PL
  truckPL: string; // เบอร์รถที่ PL ระบุ
  plOptDate: string; // วันที่ PL จัดหา อปต.
  plNote: string; // หมายเหตุ PL
  flag: DeliveryFlag;
}
