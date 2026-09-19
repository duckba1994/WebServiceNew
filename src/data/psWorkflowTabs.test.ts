import { psWorkflowTabs } from './psWorkflowTabs';
import { RequestWorkflow } from '../types/requestList';

const workflow = (codes: string[]): RequestWorkflow => ({
  module: 'PS', name: 'PS', stepCount: codes.length, statuses: [],
  steps: codes.map((code, index) => ({ step: index + 1, code, name: code,
    ownerType: null, departId: null, permission: null, jobStatus: null, phase: null })),
});
test('new PS tickets use only the three-step API workflow', () => {
  const tabs = psWorkflowTabs(workflow(['Approved-Request', 'Receive-Request', 'Service And Close-Job']));
  expect(tabs.map(tab => tab.label)).toEqual(['General', 'รับเรื่อง', 'ดำเนินการและปิดงาน']);
  expect(tabs.map(tab => tab.reachedStep)).toEqual([0, 2, 3]);
  expect(tabs[1].actionCodes).toEqual(['receive', 'return']);
  expect(tabs[2].actionCodes).toEqual([]);
  expect(tabs[2].panelCodes).toEqual(['saveService', 'service']);
});
test('legacy six-step tickets retain accept and close; both approvals stay on General', () => {
  const tabs = psWorkflowTabs(workflow(['Approved-Request', 'Receive-Request', 'Approved-Request', 'Service', 'Received-Service', 'Close-Job']));
  expect(tabs.map(tab => tab.label)).toEqual(['General', 'รับเรื่อง', 'ดำเนินการ', 'รับงาน', 'ปิดงาน']);
  expect(tabs.map(tab => tab.reachedStep)).toEqual([0, 2, 4, 5, 6]);
  expect(tabs.flatMap(tab => tab.actionCodes)).not.toContain('approve');
});
test('no guessed legacy tabs while loading; unknown and renumbered steps retain API ordering', () => {
  expect(psWorkflowTabs().map(tab => tab.key)).toEqual(['general']);
  const value = workflow(['Service', 'Custom', 'Receive-Request']);
  value.steps[0].step = 12;
  value.steps[1].step = 9;
  value.steps[2].step = 5;
  const tabs = psWorkflowTabs(value);
  expect(tabs.map(tab => tab.reachedStep)).toEqual([0, 5, 9, 12]);
  expect(tabs[2].label).toBe('Custom');
  expect(tabs[2].actionCodes).toEqual([]);
});
