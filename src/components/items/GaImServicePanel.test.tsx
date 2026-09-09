import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { GaImServicePanel } from './GaImServicePanel';
import { RequestAction, RequestActionResult, RequestListItem } from '../../types/requestList';
import { toDeptServiceFields, toDeptServiceForm, validateDeptServiceForm } from '../../data/deptServiceForm';

const actions: RequestAction[] = [
  { code: 'saveService', label: 'บันทึกรายละเอียด', style: 'neutral', requireNote: false, requiredFields: [] },
  { code: 'service', label: 'ดำเนินการเสร็จ / ปิดงาน', style: 'success', requireNote: false, requiredFields: ['workResults'] },
];
const item = {
  module: 'GA', docNo: 'GA-BC-26-003', phase: 'in_progress', availableActions: actions,
  resolution: { repairStatus: 'จัดซื้อใหม่', solution: 'ยังไม่เรียบร้อย', exPrNo: 'PR-123', leadTime: 5, servicedBy: null, servicedDate: null },
  remark: 'รอสินค้า',
} as RequestListItem;
const result = (next: RequestListItem) => ({ item: next } as RequestActionResult);

test('saves cleared text and zero days, reloads server values, and permits another save', async () => {
  const updated = { ...item, remark: '', resolution: { ...item.resolution!, exPrNo: '', leadTime: 0 } };
  const submit = jest.fn().mockResolvedValue(result(updated));
  render(<GaImServicePanel item={item} actions={actions} pending={false} onSubmit={submit} />);
  fireEvent.change(screen.getByLabelText('Referent PR.'), { target: { value: '' } });
  fireEvent.change(screen.getByLabelText('หมายเหตุ'), { target: { value: '' } });
  fireEvent.change(screen.getByLabelText('ระยะเวลา (วัน)'), { target: { value: '0' } });
  fireEvent.click(screen.getByText('บันทึกรายละเอียด'));
  await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
  expect(submit.mock.calls[0][1]).toEqual({ repairStatus: 'จัดซื้อใหม่', exPrNo: '', leadTime: 0, workResults: 'ยังไม่เรียบร้อย', remark: '' });
  await waitFor(() => expect((screen.getByText('บันทึกรายละเอียด') as HTMLButtonElement).disabled).toBe(false));
  fireEvent.change(screen.getByLabelText('หมายเหตุ'), { target: { value: 'ครั้งที่สอง' } });
  fireEvent.click(screen.getByText('บันทึกรายละเอียด'));
  await waitFor(() => expect(submit).toHaveBeenCalledTimes(2));
  expect(submit.mock.calls[1][1].remark).toBe('ครั้งที่สอง');
  await waitFor(() => expect((screen.getByText('บันทึกรายละเอียด') as HTMLButtonElement).disabled).toBe(false));
});

test.each(['GA', 'IM'])('%s keeps failed drafts and completes with one click', async (module) => {
  const ready = { ...item, module, resolution: { ...item.resolution!, solution: 'จัดการเรียบร้อย' } };
  const submit = jest.fn().mockResolvedValue(null);
  const { rerender } = render(<GaImServicePanel item={ready} actions={actions} pending={false} onSubmit={submit} />);
  fireEvent.change(screen.getByLabelText('หมายเหตุ'), { target: { value: 'บันทึกไม่สำเร็จต้องยังอยู่' } });
  fireEvent.click(screen.getByText('บันทึกรายละเอียด'));
  await waitFor(() => expect((screen.getByText('บันทึกรายละเอียด') as HTMLButtonElement).disabled).toBe(false));
  expect((screen.getByLabelText('หมายเหตุ') as HTMLTextAreaElement).value).toBe('บันทึกไม่สำเร็จต้องยังอยู่');
  fireEvent.click(screen.getByText('ดำเนินการเสร็จ'));
  expect(screen.queryByRole('alertdialog')).toBeNull();
  await waitFor(() => expect(submit).toHaveBeenCalledTimes(2));
  expect(submit.mock.calls[1][0].code).toBe('service');
  expect(submit.mock.calls[1][1].workResults).toBe('จัดการเรียบร้อย');
  await waitFor(() => expect((screen.getByText('บันทึกรายละเอียด') as HTMLButtonElement).disabled).toBe(false));
  const closed = { ...ready, phase: 'closed', availableActions: [], resolution: { ...ready.resolution, servicedBy: 'ผู้กดจาก JWT' } } as RequestListItem;
  rerender(<GaImServicePanel item={closed} actions={[]} pending={false} onSubmit={submit} />);
  expect(screen.queryByText('บันทึกรายละเอียด')).toBeNull();
  expect((screen.getByLabelText('ผู้ดำเนินการ') as HTMLInputElement).value).toBe('ผู้กดจาก JWT');
});

test('IM hides duration and submits neither duration nor server-owned fields', () => {
  render(<GaImServicePanel item={{ ...item, module: 'IM' }} actions={[]} pending={false} />);
  expect(screen.queryByLabelText('ระยะเวลา (วัน)')).toBeNull();
  expect((screen.getByLabelText('PR') as HTMLInputElement).disabled).toBe(true);
  const fields = toDeptServiceFields('IM', toDeptServiceForm(item));
  expect(fields.leadTime).toBeUndefined();
  expect(fields.servicedBy).toBeUndefined();
  expect(fields.servicedDate).toBeUndefined();
  expect(fields.serviceBy).toBeUndefined();
});

test('validates module-specific values, duration bounds, and incomplete work', () => {
  const form = toDeptServiceForm(item);
  for (const leadTime of ['-1', '101', 'abc', 'Infinity']) expect(validateDeptServiceForm('GA', { ...form, leadTime }, false)).not.toBeNull();
  for (const leadTime of ['0', '100', '']) expect(validateDeptServiceForm('GA', { ...form, leadTime }, false)).toBeNull();
  expect(validateDeptServiceForm('GA', { ...form, repairStatus: 'ซ่อมภายนอก' }, false)).toBeNull();
  expect(validateDeptServiceForm('IM', { ...form, repairStatus: 'ซ่อมภายนอก' }, false)).not.toBeNull();
  expect(validateDeptServiceForm('IM', { ...form, repairStatus: 'ส่งซ่อมภายนอก' }, false)).toBeNull();
  expect(validateDeptServiceForm('GA', form, true)).not.toBeNull();
});
