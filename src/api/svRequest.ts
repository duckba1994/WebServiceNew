import { apiGet, apiSend, apiSendForm } from './client';

export const SV_MODULE = 'SV';

export interface SvRequestLineInput {
  recNo?: string | null;
  no: number;
  details: string;
  carId?: string | null;
  requestDate?: string | null;
}

export interface SvRequestLine extends SvRequestLineInput {
  recNo: string;
}

export interface SvRequestAttachments {
  attachCustomerDocument: boolean;
  attachPicture: boolean;
  attachOther: boolean;
  attachOtherDetail?: string | null;
}

export interface SvRequestPayload extends SvRequestAttachments {
  site?: string;
  docDate?: string;
  section: string;
  requestBy?: string;
  departid?: string;
  external: boolean;
  internal: boolean;
  internalDepartid?: string | null;
  requestType: string;
  other?: string | null;
  remark?: string | null;
  lines?: SvRequestLineInput[];
}

export interface SvRequestResult extends SvRequestPayload {
  docNo: string;
  jobStatus: number;
  jobStatusName?: string | null;
  wfStep: number;
  wfStatus: string;
  description?: string | null;
  lines: SvRequestLine[];
}

export interface SvRequestDetail extends Partial<SvRequestResult> {
  docNo: string;
  canEdit?: boolean;
  editBlockedReason?: string | null;
  canAttach?: boolean;
  attachBlockedReason?: string | null;
}

export type SvRequestUpdatePayload = Omit<SvRequestPayload, 'site' | 'section'>;

export const createSvRequest = (payload: SvRequestPayload, token?: string): Promise<SvRequestResult> =>
  apiSend<SvRequestResult>('/SVRequest', 'POST', payload, token);

export const fetchSvRequest = (docNo: string, token?: string): Promise<SvRequestDetail> =>
  apiGet<SvRequestDetail>(`/SVRequest/${encodeURIComponent(docNo)}`, token);

export const updateSvRequest = (
  docNo: string,
  payload: SvRequestUpdatePayload,
  token?: string
): Promise<SvRequestResult> =>
  apiSend<SvRequestResult>(`/SVRequest/${encodeURIComponent(docNo)}`, 'PUT', payload, token);

export const SV_ATTACHMENT_SLOTS = [1, 2, 3] as const;
export const SV_ATTACH_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'];

export function checkSvAttachment(file: File): string | null {
  const dot = file.name.lastIndexOf('.');
  const ext = dot < 0 ? '' : file.name.slice(dot).toLowerCase();
  return SV_ATTACH_EXTENSIONS.includes(ext)
    ? null
    : `นามสกุลไฟล์ไม่รองรับ (รองรับ ${SV_ATTACH_EXTENSIONS.join(' ')})`;
}

export interface SvAttachment {
  fileId: number;
  fileName: string;
  url: string;
}

export interface SvAttachmentsResult {
  docNo: string;
  attachments: SvAttachment[];
}

export const uploadSvAttachment = (
  docNo: string,
  slot: number,
  file: File,
  token?: string
): Promise<SvAttachmentsResult> => {
  const form = new FormData();
  form.append('file', file, file.name);
  return apiSendForm<SvAttachmentsResult>(
    `/SVRequest/${encodeURIComponent(docNo)}/attachments/${slot}`,
    'POST',
    form,
    token
  );
};

export const deleteSvAttachment = (
  docNo: string,
  slot: number,
  token?: string
): Promise<SvAttachmentsResult> =>
  apiSend<SvAttachmentsResult>(
    `/SVRequest/${encodeURIComponent(docNo)}/attachments/${slot}`,
    'DELETE',
    undefined,
    token
  );
