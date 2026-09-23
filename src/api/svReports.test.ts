import { fetchSVRequestSummary } from './svReports';
import { apiGet } from './client';

jest.mock('./client', () => ({ apiGet: jest.fn() }));

test('SV summary requests the inclusive document-date range with the login token', async () => {
  (apiGet as jest.Mock).mockResolvedValue({ dateFrom: '2026-09-01', dateTo: '2026-09-30', total: 0, items: [] });

  await fetchSVRequestSummary('2026-09-01', '2026-09-30', 'token');

  expect(apiGet).toHaveBeenCalledWith(
    '/SVRequest/reports/request-summary?dateFrom=2026-09-01&dateTo=2026-09-30',
    'token'
  );
});
