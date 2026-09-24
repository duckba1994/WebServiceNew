import { canAccessReportDepartment, reportByKey, reportsForDepartment } from './reportData';

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
  expect(reportsForDepartment('PL', true)).toHaveLength(14);
  expect(reportByKey('it-request-register').path).toBe('/reports/it/request-register');
});

test('SV users see only the SV summary report', () => {
  expect(reportsForDepartment(' sv ').map((report) => report.key)).toEqual(['sv-request-summary']);
  expect(reportByKey('sv-request-summary').path).toBe('/reports/sv/request-summary');
});

test('HR users see both HR reports while departments without reports see none', () => {
  const expected = [
    'hr-request-summary',
    'hr-request-summary-year',
  ];
  expect(reportsForDepartment(' hr ').map((report) => report.key)).toEqual(expected);
  expect(reportsForDepartment('HR-PR').map((report) => report.key)).toEqual(expected);
  expect(reportsForDepartment('HR_PR').map((report) => report.key)).toEqual(expected);
  expect(canAccessReportDepartment('HR', 'HR-PR')).toBe(true);
  expect(reportsForDepartment('GA')).toEqual([]);
});

test('PS users see only the supported legacy reports', () => {
  expect(reportsForDepartment('PS').map((report) => report.key)).toEqual([
    'ps-summary',
    'ps-balance-form',
    'ps-bit60-057',
    'ps-bit61-091',
    'ps-bit61-118-quantity',
    'ps-bit61-118-department',
    'ps-bit61-118-month',
    'ps-bit63-022',
  ]);
  expect(reportsForDepartment('PS').filter((report) => report.pending)).toHaveLength(0);
});
