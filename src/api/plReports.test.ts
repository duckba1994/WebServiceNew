import { fetchPLRequestFormReport, fetchPLRequestReport, fetchPLViewerSummary } from './plReports';
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

test('PL viewer summary sends department id and workflow step to its own endpoint', async () => {
  (apiGet as jest.Mock).mockResolvedValue({ total: 0, items: [] });

  await fetchPLViewerSummary('2026-09-01', '2026-09-30', '20', 3, 'token');
  expect(apiGet).toHaveBeenCalledWith(
    '/PLRequest/reports/viewer-summary?dateFrom=2026-09-01&dateTo=2026-09-30&departId=20&wfStep=3',
    'token'
  );

  await fetchPLViewerSummary('2026-09-01', '2026-09-30', '', 0, 'token');
  expect(apiGet).toHaveBeenLastCalledWith(
    '/PLRequest/reports/viewer-summary?dateFrom=2026-09-01&dateTo=2026-09-30',
    'token'
  );
});

test('PL form report requests the selected template for one encoded document number', async () => {
  (apiGet as jest.Mock).mockResolvedValue({ reportType: 'approve', header: {}, lines: [], approvals: [] });

  await fetchPLRequestFormReport('PL/BC-26-001', 'approve', 'token');

  expect(apiGet).toHaveBeenCalledWith(
    '/PLRequest/reports/request-form/PL%2FBC-26-001?reportType=approve',
    'token'
  );
});
