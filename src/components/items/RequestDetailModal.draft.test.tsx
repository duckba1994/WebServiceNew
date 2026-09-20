import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { RequestDetailModal } from './RequestDetailModal';
import { DraftScope } from '../../hooks/useSessionDraft';
import { clearDraftSession, startDraftSession, suspendDraftSession } from '../../utils/sessionDrafts';
import { useRequestDetail } from '../../hooks/useRequestDetail';
import { RequestListItem } from '../../types/requestList';

jest.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: { id: 'alice', token: 'token', departid: 'PS' } }) }));
jest.mock('../../hooks/useRequestDetail');
jest.mock('./PsRequestPanel', () => ({ PsRequestPanel: () => <div>PS General content</div> }));
jest.mock('./PsServicePanel', () => ({ PsServicePanel: () => <div>PS Service content</div> }));

const item = {
  module: 'PS', docNo: 'PS01', requestBy: 'Alice', departId: 'IT', departmentName: 'IT',
  requestDate: '2026-09-20', detail: 'ข้อมูลใบ', jobStatus: '2', jobStatusName: 'ดำเนินการ',
  wfStep: 3, wfStepTotal: 3, wfStepName: 'ดำเนินการ', wfStatus: 'Service', description: '',
  currentDepartId: 'PS', currentDepartmentName: 'PS', isMyTurn: true, phase: 'in_progress',
  phaseName: 'กำลังดำเนินการ', ownerType: 'target', resolution: null, availableActions: [],
} as RequestListItem;
beforeEach(() => {
  clearDraftSession(); startDraftSession('alice');
  (useRequestDetail as jest.Mock).mockReturnValue({ detail: { item, logs: [], workflow: null, attachments: [] }, loading: false, error: null });
});
afterEach(() => clearDraftSession());

test('restores the user-selected PS tab instead of jumping to the workflow default', () => {
  const app = <DraftScope name="/inbox"><RequestDetailModal item={item} onClose={jest.fn()} /></DraftScope>;
  const first = render(app);
  expect(screen.getByText('PS Service content')).toBeInTheDocument();
  fireEvent.click(screen.getAllByRole('button', { name: /General/ })[0]);
  expect(screen.getByText('PS General content')).toBeInTheDocument();
  suspendDraftSession('/inbox'); first.unmount();
  startDraftSession('alice', true);
  render(app);
  expect(screen.getByText('PS General content')).toBeInTheDocument();
  expect(screen.queryByText('PS Service content')).not.toBeInTheDocument();
});
