import { createPsRequest, fetchPsRequest, updatePsRequest, PsRequestPayload, fetchPsReportStatuses, fetchPsReportDetails, updatePsReportDetail } from './psRequest';
import { apiGet, apiSend } from './client';

jest.mock('./client', () => ({ apiSend: jest.fn(), apiGet: jest.fn() }));
const send = apiSend as jest.Mock;

test('PS report endpoints preserve empty-string reset and encode document numbers', async () => {
  (apiGet as jest.Mock).mockResolvedValueOnce([]);
  await fetchPsReportStatuses('token');
  expect(apiGet).toHaveBeenCalledWith('/PSRequest/report-statuses', 'token');
  (apiGet as jest.Mock).mockResolvedValueOnce({ details: [] });
  await fetchPsReportDetails('PS/01', 'token');
  expect(apiGet).toHaveBeenCalledWith('/PSRequest/PS%2F01/report-details', 'token');
  send.mockResolvedValueOnce({});
  await updatePsReportDetail('PS/01', '', 'token');
  expect(send).toHaveBeenCalledWith('/PSRequest/PS%2F01/report-detail', 'PUT', { rpDetailId: '' }, 'token');
});

test('PS detail and update encode docNo and use the authenticated client without a form wrapper', async () => {
  (apiGet as jest.Mock).mockResolvedValueOnce({ docNo: 'PS/01' });
  await fetchPsRequest('PS/01', 'token');
  expect(apiGet).toHaveBeenCalledWith('/PSRequest/PS%2F01', 'token');
  send.mockResolvedValueOnce({ docNo: 'PS/01' });
  await updatePsRequest('PS/01', { requestBy: 'original', requestDetail: 'แก้ไข' }, 'token');
  expect(send).toHaveBeenCalledWith('/PSRequest/PS%2F01', 'PUT', { requestBy: 'original', requestDetail: 'แก้ไข' }, 'token');
});

test('PS create posts through the authenticated API client and returns backend docNo', async () => {
  const payload: PsRequestPayload = {
    type: 'ลูกค้าภายใน', requestType: 'ขอราคา', requestDetail: 'ทดสอบ',
    planDate: '2026-09-20T00:00:00', priceDate: '2026-09-19T00:00:00',
    attachSpec: false, attachQuatation: false, attachment: {}, lines: [],
  };
  send.mockResolvedValueOnce({ docNo: 'PS-BC-26-001' });
  await expect(createPsRequest(payload, 'test-token')).resolves.toEqual({ docNo: 'PS-BC-26-001' });
  expect(send).toHaveBeenCalledWith('/PSRequest', 'POST', payload, 'test-token');
});

test('PS create propagates API errors rather than reporting success', async () => {
  send.mockRejectedValueOnce(new Error('บันทึกไม่สำเร็จ'));
  await expect(createPsRequest({} as PsRequestPayload)).rejects.toThrow('บันทึกไม่สำเร็จ');
});
