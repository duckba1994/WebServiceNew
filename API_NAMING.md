# API Naming Convention

แนวทางสำหรับ Claude Code เมื่อทำงานกับข้อมูลจาก API ในโปรเจกต์นี้

## กฎหลัก (บังคับ)

**เมื่อผู้ใช้ส่ง response body จาก API มาให้ ต้องใช้ชื่อฟิลด์ตาม API ทุกตัว "ห้ามเปลี่ยน"**

- ใช้ชื่อ property / key ตามที่ปรากฏใน response body **เป๊ะ** — ตรงตามตัวพิมพ์ใหญ่-เล็ก (case-sensitive) เช่น `BookingNo`, `CustomerName`, `StatusDoc`
- **ห้าม** เปลี่ยนเป็น camelCase / snake_case / หรือชื่อที่คิดว่า "อ่านง่ายกว่า"
- **ห้าม** ย่อ, ต่อเติม, หรือแปลชื่อฟิลด์
- **ห้าม** เดาชื่อฟิลด์เอง — ถ้าไม่มีใน response body ที่ได้รับ ให้ถามผู้ใช้ก่อน

## ขอบเขตการใช้ชื่อจาก API

ให้คงชื่อจาก API ไว้ตลอดตั้งแต่ต้นทางถึงปลายทาง:

- **TypeScript types / interfaces** ใน `src/types/<domain>.ts` — ตั้งชื่อ property ตาม API
- **API layer** ใน `src/api/*.ts` — ตัวแปรที่ deserialize จาก response ใช้ชื่อตาม API
- **Query params** ที่ส่งไป backend — ใช้ชื่อ param ตามที่ API กำหนด (เช่น `BookingQuery`: `BookingNo` / `CustomerName` / `MachineID` / `StatusDoc` / `showDataAll`)

## จุดที่ "อนุญาต" ให้ใช้ชื่ออื่นได้

ชื่อสำหรับ **แสดงผล (display) เป็นภาษาไทยบน UI** ไม่ถือเป็นการเปลี่ยนชื่อฟิลด์ — label/หัวตารางที่ผู้ใช้เห็นยังคงเป็นภาษาไทยตาม design ได้ตามปกติ แต่ **key ที่ผูกกับข้อมูล** ต้องเป็นชื่อจาก API เสมอ

หากต้องการ mapping ระหว่างชื่อ API → row ที่ใช้ในตาราง ให้ทำผ่านฟังก์ชัน map แบบชัดเจน (เช่น `mapBookingApi` ใน `src/data/bookingData.ts`) โดยฝั่ง input ต้องอ้างอิงชื่อ API ตรง ๆ

## ตัวอย่าง

สมมติได้ response body:

```json
{
  "BookingNo": "BK-2026-0001",
  "CustomerName": "บริษัท ตัวอย่าง จำกัด",
  "MachineID": 1024,
  "StatusDoc": "P"
}
```

✅ ถูก:

```ts
interface Booking {
  BookingNo: string;
  CustomerName: string;
  MachineID: number;
  StatusDoc: string;
}
```

❌ ผิด (เปลี่ยนชื่อฟิลด์):

```ts
interface Booking {
  bookingNumber: string;   // ห้าม — เปลี่ยนชื่อ
  customer_name: string;   // ห้าม — เปลี่ยน case
  machineId: number;       // ห้าม — เปลี่ยน case
  documentStatus: string;  // ห้าม — แปล/เปลี่ยนชื่อ
}
```
