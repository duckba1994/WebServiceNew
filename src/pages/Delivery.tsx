import React, { useMemo, useRef, useState } from 'react';
import {
  IconPlus,
  IconPencil,
  IconTrash,
  IconPrinter,
  IconFileSpreadsheet,
  IconSearch,
  IconFilter,
  IconChevronLeft,
  IconDeviceFloppy,
} from '@tabler/icons-react';
import { Layout } from '../components/layout/Layout';
import {
  INPUT_CLS,
  Field,
  SelectField,
  Check,
  RadioL,
  SectionCard,
  CheckGroup,
} from '../components/ui/FormControls';
import { COMPANY } from '../data/menuData';
import { DeliveryRow } from '../types/delivery';
import {
  DELIVERY_STATUS_META,
  DELIVERY_COLUMNS,
  DeliveryColumn,
  MOCK_DELIVERIES,
  DELIVERY_FILTER_CUSTOMERS,
  DELIVERY_FILTER_DOC_STATUSES,
  MACHINE_DOC_CHECKS,
  EQUIPMENT_STD_CHECKS,
  EXTRA_EQUIPMENT,
  DELIVERY_OPT_CHECKS,
  DELIVERY_DOC_CHECKS,
  DELIVERY_TECH_CHECKS,
} from '../data/deliveryData';

// เกี่ยวกับลักษณะงาน (หมวด 4 — ตามหน้าจอ WinForms)
const JOB_NATURE_CHECKS = [
  'งานยกทั่วไป',
  'งาน Safety',
  'งานต่อจิ๊บ/บูม',
  'งานบนที่สูง',
  'งานรวมกระเช้าปลายบูม',
  'งานยกคู่ (ต้องมีผู้ควบคุม 1 คน, ผู้ให้สัญญาณ 1 คน)',
  'เพื่อ Support งานภายใน',
  'อื่นๆ (ระบุ)',
];

// หัวข้อฟอร์ม 9 หมวด + สีป้ายหมายเลขตามกลุ่ม
const FORM_SECTIONS = [
  { no: 1, label: 'วัตถุประสงค์', badge: 'bg-blue-50 text-blue-700' },
  { no: 2, label: 'ข้อมูลลูกค้า', badge: 'bg-blue-50 text-blue-700' },
  { no: 3, label: 'เครื่องจักรที่ต้องการ', badge: 'bg-amber-50 text-amber-700' },
  { no: 4, label: 'ลักษณะงาน', badge: 'bg-amber-50 text-amber-700' },
  { no: 5, label: 'การนำเสนองาน', badge: 'bg-violet-50 text-violet-700' },
  { no: 6, label: 'สำรวจหน้างาน', badge: 'bg-violet-50 text-violet-700' },
  { no: 7, label: 'เพิ่มเติม Operation', badge: 'bg-emerald-50 text-emerald-600' },
  { no: 8, label: 'เพิ่มเติมฝ่ายขาย', badge: 'bg-emerald-50 text-emerald-600' },
  { no: 9, label: 'หมายเหตุอื่นๆ', badge: 'bg-slate-100 text-slate-600' },
];

function DlSection({ no, title, children }: { no: number; title: string; children: React.ReactNode }) {
  const badge = FORM_SECTIONS.find((s) => s.no === no)!.badge;
  return (
    <SectionCard id={`dl-sec${no}`} no={no} badgeClass={badge} title={title}>
      {children}
    </SectionCard>
  );
}

// แถวอุปกรณ์ร้องขอเพิ่ม — checkbox + ช่องกรอกพร้อมหน่วย (ถ้ามี)
function ExtraEquipRow({ label, units, wide }: { label: string; units?: string[]; wide?: boolean }) {
  return (
    <div className="flex items-center gap-2 py-0.5">
      <Check label={label} />
      {wide && <input className={`${INPUT_CLS} min-w-0 flex-1 py-1.5`} />}
      {units?.map((u) => (
        <React.Fragment key={u}>
          <input className={`${INPUT_CLS} mono w-20 py-1.5 text-right`} />
          <span className="shrink-0 text-[12px] text-gray-500">{u}</span>
        </React.Fragment>
      ))}
    </div>
  );
}

