import { psWorkflowTabs } from './psWorkflowTabs';
import { RequestWorkflow } from '../types/requestList';

const workflow = (codes: string[]): RequestWorkflow => ({
  module: 'PS', name: 'PS', stepCount: codes.length, statuses: [],
  steps: codes.map((code, index) => ({ step: index + 1, code, name: code,
    ownerType: null, departId: null, permission: null, jobStatus: null, phase: null })),
});
test('new PS tickets use only the three-step API workflow', () => {
  const tabs = psWorkflowTabs(workflow(['Approved-Request', 'Receive-Request', 'Service And Close-Job']));
  expect(tabs.map(tab => tab.label)).toEqual(['General', 'รับเรื่อง', 'ดำเนินการ']);
  expect(tabs.map(tab => tab.reachedStep)).toEqual([0, 2, 3]);
  expect(tabs[1].actionCodes).toEqual(['receive', 'return']);
  expect(tabs[2].actionCodes).toEqual([]);
  expect(tabs[2].panelCodes).toEqual(['saveService', 'service']);
});
test('API steps resolve numbers without adding screens beyond the confirmed three tabs', () => {
  const tabs = psWorkflowTabs(workflow(['Approved-Request', 'Receive-Request', 'Approved-Request', 'Service', 'Received-Service', 'Close-Job']));
  expect(tabs.map(tab => tab.label)).toEqual(['General', 'รับเรื่อง', 'ดำเนินการ']);
  expect(tabs.map(tab => tab.reachedStep)).toEqual([0, 2, 4]);
  expect(tabs.flatMap(tab => tab.actionCodes)).not.toContain('approve');
});
test('all three tabs render before loading and keep stable keys after API resolution', () => {
  expect(psWorkflowTabs().map(tab => tab.label)).toEqual(['General', 'รับเรื่อง', 'ดำเนินการ']);
  const value = workflow(['Service', 'Custom', 'Receive-Request']);
  value.steps[0].step = 12;
  value.steps[1].step = 9;
  value.steps[2].step = 5;
  const tabs = psWorkflowTabs(value);
  expect(tabs.map(tab => tab.reachedStep)).toEqual([0, 5, 12]);
  expect(tabs.map(tab => tab.key)).toEqual(psWorkflowTabs().map(tab => tab.key));
  expect(tabs[2].actionCodes).toEqual([]);
});
