import { editFieldsOf, toHrPrUpdatePayload } from './requestEdit';
import { RequestListItem } from '../types/requestList';

test('HR edit does not expose or change the running-number request type', () => {
  expect(editFieldsOf('HR_PR').some((field) => field.key === 'requestType')).toBe(false);

  const payload = toHrPrUpdatePayload(
    { module: 'HR_PR', docNo: 'HR-1', requestBy: 'ผู้แจ้ง' } as RequestListItem,
    { requestType: 'เรื่องใหม่', requestDetail: 'รายละเอียด', position: 'เจ้าหน้าที่', lines: [] } as any,
    { docNo: 'HR-1', requestType: 'เรื่องเดิม' }
  );

  expect(payload.requestType).toBe('เรื่องเดิม');
});