export function Delivery() {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [filterOpen, setFilterOpen] = useState(false);
  const [search, setSearch] = useState('');
  // แถวที่กำลังแก้ไข (null = สร้างใหม่)
  const [editing, setEditing] = useState<DeliveryRow | null>(null);
  const formScrollRef = useRef<HTMLDivElement>(null);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return MOCK_DELIVERIES.filter((r) => !q || r.delivery.toLowerCase().includes(q));
  }, [search]);

  const today = new Date().toLocaleDateString('en-GB'); // dd/mm/yyyy

  const openForm = (row: DeliveryRow | null) => {
    setEditing(row);
    setView('form');
  };

  const goSection = (no: number) => {
    const el = formScrollRef.current?.querySelector(`#dl-sec${no}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const renderCell = (row: DeliveryRow, col: DeliveryColumn) => {
    const value = col.key === 'no' ? row.id : row[col.key as keyof DeliveryRow];
    switch (col.kind) {
      case 'status': {
        const m = DELIVERY_STATUS_META[row.docStatus];
        return (
          <span
            className="inline-flex max-w-full items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
            style={{ background: m.bg, color: m.color, borderColor: m.border }}
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: m.color }} />
            {m.label}
          </span>
        );
      }
      case 'delivery':
        return (
          <span className={`mono font-semibold ${row.flag === 'rejected' ? 'text-pink-700' : 'text-accent'}`}>
            {row.delivery}
          </span>
        );
      case 'mono':
        return value === '—' || value === '' ? (
          <span className="mono text-slate-300">—</span>
        ) : (
          <span className="mono">{String(value)}</span>
        );
      case 'date':
        return value === '—' || value === '' ? (
          <span className="text-slate-300">—</span>
        ) : (
          <span className="text-slate-600">{String(value)}</span>
        );
      default:
        if (col.key === 'no') return <span className="text-xs text-slate-400">{row.id}</span>;
        if (col.key === 'customer') return <span className="font-semibold text-gray-900">{row.customer}</span>;
        return value === '' ? <span className="text-slate-300">—</span> : <span>{String(value)}</span>;
    }
  };

  const rowClass = (row: DeliveryRow) => {
    if (row.flag === 'ok') return 'bg-emerald-50 hover:bg-emerald-100 shadow-[inset_3px_0_0_#34d399]';
    if (row.flag === 'rejected') return 'bg-pink-50 hover:bg-pink-100 shadow-[inset_3px_0_0_#f472b6]';
    return 'bg-white hover:bg-slate-50';
  };

  return (
    <Layout title="ใบแจ้งจัดส่ง" subtitle="Delivery">
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {view === 'list' ? (
          <>
            {/* ===== Toolbar ===== */}
            <div className="flex shrink-0 flex-wrap items-center gap-2.5 border-b border-gray-200 bg-white px-5 py-2.5">
              <button
                onClick={() => openForm(null)}
                className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-[13.5px] font-semibold text-white shadow-md shadow-accent/30 transition hover:bg-[#134a8e]"
              >
                <IconPlus size={16} stroke={2.2} />
                ADD <span className="font-medium opacity-85">สร้างใบจัดส่ง</span>
              </button>
              <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-[12.5px] font-medium text-red-700 transition hover:border-red-200 hover:bg-red-50">
                <IconTrash size={15} />
                CANCEL <span className="text-gray-400">ยกเลิกใบจัดส่ง</span>
              </button>
              <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-[12.5px] font-medium text-slate-700 transition hover:border-gray-300 hover:bg-slate-50">
                <IconPrinter size={15} />
                PRINT <span className="text-gray-400">พิมพ์ใบจัดส่ง</span>
              </button>
              <button className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12.5px] font-semibold text-emerald-700 transition hover:bg-emerald-100">
                <IconFileSpreadsheet size={15} />
                Export Excel
              </button>
            </div>

            {/* ===== Search bar ===== */}
            <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-gray-200 bg-slate-50 px-5 py-2.5">
              <span className="text-xs font-bold text-slate-600">ค้นหาข้อมูล ใบจัดส่งสินค้า</span>
              <div className="flex w-[300px] max-w-[34vw] items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 transition focus-within:border-accent">
                <IconSearch size={16} className="shrink-0 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="เลขที่ใบจัดส่ง..."
                  className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-gray-400"
                />
              </div>
              <button className="flex items-center gap-1.5 rounded-lg bg-[#0b1220] px-3.5 py-2 text-[12.5px] font-semibold text-white transition hover:bg-slate-800">
                <IconSearch size={14} stroke={2} />
                ค้นหา
              </button>
              <button className="rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-[12.5px] font-medium text-slate-700 transition hover:border-gray-300 hover:bg-slate-50">
                Today
              </button>
              <button
                onClick={() => setFilterOpen((o) => !o)}
                className="ml-auto flex items-center gap-1.5 text-[12.5px] font-semibold text-accent transition hover:text-[#134a8e]"
              >
                <IconFilter size={14} />
                ค้นหาข้อมูลเพิ่มเติม
              </button>
            </div>

            {/* ===== Advanced filter panel ===== */}
            {filterOpen && (
              <div className="form-slide-enter shrink-0 border-b border-gray-200 bg-white px-5 py-4">
                <div className="grid grid-cols-3 gap-x-5 gap-y-4">
                  {['วันที่แจ้งจัดส่ง', 'วันที่เริ่มทำงาน'].map((t) => (
                    <div key={t} className="rounded-xl border border-[#eef1f6] bg-slate-50 p-3">
                      <div className="mb-2 text-[11.5px] font-bold text-slate-600">{t}</div>
                      <div className="flex items-center gap-2">
                        <input defaultValue={today} className={`${INPUT_CLS} mono w-full !bg-white py-1.5 text-[12.5px]`} />
                        <span className="text-xs text-gray-400">ถึง</span>
                        <input defaultValue={today} className={`${INPUT_CLS} mono w-full !bg-white py-1.5 text-[12.5px]`} />
                      </div>
                    </div>
                  ))}
                  <SelectField label="รายชื่อลูกค้า" options={DELIVERY_FILTER_CUSTOMERS} />
                  <SelectField label="สถานะเอกสาร" options={DELIVERY_FILTER_DOC_STATUSES} />
                </div>
              </div>
            )}

            {/* ===== Status legend + count ===== */}
            <div className="flex shrink-0 items-center gap-4 border-b border-gray-200 bg-slate-50 px-5 py-2">
              <span className="flex items-center gap-1.5 text-[11.5px] text-slate-500">
                <span className="h-2.5 w-2.5 rounded bg-emerald-300" />
                PL ยืนยันเบอร์รถแล้ว
              </span>
              <span className="flex items-center gap-1.5 text-[11.5px] text-slate-500">
                <span className="h-2.5 w-2.5 rounded bg-pink-300" />
                ไม่อนุมัติการจัดส่ง
              </span>
              <span className="flex items-center gap-1.5 text-[11.5px] text-slate-500">
                <span className="h-2.5 w-2.5 rounded bg-slate-200" />
                ปกติ
              </span>
              <span className="flex items-center gap-1.5 text-[11.5px] font-medium text-accent">
                <IconPencil size={13} />
                คลิกที่แถวเพื่อแก้ไข / อนุมัติ
              </span>
              <div className="ml-auto text-xs text-slate-400">
                แสดง <b className="text-gray-900">{rows.length}</b> รายการ
              </div>
            </div>

            {/* ===== Grid ===== */}
            <div className="relative min-h-0 flex-1">
              <div className="absolute inset-0 overflow-auto bg-white">
                <table className="w-full min-w-max border-separate border-spacing-0">
                  <thead>
                    <tr>
                      {DELIVERY_COLUMNS.map((col) => (
                        <th
                          key={col.key}
                          className="sticky top-0 z-10 whitespace-nowrap border-b-2 border-accent bg-[#0b1220] px-3 py-2.5 text-[11.5px] font-semibold text-slate-300"
                          style={{ minWidth: col.width, textAlign: col.align }}
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr
                        key={row.id}
                        onClick={() => openForm(row)}
                        title="คลิกเพื่อแก้ไขใบจัดส่งนี้"
                        className={`cursor-pointer transition-colors ${rowClass(row)}`}
                      >
                        {DELIVERY_COLUMNS.map((col) => (
                          <td
                            key={col.key}
                            className="h-12 overflow-hidden text-ellipsis whitespace-nowrap border-b border-[#eef1f6] px-3 text-[13px] text-slate-700"
                            style={{ maxWidth: col.width, textAlign: col.align }}
                          >
                            {renderCell(row, col)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* ===== Form header ===== */}
            <div className="flex shrink-0 items-center gap-4 border-b border-gray-200 bg-white px-5 py-3">
              <button
                onClick={() => setView('list')}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white transition hover:bg-slate-100"
                aria-label="กลับไปหน้ารายการ"
              >
                <IconChevronLeft size={18} className="text-slate-700" />
              </button>
              <div>
                <div className="text-[17px] font-bold leading-tight text-gray-900">
                  {editing ? 'แก้ไขใบจัดส่งสินค้า' : 'สร้างใบจัดส่งสินค้า'}
                </div>
                <div className="text-xs text-gray-400">{COMPANY.nameTh}</div>
              </div>
              {editing ? (
                <span
                  className="ml-2 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-[11.5px] font-semibold"
                  style={{
                    background: DELIVERY_STATUS_META[editing.docStatus].bg,
                    color: DELIVERY_STATUS_META[editing.docStatus].color,
                    borderColor: DELIVERY_STATUS_META[editing.docStatus].border,
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: DELIVERY_STATUS_META[editing.docStatus].color }}
                  />
                  {DELIVERY_STATUS_META[editing.docStatus].label}
                </span>
              ) : (
                <span className="ml-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11.5px] font-semibold text-amber-700">
                  ส่วนที่ 1 · สำหรับฝ่ายขาย / ผู้จอง (เพื่อให้รายละเอียดการจัดส่ง)
                </span>
              )}
              <div className="ml-auto flex gap-2.5">
                <div className="flex flex-col items-end rounded-lg border border-gray-200 bg-slate-100 px-3.5 py-1">
                  <span className="text-[9.5px] tracking-wide text-gray-400">เลขที่ใบจัดส่ง</span>
                  <span className="mono text-sm font-bold text-gray-900">{editing?.delivery ?? 'AUTO'}</span>
                </div>
                <div className="flex flex-col items-end rounded-lg border border-gray-200 bg-slate-100 px-3.5 py-1">
                  <span className="text-[9.5px] tracking-wide text-gray-400">วันที่สร้างใบจัดส่ง</span>
                  <span className="mono text-sm font-bold text-gray-900">{editing?.deliveryDate ?? today}</span>
                </div>
              </div>
            </div>

            {/* ===== Form body: nav + scroll sections ===== */}
            <div className="flex min-h-0 flex-1">
              <nav className="flex w-56 shrink-0 flex-col gap-0.5 overflow-y-auto border-r border-gray-200 bg-white p-3">
                <div className="px-3 pb-2 pt-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  หัวข้อฟอร์ม
                </div>
                {FORM_SECTIONS.map((s) => (
                  <button
                    key={s.no}
                    onClick={() => goSection(s.no)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    <span
                      className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md text-[11px] font-bold ${s.badge}`}
                    >
                      {s.no}
                    </span>
                    {s.label}
                  </button>
                ))}
              </nav>

              <div
                ref={formScrollRef}
                key={editing?.id ?? 'new'}
                className="flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto bg-[#f4f6fa] p-5 pb-10"
              >
                <DlSection no={1} title="วัตถุประสงค์">
                  <div className="grid grid-cols-3 gap-x-4 gap-y-3">
                    <SelectField
                      label="อ้างอิงใบจองสินค้า"
                      options={['เลือกใบจองสินค้า...', 'PPD690260', 'PPD690258', 'PPD690222']}
                      value={editing?.bookingNo}
                    />
                    <SelectField
                      label="วัตถุประสงค์"
                      options={['รถออกงานใหม่', 'รถทดแทน', 'ย้ายไซต์งาน']}
                    />
                    <SelectField label="ประเภทแผนงาน" options={['ฉุกเฉิน', 'ตามแผน', 'นอกแผน']} />
                    <Field label="อ้างอิงเลขที่แผนขาย" value="SP-SLHV-11/07/2026" mono disabled />
                    <Field label="เลขที่ใบเสนอราคา" value={editing?.quoteNo} mono disabled />
                    <Field label="ผู้สร้างเอกสาร" value={editing?.creator} disabled />
                  </div>
                  <div className="mt-3 flex gap-4">
                    <RadioL name="dl-purpose" label="ตามแผน" />
                    <RadioL name="dl-purpose" label="นอกแผน" />
                    <RadioL name="dl-purpose" label="ฉุกเฉิน" />
                  </div>
                </DlSection>

                <DlSection no={2} title="ข้อมูลลูกค้า">
                  <div className="grid grid-cols-[2fr_1fr] gap-x-4 gap-y-3">
                    <Field label="ชื่อลูกค้า" placeholder="ค้นหา / เลือกลูกค้า..." value={editing?.customer} />
                    <Field label="ประเภทลูกค้า" value="ลูกค้าเก่า" disabled />
                    <Field label="สถานที่ทำงาน" value={editing?.site} />
                    <Field label="จังหวัด" />
                    <Field label="ชื่อผู้ติดต่อ" />
                    <Field label="เบอร์โทรศัพท์" mono />
                  </div>
                </DlSection>

                <DlSection no={3} title="เครื่องจักรที่ต้องการ">
                  <div className="grid grid-cols-4 gap-x-4 gap-y-3">
                    <SelectField
                      label="ประเภทเครื่องจักรที่ต้องการ"
                      options={['เลือกประเภท...', '06-350TT', '03-25RC', '04-50CC', '02-080TB']}
                      value={editing?.machine}
                      className="col-span-2"
                    />
                    <SelectField label="รุ่น" options={['ALL', 'TR250', 'TR500']} />
                    <SelectField label="ปี" options={['2569', '2568', '2543']} />
                    <Field label="ขนาดตันที่ต้องการ" placeholder="ตัน" mono />
                  </div>
                </DlSection>

                <DlSection no={4} title="รายละเอียดลักษณะงาน">
                  <div className="flex flex-col gap-4">
                    <Field label="รายละเอียดลักษณะงาน" value={editing?.jobType} />
                    <CheckGroup title="เกี่ยวกับลักษณะงาน" items={JOB_NATURE_CHECKS} cols={3} />
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      <SelectField label="กลุ่มงาน" options={['เลือกกลุ่มงาน...', 'กลุ่มที่พักอาศัย']} />
                      <SelectField label="ประเภทงาน" options={['เลือกประเภทงาน...', 'ยกผลิตภัณฑ์คอนกรีต']} />
                    </div>
                  </div>
                </DlSection>

                <DlSection no={5} title="ต้องการนำเสนองาน">
                  <div className="mb-4 grid grid-cols-3 gap-x-4 gap-y-3">
                    <SelectField label="ต้องการนำเสนองาน" options={['เลือก...', 'งานวัน', 'งานเดือน']} />
                    <Field label="รวมระยะเวลาเช่า" value={editing?.duration ?? '0'} mono />
                    <Field label="ชั่วโมงทำงานต่อวัน" mono />
                    <Field label="วันที่เริ่มทำงาน" value={editing?.startDate ?? today} mono />
                    <Field label="วันที่สิ้นสุดการทำงาน" value={editing?.endDate ?? today} mono />
                    <Field label="เวลาที่เริ่มทำงาน" value="08:00:00" mono />
                  </div>

                  {/* ข้อมูลใบจองสินค้าที่ PL และ SV ตอบกลับ */}
                  <div className="mb-4 rounded-xl border border-[#eef1f6] bg-slate-50 p-3.5">
                    <div className="mb-2.5 text-xs font-bold text-slate-600">
                      ข้อมูลใบจองสินค้าที่ PL และ SV ตอบกลับ
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="w-16 shrink-0 text-[12px] text-gray-500">สถานะ PL</span>
                        <div className="min-w-0 flex-1 truncate rounded-md border border-orange-200 bg-orange-100 px-3 py-1.5 text-[12.5px] font-semibold text-orange-800">
                          {editing?.plReply || 'เครื่องจักรและอปต. พร้อม'}
                        </div>
                        <span className="shrink-0 text-[12px] text-gray-500">เบอร์รถ</span>
                        <span className="mono w-16 shrink-0 rounded-md border border-orange-200 bg-orange-100 px-2 py-1.5 text-center text-[12.5px] font-semibold text-orange-800">
                          {editing?.truckPL ?? '10/33'}
                        </span>
                        <span className="shrink-0 text-[12px] text-gray-500">วันที่</span>
                        <span className="mono w-16 shrink-0 rounded-md border border-orange-200 bg-orange-100 px-2 py-1.5 text-center text-[12.5px] text-orange-800">
                          {editing?.plOptDate ?? '—'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="w-16 shrink-0 text-[12px] text-gray-500">สถานะ SV</span>
                        <div className="min-w-0 flex-1 rounded-md border border-yellow-200 bg-yellow-100 px-3 py-1.5 text-[12.5px] font-semibold text-yellow-800">
                          ยืนยันข้อมูลเบอร์รถ ตามที่ PL ระบุและสามารถผลิตได้ตามวันที่ต้องการ
                        </div>
                        <span className="shrink-0 text-[12px] text-gray-500">เบอร์รถ</span>
                        <span className="mono w-16 shrink-0 rounded-md border border-yellow-200 bg-yellow-100 px-2 py-1.5 text-center text-[12.5px] text-yellow-800">
                          —
                        </span>
                        <span className="shrink-0 text-[12px] text-gray-500">วันที่</span>
                        <span className="mono w-16 shrink-0 rounded-md border border-yellow-200 bg-yellow-100 px-2 py-1.5 text-center text-[12.5px] text-yellow-800">
                          —
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3.5">
                    <div className="rounded-xl border border-[#eef1f6] bg-slate-50 p-3.5">
                      <div className="mb-2 text-xs font-bold text-slate-600">เงื่อนไขการใช้งาน อปต.</div>
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                        <RadioL name="dl-opt" label="รวม อปต." />
                        <RadioL name="dl-opt" label="ไม่รวม อปต. / ใช้ อปต. หน้างาน" />
                        <span className="text-[11.5px] text-gray-400">
                          (กรณีเช่าแบบ ไม่รวม อปต. ลค. จะต้องทำประกันภัยเครื่องจักรที่เช่า และ ฝ่าย HR + PL
                          ต้องทำการสัมภาษณ์ตาม CheckList ก่อนจัดส่งเครื่องจักร)
                        </span>
                      </div>
                    </div>
                    <div className="rounded-xl border border-[#eef1f6] bg-slate-50 p-3.5">
                      <div className="mb-2 text-xs font-bold text-slate-600">เงื่อนไขการใช้น้ำมัน</div>
                      <div className="mb-1.5 flex gap-5">
                        <RadioL name="dl-fuel" label="รวมน้ำมันเชื้อเพลิง" />
                        <RadioL name="dl-fuel" label="ไม่รวมน้ำมันเชื้อเพลิง" />
                      </div>
                      <Check label="เติมน้ำมันเต็มถัง [กรณีซิโน-ไทย, วัฒนไพศาล, กิจการร่วมค้า CKST-OR, กิจการร่วมค้า CKST-PL, ทักษิณ, ช.การช่าง, พลัส โพรเกรส ต้องเติมน้ำมันเต็มถัง (ตรวจหน้างาน) ในวันแรกของการเริ่มงาน]" />
                    </div>
                  </div>
                </DlSection>

                <DlSection no={6} title="สำรวจหน้างาน">
                  <div className="grid grid-cols-[2fr_1fr] gap-x-4 gap-y-3">
                    <SelectField
                      label="สำรวจหน้างาน"
                      options={['เลือก...', 'สำรวจแล้ว', 'ยังไม่ได้ดูหน้างาน มีแผนจะไปดูวันที่']}
                    />
                    <Field label="วันที่" value={today} mono />
                  </div>
                  <div className="mt-2 text-[11.5px] text-gray-400">
                    กติกาสำรวจหน้างาน: งานวัน และ เครื่องจักรประเภท TB, CC สาเหตุ: สำรวจหน้างาน ทางเข้า-ออก
                    พื้นที่รถ TT ใช้ขนส่ง และรถเครนประกอบบูม
                  </div>
                </DlSection>

                <DlSection no={7} title="หมวดเพิ่มเติม Operation">
                  <div className="flex flex-col gap-3.5">
                    <SelectField
                      label="เกี่ยวกับเครื่องจักร"
                      options={['เลือก...', 'ใช้เครื่องจักรเข้าช่วง']}
                      className="max-w-[360px]"
                    />
                    <CheckGroup title="เกี่ยวกับเอกสารเครื่องจักร" items={MACHINE_DOC_CHECKS} cols={3} titleClass="text-cyan-700" />
                    <CheckGroup title="เกี่ยวกับมาตรฐานอุปกรณ์" items={EQUIPMENT_STD_CHECKS} cols={1} titleClass="text-cyan-700" />

                    <div className="rounded-xl border border-[#eef1f6] bg-slate-50 p-3.5">
                      <div className="mb-2 text-xs font-bold text-cyan-700">เกี่ยวกับอุปกรณ์ร้องขอเพิ่ม</div>
                      <div className="grid grid-cols-2 gap-x-5">
                        {EXTRA_EQUIPMENT.map((item) => (
                          <ExtraEquipRow key={item.label} {...item} />
                        ))}
                      </div>
                    </div>

                    <CheckGroup title="เกี่ยวกับ อปต." items={DELIVERY_OPT_CHECKS} titleClass="text-cyan-700" />

                    <div className="rounded-xl border border-[#eef1f6] bg-slate-50 p-3.5">
                      <div className="mb-2 text-xs font-bold text-cyan-700">เกี่ยวกับใบงาน</div>
                      <div className="grid grid-cols-2 gap-x-3.5">
                        <div className="col-span-2 flex items-center gap-2 py-0.5">
                          <Check label="ใบเสนอราคาเลขที่" />
                          <input className={`${INPUT_CLS} mono w-52 py-1.5`} defaultValue="B-QUO26000747" />
                          <span className="min-w-0 text-[11px] text-gray-400">
                            (ดึงข้อมูลมาจากแผนขาย/คีย์เพิ่มได้/ใช้เลขที่ใบเสนอราคาอ้างอิงในการตรวจ WO
                            แต่ไม่ได้รับหรือเห็นใบเสนอราคา)
                          </span>
                        </div>
                        {DELIVERY_DOC_CHECKS.map((c) => (
                          <Check key={c} label={c} />
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-[#eef1f6] bg-slate-50 p-3.5">
                      <div className="mb-2 text-xs font-bold text-cyan-700">เกี่ยวกับช่าง</div>
                      <div className="grid grid-cols-2 gap-x-3.5">
                        <div className="col-span-2 flex items-center gap-2 py-0.5">
                          <Check label="แจ้งช่างประกอบบูม/จิ๊บ วันที่" />
                          <input className={`${INPUT_CLS} mono w-36 py-1.5`} defaultValue={today} />
                        </div>
                        {DELIVERY_TECH_CHECKS.map((c) => (
                          <Check key={c} label={c} />
                        ))}
                      </div>
                    </div>
                  </div>
                </DlSection>

                <DlSection no={8} title="หมวดเพิ่มเติมฝ่ายขาย">
                  <div className="flex gap-5">
                    <RadioL name="dl-credit" label="ไม่ติดวงเงิน" />
                    <RadioL name="dl-credit" label="ติดวงเงิน" />
                  </div>
                </DlSection>

                <DlSection no={9} title="หมายเหตุอื่นๆ">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[11.5px] font-semibold text-gray-500">Remark</span>
                    <textarea rows={3} className={`${INPUT_CLS} w-full resize-y`} />
                  </label>
                </DlSection>
              </div>
            </div>

            {/* ===== Form action bar ===== */}
            <div className="flex shrink-0 items-center gap-2.5 border-t border-gray-200 bg-white px-5 py-3.5">
              <div className="text-xs text-gray-400">
                {editing
                  ? `กำลังแก้ไขใบจัดส่งเลขที่ ${editing.delivery}`
                  : 'กรอกข้อมูลส่วนที่ 1 ให้ครบก่อนส่งอนุมัติ'}
              </div>
              <button
                onClick={() => setView('list')}
                className="ml-auto rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                กลับ
              </button>
              <button
                onClick={() => setView('list')}
                className="flex items-center gap-1.5 rounded-lg bg-accent px-6 py-2.5 text-[13px] font-bold text-white shadow-md shadow-accent/30 transition hover:bg-[#134a8e]"
              >
                <IconDeviceFloppy size={15} />
                บันทึก
              </button>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
