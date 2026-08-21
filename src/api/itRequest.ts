import { apiFetch, apiSend, apiSendForm, apiSendNoContent } from './client';

// ── ใบแจ้งเรื่อง IT ─────────────────────────────────────────
// POST /api/v1/ITRequest — ชื่อฟิลด์ตาม contract ของ backend (ห้ามเปลี่ยนชื่อ)
export interface ItRequestPayload {
  requestBy: string; // ชื่อ-นามสกุลผู้แจ้ง (fullName จาก login)
  departid: string; // รหัสหน่วยงานของผู้แจ้ง (departid จาก login)
  phoneNumber: string; // เบอร์ติดต่อที่ผู้แจ้งกรอก
  comName: string; // ชื่อเครื่องคอมพิวเตอร์ (จาก AD)
  requestDate: string; // ISO 8601 (UTC)
  requestDetail: string; // รายละเอียดที่แจ้ง (สูงสุด 1000 ตัวอักษร)
  remark: string; // หมายเหตุ — ยังไม่มีช่องในฟอร์ม ส่งค่าว่างไปก่อน
}

// รูปแนบส่งพร้อมกันไม่ได้ — endpoint นี้เป็น JSON ล้วน
// ลำดับที่ถูกต้องคือ POST สร้างใบก่อนเพื่อเอา jobNo แล้วค่อยยิงรูปทีละช่อง
// (ดู uploadItAttachment ด้านล่าง) จึงต้องคืน jobNo ออกไปให้ผู้เรียกใช้ต่อ
//
// คืน null เมื่อแกะเลขที่ใบจาก response ไม่ได้ — ใบถูกสร้างแล้วแต่แนบรูปต่อไม่ได้
// ผู้เรียกต้องบอกผู้ใช้ ไม่ใช่เงียบ (คีย์เผื่อไว้หลายชื่อเพราะ contract ยังไม่นิ่ง)
const pickJobNo = (body: unknown): string | null => {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  for (const k of ['jobNo', 'JobNo', 'docNo', 'DocNo']) {
    const v = b[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number') return String(v);
  }
  return null;
};

export async function createItRequest(
  payload: ItRequestPayload,
  token?: string
): Promise<string | null> {
  const res = await apiFetch('/ITRequest', {
    method: 'POST',
    token,
    contentType: 'application/json',
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    // พยายามดึงข้อความ error จาก body ให้ผู้ใช้เห็นสาเหตุจริง
    let message = `บันทึกใบแจ้งเรื่องไม่สำเร็จ (HTTP ${res.status})`;
    try {
      const text = await res.text();
      if (text) {
        try {
          const j = JSON.parse(text);
          message = j.message || j.error || j.title || message;
        } catch {
          message = text;
        }
      }
    } catch {
      /* อ่าน body ไม่ได้ ใช้ข้อความ default */
    }
    throw new Error(message);
  }

  // 201 ควรมีเลขที่ใบมาด้วย แต่ถ้า body ว่าง/ไม่ใช่ JSON ก็ไม่ถือว่าสร้างใบล้มเหลว
  try {
    return pickJobNo(await res.json());
  } catch {
    return null;
  }
}

// ── แก้ไขใบแจ้งเรื่อง IT ───────────────────────────────────────
// PUT /api/v1/ITRequest/{jobNo}
// แก้ได้เฉพาะช่วงที่ IT ยังไม่กดรับเรื่อง (backend ตรวจซ้ำเสมอ — ปุ่มบนเว็บเป็นแค่ UX)
//   403 = คนละหน่วยงานกับผู้แจ้ง
//   409 = IT รับงานแล้ว / ใบปิด / ใบถูกยกเลิก → ข้อมูลบนจอเก่าแล้ว ต้องโหลดใบใหม่
//
// requestBy / comName / requestDetail บังคับส่งทั้งสามช่อง — ไม่ได้แก้ก็ต้องส่งค่าเดิมไป
// ส่วน phoneNumber / departid / requestDate ใช้ null = "ไม่เปลี่ยน" ("" = ล้างค่า)
//
// ⚠️ departid: ส่งค่าใหม่ = ย้ายหน่วยงานผู้แจ้ง ขั้น workflow ที่ยังไม่อนุมัติย้ายตาม
//    และหน่วยงานเดิม (รวมคนที่กดย้ายเอง) จะแก้ใบนี้ไม่ได้อีก — หน้าเว็บจึงส่ง null เสมอ
//    ถ้าจะเปิดให้ย้ายจริง ต้องมี dialog ยืนยันแยกต่างหากก่อน
export interface ItRequestUpdatePayload {
  requestBy: string;
  comName: string;
  requestDetail: string;
  phoneNumber: string | null;
  departid: string | null;
  requestDate: string | null;
}

// 200 อาจตอบ body เปล่า → ไม่แกะ body แล้วไปโหลดใบใหม่แทน (ได้ข้อมูลตรงกว่าอยู่แล้ว)
export const updateItRequest = (
  jobNo: string,
  payload: ItRequestUpdatePayload,
  token?: string
): Promise<void> =>
  apiSendNoContent(`/ITRequest/${encodeURIComponent(jobNo)}`, 'PUT', payload, token);

// ── รูปแนบใบ IT — 3 "ช่อง" ตายตัว (ImgPath1/2/3) ────────────────
// คิดเป็นช่อง ไม่ใช่ลิสต์: อัปช่องเดิมซ้ำ = เขียนทับ ไม่ใช่เพิ่มรูปที่ 4
// fileId ที่คืนมา = หมายเลขช่อง (1–3) ช่องที่ว่างจะไม่อยู่ในอาร์เรย์
export const IT_ATTACHMENT_SLOTS = [1, 2, 3] as const;
export type ItAttachmentSlot = (typeof IT_ATTACHMENT_SLOTS)[number];

export interface ItAttachment {
  fileId: number; // = หมายเลขช่อง
  fileName: string;
  url: string; // path เต็มพร้อม prefix — ใช้ค่านี้ตรง ๆ อย่าประกอบเอง
}

export interface ItAttachmentsResult {
  jobNo: string;
  attachments: ItAttachment[]; // สถานะครบทั้ง 3 ช่องหลังทำรายการ
}

// ข้อจำกัดไฟล์ฝั่ง backend — กรองที่หน้าเว็บก่อนเพื่อไม่ให้ผู้ใช้รออัปเสร็จแล้วค่อยโดนปฏิเสธ
// (backend ตรวจ magic bytes ซ้ำอยู่ดี เปลี่ยนนามสกุลมาหลอกไม่ผ่าน)
export const IT_ATTACH_MAX_BYTES = 10 * 1024 * 1024; // 10 MB
export const IT_ATTACH_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'];

// ตรวจไฟล์เบื้องต้น — คืนข้อความไทยเมื่อไม่ผ่าน, null = ผ่าน
export function checkItAttachment(file: File): string | null {
  const dot = file.name.lastIndexOf('.');
  const ext = dot === -1 ? '' : file.name.slice(dot).toLowerCase();
  if (!IT_ATTACH_EXTENSIONS.includes(ext))
    return `นามสกุลไฟล์ไม่รองรับ (รองรับ ${IT_ATTACH_EXTENSIONS.join(' ')})`;
  if (file.size > IT_ATTACH_MAX_BYTES)
    return `ไฟล์ใหญ่เกิน ${Math.round(IT_ATTACH_MAX_BYTES / 1024 / 1024)} MB`;
  return null;
}

// POST /api/v1/ITRequest/{jobNo}/attachments/{slot} — ชื่อ field ต้องเป็น 'file' เป๊ะ
// (apiSendForm ไม่ตั้ง Content-Type เอง เพื่อให้เบราว์เซอร์ใส่ boundary ให้)
export const uploadItAttachment = (
  jobNo: string,
  slot: number,
  file: File,
  token?: string
): Promise<ItAttachmentsResult> => {
  const form = new FormData();
  form.append('file', file, file.name);
  return apiSendForm<ItAttachmentsResult>(
    `/ITRequest/${encodeURIComponent(jobNo)}/attachments/${slot}`,
    'POST',
    form,
    token
  );
};

export const deleteItAttachment = (
  jobNo: string,
  slot: number,
  token?: string
): Promise<ItAttachmentsResult> =>
  apiSend<ItAttachmentsResult>(
    `/ITRequest/${encodeURIComponent(jobNo)}/attachments/${slot}`,
    'DELETE',
    undefined,
    token
  );
