คู่มือ frontend — รับเรื่องและดำเนินการ GA / IM

อัปเดตล่าสุด 2026-09-09 · ใช้แทนช่วงรับเรื่องและดำเนินการของ
`BC_GA_Request_Add.aspx` และ `BC_IM_Request_Add.aspx`

ทุก endpoint ต้องแนบ `Authorization: Bearer <token>` และใช้ base URL `/api/v1`

---

## 1. Workflow ที่เกี่ยวข้อง

GA และ IM ใช้หน้าจอร่วมกันได้ ต่างกันเพียงรหัสโมดูลและแผนกปลายทาง

| โมดูล | แผนกปลายทาง | endpoint รายใบ |
|---|---:|---|
| GA | `06` | `/Requests/GA/{docNo}` |
| IM | `18` | `/Requests/IM/{docNo}` |

| step | `wfStatus` | ผู้ทำ | action |
|---:|---|---|---|
| 1 | `Approved-Request` | Mgr หน่วยงานผู้แจ้ง | `approve` |
| 2 | `Receive-Request` | แผนกปลายทาง | `receive` |
| 3 | `Service And Close-Job` | แผนกปลายทาง | `saveService` หรือ `service` |

งานในเอกสารนี้เริ่มที่ step 2 หลัง Mgr อนุมัติแล้ว

- `receive` เลื่อน step 2 → 3
- `saveService` บันทึกข้อมูลได้กี่ครั้งก็ได้และ **ไม่เลื่อน step**
- `service` คือปุ่ม “ดำเนินการเสร็จสิ้น” ประทับผู้ดำเนินการ/วันที่ ปิด step 3 และปิดใบ

> สถานะดิบในหัวตารางของระบบเก่าอาจค้างช้ากว่า workflow หนึ่งขั้น และใบที่ปิดแล้วอาจยังเก็บ
> `JobStatus = 3` อยู่ API จัดสถานะที่ตอบ frontend ให้ถูกต้องจากแถว workflow แล้ว
> frontend ห้ามเดาสถานะจากตัวเลขหรือจากฐานข้อมูลโดยตรง

---

## 2. โหลดใบและเรนเดอร์ปุ่ม

```http
GET /api/v1/Requests/GA/{docNo}
GET /api/v1/Requests/IM/{docNo}
```

ใช้ `item.availableActions` เป็นแหล่งจริงของปุ่ม ห้าม hardcode จาก `wfStep`

ตัวอย่างเมื่ออยู่ขั้นดำเนินการ:

```json
{
  "item": {
    "module": "GA",
    "docNo": "GA-BC-26-003",
    "wfStep": 3,
    "wfStatus": "Service And Close-Job",
    "phase": "in_progress",
    "currentDepartId": "06",
    "isMyTurn": true,
    "availableActions": [
      {
        "code": "saveService",
        "label": "บันทึกรายละเอียด",
        "style": "neutral",
        "requireNote": false,
        "requiredFields": []
      },
      {
        "code": "service",
        "label": "ดำเนินการเสร็จ / ปิดงาน",
        "style": "success",
        "requireNote": false,
        "requiredFields": ["workResults"]
      }
    ],
    "resolution": {
      "repairStatus": "จัดซื้อใหม่",
      "solution": "ยังไม่เรียบร้อย",
      "exPrNo": "PR-2600123",
      "leadTime": 5,
      "servicedBy": null,
      "servicedDate": null
    },
    "remark": "รอสินค้าเข้าคลัง"
  }
}
```

`availableActions` ว่างให้แสดงหน้าอ่านอย่างเดียว อาจเกิดจากยังไม่ถึงคิว, อยู่คนละแผนก,
ใบปิด/ยกเลิก หรือมีคนอื่นกดทำรายการไปแล้ว

`docNo` ให้ส่งผ่าน `encodeURIComponent` หนึ่งครั้งก่อนประกอบ path

---

## 3. รับเรื่อง — action `receive`

แผนก GA (`06`) หรือ IM (`18`) กดรับเรื่องได้เมื่อใบอยู่ `Receive-Request`
ไม่ต้องกรอกฟิลด์และไม่ต้องมีสิทธิ์ Mgr

```http
POST /api/v1/Requests/GA/GA-BC-26-003/action
Content-Type: application/json
```

```json
{ "action": "receive" }
```

เมื่อสำเร็จ:

- workflow step 2 ถูกประทับ `Approved`, ผู้กด และเวลาจาก JWT/server
- ใบย้ายไป step 3 `Service And Close-Job`
- badge ของคิวถูกย้ายตาม transaction เดียวกัน
- response คืน `item` ล่าสุด ใช้แทน state เดิมได้เลย ไม่ต้อง GET ซ้ำ

