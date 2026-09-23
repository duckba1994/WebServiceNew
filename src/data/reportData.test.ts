import { reportByKey, reportsForDepartment } from './reportData';

test('IT users see only IT reports', () => {
  const reports = reportsForDepartment(' it ');
  expect(reports.map((report) => report.key)).toEqual([
    'it-satisfaction-summary',
    'it-request-register',
  ]);
  expect(reports.every((report) => report.department === 'IT')).toBe(true);
});

test('PL users see only the PL request report while an admin sees every report', () => {
  expect(reportsForDepartment(' pl ')).toEqual([
    expect.objectContaining({
      key: 'pl-request-report',
      department: 'PL',
      title: 'รายงานใบรับเรื่อง',
      path: '/reports/pl/request-report',
    }),
  ]);
  expect(reportsForDepartment('PL').every((report) => report.department === 'PL')).toBe(true);
  expect(reportsForDepartment('PL', true)).toHaveLength(4);
  expect(reportByKey('it-request-register').path).toBe('/reports/it/request-register');
});

test('SV users see only the SV summary report', () => {
  expect(reportsForDepartment(' sv ').map((report) => report.key)).toEqual(['sv-request-summary']);
  expect(reportByKey('sv-request-summary').path).toBe('/reports/sv/request-summary');
});
