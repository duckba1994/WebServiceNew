import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  IconAlertTriangle, IconArrowLeft, IconArrowsHorizontal, IconArrowsMaximize,
  IconFileTypePdf, IconLoader2, IconPrinter, IconSearch, IconZoomIn, IconZoomOut,
} from '@tabler/icons-react';
import { Link, Navigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { DateQuickPick } from '../components/ui/DateQuickPick';
import { useAuth } from '../context/AuthContext';
import { MeasuredReportPage, paginateMeasuredRows } from '../data/plReportPagination';
import { reportByKey } from '../data/reportData';
import { buildSVReportMatrix, splitSVReportMonths, SVReportMatrix, SVReportMonth, SVReportRow } from '../data/svReportMatrix';
import { useSVRequestSummary } from '../hooks/useSVRequestSummary';
import { SVRequestSummaryReport } from '../types/svReport';

const INPUT = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] outline-none transition focus:border-accent dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100';
const ymd = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const displayDate = (value: string) => `${value.slice(8, 10)}/${value.slice(5, 7)}/${value.slice(0, 4)}`;
const initialRange = () => {
  const today = new Date();
  return { dateFrom: ymd(new Date(today.getFullYear(), today.getMonth(), 1)), dateTo: ymd(today) };
};

export function SVReportWorkspace() {
  const { user } = useAuth();
  const report = reportByKey('sv-request-summary');
  const allowed = user?.role === 'admin' || (user?.departmentShort ?? '').trim().toUpperCase() === 'SV';
  const initial = useMemo(initialRange, []);
  const [dateFrom, setDateFrom] = useState(initial.dateFrom);
  const [dateTo, setDateTo] = useState(initial.dateTo);
  const [validation, setValidation] = useState('');
  const [zoom, setZoom] = useState(100);
  const previewHost = useRef<HTMLDivElement>(null);
  const current = useSVRequestSummary(user?.token);

  if (!allowed) return <Navigate to="/reports" replace />;

  const search = () => {
    if (!dateFrom || !dateTo) { setValidation('กรุณาระบุวันที่เริ่มต้นและวันที่สิ้นสุด'); return; }
    if (dateTo < dateFrom) { setValidation('วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มต้น'); return; }
    setValidation('');
    void current.search(dateFrom, dateTo);
  };
  const setSafeZoom = (value: number) => setZoom(Math.min(200, Math.max(35, Math.round(value / 5) * 5)));
  const fitPreview = (mode: 'page' | 'width') => {
    const host = previewHost.current;
    if (!host) return;
    const paperWidth = 297 * 96 / 25.4;
    const paperHeight = 210 * 96 / 25.4;
    const widthRatio = (host.clientWidth - 40) / paperWidth;
    const heightRatio = (host.clientHeight - 40) / paperHeight;
    setSafeZoom((mode === 'width' ? widthRatio : Math.min(widthRatio, heightRatio)) * 100);
  };

  return <Layout title={report.title} subtitle="SV Report">
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-gray-200 px-5 py-3 dark:border-slate-700">
        <Link to="/reports" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-slate-500 hover:border-accent hover:text-accent dark:border-slate-700" title="กลับหน้ารายงาน"><IconArrowLeft size={17} /></Link>
        <div><h2 className="text-sm font-bold text-gray-900 dark:text-white">{report.title}</h2><p className="text-[11.5px] text-slate-400">{report.description}</p></div>
      </div>
      <div className="flex shrink-0 flex-wrap items-end gap-3 border-b border-gray-200 bg-slate-50 px-5 py-3 dark:border-slate-700 dark:bg-slate-800/60">
        <label className="w-full sm:w-[240px]"><span className="mb-1.5 block text-[11.5px] font-semibold text-slate-500">วันที่เริ่มต้น</span><DateQuickPick value={dateFrom} onChange={(value) => { setDateFrom(value); setValidation(''); }} inputClass={INPUT} showThaiLabel={false} /></label>
        <label className="w-full sm:w-[240px]"><span className="mb-1.5 block text-[11.5px] font-semibold text-slate-500">วันที่สิ้นสุด</span><DateQuickPick value={dateTo} onChange={(value) => { setDateTo(value); setValidation(''); }} inputClass={INPUT} min={dateFrom || undefined} showThaiLabel={false} /></label>
        <button type="button" disabled={current.loading} onClick={search} className="inline-flex h-[38px] items-center gap-2 rounded-lg bg-accent px-4 text-[12.5px] font-semibold text-white disabled:opacity-50">{current.loading ? <IconLoader2 size={16} className="animate-spin" /> : <IconSearch size={16} />}{current.loading ? 'กำลังโหลด…' : 'แสดงรายงาน'}</button>
        {validation && <p className="w-full text-[11.5px] font-semibold text-red-600">{validation}</p>}
      </div>
      {current.error && <div className="flex shrink-0 items-center gap-2 border-b border-red-200 bg-red-50 px-5 py-2.5 text-[12.5px] font-semibold text-red-700"><IconAlertTriangle size={16} />{current.error}<button type="button" onClick={current.retry} className="ml-auto rounded border border-red-300 px-2.5 py-1 text-[11.5px]">ลองใหม่</button></div>}
      {current.data && current.data.items.length > 0 && <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-gray-200 bg-white px-5 py-2 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center rounded-lg border border-gray-200 dark:border-slate-700">
          <ZoomButton title="ย่อ" onClick={() => setSafeZoom(zoom - 10)} disabled={zoom <= 35}><IconZoomOut size={15} /></ZoomButton>
          <button type="button" onClick={() => setZoom(100)} className="h-8 min-w-[58px] border-x border-gray-200 px-2 text-[12px] font-semibold text-slate-600">{zoom}%</button>
          <ZoomButton title="ขยาย" onClick={() => setSafeZoom(zoom + 10)} disabled={zoom >= 200}><IconZoomIn size={15} /></ZoomButton>
        </div>
        <button type="button" onClick={() => fitPreview('page')} className="it-report-tool"><IconArrowsMaximize size={15} />พอดีหน้า</button>
        <button type="button" onClick={() => fitPreview('width')} className="it-report-tool"><IconArrowsHorizontal size={15} />พอดีความกว้าง</button>
        <div className="ml-auto flex gap-2"><button type="button" onClick={() => window.print()} className="it-report-tool"><IconPrinter size={16} />พิมพ์</button><button type="button" onClick={() => window.print()} className="it-report-tool border-accent bg-accent text-white hover:bg-accent/90"><IconFileTypePdf size={16} />PDF</button></div>
      </div>}
      <div ref={previewHost} className="relative min-h-0 flex-1">
        {current.loading ? <ReportState icon={<IconLoader2 size={28} className="animate-spin" />} text="กำลังโหลดรายงาน…" />
          : !current.data ? <ReportState icon={<IconSearch size={32} />} text="เลือกช่วงวันที่แล้วกดแสดงรายงาน" />
          : current.data.items.length === 0 ? <ReportState icon={<IconSearch size={32} />} text="ไม่พบข้อมูลในช่วงวันที่ที่เลือก" />
          : <SVReportPrint data={current.data} preview zoom={zoom} />}
      </div>
    </section>
    {current.data && current.data.items.length > 0 && <SVReportPrint data={current.data} />}
  </Layout>;
}

