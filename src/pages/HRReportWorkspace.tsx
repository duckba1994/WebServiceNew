import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  IconAlertTriangle, IconArrowLeft, IconArrowsHorizontal, IconArrowsMaximize,
  IconFileTypePdf, IconLoader2, IconPrinter, IconSearch, IconZoomIn, IconZoomOut,
} from '@tabler/icons-react';
import { Link, Navigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { DateQuickPick } from '../components/ui/DateQuickPick';
import { SearchSelect } from '../components/ui/SearchSelect';
import { useAuth } from '../context/AuthContext';
import { buildHRReportMatrix, HRReportMatrix, monthKeyOf, monthsInRange } from '../data/hrReportMatrix';
import { paginateMeasuredRows, MeasuredReportPage } from '../data/plReportPagination';
import { canAccessReportDepartment, reportByKey, HRReportKey } from '../data/reportData';
import { useDeptMasterData } from '../hooks/useDeptMasterData';
import { useHRRequestReport, useHRRequestYearReport } from '../hooks/useHRRequestReport';
import { HRRequestReport, HRRequestReportItem, HRRequestYearReport } from '../types/hrReport';

const INPUT = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] outline-none transition focus:border-accent dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100';
const ymd = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const displayDate = (value: string | null) => {
  if (!value) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
};
const initialRange = () => {
  const today = new Date();
  return { dateFrom: ymd(new Date(today.getFullYear(), today.getMonth(), 1)), dateTo: ymd(today) };
};

