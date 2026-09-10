import { toAfRequestPayload } from './afRequestForm';
import { RequestFormState } from './requestForm';

test('maps AF form without GA/IM-only fields', () => {
  const form = {
    values: {
      topic: 'ข้อร้องเรียน',
      topicDetail: 'ปิดงบล่าช้า',
      dueDate: '2026-09-30',
      requestType: 'ค่าที่ห้ามส่งเป็น type',
      attachDocs: 'ค่าที่ห้ามส่ง',
    },
    lineItems: [
      { id: '1', name: ' เอกสารบัญชี ', qty: '2', unit: 'รายการ', price: '', vendor: '', note: ' ฉบับจริง ' },
    ],
  } as unknown as RequestFormState;

  expect(toAfRequestPayload(form, 'ผู้แจ้ง')).toEqual({
    requestType: 'ข้อร้องเรียน',
    requestDetail: 'ปิดงบล่าช้า',
    requestBy: 'ผู้แจ้ง',
    planDate: '2026-09-30T00:00:00',
    lines: [{ item: 'เอกสารบัญชี', qty: 2, unit: 'รายการ', remark: 'ฉบับจริง' }],
  });
});
