import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PsReportStatusPanel } from './PsReportStatusPanel';
import { updatePsReportDetail } from '../../api/psRequest';
import { usePsReportStatuses } from '../../hooks/usePsReportStatuses';

jest.mock('../../api/psRequest', () => ({ updatePsReportDetail: jest.fn() }));
jest.mock('../../hooks/usePsReportStatuses');
const status = { rpStep: '4', rpStatus: '3', rpId: '4', rpName: 'ปิดงาน', rpDetailStep: '4', rpDetailId: '4.2', rpDetailName: 'เปิด PR' };
const saved = jest.fn().mockResolvedValue(undefined);
beforeEach(() => {
  HTMLElement.prototype.scrollIntoView = jest.fn();
  jest.clearAllMocks();
  (usePsReportStatuses as jest.Mock).mockReturnValue({ rows: [
    { rpStep: '3', rpStatus: '3', rpId: '4', details: [{ rpDetailId: 'wrong', rpDetailName: 'คนละขั้น' }] },
    { rpStep: '4', rpStatus: '3', rpId: '4', details: [{ rpDetailId: '4.1', rpDetailName: '' }, { rpDetailId: '4.2', rpDetailName: 'เปิด PR' }] },
  ], loading: false, error: null, reload: jest.fn() });
});
test('closed report progress uses the complete master key and sends only rpDetailId', async () => {
  (updatePsReportDetail as jest.Mock).mockResolvedValue({});
  render(<PsReportStatusPanel status={status} docNo="PS/01" token="token" canUpdate onSaved={saved} />);
  fireEvent.click(screen.getByText('แก้ไขรายละเอียดสถานะรายงาน'));
  fireEvent.focus(screen.getByRole('combobox'));
  expect(screen.queryByText('คนละขั้น')).not.toBeInTheDocument();
  fireEvent.mouseDown(screen.getByText('ไม่ระบุรายละเอียด'));
  fireEvent.click(screen.getByText('บันทึกสถานะรายงาน'));
  await waitFor(() => expect(updatePsReportDetail).toHaveBeenCalledWith('PS/01', '4.1', 'token'));
  await waitFor(() => expect(saved).toHaveBeenCalledTimes(1));
  await screen.findByText('บันทึกสถานะรายงานเรียบร้อย');
});
test('master failure disables saving and offers retry', () => {
  (usePsReportStatuses as jest.Mock).mockReturnValue({ rows: [], loading: false, error: 'โหลดไม่สำเร็จ', reload: jest.fn() });
  render(<PsReportStatusPanel status={status} docNo="PS01" canUpdate onSaved={saved} />);
  fireEvent.click(screen.getByText('แก้ไขรายละเอียดสถานะรายงาน'));
  expect(screen.getByRole('alert')).toHaveTextContent('โหลดไม่สำเร็จ');
  expect(screen.getByText('บันทึกสถานะรายงาน')).toBeDisabled();
});
