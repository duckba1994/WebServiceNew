import { RequestWorkflow } from '../types/requestList';

export interface PsWorkflowTab {
  key: string;
  label: string;
  reachedStep: number;
  logAction: string;
  actionCodes: string[];
  panelCodes?: string[];
  wfCodes?: string[];
}

// Confirmed PS screens: General → รับเรื่อง → ดำเนินการ.
// Like other modules, render all tabs immediately and resolve step numbers from the API.
export function psWorkflowTabs(workflow?: RequestWorkflow | null): PsWorkflowTab[] {
  const tabs: PsWorkflowTab[] = [
    { key: 'general', label: 'General', reachedStep: 0, logAction: 'create', actionCodes: [] },
    { key: 'psReceive', label: 'รับเรื่อง', reachedStep: 2, logAction: 'receive', actionCodes: ['receive', 'return'], wfCodes: ['Receive-Request'] },
    { key: 'psService', label: 'ดำเนินการ', reachedStep: 3, logAction: 'service', actionCodes: [], panelCodes: ['saveService', 'service'], wfCodes: ['Service', 'Service And Close-Job'] },
  ];
  return tabs.map(tab => ({ ...tab, reachedStep: workflow?.steps.find(step => tab.wfCodes?.includes(step.code.trim()))?.step ?? tab.reachedStep }));
}
