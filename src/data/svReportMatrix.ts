import { SVRequestSummaryItem } from '../types/svReport';

export interface SVReportMonth {
  key: string;
  year: number;
  label: string;
}

export interface SVReportRow {
  section: string;
  department: string;
  requestType: string;
  counts: Record<string, number>;
  total: number;
}

export interface SVReportMatrix {
  months: SVReportMonth[];
  rows: SVReportRow[];
  monthTotals: Record<string, number>;
  grandTotal: number;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const sectionRank = (section: string) => section === 'FL' ? 0 : section === 'HV' ? 1 : 2;

export function monthsInRange(dateFrom: string, dateTo: string): SVReportMonth[] {
  const start = new Date(`${dateFrom.slice(0, 7)}-01T00:00:00`);
  const end = new Date(`${dateTo.slice(0, 7)}-01T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return [];
  const months: SVReportMonth[] = [];
  for (let cursor = new Date(start); cursor <= end; cursor.setMonth(cursor.getMonth() + 1)) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    months.push({ key: `${year}-${String(month + 1).padStart(2, '0')}`, year, label: MONTH_NAMES[month] });
  }
  return months;
}

export function buildSVReportMatrix(items: SVRequestSummaryItem[], dateFrom: string, dateTo: string): SVReportMatrix {
  const months = monthsInRange(dateFrom, dateTo);
  const monthTotals: Record<string, number> = Object.fromEntries(months.map((month) => [month.key, 0]));
  const grouped = new Map<string, SVReportRow>();

  for (const item of items) {
    const month = item.docDate?.slice(0, 7);
    if (!month || !(month in monthTotals)) continue;
    const section = item.typeFL ? 'FL' : item.typeHV ? 'HV' : 'ไม่ระบุ';
    const department = item.departName?.trim() || item.departid?.trim() || 'ไม่ระบุหน่วยงาน';
    const requestType = item.s1ReqRequest?.trim() || 'ไม่ระบุประเภท';
    const key = JSON.stringify([section, department, requestType]);
    let row = grouped.get(key);
    if (!row) {
      row = { section, department, requestType, counts: {}, total: 0 };
      grouped.set(key, row);
    }
    row.counts[month] = (row.counts[month] ?? 0) + 1;
    row.total += 1;
    monthTotals[month] += 1;
  }

  const rows = Array.from(grouped.values()).sort((a, b) =>
    sectionRank(a.section) - sectionRank(b.section)
    || a.department.localeCompare(b.department, 'th')
    || a.requestType.localeCompare(b.requestType, 'th')
  );
  return { months, rows, monthTotals, grandTotal: rows.reduce((sum, row) => sum + row.total, 0) };
}

// A4 landscape: 103 mm for grouping labels and up to 11 month columns of 15 mm.
export function splitSVReportMonths(months: SVReportMonth[]): SVReportMonth[][] {
  if (months.length === 0) return [[]];
  const chunks: SVReportMonth[][] = [];
  for (let i = 0; i < months.length; i += 11) chunks.push(months.slice(i, i + 11));
  return chunks;
}
