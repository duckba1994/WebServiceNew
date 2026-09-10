import { useCallback, useState } from 'react';
import { ItRequestUpdatePayload, updateItRequest } from '../api/itRequest';
import { PlRequestUpdatePayload, updatePlRequest } from '../api/plRequest';
import { CrRequestUpdatePayload, updateCrRequest } from '../api/crRequest';
import {
  DeptRequestUpdatePayload,
  isDeptRequestModule,
  updateDeptRequest,
} from '../api/deptRequest';
import { fetchRequestDetail } from '../api/requests';
import { AfRequestUpdatePayload, updateAfRequest } from '../api/afRequest';
import { HR_PR_MODULE, HrPrRequestUpdatePayload, updateHrPrRequest } from '../api/hrPrRequest';
import { SQA_MODULE, SqaRequestUpdatePayload, updateSqaRequest } from '../api/sqaRequest';
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
      payload:
        | ItRequestUpdatePayload
        | PlRequestUpdatePayload
        | CrRequestUpdatePayload
        | DeptRequestUpdatePayload
        | AfRequestUpdatePayload
        | HrPrRequestUpdatePayload
        | SqaRequestUpdatePayload
    ): Promise<EditResult> => {
      setPending(true);
      setNotice(null);
      try {
        // เลือกเส้นตามโมดูลของใบ — payload คนละ shape (ตัวเรียกเป็นคนสร้างให้ตรง
        // ด้วย toUpdatePayload / toPlUpdatePayload / toCrUpdatePayload / toDeptUpdatePayload
        // ใน data/requestEdit.ts)
        if (item.module === 'PL') {
          await updatePlRequest(item.docNo, payload as PlRequestUpdatePayload, token);
        } else if (item.module === 'CR') {
          await updateCrRequest(item.docNo, payload as CrRequestUpdatePayload, token);
        } else if (isDeptRequestModule(item.module)) {
          // GA / IM — payload ชุดเดียวกัน ต่างแค่ base path
          await updateDeptRequest(item.module, item.docNo, payload as DeptRequestUpdatePayload, token);
        } else if (item.module === 'AF') {
          await updateAfRequest(item.docNo, payload as AfRequestUpdatePayload, token);
        } else if (item.module === HR_PR_MODULE) {
          await updateHrPrRequest(item.docNo, payload as HrPrRequestUpdatePayload, token);
        } else if (item.module === SQA_MODULE) {
          await updateSqaRequest(item.docNo, payload as SqaRequestUpdatePayload, token);
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
        let msg = e instanceof Error ? e.message : 'บันทึกการแก้ไขไม่สำเร็จ';
        // เส้นแก้ไขใบ CR ยังไม่ถูกพอร์ตมา (ดู MdApi/API_SPEC_CR_FLOW.md §4)
        // 404/405 จึงมักแปลว่า "ยังไม่มีเส้น" ไม่ใช่ "ไม่พบใบ" — บอกให้ตรงเหตุ
        // ดีกว่าปล่อยให้ผู้ใช้เห็นรหัส HTTP เปล่า ๆ แล้วเดาว่าตัวเองทำอะไรผิด
        if (item.module === 'CR' && (status === 404 || status === 405)) {
          msg = 'ระบบยังไม่เปิดให้แก้ไขใบ CR — กรุณาแจ้งผู้ดูแลระบบ (ข้อมูลที่แก้ไว้ยังอยู่ในฟอร์ม)';
        }
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
