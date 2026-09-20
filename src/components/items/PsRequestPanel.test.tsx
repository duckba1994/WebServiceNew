import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PsRequestPanel } from './PsRequestPanel';
import { usePsRequest } from '../../hooks/usePsRequest';
import { updatePsRequest, PsRequestDetail } from '../../api/psRequest';
import { toPsAttachment } from '../../data/psRequestForm';
import { fetchAddresses } from '../../api/masterData';
import { DraftScope } from '../../hooks/useSessionDraft';
import { clearDraftSession, startDraftSession, suspendDraftSession } from '../../utils/sessionDrafts';

jest.mock('../../hooks/usePsRequest');
jest.mock('../../api/masterData', () => ({ fetchAddresses: jest.fn(() => new Promise(() => {})) }));
jest.mock('../../api/psRequest', () => ({ updatePsRequest: jest.fn() }));
jest.mock('../../hooks/useDeptMasterData', () => ({ useDeptMasterData: () => ({
  typeOptions: () => [{ value: 'ภายใน', label: 'ภายใน' }],
  requestTypeOptions: () => [{ value: 'ขอราคา', label: 'ขอราคา' }],
  unitNames: ['ชิ้น'], loading: false, error: null,
}) }));
jest.mock('../../hooks/usePsPrelims', () => ({
  prelimToFields: () => ({ estMachineNo: 'M-01' }),
  usePsPrelims: () => ({ options: [], loading: false, error: null }),
}));
const load = usePsRequest as jest.Mock;
const update = updatePsRequest as jest.Mock;
const doc = (): PsRequestDetail => ({
  docNo: 'PS-01', canEdit: true, canEditAttachment: true,
  form: { requestBy: 'ผู้แจ้งเดิม', departid: '07', docDate: '2026-09-18T15:17:32', type: 'ภายใน', requestType: 'ขอราคา',
    requestDetail: 'รายละเอียดเดิม', planDate: '2026-09-20', priceDate: '2026-09-19',
    attachSpec: true, attachQuatation: true, budgetDocNo: 'SPEC-01', exBudgetDocNo: 'QUO-01',
    attachment: toPsAttachment(JSON.stringify({ '1': { selected: true, documents: { other: true } } })),
  }, lines: [{ recNo: '0001', item: 'อะไหล่', qty: 2, unit: 'ชิ้น' }],
});
const reload = jest.fn();
const saved = jest.fn().mockResolvedValue(undefined);
const renderPanel = () => render(<PsRequestPanel docNo="PS-01" refreshKey="1" token="token" allowEdit onSaved={saved} onEditingChange={jest.fn()} />);
beforeEach(() => {
  clearDraftSession();
  jest.clearAllMocks();
  (fetchAddresses as jest.Mock).mockImplementation(() => new Promise(() => {}));
  load.mockReturnValue({ doc: doc(), error: null, reload });
});
afterEach(() => clearDraftSession());

test('PS reopens edit mode and draft while checking fresh API permissions', () => {
  startDraftSession('alice');
  const app = <DraftScope name="PS::PS-01"><PsRequestPanel docNo="PS-01" refreshKey="1" token="token" allowEdit onSaved={saved} onEditingChange={jest.fn()} /></DraftScope>;
  const first = render(app);
  fireEvent.click(screen.getByRole('button', { name: 'แก้ไขข้อมูล PS' }));
  fireEvent.change(screen.getByLabelText('ระบุเรื่องที่แจ้ง'), { target: { value: 'ร่าง PS ที่ยังไม่บันทึก' } });
  suspendDraftSession('/inbox'); first.unmount();
  startDraftSession('alice', true);
  load.mockReturnValue({ doc: null, error: null, reload });
  const next = render(app);
  expect(screen.getByText('ร่าง PS ที่ยังไม่บันทึก')).toBeInTheDocument();
  expect(update).not.toHaveBeenCalled();
  load.mockReturnValue({ doc: doc(), error: null, reload });
  next.rerender(<DraftScope name="PS::PS-01"><PsRequestPanel docNo="PS-01" refreshKey="1" token="new-token" allowEdit onSaved={saved} onEditingChange={jest.fn()} /></DraftScope>);
  expect(screen.getByLabelText('ระบุเรื่องที่แจ้ง')).toHaveValue('ร่าง PS ที่ยังไม่บันทึก');
  expect(screen.getByRole('button', { name: 'บันทึกการแก้ไข' })).toBeInTheDocument();
  expect(update).not.toHaveBeenCalled();
});

