import { DeptRequestLineInput, DeptRequestModule, DeptRequestPayload } from '../api/deptRequest';
import { GA_IM_ATTACH, LineItem, RequestFormState, checkedValues } from './requestForm';

// ── PURE mapping: ฟอร์มใบแจ้งเรื่อง GA/IM → payload ของ POST /{module}Request ──
// ไม่มี JSX/hooks ในไฟล์นี้ (เทสได้) — ดู CLAUDE.md §"Separate data/logic from UI"
//
// สองโมดูลใช้ payload ชุดเดียวกัน ต่างกันจุดเดียวคือคอลัมน์ของ "เลขที่เอกสารแนบ"
// (ดู swapsDocNo ด้านล่าง) จึงต้องรับ module เข้ามาด้วย ไม่ใช่แค่ให้คนเรียกเลือก endpoint

// วันที่จาก <input type="date"> ('YYYY-MM-DD') → datetime ที่ API รับ
// ส่งเป็นเวลาท้องถิ่นแบบไม่มี timezone — ถ้าแปลงเป็น ISO UTC จะโดน timezone ไทย (+07)
// ดึงวันที่ถอยไป 1 วัน
const toApiDate = (ymd: string): string | undefined => (ymd ? `${ymd}T00:00:00` : undefined);

// แถวที่ผู้ใช้กรอกชื่อรายการไว้จริงเท่านั้นถึงจะส่งขึ้นไป
// (ตารางมีแถวว่างค้างไว้เสมออย่างน้อย 1 แถว — ส่งไปจะโดน 400 "ตรวจสอบการป้อนข้อมูล : รายการ")
export const toDeptRequestLines = (items: LineItem[]): DeptRequestLineInput[] =>
  items
    .filter((li) => li.name.trim() !== '')
    .map((li) => ({
      item: li.name.trim(),
      // ส่งเป็นตัวเลขเสมอ ไม่พึ่ง default ฝั่ง API — ฟอร์มบังคับจำนวน > 0 ของทุกแถวที่
      // กรอกชื่อแล้วอยู่ก่อนหน้า (LINE_ITEM_QTY_DEPTS) เลข 1 ตรงนี้จึงเป็นค่ากันเหนียว
      qty: Number(li.qty) || 1,
      // ไม่ระบุหน่วย = ให้ backend ใส่ "หน่วย" ให้เอง
      unit: li.unit.trim() || undefined,
      remark: li.note.trim() || undefined,
    }));

// ── เลขที่เอกสารแนบ: GA เก็บสลับคอลัมน์ ส่วน IM ไม่สลับ ────────
// ตรวจจากหน้าเว็บเก่าโดยตรง (Company.Web/Views/BC/Home) — code-behind ของทั้งสองหน้า
// ผูก control กับคอลัมน์ตรงตัว 1:1 (`.Budget_DocNo = txtBudget_DocNo.Text`)
// ตัวที่สลับคือ "ป้าย" ในไฟล์ .aspx:
//
//   BC_GA_Request_Add.aspx  ป้าย "เลขที่งบประมาณ"      → txtExBudget_DocNo → คอลัมน์ ExBudgetDocNo
//                           ป้าย "เลขที่อนุมัตินอกงบ"   → txtBudget_DocNo   → คอลัมน์ BudgetDocNo
//   BC_IM_Request_Add.aspx  ป้าย "งบประมาณเลขที่"       → txtBudget_DocNo   → คอลัมน์ BudgetDocNo
//                           ป้าย "ใบขออนุมัติงบประมาณเลขที่" → txtExBudget_DocNo → คอลัมน์ ExBudgetDocNo
//
// ข้อมูลเดิมของสองแผนกจึงอยู่คนละคอลัมน์กันจริง ๆ **ห้ามจัดให้เหมือนกันเพื่อความสวยงาม** —
// ทำแล้วใบเก่าของ GA จะโชว์เลขสลับช่องทันที และเว็บเก่ากับเว็บใหม่จะเล่าคนละเรื่อง
// ระหว่างที่ยังใช้คู่กันอยู่
// ⚠️ ช่องติ๊ก (Attach_Budget / Attach_ExBudget) **ไม่สลับ** ทั้งสองหน้า — สลับแค่ช่องเลขที่
// → วันไหน backend ย้ายข้อมูลของ GA ให้ตรงป้ายแล้ว ให้ลบเงื่อนไข GA ตรงนี้ทิ้งทีเดียว
const swapsDocNo = (module: DeptRequestModule): boolean => module === 'GA';

export function toDeptRequestPayload(
  f: RequestFormState,
  requestBy: string,
  module: DeptRequestModule
): DeptRequestPayload {
  const v = f.values;

  // เช็คลิสต์ "สิ่งที่แนบมาด้วย" — เก็บเป็นสตริงเดียวในฟอร์ม (kind='checkboxes')
  const picked = checkedValues(v.attachDocs);
  const has = (opt: string) => picked.includes(opt);
  // ไม่ติ๊ก = ส่งค่าว่าง ไม่ใช่ค่าที่ผู้ใช้เคยพิมพ์ค้างไว้แล้วติ๊กออกทีหลัง
  // (ค่ายังอยู่ในฟอร์ม ติ๊กกลับมาก็ได้ข้อความเดิมคืน ไม่ต้องพิมพ์ใหม่)
  const budgetNo = has(GA_IM_ATTACH.budget) ? (v.budgetNo ?? '').trim() : '';
  const exBudgetNo = has(GA_IM_ATTACH.exBudget) ? (v.exBudgetNo ?? '').trim() : '';
  const swap = swapsDocNo(module);

  return {
    attachBudget: has(GA_IM_ATTACH.budget),
    attachExBudget: has(GA_IM_ATTACH.exBudget),
    attachSpec: has(GA_IM_ATTACH.spec),
    attachQuatation: has(GA_IM_ATTACH.quotation), // สะกดตาม API ห้ามแก้เป็น Quotation
    budgetDocNo: swap ? exBudgetNo : budgetNo,
    exBudgetDocNo: swap ? budgetNo : exBudgetNo,
    requestDetail: v.topicDetail ?? '',
    requestBy,
    // ไม่ส่ง departid / site / docDate — ให้ backend ใช้ค่าจาก token และเวลาปัจจุบัน
    // (site แก้ทีหลังไม่ได้ และ departid ที่ส่งผิดจะทำให้ใบไปอยู่ผิดหน่วยงาน)
    planDate: toApiDate(v.dueDate ?? ''),
    // API รับเป็น "ชื่อ" จาก master (ไม่ใช่ id) — ช่องเลือกในฟอร์มเก็บชื่อไว้ตรง ๆ
    // (ตัวเลือกมาจาก GET /MasterData/{ga|im}) จึงส่งต่อได้เลย
    // ⚠️ ชื่อฟิลด์สลับด้านกับชื่อคีย์ในฟอร์ม: requestType ของฟอร์ม = "ประเภท" (type ของ API)
    //    ส่วน topic ของฟอร์ม = "เรื่องที่แจ้ง" (requestType ของ API) — เหมือนของ PL
    type: v.requestType ?? '',
    requestType: v.topic ?? '',
    // หมายเหตุ (remark) ยังไม่มีช่องในฟอร์ม — ไม่ส่งไปเลย = backend ใช้ค่า default (null)
    // รายการที่ขอไม่บังคับ — ไม่มีแถวที่กรอกจริง = ใบไม่มีรายการย่อย
    lines: toDeptRequestLines(f.lineItems),
  };
}
