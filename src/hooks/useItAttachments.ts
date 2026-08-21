import { useCallback, useEffect, useState } from 'react';
import {
  ItAttachment,
  checkItAttachment,
  deleteItAttachment,
  uploadItAttachment,
} from '../api/itRequest';
import { RequestAttachment } from '../types/requestList';

// แปลง error เป็นข้อความไทยที่ผู้ใช้ทำอะไรต่อได้
//   413 = IIS ตัดก่อนถึงแอป body ที่ได้ไม่ใช่ JSON ของ API → ต้องมีข้อความตายตัวรองรับ
//   5xx = ทีม backend ต้องตามจาก log → แปะ traceId ให้ผู้ใช้อ่านให้ฟัง
const errorText = (e: unknown, fallback: string): string => {
  const status = (e as { status?: number })?.status;
  const traceId = (e as { traceId?: string })?.traceId;
  if (status === 413) return 'ไฟล์ใหญ่เกินกว่าที่เซิร์ฟเวอร์รับได้ — ย่อรูปแล้วลองใหม่';
  const msg = e instanceof Error ? e.message : fallback;
  return traceId && (status ?? 0) >= 500 ? `${msg} (อ้างอิง ${traceId})` : msg;
};

// ── รูปแนบใบ IT (3 ช่อง) ───────────────────────────────────────
// อัปโหลด/ลบเป็นคนละ endpoint กับการแก้ไขข้อความ และมีผลทันทีทีละช่อง
// → ไม่ได้รอปุ่ม "บันทึก" ของฟอร์ม (จะ stage ไว้ก็ทำไม่ได้ เพราะ endpoint เป็นรายช่อง)
// ทุก response คืนสถานะครบทั้ง 3 ช่องกลับมา จึงเอามาทับ state ได้ทั้งก้อน
//
// สิทธิ์เหมือนการแก้ไขใบทุกประการ — 403/409 แปลว่าจอเก่าแล้ว ให้โหลดใบใหม่
const normalize = (list: RequestAttachment[] | ItAttachment[] | null): ItAttachment[] =>
  (list ?? [])
    .filter((f) => f.url) // ช่องที่ยังไม่มีรูปจริงเอามาแสดงไม่ได้
    .map((f) => ({ fileId: Number(f.fileId), fileName: f.fileName, url: f.url as string }));

export function useItAttachments(
  jobNo: string,
  initial: RequestAttachment[] | null,
  token?: string,
  // เรียกหลังทำรายการเสร็จ (ทั้งสำเร็จและล้มเหลว) — สำเร็จ = ใบมีรูปใหม่,
  // ล้มเหลวด้วย 403/409 = ใบขยับไปแล้ว ทั้งสองกรณีต้องโหลดใบใหม่
  onChanged?: () => void
) {
  const [attachments, setAttachments] = useState<ItAttachment[]>(() => normalize(initial));
  const [busySlot, setBusySlot] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ใบถูกโหลดใหม่ (หลังกด action / แก้ไข) → sync ตามของจริงจาก server
  // เทียบด้วย url ที่ต่อกันเป็นสตริง เพราะ array ตัวใหม่ทุกครั้งที่ fetch
  const initialKey = normalize(initial)
    .map((f) => `${f.fileId}:${f.fileName}`)
    .join('|');
  useEffect(() => {
    setAttachments(normalize(initial));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialKey, jobNo]);

  const slotOf = useCallback(
    (slot: number): ItAttachment | undefined => attachments.find((f) => f.fileId === slot),
    [attachments]
  );

  const upload = useCallback(
    async (slot: number, file: File): Promise<boolean> => {
      // กรองที่หน้าเว็บก่อน ไม่ให้ผู้ใช้รออัป 10 MB แล้วค่อยโดนปฏิเสธ
      // (backend ตรวจ magic bytes ซ้ำอยู่ดี — เปลี่ยนนามสกุลมาหลอกไม่ผ่าน)
      const bad = checkItAttachment(file);
      if (bad) {
        setError(bad);
        return false;
      }
      setBusySlot(slot);
      setError(null);
      try {
        const res = await uploadItAttachment(jobNo, slot, file, token);
        setAttachments(normalize(res.attachments));
        return true;
      } catch (e: unknown) {
        setError(errorText(e, 'อัปโหลดรูปไม่สำเร็จ'));
        return false;
      } finally {
        setBusySlot(null);
        onChanged?.();
      }
    },
    [jobNo, token, onChanged]
  );

  const remove = useCallback(
    async (slot: number): Promise<boolean> => {
      setBusySlot(slot);
      setError(null);
      try {
        const res = await deleteItAttachment(jobNo, slot, token);
        setAttachments(normalize(res.attachments));
        return true;
      } catch (e: unknown) {
        setError(errorText(e, 'ลบรูปไม่สำเร็จ'));
        return false;
      } finally {
        setBusySlot(null);
        onChanged?.();
      }
    },
    [jobNo, token, onChanged]
  );

  return { attachments, slotOf, upload, remove, busySlot, error, clearError: () => setError(null) };
}
