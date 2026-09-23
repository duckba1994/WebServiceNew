import React, { CSSProperties, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconArrowsHorizontal,
  IconArrowsMaximize,
  IconFileTypePdf,
  IconLoader2,
  IconPrinter,
  IconSearch,
  IconZoomIn,
  IconZoomOut,
} from '@tabler/icons-react';
import { Link, Navigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { DateQuickPick } from '../components/ui/DateQuickPick';
import { useAuth } from '../context/AuthContext';
import { MeasuredReportPage, paginateMeasuredRows } from '../data/plReportPagination';
import { reportByKey } from '../data/reportData';
import { usePLRequestReport } from '../hooks/usePLRequestReport';
import { PLReportCount, PLRequestReport, PLRequestReportItem } from '../types/plReport';

const INPUT = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] outline-none transition focus:border-accent dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100';
const PIE_COLORS = ['#facc15', '#2563eb', '#f97316', '#16a34a', '#a855f7', '#0891b2', '#e11d48', '#64748b'];
const PL_JOB_STATUS_LABELS: Record<string, string> = {
  '2': 'ค้าง PL รับเรื่อง / ต้นสังกัดส่งใบรับเรื่องให้ PL',
  '3': 'PL ค้างส่งเรื่องให้ต้นสังกัด / PL ส่งเรื่องแล้วแต่ค้างปิดใบรับเรื่องใน',
  other: 'ยกเลิกใบรับเรื่อง',
};

const localYmd = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

const defaultRange = () => {
  const today = new Date();
  const from = new Date(today);
  from.setDate(from.getDate() - 7);
  return { dateFrom: localYmd(from), dateTo: localYmd(today) };
};

const formatDate = (value: string | null): string => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB');
};