test('PS detail shows actual document numbers and saved table before the estimate section', () => {
  renderPanel();
  expect(screen.getByText('SPEC-01')).toBeInTheDocument();
  expect(screen.getByText('QUO-01')).toBeInTheDocument();
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  const rowHeader = screen.getByRole('columnheader', { name: '#' });
  expect(rowHeader.parentElement).toHaveClass('bg-[#0b1220]');
  expect(rowHeader.closest('table')?.parentElement).toHaveClass('rounded-xl', 'border');
  expect(screen.getByRole('columnheader', { name: 'จำนวน', exact: true })).toHaveClass('text-center', 'w-20');
  expect(screen.getByRole('button', { name: 'อื่น ๆ — ลำดับ 1 อะไหล่แท้ มือ 1' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: 'ใบประเมิน — ลำดับ 1 อะไหล่แท้ มือ 1' })).toHaveAttribute('aria-pressed', 'false');
  const headers = screen.getAllByRole('heading').map(h => h.textContent);
  expect(headers.indexOf('สิ่งที่แนบมาด้วย')).toBeLessThan(headers.indexOf('ข้อมูลใบประเมินราคา'));
});
test('PS uses the General toolbar, readable department name and formatted document date', () => {
  const toolbar = document.createElement('div');
  document.body.appendChild(toolbar);
  const view = render(<PsRequestPanel docNo="PS-01" refreshKey="1" allowEdit toolbar={toolbar} departmentName="Information Technology" onSaved={saved} onEditingChange={jest.fn()} />);
  expect(toolbar).toContainElement(screen.getByRole('button', { name: 'แก้ไขข้อมูล PS' }));
  expect(screen.getByText('Information Technology')).toBeInTheDocument();
  expect(screen.getByText('18/09/2026 15:17')).toBeInTheDocument();
  expect(screen.queryByText('07')).not.toBeInTheDocument();
  expect(screen.queryByText('2026-09-18T15:17:32')).not.toBeInTheDocument();
  view.unmount();
  toolbar.remove();
});
test('PS edit sends PUT, preserves original requester/recNo and refreshes only after success', async () => {
  update.mockResolvedValueOnce(doc());
  renderPanel();
  fireEvent.click(screen.getByRole('button', { name: 'แก้ไขข้อมูล PS' }));
  fireEvent.change(screen.getByLabelText('ระบุเรื่องที่แจ้ง'), { target: { value: 'แก้รายละเอียด' } });
  fireEvent.click(screen.getByRole('button', { name: 'บันทึกการแก้ไข' }));
  await waitFor(() => expect(saved).toHaveBeenCalledTimes(1));
  expect(update).toHaveBeenCalledWith('PS-01', expect.objectContaining({ requestBy: 'ผู้แจ้งเดิม', requestDetail: 'แก้รายละเอียด', lines: [expect.objectContaining({ recNo: '0001' })] }), 'token');
  expect(reload).toHaveBeenCalled();
});
test('PS cannot edit when backend permission is absent, false or detail fails', () => {
  load.mockReturnValue({ doc: { ...doc(), canEdit: false, canEditAttachment: undefined }, error: null, reload });
  const view = renderPanel();
  expect(screen.queryByRole('button', { name: 'แก้ไขข้อมูล PS' })).not.toBeInTheDocument();
  load.mockReturnValue({ doc: null, error: 'โหลดไม่สำเร็จ', reload });
  view.rerender(<PsRequestPanel docNo="PS-01" refreshKey="1" allowEdit onSaved={saved} onEditingChange={jest.fn()} />);
  expect(screen.getByText('โหลดไม่สำเร็จ')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'แก้ไขข้อมูล PS' })).not.toBeInTheDocument();
});
test('PS attachment-only permission locks header and omits general fields in PUT', async () => {
  load.mockReturnValue({ doc: { ...doc(), canEdit: false }, error: null, reload });
  update.mockResolvedValueOnce(doc());
  renderPanel();
  fireEvent.click(screen.getByRole('button', { name: 'แก้ไขข้อมูล PS' }));
  expect(screen.getByLabelText('ระบุเรื่องที่แจ้ง')).toBeDisabled();
  fireEvent.change(screen.getByLabelText('เลขที่ Quotation'), { target: { value: 'QUO-02' } });
  fireEvent.click(screen.getByRole('button', { name: 'บันทึกการแก้ไข' }));
  await waitFor(() => expect(update).toHaveBeenCalled());
  const payload = update.mock.calls[0][1];
  expect(payload.exBudgetDocNo).toBe('QUO-02');
  expect(payload).not.toHaveProperty('lines');
  expect(payload).not.toHaveProperty('requestDetail');
  await waitFor(() => expect(screen.getByRole('button', { name: 'แก้ไขข้อมูล PS' })).toBeInTheDocument());
});

test('failed PS PUT keeps the draft and does not report success', async () => {
  update.mockRejectedValueOnce(new Error('ไม่มีสิทธิ์แก้ไข'));
  renderPanel();
  fireEvent.click(screen.getByRole('button', { name: 'แก้ไขข้อมูล PS' }));
  fireEvent.change(screen.getByLabelText('ระบุเรื่องที่แจ้ง'), { target: { value: 'draft ยังอยู่' } });
  fireEvent.click(screen.getByRole('button', { name: 'บันทึกการแก้ไข' }));
  await waitFor(() => expect(screen.getByText('ไม่มีสิทธิ์แก้ไข')).toBeInTheDocument());
  expect(screen.getByLabelText('ระบุเรื่องที่แจ้ง')).toHaveValue('draft ยังอยู่');
  expect(saved).not.toHaveBeenCalled();
  expect(screen.queryByText('บันทึกข้อมูล PS เรียบร้อย')).not.toBeInTheDocument();
});
