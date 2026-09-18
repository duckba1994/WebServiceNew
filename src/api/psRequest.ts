import { apiGet, apiSend } from './client';
import { PsPrelimApi } from '../types/masterData';
import { RequestAttachment } from '../types/requestList';

// POST /PSRequest: attachment is the form checklist, not uploaded files.
export interface PsRequestPayload {
  requestBy?: string;
  type: string;
  requestType: string;
  requestDetail: string;
  planDate: string;
  priceDate: string;
  planPrice?: string;
  prelimId?: string;
  attachSpec: boolean;
  attachQuatation: boolean; // API spelling is intentional.
  budgetDocNo?: string; // PS: Spec number, confirmed legacy column reuse.
  exBudgetDocNo?: string; // PS: Quotation number, confirmed legacy column reuse.
  attachment: Record<string, boolean | string>;
  lines: { item: string; qty: number; unit?: string; remark?: string }[];
}

export interface PsRequestResult {
  docNo: string;
  canEdit?: boolean;
  canEditAttachment?: boolean;
}

export const createPsRequest = (payload: PsRequestPayload, token?: string): Promise<PsRequestResult> =>
  apiSend<PsRequestResult>('/PSRequest', 'POST', payload, token);

export interface PsRequestDetail extends PsRequestResult {
  form: Omit<PsRequestPayload, 'lines'> & { departid?: string; docDate?: string };
  prelim?: PsPrelimApi | null;
  lines: (PsRequestPayload['lines'][number] & { recNo: string; received?: number; cancel?: boolean; cancelBy?: string | null; cancelDate?: string | null })[];
  attachments?: RequestAttachment[];
  editBlockedReason?: string;
  attachmentBlockedReason?: string;
}
export type PsRequestUpdate = Partial<Omit<PsRequestPayload, 'lines'>> & {
  requestBy: string;
  lines?: (PsRequestPayload['lines'][number] & { recNo?: string })[];
};
const psPath = (docNo: string) => `/PSRequest/${encodeURIComponent(docNo)}`;
export const fetchPsRequest = (docNo: string, token?: string) =>
  apiGet<PsRequestDetail>(psPath(docNo), token);
export const updatePsRequest = (docNo: string, payload: PsRequestUpdate, token?: string) =>
  apiSend<PsRequestDetail>(psPath(docNo), 'PUT', payload, token);