const formatDateTime = (value: string | null): string => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.toLocaleDateString('en-GB')} ${date.toLocaleTimeString('th-TH', { hour12: false })}`;
};

export function PLReportWorkspace() {
  const { user } = useAuth();
  const report = reportByKey('pl-request-report');
  const department = (user?.departmentShort ?? '').trim().toUpperCase();
  const allowed = user?.role === 'admin' || department === report.department;
  const initial = useMemo(defaultRange, []);
  const [dateFrom, setDateFrom] = useState(initial.dateFrom);
  const [dateTo, setDateTo] = useState(initial.dateTo);
  const [validation, setValidation] = useState('');
  const [zoom, setZoom] = useState(100);
  const previewHost = useRef<HTMLDivElement>(null);
  const current = usePLRequestReport(user?.token);

  if (!allowed) return <Navigate to="/reports" replace />;

  const search = () => {
    if (!dateFrom || !dateTo) {
      setValidation('กรุณาระบุวันที่เริ่มต้นและวันที่สิ้นสุด');
      return;
    }
    if (dateTo < dateFrom) {
      setValidation('วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มต้น');
      return;
    }
    setValidation('');
    void current.search(dateFrom, dateTo);
  };

  const setSafeZoom = (value: number) => setZoom(Math.min(200, Math.max(35, Math.round(value / 5) * 5)));
  const fitPreview = (mode: 'page' | 'width') => {
    const host = previewHost.current;
    if (!host) return;
    const documentWidth = 297 * 96 / 25.4;
    const documentHeight = 210 * 96 / 25.4;
    const widthRatio = (host.clientWidth - 40) / documentWidth;
    const heightRatio = (host.clientHeight - 40) / documentHeight;
    setSafeZoom((mode === 'width' ? widthRatio : Math.min(widthRatio, heightRatio)) * 100);
  };

  return (
    <Layout title={report.title} subtitle="PL Report">
      <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-gray-200 px-5 py-3 dark:border-slate-700">
          <Link to="/reports" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-slate-500 transition hover:border-accent hover:text-accent dark:border-slate-700 dark:text-slate-300" title="กลับหน้ารายงาน"><IconArrowLeft size={17} /></Link>
          <div><h2 className="text-sm font-bold text-gray-900 dark:text-white">{report.title}</h2><p className="text-[11.5px] text-slate-400">{report.description}</p></div>
        </div>

        <div className="flex shrink-0 flex-wrap items-end gap-3 border-b border-gray-200 bg-slate-50 px-5 py-3 dark:border-slate-700 dark:bg-slate-800/60">
          <label className="w-full sm:w-[240px]"><span className="mb-1.5 block text-[11.5px] font-semibold text-slate-500 dark:text-slate-400">วันที่เริ่มต้น</span><DateQuickPick value={dateFrom} onChange={(value) => { setDateFrom(value); setValidation(''); }} inputClass={INPUT} showThaiLabel={false} /></label>
          <label className="w-full sm:w-[240px]"><span className="mb-1.5 block text-[11.5px] font-semibold text-slate-500 dark:text-slate-400">วันที่สิ้นสุด</span><DateQuickPick value={dateTo} onChange={(value) => { setDateTo(value); setValidation(''); }} inputClass={INPUT} min={dateFrom || undefined} showThaiLabel={false} /></label>
          <button type="button" disabled={current.loading} onClick={search} className="inline-flex h-[38px] items-center justify-center gap-2 rounded-lg bg-accent px-4 text-[12.5px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{current.loading ? <IconLoader2 size={16} className="animate-spin" /> : <IconSearch size={16} />}{current.loading ? 'กำลังโหลด…' : 'แสดงรายงาน'}</button>
          {validation && <p className="w-full text-[11.5px] font-semibold text-red-600 dark:text-red-400">{validation}</p>}
        </div>

        {current.error && <div className="flex shrink-0 items-center gap-2 border-b border-red-200 bg-red-50 px-5 py-2.5 text-[12.5px] font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"><IconAlertTriangle size={16} />{current.error}<button type="button" onClick={current.retry} className="ml-auto rounded border border-red-300 px-2.5 py-1 text-[11.5px]">ลองใหม่</button></div>}

        {current.data && current.data.total > 0 && <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-gray-200 bg-white px-5 py-2 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center rounded-lg border border-gray-200 dark:border-slate-700">
            <ToolButton title="ย่อ" onClick={() => setSafeZoom(zoom - 10)} disabled={zoom <= 35}><IconZoomOut size={15} /></ToolButton>
            <button type="button" onClick={() => setZoom(100)} title="กลับเป็น 100%" className="h-8 min-w-[58px] border-x border-gray-200 px-2 text-[12px] font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">{zoom}%</button>
            <ToolButton title="ขยาย" onClick={() => setSafeZoom(zoom + 10)} disabled={zoom >= 200}><IconZoomIn size={15} /></ToolButton>
          </div>
          <button type="button" onClick={() => fitPreview('page')} className="it-report-tool"><IconArrowsMaximize size={15} />พอดีหน้า</button>
          <button type="button" onClick={() => fitPreview('width')} className="it-report-tool"><IconArrowsHorizontal size={15} />พอดีความกว้าง</button>
          <div className="ml-auto flex items-center gap-2">
            <button type="button" onClick={() => window.print()} className="it-report-tool"><IconPrinter size={16} />พิมพ์</button>
            <button type="button" onClick={() => window.print()} className="it-report-tool border-accent bg-accent text-white hover:bg-accent/90"><IconFileTypePdf size={16} />PDF</button>
          </div>
        </div>}

        <div ref={previewHost} className="relative min-h-0 flex-1">
          {current.loading && !current.data ? <ReportState icon={<IconLoader2 size={28} className="animate-spin" />} text="กำลังโหลดรายงาน…" />
            : !current.data ? <ReportState icon={<IconSearch size={32} />} text="เลือกช่วงวันที่แล้วกดแสดงรายงาน" />
            : current.data.total === 0 ? <ReportState icon={<IconSearch size={32} />} text="ไม่พบข้อมูลในช่วงวันที่ที่เลือก" />
            : <PLReportPrint data={current.data} preview zoom={zoom} />}
        </div>
      </section>

      {current.data && current.data.total > 0 && <PLReportPrint data={current.data} />}
    </Layout>
  );
}

function ReportState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[13px] font-semibold text-slate-400">{icon}<span>{text}</span></div>;
}

function ToolButton({ title, onClick, disabled, children }: { title: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return <button type="button" title={title} disabled={disabled} onClick={onClick} className="flex h-8 w-9 items-center justify-center text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-300 dark:hover:bg-slate-800">{children}</button>;
}

const COLUMN_WIDTHS = ['7%', '8%', '5%', '7%', '13%', '9%', '6%', '5%', '4%', '6%', '5%', '11%', '5%', '6%', '8%'];

function PLReportPrint({ data, preview = false, zoom = 100 }: { data: PLRequestReport; preview?: boolean; zoom?: number }) {
  const measureRef = useRef<HTMLElement>(null);
  const [pages, setPages] = useState<MeasuredReportPage<PLRequestReportItem>[]>([
    { items: data.items, showSummary: true },
  ]);

  useLayoutEffect(() => {
    const measure = measureRef.current;
    if (!measure) return;
    const style = window.getComputedStyle(measure);
    const contentHeight = measure.clientHeight
      - parseFloat(style.paddingTop || '0')
      - parseFloat(style.paddingBottom || '0');
    const headerHeight = measure.querySelector<HTMLElement>('.pl-report-head')?.getBoundingClientRect().height ?? 0;
    const tableHeaderHeight = measure.querySelector<HTMLElement>('.pl-report-items thead')?.getBoundingClientRect().height ?? 0;
    const summaryHeight = measure.querySelector<HTMLElement>('.pl-report-summary-block')?.getBoundingClientRect().height ?? 0;
    const rowHeights = Array.from(measure.querySelectorAll<HTMLElement>('[data-pl-report-row]'))
      .map((row) => row.getBoundingClientRect().height);
    const safetyGap = 12;
    const detailBudget = Math.max(1, contentHeight - headerHeight - tableHeaderHeight - safetyGap);
    const lastPageBudget = Math.max(1, detailBudget - summaryHeight);
    setPages(paginateMeasuredRows(data.items, rowHeights, detailBudget, lastPageBudget));
  }, [data]);

  return <>
    <div className="pl-report-measure" aria-hidden="true">
      <article ref={measureRef} className="it-report-print pl-report-print">
        <PLPrintHeader data={data} page={1} totalPages={1} />
        <PLItemsTable items={data.items} measure />
        <div className="pl-report-summary-block"><PLSummary summary={data.summary} total={data.total} /></div>
      </article>
    </div>
    <div className={preview ? 'it-report-preview' : 'print-root'}>{pages.map((page, pageIndex) => (
      <article key={pageIndex} className="it-report-page it-report-print pl-report-print" style={preview ? { zoom: zoom / 100 } : undefined}>
        <PLPrintHeader data={data} page={pageIndex + 1} totalPages={pages.length} />
        {page.items.length > 0 && <PLItemsTable items={page.items} />}
        {page.showSummary && <div className="pl-report-summary-block"><PLSummary summary={data.summary} total={data.total} /></div>}
      </article>
    ))}</div>
  </>;
}

function PLPrintHeader({ data, page, totalPages }: { data: PLRequestReport; page: number; totalPages: number }) {
  const now = new Date();
  return <div className="pl-report-head">
    <strong>รายงานรับเรื่อง PL ประจำวันที่ <b>{formatDate(data.dateFrom)}</b> ถึงวันที่ <b>{formatDate(data.dateTo)}</b></strong>
    <span>วันที่พิมพ์ {now.toLocaleDateString('en-GB')} &nbsp;&nbsp; เวลาที่พิมพ์ {now.toLocaleTimeString('th-TH', { hour12: false })} &nbsp;&nbsp; Page {page} of {totalPages}</span>
  </div>;
}

function PLItemsTable({ items, measure = false }: { items: PLRequestReportItem[]; measure?: boolean }) {
  const headers = ['เลขที่ใบรับเรื่อง', 'วันที่ : เวลา', 'ประเภท', 'เรื่องที่แจ้ง', 'รายการ', 'รายละเอียด เหตุผล', 'ผู้แจ้งเรื่อง', 'หน่วยงาน', 'สถานะ', 'วันที่ดำเนิน', 'ระยะเวลาดำเนินการ', 'ดำเนินการ', 'ผลดำเนินการ', 'วันที่ปิดเรื่อง', 'การอนุมัติ'];
  return <table className="pl-report-items">
    <colgroup>{COLUMN_WIDTHS.map((width, index) => <col key={index} style={{ width }} />)}</colgroup>
    <thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead>
    <tbody>{items.map((item) => <tr key={item.docNo} data-pl-report-row={measure ? '' : undefined}>
      <td>{item.docNo}</td><td>{formatDateTime(item.docDate)}</td><td>{item.type ?? ''}</td><td>{item.requestType ?? ''}</td>
      <td>{item.requestDetail ?? ''}</td><td>{item.requestDetailRemark ?? ''}</td><td>{item.requestBy ?? ''}</td><td>{item.department ?? ''}</td>
      <td>{item.wfStep ?? ''}</td><td>{formatDate(item.wfStep2AppDate)}</td><td>{item.dateService ?? ''}</td><td>{item.actionDetail ?? ''}</td>
      <td>{item.wrDetail ?? ''}</td><td>{formatDate(item.wfStep3AppDate)}</td><td>{item.description ?? ''}</td>
    </tr>)}</tbody>
  </table>;
}

function PLSummary({ summary, total }: { summary: PLRequestReport['summary']; total: number }) {
  const jobStatuses = summary.jobStatuses.map((row) => ({
    ...row,
    label: PL_JOB_STATUS_LABELS[row.key] ?? row.label,
  }));
  const requestTypeColumns = [summary.requestTypes.slice(0, 7), summary.requestTypes.slice(7)];
  return <>
    <div className="pl-summary-tables">
      <CountTable title="สถานะใบรับเรื่อง" rows={jobStatuses} total={total} />
      <div className="pl-request-type-tables">
        {requestTypeColumns.map((rows, column) => <CountTable key={column} title="สถานะเรื่องที่แจ้ง" rows={rows} start={column === 0 ? 1 : 8} total={column === 1 ? total : undefined} />)}
      </div>
    </div>
    <div className="pl-summary-charts">
      <PieChart title="รายงานใบรับเรื่อง" rows={jobStatuses} />
      <PieChart title="รายงานเรื่องที่แจ้ง" rows={summary.requestTypes} />
    </div>
  </>;
}

function CountTable({ title, rows, start = 1, total }: { title: string; rows: PLReportCount[]; start?: number; total?: number }) {
  return <table className="pl-count-table"><thead><tr><th colSpan={2}>{title}</th><th>จำนวน</th></tr></thead><tbody>
    {rows.map((row, index) => <tr key={row.key}><td>{start + index}.</td><td>{row.label}</td><td>{row.count}</td></tr>)}
    {total !== undefined && <tr className="summary"><th colSpan={2}>รวม</th><th>{total}</th></tr>}
  </tbody></table>;
}

function PieChart({ title, rows }: { title: string; rows: PLReportCount[] }) {
  const visible = rows.filter((row) => row.count > 0);
  const total = visible.reduce((sum, row) => sum + row.count, 0);
  let cursor = 0;
  const segments = visible.map((row, index) => {
    const start = cursor;
    cursor += total ? row.count / total * 100 : 0;
    return `${PIE_COLORS[index % PIE_COLORS.length]} ${start}% ${cursor}%`;
  });
  const style: CSSProperties = { background: total ? `conic-gradient(${segments.join(', ')})` : '#e5e7eb' };
  return <div className="pl-pie-card"><h3>{title}</h3><div className="pl-pie-body"><div className="pl-pie" style={style} /><div className="pl-pie-legend">{visible.map((row, index) => <div key={row.key}><i style={{ background: PIE_COLORS[index % PIE_COLORS.length] }} /><span>{row.label}</span><b>{row.count}</b></div>)}</div></div></div>;
}