export function HRReportWorkspace({ reportKey }: { reportKey: HRReportKey }) {
  const { user } = useAuth();
  const report = reportByKey(reportKey);
  const annual = reportKey === 'hr-request-summary-year';
  const allowed = canAccessReportDepartment('HR', user?.departmentShort, user?.role === 'admin');
  const initial = useMemo(initialRange, []);
  const [dateFrom, setDateFrom] = useState(initial.dateFrom);
  const [dateTo, setDateTo] = useState(initial.dateTo);
  const [periodMode, setPeriodMode] = useState<'date' | 'month' | 'year'>('date');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [requestType, setRequestType] = useState('');
  const [validation, setValidation] = useState('');
  const [zoom, setZoom] = useState(100);
  const previewHost = useRef<HTMLDivElement>(null);
  const detailReport = useHRRequestReport(user?.token);
  const yearReport = useHRRequestYearReport(user?.token);
  const current = annual ? yearReport : detailReport;
  const hrMaster = useDeptMasterData(annual ? null : 'hr', user?.token);

  if (!allowed) return <Navigate to="/reports" replace />;

  const search = () => {
    if (annual) {
      if (periodMode === 'date') {
        if (!dateFrom || !dateTo) {
          setValidation('กรุณาระบุวันที่เริ่มต้นและวันที่สิ้นสุด');
          return;
        }
        if (dateTo < dateFrom) {
          setValidation('วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มต้น');
          return;
        }
        setValidation('');
        void yearReport.search({ mode: 'date', dateFrom, dateTo });
        return;
      }
      if (!Number.isInteger(year) || year < 1753 || year > 9998) {
        setValidation('กรุณาระบุปี ค.ศ. ระหว่าง 1753–9998');
        return;
      }
      if (periodMode === 'month' && (!Number.isInteger(month) || month < 1 || month > 12)) {
        setValidation('กรุณาระบุเดือนให้ถูกต้อง');
        return;
      }
      setValidation('');
      void yearReport.search(periodMode === 'month' ? { mode: 'month', year, month } : { mode: 'year', year });
      return;
    }
    if (!dateFrom || !dateTo) {
      setValidation('กรุณาระบุวันที่เริ่มต้นและวันที่สิ้นสุด');
      return;
    }
    if (dateTo < dateFrom) {
      setValidation('วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มต้น');
      return;
    }
    setValidation('');
    void detailReport.search(dateFrom, dateTo, requestType);
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

  return <Layout title={report.title} subtitle="HR Report">
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-gray-200 px-5 py-3 dark:border-slate-700">
        <Link to="/reports" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-slate-500 hover:border-accent hover:text-accent dark:border-slate-700" title="กลับหน้ารายงาน"><IconArrowLeft size={17} /></Link>
        <div><h2 className="text-sm font-bold text-gray-900 dark:text-white">{report.title}</h2><p className="text-[11.5px] text-slate-400">{report.description}</p></div>
      </div>
      <div className="flex shrink-0 flex-wrap items-end gap-3 border-b border-gray-200 bg-slate-50 px-5 py-3 dark:border-slate-700 dark:bg-slate-800/60">
        {annual ? <>
          <label className="w-full sm:w-[190px]"><span className="mb-1.5 block text-[11.5px] font-semibold text-slate-500">รูปแบบช่วงเวลา</span><select value={periodMode} onChange={(event) => { setPeriodMode(event.target.value as 'date' | 'month' | 'year'); setValidation(''); }} className={INPUT}><option value="date">ช่วงวันที่</option><option value="month">รายเดือน</option><option value="year">รายปี</option></select></label>
          {periodMode === 'date' ? <>
            <label className="w-full sm:w-[220px]"><span className="mb-1.5 block text-[11.5px] font-semibold text-slate-500">วันที่เริ่มต้น</span><DateQuickPick value={dateFrom} onChange={(value) => { setDateFrom(value); setValidation(''); }} inputClass={INPUT} showThaiLabel={false} /></label>
            <label className="w-full sm:w-[220px]"><span className="mb-1.5 block text-[11.5px] font-semibold text-slate-500">วันที่สิ้นสุด</span><DateQuickPick value={dateTo} onChange={(value) => { setDateTo(value); setValidation(''); }} inputClass={INPUT} min={dateFrom || undefined} showThaiLabel={false} /></label>
          </> : <>
            <label className="w-full sm:w-[180px]"><span className="mb-1.5 block text-[11.5px] font-semibold text-slate-500">ปี ค.ศ.</span><input type="number" min={1753} max={9998} value={year} onChange={(event) => { setYear(Number(event.target.value)); setValidation(''); }} className={INPUT} /></label>
            {periodMode === 'month' && <label className="w-full sm:w-[180px]"><span className="mb-1.5 block text-[11.5px] font-semibold text-slate-500">เดือน</span><select value={month} onChange={(event) => { setMonth(Number(event.target.value)); setValidation(''); }} className={INPUT}>{['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'].map((label, index) => <option key={label} value={index + 1}>{label}</option>)}</select></label>}
          </>}
        </> : <>
          <label className="w-full sm:w-[240px]"><span className="mb-1.5 block text-[11.5px] font-semibold text-slate-500">วันที่เริ่มต้น</span><DateQuickPick value={dateFrom} onChange={(value) => { setDateFrom(value); setValidation(''); }} inputClass={INPUT} showThaiLabel={false} /></label>
          <label className="w-full sm:w-[240px]"><span className="mb-1.5 block text-[11.5px] font-semibold text-slate-500">วันที่สิ้นสุด</span><DateQuickPick value={dateTo} onChange={(value) => { setDateTo(value); setValidation(''); }} inputClass={INPUT} min={dateFrom || undefined} showThaiLabel={false} /></label>
          <label className="w-full sm:w-[280px]"><span className="mb-1.5 block text-[11.5px] font-semibold text-slate-500">เรื่องที่แจ้ง <span className="font-normal text-slate-400">(ทั้งหมดหากไม่เลือก)</span></span><SearchSelect value={requestType} onChange={(value) => { setRequestType(value); setValidation(''); }} options={hrMaster.requestTypeOptions()} disabled={hrMaster.loading || !!hrMaster.error} placeholder={hrMaster.loading ? 'กำลังโหลดตัวเลือก…' : '-- ทุกเรื่อง --'} ariaLabel="กรองเรื่องที่แจ้ง" /></label>
        </>}
        <button type="button" disabled={current.loading} onClick={search} className="inline-flex h-[38px] items-center gap-2 rounded-lg bg-accent px-4 text-[12.5px] font-semibold text-white disabled:opacity-50">{current.loading ? <IconLoader2 size={16} className="animate-spin" /> : <IconSearch size={16} />}{current.loading ? 'กำลังโหลด…' : 'แสดงรายงาน'}</button>
        {validation && <p className="w-full text-[11.5px] font-semibold text-red-600">{validation}</p>}
        {!annual && hrMaster.error && <p className="w-full text-[11.5px] font-semibold text-red-600">{hrMaster.error} <button type="button" className="underline" onClick={hrMaster.reload}>ลองใหม่</button></p>}
      </div>
      {current.error && <div className="flex shrink-0 items-center gap-2 border-b border-red-200 bg-red-50 px-5 py-2.5 text-[12.5px] font-semibold text-red-700"><IconAlertTriangle size={16} />{current.error}<button type="button" onClick={current.retry} className="ml-auto rounded border border-red-300 px-2.5 py-1 text-[11.5px]">ลองใหม่</button></div>}
      {current.data && current.data.items.length > 0 && <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-gray-200 bg-white px-5 py-2 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center rounded-lg border border-gray-200 dark:border-slate-700">
          <ToolButton title="ย่อ" onClick={() => setSafeZoom(zoom - 10)} disabled={zoom <= 35}><IconZoomOut size={15} /></ToolButton>
          <button type="button" onClick={() => setZoom(100)} className="h-8 min-w-[58px] border-x border-gray-200 px-2 text-[12px] font-semibold text-slate-600">{zoom}%</button>
          <ToolButton title="ขยาย" onClick={() => setSafeZoom(zoom + 10)} disabled={zoom >= 200}><IconZoomIn size={15} /></ToolButton>
        </div>
        <button type="button" onClick={() => fitPreview('page')} className="it-report-tool"><IconArrowsMaximize size={15} />พอดีหน้า</button>
        <button type="button" onClick={() => fitPreview('width')} className="it-report-tool"><IconArrowsHorizontal size={15} />พอดีความกว้าง</button>
        <div className="ml-auto flex gap-2"><button type="button" onClick={() => window.print()} className="it-report-tool"><IconPrinter size={16} />พิมพ์</button><button type="button" onClick={() => window.print()} className="it-report-tool border-accent bg-accent text-white hover:bg-accent/90"><IconFileTypePdf size={16} />PDF</button></div>
      </div>}
      <div ref={previewHost} className="relative min-h-0 flex-1">
        {current.loading ? <ReportState icon={<IconLoader2 size={28} className="animate-spin" />} text="กำลังโหลดรายงาน…" />
          : !current.data ? <ReportState icon={<IconSearch size={32} />} text={annual ? 'เลือกช่วงเวลาแล้วกดแสดงรายงาน' : 'เลือกช่วงวันที่แล้วกดแสดงรายงาน'} />
          : current.data.items.length === 0 ? <ReportState icon={<IconSearch size={32} />} text="ไม่พบข้อมูลในช่วงที่เลือก" />
          : annual ? <HRAnnualPrint data={yearReport.data!} preview zoom={zoom} /> : <HRDetailPrint data={detailReport.data!} preview zoom={zoom} />}
      </div>
    </section>
    {annual && yearReport.data && yearReport.data.items.length > 0 && <HRAnnualPrint data={yearReport.data} />}
    {!annual && detailReport.data && detailReport.data.items.length > 0 && <HRDetailPrint data={detailReport.data} />}
  </Layout>;
}

function ReportState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[13px] font-semibold text-slate-400">{icon}<span>{text}</span></div>;
}

