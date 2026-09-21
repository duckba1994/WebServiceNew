import React, { useMemo, useRef, useState } from 'react';
import {
  IconAlertTriangle, IconArrowLeft, IconArrowsHorizontal, IconArrowsMaximize,
  IconChartBar, IconClipboardList, IconFileSpreadsheet, IconLoader2, IconPrinter,
  IconSearch, IconZoomIn, IconZoomOut,
} from '@tabler/icons-react';
import { Link, Navigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { DateQuickPick } from '../components/ui/DateQuickPick';
import { useAuth } from '../context/AuthContext';
import { reportByKey, ReportKey, REPORTS } from '../data/reportData';
import { useItReport } from '../hooks/useItReport';
import {
  DateRangeReport, ITServiceFormSummaryItem, ITSurveySummaryItem,
} from '../types/itReport';
import logo from '../assets/BCLogo.png';
import { exportServiceReport, exportSurveyReport } from '../utils/itReportExport';

const INPUT = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] outline-none transition focus:border-accent dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100';

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

const formatDateTime = (value: string | null): string => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });
};

const formatDate = (value: string): string => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('th-TH');
};

export function ReportWorkspace({ reportKey }: { reportKey: ReportKey }) {
  const { user } = useAuth();
  const report = reportByKey(reportKey);
  const allowed = user?.role === 'admin' || (user?.departmentShort ?? '').trim().toUpperCase() === report.department;
  const initial = useMemo(defaultRange, []);
  const [dateFrom, setDateFrom] = useState(initial.dateFrom);
  const [dateTo, setDateTo] = useState(initial.dateTo);
  const [validation, setValidation] = useState('');
  const [zoom, setZoom] = useState(100);
  const previewHost = useRef<HTMLDivElement>(null);
  const survey = useItReport<ITSurveySummaryItem>('survey-summary', user?.token);
  const service = useItReport<ITServiceFormSummaryItem>('service-form-summary', user?.token);
  const isSurvey = reportKey === 'it-satisfaction-summary';
  const current = isSurvey ? survey : service;

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
    const documentWidth = isSurvey ? 210 * 96 / 25.4 : 297 * 96 / 25.4;
    const documentHeight = isSurvey ? 297 * 96 / 25.4 : 210 * 96 / 25.4;
    const widthRatio = (host.clientWidth - 40) / documentWidth;
    const heightRatio = (host.clientHeight - 40) / documentHeight;
    setSafeZoom((mode === 'width' ? widthRatio : Math.min(widthRatio, heightRatio)) * 100);
  };
  const exportExcel = () => {
    if (isSurvey && survey.data) exportSurveyReport(survey.data);
    if (!isSurvey && service.data) exportServiceReport(service.data);
  };

  return (
    <Layout title={report.title} subtitle={`${report.department} Report`}>
      <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-gray-200 px-5 py-3 dark:border-slate-700">
          <Link to="/reports" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-slate-500 transition hover:border-accent hover:text-accent dark:border-slate-700 dark:text-slate-300" title="กลับหน้ารายงาน"><IconArrowLeft size={17} /></Link>
          <div><h2 className="text-sm font-bold text-gray-900 dark:text-white">{report.title}</h2><p className="text-[11.5px] text-slate-400">{report.description}</p></div>
        </div>

        <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-gray-200 px-5 pt-2 dark:border-slate-700">
          {REPORTS.map((item, index) => <Link key={item.key} to={item.path} className={`inline-flex items-center gap-2 whitespace-nowrap rounded-t-lg border border-b-0 px-3.5 py-2 text-[12.5px] font-semibold ${item.key === reportKey ? 'border-gray-200 bg-slate-50 text-accent dark:border-slate-700 dark:bg-slate-800' : 'border-transparent text-slate-500 hover:text-accent dark:text-slate-400'}`}>{index === 0 ? <IconChartBar size={15} /> : <IconClipboardList size={15} />}{item.title.replace('หน่วยงาน IT', 'IT').replace('ฝ่ายเทคโนโลยีสารสนเทศ', 'IT')}</Link>)}
        </div>

        <div className="grid shrink-0 gap-3 border-b border-gray-200 bg-slate-50 px-5 py-3 dark:border-slate-700 dark:bg-slate-800/60 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label><span className="mb-1.5 block text-[11.5px] font-semibold text-slate-500 dark:text-slate-400">วันที่เริ่มต้น</span><DateQuickPick value={dateFrom} onChange={(value) => { setDateFrom(value); setValidation(''); }} inputClass={INPUT} /></label>
          <label><span className="mb-1.5 block text-[11.5px] font-semibold text-slate-500 dark:text-slate-400">วันที่สิ้นสุด</span><DateQuickPick value={dateTo} onChange={(value) => { setDateTo(value); setValidation(''); }} inputClass={INPUT} min={dateFrom || undefined} /></label>
          <button type="button" disabled={current.loading} onClick={search} className="inline-flex h-[38px] items-center justify-center gap-2 rounded-lg bg-accent px-4 text-[12.5px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{current.loading ? <IconLoader2 size={16} className="animate-spin" /> : <IconSearch size={16} />}{current.loading ? 'กำลังโหลด…' : 'แสดงรายงาน'}</button>
          {validation && <p className="text-[11.5px] font-semibold text-red-600 sm:col-span-3 dark:text-red-400">{validation}</p>}
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
          <button type="button" onClick={exportExcel} className="it-report-tool sm:ml-auto"><IconFileSpreadsheet size={16} />Export Excel</button>
          <button type="button" onClick={() => window.print()} className="it-report-tool border-accent bg-accent text-white hover:bg-accent/90"><IconPrinter size={16} />พิมพ์ / PDF</button>
        </div>}

        <div ref={previewHost} className="relative min-h-0 flex-1">
          {current.loading && !current.data ? <ReportState icon={<IconLoader2 size={28} className="animate-spin" />} text="กำลังโหลดรายงาน…" />
            : !current.data ? <ReportState icon={<IconSearch size={32} />} text="เลือกช่วงวันที่แล้วกดแสดงรายงาน" />
            : current.data.total === 0 ? <ReportState icon={<IconSearch size={32} />} text="ไม่พบข้อมูลในช่วงวันที่ที่เลือก" />
            : isSurvey ? <SurveyPrint data={survey.data!} preview zoom={zoom} /> : <ServicePrint data={service.data!} preview zoom={zoom} />}
        </div>
      </section>

      {isSurvey && survey.data && <SurveyPrint data={survey.data} />}
      {!isSurvey && service.data && <ServicePrint data={service.data} />}
    </Layout>
  );
}

