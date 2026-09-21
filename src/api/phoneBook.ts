import { apiGet, apiSendNoContent } from './client';
import { PhoneBookEntry, PhoneBookPayload } from '../types/phoneBook';

const PHONE_BOOK_PATH = '/PhoneBook';

export const fetchPhoneBook = (token?: string): Promise<PhoneBookEntry[]> =>
  apiGet<PhoneBookEntry[]>(PHONE_BOOK_PATH, token);

export const fetchPhoneBookEntry = (recId: number, token?: string): Promise<PhoneBookEntry> =>
  apiGet<PhoneBookEntry>(`${PHONE_BOOK_PATH}/${recId}`, token);

export const createPhoneBookEntry = (payload: PhoneBookPayload, token?: string): Promise<void> =>
  apiSendNoContent(PHONE_BOOK_PATH, 'POST', payload, token);

export const updatePhoneBookEntry = (
  recId: number,
  payload: PhoneBookPayload,
  token?: string
): Promise<void> => apiSendNoContent(`${PHONE_BOOK_PATH}/${recId}`, 'PUT', payload, token);

export const deletePhoneBookEntry = (recId: number, token?: string): Promise<void> =>
  apiSendNoContent(`${PHONE_BOOK_PATH}/${recId}`, 'DELETE', {}, token);
