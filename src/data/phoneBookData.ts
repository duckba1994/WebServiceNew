import { PhoneBookEntry } from '../types/phoneBook';

export type PhoneBookColumnGroup = 'standard' | 'audit';

export interface PhoneBookColumn {
  id: keyof PhoneBookEntry | 'status';
  label: string;
  width: number;
  align?: 'left' | 'center' | 'right';
  group: PhoneBookColumnGroup;
  resizable?: boolean;
}

export const PHONE_BOOK_COLUMNS: PhoneBookColumn[] = [
  { id: 'userName', label: 'ชื่อผู้ติดต่อ', width: 190, group: 'standard', resizable: true },
  { id: 'departmentName', label: 'หน่วยงาน', width: 190, group: 'standard', resizable: true },
  { id: 'phoneNumber', label: 'เบอร์โทรศัพท์', width: 140, group: 'standard' },
  { id: 'type', label: 'ประเภท', width: 90, group: 'standard', align: 'center' },
  { id: 'remark', label: 'หมายเหตุ', width: 240, group: 'standard', resizable: true },
  { id: 'editBy', label: 'แก้ไขโดย', width: 170, group: 'audit', resizable: true },
  { id: 'editDate', label: 'วันที่แก้ไข', width: 155, group: 'audit' },
  { id: 'status', label: 'สถานะ', width: 105, group: 'standard', align: 'center' },
];

export type PhoneBookPresetKey = 'standard' | 'all';
export const PHONE_BOOK_PRESETS: Record<PhoneBookPresetKey, { label: string; groups: PhoneBookColumnGroup[] }> = {
  standard: { label: 'มาตรฐาน', groups: ['standard'] },
  all: { label: 'ทั้งหมด', groups: ['standard', 'audit'] },
};

const formatDateTime = (value: string | null): string => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });
};

export function phoneBookCellText(row: PhoneBookEntry, column: PhoneBookColumn): string {
  switch (column.id) {
    case 'departmentName':
      return [row.department, row.departmentName].filter(Boolean).join(' - ') || '—';
    case 'editDate':
      return formatDateTime(row.editDate);
    case 'status':
      return row.activeStatus ? 'ใช้งาน' : 'ปิดใช้งาน';
    default: {
      const value = row[column.id as keyof PhoneBookEntry];
      return value === null || value === undefined || value === '' ? '—' : String(value);
    }
  }
}

export function comparePhoneBookRows(a: PhoneBookEntry, b: PhoneBookEntry, column: PhoneBookColumn): number {
  if (column.id === 'editDate') {
    return (a.editDate ? new Date(a.editDate).getTime() : 0) - (b.editDate ? new Date(b.editDate).getTime() : 0);
  }
  return phoneBookCellText(a, column).localeCompare(phoneBookCellText(b, column), 'th', {
    numeric: true,
    sensitivity: 'base',
  });
}
