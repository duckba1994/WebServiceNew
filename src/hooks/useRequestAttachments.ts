import { useCallback } from 'react';
import {
  IT_ATTACHMENT_SLOTS,
  IT_ATTACH_EXTENSIONS,
  ItAttachment,
  checkItAttachment,
  deleteItAttachment,
  uploadItAttachment,
} from '../api/itRequest';
import {
  PL_ATTACHMENT_SLOTS,
  PL_ATTACH_EXTENSIONS,
  checkPlAttachment,
  deletePlAttachment,
  uploadPlAttachment,
} from '../api/plRequest';

// ── รูปแนบใบแจ้งเรื่อง (3 ช่อง) ─────────────────────────────────
// แต่ละโมดูลมี endpoint ของตัวเอง (/ITRequest/… , /PLRequest/…) แต่สัญญาเหมือนกัน
// เป๊ะ — ช่อง 1-3, ทับช่องเดิมได้, ทุก response คืนสถานะครบทั้ง 3 ช่อง
// เพิ่มแผนกใหม่ = เพิ่ม 1 บรรทัดในตารางนี้ ไม่ต้องแตะตัว hook
//
// ⚠️ endpoint เป็น "รายช่อง" และมีผลทันทีที่ยิง ไม่มี batch และไม่มีสถานะร่าง
// หน้าเว็บจึงพักการเปลี่ยนแปลงไว้ในหน่วยความจำก่อน (PendingAttachment) แล้วค่อย
// ยิงตอนผู้ใช้กดบันทึก — เพื่อให้รูปแนบทำงานเป็นชุดเดียวกับฟิลด์อื่นในฟอร์มแก้ไข
// (ผู้ใช้: "ไม่ใช่เพิ่มรูปลบรูปแล้วมีผลเลย โดยยังไม่กดบันทึก" — 27 ส.ค. 2026)

// การเปลี่ยนแปลงของช่องหนึ่งที่ยังค้างรอกดบันทึก
//   upload = เลือกไฟล์ใหม่ทับช่องนั้น (previewUrl = object URL ไว้โชว์ก่อนยิงจริง)
//   delete = สั่งลบรูปเดิมของช่องนั้น
export type PendingAttachment =
  | { kind: 'upload'; file: File; previewUrl: string }
  | { kind: 'delete' };

// map ตามหมายเลขช่อง — ช่องที่ไม่มีคีย์ = ไม่ถูกแตะ
export type PendingAttachments = Record<number, PendingAttachment>;

// ผลของการยิงทั้งชุด — done = ช่องที่มีผลจริงแล้ว (ย้อนคืนไม่ได้)
export interface ApplyAttachmentsResult {
  done: number[];
  errors: string[];
}

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

interface AttachmentApi {
  slots: readonly number[];
  extensions: string[];
  check: (file: File) => string | null;
  upload: (docNo: string, slot: number, file: File, token?: string) => Promise<{ attachments: ItAttachment[] }>;
  remove: (docNo: string, slot: number, token?: string) => Promise<{ attachments: ItAttachment[] }>;
}

const ATTACHMENT_API: Record<string, AttachmentApi> = {
  IT: {
    slots: IT_ATTACHMENT_SLOTS,
    extensions: IT_ATTACH_EXTENSIONS,
    check: checkItAttachment,
    upload: uploadItAttachment,
    remove: deleteItAttachment,
  },
  PL: {
    slots: PL_ATTACHMENT_SLOTS,
    extensions: PL_ATTACH_EXTENSIONS,
    check: checkPlAttachment,
    upload: uploadPlAttachment,
    remove: deletePlAttachment,
  },
};

// โมดูลที่ยังไม่มีเส้นรูปแนบ — ปิดปุ่มไปเลย ดีกว่ายิงไปโดน 404 แล้วขึ้น error งง ๆ
const NO_ATTACHMENT_API: AttachmentApi = {
  slots: [],
  extensions: [],
  check: () => 'โมดูลนี้ยังไม่รองรับการแนบรูป',
  upload: () => Promise.reject(new Error('โมดูลนี้ยังไม่รองรับการแนบรูป')),
  remove: () => Promise.reject(new Error('โมดูลนี้ยังไม่รองรับการแนบรูป')),
};

export const attachmentApiOf = (module: string): AttachmentApi =>
  ATTACHMENT_API[module] ?? NO_ATTACHMENT_API;

// สิทธิ์เหมือนการแก้ไขใบทุกประการสำหรับผู้แจ้ง แต่แผนกปลายทางมีสิทธิ์ของตัวเอง
// (canAttach ของ API) — 403/409 แปลว่าจอเก่าแล้ว ให้โหลดใบใหม่
export function useRequestAttachments(module: string, jobNo: string, token?: string) {
  const api = attachmentApiOf(module);

  // ยิงตามที่ค้างไว้ทีละช่องเรียงกัน (ไม่ยิงพร้อมกัน) — endpoint ไม่มี batch
  // ⚠️ ช่องที่ผ่านไปแล้วมีผลจริงทันที ย้อนคืนไม่ได้ ถ้าช่องหลังพังจึงต้องบอกให้ชัด
  // ว่าช่องไหนสำเร็จช่องไหนไม่ ไม่ใช่รายงานรวมว่า "บันทึกไม่สำเร็จ" ทั้งก้อน
  const applyPending = useCallback(
    async (pending: PendingAttachments): Promise<ApplyAttachmentsResult> => {
      const done: number[] = [];
      const errors: string[] = [];
      const slots = Object.keys(pending)
        .map(Number)
        .sort((a, b) => a - b);

      for (const slot of slots) {
        const change = pending[slot];
        try {
          if (change.kind === 'upload') await api.upload(jobNo, slot, change.file, token);
          else await api.remove(jobNo, slot, token);
          done.push(slot);
        } catch (e: unknown) {
          const fallback = change.kind === 'upload' ? 'อัปโหลดรูปไม่สำเร็จ' : 'ลบรูปไม่สำเร็จ';
          errors.push(`ช่องที่ ${slot}: ${errorText(e, fallback)}`);
        }
      }
      return { done, errors };
    },
    [api, jobNo, token]
  );

  return { slots: api.slots, extensions: api.extensions, check: api.check, applyPending };
}