```json
{
  "module": "GA",
  "docNo": "GA-BC-26-003",
  "action": "receive",
  "message": "รับเรื่องเรียบร้อย — ส่งต่อไปยัง แจ้งเรื่อง GA",
  "previousStep": 2,
  "currentStep": 3,
  "item": {}
}
```

ข้อความปลายทางใน `message` อาจเป็นชื่อแผนกจริงจากฐาน ให้แสดงข้อความที่ API คืนมาโดยตรง

---

## 4. ช่องของหน้าดำเนินการ

ชื่อ field ของ API ใช้ shape กลางร่วมกับโมดูลอื่น จึงไม่ตรงชื่อคอลัมน์ GA/IM ทุกตัว

| ช่องบนหน้า | field ตอนส่ง | อ่านกลับ | ข้อจำกัด |
|---|---|---|---|
| ดำเนินการโดย | `repairStatus` | `item.resolution.repairStatus` | ต้องเป็นค่าจากรายการด้านล่าง |
| Referent PR / PR | `exPrNo` | `item.resolution.exPrNo` | ไม่เกิน 20 ตัวอักษร |
| ระยะเวลา (วัน) | `leadTime` | `item.resolution.leadTime` | GA เท่านั้น, 0–100 |
| ผลการดำเนินงาน | `workResults` | `item.resolution.solution` | `ยังไม่เรียบร้อย` หรือ `จัดการเรียบร้อย` |
| หมายเหตุ | `remark` | `item.remark` | ไม่เกิน 500 ตัวอักษร |
| ผู้ดำเนินการ | ไม่ต้องส่ง | `item.resolution.servicedBy` | backend เติมเมื่อกด `service` |
| วันที่ | ไม่ต้องส่ง | `item.resolution.servicedDate` | backend เติมเมื่อกด `service` |

IM ต้องซ่อน `leadTime` เหมือนหน้าเดิม ค่า `leadTime` ที่ส่งไป IM จะไม่ถูกบันทึก

### ตัวเลือก “ดำเนินการโดย” ของ GA

```text
ยังไม่ดำเนินการ
มีอุปกรณ์ในสต๊อก
ผู้รับเหมา/ร้านค้า
จัดซื้อใหม่
ซ่อมภายนอก
อื่นๆ ระบุหมายเหตุ
```

หน้าเดิมของ GA แสดงคำว่า “ซ่อม” แต่ value ที่บันทึกจริงคือ `ซ่อมภายนอก`

### ตัวเลือก “ดำเนินการโดย” ของ IM

```text
ยังไม่ดำเนินการ
มีอุปกรณ์ในสต๊อก
จัดซื้อใหม่
ส่งซ่อมภายนอก
อื่นๆ ระบุหมายเหตุ
```

### ตัวเลือก “ผลการดำเนินงาน”

```text
ยังไม่เรียบร้อย
จัดการเรียบร้อย
```

ค่าต้องตรงตามข้อความข้างบน ห้ามแก้คำสะกดหรือส่ง id

---

## 5. บันทึกระหว่างดำเนินการ — action `saveService`

ใช้ปุ่มนี้หรือทำ autosave ก็ได้ เรียกซ้ำได้ตลอดตราบใดที่ใบยังอยู่ step 3

```json
{
  "action": "saveService",
  "fields": {
    "repairStatus": "จัดซื้อใหม่",
    "exPrNo": "PR-2600123",
    "leadTime": 5,
    "workResults": "ยังไม่เรียบร้อย",
    "remark": "รอสินค้าเข้าคลัง"
  }
}
```

กติกา:

- field ที่ไม่ส่งหรือเป็น `null` = คงค่าเดิม
- string ว่าง = ล้างค่าเดิมเป็น `null`
- `saveService` ไม่ประทับ workflow, ไม่เปลี่ยน badge และไม่เลื่อน step
- `servicedBy` / `servicedDate` ยังเป็น `null` จนกว่าจะกด `service`
- response คืน `item` ล่าสุด ให้ set state จาก `body.item`

```json
{
  "action": "saveService",
  "message": "บันทึกรายละเอียดเรียบร้อย",
  "previousStep": 3,
  "currentStep": 3,
  "previousJobStatus": "3",
  "currentJobStatus": "3",
  "item": {}
}
```

---

## 6. ดำเนินการเสร็จสิ้น — action `service`

ก่อนกดควรมี dialog ยืนยัน เพราะสำเร็จแล้วใบปิดและย้อนกลับมาแก้ไม่ได้

