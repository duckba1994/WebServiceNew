import { paginateMeasuredRows } from './plReportPagination';

test('keeps adding measured rows until the next row no longer fits', () => {
  const pages = paginateMeasuredRows(['a', 'b', 'c', 'd', 'e'], [20, 25, 30, 35, 40], 100, 60);
  expect(pages).toEqual([
    { items: ['a', 'b', 'c'], showSummary: false },
    { items: ['d', 'e'], showSummary: false },
    { items: [], showSummary: true },
  ]);
});

test('puts the summary on the same last page when the remaining measured rows fit', () => {
  expect(paginateMeasuredRows(['a', 'b'], [20, 25], 100, 60)).toEqual([
    { items: ['a', 'b'], showSummary: true },
  ]);
});

test('creates a summary-only page when a full detail page consumes every row', () => {
  expect(paginateMeasuredRows(['a', 'b'], [50, 50], 100, 60)).toEqual([
    { items: ['a', 'b'], showSummary: false },
    { items: [], showSummary: true },
  ]);
});
