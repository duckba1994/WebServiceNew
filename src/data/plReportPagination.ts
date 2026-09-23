export interface MeasuredReportPage<T> {
  items: T[];
  showSummary: boolean;
}

// แบ่งหน้าจากความสูงที่ browser วัดได้จริง ไม่ผูกกับจำนวนแถวตายตัว
export function paginateMeasuredRows<T>(
  items: T[],
  rowHeights: number[],
  detailBudget: number,
  lastPageBudget: number
): MeasuredReportPage<T>[] {
  if (items.length === 0) return [{ items: [], showSummary: true }];

  const heights = items.map((_, index) => Math.max(1, rowHeights[index] ?? 1));
  const pages: MeasuredReportPage<T>[] = [];
  let offset = 0;

  while (offset < items.length) {
    const remainingHeight = heights.slice(offset).reduce((sum, height) => sum + height, 0);
    if (remainingHeight <= lastPageBudget) {
      pages.push({ items: items.slice(offset), showSummary: true });
      return pages;
    }

    const start = offset;
    let used = 0;
    while (offset < items.length && used + heights[offset] <= detailBudget) {
      used += heights[offset];
      offset += 1;
    }

    // แถวเดียวอาจสูงกว่าพื้นที่ทั้งหน้า แต่ต้องให้มันเดินหน้าต่อและอยู่หน้าเดียวของตัวเอง
    if (offset === start) offset += 1;
    pages.push({ items: items.slice(start, offset), showSummary: false });
  }

  pages.push({ items: [], showSummary: true });
  return pages;
}
