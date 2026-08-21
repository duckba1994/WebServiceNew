import { useCallback, useState } from 'react';
import { ItRequestUpdatePayload, updateItRequest } from '../api/itRequest';
import { fetchRequestDetail } from '../api/requests';
import { RequestListItem } from '../types/requestList';

export interface EditNotice {
  kind: 'success' | 'error';
  text: string;
  // ข้อมูลบนจอเก่าแล้ว (409 = คนอื่นกดรับเรื่อง/ปิด/ยกเลิกตัดหน้า, 403 = สิทธิ์เปลี่ยน)
  // → ต้องโหลดใบใหม่ ปุ่มที่ค้างอยู่บนจอไม่ตรงกับความจริงแล้ว
  stale?: boolean;
  traceId?: string; // ให้ผู้ใช้อ้างอิงตอนแจ้งทีม backend
}

// ── แก้ไขใบแจ้งเรื่อง IT ───────────────────────────────────────
// PUT /ITRequest/{jobNo} แล้ว "โหลดใบใหม่" เพื่อเอาแถวที่อัปเดตแล้วกลับมา
// (endpoint แก้ไขไม่ได้คืน item มาให้ และ 200 อาจเป็น body เปล่า)
// message ที่ backend ส่งมาเป็นภาษาไทยพร้อมแสดงอยู่แล้ว — ไม่ต้องแต่งเอง
export function useRequestEdit(token?: string) {
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<EditNotice | null>(null);

  const dismissNotice = useCallback(() => setNotice(null), []);

  const save = useCallback(
    async (
      item: RequestListItem,
      payload: ItRequestUpdatePayload
    ): Promise<RequestListItem | null> => {
      setPending(true);
      setNotice(null);
      try {
        await updateItRequest(item.docNo, payload, token);
        setNotice({ kind: 'success', text: 'บันทึกการแก้ไขเรียบร้อย' });
        // บันทึกสำเร็จแล้ว — โหลดใบใหม่ล้มเหลวไม่ถือว่าการแก้ไขล้มเหลว
        try {
          const detail = await fetchRequestDetail(item.module, item.docNo, token);
          return detail.item;
        } catch {
          return null;
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
        return null;
      } finally {
        setPending(false);
      }
    },
    [token]
  );

  return { save, pending, notice, dismissNotice };
}