function ReportState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[13px] font-semibold text-slate-400">{icon}<span>{text}</span></div>;
}

function ToolButton({ title, onClick, disabled, children }: { title: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return <button type="button" title={title} disabled={disabled} onClick={onClick} className="flex h-8 w-9 items-center justify-center text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-300 dark:hover:bg-slate-800">{children}</button>;
}

const SURVEY_COLUMNS: { key: keyof ITSurveySummaryItem; label: string }[] = [
  { key: 'friendlyService', label: 'สุภาพและเป็นมิตร' },
  { key: 'fastService', label: 'ความรวดเร็ว' },
  { key: 'focusService', label: 'กระตือรือร้นและตั้งใจ' },
  { key: 'directService', label: 'ตรงตามที่คาดหวัง' },
  { key: 'serviceKnowledge', label: 'แนะนำขั้นตอนและให้ความรู้' },
];

const sumSurvey = (items: ITSurveySummaryItem[], key: keyof ITSurveySummaryItem): number =>
  items.reduce((sum, item) => sum + Number(item[key] ?? 0), 0);


function PrintHeader({ title, dateFrom, dateTo }: { title: string; dateFrom: string; dateTo: string }) {
  const now = new Date();
  return <><div className="it-print-head"><img src={logo} alt="Big Crane" /><div className="it-print-title"><strong>บริษัท บิ๊กเครน แอนด์ อีควิปเม้นต์ เร้นทัลส์ จำกัด</strong><b>{title}</b></div><div className="it-print-meta">วันที่พิมพ์ : {now.toLocaleDateString('th-TH')}<br />เวลาที่พิมพ์ : {now.toLocaleTimeString('th-TH')}</div></div><div className="it-print-range">ประจำวันที่ <b>{formatDate(dateFrom)}</b> ถึงวันที่ <b>{formatDate(dateTo)}</b></div></>;
}

function SurveyPrint({ data, preview = false, zoom = 100 }: { data: DateRangeReport<ITSurveySummaryItem>; preview?: boolean; zoom?: number }) {
  const maximum = data.items.length * 5;
  return <div className={preview ? 'it-report-preview' : 'print-root'}><article className="it-report-print it-survey-print" style={preview ? { transform: `scale(${zoom / 100})`, transformOrigin: 'top left' } : undefined}><PrintHeader title="สรุปการสำรวจความพึงพอใจ ฝ่ายเทคโนโลยีสารสนเทศ" dateFrom={data.dateFrom} dateTo={data.dateTo} /><table><thead><tr><th>No.</th><th>Service No</th><th>Service Date</th>{SURVEY_COLUMNS.map((column) => <th key={column.key}>{column.label}</th>)}<th>Total</th></tr></thead><tbody>{data.items.map((item, index) => <tr key={`${item.jobNo}-${index}`}><td>{index + 1}</td><td>{item.jobNo}</td><td>{formatDateTime(item.requestDate)}</td>{SURVEY_COLUMNS.map((column) => <td key={column.key}>{item[column.key]}</td>)}<td>{item.totalScore}</td></tr>)}<tr className="summary"><th colSpan={3}>คะแนนที่ทำได้</th>{SURVEY_COLUMNS.map((column) => <td key={column.key}>{sumSurvey(data.items, column.key)}</td>)}<td>{sumSurvey(data.items, 'totalScore')}</td></tr><tr className="summary"><th colSpan={3}>คะแนนรวม</th>{SURVEY_COLUMNS.map((column) => <td key={column.key}>{maximum}</td>)}<td>{maximum * 5}</td></tr><tr className="summary"><th colSpan={3}>คะแนนเฉลี่ย</th>{SURVEY_COLUMNS.map((column) => <td key={column.key}>{(sumSurvey(data.items, column.key) / data.items.length).toFixed(2)}</td>)}<td>{(sumSurvey(data.items, 'totalScore') / data.items.length).toFixed(2)}</td></tr><tr className="summary"><th colSpan={3}>%</th>{SURVEY_COLUMNS.map((column) => <td key={column.key}>{maximum ? `${(sumSurvey(data.items, column.key) / maximum * 100).toFixed(2)}%` : '0.00%'}</td>)}<td>{maximum ? `${(sumSurvey(data.items, 'totalScore') / (maximum * 5) * 100).toFixed(2)}%` : '0.00%'}</td></tr></tbody></table><h3>สรุปการสำรวจความพึงพอใจ ตามข้อคำถาม</h3><table className="it-survey-summary"><thead><tr><th>No</th><th>รายละเอียดข้อคำถามที่สำรวจความพึงพอใจ</th><th>%</th></tr></thead><tbody>{SURVEY_COLUMNS.map((column, index) => <tr key={column.key}><td>{index + 1}</td><td>{column.label}</td><td>{maximum ? `${(sumSurvey(data.items, column.key) / maximum * 100).toFixed(2)}%` : '0.00%'}</td></tr>)}<tr className="summary"><th colSpan={2}>เฉลี่ย</th><td>{maximum ? `${(sumSurvey(data.items, 'totalScore') / (maximum * 5) * 100).toFixed(2)}%` : '0.00%'}</td></tr></tbody></table><div className="it-print-notes"><h3>หลักเกณฑ์ในการพิจารณา</h3><p>- ความพึงพอใจในการให้บริการเฉลี่ย ตั้งแต่ 80% ขึ้นไป ถือว่าเป็นไปตามเป้าหมายตั้งไว้</p><p>- ความพึงพอใจในการให้บริการเฉลี่ย น้อยกว่า 80% ต้องเก็บสถิติเพื่อปรับปรุงการให้บริการของฝ่าย IT โดยจะรวบรวมปีละ 2 ครั้ง เพื่อจัดทำ Action Plan ในการแก้ไขปัญหาในปีต่อไป</p><p className="remark">หมายเหตุ ................................................................................................................................................................................<br />................................................................................................................................................................................................</p></div><Signatures /><PrintFooter left="(P) FM-BC/IT-002/11" right="REV.00(11/04/66)" /></article></div>;
}

function ServicePrint({ data, preview = false, zoom = 100 }: { data: DateRangeReport<ITServiceFormSummaryItem>; preview?: boolean; zoom?: number }) {
  return <div className={preview ? 'it-report-preview' : 'print-root'}><article className="it-report-print it-service-print" style={preview ? { transform: `scale(${zoom / 100})`, transformOrigin: 'top left' } : undefined}><PrintHeader title="ทะเบียนคุมใบรับเรื่องฝ่ายเทคโนโลยีสารสนเทศ" dateFrom={data.dateFrom} dateTo={data.dateTo} /><h3>งานทั้งหมด</h3><table><thead><tr>{['ลำดับ', 'เลขที่ใบรับเรื่อง', 'วันที่-เวลาในใบรับเรื่อง', 'ผู้แจ้งเรื่อง', 'หน่วยงาน', 'ชื่อคอมพิวเตอร์', 'รายละเอียดที่แจ้ง', 'การบริการ', 'สาเหตุหลัก', 'วันที่-เวลาปิดใบรับเรื่อง', 'ผู้ปิดงานรับเรื่อง', 'รายละเอียดการดำเนินงาน'].map((label) => <th key={label}>{label}</th>)}</tr></thead><tbody>{data.items.map((item, index) => <tr key={`${item.jobNo}-${index}`}><td>{index + 1}</td><td>{item.jobNo}</td><td>{formatDateTime(item.requestDate)}</td><td>{item.requestBy ?? ''}</td><td>{item.department ?? ''}</td><td>{item.comName ?? ''}</td><td>{item.requestDetail ?? ''}</td><td>{item.solve ?? ''}</td><td>{[item.hw, item.hwDetail].filter(Boolean).join(' / ')}</td><td>{formatDateTime(item.closeDate)}</td><td>{item.closeBy ?? ''}</td><td>{item.repairDetail ?? ''}</td></tr>)}</tbody></table><h3>งานกำลังดำเนินการ</h3><table><thead><tr>{['ลำดับ', 'เลขที่ใบรับเรื่อง', 'วันที่-เวลาในใบรับเรื่อง', 'ผู้แจ้งเรื่อง', 'หน่วยงาน', 'ชื่อคอมพิวเตอร์', 'รายละเอียดที่แจ้ง', 'กำหนดเสร็จ', 'หมายเหตุ'].map((label) => <th key={label}>{label}</th>)}</tr></thead><tbody>{data.items.filter((item) => (item.wfStep ?? 0) < 6).map((item, index) => <tr key={`${item.jobNo}-${index}`}><td>{index + 1}</td><td>{item.jobNo}</td><td>{formatDateTime(item.requestDate)}</td><td>{item.requestBy ?? ''}</td><td>{item.department ?? ''}</td><td>{item.comName ?? ''}</td><td>{item.requestDetail ?? ''}</td><td>{formatDateTime(item.exPlanDate)}</td><td>{item.remark ?? ''}</td></tr>)}</tbody></table><Signatures /><PrintFooter left="(P) Log-BC/IT-002/04" right="REV.03(16/03/66)" /></article></div>;
}

function Signatures() {
  return <div className="it-print-signatures"><div>ลงชื่อ ................................................ ผู้จัดทำ<br /><span>เจ้าหน้าที่เทคโนโลยีสารสนเทศ</span><br />วันที่ ........../........../................</div><div>ลงชื่อ ................................................ ผู้ตรวจสอบ<br /><span>ผู้จัดการฝ่ายเทคโนโลยีสารสนเทศ</span><br />วันที่ ........../........../................</div></div>;
}

function PrintFooter({ left, right }: { left: string; right: string }) {
  return <div className="it-print-footer"><span>{left}</span><span>{right}</span></div>;
}