function ToolButton({ title, onClick, disabled, children }: { title: string; onClick: () => void; disabled: boolean; children: React.ReactNode }) {
  return <button type="button" title={title} disabled={disabled} onClick={onClick} className="flex h-8 w-9 items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-30">{children}</button>;
}

function HRHeader({ data, page, totalPages, annual = false }: { data: { dateFrom: string; dateTo: string }; page: number; totalPages: number; annual?: boolean }) {
  const now = new Date();
  return <header className="hr-report-heading">
    <strong>บริษัท บิ๊กเครน แอนด์ อีควิปเม้นท์ เร้นทัลส์ จำกัด</strong>
    <h2>{annual ? 'รายงานสถานะการควบคุมใบรับเรื่อง' : 'ใบรับเรื่อง'} ตั้งแต่วันที่ {displayDate(data.dateFrom)} ถึงวันที่ {displayDate(data.dateTo)}</h2>
    <div>วันที่พิมพ์ {now.toLocaleDateString('en-GB')} &nbsp;&nbsp; Page {page} of {totalPages}</div>
  </header>;
}

function HRDetailPrint({ data, preview = false, zoom = 100 }: { data: HRRequestReport; preview?: boolean; zoom?: number }) {
  const measureRef = useRef<HTMLElement>(null);
  const [pages, setPages] = useState<MeasuredReportPage<HRRequestReportItem>[]>([{ items: data.items, showSummary: true }]);
  const summaries = useMemo(() => detailMatrices(data.items), [data.items]);

  useLayoutEffect(() => {
    const measure = measureRef.current;
    if (!measure) return;
    const style = window.getComputedStyle(measure);
    const contentHeight = measure.clientHeight - parseFloat(style.paddingTop || '0') - parseFloat(style.paddingBottom || '0');
    const headerHeight = measure.querySelector<HTMLElement>('.hr-report-heading')?.getBoundingClientRect().height ?? 0;
    const tableHeaderHeight = measure.querySelector<HTMLElement>('.hr-detail-table thead')?.getBoundingClientRect().height ?? 0;
    const summaryHeight = measure.querySelector<HTMLElement>('.hr-summary-block')?.getBoundingClientRect().height ?? 0;
    const rowHeights = Array.from(measure.querySelectorAll<HTMLElement>('[data-hr-report-row]')).map((row) => row.getBoundingClientRect().height);
    const detailBudget = Math.max(1, contentHeight - headerHeight - tableHeaderHeight - 10);
    setPages(paginateMeasuredRows(data.items, rowHeights, detailBudget, Math.max(1, detailBudget - summaryHeight)));
  }, [data, summaries]);

  return <>
    <div className="hr-report-measure" aria-hidden="true"><article ref={measureRef} className="it-report-print hr-report-print"><HRHeader data={data} page={1} totalPages={1} /><HRDetailTable items={data.items} measure /><div className="hr-summary-block"><HRSummaryBlocks matrices={summaries} /></div></article></div>
    <div className={preview ? 'it-report-preview' : 'print-root'}>{pages.map((page, index) => <article key={index} className="it-report-page it-report-print hr-report-print" style={preview ? { zoom: zoom / 100 } : undefined}>
      <HRHeader data={data} page={index + 1} totalPages={pages.length} />
      {page.items.length > 0 && <HRDetailTable items={page.items} startIndex={pages.slice(0, index).reduce((sum, previous) => sum + previous.items.length, 0)} />}
      {page.showSummary && <div className="hr-summary-block"><HRSummaryBlocks matrices={summaries} /></div>}
    </article>)}</div>
  </>;
}