function ReportState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[13px] font-semibold text-slate-400">{icon}<span>{text}</span></div>;
}

function ZoomButton({ title, onClick, disabled, children }: { title: string; onClick: () => void; disabled: boolean; children: React.ReactNode }) {
  return <button type="button" title={title} disabled={disabled} onClick={onClick} className="flex h-8 w-9 items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-30">{children}</button>;
}

interface SVPrintPage {
  months: SVReportMonth[];
  rows: SVReportRow[];
  showTotal: boolean;
  showGrandTotal: boolean;
}

function SVReportPrint({ data, preview = false, zoom = 100 }: { data: SVRequestSummaryReport; preview?: boolean; zoom?: number }) {
  const matrix = useMemo(() => buildSVReportMatrix(data.items, data.dateFrom, data.dateTo), [data]);
  const monthGroups = useMemo(() => splitSVReportMonths(matrix.months), [matrix.months]);
  const measureRef = useRef<HTMLElement>(null);
  const [pages, setPages] = useState<SVPrintPage[]>([]);

  useLayoutEffect(() => {
    const measure = measureRef.current;
    if (!measure) return;
    const style = window.getComputedStyle(measure);
    const contentHeight = measure.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    const headingHeight = measure.querySelector<HTMLElement>('.sv-report-heading')?.getBoundingClientRect().height ?? 0;
    const tableHeadHeight = measure.querySelector<HTMLElement>('thead')?.getBoundingClientRect().height ?? 0;
    const totalHeight = measure.querySelector<HTMLElement>('[data-sv-total]')?.getBoundingClientRect().height ?? 0;
    const rowHeights = Array.from(measure.querySelectorAll<HTMLElement>('[data-sv-row]')).map((row) => row.getBoundingClientRect().height);
    const rowBudget = Math.max(1, contentHeight - headingHeight - tableHeadHeight - 14);
    const result: SVPrintPage[] = [];
    monthGroups.forEach((months, groupIndex) => {
      const pageRows: MeasuredReportPage<SVReportRow>[] = paginateMeasuredRows(matrix.rows, rowHeights, rowBudget, Math.max(1, rowBudget - totalHeight));
      pageRows.forEach((page) => result.push({
        months, rows: page.items, showTotal: page.showSummary,
        showGrandTotal: groupIndex === monthGroups.length - 1,
      }));
    });
    setPages(result);
  }, [matrix, monthGroups]);

  return <>
    <div className="sv-report-measure" aria-hidden="true">
      <article ref={measureRef} className="it-report-print sv-report-print">
        <SVHeading data={data} page={1} totalPages={1} />
        <SVTable matrix={matrix} months={monthGroups[0]} rows={matrix.rows} showTotal showGrandTotal measure />
      </article>
    </div>
    <div className={preview ? 'it-report-preview' : 'print-root'}>
      {pages.map((page, index) => <article key={index} className="it-report-page it-report-print sv-report-print" style={preview ? { zoom: zoom / 100 } : undefined}>
        <SVHeading data={data} page={index + 1} totalPages={pages.length} />
        <SVTable matrix={matrix} {...page} />
      </article>)}
    </div>
  </>;
}

