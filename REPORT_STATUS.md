# สถานะรายงานหน่วยงานและการพิมพ์ใบแจ้งเรื่อง

อัปเดต: 21 ตุลาคม 2026 (โปรเจกต์ WebReact/WebService)

เอกสารนี้แยกงานออกเป็นสองส่วน: **รายงานหน่วยงาน** ที่เปิดจากเมนูรายงาน และ **ใบพิมพ์แจ้งเรื่องรายใบ** ที่เปิดจากหน้ารายละเอียดใบแจ้งเรื่อง (`RequestDetailModal`)

ผู้ใช้ยืนยันว่า IT **เสร็จแล้ว** ทั้ง 3 รายการตาม [IT_REPORT_COMPLETION.md](IT_REPORT_COMPLETION.md) และ PL **เสร็จแล้ว** ทั้ง 5 รายการตาม [PL_REPORT_COMPLETION.md](PL_REPORT_COMPLETION.md) ส่วนคำว่า **ทำแล้ว** สำหรับหน่วยงานอื่นหมายถึงมีหน้าจอ/แบบพิมพ์และเชื่อมเรียก API ในโค้ดแล้ว ยังไม่ระบุสถานะการรับงานหรือการเผยแพร่ขึ้นระบบใช้งานจริง

## 1. สรุปตามหน่วยงาน

| หน่วยงาน | รายงานหน่วยงาน | พิมพ์ใบแจ้งเรื่องรายใบ |
|---|---|---|
| IT | เสร็จแล้ว 2 รายงาน: satisfaction-summary / request-register | เสร็จแล้ว 1 แบบ: พิมพ์ใบงาน |
| PL | เสร็จแล้ว 2 รายงาน: รายงานใบรับเรื่อง / Print Summary | เสร็จแล้ว 3 แบบ: Master / Approve / Header |
| SV | ทำแล้ว 1 รายงาน | ยังไม่มีในหน้า RequestDetail |
| HR / PS | มีหน้ารายงานในเมนู ยังไม่ได้ยืนยันว่าเสร็จ | ยังไม่พบปุ่มและแบบพิมพ์ในหน้า RequestDetail |
| หน่วยงานอื่น เช่น CR, GA, IM, AF, SQA | ยังไม่พบรายงานในเมนูรายงาน | ยังไม่พบปุ่มและแบบพิมพ์ในหน้า RequestDetail |
| **ยืนยันว่าเสร็จแล้ว** | **2 หน่วยงาน / 4 รายงาน** | **2 หน่วยงาน / 4 แบบพิมพ์** |

ขอบเขตนี้ไม่รวมใบพิมพ์งานจองสินค้า และไม่รวมหน้าบันทึกสถานะรายงานของ PS ซึ่งเป็นส่วนหนึ่งของขั้นตอนทำงาน ไม่ใช่รายงานหน่วยงานหรือใบพิมพ์แจ้งเรื่อง

## 2. รายงานหน่วยงานที่ติดตามในเอกสารนี้

เปิดจากเมนู **รายงาน** (`/reports`) ผู้ใช้เห็นรายงานตาม `departmentShort` ของตนเอง ส่วนผู้ดูแลระบบเห็นรายงานทั้งหมด

| หน่วยงาน | ชื่อรายงาน | หน้าที่เปิด | กระดาษ |
|---|---|---|---|
| IT | รายงานสรุปความพึงพอใจหน่วยงาน IT | `/reports/it/satisfaction-summary` | A4 แนวตั้ง |
| IT | รายงานทะเบียนคุมใบ Service Form | `/reports/it/request-register` | A4 แนวนอน |
| PL | รายงานใบรับเรื่อง | `/reports/pl/request-report` | A4 แนวนอน |
| PL | Print Summary | `/reports/pl/print-summary` | A4 แนวนอน |
| SV | รายงานสรุปประเภทการแจ้งเรื่อง | `/reports/sv/request-summary` | A4 แนวนอน |

