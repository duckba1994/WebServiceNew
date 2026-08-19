# API v2.3 — Detail endpoint + ฟิลด์ใหม่ในลิสต์

> ต่อยอดจาก v2.2 · **ไม่มี breaking change** — ทั้งหมดเป็นการ "เพิ่ม"
> JSON เป็น **camelCase** ทุกฟิลด์ · auth ด้วย `Authorization: Bearer <token>` เหมือนเส้นอื่น

---

## 1. ⭐ เส้นใหม่ — รายละเอียดใบเต็ม + timeline

```
GET /api/v1/Requests/{module}/{docNo}
```

### ส่งเข้า
| ส่วน | ค่า | ตัวอย่าง |
|------|-----|---------|
| path `module` | รหัสโมดูล | `IT` |
| path `docNo` | เลขที่ใบ | `2600042` |
| header | Bearer token | `Authorization: Bearer eyJ...` |

ไม่มี query string · ไม่มี body · แผนกของผู้เรียกอ่านจาก token (ใช้คำนวณ `availableActions` / `isMyTurn` / `ownerType` ของหัวใบให้ตรงกับคนที่เปิดดู)

### ตัวอย่างเรียก
```
GET /api/v1/Requests/IT/2600042
Authorization: Bearer eyJhbGciOi...
```

### return (200)
```json
{
  "item": {
    "module": "IT",
    "docNo": "2600042",
    "requestBy": "วิชิต เทียนทอง",
    "departId": "20",
    "departmentName": "ฝ่ายวางแผน",
    "requestDate": "2026-08-18T17:17:00",
    "detail": "คอมเปิดไม่ติด",
    "phoneNumber": "1234",
    "comName": "PL-PC-05",
    "remark": "ด่วน ใช้งานพรุ่งนี้เช้า",
    "jobStatus": "3",
    "jobStatusName": "อยู่ระหว่างดำเนินการซ่อม",
    "wfStep": 3,
    "wfStepTotal": 5,
    "wfStepName": "Service",
    "wfStatus": "Service",
    "description": "อยู่ระหว่างดำเนินการ หน่วยงาน (IT)",
    "updatedDate": "2026-08-19T08:10:00",
    "attachmentCount": 1,
    "currentDepartId": "07",
    "currentDepartmentName": "แผนก IT",
    "isMyTurn": true,
    "phase": "in_progress",
    "phaseName": "กำลังดำเนินการ",
    "ownerType": "target",
    "availableActions": [
      { "code": "service", "label": "ดำเนินการเสร็จ", "style": "primary",
        "requireNote": false, "requiredFields": ["solve","hw","hwDetail","repairDetail"] }
    ],
    "resolution": {
      "receivedBy": "ช่างเอ", "receivedDate": "2026-08-19T08:10:00",
      "servicedBy": null, "servicedDate": null,
      "closedBy": null, "closedDate": null,
      "cancelledBy": null, "cancelledDate": null,
      "repairStatus": null, "solution": null, "resolutionDetail": null
    }
  },

  "logs": [
    { "step": 1, "action": "create",  "actionLabel": "แจ้งเรื่อง",
      "actionByName": "วิชิต เทียนทอง", "actionByDepartment": "ฝ่ายวางแผน",
      "actionDate": "2026-08-18T17:17:00", "note": null },
    { "step": 1, "action": "approve", "actionLabel": "อนุมัติ",
      "actionByName": "สมชาย (Mgr PL)", "actionByDepartment": "ฝ่ายวางแผน",
      "actionDate": "2026-08-18T18:02:00", "note": null },
    { "step": 2, "action": "receive", "actionLabel": "รับเรื่อง",
      "actionByName": "ช่างเอ", "actionByDepartment": "แผนก IT",
      "actionDate": "2026-08-19T08:10:00", "note": null }
  ],

  "workflow": {
    "module": "IT",
    "name": "แจ้งเรื่อง IT",
    "stepCount": 5,
    "steps": [
      { "step": 1, "code": "Approved-Request",     "name": "...", "ownerType": "requesterDepart", "departId": null, "permission": 3, "jobStatus": "1", "phase": "waiting_approve" },
      { "step": 2, "code": "Received-Service",      "name": "...", "ownerType": "targetDepart",    "departId": "07", "permission": 1, "jobStatus": "2", "phase": "waiting_review" },
      { "step": 3, "code": "Service",               "name": "...", "ownerType": "targetDepart",    "departId": "07", "permission": 2, "jobStatus": "3", "phase": "in_progress" },
      { "step": 4, "code": "Survey",                "name": "...", "ownerType": "requesterDepart", "departId": null, "permission": 1, "jobStatus": "4", "phase": "waiting_review" },
      { "step": 5, "code": "ReceiveJob-Close-Job",  "name": "...", "ownerType": "requesterDepart", "departId": null, "permission": 3, "jobStatus": "5", "phase": "waiting_close" }
    ],
    "statuses": [
      { "code": "1", "name": "แจ้งซ่อมแล้ว", "group": "Open", "phase": "waiting_approve" }
      /* ... ครบทุกสถานะ ...*/
    ]
  },

  "attachments": [
    { "fileId": 1, "fileName": "error.png", "url": null }
  ]
}
```