```json
{
  "action": "service",
  "fields": {
    "repairStatus": "จัดซื้อใหม่",
    "exPrNo": "PR-2600123",
    "leadTime": 5,
    "workResults": "จัดการเรียบร้อย",
    "remark": "รับสินค้าและส่งมอบแล้ว"
  }
}
```

ข้อบังคับจากเว็บเดิม:

- `workResults` ต้องเป็น `จัดการเรียบร้อย` เท่านั้น
- backend ใช้ชื่อผู้กดจาก JWT เป็น `servicedBy`
- backend ใช้เวลาปัจจุบันเป็น `servicedDate`
- step 3 ถูกอนุมัติและใบกลายเป็น `phase: "closed"`
- `availableActions` หลังสำเร็จเป็น array ว่าง

แม้หัวตาราง legacy จะยังคง `WFStep = 3`, `WFStatus = "Service And Close-Job"` และ
`JobStatus = 3` ตาม BLL เดิม API จะตอบค่าที่ normalize แล้วเป็นสถานะปิด ห้ามให้ frontend
ตัดสินการปิดจากค่าดิบเหล่านี้ ให้ใช้ `item.phase === "closed"`

---

## 7. ตัวอย่างโค้ด frontend

```js
const base = '/api/v1/Requests';
const requestPath = (module, docNo) =>
  `${base}/${module}/${encodeURIComponent(docNo)}`;

async function runAction(module, docNo, action, fields, token) {
  const res = await fetch(`${requestPath(module, docNo)}/action`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action, fields }),
  });

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw Object.assign(
      new Error(body?.message ?? 'ทำรายการไม่สำเร็จ'),
      { status: res.status, traceId: body?.traceId }
    );
  }

  return body;
}

// รับเรื่อง
const received = await runAction(module, docNo, 'receive', null, token);
setItem(received.item);

// บันทึกระหว่างทำงาน — ไม่เลื่อน step
const saved = await runAction(module, docNo, 'saveService', form, token);
setItem(saved.item);

// ดำเนินการเสร็จสิ้น — ปิด step/ปิดใบ
const completed = await runAction(
  module,
  docNo,
  'service',
  { ...form, workResults: 'จัดการเรียบร้อย' },
  token
);
setItem(completed.item);
```

---

## 8. Error ที่ต้องรองรับ

```json
{ "statusCode": 409, "message": "ข้อความภาษาไทย", "traceId": "..." }
```

| HTTP | กรณี | การจัดการ |
|---:|---|---|
| 400 | ค่า dropdown ไม่ถูกต้อง, PR/หมายเหตุยาวเกิน, `leadTime` นอก 0–100, กดจบโดยผลยังไม่เรียบร้อย | แสดง `message` |
| 401 | token หมดอายุ | กลับหน้า login |
| 403 | token ไม่มี `departId` | แสดง `message` |
| 404 | ไม่พบโมดูลหรือเลขที่ใบ | กลับหน้ารายการ |
| 409 | ไม่ใช่คิวของแผนก, ใบถูกกดตัดหน้า, ปิดหรือยกเลิกแล้ว | แสดง `message` แล้ว GET ใบใหม่ |

เมื่อได้ 409 ห้าม retry action อัตโนมัติ เพราะ state เปลี่ยนไปแล้ว

---

## 9. Checklist ฝั่ง frontend

- [ ] ใช้ `availableActions` สร้างปุ่ม ไม่เดาจากเลข step
- [ ] ปุ่มรับเรื่องส่ง `{ action: "receive" }`
- [ ] ปุ่มบันทึกส่ง `saveService` และไม่พาผู้ใช้ออกจากหน้า
- [ ] ปุ่มดำเนินการเสร็จส่ง `service` พร้อม `workResults: "จัดการเรียบร้อย"`
- [ ] GA แสดง `leadTime` ช่วง 0–100; IM ซ่อนช่องนี้
- [ ] หลัง action สำเร็จใช้ `body.item` แทน state เดิม
- [ ] จับ 409 แล้วโหลดรายละเอียดใหม่
- [ ] ใช้ `phase === "closed"` ตัดสินว่าใบปิดแล้ว

---

## ที่มาจากระบบเดิม

- ฟอร์ม: `Views/BC/Home/BC_GA_Request_Add.aspx(.vb)` และ `BC_IM_Request_Add.aspx(.vb)`
- การเดิน workflow: `BC_GA_RequestBLL.ApproveUpdate` และ `BC_IM_RequestBLL.ApproveUpdate`
- GA บันทึก `LeadTime` ช่วง 0–100; IM ซ่อนช่องและ comment การบันทึกไว้
- ทั้งสองโมดูลยอมให้ปิดงานเมื่อ `WorkResults = "จัดการเรียบร้อย"` เท่านั้น