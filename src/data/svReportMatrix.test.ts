import { buildSVReportMatrix, monthsInRange, splitSVReportMonths } from './svReportMatrix';
import { SVRequestSummaryItem } from '../types/svReport';

const item = (docNo: string, docDate: string, section: 'FL' | 'HV', department: string, requestType: string): SVRequestSummaryItem => ({
  docNo, docDate, departid: null, departName: department,
  typeFL: section === 'FL', typeHV: section === 'HV', s1ReqRequest: requestType, s1ReqOther: null,
});

test('groups SV tickets by section, requester department, request type and document month', () => {
  const matrix = buildSVReportMatrix([
    item('1', '2025-12-31T12:00:00', 'HV', 'SL-HV', 'รถเสีย'),
    item('2', '2026-01-01T09:00:00', 'HV', 'SL-HV', 'รถเสีย'),
    item('3', '2026-01-05T09:00:00', 'FL', 'SL-FL', 'อื่นๆ'),
    item('4', '2026-01-06T09:00:00', 'HV', 'SL-HV', 'รถเสีย'),
  ], '2025-12-01', '2026-01-31');
  expect(matrix.months.map((month) => month.key)).toEqual(['2025-12', '2026-01']);
  expect(matrix.rows.map((row) => `${row.section}/${row.department}/${row.requestType}`))
    .toEqual(['FL/SL-FL/อื่นๆ', 'HV/SL-HV/รถเสีย']);
  expect(matrix.rows[1].counts).toEqual({ '2025-12': 1, '2026-01': 2 });
  expect(matrix.monthTotals).toEqual({ '2025-12': 1, '2026-01': 3 });
  expect(matrix.grandTotal).toBe(4);
});

test('splits a 13-month range into landscape-width month groups', () => {
  expect(splitSVReportMonths(monthsInRange('2025-09-01', '2026-09-30')).map((group) => group.length))
    .toEqual([11, 2]);
});
