import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  IconPlus,
  IconPencil,
  IconTrash,
  IconPrinter,
  IconFileSpreadsheet,
  IconSearch,
  IconFilter,
  IconFilterFilled,
  IconFilterOff,
  IconArrowUp,
  IconArrowDown,
  IconArrowsSort,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDeviceFloppy,
  IconCheck,
  IconArrowBackUp,
  IconCircleCheck,
  IconAlertTriangle,
  IconHistory,
  IconEye,
  IconEyeOff,
  IconLoader2,
  IconRefresh,
} from '@tabler/icons-react';
import { Layout } from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import { useBookings } from '../hooks/useBookings';
import { useBookingMasterData } from '../hooks/useBookingMasterData';
import {
  BookingMaster,
  EMPTY_BOOKING_MASTER,
  purposeOpts,
  jobCharacterOpts,
  presentWorkOpts,
  documentBookingOpts,
  technicianConditionOpts,
} from '../data/bookingMaster';
import { BookingQuery } from '../api/booking';
import { ColumnFilter } from '../components/ui/ColumnFilter';
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
import { BookingChangeDoc, BookingRow } from '../types/booking';
import { BookingPrintDoc } from '../components/booking/BookingPrintDoc';
import { exportBookingsToExcel } from '../utils/bookingExport';
import {
  BOOKING_STATUS_META,
  stateColorOf,
  BOOKING_COLUMNS,
  BOOKING_COLUMN_PRESETS,
  BookingPresetKey,
  BookingColumn,
  bookingCellText,
  compareBookings,
  buildBookingProgress,
  STATUS_STEPS_DONE,
  WORKFLOW_LEN,
  MOCK_STEP_DETAIL,
  MOCK_BOOKING_CHANGES,
} from '../data/bookingData';

// ความกว้างคอลัมน์ขั้นต่ำเมื่อลากปรับขนาด
const MIN_COL_WIDTH = 90;

// ตัวเลือกจำนวนรายการที่แสดงต่อหน้า (เหมือนหน้าแผนขาย)
const PAGE_SIZES: (number | 'all')[] = [20, 50, 100, 'all'];

// ── เงื่อนไขค้นหาใบจอง (server-side) — ผูกกับ query params ของ GET /Bookings ──
// ทุก field เป็นค่าที่กรอกในฟอร์ม (draft) ; ค่าว่าง = ไม่กรอง
type BookingFilterState = Required<Omit<BookingQuery, 'showDataAll'>> & { showDataAll: boolean };
const EMPTY_FILTER: BookingFilterState = {
  bookingNo: '',
  startWork: '',
  endWork: '',
  startCreateDoc: '',
  endCreateDoc: '',
  startPL: '',
  endPL: '',
  customerName: '',
  machineID: '',
  statusDoc: '',
  showDataAll: false,
};

// ── ตัวเลือกในฟอร์ม ──────────────────────────────────────────
// หมายเหตุ: ลักษณะงาน / อปต. / ช่าง ย้ายไปดึงจาก master data แล้ว
// (ดู data/bookingMaster.ts) ; เหลือ "เกี่ยวกับใบงาน" ที่ยังไม่มี master รองรับ
const DOC_CHECKS = [
  'เครื่องจักรใช้ใบงานเดิม (ย้ายไซต์เดิม)',
  'ค่าขนส่งเปิดใบงานเฉพาะกิจ',
  'ใบเสนอราคาเลขที่',
  'งานใหม่ต้องเปิดใบงานใหม่',
  'งาน Support เปิดใบงานเฉพาะกิจ',
  'รถทดแทนต้องเปิดใบงานใหม่',
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
  { no: 8, label: 'วงเงิน / เครดิต', badge: 'bg-emerald-50 text-emerald-600' },
  { no: 9, label: 'หมายเหตุอื่นๆ', badge: 'bg-slate-100 text-slate-600' },
];

// wrapper ผูกหมายเลขหมวดกับสีป้ายและ id เป้าหมายของเมนูนำทาง
function BkSection({ no, title, children }: { no: number; title: string; children: React.ReactNode }) {
  const badge = FORM_SECTIONS.find((s) => s.no === no)!.badge;
  return (
    <SectionCard id={`bk-sec${no}`} no={no} badgeClass={badge} title={title}>
      {children}
    </SectionCard>
  );
}

// ── ช่องข้อมูลแบบอ่านอย่างเดียว (เลียนแบบฟอร์ม WinForms) ──────
function RoField({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <label className={`flex flex-col gap-1 ${wide ? 'sm:col-span-2' : ''}`}>
      <span className="text-[11.5px] font-medium text-gray-500">{label}</span>
      <div className="rounded-lg border border-gray-200 bg-slate-50 px-3 py-2 text-[13px] text-gray-800">
        {value || <span className="text-slate-300">—</span>}
      </div>
    </label>
  );
}

// กล่อง "ผู้อนุมัติ / ผู้ยืนยัน" ท้ายแต่ละส่วน
function ApproverBox({
  title,
  personLabel,
  role,
  name,
  date,
  time,
  pending,
}: {
  title: string;
  personLabel: string;
  role: string;
  name: string;
  date: string;
  time: string;
  pending?: boolean;
}) {
  return (
    <div className="mt-4 rounded-xl border border-gray-200 bg-slate-50 p-4">
      <div className="mb-2.5 text-[12.5px] font-bold text-gray-600">{title}</div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-gray-500">{personLabel}</span>
          <span className="rounded-md border border-gray-200 bg-white px-3 py-1 font-semibold text-gray-900">
            {pending ? <span className="text-amber-600">รอ {name}</span> : name}
          </span>
          <span className="text-[11.5px] text-gray-400">{role}</span>
        </div>
        {!pending && (
          <div className="flex items-center gap-2 text-gray-500">
            วันที่ <span className="mono font-semibold text-gray-800">{date}</span>
            เวลา <span className="mono font-semibold text-gray-800">{time}</span> น.
          </div>
        )}
      </div>
    </div>
  );
}