รายงานในตารางมีตัวเลือกช่วงวันที่ ตัวอย่างก่อนพิมพ์ การย่อ/ขยาย และปุ่มพิมพ์/PDF โดยปุ่ม PDF เปิดหน้าต่างพิมพ์ของเบราว์เซอร์ให้เลือกบันทึกเป็น PDF

- **IT — ความพึงพอใจ:** แสดงรายการและสรุปผลประเมินความพึงพอใจ
- **IT — ทะเบียนคุม:** แสดงรายการ Service Form งานค้างดำเนินการ และข้อมูลสรุป
- **PL — รายงานใบรับเรื่อง:** แสดงรายละเอียดใบรับเรื่อง พร้อมตารางสรุปสถานะ/เรื่องที่แจ้งและกราฟ แบ่งหน้าตามความสูงแถวที่วัดจริง
- **PL — Print Summary:** แสดงรายการใบแจ้งเรื่องตามช่วงวันที่ แผนก และสถานะ workflow พร้อมช่องลงชื่อท้ายรายงาน
- **SV:** สรุปจำนวนใบตามส่วนงาน FL/HV → หน่วยงานผู้แจ้ง → ประเภทเรื่อง แยกรายเดือนและปี พร้อมยอดรวม อ้างอิงแบบ `CrystalReportViewer1.pdf` และคู่มือ `SV-report-summary-api-guide.md` แบ่งเดือนต่อหน้าเมื่อคอลัมน์เกินความกว้าง และแบ่งแถวตามความสูงที่วัดจริง

### API ที่เชื่อมในโค้ด

ทุกเส้นทางด้านล่างเป็น `GET` ภายใต้ `/api/v1` และส่ง Bearer token ผ่าน API client ของแอป

| รายงาน | Endpoint |
|---|---|
| IT ความพึงพอใจ | `/ITRequest/reports/survey-summary?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD` |
| IT ทะเบียนคุม | `/ITRequest/reports/service-form-summary?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD` |
| PL ใบรับเรื่อง | `/PLRequest/reports/request-summary?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD` |
| PL Print Summary | `/PLRequest/reports/viewer-summary?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD&departId=...&wfStep=...` |
| SV สรุปประเภทการแจ้งเรื่อง | `/SVRequest/reports/request-summary?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD` |

## 3. ใบพิมพ์แจ้งเรื่องรายใบที่ทำแล้ว

เปิดใบแจ้งเรื่องจากรายการเรื่องที่แจ้งออกไป/เรื่องแจ้งเข้ามา แล้วใช้ปุ่มพิมพ์ในหัวหน้ารายละเอียดใบแจ้งเรื่อง

| หน่วยงาน | แบบพิมพ์ | วิธีเปิด | API |
|---|---|---|---|
| IT | ใบรับเรื่องฝ่ายเทคโนโลยีสารสนเทศ | ปุ่ม “พิมพ์ใบงาน” | `/ITRequest/reports/service-form/{jobNo}` |
| PL | Master Report | ปุ่ม “พิมพ์ใบแจ้งเรื่อง” → Master Report | `/PLRequest/reports/request-form/{docNo}?reportType=master` |
| PL | Approve Report | ปุ่ม “พิมพ์ใบแจ้งเรื่อง” → Approve Report | `/PLRequest/reports/request-form/{docNo}?reportType=approve` |
| PL | Header Report | ปุ่ม “พิมพ์ใบแจ้งเรื่อง” → Header Report | `/PLRequest/reports/request-form/{docNo}?reportType=header` |

ทุกแบบใช้ A4 แนวตั้ง และดึงข้อมูลจาก API ก่อนเปิดหน้าต่างพิมพ์

รายละเอียดที่ทำไว้:

