import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
    docNo: 'PS01', form: {}, lines: [], service: { action: 'เดิม', refPR: 'PR01' },
    reportStatus: { rpStep: '3', rpStatus: '2', rpId: '3', rpDetailId: '3.1' },
  }, error: null, reload: jest.fn() });
  (usePsServiceOptions as jest.Mock).mockReturnValue({
    actions: ['เดิม'], workResults: ['เรียบร้อย'], report: {
    rpStep: '3', rpStatus: '2', rpId: '3', details: [{ rpDetailId: '3.1', rpDetailName: 'รอดำเนินการ' }],
    }, loading: false, errors: {}, reload: jest.fn(),
  });
});
test('PS progress can be saved repeatedly with the current pending status', async () => {
  render(<PsServicePanel docNo="PS01" refreshKey="1" userName="ผู้ใช้ระบบ" actions={[save, done]} pending={false} onSubmit={submit} />);
  expect(screen.getByLabelText('ผู้ดำเนินการ')).toHaveValue('ผู้ใช้ระบบ');
  fireEvent.change(screen.getByLabelText('Supplier Name'), { target: { value: 'บริษัท ก' } });
  fireEvent.change(screen.getByLabelText('ระยะเวลา (วัน)'), { target: { value: '7' } });
  fireEvent.click(screen.getByText('บันทึกรายละเอียด'));
  await waitFor(() => expect(submit).toHaveBeenCalledWith(save, expect.objectContaining({
    repairStatus: 'เดิม', rpDetailId: '3.1', supplier: 'บริษัท ก', leadTime: 7, serviceBy: 'ผู้ใช้ระบบ',
  })));
});
test('completing sends the selected detail for validation against the current report group', async () => {
  render(<PsServicePanel docNo="PS01" refreshKey="1" userName="ผู้ใช้ระบบ" actions={[save, done]} pending={false} onSubmit={submit} />);
  fireEvent.click(screen.getByRole('button', { name: 'ดำเนินการ' }));
  await waitFor(() => expect(submit).toHaveBeenCalled());
  expect(submit.mock.calls[0][1]).toHaveProperty('rpDetailId', '3.1');
});
