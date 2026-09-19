import { apiGet, apiSend } from './client';
import { PsPrelimApi } from '../types/masterData';
import { PsReportStatus, RequestAttachment } from '../types/requestList';

// POST /PSRequest: attachment is the form checklist, not uploaded files.
export interface PsRequestPayload {
  rpDetailId?: string | null;
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
  reportStatus?: PsReportStatus | null;
  docNo: string;
  canEdit?: boolean;
  canEditAttachment?: boolean;
}

export const createPsRequest = (payload: PsRequestPayload, token?: string): Promise<PsRequestResult> =>
  apiSend<PsRequestResult>('/PSRequest', 'POST', payload, token);

export interface PsRequestDetail extends PsRequestResult {
  form: Omit<PsRequestPayload, 'lines'> & { departid?: string; docDate?: string };
  service?: PsServiceDetail;
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

export interface PsReportStatusOption {
  rpStep: string;
  rpStatus: string;
  rpId: string;
  rpName: string;
  details: { step: string; rpDetailId: string; rpDetailName: string }[];
}
export interface PsServiceDetail {
  action?: string | null;
  actionDetail?: string | null;
  workResults?: string | null;
  wrDetail?: string | null;
  otherRemark?: string | null;
  leadTime?: number | null;
  refPR?: string | null;
  refPO?: string | null;
  supplier?: string | null;
  serviceBy?: string | null; // forward-compatible with the editable operator field
  serviceDate?: string | null;
  changeDate?: string | null;
  remark?: string | null;
}
export const fetchPsReportStatuses = (token?: string) =>
  apiGet<PsReportStatusOption[]>('/PSRequest/report-statuses', token);
export const fetchPsReportDetails = (docNo: string, token?: string) =>
  apiGet<PsReportStatusOption>(`${psPath(docNo)}/report-details`, token);
export const updatePsReportDetail = (docNo: string, rpDetailId: string, token?: string) =>
  apiSend<PsRequestDetail>(`${psPath(docNo)}/report-detail`, 'PUT', { rpDetailId }, token);
