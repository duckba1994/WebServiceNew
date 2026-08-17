# API Spec — ใบแจ้งเรื่อง: อนุมัติ / แจ้งออกไป / แจ้งเข้ามา

เอกสารนี้คือสิ่งที่หน้าเว็บ (React) ต้องการจาก backend เพื่อทำหน้า **เรื่องที่แจ้งออกไป (outbox)**,
**เรื่องที่แจ้งเข้ามา (inbox)**, การ **อนุมัติโดยหัวหน้าแผนกผู้แจ้ง** และการ **ดำเนินการโดยแผนกปลายทาง**

ข้อตกลงที่เคาะแล้ว (17 ส.ค. 2026)
1. ทุกใบแจ้งเรื่องต้องให้ **หัวหน้าแผนกของผู้แจ้ง (mgr)** อนุมัติก่อน ปลายทางถึงจะเห็น/ดำเนินการได้
2. outbox / inbox เห็นได้ **ทั้งแผนกตัวเอง** (ไม่ใช่เฉพาะใบของตัวเอง)

---

## 1. กฎความปลอดภัย (สำคัญที่สุด)

**ห้ามให้ frontend ส่ง `departid` มาเป็นตัวกรอง** — ผู้ใช้แก้ค่าใน DevTools แล้วดูใบของแผนกอื่นได้ทันที
backend ต้องอ่าน `departid` + `usid` **จาก JWT** แล้วกรองเองทุก endpoint

| หน้าจอ | เงื่อนไข |
|---|---|
| outbox | `WHERE requesterDepartid = <departid จาก token>` |
| inbox | `WHERE targetDepartid = <departid จาก token> AND status NOT IN ('waiting_approval','not_approved')` |

ข้อ 2 สำคัญ: ปลายทาง**ต้องไม่เห็น**ใบที่ยังไม่ผ่านการอนุมัติ

การกดปุ่ม (approve / accept / done ฯลฯ) ต้องตรวจสิทธิ์ที่ backend ซ้ำเสมอ —
ปุ่มบนหน้าเว็บซ่อน/แสดงเพื่อ UX เท่านั้น ไม่ใช่ security

---

## 2. โครงสร้างตาราง

### 2.1 ITRequest (ปรับจากของเดิม)

ที่มีอยู่แล้ว: `requestBy`, `departid`, `phoneNumber`, `comName`, `requestDate`, `requestDetail`, `remark`

**ต้องเพิ่ม**

| คอลัมน์ | ชนิด | หมายเหตุ |
|---|---|---|
| `requestId` | int / guid | PK |
| `requestNo` | varchar(20) | เลขที่ใบแจ้ง เช่น `IT-2026-0001` — **generate ฝั่ง server และส่งกลับใน response ของ POST** |
| `requesterUsid` | varchar | ผู้แจ้ง (จาก token ไม่ใช่จาก body) |
| `requesterDepartid` | varchar | แผนกผู้แจ้ง — เปลี่ยนชื่อจาก `departid` เดิมให้ชัด |
| `targetDepartid` | varchar | แผนกปลายทาง (ใบ IT = รหัสแผนก IT) |
| `status` | varchar(20) | ดูหัวข้อ 3 |
| `priority` | varchar(10) | `low` / `normal` / `high` / `urgent` (ยังไม่มีในฟอร์ม ให้ default `normal`) |
| `approvedBy` / `approvedDate` | varchar / datetime | หัวหน้าที่อนุมัติ |
| `assigneeUsid` | varchar | ผู้รับผิดชอบฝั่งปลายทาง (null ได้) |
| `dueDate` | datetime | กำหนดเสร็จ (null ได้) |
| `closedDate` | datetime | วันที่ปิดงาน |
| `updatedDate` | datetime | อัปเดตล่าสุด — ใช้เรียงในตาราง |

### 2.2 ITRequestLog (ตารางใหม่ — จำเป็น)

ทุกครั้งที่สถานะเปลี่ยนต้อง insert 1 แถว **ห้ามอัปเดตทับ** เพราะหน้ารายละเอียดจะแสดง timeline
และเวลามีข้อโต้แย้งต้องตอบได้ว่า "ใครทำอะไรเมื่อไร" — ถ้าไม่เก็บตั้งแต่แรก ย้อนทำทีหลังไม่ได้

| คอลัมน์ | ชนิด |
|---|---|
| `logId` | int PK |
| `requestId` | FK → ITRequest |
| `action` | varchar(20) — `create` / `approve` / `not_approve` / `accept` / `start` / `done` / `reject` / `cancel` |
| `fromStatus` / `toStatus` | varchar(20) |
| `actionBy` | varchar — usid |
| `actionByName` | varchar — ชื่อ ณ ตอนนั้น (คนลาออกแล้วยังอ่าน log ได้) |
| `actionDate` | datetime |
| `note` | nvarchar(500) — เหตุผล/หมายเหตุ |

---

## 3. สถานะ (state machine)

```
create → waiting_approval ──approve──→ new ──accept──→ received ──start──→ in_progress ──done──→ done
              │                         │                  │                    │
              │ not_approve             │ reject           │ reject             │
              ↓                         ↓                  ↓                    │
        not_approved              rejected           rejected                   │
              
ผู้แจ้ง/แผนกผู้แจ้ง กด cancel ได้ตราบใดที่ยังไม่ done → cancelled
```

