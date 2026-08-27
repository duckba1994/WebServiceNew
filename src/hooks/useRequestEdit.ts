import { useCallback, useState } from 'react';
import { ItRequestUpdatePayload, updateItRequest } from '../api/itRequest';
import { PlRequestUpdatePayload, updatePlRequest } from '../api/plRequest';
import { fetchRequestDetail } from '../api/requests';
import { RequestListItem } from '../types/requestList';

// ok = บันทึกขึ้น DB แล้วจริง · item = แถวล่าสุด (null ได้ทั้งตอนพังและตอนโหลดใหม่ไม่ติด)
export interface EditResult {
  ok: boolean;
  item: RequestListItem | null;
}

export interface EditNotice {
  kind: 'success' | 'error';
  text: string;
  // ข้อมูลบนจอเก่าแล้ว (409 = คนอื่นกดรับเรื่อง/ปิด/ยกเลิกตัดหน้า, 403 = สิทธิ์เปลี่ยน)
  // → ต้องโหลดใบใหม่ ปุ่มที่ค้างอยู่บนจอไม่ตรงกับความจริงแล้ว
  stale?: boolean;
  traceId?: string; // ให้ผู้ใช้อ้างอิงตอนแจ้งทีม backend
}

// ── แก้ไขใบแจ้งเรื่อง (IT / PL) ────────────────────────────────
// PUT /ITRequest/{jobNo} หรือ PUT /PLRequest/{docNo} ตามโมดูลของใบ
// แล้ว "โหลดใบใหม่" เพื่อเอาแถวที่อัปเดตแล้วกลับมา
// (endpoint แก้ไขไม่ได้คืน item มาให้ และ 200 อาจเป็น body เปล่า)
// message ที่ backend ส่งมาเป็นภาษาไทยพร้อมแสดงอยู่แล้ว — ไม่ต้องแต่งเอง
export function useRequestEdit(token?: string) {
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<EditNotice | null>(null);

  const dismissNotice = useCallback(() => setNotice(null), []);

  const save = useCallback(
    async (
      item: RequestListItem,
      payload: ItRequestUpdatePayload | PlRequestUpdatePayload
    ): Promise<EditResult> => {
      setPending(true);
      setNotice(null);
      try {
        // เลือกเส้นตามโมดูลของใบ — payload คนละ shape (ตัวเรียกเป็นคนสร้างให้ตรง
        // ด้วย toUpdatePayload / toPlUpdatePayload ใน data/requestEdit.ts)
        if (item.module === 'PL') {
          await updatePlRequest(item.docNo, payload as PlRequestUpdatePayload, token);
        } else {
          await updateItRequest(item.docNo, payload as ItRequestUpdatePayload, token);
        }
        setNotice({ kind: 'success', text: 'บันทึกการแก้ไขเรียบร้อย' });
        // บันทึกสำเร็จแล้ว — โหลดใบใหม่ล้มเหลวไม่ถือว่าการแก้ไขล้มเหลว
        try {
          const detail = await fetchRequestDetail(item.module, item.docNo, token);
          return { ok: true, item: detail.item };
        } catch {
          return { ok: true, item: null };
        }
      } catch (e: unknown) {
        const status = (e as { status?: number })?.status;
        const traceId = (e as { traceId?: string })?.traceId;
        const msg = e instanceof Error ? e.message : 'บันทึกการแก้ไขไม่สำเร็จ';
        setNotice({
          kind: 'error',
          // 5xx = ทีม backend ต้องตามจาก log — แปะ traceId ไปให้ผู้ใช้อ่านให้ฟัง
          text: traceId && (status ?? 0) >= 500 ? `${msg} (อ้างอิง ${traceId})` : msg,
          stale: status === 409 || status === 403,
          traceId,
        });
        return { ok: false, item: null };
      } finally {
        setPending(false);
      }
    },
    [token]
  );

  return { save, pending, notice, showNotice: setNotice, dismissNotice };
}
