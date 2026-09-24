import { buildPSWeeklyMatrix } from './psReportData';

test('builds weekly columns from API data without assuming week numbers', () => {
  const matrix = buildPSWeeklyMatrix([
    { weekNumber: 41, measure: 'standard', result: 'ตามมาตรฐาน', quantity: 3, total: 4, percent: 75 },
    { weekNumber: 41, measure: 'standard', result: 'เกินมาตรฐาน', quantity: 1, total: 4, percent: 25 },
    { weekNumber: 43, measure: 'required-date', result: 'ตามวันที่ต้องการราคา', quantity: 2, total: 2, percent: 100 },
  ], 'standard');
  expect(matrix.weeks).toEqual([41]);
  expect(matrix.results).toEqual(['เกินมาตรฐาน', 'ตามมาตรฐาน']);
  expect(matrix.cells['41\u0000ตามมาตรฐาน'].percent).toBe(75);
});