function SVHeading({ data, page, totalPages }: { data: SVRequestSummaryReport; page: number; totalPages: number }) {
  return <header className="sv-report-heading">
    <div className="sv-report-meta">พิมพ์วันที่ {new Date().toLocaleDateString('en-GB')}<span>Page {page} of {totalPages}</span></div>
    <strong>บริษัท บิ๊กเครน แอนด์ อิควิปเม้นต์ เร้นทัลส์ จำกัด</strong>
    <h2>รายงานสรุปประเภทการแจ้งเรื่อง ตั้งแต่วันที่ {displayDate(data.dateFrom)} ถึงวันที่ {displayDate(data.dateTo)}</h2>
  </header>;
}

function SVTable({ matrix, months, rows, showTotal, showGrandTotal, measure = false }: {
  matrix: SVReportMatrix; months: SVReportMonth[]; rows: SVReportRow[];
  showTotal: boolean; showGrandTotal: boolean; measure?: boolean;
}) {
  const yearGroups: { year: number; count: number }[] = [];
  months.forEach((month) => {
    const previous = yearGroups[yearGroups.length - 1];
    if (previous?.year === month.year) previous.count += 1;
    else yearGroups.push({ year: month.year, count: 1 });
  });
  const sectionSpan = (index: number) => {
    let count = 1;
    while (rows[index + count]?.section === rows[index].section) count += 1;
    return count;
  };
  const departmentSpan = (index: number) => {
    let count = 1;
    while (rows[index + count]?.section === rows[index].section && rows[index + count]?.department === rows[index].department) count += 1;
    return count;
  };
  return <table className="sv-report-table" style={{ width: `${103 + (months.length + Number(showGrandTotal)) * 15}mm` }}>
    <colgroup><col style={{ width: '15mm' }} /><col style={{ width: '18mm' }} /><col style={{ width: '70mm' }} />{months.map((month) => <col key={month.key} style={{ width: '15mm' }} />)}{showGrandTotal && <col style={{ width: '15mm' }} />}</colgroup>
    <thead><tr><th rowSpan={2} className="sv-group-head" aria-label="ส่วนงาน" /><th rowSpan={2} className="sv-group-head" aria-label="หน่วยงาน" /><th rowSpan={2} className="sv-group-head" aria-label="ประเภทการแจ้งเรื่อง" />{yearGroups.map((group) => <th key={group.year} colSpan={group.count}>{group.year}</th>)}{showGrandTotal && <th rowSpan={2}>Total</th>}</tr><tr>{months.map((month) => <th key={month.key}>{month.label}</th>)}</tr></thead>
    <tbody>{rows.map((row, index) => {
      const firstSection = index === 0 || rows[index - 1].section !== row.section;
      const firstDepartment = firstSection || rows[index - 1].department !== row.department;
      return <tr key={`${row.section}/${row.department}/${row.requestType}`} data-sv-row={measure ? '' : undefined}>
        {firstSection && <th rowSpan={sectionSpan(index)}>{row.section}</th>}
        {firstDepartment && <th rowSpan={departmentSpan(index)}>{row.department}</th>}
        <th>{row.requestType}</th>
        {months.map((month) => <td key={month.key}>{row.counts[month.key] ?? 0}</td>)}
        {showGrandTotal && <td className="sv-total-cell">{row.total}</td>}
      </tr>;
    })}{showTotal && <tr className="sv-total-row" data-sv-total={measure ? '' : undefined}><th colSpan={3}>Total</th>{months.map((month) => <td key={month.key}>{matrix.monthTotals[month.key]}</td>)}{showGrandTotal && <td>{matrix.grandTotal}</td>}</tr>}</tbody>
  </table>;
}
