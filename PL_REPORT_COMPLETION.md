# งานพิมพ์และรายงาน PL — เสร็จแล้ว

อัปเดต: 21 ตุลาคม 2026

ผู้ใช้ยืนยันว่า **งาน PL ทั้ง 5 รายการเสร็จแล้ว** ได้แก่ใบพิมพ์แจ้งเรื่อง 3 แบบและรายงานหน่วยงาน 2 รายการ

| รายการ | สถานะ | จุดเปิดใช้งาน | รูปแบบ |
|---|---|---|---|
| Master Report | เสร็จแล้ว | “พิมพ์ใบแจ้งเรื่อง” → Master Report ในรายละเอียดใบแจ้งเรื่อง PL | A4 แนวตั้ง |
| Approve Report | เสร็จแล้ว | “พิมพ์ใบแจ้งเรื่อง” → Approve Report | A4 แนวตั้ง |
| Header Report | เสร็จแล้ว | “พิมพ์ใบแจ้งเรื่อง” → Header Report | A4 แนวตั้ง |
| รายงานใบรับเรื่อง | เสร็จแล้ว | `/reports/pl/request-report` | A4 แนวนอน |
| Print Summary | เสร็จแล้ว | `/reports/pl/print-summary` | A4 แนวนอน |

## ขอบเขตที่ทำเสร็จ

- **Master / Approve / Header Report:** ดึงข้อมูลใบแจ้งเรื่องรายใบจาก `/PLRequest/reports/request-form/{docNo}` โดยเลือก `reportType` ตามแบบพิมพ์
- **รายงานใบรับเรื่อง:** ดึงรายการและยอดสรุปจาก `/PLRequest/reports/request-summary` แสดงตาราง กราฟ และแบ่งหน้าตามความสูงแถว
- **Print Summary:** ดึงรายการจาก `/PLRequest/reports/viewer-summary` กรองตามวันที่ `departId` และ `wfStep` แสดงตารางและช่องลงชื่อท้ายรายงานตามแบบที่ผู้ใช้ให้มา

## โค้ดอ้างอิง

| ส่วน | ไฟล์ |
|---|---|
| แบบพิมพ์รายใบทั้งสามแบบ | [PlWorkOrderPrint.tsx](src/components/items/PlWorkOrderPrint.tsx) |
| รายงานหน่วยงานทั้งสองรายการ | [PLReportWorkspace.tsx](src/pages/PLReportWorkspace.tsx) |
| API รายงาน PL | [plReports.ts](src/api/plReports.ts) |
| รูปแบบหน้าพิมพ์ | [index.css](src/index.css) |

สถานะนี้บันทึกการเสร็จของงานหน้าพิมพ์และรายงาน PL ในแอป ไม่ได้ระบุสถานะการเผยแพร่ขึ้นระบบใช้งานจริง
