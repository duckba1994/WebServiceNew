import { fetchHRTypeStatusReport, fetchHRTypeStatusYearReport } from './hrReports';
import { apiGet } from './client';

jest.mock('./client', () => ({ apiGet: jest.fn() }));

test('fetches the HR request report with an inclusive date range', async () => {
  (apiGet as jest.Mock).mockResolvedValue({ dateFrom: '', dateTo: '', total: 0, items: [] });
  await fetchHRTypeStatusReport('2026-09-01', '2026-09-30', 'ใบเตือน ปกติ', 'token');
  expect(apiGet).toHaveBeenCalledWith(
    '/HRPRRequest/reports/type-status?dateFrom=2026-09-01&dateTo=2026-09-30&requestType=%E0%B9%83%E0%B8%9A%E0%B9%80%E0%B8%95%E0%B8%B7%E0%B8%AD%E0%B8%99+%E0%B8%9B%E0%B8%81%E0%B8%95%E0%B8%B4',
    'token'
  );
});

test('fetches the dedicated annual HR report endpoint', async () => {
  (apiGet as jest.Mock).mockResolvedValue({ dateFrom: '', dateTo: '', periodType: 'year', total: 0, items: [] });
  await fetchHRTypeStatusYearReport({ mode: 'year', year: 2026 }, 'token');
  expect(apiGet).toHaveBeenCalledWith('/HRPRRequest/reports/type-status-year?year=2026', 'token');
});

test('fetches the HR summary endpoint by date range or month', async () => {
  (apiGet as jest.Mock).mockResolvedValue({ dateFrom: '', dateTo: '', periodType: 'date', total: 0, items: [] });
  await fetchHRTypeStatusYearReport({ mode: 'date', dateFrom: '2026-09-01', dateTo: '2026-09-24' }, 'token');
  expect(apiGet).toHaveBeenLastCalledWith('/HRPRRequest/reports/type-status-year?dateFrom=2026-09-01&dateTo=2026-09-24', 'token');
  await fetchHRTypeStatusYearReport({ mode: 'month', year: 2026, month: 9 }, 'token');
  expect(apiGet).toHaveBeenLastCalledWith('/HRPRRequest/reports/type-status-year?year=2026&month=9', 'token');
});
