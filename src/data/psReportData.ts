import { PSBIT63022Weekly, PSWeeklyMeasure } from '../types/psReport';

export const PS_MEASURE_META: Record<PSWeeklyMeasure, { title: string; shortTitle: string }> = {
  standard: { title: '1. วัดตามมาตรฐาน', shortTitle: 'มาตรฐาน' },
  'required-date': { title: '2. วัดตามวันที่ต้องการราคา', shortTitle: 'วันที่ต้องการราคา' },
  'quote-result': { title: '3. วัดตามวันที่ต้องการ เทียบกับ วันที่ได้ราคา', shortTitle: 'ผลวันที่ได้ราคา' },
  'plan-date': { title: '4. วัดวันที่ต้องการ เทียบกับ Plan วันที่ต้องการ', shortTitle: 'เทียบแผน' },
};

export interface PSWeeklyMatrix {
  measure: PSWeeklyMeasure;
  weeks: number[];
  results: string[];
  cells: Record<string, PSBIT63022Weekly>;
}

export function buildPSWeeklyMatrix(rows: PSBIT63022Weekly[], measure: PSWeeklyMeasure): PSWeeklyMatrix {
  const selected = rows.filter((row) => row.measure === measure);
  const weeks = Array.from(new Set(selected.map((row) => row.weekNumber))).sort((a, b) => a - b);
  const results = Array.from(new Set(selected.map((row) => row.result))).sort((a, b) => a.localeCompare(b, 'th'));
  const cells = Object.fromEntries(selected.map((row) => [`${row.weekNumber}\u0000${row.result}`, row]));
  return { measure, weeks, results, cells };
}
