import { buildHRReportMatrix, monthKeyOf, monthsInRange, monthsOfYear } from './hrReportMatrix';
import { HRRequestReportItem } from '../types/hrReport';

const item = (requestType: string, status: string, department: string, docDate = '2026-09-10'): HRRequestReportItem => ({
  docNo: `${requestType}-${status}-${department}`,
  docDate,
  site: null,
  requestBy: null,
  position: null,
  department,
  requestType,
  requestDetail: null,
  reqBy: null,
  reqDate: null,
  inspectorBy: null,
  inspectorDate: null,
  receiptBy: null,
  receiptDate: null,
  receiptInspectorBy: null,
  receiptInspectorDate: null,
  action: null,
  refAction: null,
  serviceBy: null,
  serviceDate: null,
  receiptDocBy: null,
  receiptDocDate: null,
  cancelBy: null,
  cancelDate: null,
  remark: null,
  status,
});

test('builds a cross-tab and totals without hardcoded HR labels', () => {
  const matrix = buildHRReportMatrix(
    [item('ER อื่นๆ', 'รอดำเนินการ', 'PL'), item('ER อื่นๆ', 'ปิดใบรับเรื่อง', 'PL')],
    (row) => row.requestType,
    (row) => row.status
  );
  expect(matrix.rows).toEqual(['ER อื่นๆ']);
  expect(matrix.rowTotals).toEqual([2]);
  expect(matrix.columnTotals.reduce((sum, count) => sum + count, 0)).toBe(2);
});

test('provides all twelve annual columns and parses API dates', () => {
  expect(monthsOfYear(2026)).toHaveLength(12);
  expect(monthKeyOf('2026-09-10T08:00:00')).toBe('09/2026');
  expect(monthKeyOf(null)).toBe('ไม่ระบุ');
});

test('creates month columns from an arbitrary inclusive date range', () => {
  expect(monthsInRange('2026-09-01', '2026-11-24')).toEqual(['09/2026', '10/2026', '11/2026']);
});

test('uses the API quantity when totaling the annual report', () => {
  const rows = [{
    docNo: 'HR-1', docDate: '2026-09-10', department: 'HR', requestType: 'ER อื่นๆ', quantity: 3, status: 'ปิดใบรับเรื่อง',
  }];
  const matrix = buildHRReportMatrix(
    rows,
    (row) => row.requestType,
    (row) => monthKeyOf(row.docDate),
    monthsOfYear(2026),
    (row) => 'quantity' in row ? row.quantity : 1
  );
  expect(matrix.total).toBe(3);
  expect(matrix.rowTotals).toEqual([3]);
});
