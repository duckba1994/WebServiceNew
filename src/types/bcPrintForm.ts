export type BCPrintModule = 'GA' | 'IM' | 'PS' | 'AF' | 'HRPR' | 'CR' | 'SV' | 'SQA';

export interface BCPrintApproval {
  step: number | null;
  departId: string | null;
  wfStatus: string | null;
  description: string | null;
  approveBy: string | null;
  approveDate: string | null;
  approved: boolean | null;
}

export type BCPrintFields = Record<string, unknown>;

export interface BCPrintForm {
  module: BCPrintModule;
  docNo: string;
  reportType?: string;
  reportTemplate: string;
  department: string | null;
  internalDepartment: string | null;
  serviceDepartment: string | null;
  header: BCPrintFields;
  lines: BCPrintFields[];
  attachment: BCPrintFields | null;
  approvals: BCPrintApproval[];
}