- **IT:** ข้อมูลผู้แจ้งเรื่อง การดำเนินงาน ลายเซ็น/วันที่ และผลประเมินความพึงพอใจ
- **PL Master:** ข้อมูลผู้แจ้ง รายการที่ขอ และส่วนดำเนินการ; ดึงข้อมูลอนุมัติจากแบบ Approve เพิ่มเพื่อแสดงผู้ลงนามและวันที่
- **PL Approve:** ข้อมูลผู้แจ้ง รายการที่ขอ ส่วนดำเนินการ และตารางการอนุมัติ มีการปรับขนาดสำหรับหน้ากระดาษ A4
- **PL Header:** เอกสารอ้างอิงใบรับเรื่อง แสดงหัวเอกสารและส่วนผู้แจ้ง
- **PL ทั้งสามแบบ:** ใช้ลำดับประเภทเรื่อง 12 รายการร่วมกัน เรียงซ้ายไปขวา 3 คอลัมน์ตามที่ตกลง

## 4. สถานะตรวจสอบและงานที่เหลือ

- หลังเพิ่มรายงาน SV: TypeScript ผ่าน, ชุดทดสอบที่เกี่ยวข้อง 6 รายการผ่าน และ production build ผ่าน โดยมีคำเตือน ESLint เดิมใน `SalesPlan.tsx`
- ยังไม่ได้ยืนยันยอดรายงาน SV กับ API จริงขณะเข้าสู่ระบบ และยังไม่มีผลรับงานจากผู้ใช้สำหรับรายงานใหม่นี้
- ผู้ใช้ยืนยันว่า IT ทั้งสามรายการเสร็จแล้ว; รายละเอียดอยู่ใน [IT_REPORT_COMPLETION.md](IT_REPORT_COMPLETION.md)
- ผู้ใช้ยืนยันว่า PL ทั้งห้ารายการเสร็จแล้ว; รายละเอียดอยู่ใน [PL_REPORT_COMPLETION.md](PL_REPORT_COMPLETION.md)
- ใบพิมพ์แจ้งเรื่องรายใบของ **SV** ยังต้องพัฒนาต่อ; รายงานสรุป SV ที่ทำแล้วไม่ได้ทำให้มีปุ่มพิมพ์ใบ SV ใน RequestDetail
- สถานะการรับงานของ HR, PS และหน่วยงานอื่นยังไม่ได้ยืนยันในเอกสารนี้

## 5. โค้ดอ้างอิงสำหรับติดตามงาน

| ส่วนงาน | ไฟล์ |
|---|---|
| รายชื่อรายงานและสิทธิ์แสดงเมนู | [reportData.ts](src/data/reportData.ts) |
| เส้นทางหน้ารายงาน | [App.tsx](src/App.tsx) |
| รายงาน IT | [ITReportWorkspace.tsx](src/pages/ITReportWorkspace.tsx), [itReports.ts](src/api/itReports.ts) |
| รายงาน PL | [PLReportWorkspace.tsx](src/pages/PLReportWorkspace.tsx), [plReports.ts](src/api/plReports.ts) |
| รายงาน SV | [SVReportWorkspace.tsx](src/pages/SVReportWorkspace.tsx), [svReportMatrix.ts](src/data/svReportMatrix.ts), [svReports.ts](src/api/svReports.ts) |
| ปุ่มพิมพ์ใบแจ้งเรื่อง IT/PL | [RequestDetailModal.tsx](src/components/items/RequestDetailModal.tsx) |
| แบบพิมพ์ IT | [ItWorkOrderPrint.tsx](src/components/items/ItWorkOrderPrint.tsx) |
| แบบพิมพ์ PL ทั้งสามแบบ | [PlWorkOrderPrint.tsx](src/components/items/PlWorkOrderPrint.tsx) |
| รูปแบบกระดาษและ CSS พิมพ์ | [index.css](src/index.css) |

เมื่อเพิ่มรายงานหรือใบพิมพ์ของหน่วยงานใหม่ ให้ปรับตารางสรุปและวันที่อัปเดตในเอกสารนี้ด้วย
