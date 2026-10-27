import { apiGet } from './client';
import { BCPrintForm, BCPrintModule } from '../types/bcPrintForm';

export const PRINT_MODULES: Record<string, BCPrintModule> = {
  GA: 'GA', IM: 'IM', PS: 'PS', AF: 'AF', HR: 'HRPR', 'HR-PR': 'HRPR', HR_PR: 'HRPR', HRPR: 'HRPR',
  CR: 'CR', SV: 'SV', 'SV-HV': 'SV', 'SV-FL': 'SV', SQA: 'SQA',
};

export const printModuleOf = (module: string): BCPrintModule | null =>
  PRINT_MODULES[module.trim().toUpperCase()] ?? null;

export function fetchBCPrintForm(module: BCPrintModule, docNo: string, token?: string): Promise<BCPrintForm> {
  // encodeURIComponent ป้องกันอักขระพิเศษ ส่วนเลข CR ที่มี / ต้องคงเป็น path segment ตาม API
  const encodedDocNo = docNo.split('/').map(encodeURIComponent).join('/');
  return apiGet<BCPrintForm>(`/print-forms/${module}/${encodedDocNo}`, token);
}
