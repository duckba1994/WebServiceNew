import { reportByKey, reportsForDepartment } from './reportData';

test('IT users see only IT reports', () => {
  const reports = reportsForDepartment(' it ');
  expect(reports.map((report) => report.key)).toEqual([
    'it-satisfaction-summary',
    'it-request-register',
  ]);
  expect(reports.every((report) => report.department === 'IT')).toBe(true);
});

test('another department cannot receive IT reports while an admin can', () => {
  expect(reportsForDepartment('PL')).toEqual([]);
  expect(reportsForDepartment('PL', true)).toHaveLength(2);
  expect(reportByKey('it-request-register').path).toBe('/reports/it/request-register');
});
