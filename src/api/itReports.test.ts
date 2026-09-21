import { fetchItReport } from './itReports';
import { apiGet } from './client';

jest.mock('./client', () => ({ apiGet: jest.fn() }));

test('IT reports send ISO dates to the authenticated report endpoints', async () => {
  (apiGet as jest.Mock).mockResolvedValue({ dateFrom: '2026-09-01', dateTo: '2026-09-21', total: 0, items: [] });

  await fetchItReport('service-form-summary', '2026-09-01', '2026-09-21', 'token');
  await fetchItReport('survey-summary', '2026-09-01', '2026-09-21', 'token');

  expect(apiGet).toHaveBeenNthCalledWith(
    1,
    '/ITRequest/reports/service-form-summary?dateFrom=2026-09-01&dateTo=2026-09-21',
    'token'
  );
  expect(apiGet).toHaveBeenNthCalledWith(
    2,
    '/ITRequest/reports/survey-summary?dateFrom=2026-09-01&dateTo=2026-09-21',
    'token'
  );
});
