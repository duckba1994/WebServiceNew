// โดเมน "ใบแจ้งเรื่อง" (Request Intake) — เรื่องที่แจ้งไป/แจ้งเข้าระหว่างหน่วยงาน
// หน่วยงานปลายทาง: HR / PL / SV / IT (ดู PROJECT_STRUCTURE.md §1)
//
// หมายเหตุ: โครงข้อมูล "รายการใบแจ้งเรื่อง" ที่มาจาก Requests API
// อยู่ที่ src/types/requestList.ts (ชื่อฟิลด์ต้องตรงกับ API)
// ไฟล์นี้เก็บเฉพาะชนิดข้อมูลของ "ฟอร์มสร้างใบแจ้งเรื่อง"

export type Dept =
  | 'HR'
  | 'PL'
  | 'SV'
  | 'IT'
  | 'PU'
  | 'CR'
  | 'GA'
  | 'IM'
  | 'AF'
  | 'SQA'
  | 'PS';

export type RequestPriority = 'low' | 'normal' | 'high' | 'urgent';
