import { AfRequestLineInput, AfRequestPayload } from '../api/afRequest';
import { LineItem, RequestFormState } from './requestForm';

const toApiDate = (ymd: string): string | undefined => (ymd ? `${ymd}T00:00:00` : undefined);

export const toAfRequestLines = (items: LineItem[]): AfRequestLineInput[] =>
  items
    .filter((line) => line.name.trim() !== '')
    .map((line) => ({
      item: line.name.trim(),
      qty: Number(line.qty) || 1,
      unit: line.unit.trim() || undefined,
      remark: line.note.trim() || undefined,
    }));

export const toAfRequestPayload = (form: RequestFormState, requestBy: string): AfRequestPayload => ({
  requestType: form.values.topic ?? '',
  requestDetail: form.values.topicDetail ?? '',
  requestBy,
  planDate: toApiDate(form.values.dueDate ?? ''),
  lines: toAfRequestLines(form.lineItems),
});
