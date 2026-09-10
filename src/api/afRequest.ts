import { apiGet, apiSend } from './client';

export interface AfRequestLineInput {
  recNo?: string | null;
  item: string;
  qty?: number;
  unit?: string;
  remark?: string;
}

export interface AfRequestLine {
  recNo: string;
  item: string;
  qty: number;
  received: null;
  unit: string | null;
  remark: string | null;
  cancel: boolean;
  cancelBy: string | null;
  cancelDate: string | null;
}

export interface AfRequestPayload {
  requestDetail: string;
  requestType?: string;
  site?: string;
  docDate?: string;
  planDate?: string;
  requestBy?: string;
  departid?: string;
  lines?: AfRequestLineInput[];
}

export interface AfRequestResult {
  docNo: string;
  jobStatus: number;
  jobStatusName?: string;
  wfStep: number;
  wfStatus: string;
  description?: string;
  site: string;
  requestBy: string;
  departid: string;
  requestType?: string | null;
  requestDetail?: string | null;
  docDate: string;
  requestDate: string;
  planDate: string | null;
  lines: AfRequestLine[];
}

export interface AfRequestDetail extends Omit<Partial<AfRequestResult>, 'lines' | 'docNo'> {
  docNo: string;
  lines?: AfRequestLine[] | null;
  canEdit?: boolean;
  editBlockedReason?: string | null;
}

export interface AfRequestUpdatePayload {
  requestBy: string;
  requestDetail: string;
  requestType?: string;
  docDate?: string;
  planDate?: string;
  departid?: string;
  lines?: AfRequestLineInput[];
}

export const createAfRequest = (payload: AfRequestPayload, token?: string): Promise<AfRequestResult> =>
  apiSend<AfRequestResult>('/AFRequest', 'POST', payload, token);

export const fetchAfRequest = (docNo: string, token?: string): Promise<AfRequestDetail> =>
  apiGet<AfRequestDetail>(`/AFRequest/${encodeURIComponent(docNo)}`, token);

export const updateAfRequest = (
  docNo: string,
  payload: AfRequestUpdatePayload,
  token?: string
): Promise<AfRequestResult> =>
  apiSend<AfRequestResult>(`/AFRequest/${encodeURIComponent(docNo)}`, 'PUT', payload, token);
