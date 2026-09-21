import { comparePhoneBookRows, phoneBookCellText, PHONE_BOOK_COLUMNS } from './phoneBookData';
import { PhoneBookEntry } from '../types/phoneBook';

const row = (overrides: Partial<PhoneBookEntry> = {}): PhoneBookEntry => ({
  recId: 1,
  phoneNumber: '102',
  userName: 'คุณทรงวุฒิ',
  type: 'Phone',
  departId: '22',
  department: 'AC',
  departmentName: 'Accounting',
  remark: null,
  createDate: null,
  createBy: null,
  editDate: null,
  editBy: null,
  activeStatus: true,
  ...overrides,
});

test('PhoneBook department column displays department code instead of departId', () => {
  const column = PHONE_BOOK_COLUMNS.find((item) => item.id === 'departmentName')!;
  expect(phoneBookCellText(row(), column)).toBe('AC - Accounting');
  expect(phoneBookCellText(row(), column)).not.toContain('22');
});

test('PhoneBook grid compares phone numbers naturally', () => {
  const column = PHONE_BOOK_COLUMNS.find((item) => item.id === 'phoneNumber')!;
  expect(comparePhoneBookRows(row({ phoneNumber: '9' }), row({ phoneNumber: '102' }), column)).toBeLessThan(0);
});
