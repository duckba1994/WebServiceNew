import { apiGet, apiSend } from './client';

export const SQA_MODULE = 'SQA';
const docPath = (docNo: string) => `/SQARequest/${encodeURIComponent(docNo)}`;

export interface SqaRequestPayload {
  section: string;
  requestType: string;
  requestDetail?: string | null;
  details: string;
  site?: string;
  docDate?: string;
  requestDate?: string;
  requestBy?: string;
  departid?: string;
  requestByName?: string;
  requestByPosition?: string;
  requestByDate?: string;
}

export interface SqaRequestResult {
  docNo: string;
  site?: string | null;
  section: string;
  requestType: string;
  requestDetail?: string | null;
  details: string;
  requestBy?: string | null;
  departid?: string | null;
  requestByName?: string | null;
  requestByPosition?: string | null;
  requestByDate?: string | null;
  docDate?: string | null;
  requestDate?: string | null;
  jobStatus: number;
  jobStatusName?: string | null;
  wfStep: number;
  wfStatus: string;
}

export interface SqaRequestDetail extends Partial<SqaRequestResult> {
  docNo: string;
  receiveBy?: string | null;
  receiveDate?: string | null;
  requestService?: string | null;
  serviceStd?: string | null;
  serviceDetail?: string | null;
  serviceBy?: string | null;
  serviceDate?: string | null;
  servicePosition?: string | null;
  canEdit?: boolean;
  editBlockedReason?: string | null;
}

export interface SqaRequestUpdatePayload extends SqaRequestPayload {}

export const createSqaRequest = (payload: SqaRequestPayload, token?: string): Promise<SqaRequestResult> =>
  apiSend<SqaRequestResult>('/SQARequest', 'POST', payload, token);

export const fetchSqaRequest = (docNo: string, token?: string): Promise<SqaRequestDetail> =>
  apiGet<SqaRequestDetail>(docPath(docNo), token);

export const updateSqaRequest = (
  docNo: string,
  payload: SqaRequestUpdatePayload,
  token?: string
): Promise<SqaRequestResult> => apiSend<SqaRequestResult>(docPath(docNo), 'PUT', payload, token);