// การ์ดสรุปย่อ (ใช้ในส่วนที่ 4 — สรุปสถานะจากฝ่าย PL / SV)
function MiniCard({
  title,
  accent,
  head,
  rows,
}: {
  title: string;
  accent: string;
  head?: string;
  rows: [string, string][];
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3.5" style={{ borderTopColor: accent, borderTopWidth: 2 }}>
      <div className="mb-2 text-[12px] font-bold" style={{ color: accent }}>
        {title}
      </div>
      {head && <div className="mb-2 text-[13px] font-bold text-gray-900">{head}</div>}
      <dl className="flex flex-col gap-1.5">
        {rows.map(([k, v]) => (
          <div key={k} className="flex flex-col">
            <dt className="text-[11px] text-gray-400">{k}</dt>
            <dd className="text-[12.5px] text-gray-800">{v || '—'}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

// ── ฟอร์มส่วนที่ 2 (ฝ่าย PL หยอดเบอร์รถ) ──────────────────────
// mode: 'entry'   = PL ยังไม่ระบุ → กรอกใหม่ (ช่องว่าง)
//       'review'  = PL ระบุแล้ว รอ Mgr PL → prefill + แก้ไขได้ (Mgr ปรับก่อนอนุมัติ)
//       'approved'= Mgr PL อนุมัติแล้ว → อ่านอย่างเดียว
function PlTruckForm({
  row,
  mode,
  plStep,
  plMgrStep,
}: {
  row: BookingRow;
  mode: 'entry' | 'review' | 'approved';
  plStep: import('../data/bookingData').WorkflowStep;
  plMgrStep: import('../data/bookingData').WorkflowStep;
}) {
  const disabled = mode === 'approved';
  const prefill = mode !== 'entry';
  const rentNo = row.truckPL !== '—' && row.truckPL ? row.truckPL : '160/2';
  const operator = MOCK_STEP_DETAIL.pl.operator;
  const note = {
    entry: { text: 'กรุณาระบุข้อมูลเบอร์รถ (สำหรับเจ้าหน้าที่ฝ่าย PL)', cls: 'border-amber-200 bg-amber-50 text-amber-700' },
    review: {
      text: 'เจ้าหน้าที่ PL ระบุข้อมูลแล้ว — Mgr PL ตรวจสอบ/แก้ไขข้อมูลได้ก่อนกดอนุมัติ',
      cls: 'border-blue-200 bg-blue-50 text-blue-700',
    },
    approved: { text: 'อนุมัติแล้ว — แสดงข้อมูลแบบอ่านอย่างเดียว', cls: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  }[mode];

  return (
    <>
      <div className={`mb-4 rounded-lg border px-3 py-2 text-[12px] font-semibold ${note.cls}`}>{note.text}</div>

      <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
        <SelectField
          label="สถานะเครื่องจักร และ อปต."
          options={['เลือกสถานะ...', 'เครื่องจักรและอปต. พร้อม', 'ยังไม่พร้อม']}
          value={prefill ? MOCK_STEP_DETAIL.pl.machineStatus : undefined}
          disabled={disabled}
          className="sm:col-span-2"
        />

        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-[11.5px] font-semibold text-gray-500">วันที่สามารถจัดหา / ผลิตรถได้</span>
          <div className="flex flex-wrap items-center gap-3">
            <Check label="ระบุวันที่" disabled={disabled} />
            <input
              type="text"
              defaultValue={prefill ? row.startDate : ''}
              placeholder="dd/mm/yyyy"
              disabled={disabled}
              className={`${INPUT_CLS} mono w-40 ${disabled ? 'cursor-not-allowed bg-gray-100 text-gray-400' : ''}`}
            />
          </div>
        </label>

        <SelectField
          label="หมายเลขรถเช่า"
          options={['เลือกเบอร์รถ...', '10/27', '10/28', '160/2', '155/1', '210/3']}
          value={prefill ? rentNo : undefined}
          disabled={disabled}
        />
        <Field label="สถานะรถ" value={prefill ? MOCK_STEP_DETAIL.pl.carStatus : undefined} disabled={disabled} />
        <Field label="วันที่สิ้นสุดสถานะ" value={prefill ? row.endDate : undefined} mono disabled={disabled} />
        <SelectField
          label="ชื่อ Operator"
          options={['เลือก Operator...', 'วสัน เรืองดี', 'สมพงษ์ แก้วมณี']}
          value={prefill ? operator : undefined}
          disabled={disabled}
        />
        <Field label="สาเหตุ" placeholder="ระบุสาเหตุ (ถ้ามี)" disabled={disabled} className="sm:col-span-2" />
      </div>

      {/* ผู้ระบุ (เจ้าหน้าที่ PL) */}
      <ApproverBox
        title="เจ้าหน้าที่ PL ระบุเบอร์รถ"
        personLabel="ผู้ระบุ"
        role={plStep.role}
        name={plStep.actor}
        date={mode === 'entry' ? '' : row.createDate}
        time={mode === 'entry' ? '' : plStep.atShort}
        pending={mode === 'entry'}
      />
      {/* ผู้อนุมัติ (Mgr PL) */}
      <ApproverBox
        title={mode === 'approved' ? 'ผู้อนุมัติ (Mgr PL)' : 'รออนุมัติ (Mgr PL)'}
        personLabel="ผู้อนุมัติ"
        role={plMgrStep.role}
        name={plMgrStep.actor}
        date={mode === 'approved' ? row.createDate : ''}
        time={mode === 'approved' ? plMgrStep.atShort : ''}
        pending={mode !== 'approved'}
      />
    </>
  );
}

// ── แผงข้อมูลของขั้นตอนที่เลือก (ส่วนที่ 1–4) ─────────────────
function StepPanel({
  row,
  steps,
  active,
  master = EMPTY_BOOKING_MASTER,
}: {
  row: BookingRow;
  steps: import('../data/bookingData').WorkflowStep[];
  active: number;
  master?: BookingMaster;
}) {
  const s = steps[active];
  const doneCount = steps.filter((x) => x.state === 'done').length;
  const filled = s.state === 'done';
  const rentNo = row.truckPL !== '—' && row.truckPL ? row.truckPL : '160/2';
  const operator = MOCK_STEP_DETAIL.pl.operator;

  // ── ส่วนที่ 1 (ผู้จอง) — แสดงข้อมูลจากฟอร์มสร้างใบจอง 9 หมวด แบบอ่านอย่างเดียว ──
  if (s.section === 1) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white px-5 py-3.5">
          <div className="text-[15px] font-bold text-gray-800">
            ส่วนที่ {s.section} — {s.title}
          </div>
          <div className="text-[11.5px] text-gray-400">{s.role} · ข้อมูลจากใบจอง (อ่านอย่างเดียว)</div>
        </div>
        <BookingFormSections row={row} readOnly master={master} />
        <ApproverBox
          title={active === 0 ? 'ผู้จัดทำเอกสาร' : 'ผู้ดำเนินการขั้นตอนนี้'}
          personLabel={active === 0 ? 'ผู้จัดทำ' : 'ผู้ดำเนินการ'}
          role={s.role}
          name={s.actor}
          date={row.createDate}
          time={s.atShort}
          pending={!filled}
        />
      </div>
    );
  }

  // เนื้อหาส่วนที่ 2–4
  let body: React.ReactNode;

  if (s.section === 2) {
    const plStep = steps[3];
    const plMgrStep = steps[4];
    const plMode: 'entry' | 'review' | 'approved' | 'na' =
      plMgrStep.state === 'done'
        ? 'approved'
        : plStep.state === 'done'
        ? 'review'
        : plStep.state === 'current'
        ? 'entry'
        : 'na';
    body =
      plMode === 'na' ? (
        <PendingNote step={s} />
      ) : (
        <PlTruckForm row={row} mode={plMode} plStep={plStep} plMgrStep={plMgrStep} />
      );
  } else if (s.section === 3) {
    body = filled ? (
      <>
        <RoField label="ยืนยันข้อมูลเบอร์รถ" value={MOCK_STEP_DETAIL.sv.confirm} wide />
        <ApproverBox
          title="ผู้ยืนยัน"
          personLabel="ผู้ยืนยัน"
          role={s.role}
          name={s.actor}
          date={row.createDate}
          time={s.atShort}
        />
      </>
    ) : (
      <PendingNote step={s} />
    );
  } else {
    // ส่วนที่ 4 — แจ้งจอง / อนุมัติจัดส่ง
    const canSummary = doneCount >= 6;
    body = (
      <>
        {filled ? (
          <>
            <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
              <RoField label="สถานะการจัดส่ง" value={MOCK_STEP_DETAIL.sales.deliveryStatus} wide />
              <RoField label="หมายเลขรถที่พร้อมใช้งาน" value={rentNo} />
              <RoField label="ชื่อ Operator ที่พร้อมทำงาน" value={operator} />
              <RoField label="วันที่พร้อมเริ่มทำงาน" value={row.startDate} />
            </div>
            <ApproverBox
              title="ผู้ยืนยันการจัดส่ง"
              personLabel="ผู้ยืนยันการจัดส่ง"
              role={s.role}
              name={s.actor}
              date={row.createDate}
              time={s.atShort}
            />
          </>
        ) : (
          <>
            <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/60 px-4 py-5 text-center text-[13px] text-amber-700">
              รอฝ่ายขาย / CR ยืนยันการจัดส่งสินค้า — ผู้รับผิดชอบ {s.actor}
            </div>
            <ApproverBox
              title="ผู้ยืนยันการจัดส่ง"
              personLabel="ผู้ยืนยันการจัดส่ง"
              role={s.role}
              name={s.actor}
              date=""
              time=""
              pending
            />
          </>
        )}

        {canSummary && (
          <div className="mt-5">
            <div className="mb-2.5 text-[12.5px] font-bold text-gray-600">
              สรุปสถานะจากฝ่าย PL / SV (ประกอบการตัดสินใจ)
            </div>
            <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-3">
              <MiniCard
                title="รายละเอียดที่ต้องการ (ผู้จอง)"
                accent="#b45309"
                head={row.machine}
                rows={[
                  ['วันที่เริ่มงาน', row.startDate],
                  ['ขนาดที่ต้องการ', MOCK_STEP_DETAIL.sales.sizeTon],
                  ['รุ่น / ปี', MOCK_STEP_DETAIL.sales.modelYear],
                ]}
              />
              <MiniCard
                title="ฝ่าย PL — หยอดเบอร์รถ"
                accent="#1a5fb4"
                head={MOCK_STEP_DETAIL.pl.machineStatus}
                rows={[
                  ['หมายเลขรถเช่า', rentNo],
                  ['สถานะรถ', MOCK_STEP_DETAIL.pl.carStatus],
                  ['วันที่สิ้นสุดสถานะ', row.endDate],
                  ['ชื่อ Operator', operator],
                ]}
              />
              <MiniCard title="ฝ่าย SV — ยืนยันเบอร์รถ" accent="#047857" head={MOCK_STEP_DETAIL.sv.confirm} rows={[]} />
            </div>
            <div className="mt-3.5 rounded-xl border border-gray-200 bg-slate-50 p-3.5">
              <div className="mb-2 text-[12px] font-bold text-gray-600">
                ข้อมูลรถ / Operator / วันที่พร้อมใช้งาน
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <RoField label="หมายเลขรถที่พร้อมใช้งาน" value={rentNo} />
                <RoField label="ชื่อ Operator ที่พร้อมทำงาน" value={operator} />
                <RoField label="วันที่พร้อมทำงาน" value={row.startDate} />
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-5 py-3.5">
        <div className="text-[15px] font-bold text-gray-800">
          ส่วนที่ {s.section} — {s.title}
        </div>
        <div className="text-[11.5px] text-gray-400">{s.role}</div>
      </div>
      <div className="p-5">{body}</div>
    </section>
  );
}

// ป้ายแจ้งว่ายังไม่ถึงขั้นตอนนี้
function PendingNote({ step }: { step: import('../data/bookingData').WorkflowStep }) {
  return (
    <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/60 px-4 py-6 text-center text-[13px] text-amber-700">
      ขั้นตอนนี้ยังไม่ได้ดำเนินการ — รอ {step.actor} ({step.role})
    </div>
  );
}

// ── แผงประวัติการเปลี่ยนแปลงใบจอง (จากใบเปลี่ยนแปลง) ──────────
// ช่องข้อมูลอ่านอย่างเดียวขนาดเล็ก (มีป้ายกำกับด้านบน) พร้อมโทนสีตามบทบาท
function CField({ label, value, tone = 'neutral' }: { label: string; value: string; tone?: 'neutral' | 'before' | 'after' }) {
  const box =
    tone === 'before'
      ? 'border-rose-200 bg-rose-50 text-rose-900'
      : tone === 'after'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
      : 'border-gray-200 bg-slate-50 text-gray-800';
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="text-[10.5px] font-medium text-gray-400">{label}</span>
      <div className={`truncate rounded-md border px-2.5 py-1.5 text-[12.5px] ${box}`} title={value}>
        {value || <span className="text-slate-300">—</span>}
      </div>
    </label>
  );
}

function RevBadge({ rev }: { rev: number }) {
  return (
    <span className="mono shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
      Rev {rev}
    </span>
  );
}

function ChangeHistoryPanel({ changes }: { changes: BookingChangeDoc[] }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3.5">
        <div className="text-[15px] font-bold text-gray-800">ประวัติการเปลี่ยนแปลงใบจอง</div>
        <span className="mono rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
          {changes.length} ใบ
        </span>
      </div>

      {changes.length === 0 ? (
        <div className="p-5 text-[12.5px] text-gray-400">ยังไม่มีประวัติการเปลี่ยนแปลง</div>
      ) : (
        <div className="flex flex-col gap-4 p-4">
          {changes.map((c) => (
            <article key={c.changeNo} className="rounded-xl border border-gray-200 p-3">
              {/* หัวใบเปลี่ยนแปลง: เลขที่ / วันที่แก้ไข / Rev */}
              <div className="flex flex-wrap items-end gap-2">
                <CField label="เลขที่ใบเปลี่ยนแปลง / Change No." value={c.changeNo} />
                <CField label="วันที่แก้ไข / Edit Date" value={c.editDate} />
                <div className="flex flex-col gap-1">
                  <span className="text-[10.5px] font-medium text-gray-400">Rev</span>
                  <div className="mono rounded-md border border-gray-200 bg-slate-50 px-2.5 py-1.5 text-center text-[12.5px] text-gray-800">
                    {c.rev}
                  </div>
                </div>
              </div>

              {/* หัวข้อกลุ่ม */}
              <div className="mt-3 border-l-4 border-accent bg-slate-50 px-3 py-1.5 text-[12.5px] font-bold text-gray-700">
                {c.groupLabel}
              </div>

              {/* รายการฟิลด์ที่แก้ */}
              <div className="mt-2 flex flex-col gap-3">
                {c.fields.map((f, i) => (
                  <div key={i} className="rounded-lg border border-gray-100 bg-white p-2.5">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="text-[12.5px] font-bold text-gray-800">{f.label}</span>
                      <RevBadge rev={f.rev} />
                    </div>
                    {f.detail !== undefined ? (
                      <CField label={f.detailLabel ?? 'รายละเอียดเพิ่มเติม / Detail'} value={f.detail} />
                    ) : (
                      <div className="flex flex-col gap-2">
                        <CField label={f.beforeLabel ?? 'เดิม / Before'} value={f.before ?? ''} tone="before" />
                        <CField label={f.afterLabel ?? 'ใหม่ / New'} value={f.after ?? ''} tone="after" />
                      </div>
                    )}
                    {f.extra && f.extra.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {f.extra.map((e, j) => (
                          <CField key={j} label={e.label} value={e.value} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* สาเหตุ / ผู้เปลี่ยนแปลง */}
              <div className="mt-3 flex flex-col gap-2">
                <CField label="สาเหตุ / Reason" value={c.reason} />
                <CField label="ผู้เปลี่ยนแปลง / Changed By" value={c.changedBy} />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

// ── เนื้อหาฟอร์มใบจอง 9 หมวด (ใช้ทั้งตอนสร้างใหม่ และตอนแสดงส่วนที่ 1 ในหน้าอนุมัติ) ──
// row=null + readOnly=false → โหมดกรอกสร้างใหม่ ; row=แถว + readOnly=true → แสดงข้อมูลจากใบจองแบบอ่านอย่างเดียว
function BookingFormSections({
  row,
  readOnly,
  master = EMPTY_BOOKING_MASTER,
}: {
  row: BookingRow | null;
  readOnly: boolean;
  master?: BookingMaster;
}) {
  const today = new Date().toLocaleDateString('en-GB');
  const roInput = readOnly ? 'cursor-not-allowed bg-gray-100 text-gray-500' : '';
  // ── ตัวเลือกจาก master data (แหล่งเดียวกับเอกสารพิมพ์ ; fallback = ค่าฟอร์มกระดาษ) ──
  const purposes = purposeOpts(master);
  const jobChars = jobCharacterOpts(master).map((o) => o.name);
  const presentWorks = presentWorkOpts(master).map((o) => o.name);
  const optDocs = documentBookingOpts(master).map((o) => o.name);
  const techConds = technicianConditionOpts(master).map((o) => o.name);
  return (
    <>
      <BkSection no={1} title="วัตถุประสงค์">
        <div className="flex flex-wrap items-center gap-4">
          <select
            defaultValue={row?.purpose}
            disabled={readOnly}
            className={`${INPUT_CLS} min-w-[280px] ${roInput}`}
          >
            <option>เลือกวัตถุประสงค์...</option>
            {purposes.map((o) => (
              <option key={o.id}>{o.name}</option>
            ))}
          </select>
          <div className="flex gap-4">
            <RadioL name="purpose" label="ตามแผน" disabled={readOnly} />
            <RadioL name="purpose" label="นอกแผน" disabled={readOnly} />
            <RadioL name="purpose" label="ฉุกเฉิน" disabled={readOnly} />
          </div>
        </div>
      </BkSection>

      <BkSection no={2} title="ข้อมูลลูกค้า">
        <div className="grid grid-cols-[2fr_1fr] gap-x-4 gap-y-3">
          <Field label="ชื่อลูกค้า" placeholder="ค้นหา / เลือกลูกค้า..." value={row?.customer} disabled={readOnly} />
          <SelectField label="ประเภทลูกค้า" options={['ลูกค้าเก่า', 'ลูกค้าใหม่']} disabled={readOnly} />
          <Field label="สถานที่ทำงาน" value={row?.site} disabled={readOnly} />
          <Field label="จังหวัด" disabled={readOnly} />
          <Field label="ชื่อผู้ติดต่อ" disabled={readOnly} />
          <Field label="เบอร์โทรศัพท์" mono disabled={readOnly} />
        </div>
      </BkSection>

      <BkSection no={3} title="เครื่องจักรที่ต้องการ">
        <div className="grid grid-cols-4 gap-x-4 gap-y-3">
          <SelectField
            label="ประเภทเครื่องจักรที่ต้องการ"
            options={['เลือกประเภท...', '03-25RC', '04-50CC', '07-20EX', '01-55TS']}
            value={row?.machine}
            disabled={readOnly}
            className="col-span-2"
          />
          <SelectField label="รุ่น" options={['ALL', 'TR250', 'TR500']} disabled={readOnly} />
          <SelectField label="ปี" options={['2569', '2568']} disabled={readOnly} />
          <Field label="ขนาดตันที่ต้องการ" placeholder="ตัน" mono disabled={readOnly} />
        </div>
      </BkSection>

      <BkSection no={4} title="รายละเอียดลักษณะงาน">
        <div className="flex flex-col gap-4">
          <Field label="รายละเอียดลักษณะงาน" value={row?.jobType} disabled={readOnly} />
          <CheckGroup title="เกี่ยวกับลักษณะงาน" items={jobChars} cols={3} disabled={readOnly} />
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <SelectField label="กลุ่มงาน" options={['เลือกกลุ่มงาน...']} disabled={readOnly} />
            <SelectField label="ประเภทงาน" options={['เลือกประเภทงาน...']} disabled={readOnly} />
          </div>
        </div>
      </BkSection>

      <BkSection no={5} title="ต้องการนำเสนองาน">
        <div className="mb-4 grid grid-cols-3 gap-x-4 gap-y-3">
          <SelectField label="ต้องการนำเสนองาน" options={['เลือก...', ...presentWorks]} disabled={readOnly} />
          <Field label="รวมระยะเวลาเช่า" value={row?.duration ?? '0'} mono disabled={readOnly} />
          <Field label="ชั่วโมงทำงานต่อวัน" mono disabled={readOnly} />
          <Field label="วันที่เริ่มทำงาน" value={row?.startDate ?? today} mono disabled={readOnly} />
          <Field label="วันที่สิ้นสุดการทำงาน" value={row?.endDate ?? today} mono disabled={readOnly} />
          <Field label="เวลาที่เริ่มทำงาน" value="08:00:00" mono disabled={readOnly} />
        </div>
        <div className="grid grid-cols-2 gap-3.5">
          <div className="rounded-xl border border-[#eef1f6] bg-slate-50 p-3.5">
            <div className="mb-2 text-xs font-bold text-slate-600">เงื่อนไขการใช้งาน อปต.</div>
            <div className="flex flex-col gap-2">
              <RadioL name="opt" label="รวม อปต." disabled={readOnly} />
              <RadioL name="opt" label="ไม่รวม อปต. / ใช้ อปต. หน้างาน" disabled={readOnly} />
            </div>
          </div>
          <div className="rounded-xl border border-[#eef1f6] bg-slate-50 p-3.5">
            <div className="mb-2 text-xs font-bold text-slate-600">เงื่อนไขการใช้น้ำมัน</div>
            <div className="flex flex-col gap-2">
              <RadioL name="fuel" label="รวมน้ำมันเชื้อเพลิง" disabled={readOnly} />
              <RadioL name="fuel" label="ไม่รวมน้ำมันเชื้อเพลิง" disabled={readOnly} />
              <Check label="เติมน้ำมันเต็มถัง" disabled={readOnly} />
            </div>
          </div>
        </div>
      </BkSection>

      <BkSection no={6} title="สำรวจหน้างาน">
        <SelectField label="สำรวจหน้างาน" options={['เลือก...', 'สำรวจแล้ว', 'ยังไม่สำรวจ']} disabled={readOnly} />
        <div className="mt-2 text-[11.5px] text-gray-400">
          กติกาสำรวจหน้างาน: งานวัน และ เครื่องจักรประเภท TB, CC / สำรวจหน้างาน ทางเข้า-ออก พื้นที่รถ TT ใช้ขนส่ง
          และรถเครนประกอบบูม
        </div>
      </BkSection>

      <BkSection no={7} title="หมวดเพิ่มเติม Operation">
        <div className="flex flex-col gap-3.5">
          <SelectField label="เกี่ยวกับเครื่องจักร" options={['เลือก...']} className="max-w-[360px]" disabled={readOnly} />
          <CheckGroup title="เกี่ยวกับ อปต." items={optDocs} titleClass="text-cyan-700" disabled={readOnly} />
          <CheckGroup title="เกี่ยวกับใบงาน" items={DOC_CHECKS} titleClass="text-cyan-700" disabled={readOnly} />
          <CheckGroup title="เกี่ยวกับช่าง" items={techConds} titleClass="text-cyan-700" disabled={readOnly} />
        </div>
      </BkSection>

      <BkSection no={8} title="หมวดเพิ่มเติมฝ่ายขาย · วงเงิน">
        <div className="mb-4 flex flex-wrap items-center gap-5">
          <RadioL name="credit" label="ไม่ติดวงเงิน" disabled={readOnly} />
          <RadioL name="credit" label="ติดวงเงิน" disabled={readOnly} />
          <label className="flex items-center gap-2.5 text-[12.5px] text-gray-500">
            สถานะเครดิต
            <input disabled={readOnly} className={`${INPUT_CLS} w-44 py-1.5 ${roInput}`} />
          </label>
        </div>
        <div className="grid grid-cols-3 gap-x-4 gap-y-3">
          <Field label="ราคาขาย" mono right disabled={readOnly} />
          <Field label="Credit Limit" mono right disabled={readOnly} />
          <Field label="Balance" mono right disabled={readOnly} />
          <Field label="Ordered" mono right disabled={readOnly} />
          <Field label="ใบจอง" mono right disabled={readOnly} />
          <label className="flex flex-col gap-1.5">
            <span className="text-[11.5px] font-semibold text-gray-500">Credit Remaining</span>
            <input
              disabled={readOnly}
              className={`${INPUT_CLS} mono w-full !bg-emerald-50 text-right font-semibold text-emerald-700 ${
                readOnly ? 'cursor-not-allowed' : ''
              }`}
            />
          </label>
        </div>
      </BkSection>

      <BkSection no={9} title="หมายเหตุอื่นๆ">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11.5px] font-semibold text-gray-500">Remark</span>
          <textarea rows={3} disabled={readOnly} className={`${INPUT_CLS} w-full resize-y ${roInput}`} />
        </label>
      </BkSection>
    </>
  );
}

export function Booking() {
  const { user, isAuthenticated, sessionExpired } = useAuth();
  const token = user?.token;

  // ── Master data ใบจอง (ตัวเลือกฟอร์ม + เอกสารพิมพ์ ใช้ชุดเดียวกัน) ──
  const { master: bookingMaster } = useBookingMasterData(token);

  const [view, setView] = useState<'list' | 'form'>('list');
  const [filterOpen, setFilterOpen] = useState(false);
  // ── เงื่อนไขค้นหา (server-side): draft = ที่กำลังกรอก, applied = ที่ยิงไป API แล้ว ──
  const [draft, setDraft] = useState<BookingFilterState>(EMPTY_FILTER);
  const [applied, setApplied] = useState<BookingQuery>({});
  const setF = (patch: Partial<BookingFilterState>) => setDraft((p) => ({ ...p, ...patch }));
  // แถวที่กำลังแก้ไข (null = สร้างใหม่)
  const [editing, setEditing] = useState<BookingRow | null>(null);
  // ── โหลดรายการใบจองจาก API ตามเงื่อนไขที่ apply แล้ว (data-fetching อยู่ใน hook) ──
  const { bookings, loading, error, reload } = useBookings(token, applied);
  // local copy เพื่อให้ยกเลิกแล้วเห็นผลทันที (จนกว่าจะต่อ API ยกเลิกจริง) — sync จาก hook
  const [data, setData] = useState<BookingRow[]>([]);
  useEffect(() => {
    setData(bookings);
  }, [bookings]);
  // แถวที่กำลังจะยกเลิก (เปิดกล่องยืนยัน)
  const [cancelTarget, setCancelTarget] = useState<BookingRow | null>(null);
  // แถวที่กำลังพิมพ์ (render เอกสารพิมพ์นอกจอ แล้วเรียก window.print)
  const [printing, setPrinting] = useState<BookingRow | null>(null);
  // เมื่อมีแถวที่จะพิมพ์: รอ render เอกสารเสร็จ → เปิด dialog พิมพ์ (พิมพ์ / บันทึกเป็น PDF) → เคลียร์เมื่อพิมพ์เสร็จ
  useEffect(() => {
    if (!printing) return;
    const onAfter = () => setPrinting(null);
    window.addEventListener('afterprint', onAfter);
    const t = window.setTimeout(() => window.print(), 80);
    return () => {
      window.removeEventListener('afterprint', onAfter);
      window.clearTimeout(t);
    };
  }, [printing]);
  // ขั้นตอน (ส่วนที่ 1–4) ที่เลือกดูในหน้าอนุมัติ
  const [activeStep, setActiveStep] = useState(0);
  // เปิด/ปิด แผงประวัติเอกสาร (Audit) ด้านข้าง — ซ่อนเพื่อให้ข้อมูลเต็มความกว้าง
  const [auditOpen, setAuditOpen] = useState(true);
  // เปิด/ปิด แผงประวัติการเปลี่ยนแปลงใบจอง (ใบเปลี่ยนแปลง) — ปุ่มซ่อน/แสดงของตัวเอง
  const [changesOpen, setChangesOpen] = useState(true);
  const formScrollRef = useRef<HTMLDivElement>(null);

  // ── สถานะตาราง (เหมือนหน้าแผนขาย): มุมมองคอลัมน์ / เรียง / กรอง / ความกว้าง ──
  const [preset, setPreset] = useState<BookingPresetKey>('all');
  const [sort, setSort] = useState<{ id: string; dir: 'asc' | 'desc' } | null>(null);
  const [filters, setFilters] = useState<Record<string, Set<string>>>({});
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [colWidths, setColWidths] = useState<Record<string, number>>({});
  const [pageSize, setPageSize] = useState<number | 'all'>(20);
  const [page, setPage] = useState(1);

  const today = new Date().toLocaleDateString('en-GB'); // dd/mm/yyyy

  // คอลัมน์ที่แสดงตามมุมมองที่เลือก
  const columns = useMemo(
    () => BOOKING_COLUMNS.filter((c) => BOOKING_COLUMN_PRESETS[preset].groups.includes(c.group)),
    [preset]
  );

  // ความกว้างจริงของคอลัมน์ (ค่าที่ปรับเอง ถ้าไม่มีใช้ค่าเริ่มต้น)
  const widthOf = React.useCallback((c: BookingColumn) => colWidths[c.id] ?? c.width, [colWidths]);

  // ลากขอบขวาหัวคอลัมน์เพื่อปรับความกว้าง
  const startResize = (colId: string, startWidth: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const onMove = (ev: MouseEvent) => {
      const w = Math.max(MIN_COL_WIDTH, startWidth + (ev.clientX - startX));
      setColWidths((prev) => ({ ...prev, [colId]: w }));
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  };

  // การค้นหาหลัก (BookingNo / ช่วงวันที่ / ลูกค้า / เบอร์รถ / สถานะ) ทำที่ฝั่ง API แล้ว
  // ตัวกรองรายคอลัมน์ + เรียง + แบ่งหน้า ยังทำบนชุดข้อมูลที่โหลดมา (client-side)
  const preFiltered = data;

  // ยิงค้นหา: apply เงื่อนไขที่กรอก → hook โหลดใหม่จาก API
  const runSearch = () => {
    setApplied({ ...draft });
    setPage(1);
  };
  // ล้างเงื่อนไขค้นหาทั้งหมดแล้วโหลดใหม่
  const resetSearch = () => {
    setDraft(EMPTY_FILTER);
    setApplied({});
    setPage(1);
  };

  // ใช้ตัวกรองรายคอลัมน์ โดยข้ามคอลัมน์ที่ระบุ (เพื่อคำนวณรายการตัวเลือกแบบ Excel)
  const applyFilters = React.useCallback(
    (list: BookingRow[], exceptId?: string) => {
      const active = Object.entries(filters).filter(([id]) => id !== exceptId);
      if (active.length === 0) return list;
      return list.filter((row) =>
        active.every(([id, set]) => {
          const c = BOOKING_COLUMNS.find((x) => x.id === id);
          return c ? set.has(bookingCellText(row, c)) : true;
        })
      );
    },
    [filters]
  );

  const rows = useMemo(() => {
    const filtered = applyFilters(preFiltered);
    if (!sort) return filtered;
    const c = BOOKING_COLUMNS.find((x) => x.id === sort.id);
    if (!c) return filtered;
    const sorted = [...filtered].sort((a, b) => compareBookings(a, b, c));
    return sort.dir === 'desc' ? sorted.reverse() : sorted;
  }, [preFiltered, applyFilters, sort]);

  // ค่าที่เลือกได้ในตัวกรองของคอลัมน์ (อิงรายการที่ผ่านตัวกรองคอลัมน์อื่นแล้ว — เหมือน Excel)
  const filterOptions = (c: BookingColumn) =>
    Array.from(new Set(applyFilters(preFiltered, c.id).map((r) => bookingCellText(r, c)))).sort((a, b) =>
      a.localeCompare(b, 'th')
    );

  // คลิกหัวคอลัมน์: ไม่เรียง → asc → desc → ไม่เรียง
  const toggleSort = (id: string) => {
    setSort((prev) => (prev?.id !== id ? { id, dir: 'asc' } : prev.dir === 'asc' ? { id, dir: 'desc' } : null));
    setPage(1);
  };

  const activeFilterCount = Object.keys(filters).length;

  const clearTableFilters = () => {
    setFilters({});
    setSort(null);
    setPage(1);
  };

  // ── แบ่งหน้า (20/50/100/ทั้งหมด) — มาตรฐานเดียวกับหน้าแผนขาย ──
  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(rows.length / pageSize));
  // กันหน้าเกินช่วงเมื่อจำนวนแถวลดลง (เช่น พิมพ์ค้นหาแล้วผลลัพธ์น้อยลง)
  const safePage = Math.min(page, totalPages);
  const displayRows = useMemo(
    () => (pageSize === 'all' ? rows : rows.slice((safePage - 1) * pageSize, safePage * pageSize)),
    [rows, pageSize, safePage]
  );
  const firstIndex = rows.length === 0 ? 0 : (pageSize === 'all' ? 0 : (safePage - 1) * pageSize) + 1;
  const lastIndex = pageSize === 'all' ? rows.length : (safePage - 1) * pageSize + displayRows.length;

  // เลขหน้าแบบย่อเมื่อหน้าเยอะ: 1 … 4 [5] 6 … 20
  const pageItems = useMemo<(number | 'gap')[]>(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const items: (number | 'gap')[] = [1];
    if (safePage > 3) items.push('gap');
    for (let p = Math.max(2, safePage - 1); p <= Math.min(totalPages - 1, safePage + 1); p++) items.push(p);
    if (safePage < totalPages - 2) items.push('gap');
    items.push(totalPages);
    return items;
  }, [totalPages, safePage]);

  // ข้อมูลขั้นตอนอนุมัติ + ประวัติ (คำนวณเมื่ออยู่โหมดแก้ไข/อนุมัติเท่านั้น)
  const progress = editing ? buildBookingProgress(editing) : null;

  // ปุ่มหลักของแถบล่าง — ปรับข้อความ/ไอคอนตามขั้นที่รอดำเนินการ
  const pendingStep =
    editing && progress?.nextApprover ? progress.steps[STATUS_STEPS_DONE[editing.docStatus]] : null;
  const pendingIsApprove = pendingStep ? /อนุมัติ|ทวนสอบ/.test(pendingStep.title) : false;
  const primaryLabel = !pendingStep
    ? 'อนุมัติใบจอง'
    : pendingIsApprove
    ? `อนุมัติ${pendingStep.section === 2 ? 'เบอร์รถ' : ''}`
    : `บันทึก${pendingStep.section === 2 ? 'เบอร์รถ' : ''}`;
  const PrimaryIcon = !pendingStep || pendingIsApprove ? IconCircleCheck : IconDeviceFloppy;

  const openForm = (row: BookingRow | null) => {
    // กันเคสเปิดฟอร์มสร้างใหม่ทิ้งไว้นานจน token หมดอายุ — เด้ง login ก่อน
    if (!row && !isAuthenticated) {
      sessionExpired();
      return;
    }
    setEditing(row);
    // เปิดที่ขั้นตอนปัจจุบัน (ขั้นที่รอดำเนินการ) โดยปริยาย
    if (row) setActiveStep(Math.min(STATUS_STEPS_DONE[row.docStatus], WORKFLOW_LEN - 1));
    setView('form');
  };

  const goSection = (no: number) => {
    const container = formScrollRef.current;
    const el = container?.querySelector(`#bk-sec${no}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const renderCell = (row: BookingRow, col: BookingColumn) => {
    const value = col.key === 'no' ? row.id : row[col.key as keyof BookingRow];
    switch (col.kind) {
      case 'status': {
        const m = stateColorOf(row.stateCode);
        const label = row.docStatusText || BOOKING_STATUS_META[row.docStatus].label;
        return (
          <span
            title={label}
            className="inline-flex max-w-full items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
            style={{ background: m.bg, color: m.color, borderColor: m.border }}
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: m.color }} />
            {label}
          </span>
        );
      }
      case 'book':
        return (
          <span className={`mono font-semibold ${row.flag === 'urgent' ? 'text-red-600' : 'text-accent'}`}>
            {row.book}
          </span>
        );
      case 'mono':
        return value === '—' || value === '' ? (
          <span className="mono text-slate-300">—</span>
        ) : (
          <span className="mono">{String(value)}</span>
        );
      case 'date':
        return <span className="text-slate-600">{String(value)}</span>;
      case 'reply':
        return row.reply === 'ready' ? (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
            <span className="h-1 w-1 rounded-full bg-emerald-600" />
            เครื่องจักรพร้อม
          </span>
        ) : (
          <span className="text-slate-300">—</span>
        );
      default:
        if (col.key === 'no') return <span className="text-xs text-slate-400">{row.id}</span>;
        if (col.key === 'customer') return <span className="font-semibold text-gray-900">{row.customer}</span>;
        if (value === undefined || value === null || value === '' || value === '—')
          return <span className="text-slate-300">—</span>;
        return <span>{String(value)}</span>;
    }
  };

  const rowClass = (row: BookingRow) => {
    if (row.flag === 'urgent') return 'bg-red-50 hover:bg-red-100 shadow-[inset_3px_0_0_#f87171]';
    if (row.flag === 'warn') return 'bg-orange-50 hover:bg-orange-100 shadow-[inset_3px_0_0_#fb923c]';
    return 'bg-white hover:bg-slate-50';
  };

  // สีพื้นของคอลัมน์จัดการที่ตรึงขวา — ต้องทึบให้ตรงกับสีแถว ไม่ให้เนื้อหาทะลุตอนเลื่อนแนวนอน
  const rowActionBg = (row: BookingRow) => {
    if (row.flag === 'urgent') return 'bg-red-50';
    if (row.flag === 'warn') return 'bg-orange-50';
    return 'bg-white';
  };

  // ยกเลิกใบจอง (mock — ตัดออกจาก local list)
  const confirmCancel = () => {
    if (cancelTarget) setData((prev) => prev.filter((r) => r.id !== cancelTarget.id));
    setCancelTarget(null);
  };

  return (
    <Layout title="ใบจองสินค้า" subtitle="Booking">
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
                ADD <span className="font-medium opacity-85">สร้างใบจองสินค้า</span>
              </button>
              <button
                onClick={() => exportBookingsToExcel(rows, columns)}
                disabled={rows.length === 0}
                title="ส่งออกรายการในตาราง (ตามที่ค้นหา/กรอง) เป็นไฟล์ Excel"
                className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12.5px] font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <IconFileSpreadsheet size={15} />
                Export Excel
              </button>
            </div>

            {/* ===== Search bar ===== */}
            <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-gray-200 bg-slate-50 px-5 py-2.5">
              <span className="text-xs font-bold text-slate-600">ค้นหาข้อมูล</span>
              <div className="flex w-[300px] max-w-[34vw] items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 transition focus-within:border-accent">
                <IconSearch size={16} className="shrink-0 text-gray-400" />
                <input
                  type="text"
                  value={draft.bookingNo}
                  onChange={(e) => setF({ bookingNo: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                  placeholder="เลขที่ใบจองสินค้า..."
                  className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-gray-400"
                />
              </div>
              <label className="flex cursor-pointer select-none items-center gap-2 text-[12.5px] text-slate-600">
                <input
                  type="checkbox"
                  checked={draft.showDataAll}
                  onChange={(e) => setF({ showDataAll: e.target.checked })}
                  className="h-[15px] w-[15px] cursor-pointer accent-[#1a5fb4]"
                />
                แสดงข้อมูลทั้งหมด
              </label>
              <button
                onClick={runSearch}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-lg bg-[#0b1220] px-3.5 py-2 text-[12.5px] font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <IconSearch size={14} stroke={2} />
                ค้นหาข้อมูล
              </button>
              <button
                onClick={resetSearch}
                className="rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-[12.5px] font-medium text-slate-700 transition hover:border-gray-300 hover:bg-slate-50"
              >
                ล้างเงื่อนไข
              </button>
              <button
                onClick={() => setFilterOpen((o) => !o)}
                className={`ml-auto flex items-center gap-1.5 text-[12.5px] font-semibold transition ${
                  filterOpen ? 'text-[#134a8e]' : 'text-accent hover:text-[#134a8e]'
                }`}
              >
                <IconFilter size={14} />
                ค้นหาข้อมูลเพิ่มเติม
              </button>
            </div>

            {/* ===== Advanced filter panel ===== */}
            {filterOpen && (
              <div className="form-slide-enter shrink-0 border-b border-gray-200 bg-white px-5 py-4">
                <div className="grid grid-cols-3 gap-x-5 gap-y-4">
                  {(
                    [
                      { label: 'วันที่เริ่มทำงาน', from: 'startWork', to: 'endWork' },
                      { label: 'วันที่สร้างเอกสาร', from: 'startCreateDoc', to: 'endCreateDoc' },
                      { label: 'วันที่ PL ระบุเบอร์รถ', from: 'startPL', to: 'endPL' },
                    ] as { label: string; from: keyof BookingFilterState; to: keyof BookingFilterState }[]
                  ).map((r) => (
                    <div key={r.label} className="rounded-xl border border-[#eef1f6] bg-slate-50 p-3">
                      <div className="mb-2 text-[11.5px] font-bold text-slate-600">{r.label}</div>
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={draft[r.from] as string}
                          onChange={(e) => setF({ [r.from]: e.target.value })}
                          className={`${INPUT_CLS} mono w-full !bg-white py-1.5 text-[12.5px]`}
                        />
                        <span className="text-xs text-gray-400">ถึง</span>
                        <input
                          type="date"
                          value={draft[r.to] as string}
                          onChange={(e) => setF({ [r.to]: e.target.value })}
                          className={`${INPUT_CLS} mono w-full !bg-white py-1.5 text-[12.5px]`}
                        />
                      </div>
                    </div>
                  ))}

                  <label className="flex flex-col gap-1.5">
                    <span className="text-[11.5px] font-semibold text-gray-500">รายชื่อลูกค้า</span>
                    <input
                      type="text"
                      value={draft.customerName}
                      onChange={(e) => setF({ customerName: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                      placeholder="พิมพ์ชื่อลูกค้า (ค้นแบบมีคำนี้อยู่)"
                      className={`${INPUT_CLS} w-full py-1.5 text-[12.5px]`}
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[11.5px] font-semibold text-gray-500">เบอร์รถ</span>
                    <input
                      type="text"
                      value={draft.machineID}
                      onChange={(e) => setF({ machineID: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                      placeholder="เช่น 10/28"
                      className={`${INPUT_CLS} mono w-full py-1.5 text-[12.5px]`}
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[11.5px] font-semibold text-gray-500">
                      สถานะเอกสาร <span className="font-normal text-[10.5px] text-gray-400">(WFStateID)</span>
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={draft.statusDoc}
                      onChange={(e) => setF({ statusDoc: e.target.value.replace(/[^0-9]/g, '') })}
                      onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                      placeholder="เช่น 9 (ว่าง = ทุกสถานะ)"
                      className={`${INPUT_CLS} mono w-full py-1.5 text-[12.5px]`}
                    />
                  </label>
                </div>

                <div className="mt-4 flex items-center justify-end gap-2">
                  <button
                    onClick={resetSearch}
                    className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-[12.5px] font-medium text-slate-600 transition hover:border-gray-300 hover:bg-slate-50"
                  >
                    ล้างเงื่อนไข
                  </button>
                  <button
                    onClick={runSearch}
                    disabled={loading}
                    className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-[12.5px] font-semibold text-white shadow-md shadow-accent/30 transition hover:bg-[#134a8e] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <IconSearch size={14} stroke={2} />
                    ค้นหาข้อมูล
                  </button>
                </div>
              </div>
            )}

            {/* ===== Column preset bar (มุมมองคอลัมน์ + legend + refresh) ===== */}
            <div className="flex shrink-0 flex-wrap items-center gap-3.5 border-b border-gray-200 bg-slate-50 px-5 py-2">
              <div className="flex items-center gap-2">
                <span className="text-[11.5px] font-semibold text-gray-500">คอลัมน์</span>
                <div className="flex gap-0.5 rounded-lg border border-gray-200 bg-[#eef1f6] p-1">
                  {(Object.keys(BOOKING_COLUMN_PRESETS) as BookingPresetKey[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => {
                        setPreset(key);
                        setPage(1);
                      }}
                      className={`rounded-md px-3 py-1 text-[12px] font-semibold transition ${
                        preset === key ? 'bg-[#0b1220] text-white shadow-sm' : 'text-slate-600 hover:text-gray-900'
                      }`}
                    >
                      {BOOKING_COLUMN_PRESETS[key].label}
                    </button>
                  ))}
                </div>
              </div>

              <span className="flex items-center gap-1.5 text-[11.5px] text-slate-500">
                <span className="h-2.5 w-2.5 rounded bg-red-300" />
                เกินกำหนด / เร่งด่วน
              </span>

              <div className="ml-auto flex items-center gap-3">
                {error && (
                  <span className="flex items-center gap-1.5 text-[11.5px] font-semibold text-red-600">
                    <IconAlertTriangle size={13} />
                    {error}
                  </span>
                )}
                {loading && (
                  <span className="flex items-center gap-1.5 text-[11.5px] text-slate-500">
                    <IconLoader2 size={13} className="animate-spin text-accent" />
                    กำลังโหลด...
                  </span>
                )}
                <button
                  onClick={reload}
                  disabled={loading}
                  title="โหลดข้อมูลใหม่"
                  className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-[12px] font-medium text-slate-600 transition hover:border-gray-300 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <IconRefresh size={13} />
                  รีเฟรช
                </button>
              </div>
            </div>

            {/* ===== Table meta bar (จำนวนแถว + ล้างตัวกรองตาราง + จำนวน/หน้า) ===== */}
            <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-gray-200 bg-slate-50 px-5 py-1.5 text-xs">
              <span className="text-slate-500">
                ตาราง <b className="text-gray-900">{rows.length}</b> รายการ
              </span>

              <button
                onClick={clearTableFilters}
                disabled={activeFilterCount === 0 && !sort}
                className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1 font-medium text-slate-600 transition hover:border-gray-300 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <IconFilterOff size={13} />
                ล้างตัวกรองตาราง
                {activeFilterCount > 0 && (
                  <span className="mono rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <label className="ml-auto flex items-center gap-1.5 text-slate-500">
                แสดง
                <select
                  value={String(pageSize)}
                  onChange={(e) => {
                    setPageSize(e.target.value === 'all' ? 'all' : Number(e.target.value));
                    setPage(1);
                  }}
                  className="cursor-pointer rounded-md border border-gray-200 bg-white px-2 py-1 text-[12px] font-semibold text-gray-700 outline-none transition focus:border-accent"
                >
                  {PAGE_SIZES.map((s) => (
                    <option key={s} value={String(s)}>
                      {s === 'all' ? 'ทั้งหมด' : s}
                    </option>
                  ))}
                </select>
                รายการ/หน้า
              </label>
            </div>

            {/* ===== Grid ===== */}
            <div className="relative min-h-0 flex-1">
              <div className="absolute inset-0 overflow-auto bg-white">
                <table className="w-full min-w-max border-separate border-spacing-0">
                  <thead>
                    <tr>
                      {columns.map((col, ci) => {
                        const sorted = sort?.id === col.id;
                        const filtered = !!filters[col.id];
                        const resizable = !!col.resizable;
                        const w = widthOf(col);
                        // คอลัมน์ค่อนไปทางขวา → กางกล่องกรองไปทางซ้าย กันหลุดขอบขวา
                        const filterAlign = ci >= columns.length - 3 ? 'right' : 'left';
                        return (
                          <th
                            key={col.id}
                            className="sticky top-0 z-20 whitespace-nowrap border-b-2 border-accent bg-[#0b1220] px-2 py-1.5 text-[11.5px] font-semibold text-slate-300"
                            style={{ width: w, minWidth: w, maxWidth: w }}
                          >
                            <div className="relative flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => toggleSort(col.id)}
                                title={`เรียงตาม ${col.label}`}
                                className={`flex min-w-0 flex-1 items-center gap-1 rounded px-1 py-1 transition hover:bg-white/10 ${
                                  col.align === 'right'
                                    ? 'justify-end'
                                    : col.align === 'center'
                                    ? 'justify-center'
                                    : 'justify-start'
                                } ${sorted ? 'text-white' : ''}`}
                              >
                                <span className="truncate">{col.label}</span>
                                {sorted ? (
                                  sort!.dir === 'asc' ? (
                                    <IconArrowUp size={12} stroke={2.5} className="shrink-0" />
                                  ) : (
                                    <IconArrowDown size={12} stroke={2.5} className="shrink-0" />
                                  )
                                ) : (
                                  <IconArrowsSort size={11} className="shrink-0 opacity-30" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => setOpenFilter((f) => (f === col.id ? null : col.id))}
                                title={`กรอง ${col.label}`}
                                className={`shrink-0 rounded p-1 transition hover:bg-white/10 ${
                                  filtered ? 'text-accent' : 'opacity-40 hover:opacity-100'
                                }`}
                              >
                                {filtered ? <IconFilterFilled size={12} /> : <IconFilter size={12} />}
                              </button>

                              {openFilter === col.id && (
                                <ColumnFilter
                                  options={filterOptions(col)}
                                  selected={filters[col.id]}
                                  align={filterAlign}
                                  onClose={() => setOpenFilter(null)}
                                  onApply={(next) => {
                                    setFilters((prev) => {
                                      const n = { ...prev };
                                      if (next) n[col.id] = next;
                                      else delete n[col.id];
                                      return n;
                                    });
                                    setPage(1);
                                  }}
                                />
                              )}
                            </div>

                            {/* ที่จับปรับความกว้าง (ลากขอบขวา) */}
                            {resizable && (
                              <span
                                onMouseDown={startResize(col.id, w)}
                                onClick={(e) => e.stopPropagation()}
                                title="ลากเพื่อปรับความกว้างคอลัมน์"
                                className="absolute right-0 top-0 z-30 h-full w-1.5 cursor-col-resize bg-transparent transition hover:bg-accent"
                              />
                            )}
                          </th>
                        );
                      })}
                      <th className="sticky right-0 top-0 z-30 whitespace-nowrap border-b-2 border-accent bg-[#0b1220] px-3 py-1.5 text-center text-[11.5px] font-semibold text-slate-300 shadow-[inset_6px_0_6px_-6px_rgba(0,0,0,0.5)]">
                        จัดการ
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 && (
                      <tr>
                        <td
                          colSpan={columns.length + 1}
                          className="h-24 border-b border-[#eef1f6] text-center text-[13px] text-slate-400"
                        >
                          {loading ? (
                            <span className="inline-flex items-center gap-2 text-slate-500">
                              <IconLoader2 size={16} className="animate-spin text-accent" />
                              กำลังโหลดรายการใบจอง...
                            </span>
                          ) : error ? (
                            <span className="inline-flex items-center gap-2 text-red-600">
                              <IconAlertTriangle size={16} />
                              {error}
                            </span>
                          ) : (
                            'ไม่พบรายการที่ตรงกับเงื่อนไข'
                          )}
                        </td>
                      </tr>
                    )}
                    {displayRows.map((row) => (
                      <tr key={row.id} className={`group transition-colors ${rowClass(row)}`}>
                        {columns.map((col) => {
                          const w = widthOf(col);
                          return (
                            <td
                              key={col.id}
                              className="h-12 overflow-hidden text-ellipsis whitespace-nowrap border-b border-[#eef1f6] px-3 text-[13px] text-slate-700"
                              style={{ width: w, minWidth: w, maxWidth: w, textAlign: col.align }}
                            >
                              {renderCell(row, col)}
                            </td>
                          );
                        })}
                        <td
                          className={`sticky right-0 z-10 h-12 whitespace-nowrap border-b border-[#eef1f6] border-l border-l-gray-200 px-2 shadow-[inset_6px_0_6px_-6px_rgba(0,0,0,0.12)] ${rowActionBg(row)}`}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              title="แก้ไข / อนุมัติใบจองนี้"
                              onClick={() => openForm(row)}
                              className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-white text-slate-600 transition hover:border-accent hover:bg-[#eef4fb] hover:text-accent"
                            >
                              <IconPencil size={15} />
                            </button>
                            <button
                              type="button"
                              title="พิมพ์ใบจองนี้ / บันทึกเป็น PDF"
                              onClick={() => setPrinting(row)}
                              className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-white text-slate-600 transition hover:border-gray-300 hover:bg-slate-100"
                            >
                              <IconPrinter size={15} />
                            </button>
                            <button
                              type="button"
                              title="ยกเลิกใบจองนี้"
                              onClick={() => setCancelTarget(row)}
                              className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-white text-red-600 transition hover:border-red-200 hover:bg-red-50"
                            >
                              <IconTrash size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ===== Pagination ===== */}
            {rows.length > 0 && (
              <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-gray-200 bg-white px-5 py-2">
                <span className="text-xs text-slate-500">
                  แสดง <b className="text-gray-900">{firstIndex}</b>–<b className="text-gray-900">{lastIndex}</b> จาก{' '}
                  <b className="text-gray-900">{rows.length}</b> รายการ
                </span>

                {totalPages > 1 && (
                  <div className="ml-auto flex items-center gap-1">
                    <button
                      onClick={() => setPage(1)}
                      disabled={safePage === 1}
                      title="หน้าแรก"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <IconChevronsLeft size={16} />
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={safePage === 1}
                      title="ก่อนหน้า"
                      className="flex h-8 items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 text-[12.5px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <IconChevronLeft size={15} />
                      ก่อนหน้า
                    </button>

                    {pageItems.map((p, i) =>
                      p === 'gap' ? (
                        <span key={`gap${i}`} className="px-1 text-xs text-slate-400">
                          …
                        </span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`mono flex h-8 min-w-[32px] items-center justify-center rounded-lg border px-2 text-[12.5px] font-semibold transition ${
                            p === safePage
                              ? 'border-accent bg-accent text-white'
                              : 'border-gray-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )}

                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={safePage === totalPages}
                      title="ถัดไป"
                      className="flex h-8 items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 text-[12.5px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ถัดไป
                      <IconChevronRight size={15} />
                    </button>
                    <button
                      onClick={() => setPage(totalPages)}
                      disabled={safePage === totalPages}
                      title="หน้าสุดท้าย"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <IconChevronsRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        ) : editing ? (
          <>
            {/* ===== Approval header ===== */}
            <div className="flex shrink-0 items-center gap-4 border-b border-gray-200 bg-white px-5 py-3.5">
              <button
                onClick={() => setView('list')}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white transition hover:bg-slate-100"
                aria-label="กลับไปหน้ารายการ"
              >
                <IconChevronLeft size={18} className="text-slate-700" />
              </button>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="mono text-[17px] font-bold leading-tight text-gray-900">{editing.book}</span>
                  {(() => {
                    const sc = stateColorOf(editing.stateCode);
                    return (
                      <span
                        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-[11.5px] font-semibold"
                        style={{ background: sc.bg, color: sc.color, borderColor: sc.border }}
                      >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: sc.color }} />
                        {editing.docStatusText || BOOKING_STATUS_META[editing.docStatus].label}
                      </span>
                    );
                  })()}
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
                    ประเภท: {editing.purpose}
                  </span>
                </div>
                <div className="mt-0.5 truncate text-xs text-gray-400">
                  ลูกค้า {editing.customer} · สร้างโดย {progress!.steps[0].actor} · {editing.createDate}
                </div>
              </div>
            </div>

            {/* ===== Approval body ===== */}
            <div className="min-h-0 flex-1 overflow-auto bg-[#f4f6fa] p-5">
              {/* Workflow stepper (เต็มความกว้างด้านบน) */}
              <section className="mb-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex flex-wrap items-center gap-3">
                  <div className="text-[13px] font-bold text-gray-700">ขั้นตอนการอนุมัติ (Workflow)</div>
                  <span className="mono rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
                    {Math.min(STATUS_STEPS_DONE[editing.docStatus], WORKFLOW_LEN)}/{WORKFLOW_LEN} ขั้น
                  </span>
                  <div className="ml-auto flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAuditOpen((o) => !o)}
                      title={auditOpen ? 'ซ่อนแผงประวัติเอกสาร' : 'แสดงแผงประวัติเอกสาร'}
                      aria-pressed={auditOpen}
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition ${
                        auditOpen
                          ? 'border-accent/30 bg-accent/5 text-accent hover:bg-accent/10'
                          : 'border-gray-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <IconHistory size={14} />
                      ประวัติเอกสาร
                      {auditOpen ? <IconEyeOff size={14} /> : <IconEye size={14} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setChangesOpen((o) => !o)}
                      title={changesOpen ? 'ซ่อนแผงประวัติการเปลี่ยนแปลง' : 'แสดงแผงประวัติการเปลี่ยนแปลง'}
                      aria-pressed={changesOpen}
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition ${
                        changesOpen
                          ? 'border-accent/30 bg-accent/5 text-accent hover:bg-accent/10'
                          : 'border-gray-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <IconHistory size={14} />
                      ประวัติการเปลี่ยนแปลง
                      {changesOpen ? <IconEyeOff size={14} /> : <IconEye size={14} />}
                    </button>
                  </div>
                </div>
                <div className="flex items-start">
                  {progress!.stages.map((st, i) => {
                    const isActive = progress!.steps[activeStep].section === st.section;
                    const sub =
                      st.state === 'rejected'
                        ? 'ตีกลับ'
                        : st.state === 'cancelled'
                        ? 'ยกเลิก'
                        : st.state === 'current'
                        ? 'กำลังดำเนินการ'
                        : st.state === 'todo'
                        ? 'รอดำเนินการ'
                        : st.lastActor;
                    return (
                      <React.Fragment key={st.section}>
                        {i > 0 && (
                          <div
                            className={`mt-4 h-0.5 w-4 shrink-0 ${
                              progress!.stages[i - 1].state === 'done' ? 'bg-emerald-400' : 'bg-gray-200'
                            }`}
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => setActiveStep(st.repStepIndex)}
                          title={`ดู${st.label}`}
                          className={`flex min-w-0 flex-1 flex-col items-center rounded-xl px-1 py-2 text-center transition ${
                            isActive ? 'bg-accent/5 ring-1 ring-accent/40' : 'hover:bg-slate-50'
                          }`}
                        >
                          <span
                            className={`flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-bold ${
                              st.state === 'done'
                                ? 'bg-emerald-500 text-white'
                                : st.state === 'rejected'
                                ? 'bg-red-500 text-white'
                                : st.state === 'cancelled'
                                ? 'bg-slate-400 text-white'
                                : st.state === 'current'
                                ? 'border-2 border-accent bg-white text-accent'
                                : 'border-2 border-gray-200 bg-white text-gray-400'
                            }`}
                          >
                            {st.state === 'done' ? (
                              <IconCheck size={16} stroke={3} />
                            ) : st.state === 'rejected' ? (
                              <IconArrowBackUp size={16} stroke={2.5} />
                            ) : st.state === 'cancelled' ? (
                              <IconAlertTriangle size={15} stroke={2.5} />
                            ) : (
                              i + 1
                            )}
                          </span>
                          <span
                            className={`mt-2 text-[12.5px] font-bold leading-tight ${
                              isActive
                                ? 'text-accent'
                                : st.state === 'done'
                                ? 'text-gray-800'
                                : st.state === 'rejected'
                                ? 'text-red-600'
                                : st.state === 'current'
                                ? 'text-gray-800'
                                : 'text-gray-400'
                            }`}
                          >
                            {st.label}
                          </span>
                          <span className="mt-0.5 text-[10.5px] leading-tight text-slate-500">{sub}</span>
                          {st.state === 'done' && st.lastAt && (
                            <span className="mono mt-0.5 text-[10px] text-gray-400">{st.lastAt}</span>
                          )}
                          <span className="mono mt-0.5 text-[10px] text-gray-400">
                            {st.doneCount}/{st.total} ขั้นย่อย
                          </span>
                        </button>
                      </React.Fragment>
                    );
                  })}
                </div>

                {progress!.termination && (
                  <div
                    className={`mt-4 flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[12.5px] font-semibold ${
                      progress!.termination === 'rejected'
                        ? 'border-red-200 bg-red-50 text-red-700'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    <IconAlertTriangle size={16} />
                    {progress!.termination === 'rejected'
                      ? 'เอกสารถูกตีกลับ (Mgr ผู้สร้างไม่อนุมัติ) — ขั้นตอนถัดไปถูกยกเลิกทั้งหมด'
                      : 'เอกสารถูกยกเลิก — ไม่สามารถดำเนินการขั้นตอนต่อไปได้'}
                  </div>
                )}
              </section>

              {/* แผงข้อมูลของขั้นตอนที่เลือก + แผงด้านข้าง (Audit / ประวัติการเปลี่ยนแปลง — ซ่อน/แสดงแยกกัน) */}
              <div
                className={
                  auditOpen || changesOpen
                    ? 'grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]'
                    : 'block'
                }
              >
                <StepPanel row={editing} steps={progress!.steps} active={activeStep} master={bookingMaster} />

                {(auditOpen || changesOpen) && (
                  <div className="flex flex-col gap-5 self-start">
                    {auditOpen && (
                      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <div className="border-b border-gray-200 px-5 py-3.5 text-[15px] font-bold text-gray-800">
                          ประวัติเอกสาร (Audit)
                        </div>
                        <ul className="flex flex-col gap-4 p-5">
                          {progress!.audit.length === 0 ? (
                            <li className="text-[12.5px] text-gray-400">ยังไม่มีประวัติการดำเนินการ</li>
                          ) : (
                            progress!.audit.map((a, i) => (
                              <li key={i} className="flex gap-3">
                                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                                <div>
                                  <div className="text-[13px] font-semibold text-gray-800">{a.step}</div>
                                  <div className="text-[11.5px] text-gray-400">
                                    {a.actor} · {a.at}
                                  </div>
                                </div>
                              </li>
                            ))
                          )}
                        </ul>
                      </section>
                    )}
                    {changesOpen && <ChangeHistoryPanel changes={MOCK_BOOKING_CHANGES} />}
                  </div>
                )}
              </div>
            </div>

            {/* ===== Approval action bar (ปุ่มอนุมัติ / ตีกลับ อยู่ที่เดียวด้านล่าง) ===== */}
            <div className="flex shrink-0 flex-wrap items-center gap-2.5 border-t border-gray-200 bg-white px-5 py-3.5">
              <div className="text-xs text-gray-500">
                {progress!.nextApprover ? (
                  <>
                    เอกสารนี้รอ <b className="text-gray-800">{progress!.nextApprover}</b> ({progress!.steps[
                      STATUS_STEPS_DONE[editing.docStatus]
                    ]?.title}) · การกระทำถัดไป:
                  </>
                ) : progress!.termination === 'rejected' ? (
                  <span className="font-semibold text-red-600">เอกสารถูกตีกลับแล้ว — ไม่สามารถดำเนินการต่อได้</span>
                ) : progress!.termination === 'cancelled' ? (
                  <span className="font-semibold text-slate-500">เอกสารถูกยกเลิกแล้ว — ไม่สามารถดำเนินการต่อได้</span>
                ) : (
                  'เอกสารนี้อนุมัติครบทุกขั้นแล้ว'
                )}
              </div>
              <button
                onClick={() => setView('list')}
                disabled={!progress!.nextApprover}
                className="ml-auto flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-5 py-2.5 text-[13px] font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <IconArrowBackUp size={16} />
                ตีกลับพร้อมเหตุผล
              </button>
              <button
                onClick={() => setView('list')}
                disabled={!progress!.nextApprover}
                className="flex items-center gap-1.5 rounded-lg bg-accent px-6 py-2.5 text-[13px] font-bold text-white shadow-md shadow-accent/30 transition hover:bg-[#134a8e] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <PrimaryIcon size={16} />
                {primaryLabel}
              </button>
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
                <div className="text-[17px] font-bold leading-tight text-gray-900">สร้างใบจองสินค้า</div>
                <div className="text-xs text-gray-400">{COMPANY.nameTh}</div>
              </div>
              <span className="ml-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11.5px] font-semibold text-amber-700">
                ส่วนที่ 1 · สำหรับฝ่ายขาย / ผู้จอง
              </span>
              <div className="ml-auto flex gap-2.5">
                <div className="flex flex-col items-end rounded-lg border border-gray-200 bg-slate-100 px-3.5 py-1">
                  <span className="text-[9.5px] tracking-wide text-gray-400">เลขที่ใบจอง</span>
                  <span className="mono text-sm font-bold text-gray-900">AUTO</span>
                </div>
                <div className="flex flex-col items-end rounded-lg border border-gray-200 bg-slate-100 px-3.5 py-1">
                  <span className="text-[9.5px] tracking-wide text-gray-400">วันที่สร้างใบจอง</span>
                  <span className="mono text-sm font-bold text-gray-900">{today}</span>
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
                key="new"
                className="flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto bg-[#f4f6fa] p-5 pb-10"
              >
                <BookingFormSections row={null} readOnly={false} master={bookingMaster} />
              </div>
            </div>

            {/* ===== Form action bar ===== */}
            <div className="flex shrink-0 items-center gap-2.5 border-t border-gray-200 bg-white px-5 py-3.5">
              <div className="text-xs text-gray-400">กรอกข้อมูลส่วนที่ 1 ให้ครบก่อนส่งอนุมัติ</div>
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

      {/* ===== กล่องยืนยันการยกเลิกใบจอง ===== */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="backdrop-fade-in absolute inset-0 bg-black/40"
            onClick={() => setCancelTarget(null)}
          />
          <div className="drawer-slide-in relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                <IconAlertTriangle size={20} />
              </span>
              <div className="text-[16px] font-bold text-gray-900">ยกเลิกใบจองสินค้า</div>
            </div>
            <p className="mb-5 text-[13px] leading-relaxed text-gray-500">
              ต้องการยกเลิกใบจองเลขที่ <b className="mono text-gray-800">{cancelTarget.book}</b> ใช่หรือไม่?
              การกระทำนี้ไม่สามารถย้อนกลับได้
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setCancelTarget(null)}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                ปิด
              </button>
              <button
                onClick={confirmCancel}
                className="flex items-center gap-1.5 rounded-lg bg-red-600 px-5 py-2 text-[13px] font-bold text-white shadow-md shadow-red-600/30 transition hover:bg-red-700"
              >
                <IconTrash size={15} />
                ยืนยันยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== เอกสารพิมพ์ใบจอง (portal ไปที่ body — เลี่ยงการถูก overflow ของการ์ดตัด, แสดงเฉพาะตอนพิมพ์) ===== */}
      {printing &&
        createPortal(
          <div className="print-root">
            <BookingPrintDoc row={printing} master={bookingMaster} />
          </div>,
          document.body
        )}
    </Layout>
  );
}
