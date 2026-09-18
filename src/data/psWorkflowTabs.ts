import { RequestWorkflow } from '../types/requestList';

export interface PsWorkflowTab {
  key: string;
  label: string;
  reachedStep: number;
  logAction: string;
  actionCodes: string[];
  wfCodes?: string[];
}

// Approvals remain on General, including the second approval on legacy tickets.
// Never add absent steps or guess a template while the workflow is loading.
export function psWorkflowTabs(workflow?: RequestWorkflow | null): PsWorkflowTab[] {
  const tabs: PsWorkflowTab[] = [
    { key: 'general', label: 'General', reachedStep: 0, logAction: 'create', actionCodes: [] },
  ];
  for (const step of [...(workflow?.steps ?? [])].sort((a, b) => a.step - b.step)) {
    const code = step.code.trim();
    if (code === 'Approved-Request') continue;
    const spec = code === 'Receive-Request'
      ? { label: 'รับเรื่อง', logAction: 'receive', actionCodes: ['saveService', 'receive'] }
      : code === 'Service' || code === 'Service And Close-Job'
        ? { label: code === 'Service And Close-Job' ? 'ดำเนินการและปิดงาน' : 'ดำเนินการ', logAction: 'service', actionCodes: ['saveService', 'service'] }
        : code === 'Received-Service'
          ? { label: 'รับงาน', logAction: 'acceptWork', actionCodes: ['acceptWork'] }
          : code === 'Close-Job' || code === 'Request-Close-Job'
            ? { label: 'ปิดงาน', logAction: 'close', actionCodes: ['close'] }
            : { label: step.name || code, logAction: code, actionCodes: [] };
    tabs.push({ key: `psWorkflow-${step.step}`, reachedStep: step.step, wfCodes: [code], ...spec });
  }
  return tabs;
}
