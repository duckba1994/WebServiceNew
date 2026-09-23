import { fetchPLRequestReport } from './plReports';
import { apiGet } from './client';

jest.mock('./client', () => ({ apiGet: jest.fn() }));

test('PL request report sends the inclusive document-date range to the authenticated endpoint', async () => {
  (apiGet as jest.Mock).mockResolvedValue({ total: 0, items: [], summary: { jobStatuses: [], requestTypes: [] } });

  await fetchPLRequestReport('2026-09-01', '2026-09-30', 'token');

  expect(apiGet).toHaveBeenCalledWith(
    '/PLRequest/reports/request-summary?dateFrom=2026-09-01&dateTo=2026-09-30',
    'token'
  );
});
