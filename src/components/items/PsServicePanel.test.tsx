import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { PsServicePanel } from './PsServicePanel';
import { usePsRequest } from '../../hooks/usePsRequest';
import { usePsServiceOptions } from '../../hooks/usePsServiceOptions';
import { RequestAction } from '../../types/requestList';

jest.mock('../../hooks/usePsRequest');
jest.mock('../../hooks/usePsServiceOptions');
const save: RequestAction = { code: 'saveService', label: 'บันทึกรายละเอียด', style: 'neutral', requireNote: false, requiredFields: [] };
const done: RequestAction = { code: 'service', label: 'ดำเนินการ', style: 'success', requireNote: false, requiredFields: [] };
const submit = jest.fn().mockResolvedValue(undefined);
beforeEach(() => {
  jest.clearAllMocks();
  HTMLElement.prototype.scrollIntoView = jest.fn();
  (usePsRequest as jest.Mock).mockReturnValue({ doc: {
    docNo: 'PS01', form: {}, lines: [], service: { action: 'เดิม', refPR: 'PR01', workResults: 'ยังไม่เรียบร้อย' },
    reportStatus: { rpStep: '3', rpStatus: '2', rpId: '3', rpDetailId: '3.1' },
  }, error: null, reload: jest.fn() });
  (usePsServiceOptions as jest.Mock).mockReturnValue({
    actions: ['เดิม'], workResults: ['ยังไม่เรียบร้อย', 'จัดการเรียบร้อย'], report: {
    rpStep: '3', rpStatus: '2', rpId: '3', details: [{ rpDetailId: '3.1', rpDetailName: 'รอดำเนินการ' }],
    }, loading: false, errors: {}, reload: jest.fn(),
  });
});
test('PS progress can be saved repeatedly with the current pending status', async () => {
  render(<PsServicePanel docNo="PS01" refreshKey="1" userName="ผู้ใช้ระบบ" actions={[save, done]} pending={false} onSubmit={submit} />);
  expect(screen.getByLabelText('ผู้ดำเนินการ')).toHaveValue('ผู้ใช้ระบบ');
  expect(screen.getByRole('button', { name: 'ดำเนินการ' })).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Supplier Name'), { target: { value: 'บริษัท ก' } });
  fireEvent.change(screen.getByLabelText('ระยะเวลา (วัน)'), { target: { value: '7' } });
  fireEvent.click(screen.getByText('บันทึกรายละเอียด'));
  await waitFor(() => expect(submit).toHaveBeenCalledWith(save, expect.objectContaining({
    repairStatus: 'เดิม', rpDetailId: '3.1', supplier: 'บริษัท ก', leadTime: 7, serviceBy: 'ผู้ใช้ระบบ',
  })));
});
test('completing sends the selected detail for validation against the current report group', async () => {
  render(<PsServicePanel docNo="PS01" refreshKey="1" userName="ผู้ใช้ระบบ" actions={[save, done]} pending={false} onSubmit={submit} />);
  const resultSelect = screen.getAllByRole('combobox')[1];
  fireEvent.focus(resultSelect);
  fireEvent.mouseDown(screen.getByRole('option', { name: 'จัดการเรียบร้อย' }));
  fireEvent.click(screen.getByRole('button', { name: 'ดำเนินการ' }));
  expect(submit).not.toHaveBeenCalled();
  const popup = screen.getByRole('dialog', { name: 'ยืนยันดำเนินการ' });
  expect(popup).toHaveAttribute('aria-modal', 'true');
  fireEvent.click(within(popup).getByRole('button', { name: 'ยืนยัน' }));
  await waitFor(() => expect(submit).toHaveBeenCalled());
  expect(submit.mock.calls[0][1]).toHaveProperty('rpDetailId', '3.1');
  expect(submit.mock.calls[0][1]).toHaveProperty('workResults', 'จัดการเรียบร้อย');
});

test('incomplete or empty results cannot complete; cancelling the popup never submits', () => {
  render(<PsServicePanel docNo="PS01" refreshKey="1" userName="ผู้ใช้ระบบ" actions={[save, done]} pending={false} onSubmit={submit} />);
  const button = screen.getByRole('button', { name: 'ดำเนินการ' });
  fireEvent.click(button);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  const resultSelect = screen.getAllByRole('combobox')[1];
  fireEvent.keyDown(resultSelect, { key: 'Delete' });
  expect(button).toBeDisabled();
  fireEvent.focus(resultSelect);
  fireEvent.mouseDown(screen.getByRole('option', { name: 'จัดการเรียบร้อย' }));
  button.focus();
  fireEvent.click(button);
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'ยกเลิก' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(submit).not.toHaveBeenCalled();
  expect(button).toHaveFocus();
});
