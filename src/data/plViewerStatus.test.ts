import { plViewerStatusOptions } from './plViewerStatus';

test('PL status choices follow the selected historical date range', () => {
  expect(plViewerStatusOptions('2018-01-01', '2019-01-03').find((option) => option.value === '3')?.label).toContain('Approved-Request');
  expect(plViewerStatusOptions('2019-01-04', '2021-05-08').find((option) => option.value === '3')?.label).toContain('Service-Close-Job');
  expect(plViewerStatusOptions('2026-09-01', '2026-09-30').find((option) => option.value === '4')?.label).toContain('Request-Close-Job');
  expect(plViewerStatusOptions('2026-09-01', '2026-09-30')[0].value).toBe('0');
});
