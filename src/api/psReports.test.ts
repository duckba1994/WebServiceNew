import { fetchPSBalanceForm, fetchPSBIT60057, fetchPSBIT61091, fetchPSBIT61118, fetchPSBIT63022, fetchPSSummary } from './psReports';
import { apiGet } from './client';

jest.mock('./client', () => ({ apiGet: jest.fn() }));
beforeEach(() => (apiGet as jest.Mock).mockResolvedValue({ items: [], weekly: [], step2Items: [], step3Items: [] }));

test('calls the supported PS legacy report endpoints', async () => {
  await fetchPSSummary('2026-09-01', '2026-09-30', '06', 6, 'token');
  await fetchPSBalanceForm(2026, 9, 'token');
  await fetchPSBIT60057(2026, 9, 'token');
  await fetchPSBIT61091('2026-09-01', '2026-09-30', 'token');
  await fetchPSBIT61118('department', '2026-09-01', '2026-09-30', '1', '1.1', 'token');
  await fetchPSBIT63022('2026-09-01', '2026-09-30', 'token');
  expect(apiGet).toHaveBeenNthCalledWith(1, '/PSRequest/reports/summary?dateFrom=2026-09-01&dateTo=2026-09-30&departmentId=06&wfStep=6', 'token');
  expect(apiGet).toHaveBeenNthCalledWith(2, '/PSRequest/reports/balance-form?year=2026&month=9', 'token');
  expect(apiGet).toHaveBeenNthCalledWith(3, '/PSRequest/reports/bit60-057?year=2026&month=9', 'token');
  expect(apiGet).toHaveBeenNthCalledWith(4, '/PSRequest/reports/bit61-091?dateFrom=2026-09-01&dateTo=2026-09-30', 'token');
  expect(apiGet).toHaveBeenNthCalledWith(5, '/PSRequest/reports/bit61-118/department?dateFrom=2026-09-01&dateTo=2026-09-30&rpId=1&rpDetailId=1.1', 'token');
  expect(apiGet).toHaveBeenNthCalledWith(6, '/PSRequest/reports/bit63-022?dateFrom=2026-09-01&dateTo=2026-09-30', 'token');
});

test('BIT61-091 supports the API status mode without dates', async () => {
  await fetchPSBIT61091(undefined, undefined, 'token');
  expect(apiGet).toHaveBeenCalledWith('/PSRequest/reports/bit61-091', 'token');
});
