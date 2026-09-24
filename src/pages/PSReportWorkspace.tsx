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
import { buildPSWeeklyMatrix, PS_MEASURE_META } from '../data/psReportData';
import { MeasuredReportPage, paginateMeasuredRows } from '../data/plReportPagination';
import { PSReportKey, reportByKey } from '../data/reportData';
import { useDepartments } from '../hooks/useDepartments';
import { usePsReportStatuses } from '../hooks/usePsReportStatuses';
import { usePSBalanceReport, usePSBIT60057Report, usePSBIT61091Report, usePSBIT61118Report, usePSBIT63022Report, usePSSummaryReport } from '../hooks/usePSReports';
import {
  PSBalanceItem, PSBIT60057Report, PSBIT61091Item, PSBIT61091Report, PSBIT61118Group,
  PSBIT61118Item, PSBIT61118Report, PSBIT63022Item, PSBIT63022Report, PSReportResponse, PSWeeklyMeasure,
} from '../types/psReport';

const INPUT = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] outline-none transition focus:border-accent dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100';
const ymd = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const displayDate = (value: string | null) => {
  if (!value) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
};
const displayTime = (value: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString('th-TH', { hour12: false });
};
const displayDateTime = (value: string | null) => {
  if (!value) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]} ${match[4]}:${match[5]}` : displayDate(value);
};
const initialRange = () => {
  const today = new Date();
  return { dateFrom: ymd(new Date(today.getFullYear(), today.getMonth(), 1)), dateTo: ymd(today) };
};

export function PSReportWorkspace({ reportKey }: { reportKey: PSReportKey }) {
  const { user } = useAuth();
  const report = reportByKey(reportKey);
  const allowed = user?.role === 'admin' || (user?.departmentShort ?? '').trim().toUpperCase() === 'PS';
  const initial = useMemo(initialRange, []);
  const [dateFrom, setDateFrom] = useState(initial.dateFrom);
  const [dateTo, setDateTo] = useState(initial.dateTo);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [departmentId, setDepartmentId] = useState('');
  const [wfStep, setWfStep] = useState('');
  const [rpId, setRpId] = useState('');
  const [rpDetailId, setRpDetailId] = useState('');
  const [statusMode, setStatusMode] = useState(false);
  const [validation, setValidation] = useState('');
  const [zoom, setZoom] = useState(100);
  const previewHost = useRef<HTMLDivElement>(null);
  const summary = usePSSummaryReport(user?.token);
  const balance = usePSBalanceReport(user?.token);
  const bit60 = usePSBIT60057Report(user?.token);
  const bit61 = usePSBIT61091Report(user?.token);
  const bit63 = usePSBIT63022Report(user?.token);
  const groupBy118 = reportKey === 'ps-bit61-118-department' ? 'department' : reportKey === 'ps-bit61-118-month' ? 'month' : 'quantity';
  const bit118 = usePSBIT61118Report(groupBy118, user?.token);
  const departmentMaster = useDepartments(user?.token);
  const reportStatusMaster = usePsReportStatuses(user?.token);
  const departmentOptions = useMemo(() => departmentMaster.departments.map((department) => ({ value: department.departid, label: department.departmentName, hint: department.departmentShort })), [departmentMaster.departments]);
  const statusOptions = useMemo(() => Array.from(new Map(reportStatusMaster.rows.map((row) => [row.rpId, { value: row.rpId, label: row.rpName || row.rpId }])).values()), [reportStatusMaster.rows]);
  const detailOptions = useMemo(() => Array.from(new Map(reportStatusMaster.rows.filter((row) => !rpId || row.rpId === rpId).flatMap((row) => row.details).map((detail) => [detail.rpDetailId, { value: detail.rpDetailId, label: detail.rpDetailName || detail.rpDetailId }])).values()), [reportStatusMaster.rows, rpId]);
  const is118 = reportKey.startsWith('ps-bit61-118-');
  const active = reportKey === 'ps-summary' ? summary : reportKey === 'ps-balance-form' ? balance : reportKey === 'ps-bit60-057' ? bit60 : reportKey === 'ps-bit61-091' ? bit61 : is118 ? bit118 : bit63;

  if (!allowed) return <Navigate to="/reports" replace />;

  const search = () => {
    if (reportKey === 'ps-balance-form' || reportKey === 'ps-bit60-057') {
      if (!Number.isInteger(year) || year < 1753 || year > 9998 || month < 1 || month > 12) { setValidation('กรุณาระบุเดือนและปี ค.ศ. ให้ถูกต้อง'); return; }
      setValidation('');
      if (reportKey === 'ps-bit60-057') void bit60.search(year, month);
      else void balance.search(year, month);
      return;
    }
    if (reportKey === 'ps-summary') {
      if (!dateFrom || !dateTo) { setValidation('กรุณาระบุวันที่เริ่มต้นและวันที่สิ้นสุด'); return; }
      if (dateTo < dateFrom) { setValidation('วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มต้น'); return; }
      const parsedStep = wfStep.trim() ? Number(wfStep) : undefined;
      if (parsedStep !== undefined && (!Number.isInteger(parsedStep) || parsedStep < 1)) { setValidation('Workflow step ต้องเป็นจำนวนเต็มตั้งแต่ 1 ขึ้นไป'); return; }
      setValidation(''); void summary.search(dateFrom, dateTo, departmentId, parsedStep); return;
    }
    if (reportKey === 'ps-bit61-091' && statusMode) { setValidation(''); void bit61.search(); return; }
    if (!dateFrom || !dateTo) { setValidation('กรุณาระบุวันที่เริ่มต้นและวันที่สิ้นสุด'); return; }
    if (dateTo < dateFrom) { setValidation('วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มต้น'); return; }
    setValidation('');
    if (reportKey === 'ps-bit61-091') void bit61.search(dateFrom, dateTo);
    else if (is118) void bit118.search(dateFrom, dateTo, rpId, rpDetailId);
    else void bit63.search(dateFrom, dateTo);
  };

  const setSafeZoom = (value: number) => setZoom(Math.min(200, Math.max(35, Math.round(value / 5) * 5)));
  const fitPreview = (mode: 'page' | 'width') => {
    const host = previewHost.current;
    if (!host) return;
    const widthRatio = (host.clientWidth - 40) / (297 * 96 / 25.4);
    const heightRatio = (host.clientHeight - 40) / (210 * 96 / 25.4);
    setSafeZoom((mode === 'width' ? widthRatio : Math.min(widthRatio, heightRatio)) * 100);
  };
  const hasData = !!active.data && (active.data.total > 0 || ('step2Items' in active.data && (active.data.step2Items.length > 0 || active.data.step3Items.length > 0)));

  return <Layout title={report.title} subtitle="PS Report">
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-gray-200 px-5 py-3 dark:border-slate-700">
        <Link to="/reports" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-slate-500 hover:border-accent hover:text-accent dark:border-slate-700" title="กลับหน้ารายงาน"><IconArrowLeft size={17} /></Link>
        <div><h2 className="text-sm font-bold text-gray-900 dark:text-white">{report.title}</h2><p className="text-[11.5px] text-slate-400">{report.description}</p></div>
      </div>
      <div className="flex shrink-0 flex-wrap items-end gap-3 border-b border-gray-200 bg-slate-50 px-5 py-3 dark:border-slate-700 dark:bg-slate-800/60">
        {reportKey === 'ps-balance-form' || reportKey === 'ps-bit60-057' ? <>
          <label className="w-[150px]"><span className="mb-1.5 block text-[11.5px] font-semibold text-slate-500">เดือน</span><select value={month} onChange={(event) => setMonth(Number(event.target.value))} className={INPUT}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{String(index + 1).padStart(2, '0')}</option>)}</select></label>
          <label className="w-[170px]"><span className="mb-1.5 block text-[11.5px] font-semibold text-slate-500">ปี ค.ศ.</span><input type="number" value={year} min={1753} max={9998} onChange={(event) => setYear(Number(event.target.value))} className={INPUT} /></label>
        </> : <>
          <label className="w-full sm:w-[220px]"><span className="mb-1.5 block text-[11.5px] font-semibold text-slate-500">วันที่เริ่มต้น</span><DateQuickPick value={dateFrom} onChange={(value) => { setDateFrom(value); setValidation(''); }} inputClass={INPUT} disabled={reportKey === 'ps-bit61-091' && statusMode} showThaiLabel={false} /></label>
          <label className="w-full sm:w-[220px]"><span className="mb-1.5 block text-[11.5px] font-semibold text-slate-500">วันที่สิ้นสุด</span><DateQuickPick value={dateTo} onChange={(value) => { setDateTo(value); setValidation(''); }} inputClass={INPUT} min={dateFrom || undefined} disabled={reportKey === 'ps-bit61-091' && statusMode} showThaiLabel={false} /></label>
          {reportKey === 'ps-summary' && <>
            <label className="w-full sm:w-[260px]"><span className="mb-1.5 block text-[11.5px] font-semibold text-slate-500">แผนก <span className="font-normal text-slate-400">(ทั้งหมดหากไม่เลือก)</span></span><SearchSelect value={departmentId} onChange={(value) => { setDepartmentId(value); setValidation(''); }} options={departmentOptions} disabled={departmentMaster.loading || !!departmentMaster.error} placeholder={departmentMaster.loading ? 'กำลังโหลดแผนก…' : '-- ทุกแผนก --'} ariaLabel="กรองแผนก" /></label>
            <label className="w-full sm:w-[150px]"><span className="mb-1.5 block text-[11.5px] font-semibold text-slate-500">Workflow step</span><input type="number" min={1} value={wfStep} onChange={(event) => { setWfStep(event.target.value); setValidation(''); }} placeholder="ทั้งหมด" className={INPUT} /></label>
          </>}
          {is118 && <>
            <label className="w-full sm:w-[240px]"><span className="mb-1.5 block text-[11.5px] font-semibold text-slate-500">Status <span className="font-normal text-slate-400">(ทั้งหมดหากไม่เลือก)</span></span><SearchSelect value={rpId} onChange={(value) => { setRpId(value); setRpDetailId(''); setValidation(''); }} options={statusOptions} disabled={reportStatusMaster.loading || !!reportStatusMaster.error} placeholder="-- ทุก Status --" ariaLabel="กรอง Status" /></label>
            <label className="w-full sm:w-[260px]"><span className="mb-1.5 block text-[11.5px] font-semibold text-slate-500">Status Detail <span className="font-normal text-slate-400">(ทั้งหมดหากไม่เลือก)</span></span><SearchSelect value={rpDetailId} onChange={(value) => { setRpDetailId(value); setValidation(''); }} options={detailOptions} disabled={reportStatusMaster.loading || !!reportStatusMaster.error} placeholder="-- ทุก Status Detail --" ariaLabel="กรอง Status Detail" /></label>
          </>}
          {reportKey === 'ps-bit61-091' && <label className="mb-2 flex items-center gap-2 text-[12px] font-semibold text-slate-600"><input type="checkbox" checked={statusMode} onChange={(event) => setStatusMode(event.target.checked)} />ดูสถานะทั้งหมด (ไม่กรองวันที่)</label>}
        </>}
        <button type="button" disabled={active.loading} onClick={search} className="inline-flex h-[38px] items-center gap-2 rounded-lg bg-accent px-4 text-[12.5px] font-semibold text-white disabled:opacity-50">{active.loading ? <IconLoader2 size={16} className="animate-spin" /> : <IconSearch size={16} />}{active.loading ? 'กำลังโหลด…' : 'แสดงรายงาน'}</button>
        {validation && <p className="w-full text-[11.5px] font-semibold text-red-600">{validation}</p>}
        {reportKey === 'ps-summary' && departmentMaster.error && <p className="w-full text-[11.5px] font-semibold text-red-600">{departmentMaster.error} <button type="button" className="underline" onClick={departmentMaster.reload}>ลองใหม่</button></p>}
        {is118 && reportStatusMaster.error && <p className="w-full text-[11.5px] font-semibold text-red-600">{reportStatusMaster.error} <button type="button" className="underline" onClick={reportStatusMaster.reload}>ลองใหม่</button></p>}
      </div>
      {active.error && <div className="flex shrink-0 items-center gap-2 border-b border-red-200 bg-red-50 px-5 py-2.5 text-[12.5px] font-semibold text-red-700"><IconAlertTriangle size={16} />{active.error}<button type="button" onClick={active.retry} className="ml-auto rounded border border-red-300 px-2.5 py-1 text-[11.5px]">ลองใหม่</button></div>}
      {hasData && <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-gray-200 bg-white px-5 py-2 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center rounded-lg border border-gray-200 dark:border-slate-700"><ToolButton title="ย่อ" onClick={() => setSafeZoom(zoom - 10)} disabled={zoom <= 35}><IconZoomOut size={15} /></ToolButton><button type="button" onClick={() => setZoom(100)} className="h-8 min-w-[58px] border-x border-gray-200 px-2 text-[12px] font-semibold text-slate-600">{zoom}%</button><ToolButton title="ขยาย" onClick={() => setSafeZoom(zoom + 10)} disabled={zoom >= 200}><IconZoomIn size={15} /></ToolButton></div>
        <button type="button" onClick={() => fitPreview('page')} className="it-report-tool"><IconArrowsMaximize size={15} />พอดีหน้า</button><button type="button" onClick={() => fitPreview('width')} className="it-report-tool"><IconArrowsHorizontal size={15} />พอดีความกว้าง</button>
        <div className="ml-auto flex gap-2"><button type="button" onClick={() => window.print()} className="it-report-tool"><IconPrinter size={16} />พิมพ์</button><button type="button" onClick={() => window.print()} className="it-report-tool border-accent bg-accent text-white hover:bg-accent/90"><IconFileTypePdf size={16} />PDF</button></div>
      </div>}
      <div ref={previewHost} className="relative min-h-0 flex-1">{active.loading ? <ReportState icon={<IconLoader2 size={28} className="animate-spin" />} text="กำลังโหลดรายงาน…" /> : !active.data ? <ReportState icon={<IconSearch size={32} />} text="เลือกตัวกรองแล้วกดแสดงรายงาน" /> : !hasData ? <ReportState icon={<IconSearch size={32} />} text="ไม่พบข้อมูลในช่วงที่เลือก" /> : reportKey === 'ps-summary' ? <PSSummaryPrint data={summary.data!} preview zoom={zoom} /> : reportKey === 'ps-balance-form' ? <PSBalancePrint data={balance.data!} preview zoom={zoom} /> : reportKey === 'ps-bit60-057' ? <PSBIT60057Print data={bit60.data!} preview zoom={zoom} /> : reportKey === 'ps-bit61-091' ? <PSBIT61Print data={bit61.data!} preview zoom={zoom} /> : is118 ? <PSBIT61118Print data={bit118.data!} preview zoom={zoom} /> : <PSBIT63Print data={bit63.data!} preview zoom={zoom} />}</div>
    </section>
    {reportKey === 'ps-summary' && summary.data && summary.data.items.length > 0 && <PSSummaryPrint data={summary.data} />}
    {reportKey === 'ps-balance-form' && balance.data && balance.data.items.length > 0 && <PSBalancePrint data={balance.data} />}
    {reportKey === 'ps-bit60-057' && bit60.data && bit60.data.items.length > 0 && <PSBIT60057Print data={bit60.data} />}
    {reportKey === 'ps-bit61-091' && bit61.data && bit61.data.total > 0 && <PSBIT61Print data={bit61.data} />}
    {is118 && bit118.data && bit118.data.total > 0 && <PSBIT61118Print data={bit118.data} />}
    {reportKey === 'ps-bit63-022' && bit63.data && bit63.data.items.length > 0 && <PSBIT63Print data={bit63.data} />}
  </Layout>;
}

function ReportState({ icon, text }: { icon: React.ReactNode; text: string }) { return <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[13px] font-semibold text-slate-400">{icon}<span>{text}</span></div>; }
function ToolButton({ title, onClick, disabled, children }: { title: string; onClick: () => void; disabled: boolean; children: React.ReactNode }) { return <button type="button" title={title} disabled={disabled} onClick={onClick} className="flex h-8 w-9 items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-30">{children}</button>; }

function PSHeader({ title, dateFrom, dateTo, page, totalPages }: { title: string; dateFrom: string | null; dateTo: string | null; page: number; totalPages: number }) {
  const now = new Date();
  return <header className="ps-report-heading"><strong>บริษัท บิ๊กเครน แอนด์ อีควิปเม้นท์ เร้นทัลส์ จำกัด</strong><h2>{title}</h2>{dateFrom && dateTo && <h3>ตั้งแต่วันที่ {displayDate(dateFrom)} ถึงวันที่ {displayDate(dateTo)}</h3>}<div>วันที่พิมพ์ {now.toLocaleDateString('en-GB')} &nbsp; Page {page} of {totalPages}</div></header>;
}

function measurePages<T>(measure: HTMLElement, items: T[], rowSelector: string, headerSelector: string): MeasuredReportPage<T>[] {
  const style = window.getComputedStyle(measure);
  const contentHeight = measure.clientHeight - parseFloat(style.paddingTop || '0') - parseFloat(style.paddingBottom || '0');
  const heading = measure.querySelector<HTMLElement>('.ps-report-heading')?.getBoundingClientRect().height ?? 0;
  const tableHead = measure.querySelector<HTMLElement>(headerSelector)?.getBoundingClientRect().height ?? 0;
  const rows = Array.from(measure.querySelectorAll<HTMLElement>(rowSelector)).map((row) => row.getBoundingClientRect().height);
  const budget = Math.max(1, contentHeight - heading - tableHead - 18);
  return paginateMeasuredRows(items, rows, budget, budget);
}

function PSSummaryPrint({ data, preview = false, zoom = 100 }: { data: PSReportResponse<PSBalanceItem>; preview?: boolean; zoom?: number }) {
  const measureRef = useRef<HTMLElement>(null);
  const [pages, setPages] = useState<MeasuredReportPage<PSBalanceItem>[]>([{ items: data.items, showSummary: false }]);
  useLayoutEffect(() => { if (measureRef.current) setPages(measurePages(measureRef.current, data.items, '[data-ps-summary-row]', '.ps-summary-table thead')); }, [data]);
  const header = (page: number, totalPages: number) => <header className="ps-report-heading ps-summary-heading"><div>วันที่พิมพ์ {new Date().toLocaleDateString('en-GB')} &nbsp;&nbsp; Page {page} of {totalPages}</div></header>;
  return <><div className="ps-report-measure" aria-hidden="true"><article ref={measureRef} className="it-report-print ps-report-print ps-summary-print">{header(1, 1)}<PSSummaryTable items={data.items} measure /></article></div><div className={preview ? 'it-report-preview' : 'print-root'}>{pages.map((page, index) => <article key={index} className="it-report-page it-report-print ps-report-print ps-summary-print" style={preview ? { zoom: zoom / 100 } : undefined}>{header(index + 1, pages.length)}<PSSummaryTable items={page.items} /></article>)}</div></>;
}

function PSSummaryTable({ items, measure = false }: { items: PSBalanceItem[]; measure?: boolean }) {
  const headers = ['เลขที่ใบขอราคา', 'วันที่และเวลา', 'ประเภทลูกค้า', 'เรื่องที่แจ้ง', 'รายละเอียดเรื่องที่แจ้ง', 'กำหนดเสร็จ', 'ผู้แจ้งเรื่อง', 'หน่วยงาน', 'สถานะ', 'การอนุมัติ', 'ผู้อนุมัติ', 'อนุมัติวันที่และเวลา', 'วันที่ดำเนินการ', 'หมายเหตุ'];
  return <table className="ps-summary-table"><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{items.map((item, index) => <tr key={`${item.docNo}-${index}`} data-ps-summary-row={measure ? '' : undefined}><td>{item.docNo}</td><td>{displayDateTime(item.docDate)}</td><td>{item.type ?? ''}</td><td>{item.requestType ?? ''}</td><td>{item.requestDetail ?? ''}</td><td>{displayDate(item.planDate)}</td><td>{item.requestBy ?? ''}</td><td>{item.department ?? ''}</td><td>{item.jobStatus ?? ''}</td><td>{item.description ?? ''}</td><td>{item.cancelBy ?? item.serviceBy ?? ''}</td><td>{displayDateTime(item.cancelDate)}</td><td>{displayDateTime(item.serviceDate)}</td><td>{item.remark ?? ''}</td></tr>)}</tbody></table>;
}

function PSBalancePrint({ data, preview = false, zoom = 100 }: { data: PSReportResponse<PSBalanceItem>; preview?: boolean; zoom?: number }) {
  const measureRef = useRef<HTMLElement>(null);
  const [pages, setPages] = useState<MeasuredReportPage<PSBalanceItem>[]>([{ items: data.items, showSummary: false }]);
  useLayoutEffect(() => { if (measureRef.current) setPages(measurePages(measureRef.current, data.items, '[data-ps-balance-row]', '.ps-balance-table thead')); }, [data]);
  return <><div className="ps-report-measure" aria-hidden="true"><article ref={measureRef} className="it-report-print ps-report-print"><PSHeader title="ใบรับเรื่องขอราคาประจำเดือน" dateFrom={data.dateFrom} dateTo={data.dateTo} page={1} totalPages={1} /><PSBalanceTable items={data.items} measure /></article></div><div className={preview ? 'it-report-preview' : 'print-root'}>{pages.map((page, index) => <article key={index} className="it-report-page it-report-print ps-report-print" style={preview ? { zoom: zoom / 100 } : undefined}><PSHeader title="ใบรับเรื่องขอราคาประจำเดือน" dateFrom={data.dateFrom} dateTo={data.dateTo} page={index + 1} totalPages={pages.length} /><PSBalanceTable items={page.items} startIndex={pages.slice(0, index).reduce((sum, value) => sum + value.items.length, 0)} /></article>)}</div></>;
}

function PSBalanceTable({ items, measure = false, startIndex = 0 }: { items: PSBalanceItem[]; measure?: boolean; startIndex?: number }) {
  const headers = ['ลำดับ', 'เลขที่ใบรับเรื่อง', 'วันที่', 'ประเภท', 'เรื่องที่แจ้ง', 'รายละเอียดเรื่องที่แจ้ง', 'ผู้แจ้งเรื่อง', 'หน่วยงาน', 'วันที่ต้องการใบขอราคา', 'กำหนดส่งคืนใบขอราคา', 'Remark'];
  return <table className="ps-balance-table"><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{items.map((item, index) => <tr key={`${item.docNo}-${index}`} data-ps-balance-row={measure ? '' : undefined}><td>{startIndex + index + 1}</td><td>{item.docNo}</td><td>{displayDate(item.docDate)}</td><td>{item.type ?? ''}</td><td>{item.requestType ?? ''}</td><td>{item.requestDetail ?? ''}</td><td>{item.requestBy ?? ''}</td><td>{item.department ?? ''}</td><td>{displayDate(item.requestDate)}</td><td>{displayDate(item.planDate)}</td><td>{item.remark ?? ''}</td></tr>)}</tbody></table>;
}

function PSBIT60057Print({ data, preview = false, zoom = 100 }: { data: PSBIT60057Report; preview?: boolean; zoom?: number }) {
  const measureRef = useRef<HTMLElement>(null);
  const [pages, setPages] = useState<MeasuredReportPage<PSBalanceItem>[]>([{ items: data.items, showSummary: true }]);
  useLayoutEffect(() => {
    const measure = measureRef.current; if (!measure) return;
    const style = window.getComputedStyle(measure);
    const contentHeight = measure.clientHeight - parseFloat(style.paddingTop || '0') - parseFloat(style.paddingBottom || '0');
    const fixedHeight = (measure.querySelector<HTMLElement>('.ps-bit60-heading')?.getBoundingClientRect().height ?? 0) + (measure.querySelector<HTMLElement>('.ps-bit60-summary')?.getBoundingClientRect().height ?? 0) + (measure.querySelector<HTMLElement>('.ps-bit60-detail thead')?.getBoundingClientRect().height ?? 0) + 12;
    const signatureHeight = measure.querySelector<HTMLElement>('.ps-bit60-signatures')?.getBoundingClientRect().height ?? 0;
    const rowHeights = Array.from(measure.querySelectorAll<HTMLElement>('[data-ps-bit60-row]')).map((row) => row.getBoundingClientRect().height);
    const budget = Math.max(1, contentHeight - fixedHeight);
    setPages(paginateMeasuredRows(data.items, rowHeights, budget, Math.max(1, budget - signatureHeight)));
  }, [data]);
  const monthLabel = new Date(`${data.dateFrom}T00:00:00`).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
  const heading = (page: number, total: number) => <header className="ps-bit60-heading"><strong>รายงานการขอราคาเดือน {monthLabel}</strong><b>ข้อมูลตั้งแต่วันที่ {displayDate(data.dateFrom)} - {displayDate(data.dateTo)}</b><div>พิมพ์วันที่ {new Date().toLocaleDateString('en-GB')} &nbsp;&nbsp; Page {page} of {total}</div></header>;
  return <><div className="ps-report-measure" aria-hidden="true"><article ref={measureRef} className="it-report-print ps-report-print ps-bit60-print">{heading(1, 1)}<PSBIT60057Summary data={data} /><PSBIT60057Table items={data.items} measure /><PSBIT60057Signatures /></article></div><div className={preview ? 'it-report-preview' : 'print-root'}>{pages.map((page, index) => <article key={index} className="it-report-page it-report-print ps-report-print ps-bit60-print" style={preview ? { zoom: zoom / 100 } : undefined}>{heading(index + 1, pages.length)}<PSBIT60057Summary data={data} /><PSBIT60057Table items={page.items} />{page.showSummary && <PSBIT60057Signatures />}</article>)}</div></>;
}

function PSBIT60057Summary({ data }: { data: PSBIT60057Report }) {
  const closers = Array.from(data.items.filter((item) => item.jobStatus === 4).reduce((map, item) => { const key = item.serviceBy?.trim() || 'ไม่ระบุ'; map.set(key, (map.get(key) ?? 0) + 1); return map; }, new Map<string, number>()).entries());
  const departments = Array.from(new Set(data.breakdown.map((row) => row.department?.trim() || 'ไม่ระบุ'))).sort((a, b) => a.localeCompare(b, 'th'));
  const categories = Array.from(new Map(data.breakdown.map((row) => [row.category, row.categoryName])).entries()).sort((a, b) => a[0] - b[0]);
  const quantity = (department: string, category: number) => data.breakdown.find((row) => (row.department?.trim() || 'ไม่ระบุ') === department && row.category === category)?.quantity ?? 0;
  return <section className="ps-bit60-summary"><table className="ps-bit60-closers"><thead><tr><th>ผู้ปิด Job</th><th>จำนวนปิด Job ประจำเดือน</th></tr></thead><tbody>{closers.map(([name, count]) => <tr key={name}><td>{name}</td><td>{count}</td></tr>)}<tr><th>รวม</th><th>{closers.reduce((sum, row) => sum + row[1], 0)}</th></tr></tbody></table><table className="ps-bit60-pivot"><thead><tr><th>จำนวนรายการที่แจ้งขอราคา</th>{categories.map(([category, name]) => <th key={category}>{name}</th>)}</tr></thead><tbody>{departments.map((department) => <tr key={department}><th>{department}</th>{categories.map(([category]) => <td key={category}>{quantity(department, category)}</td>)}</tr>)}<tr><th>รวม</th>{categories.map(([category]) => <th key={category}>{departments.reduce((sum, department) => sum + quantity(department, category), 0)}</th>)}</tr></tbody></table></section>;
}

function PSBIT60057Table({ items, measure = false }: { items: PSBalanceItem[]; measure?: boolean }) {
  const headers = ['เลขที่ใบขอราคา', 'วันที่', 'ประเภท', 'เรื่องที่แจ้ง', 'รายละเอียดเรื่องที่แจ้ง', 'วันที่ต้องการใช้งาน', 'ผู้แจ้งเรื่อง', 'หน่วยงาน', 'Step', 'สถานะ', 'การอนุมัติ', 'วันที่ปิดงาน', 'ผู้ปิดงาน', 'ระยะเวลาดำเนินการ', 'หมายเหตุ'];
  return <table className="ps-bit60-detail"><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{items.map((item, index) => <tr key={`${item.docNo}-${index}`} data-ps-bit60-row={measure ? '' : undefined}><td>{item.docNo}</td><td>{displayDate(item.docDate)}</td><td>{item.type ?? ''}</td><td>{item.requestType ?? ''}</td><td>{item.requestDetail ?? ''}</td><td>{displayDate(item.planDate)}</td><td>{item.requestBy ?? ''}</td><td>{item.department ?? ''}</td><td>{item.wfStep ?? ''}</td><td>{item.jobStatus ?? ''}</td><td>{item.description ?? item.jobStatusName}</td><td>{displayDate(item.serviceDate)}</td><td>{item.serviceBy ?? ''}</td><td></td><td>{item.remark ?? ''}</td></tr>)}</tbody></table>;
}

function PSBIT60057Signatures() { return <div className="ps-bit60-signatures">{['ผู้จัดทำ', 'ผู้ตรวจสอบ', 'ผู้อนุมัติ'].map((label) => <section key={label}><strong>{label}</strong><span></span></section>)}</div>; }

interface PS118MatrixRow { rpName: string; detail: string; values: number[]; total: number; }
interface PS118Matrix { columns: string[]; rows: PS118MatrixRow[]; totals: number[]; total: number; }
function buildPS118Matrix(data: PSBIT61118Report): PS118Matrix {
  const columnOf = (group: PSBIT61118Group) => data.groupBy === 'quantity' ? 'QTY' : data.groupBy === 'department' ? group.department?.trim() || 'ไม่ระบุ' : `${String(group.month ?? 0).padStart(2, '0')}/${group.year ?? ''}`;
  const columns = Array.from(new Set(data.groups.map(columnOf))).sort((a, b) => data.groupBy === 'month' ? a.slice(3).localeCompare(b.slice(3)) || a.slice(0, 2).localeCompare(b.slice(0, 2)) : a.localeCompare(b, 'th'));
  const rowKeys = Array.from(new Set(data.groups.map((group) => `${group.rpName ?? 'ไม่ระบุ'}\u0000${group.rpDetailName ?? 'ไม่ระบุ'}`))).sort((a, b) => a.localeCompare(b, 'th'));
  const rows = rowKeys.map((key) => { const [rpName, detail] = key.split('\u0000'); const values = columns.map((column) => data.groups.filter((group) => `${group.rpName ?? 'ไม่ระบุ'}\u0000${group.rpDetailName ?? 'ไม่ระบุ'}` === key && columnOf(group) === column).reduce((sum, group) => sum + group.quantity, 0)); return { rpName, detail, values, total: values.reduce((sum, value) => sum + value, 0) }; });
  const totals = columns.map((_, index) => rows.reduce((sum, row) => sum + row.values[index], 0));
  return { columns, rows, totals, total: rows.reduce((sum, row) => sum + row.total, 0) };
}

function PSBIT61118Print({ data, preview = false, zoom = 100 }: { data: PSBIT61118Report; preview?: boolean; zoom?: number }) {
  const matrix = useMemo(() => buildPS118Matrix(data), [data]);
  const measureRef = useRef<HTMLElement>(null);
  const [pages, setPages] = useState<MeasuredReportPage<PSBIT61118Item>[]>([{ items: data.items, showSummary: true }]);
  useLayoutEffect(() => {
    if (data.groupBy !== 'department') { setPages([{ items: [], showSummary: true }]); return; }
    const measure = measureRef.current; if (!measure) return;
    const style = window.getComputedStyle(measure);
    const contentHeight = measure.clientHeight - parseFloat(style.paddingTop || '0') - parseFloat(style.paddingBottom || '0');
    const heading = measure.querySelector<HTMLElement>('.ps-118-heading')?.getBoundingClientRect().height ?? 0;
    const tableHead = measure.querySelector<HTMLElement>('.ps-118-detail thead')?.getBoundingClientRect().height ?? 0;
    const summary = measure.querySelector<HTMLElement>('.ps-118-summary-block')?.getBoundingClientRect().height ?? 0;
    const rowHeights = Array.from(measure.querySelectorAll<HTMLElement>('[data-ps-118-row]')).map((row) => row.getBoundingClientRect().height);
    const budget = Math.max(1, contentHeight - heading - tableHead - 12);
    setPages(paginateMeasuredRows(data.items, rowHeights, budget, Math.max(1, budget - summary)));
  }, [data, matrix]);
  return <><div className="ps-report-measure" aria-hidden="true"><article ref={measureRef} className="it-report-print ps-report-print ps-118-print"><PS118Header data={data} page={1} totalPages={1} />{data.groupBy === 'department' && <PS118DetailTable items={data.items} measure />}<div className="ps-118-summary-block"><PS118MatrixTable data={data} matrix={matrix} /></div></article></div><div className={preview ? 'it-report-preview' : 'print-root'}>{pages.map((page, index) => <article key={index} className="it-report-page it-report-print ps-report-print ps-118-print" style={preview ? { zoom: zoom / 100 } : undefined}><PS118Header data={data} page={index + 1} totalPages={pages.length} />{data.groupBy === 'department' && page.items.length > 0 && <PS118DetailTable items={page.items} />}{page.showSummary && <div className="ps-118-summary-block"><PS118MatrixTable data={data} matrix={matrix} /></div>}</article>)}</div></>;
}

function PS118Header({ data, page, totalPages }: { data: PSBIT61118Report; page: number; totalPages: number }) {
  const status = data.rpId ? data.groups[0]?.rpName ?? data.rpId : 'All';
  const detail = data.rpDetailId ? data.groups[0]?.rpDetailName ?? data.rpDetailId : 'All';
  const title = data.groupBy === 'quantity' ? 'รายงานใบขอราคา แยกตามสถานะ' : data.groupBy === 'department' ? 'รายงานใบขอราคา แยกตามแผนก' : 'รายงานใบขอราคา แยกตามเดือน';
  return <header className="ps-118-heading"><strong>บริษัท บิ๊กเครน แอนด์ อีควิปเม้นท์ เร้นทัลส์ จำกัด</strong><h2>{title} ตั้งแต่วันที่ {displayDate(data.dateFrom)} - {displayDate(data.dateTo)}</h2><b>Status : {status}</b><span>Status Detail : {detail}</span><div>พิมพ์วันที่ {new Date().toLocaleDateString('en-GB')} &nbsp;&nbsp; Page {page} of {totalPages}</div></header>;
}

function PS118DetailTable({ items, measure = false }: { items: PSBIT61118Item[]; measure?: boolean }) {
  const headers = ['เลขที่ใบขอราคา', 'วันที่ขอราคา', 'เลขที่ใบประเมิน', 'วันที่ใบประเมิน', 'หมายเลขเครื่องจักร', 'เรื่องที่แจ้ง', 'วันที่ต้องการใช้งาน', 'ผู้แจ้งเรื่อง', 'แผนก', 'วันที่รับเรื่อง', 'วันที่เลื่อน', 'สาเหตุที่เลื่อน', 'Status โปรแกรม', 'Status งานค้าง', 'วันที่ปิดงาน'];
  return <table className="ps-118-detail"><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{items.map((item, index) => <tr key={`${item.docNo}-${index}`} data-ps-118-row={measure ? '' : undefined}><td>{item.docNo}</td><td>{displayDate(item.docDate)}</td><td>{item.prelimId ?? ''}</td><td>{displayDate(item.prelimDate)}</td><td>{item.prelimCarId ?? ''}</td><td>{item.requestDetail ?? item.groupName ?? ''}</td><td>{displayDate(item.planDate)}</td><td>{item.requestBy ?? ''}</td><td>{item.department ?? ''}</td><td>{displayDate(item.approveDate)}</td><td>{displayDate(item.changeDate)}</td><td>{item.wrDetail ?? ''}</td><td>{item.rpName}</td><td>{item.rpDetailName ?? ''}</td><td>{displayDate(item.serviceDate)}</td></tr>)}</tbody></table>;
}

function PS118MatrixTable({ data, matrix }: { data: PSBIT61118Report; matrix: PS118Matrix }) {
  const spanOf = (index: number) => { let count = 1; while (matrix.rows[index + count]?.rpName === matrix.rows[index].rpName) count += 1; return count; };
  return <table className="ps-118-matrix"><thead>{data.groupBy === 'month' ? <><tr><th rowSpan={2} /><th rowSpan={2} />{Array.from(new Set(matrix.columns.map((column) => column.slice(3)))).map((year) => <th key={year} colSpan={matrix.columns.filter((column) => column.slice(3) === year).length}>{year}</th>)}<th rowSpan={2}>Total</th></tr><tr>{matrix.columns.map((column) => <th key={column}>{column}</th>)}</tr></> : <tr><th /><th />{matrix.columns.map((column) => <th key={column}>{column}</th>)}<th>Total</th></tr>}</thead><tbody>{matrix.rows.map((row, index) => <tr key={`${row.rpName}/${row.detail}`}>{(index === 0 || matrix.rows[index - 1].rpName !== row.rpName) && <th rowSpan={spanOf(index)}>{row.rpName}</th>}<th>{row.detail}</th>{row.values.map((value, column) => <td key={matrix.columns[column]}>{value || ''}</td>)}<td>{row.total}</td></tr>)}<tr className="summary"><th colSpan={2}>Total</th>{matrix.totals.map((value, index) => <th key={matrix.columns[index]}>{value || ''}</th>)}<th>{matrix.total}</th></tr></tbody></table>;
}

interface PSBIT61Page { title: string; items: PSBIT61091Item[]; startIndex: number; }
function PSBIT61Print({ data, preview = false, zoom = 100 }: { data: PSBIT61091Report; preview?: boolean; zoom?: number }) {
  const measureRef = useRef<HTMLElement>(null);
  const [pages, setPages] = useState<PSBIT61Page[]>([]);
  useLayoutEffect(() => {
    const measure = measureRef.current; if (!measure) return;
    const make = (items: PSBIT61091Item[], selector: string, title: string) => {
      const split = measurePages(measure, items, selector, '.ps-bit61-table thead');
      let offset = 0; return split.map((page) => { const result = { title, items: page.items, startIndex: offset }; offset += page.items.length; return result; });
    };
    setPages([...make(data.step2Items, '[data-ps-step2-row]', 'รายงานการขอราคา - ขั้นรับเรื่อง'), ...make(data.step3Items, '[data-ps-step3-row]', 'รายงานสะท้อนคำขอราคา - ขั้นปิดงาน')]);
  }, [data]);
  const shownPages = pages.length ? pages : [{ title: 'รายงานการขอราคา', items: [], startIndex: 0 }];
  return <><div className="ps-report-measure" aria-hidden="true"><article ref={measureRef} className="it-report-print ps-report-print"><PSHeader title="รายงานการขอมาตรฐานขอราคา" dateFrom={data.dateFrom} dateTo={data.dateTo} page={1} totalPages={1} /><PSBIT61Table items={data.step2Items} measureAttr="data-ps-step2-row" /><PSBIT61Table items={data.step3Items} measureAttr="data-ps-step3-row" /></article></div><div className={preview ? 'it-report-preview' : 'print-root'}>{shownPages.map((page, index) => <article key={index} className="it-report-page it-report-print ps-report-print ps-bit61-print" style={preview ? { zoom: zoom / 100 } : undefined}><PSHeader title="รายงานการขอมาตรฐานขอราคา" dateFrom={data.dateFrom} dateTo={data.dateTo} page={index + 1} totalPages={shownPages.length} /><h3 className="ps-section-title">{page.title}</h3><PSBIT61Table items={page.items} startIndex={page.startIndex} /></article>)}</div></>;
}

function PSBIT61Table({ items, startIndex = 0, measureAttr }: { items: PSBIT61091Item[]; startIndex?: number; measureAttr?: string }) {
  const headers = ['ลำดับ', 'เลขที่งานซ่อม', 'เบอร์รถ', 'ประเภทช่าง', 'เลขที่ใบขอราคา', 'วันที่ส่งคำขอ', 'วันที่รับเรื่อง', 'เวลารับเรื่อง', 'รายละเอียดที่ขอราคา', 'ผลตามมาตรฐาน', 'จำนวนวัน', 'แผนก', 'หมายเหตุ'];
  return <table className="ps-bit61-table"><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{items.map((item, index) => <tr key={`${item.docNo}-${index}`} {...(measureAttr ? { [measureAttr]: '' } : {})}><td>{startIndex + index + 1}</td><td>{item.prelimId ?? ''}</td><td>{item.prelimCarId ?? ''}</td><td>{item.groupName ?? ''}</td><td>{item.docNo}</td><td>{displayDate(item.docTime)}</td><td>{displayDate(item.psApprove)}</td><td>{displayTime(item.psApprove)}</td><td>{item.requestDetail ?? ''}</td><td>{item.leadTime == null ? '' : item.leadTime <= 3 ? 'ตามมาตรฐาน' : 'เกินมาตรฐาน'}</td><td>{item.leadTime ?? ''}</td><td>{item.department ?? ''}</td><td>{item.remark ?? ''}</td></tr>)}</tbody></table>;
}

function PSBIT63Print({ data, preview = false, zoom = 100 }: { data: PSBIT63022Report; preview?: boolean; zoom?: number }) {
  const measureRef = useRef<HTMLElement>(null);
  const [detailPages, setDetailPages] = useState<MeasuredReportPage<PSBIT63022Item>[]>([{ items: data.items, showSummary: false }]);
  useLayoutEffect(() => { if (measureRef.current) setDetailPages(measurePages(measureRef.current, data.items, '[data-ps-bit63-row]', '.ps-bit63-table thead')); }, [data]);
  const totalPages = 1 + detailPages.length;
  return <><div className="ps-report-measure" aria-hidden="true"><article ref={measureRef} className="it-report-print ps-report-print"><PSHeader title="รายงานการขอราคา" dateFrom={data.dateFrom} dateTo={data.dateTo} page={1} totalPages={1} /><PSBIT63Table items={data.items} measure /></article></div><div className={preview ? 'it-report-preview' : 'print-root'}><article className="it-report-page it-report-print ps-report-print ps-weekly-print" style={preview ? { zoom: zoom / 100 } : undefined}><PSHeader title="รายงานการขอราคา" dateFrom={data.dateFrom} dateTo={data.dateTo} page={1} totalPages={totalPages} /><h3 className="ps-section-title">รายงานสถานะขอราคาแยกตาม Week</h3><PSWeeklySummary data={data} /></article>{detailPages.map((page, index) => <article key={index} className="it-report-page it-report-print ps-report-print ps-bit63-print" style={preview ? { zoom: zoom / 100 } : undefined}><PSHeader title="รายงานการขอราคา" dateFrom={data.dateFrom} dateTo={data.dateTo} page={index + 2} totalPages={totalPages} /><h3 className="ps-section-title">รายงานรายละเอียดขอราคา</h3><PSBIT63Table items={page.items} startIndex={detailPages.slice(0, index).reduce((sum, value) => sum + value.items.length, 0)} /></article>)}</div></>;
}

function PSWeeklySummary({ data }: { data: PSBIT63022Report }) {
  const measures: PSWeeklyMeasure[] = ['standard', 'required-date', 'quote-result', 'plan-date'];
  return <div className="ps-weekly-grid">{measures.map((measure) => { const matrix = buildPSWeeklyMatrix(data.weekly, measure); return <section key={measure}><h4>{PS_MEASURE_META[measure].title}</h4><table><thead><tr><th>ผลการวัด</th>{matrix.weeks.map((week) => <th key={week}>W{week}<br />รายการ / %</th>)}<th>Total<br />รายการ / %</th></tr></thead><tbody>{matrix.results.map((result) => { const rows = matrix.weeks.map((week) => matrix.cells[`${week}\u0000${result}`]); const quantity = rows.reduce((sum, row) => sum + (row?.quantity ?? 0), 0); return <tr key={result}><th>{result}</th>{rows.map((row, index) => <td key={matrix.weeks[index]}>{row ? `${row.quantity} / ${row.percent.toFixed(2)}%` : ''}</td>)}<td>{quantity} / {data.total ? (quantity * 100 / data.total).toFixed(2) : '0.00'}%</td></tr>; })}<tr className="summary"><th>รวม</th>{matrix.weeks.map((week) => { const total = data.weekly.find((row) => row.measure === measure && row.weekNumber === week)?.total ?? 0; return <th key={week}>{total} / {total ? '100.00' : '0.00'}%</th>; })}<th>{data.total} / {data.total ? '100.00' : '0.00'}%</th></tr></tbody></table></section>; })}</div>;
}

function PSBIT63Table({ items, measure = false, startIndex = 0 }: { items: PSBIT63022Item[]; measure?: boolean; startIndex?: number }) {
  const headers = ['ลำดับ', 'วัน/เดือน/ปี', 'เลขที่ใบขอราคา', 'วันที่ต้องการราคา', 'Plan วันที่ต้องการราคา', 'วันที่เหลือจาก Plan', 'เลขที่งานซ่อม', 'เบอร์รถ', 'ประเภทช่าง', 'แผนก', 'รายละเอียดที่ขอราคา', 'วันที่รับเรื่อง', 'วันที่ได้ราคา', 'Status ค้างส่งราคา', 'ตามหรือเกินมาตรฐาน', 'จำนวนวัน', 'Status งานค้าง', 'ชื่อ Supplier', 'ระยะเวลาจัดส่ง'];
  return <table className="ps-bit63-table"><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{items.map((item, index) => <tr key={`${item.docNo}-${index}`} data-ps-bit63-row={measure ? '' : undefined}><td>{startIndex + index + 1}</td><td>{displayDate(item.docDate)}</td><td>{item.docNo}</td><td>{displayDate(item.priceDate)}</td><td>{displayDate(item.planPrice)}</td><td>{item.planVarianceDays}</td><td>{item.prelimId ?? ''}</td><td>{item.prelimCarId ?? ''}</td><td>{item.groupName ?? ''}</td><td>{item.department ?? ''}</td><td>{item.requestDetail ?? ''}</td><td>{displayDate(item.approveDateStep2)}</td><td>{displayDate(item.approveDateStep3)}</td><td>{item.quoteStatus}</td><td>{item.standardStatus}</td><td>{item.sendLeadTimeDays}</td><td>{item.requiredDateStatus}</td><td>{item.supplier ?? ''}</td><td>{item.requiredDateVarianceDays}</td></tr>)}</tbody></table>;
}
