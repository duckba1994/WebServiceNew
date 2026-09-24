import { HRRequestReportItem, HRRequestYearReportItem } from '../types/hrReport';

type HRMatrixItem = HRRequestReportItem | HRRequestYearReportItem;

export interface HRReportMatrix {
  rows: string[];
  columns: string[];
  values: number[][];
  rowTotals: number[];
  columnTotals: number[];
  total: number;
}

const labelOf = (value: string | null | undefined): string => value?.trim() || 'ไม่ระบุ';
const thaiSort = (left: string, right: string): number => left.localeCompare(right, 'th');

export function buildHRReportMatrix(
  items: HRMatrixItem[],
  rowOf: (item: HRMatrixItem) => string | null,
  columnOf: (item: HRMatrixItem) => string | null,
  forcedColumns?: string[],
  weightOf: (item: HRMatrixItem) => number = () => 1
): HRReportMatrix {
  const rows = Array.from(new Set(items.map((item) => labelOf(rowOf(item))))).sort(thaiSort);
  const columns = forcedColumns ?? Array.from(new Set(items.map((item) => labelOf(columnOf(item))))).sort(thaiSort);
  const rowIndex = new Map(rows.map((label, index) => [label, index]));
  const columnIndex = new Map(columns.map((label, index) => [label, index]));
  const values = rows.map(() => columns.map(() => 0));

  items.forEach((item) => {
    const row = rowIndex.get(labelOf(rowOf(item)));
    const column = columnIndex.get(labelOf(columnOf(item)));
    if (row !== undefined && column !== undefined) values[row][column] += Math.max(0, Number(weightOf(item)) || 0);
  });

  const rowTotals = values.map((counts) => counts.reduce((sum, count) => sum + count, 0));
  const columnTotals = columns.map((_, column) => values.reduce((sum, counts) => sum + counts[column], 0));
  return { rows, columns, values, rowTotals, columnTotals, total: rowTotals.reduce((sum, count) => sum + count, 0) };
}

export const monthKeyOf = (value: string | null): string => {
  if (!value) return 'ไม่ระบุ';
  const match = /^(\d{4})-(\d{2})/.exec(value);
  return match ? `${match[2]}/${match[1]}` : 'ไม่ระบุ';
};

export const monthsOfYear = (year: number): string[] =>
  Array.from({ length: 12 }, (_, month) => `${String(month + 1).padStart(2, '0')}/${year}`);

export const monthsInRange = (dateFrom: string, dateTo: string): string[] => {
  const from = /^(\d{4})-(\d{2})/.exec(dateFrom);
  const to = /^(\d{4})-(\d{2})/.exec(dateTo);
  if (!from || !to) return [];
  const start = Number(from[1]) * 12 + Number(from[2]) - 1;
  const end = Number(to[1]) * 12 + Number(to[2]) - 1;
  if (end < start) return [];
  return Array.from({ length: end - start + 1 }, (_, index) => {
    const value = start + index;
    const year = Math.floor(value / 12);
    const month = value % 12 + 1;
    return `${String(month).padStart(2, '0')}/${year}`;
  });
};