const DETAIL_WIDTHS = ['3%', '9%', '5%', '3%', '8%', '7%', '5%', '7%', '12%', '8%', '7%', '5%', '5%', '5%', '6%', '5%'];

function HRDetailTable({ items, measure = false, startIndex = 0 }: { items: HRRequestReportItem[]; measure?: boolean; startIndex?: number }) {
  const headers = ['ลำดับ', 'เลขที่เอกสาร', 'วันที่เอกสาร', 'บริษัท', 'ชื่อ-สกุล', 'ตำแหน่ง', 'หน่วยงาน', 'เรื่องที่แจ้ง', 'รายละเอียด', 'ผลการดำเนินการ', 'ผู้ดำเนินการ', 'วันที่ดำเนินการ', 'ผู้ยกเลิก', 'วันที่ยกเลิก', 'หมายเหตุ', 'สถานะ'];
  return <table className="hr-detail-table"><colgroup>{DETAIL_WIDTHS.map((width, index) => <col key={index} style={{ width }} />)}</colgroup><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>
    {items.map((item, index) => <tr key={`${item.docNo}-${index}`} data-hr-report-row={measure ? '' : undefined}><td>{startIndex + index + 1}</td><td>{item.docNo}</td><td>{displayDate(item.docDate)}</td><td>{item.site ?? ''}</td><td>{item.requestBy ?? ''}</td><td>{item.position ?? ''}</td><td>{item.department ?? ''}</td><td>{item.requestType ?? ''}</td><td>{item.requestDetail ?? ''}</td><td>{item.action ?? ''}</td><td>{item.serviceBy ?? ''}</td><td>{displayDate(item.serviceDate)}</td><td>{item.cancelBy ?? ''}</td><td>{displayDate(item.cancelDate)}</td><td>{item.remark ?? ''}</td><td>{item.status ?? ''}</td></tr>)}
  </tbody></table>;
}

function detailMatrices(items: HRRequestReportItem[]) {
  return [
    { title: 'สรุปรายงานเรียงตามเรื่องที่แจ้ง จากสถานะ', matrix: buildHRReportMatrix(items, (item) => item.requestType, (item) => item.status) },
    { title: 'สรุปรายงานเรียงตามเรื่องที่แจ้ง จากแผนก', matrix: buildHRReportMatrix(items, (item) => item.requestType, (item) => item.department) },
    { title: 'สรุปรายงานเรียงตามแผนก จากสถานะ', matrix: buildHRReportMatrix(items, (item) => item.department, (item) => item.status) },
  ];
}

function HRSummaryBlocks({ matrices }: { matrices: { title: string; matrix: HRReportMatrix }[] }) {
  return <>{matrices.map(({ title, matrix }) => <section className="hr-matrix-block" key={title}><h3>{title}</h3><HRMatrixTable matrix={matrix} /></section>)}</>;
}

