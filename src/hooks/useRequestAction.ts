import { useCallback, useState } from 'react';
import { postRequestAction } from '../api/requests';
import { RequestAction, RequestActionResult, RequestListItem } from '../types/requestList';
import { ActionFieldValues } from '../data/requestActionFields';

export interface ActionNotice {
  kind: 'success' | 'error';
  text: string;
  // ต้องโหลดลิสต์ใหม่ไหม — 409 แปลว่าสถานะขยับไปแล้ว ข้อมูลบนจอเก่า
  stale?: boolean;
}

// ── กดปุ่มดำเนินการกับใบแจ้งเรื่อง ────────────────────────────
// POST /Requests/{module}/{docNo}/action แล้วแปลผลเป็นข้อความให้ผู้ใช้อ่าน
//
// message ที่ API ส่งมาเป็นภาษาไทยพร้อมแสดงอยู่แล้ว ทั้งกรณีสำเร็จ
// ("อนุมัติเรียบร้อย — ส่งต่อไปยัง …") และกรณีทำไม่ได้ ("รายการนี้อนุมัติไปแล้ว")
// → หน้าเว็บไม่ต้องแต่งข้อความเอง แค่เอาไปโชว์
export function useRequestAction(token?: string) {
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<ActionNotice | null>(null);

  const dismissNotice = useCallback(() => setNotice(null), []);

  const run = useCallback(
    async (
      item: RequestListItem,
      action: RequestAction,
      note: string,
      fields?: ActionFieldValues
    ): Promise<RequestActionResult | null> => {
      setPending(true);
      setNotice(null);
      try {
        const res = await postRequestAction(
          item.module,
          item.docNo,
          { action: action.code, note: note.trim() ? note.trim() : null, fields },
          token
        );
        setNotice({ kind: 'success', text: res.message || 'ทำรายการเรียบร้อย' });
        return res;
      } catch (e: unknown) {
        // 409 = คนอื่นกดไปก่อน / ไม่ใช่คิวแผนกนี้แล้ว → ข้อมูลบนจอไม่ตรงกับของจริง
        const status = (e as { status?: number })?.status;
        setNotice({
          kind: 'error',
          text: e instanceof Error ? e.message : 'ทำรายการไม่สำเร็จ',
          stale: status === 409,
        });
        return null;
      } finally {
        setPending(false);
      }
    },
    [token]
  );

  return { run, pending, notice, dismissNotice };
}
