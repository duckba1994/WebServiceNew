import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { RequestGrid } from './RequestGrid';
import { DraftScope } from '../../hooks/useSessionDraft';
import { clearDraftSession, draftGeneration, startDraftSession, writeDraft } from '../../utils/sessionDrafts';
import { fetchRequestDetail } from '../../api/requests';
import { RequestListItem } from '../../types/requestList';

jest.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: { id: 'alice', token: 'new-token' } }) }));
jest.mock('../../api/requests', () => ({ fetchRequestDetail: jest.fn() }));
jest.mock('./RequestDetailModal', () => ({ RequestDetailModal: ({ item, onClose }: { item: RequestListItem; onClose: () => void }) => <div data-testid="detail">{item.module}::{item.docNo}<button onClick={onClose}>ปิดใบ</button></div> }));

const item = { module: 'PS', docNo: 'PS01', requestBy: 'Alice', availableActions: [] } as unknown as RequestListItem;
const receive = { code: 'receive', label: 'รับเรื่อง', style: 'primary', requireNote: true, requiredFields: [] };
beforeEach(() => {
  clearDraftSession(); startDraftSession('alice');
  writeDraft('/%2Finbox/RequestGrid.viewKey', 'PS::PS01', true, draftGeneration());
  (fetchRequestDetail as jest.Mock).mockResolvedValue({ item, logs: [], workflow: null });
});
afterEach(() => clearDraftSession());

test('reopens the document by module and number even after it leaves the queue', async () => {
  render(<DraftScope name="/inbox"><RequestGrid columns={[]} items={[]} loading={false} /></DraftScope>);
  expect(await screen.findByTestId('detail')).toHaveTextContent('PS::PS01');
  expect(fetchRequestDetail).toHaveBeenCalledWith('PS', 'PS01', 'new-token');
  fireEvent.click(screen.getByText('ปิดใบ'));
  expect(screen.queryByTestId('detail')).not.toBeInTheDocument();
});

test('restored action is blocked when the fresh document no longer offers it', async () => {
  writeDraft('/%2Finbox/RequestGrid.actionCode', 'receive', true, draftGeneration());
  const action = jest.fn();
  render(<DraftScope name="/inbox"><RequestGrid columns={[]} items={[]} onAction={action} /></DraftScope>);
  await screen.findByText('สถานะหรือสิทธิ์ของใบเปลี่ยนแล้ว กรุณาตรวจสอบรายการดำเนินการล่าสุด');
  expect(screen.queryByText('ยืนยันรับเรื่อง')).not.toBeInTheDocument();
  expect(action).not.toHaveBeenCalled();
});

test('action-form notes return only with fresh permission and are not submitted automatically', async () => {
  writeDraft('/%2Finbox/RequestGrid.actionCode', 'receive', true, draftGeneration());
  writeDraft('/%2Finbox/PS%3A%3APS01%3Areceive/RequestActionDialog.note', 'หมายเหตุที่กรอกค้าง', true, draftGeneration());
  (fetchRequestDetail as jest.Mock).mockResolvedValue({ item: { ...item, availableActions: [receive] }, logs: [], workflow: null });
  const action = jest.fn();
  render(<DraftScope name="/inbox"><RequestGrid columns={[]} items={[]} onAction={action} /></DraftScope>);
  expect(await screen.findByDisplayValue('หมายเหตุที่กรอกค้าง')).toBeInTheDocument();
  expect(action).not.toHaveBeenCalled();
});