function HRAnnualPrint({ data, preview = false, zoom = 100 }: { data: HRRequestYearReport; preview?: boolean; zoom?: number }) {
  const columns = useMemo(() => monthsInRange(data.dateFrom, data.dateTo), [data.dateFrom, data.dateTo]);
  const matrices = useMemo(() => [
    { title: 'สรุปรายงานเรียงตามเรื่องที่แจ้ง', matrix: buildHRReportMatrix(data.items, (item) => item.requestType, (item) => monthKeyOf(item.docDate), columns, (item) => 'quantity' in item ? item.quantity : 1) },
    { title: 'สรุปรายงานเรียงตามสถานะ', matrix: buildHRReportMatrix(data.items, (item) => item.status, (item) => monthKeyOf(item.docDate), columns, (item) => 'quantity' in item ? item.quantity : 1) },
    { title: 'สรุปรายงานเรียงตามแผนก', matrix: buildHRReportMatrix(data.items, (item) => item.department, (item) => monthKeyOf(item.docDate), columns, (item) => 'quantity' in item ? item.quantity : 1) },
  ], [columns, data.items]);
  const measureRef = useRef<HTMLElement>(null);
  const [pageGroups, setPageGroups] = useState<number[][]>([[0, 1, 2]]);

  useLayoutEffect(() => {
    const measure = measureRef.current;
    if (!measure) return;
    const style = window.getComputedStyle(measure);
    const budget = measure.clientHeight - parseFloat(style.paddingTop || '0') - parseFloat(style.paddingBottom || '0') - (measure.querySelector<HTMLElement>('.hr-report-heading')?.getBoundingClientRect().height ?? 0) - 10;
    const heights = Array.from(measure.querySelectorAll<HTMLElement>('[data-hr-annual-block]')).map((block) => block.getBoundingClientRect().height);
    const groups: number[][] = [];
    let group: number[] = [];
    let used = 0;
    heights.forEach((height, index) => {
      if (group.length > 0 && used + height > budget) { groups.push(group); group = []; used = 0; }
      group.push(index); used += height;
    });
    if (group.length > 0) groups.push(group);
    setPageGroups(groups.length > 0 ? groups : [[0, 1, 2]]);
  }, [data, matrices]);

  return <>
    <div className="hr-report-measure" aria-hidden="true"><article ref={measureRef} className="it-report-print hr-report-print hr-annual-print"><HRHeader data={data} page={1} totalPages={1} annual />{matrices.map(({ title, matrix }) => <section key={title} data-hr-annual-block className="hr-matrix-block"><h3>{title}</h3><HRMatrixTable matrix={matrix} /></section>)}</article></div>
    <div className={preview ? 'it-report-preview' : 'print-root'}>{pageGroups.map((group, pageIndex) => <article key={pageIndex} className="it-report-page it-report-print hr-report-print hr-annual-print" style={preview ? { zoom: zoom / 100 } : undefined}><HRHeader data={data} page={pageIndex + 1} totalPages={pageGroups.length} annual />{group.map((index) => { const block = matrices[index]; return <section className="hr-matrix-block" key={block.title}><h3>{block.title}</h3><HRMatrixTable matrix={block.matrix} /></section>; })}</article>)}</div>
  </>;
}

function HRMatrixTable({ matrix }: { matrix: HRReportMatrix }) {
  const numericColumnCount = matrix.columns.length + 1;
  const longestLabelLength = Math.max(5, ...matrix.rows.map((row) => Array.from(row).length));
  const labelWidthMm = Math.min(70, Math.max(35, 12 + longestLabelLength * 1.8));
  const tableWidthMm = Math.min(281, labelWidthMm + numericColumnCount * 22);
  const labelWidth = (labelWidthMm / tableWidthMm) * 100;
  const numericWidth = (100 - labelWidth) / numericColumnCount;
  return <table className="hr-matrix-table" style={{ width: `${tableWidthMm}mm` }}><colgroup><col style={{ width: `${labelWidth}%` }} />{Array.from({ length: numericColumnCount }, (_, index) => <col key={index} style={{ width: `${numericWidth}%` }} />)}</colgroup><thead><tr><th aria-label="หัวข้อ" />{matrix.columns.map((column) => <th key={column}>{column}</th>)}<th>Total</th></tr></thead><tbody>
    {matrix.rows.map((row, rowIndex) => <tr key={row}><th>{row}</th>{matrix.values[rowIndex].map((count, columnIndex) => <td key={matrix.columns[columnIndex]}>{count || ''}</td>)}<td>{matrix.rowTotals[rowIndex]}</td></tr>)}
    <tr className="summary"><th>Total</th>{matrix.columnTotals.map((count, index) => <th key={matrix.columns[index]}>{count || ''}</th>)}<th>{matrix.total}</th></tr>
  </tbody></table>;
}
