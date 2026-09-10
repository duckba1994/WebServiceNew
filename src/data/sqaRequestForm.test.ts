import { toSqaRequestPayload } from './sqaRequestForm';
import { RequestFormState } from './requestForm';
import { toEditForm, toSqaUpdatePayload } from './requestEdit';
import { RequestListItem } from '../types/requestList';

test('maps the SQA cascade using names and omits fields outside its contract', () => {
  const form = {
    values: { section: 'HV', requestType: 'ตรวจสภาพเครื่องจักร', requestSubType: 'กรณีพิเศษ (ปจ.2)', dueDate: '2026-09-30' },
    detail: 'ขอตรวจสภาพก่อนส่งมอบ',
  } as unknown as RequestFormState;
  expect(toSqaRequestPayload(form, 'ผู้แจ้ง')).toEqual({
    section: 'HV', requestType: 'ตรวจสภาพเครื่องจักร', requestDetail: 'กรณีพิเศษ (ปจ.2)',
    details: 'ขอตรวจสภาพก่อนส่งมอบ', requestBy: 'ผู้แจ้ง', requestByName: 'ผู้แจ้ง',
  });
});

test('maps SQA detail and sends a complete edit payload', () => {
  const item = { module: 'SQA', docNo: 'BC-SQA-26-0001', requestBy: 'ผู้แจ้ง' } as RequestListItem;
  const doc = { docNo: item.docNo, section: 'FL', requestType: 'การขนย้าย', requestDetail: null, details: 'รายละเอียดเดิม', departid: '10' };
  const form = toEditForm(item, null, null, null, null, null, doc);
  expect(form.details).toBe('รายละเอียดเดิม');
  expect(toSqaUpdatePayload(item, form, doc)).toMatchObject({
    requestBy: 'ผู้แจ้ง', section: 'FL', requestType: 'การขนย้าย', requestDetail: null,
    details: 'รายละเอียดเดิม', departid: '10',
  });
});
