import { apiGet } from './client';
import { fetchBCPrintForm, printModuleOf } from './bcPrintForms';

jest.mock('./client', () => ({ apiGet: jest.fn() }));

test('BC print modules include HR-PR and GA', () => {
  expect(printModuleOf('HR-PR')).toBe('HRPR');
  expect(printModuleOf('SV-HV')).toBe('SV');
  expect(printModuleOf('GA')).toBe('GA');
});

test('GA print API uses the default report without reportType', async () => {
  (apiGet as jest.Mock).mockResolvedValue({});
  await fetchBCPrintForm('GA', 'GA-BC-26-0001', 'token');
  expect(apiGet).toHaveBeenCalledWith('/print-forms/GA/GA-BC-26-0001', 'token');
});

test('BC print API preserves the slash in CR document numbers', async () => {
  (apiGet as jest.Mock).mockResolvedValue({});
  await fetchBCPrintForm('CR', 'BHV-SER01/26-0001', 'token');
  expect(apiGet).toHaveBeenCalledWith('/print-forms/CR/BHV-SER01/26-0001', 'token');
});