### สิ่งที่ต้องรู้เรื่อง response

**`item`** — shape เดียวกับ item ในลิสต์ (`/incoming` `/outgoing`) เป๊ะ เอาไปใช้ component เดิมได้เลย

**`logs`** — timeline เรียง **เก่า→ใหม่**
- `action` ใช้ code ชุดเดียวกับ `availableActions` → เลือกไอคอน/สีจากค่านี้ได้
  ค่าที่เป็นไปได้: `create` · `approve` · `receive` · `service` · `survey` · `close`
- `actionLabel` = ป้ายไทยพร้อมใช้ (ถ้าอยากคุมเอง fallback ไป `action` ได้)
- `actionByDepartment` = แผนกผู้ทำ — **ใช้แยกกรณีอนุมัติหลายรอบ** (เช่น PS มี Mgr 2 ระดับ)
- **`note` เป็น `null` เสมอ** — ระบบไม่มีที่เก็บ note ใน DB (ตัดสินใจแล้วว่าไม่เก็บ)

**`workflow`** — นิยาม workflow ครบทุกขั้น (เหมือนที่ `/workflow` ส่ง) แนบมาให้เพื่อ merge กับ `logs`:
วาดบันได 1→N โดยขั้นที่ยังไม่ถึง (ไม่มีใน `logs`) ทำเป็นสีจาง

**`attachments`** — จาก `ImgPath1/2/3`
- `fileId` = 1/2/3 · `fileName` = ชื่อไฟล์
- **`url` เป็น `null` ตอนนี้** — ยังไม่มี endpoint เสิร์ฟไฟล์ (รอตัดสินใจเรื่อง storage)
  โชว์ชื่อไฟล์ / จำนวนได้ แต่ยังกดดาวน์โหลดไม่ได้

### error
| code | เมื่อไหร่ |
|------|---------|
| 403 | token ไม่มี departId |
| 404 | ไม่พบใบ (`docNo` ไม่มีจริง) หรือไม่รู้จัก `module` |

---

## 2. ฟิลด์ใหม่ในลิสต์ (`/incoming` · `/outgoing`)

เพิ่มใน **ทุก item** ของลิสต์ ไม่ต้องเปลี่ยนวิธีเรียก — ยิงเส้นเดิม params เดิม แล้วได้ฟิลด์เพิ่มมาเลย

| ฟิลด์ | ชนิด | ความหมาย |
|-------|------|---------|
| `phoneNumber` | string? | เบอร์โทรผู้แจ้ง (จาก `BC_IT_Service.PhoneNumber`) |
| `comName` | string? | ชื่อเครื่องที่แจ้ง |
| `remark` | string? | หมายเหตุที่ผู้แจ้งเขียนเพิ่ม |
| `updatedDate` | ISO datetime? | เวลาใบขยับล่าสุด = `MAX(ApproveDate)` ทุกขั้น · ใบที่ยังไม่มีใครอนุมัติ = `requestDate` |
| `attachmentCount` | int | จำนวนไฟล์แนบ (0–3) — ขึ้นไอคอนคลิปในตารางได้เลย |

### `updatedDate` ใช้ทำอะไร
- ทำป้าย **"ค้าง N วัน"** = `now - updatedDate`
- เรียง "ใบไหนเพิ่งขยับ / ค้างนานสุด" ได้ (เดิมเรียงได้แค่ `requestDate`)

---

## 3. สรุปให้ frontend ทำต่อ

1. **หน้ารายละเอียด (กดดวงตา)** → เปลี่ยนไปเรียก `GET /Requests/{module}/{docNo}`
   - หัวเรื่องใช้ `item` (มี `phoneNumber`/`comName`/`remark` ให้ Mgr ตัดสินใจแล้ว)
   - timeline วาดจาก `logs` + `workflow.steps` (ขั้นที่ยังไม่ถึง = สีจาง)
   - ไฟล์แนบโชว์จาก `attachments` (ยังกดโหลดไม่ได้ จนกว่าจะมี url)
2. **ตารางลิสต์** → เพิ่มคอลัมน์/ป้าย: ไอคอนคลิปจาก `attachmentCount`, ป้าย "ค้าง N วัน" จาก `updatedDate`
3. **note** ไม่ต้องส่ง/ไม่ต้องแสดงในไทม์ไลน์ (ระบบไม่เก็บ) — ถ้าเคยส่ง `note` ใน body action อยู่ ปล่อยไว้ได้ backend ไม่ใช้

---

## 4. ยังไม่ได้ทำ (รอบถัดไป)
- `requiredFields` เป็น object (`label`/`type`/`options`) — ตอนนี้ยังเป็น `string[]` (§10)
- action `not_approve` / `cancel` (§11.2)
- upload ไฟล์แนบ + endpoint เสิร์ฟไฟล์ (`url` ถึงจะมีค่า) (§11.6)
