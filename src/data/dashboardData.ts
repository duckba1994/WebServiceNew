import { RequestListItem, RequestPhaseSummary } from '../types/requestList';
import { isRequesterSide } from './requestPhase';
import { requestKey } from './requestListData';

// ── ตรรกะของหน้าภาพรวม (ล้วน ๆ ไม่มี JSX/hook) ─────────────────
// หน้าภาพรวมตอบคำถามเดียว: "แผนกเราต้องลงมือกับใบไหนบ้าง"
// ซึ่งมาจาก 2 ทางที่คนละ endpoint แต่ผู้ใช้มองว่าเป็นกองเดียวกัน:
//   1. งานที่คนอื่นแจ้งเข้ามาแล้วถึงคิวเรา       → incoming + isMyTurn
//   2. ใบที่เราแจ้งออกไปแล้ววนกลับมาให้เรากด    → outgoing + ownerType 'requester'
// ข้อ 2 คือใบที่ค้างเงียบที่สุดในระบบ เพราะปลายทางทำเสร็จแล้วไม่มีใครตามต่อ

export type TodoOrigin = 'incoming' | 'outgoing';

export interface TodoRow {
  key: string;
  item: RequestListItem;
  origin: TodoOrigin;
  days: number | null; // ค้างมากี่วัน — null = API ไม่ได้ส่งวันที่มา
}

const MS_PER_DAY = 86400000;

// ค้างมากี่วัน — นับจากครั้งล่าสุดที่ใบขยับ (updatedDate) ถ้าไม่มีก็นับจากวันที่แจ้ง
// updatedDate เป็น optional field ของ API v2.3 — แผนก/endpoint ที่ยังไม่ส่งมา
// จะได้ตัวเลขที่หยาบกว่า แต่ยังบอกได้ว่า "ใบนี้เก่ากว่าใบนั้น"
export const daysWaiting = (item: RequestListItem): number | null => {
  const src = item.updatedDate || item.requestDate;
  if (!src) return null;
  const t = new Date(src).getTime();
  if (Number.isNaN(t)) return null;
  const days = Math.floor((Date.now() - t) / MS_PER_DAY);
  return days < 0 ? 0 : days; // ใบลงวันที่ล่วงหน้าไม่ควรโชว์ค้างติดลบ
};

// รวมสองกองเป็นรายการเดียว เรียงใบที่ค้างนานสุดขึ้นก่อน
// ใบที่ไม่รู้วันที่ (days = null) ไปท้ายสุด — เดาแทนไม่ได้ว่าค้างนานแค่ไหน
export const buildTodoRows = (
  incoming: RequestListItem[],
  outgoing: RequestListItem[]
): TodoRow[] => {
  const rows: TodoRow[] = [
    ...incoming.filter((r) => r.isMyTurn).map((item) => row(item, 'incoming')),
    ...outgoing.filter(isRequesterSide).map((item) => row(item, 'outgoing')),
  ];
  return rows.sort((a, b) => {
    if (a.days === b.days) return 0;
    if (a.days === null) return 1;
    if (b.days === null) return -1;
    return b.days - a.days;
  });
};

const row = (item: RequestListItem, origin: TodoOrigin): TodoRow => ({
  key: requestKey(item),
  item,
  origin,
  days: daysWaiting(item),
});

export const TODO_ORIGIN_META: Record<TodoOrigin, { label: string; hint: string }> = {
  incoming: { label: 'งานแจ้งเข้ามา', hint: 'แผนกอื่นแจ้งเข้ามา — ถึงคิวเราต้องลงมือ' },
  outgoing: { label: 'งานที่แจ้งออกไป', hint: 'ปลายทางทำเสร็จแล้ว รอเรากดรับงาน/ปิดงาน' },
};

export const totalOf = (summary: RequestPhaseSummary[]): number =>
  summary.reduce((sum, p) => sum + p.count, 0);

export const countOfPhase = (summary: RequestPhaseSummary[], phase: string): number =>
  summary.find((p) => p.phase === phase)?.count ?? 0;