| status | ความหมาย | ใครทำต่อได้ |
|---|---|---|
| `waiting_approval` | รออนุมัติจากหัวหน้าแผนกผู้แจ้ง | mgr แผนกผู้แจ้ง |
| `not_approved` | หัวหน้าไม่อนุมัติ (จบ) | — |
| `new` | อนุมัติแล้ว รอปลายทางรับเรื่อง | แผนกปลายทาง |
| `received` | ปลายทางรับเรื่องแล้ว | แผนกปลายทาง |
| `in_progress` | กำลังดำเนินการ | แผนกปลายทาง |
| `done` | เสร็จสิ้น | — |
| `rejected` | ปลายทางตีกลับ (จบ) | — |
| `cancelled` | ผู้แจ้งยกเลิกเอง (จบ) | — |

`not_approve` และ `reject` **ต้องบังคับกรอก note** (เหตุผล)

---

## 4. Endpoints ที่ต้องการ

### 4.1 รายการ
```
GET /api/v1/ITRequest?box=outbox|inbox&status=&keyword=&dateFrom=&dateTo=&page=1&pageSize=20
```
- `box` เป็น parameter เดียวที่ frontend ส่งเพื่อเลือกทิศทาง — การกรองแผนกทำจาก token
- response
```json
{
  "total": 137,
  "page": 1,
  "pageSize": 20,
  "items": [
    {
      "requestId": 1024,
      "requestNo": "IT-2026-0001",
      "requestDate": "2026-08-17T04:42:35Z",
      "requesterName": "วิชิต เทียนทอง",
      "requesterDepartid": "07",
      "requesterDepartmentName": "Information Techonology",
      "targetDepartid": "07",
      "targetDepartmentName": "Information Techonology",
      "phoneNumber": "1234",
      "comName": "RTCJ-061",
      "requestDetail": "คอมเปิดไม่ติด",
      "status": "waiting_approval",
      "priority": "normal",
      "assigneeName": null,
      "dueDate": null,
      "updatedDate": "2026-08-17T04:42:35Z"
    }
  ]
}
```

### 4.2 รายละเอียด + timeline
```
GET /api/v1/ITRequest/{requestId}
```
คืนข้อมูลใบ + `logs: [{ action, fromStatus, toStatus, actionByName, actionDate, note }]`
(เรียงเก่า→ใหม่) + `attachments: [{ fileId, fileName, url }]`

### 4.3 การกระทำ (ทำเป็น endpoint เดียวได้)
```
POST /api/v1/ITRequest/{requestId}/action
{ "action": "approve", "note": "" }
```
- backend ตรวจ: ผู้ใช้มีสิทธิ์ทำ action นี้ไหม + สถานะปัจจุบันอนุญาตไหม (ห้ามเชื่อ frontend)
- ไม่ผ่าน → `409 Conflict` พร้อมข้อความไทยที่เอาไปแสดงให้ผู้ใช้ได้เลย
- ผ่าน → insert ITRequestLog + อัปเดต status/updatedDate แล้วคืนใบที่อัปเดตแล้วกลับมา

### 4.4 สรุปตัวเลข (ไว้ทำการ์ด KPI)
```
GET /api/v1/ITRequest/summary?box=outbox|inbox
→ { "total": 137, "waitingApproval": 4, "open": 12, "inProgress": 8, "done": 110, "overdue": 3 }
```
ถ้ายังไม่ทำ endpoint นี้ หน้าเว็บจะนับจากรายการในหน้าปัจจุบันไปก่อน (ตัวเลขจะไม่ตรงทั้งระบบ)

### 4.5 แนบไฟล์ (ยังค้างอยู่)
```
POST /api/v1/ITRequest/{requestId}/attachments   (multipart/form-data, สูงสุด 3 ไฟล์)
```
ตอนนี้หน้าเว็บแนบรูปได้ 3 รูปแต่**ส่งไม่ได้** เพราะ payload เดิมไม่มีช่องรับไฟล์

---

## 5. สิ่งที่ต้องเพิ่มใน login response

ตอนนี้ส่งมา: `token / usid / username / fullName / departid / departmentName / departmentShort / computerName / approve`
— ครบตามที่หน้าเว็บต้องการแล้ว


| ฟิลด์ | ใช้ทำอะไร |
|---|---|
| `approve` | ✅ ส่งมาแล้ว — สิทธิ์อนุมัติเอกสาร (เป็น mgr ของแผนก) ใช้ตัดสินว่าใครเห็นปุ่ม "อนุมัติ / ไม่อนุมัติ" |
| `departmentShort` | ✅ ส่งมาแล้ว — ใช้แสดงป้ายสีแผนก (IT / HR / PL / SV) และกำหนดขอบเขต outbox/inbox |
| `computerName` | ✅ ส่งมาแล้ว |

---

## 6. ลำดับที่แนะนำให้ทำ

1. เพิ่มคอลัมน์ใน ITRequest + สร้าง ITRequestLog + ให้ POST เดิมเซ็ต `status = waiting_approval` และคืน `requestNo`
2. `GET /ITRequest?box=` (4.1) — ปลดล็อกหน้า outbox/inbox ให้ต่อของจริงได้ทันที
3. `POST /ITRequest/{id}/action` (4.3) — ปลดล็อกการอนุมัติ/ดำเนินการ
4. `GET /ITRequest/{id}` (4.2) พร้อม logs
5. `role` / `isHead` ใน login
6. แนบไฟล์ (4.5) + summary (4.4)
