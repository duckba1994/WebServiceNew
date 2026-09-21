import {
  createPhoneBookEntry,
  deletePhoneBookEntry,
  fetchPhoneBook,
  fetchPhoneBookEntry,
  updatePhoneBookEntry,
} from './phoneBook';
import { apiGet, apiSendNoContent } from './client';
import { PhoneBookPayload } from '../types/phoneBook';

jest.mock('./client', () => ({ apiGet: jest.fn(), apiSendNoContent: jest.fn() }));

const payload: PhoneBookPayload = {
  phoneNumber: '123',
  userName: 'สมชาย ใจดี',
  type: 'Phone',
  departId: '07',
  remark: 'เบอร์ภายใน',
};

test('PhoneBook reads list and detail through the authenticated API client', async () => {
  (apiGet as jest.Mock).mockResolvedValue([]);
  await fetchPhoneBook('token');
  await fetchPhoneBookEntry(4278, 'token');
  expect(apiGet).toHaveBeenNthCalledWith(1, '/PhoneBook', 'token');
  expect(apiGet).toHaveBeenNthCalledWith(2, '/PhoneBook/4278', 'token');
});

test('PhoneBook sends the exact create, update, and soft-delete contracts', async () => {
  (apiSendNoContent as jest.Mock).mockResolvedValue(undefined);
  await createPhoneBookEntry(payload, 'token');
  await updatePhoneBookEntry(4278, payload, 'token');
  await deletePhoneBookEntry(4278, 'token');
  expect(apiSendNoContent).toHaveBeenNthCalledWith(1, '/PhoneBook', 'POST', payload, 'token');
  expect(apiSendNoContent).toHaveBeenNthCalledWith(2, '/PhoneBook/4278', 'PUT', payload, 'token');
  expect(apiSendNoContent).toHaveBeenNthCalledWith(3, '/PhoneBook/4278', 'DELETE', {}, 'token');
});
