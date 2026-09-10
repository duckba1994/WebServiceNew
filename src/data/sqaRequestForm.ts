import { SqaRequestPayload } from '../api/sqaRequest';
import { RequestFormState } from './requestForm';

export const toSqaRequestPayload = (form: RequestFormState, requestBy: string): SqaRequestPayload => ({
  section: form.values.section ?? '',
  requestType: form.values.requestType ?? '',
  requestDetail: form.values.requestSubType?.trim() || null,
  details: form.detail.trim(),
  requestBy,
  requestByName: requestBy,
});
