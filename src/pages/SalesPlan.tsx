import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  IconTrendingUp,
  IconPlus,
  IconDeviceFloppy,
  IconCopy,
  IconTrash,
  IconRefresh,
  IconDatabase,
  IconFileSpreadsheet,
  IconPrinter,
  IconSearch,
  IconFilterOff,
  IconX,
  IconCheck,
  IconUser,
  IconCrane,
  IconCalendar,
  IconMapPin,
  IconLoader2,
  IconAlertTriangle,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconFileInvoice,
  IconFilter,
  IconFilterFilled,
  IconArrowUp,
  IconArrowDown,
  IconArrowsSort,
  IconPencil,
} from '@tabler/icons-react';
import { Layout } from '../components/layout/Layout';
import { ColumnFilter } from '../components/ui/ColumnFilter';
import { SearchSelect } from '../components/ui/SearchSelect';
import { SalesPlanLineApi } from '../types/salesPlan';
import { useAuth } from '../context/AuthContext';
import { fetchMachineModels } from '../api/masterData';
import { useMasterData, type MasterData } from '../hooks/useMasterData';
import { useSalesPlanDocs } from '../hooks/useSalesPlanDocs';
import {
  PlanFormState,
  toPlanForm,
  validatePlanForm,
  buildPlanFormOptions,
} from '../data/salesPlanForm';
import {
  SALE_STATUS_META,
  SALES_PLAN_COLUMNS,
  COLUMN_PRESETS,
  PresetKey,
  SalesPlanColumn,
  formatMoney,
  mapPlanStatus,
  cellText,
  compareLines,
  emptyLine,
  WORK_KIND_OPTIONS,
  QUOTATION_OPTIONS,
} from '../data/salesPlanData';

// ตัวเลือกจำนวนรายการที่แสดง
const PAGE_SIZES: (number | 'all')[] = [20, 50, 100, 'all'];

// คอลัมน์ที่ตรึงไว้ (freeze) — เลื่อนแนวนอนแล้วไม่หายไปตาม (6 คอลัมน์แรกส่วนหัว)
const STICKY_COLUMN_IDS = ['no', 'spid', 'createFDate', 'custName', 'deliveryAddress', 'city'];
// คอลัมน์ที่ปรับความกว้างได้ (ลากขอบขวาของหัวคอลัมน์)
const RESIZABLE_COLUMN_IDS = ['custName', 'deliveryAddress'];
const MIN_COL_WIDTH = 90;

// ความต้องการแผนขาย (mock จนกว่าจะต่อ API)
const PLAN_MONTH = 'กรกฎาคม 2569';

// ปุ่มแถบเครื่องมือแบบขอบเทา (ยัง placeholder รอต่อฟังก์ชันจริง)
function ToolButton({ icon, children, className = '' }: { icon: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <button
      type="button"
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-[12.5px] font-medium transition ${className}`}
    >
      {icon}
      {children}
    </button>
  );
}

const DRAWER_INPUT_CLS =
  'rounded-lg border border-gray-200 bg-slate-50 px-3 py-2 text-[13px] text-gray-800 outline-none transition focus:border-accent focus:bg-white disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500';

// ── คอนโทรลฟอร์ม "เพิ่มแผนขาย" (controlled) ─────────────────────
// คลาสขอบแดงเมื่อข้อมูลไม่ผ่านการตรวจสอบ
const INVALID_CLS = '!border-red-400 !bg-red-50 focus:!border-red-500';

// ป้ายกำกับ + ช่องกรอก
function FormRow({
  label,
  hint,
  required,
  span2,
  error,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  span2?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${span2 ? 'col-span-2' : ''}`} data-invalid={error ? 'true' : undefined}>
      <span className="flex items-center gap-1.5 text-[11.5px] font-semibold text-gray-500">
        {label}
        {required && <span className="text-red-500">*</span>}
        {hint && <span className="font-normal text-[10.5px] text-gray-400">{hint}</span>}
      </span>
      {children}
      {error && <span className="text-[11px] font-medium text-red-500">{error}</span>}
    </div>
  );
}

// combobox (select) ปกติ
function ComboBox({
  value,
  onChange,
  options,
  placeholder = '-- เลือก --',
  disabled,
  invalid,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`${DRAWER_INPUT_CLS} w-full cursor-pointer disabled:cursor-not-allowed ${invalid ? INVALID_CLS : ''}`}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// combobox ที่พิมพ์เองได้ (input + datalist) — เลือกจากรายการ หรือพิมพ์ค่าใหม่
function ComboInput({
  id,
  value,
  onChange,
  options,
  placeholder,
  invalid,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  invalid?: boolean;
}) {
  return (
    <>
      <input
        list={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${DRAWER_INPUT_CLS} mono w-full ${invalid ? INVALID_CLS : ''}`}
      />
      <datalist id={id}>
        {options.map((o) => (
          <option key={o} value={o} />
        ))}
      </datalist>
    </>
  );
}

// ช่องกรอกข้อความ
function TextBox({
  value,
  onChange,
  placeholder,
  type = 'text',
  mono,
  right,
  invalid,
  inputMode,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  mono?: boolean;
  right?: boolean;
  invalid?: boolean;
  inputMode?: 'text' | 'numeric' | 'decimal';
}) {
  return (
    <input
      type={type}
      inputMode={inputMode}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`${DRAWER_INPUT_CLS} w-full ${mono ? 'mono' : ''} ${right ? 'text-right' : ''} ${
        invalid ? INVALID_CLS : ''
      }`}
    />
  );
}

// ช่องกรอกจำนวนเงิน — จัดรูปแบบ 0,000.00 เมื่อออกจากช่อง
function MoneyBox({ value, onChange, invalid }: { value: string; onChange: (v: string) => void; invalid?: boolean }) {
  const [focused, setFocused] = useState(false);
  const display = useMemo(() => {
    if (focused) return value;
    if (value === '' || value == null) return '';
    const n = Number(value);
    return isNaN(n) ? value : n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [value, focused]);

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-gray-400">
        ฿
      </span>
      <input
        inputMode="decimal"
        value={display}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => {
          // รับเฉพาะตัวเลขและจุดทศนิยม
          const clean = e.target.value.replace(/[^0-9.]/g, '');
          onChange(clean);
        }}
        placeholder="0.00"
        className={`${DRAWER_INPUT_CLS} mono w-full pl-7 text-right ${invalid ? INVALID_CLS : ''}`}
      />
    </div>
  );
}

// ฟอร์มเพิ่ม/แก้ไขแผนขาย — เฉพาะฟิลด์ที่ต้องกรอก (ที่เหลือโปรแกรม insert ให้)
// NOTE: PlanFormState / toPlanForm / REQUIRED_FIELDS / validatePlanForm / buildPlanFormOptions
// ย้ายไปเป็น pure logic ที่ src/data/salesPlanForm.ts แล้ว
function PlanEntryForm({
  line,
  onClose,
  isEdit,
  token,
  master,
  currentSalemanId,
}: {
  line: SalesPlanLineApi;
  onClose: () => void;
  isEdit: boolean;
  token?: string;
  master: MasterData;
  currentSalemanId?: string | null;
}) {
  const [f, setF] = useState<PlanFormState>(() => toPlanForm(line));
  // ข้อผิดพลาดของการตรวจสอบ — field → ข้อความ
  const [errors, setErrors] = useState<Partial<Record<keyof PlanFormState, string>>>({});
  const set = <K extends keyof PlanFormState>(k: K, v: PlanFormState[K]) => {
    setF((prev) => ({ ...prev, [k]: v }));
    // แก้ไขช่องไหน ล้าง error ของช่องนั้นทันที
    setErrors((prev) => {
      if (!prev[k]) return prev;
      const n = { ...prev };
      delete n[k];
      return n;
    });
  };

  // ── ตัวเลือกจาก Master Data — memo ไว้ (สร้างใหม่เฉพาะเมื่อ master เปลี่ยน) ──
  const opts = useMemo(() => buildPlanFormOptions(master), [master]);
  const {
    salesman: salesmanOptions,
    planFrom: planFromOptions,
    leadSource: leadSourceOptions,
    customer: customerOptions,
    province: provinceOptions,
    machineType: machineTypeOptions,
    planStatus: planStatusOptions,
  } = opts;

  // เลือก "อื่นๆ" ของแหล่งที่มา → ตรวจจากชื่อของรายการที่เลือก
  const selectedLead = master.leadSources.find((l) => String(l.leadSourceID) === f.leadSource);
  const isOtherLead = !!selectedLead && /อื่น/.test(selectedLead.leadSourceNameTH || '');

  // ── รุ่น: โหลดจาก API เมื่อเลือกประเภทเครื่องจักร ──
  const [models, setModels] = useState<string[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  useEffect(() => {
    if (!f.machineTypeId) {
      setModels([]);
      return;
    }
    let alive = true;
    setModelsLoading(true);
    fetchMachineModels(f.machineTypeId, token)
      .then((rows) => {
        if (alive) setModels(rows.map((r) => r.machineModel1));
      })
      .catch(() => {
        if (alive) setModels([]);
      })
      .finally(() => {
        if (alive) setModelsLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [f.machineTypeId, token]);

  // ── preselect ชื่อพนักงานขายจาก salemanId ของผู้ใช้ที่ login (เฉพาะโหมดเพิ่ม) ──
  useEffect(() => {
    if (isEdit || f.salemanId || !currentSalemanId || master.salesmen.length === 0) return;
    const m = master.salesmen.find(
      (s) => s.code === currentSalemanId || s.nameShort === currentSalemanId
    );
    if (m) setF((prev) => ({ ...prev, salemanId: m.code }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [master.salesmen, currentSalemanId, isEdit]);

  // หน่วยของจำนวน ตามประเภทงานที่เลือก
  const unit = WORK_KIND_OPTIONS.find((w) => w.value === f.workKind)?.unit ?? '';

  const onSave = () => {
    const e = validatePlanForm(f, { isOtherLead });
    setErrors(e);
    if (Object.keys(e).length > 0) {
      // เลื่อนไปช่องแรกที่ผิด
      document.querySelector('[data-invalid="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    // UI-first: ยังไม่ POST จริง — ปิด modal
    onClose();
  };

  const errorCount = Object.keys(errors).length;

  return (
    <>
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
      {errorCount > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[12.5px] font-semibold text-red-700">
          <IconAlertTriangle size={16} className="shrink-0" />
          กรุณากรอกข้อมูลที่จำเป็นให้ครบ ({errorCount} รายการ)
        </div>
      )}

      {/* 1. ผู้จัดทำ & แหล่งที่มา */}
      <DrawerSection icon={<IconUser size={16} />} iconClass="bg-blue-50 text-accent" title="ผู้จัดทำ & แหล่งที่มา">
        <FormRow label="ชื่อพนักงานขาย" hint="(กรณี Mgr/เจ้าหน้าที่คีย์แทนฝ่ายขาย)" required span2 error={errors.salemanId}>
          <ComboBox
            value={f.salemanId}
            onChange={(v) => set('salemanId', v)}
            options={salesmanOptions}
            placeholder="-- เลือกพนักงานขาย --"
            invalid={!!errors.salemanId}
          />
        </FormRow>
        <FormRow label="แผนขายมาจากที่ไหน" required error={errors.planFrom}>
          <ComboBox
            value={f.planFrom}
            onChange={(v) => set('planFrom', v)}
            options={planFromOptions}
            invalid={!!errors.planFrom}
          />
        </FormRow>
        <FormRow label="แหล่งที่มาของข้อมูล" required error={errors.leadSource}>
          <ComboBox
            value={f.leadSource}
            onChange={(v) => set('leadSource', v)}
            options={leadSourceOptions}
            invalid={!!errors.leadSource}
          />
        </FormRow>
        {isOtherLead && (
          <FormRow label="ระบุแหล่งที่มา (อื่นๆ)" required span2 error={errors.leadSourceOther}>
            <TextBox
              value={f.leadSourceOther}
              onChange={(v) => set('leadSourceOther', v)}
              placeholder="ระบุแหล่งที่มาของข้อมูล"
              invalid={!!errors.leadSourceOther}
            />
          </FormRow>
        )}
      </DrawerSection>

      {/* 2. ลูกค้า */}
      <DrawerSection icon={<IconMapPin size={16} />} iconClass="bg-blue-50 text-accent" title="ลูกค้า & สถานที่">
        <FormRow label="ชื่อลูกค้า" hint="(ค้นหาด้วยชื่อ หรือรหัสลูกค้า)" required span2 error={errors.custAccount}>
          <SearchSelect
            value={f.custAccount}
            onChange={(v) => set('custAccount', v)}
            options={customerOptions}
            placeholder="พิมพ์ชื่อ หรือรหัสลูกค้าเพื่อค้นหา..."
            emptyText="ไม่พบลูกค้าที่ค้นหา"
            invalid={!!errors.custAccount}
          />
        </FormRow>
        <FormRow label="สถานที่ทำงาน" required span2 error={errors.deliveryAddress}>
          <TextBox
            value={f.deliveryAddress}
            onChange={(v) => set('deliveryAddress', v)}
            placeholder="ระบุสถานที่ปฏิบัติงาน"
            invalid={!!errors.deliveryAddress}
          />
        </FormRow>
        <FormRow label="จังหวัด" required error={errors.city}>
          <ComboBox
            value={f.city}
            onChange={(v) => set('city', v)}
            options={provinceOptions}
            placeholder="-- เลือกจังหวัด --"
            invalid={!!errors.city}
          />
        </FormRow>
      </DrawerSection>

      {/* 3. เครื่องจักร */}
      <DrawerSection icon={<IconCrane size={16} />} iconClass="bg-amber-50 text-amber-700" title="เครื่องจักรที่ต้องการ">
        <FormRow label="ประเภทเครื่องจักรที่ต้องการ" required error={errors.machineTypeId}>
          <ComboBox
            value={f.machineTypeId}
            onChange={(v) => {
              set('machineTypeId', v);
              set('mark', ''); // เปลี่ยนประเภท → ล้างรุ่นเดิม
            }}
            options={machineTypeOptions}
            placeholder="-- เลือกประเภท --"
            invalid={!!errors.machineTypeId}
          />
        </FormRow>
        <FormRow
          label="รุ่น"
          hint={
            !f.machineTypeId
              ? '(เลือกประเภทก่อน)'
              : modelsLoading
              ? '(กำลังโหลด...)'
              : `(${models.length} รุ่น)`
          }
          required
          error={errors.mark}
        >
          <ComboBox
            value={f.mark}
            onChange={(v) => set('mark', v)}
            options={models.map((o) => ({ value: o, label: o }))}
            placeholder={modelsLoading ? 'กำลังโหลด...' : '-- เลือกรุ่น --'}
            disabled={!f.machineTypeId || modelsLoading}
            invalid={!!errors.mark}
          />
        </FormRow>
        <FormRow label="การเลือกใช้เครื่องจักร" span2>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-gray-200 bg-slate-50 px-3.5 py-2.5">
            <label className="flex cursor-pointer items-center gap-2 text-[13px] text-slate-700">
              <input
                type="radio"
                name="useMode"
                checked={f.useMode === 'specified'}
                onChange={() => set('useMode', 'specified')}
                className="h-4 w-4 cursor-pointer accent-[#1a5fb4]"
              />
              ใช้เครื่องจักรที่ระบุเท่านั้น
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-[13px] text-slate-700">
              <input
                type="radio"
                name="useMode"
                checked={f.useMode === 'interchangeable'}
                onChange={() => set('useMode', 'interchangeable')}
                className="h-4 w-4 cursor-pointer accent-[#1a5fb4]"
              />
              ใช้รถทดแทนได้
            </label>
          </div>
        </FormRow>
        {f.useMode === 'interchangeable' && (
          <FormRow label="ขนาดที่สามารถใช้ทดแทนได้" required span2 error={errors.interchangeableRemarks}>
            <TextBox
              value={f.interchangeableRemarks}
              onChange={(v) => set('interchangeableRemarks', v)}
              placeholder="เช่น 25 ตัน ขึ้นไป / รุ่นเทียบเท่า"
              invalid={!!errors.interchangeableRemarks}
            />
          </FormRow>
        )}
      </DrawerSection>

      {/* 4. รายละเอียดงาน */}
      <DrawerSection icon={<IconCalendar size={16} />} iconClass="bg-violet-50 text-violet-700" title="รายละเอียดงาน">
        <FormRow label="สถานะการขาย" required span2 error={errors.planStatus}>
          <ComboBox
            value={f.planStatus}
            onChange={(v) => set('planStatus', v)}
            options={planStatusOptions}
            placeholder="-- เลือกสถานะการขาย --"
            invalid={!!errors.planStatus}
          />
        </FormRow>
        <FormRow label="ประเภทงาน" required error={errors.workKind}>
          <ComboBox
            value={f.workKind}
            onChange={(v) => set('workKind', v)}
            options={WORK_KIND_OPTIONS.map((w) => ({ value: w.value, label: w.value }))}
            invalid={!!errors.workKind}
          />
        </FormRow>
        <FormRow label="จำนวน" required error={errors.period}>
          <div className="flex items-center gap-2">
            <TextBox
              value={f.period}
              onChange={(v) => set('period', v.replace(/[^0-9]/g, ''))}
              placeholder="0"
              mono
              right
              inputMode="numeric"
              invalid={!!errors.period}
            />
            <span className="shrink-0 text-[12.5px] font-semibold text-slate-500">{unit || 'หน่วย'}</span>
          </div>
        </FormRow>
        <FormRow label="วันที่ต้องการใช้งาน" required error={errors.startFromDate}>
          <TextBox
            value={f.startFromDate}
            onChange={(v) => set('startFromDate', v)}
            type="date"
            mono
            invalid={!!errors.startFromDate}
          />
        </FormRow>
        <FormRow label="ลักษณะงาน" required error={errors.jobDetail}>
          <TextBox
            value={f.jobDetail}
            onChange={(v) => set('jobDetail', v)}
            placeholder="ลักษณะงานโดยย่อ"
            invalid={!!errors.jobDetail}
          />
        </FormRow>
        <FormRow label="หมายเหตุ / เงื่อนไขการขาย" span2>
          <textarea
            value={f.remark}
            onChange={(e) => set('remark', e.target.value)}
            rows={2}
            placeholder="เงื่อนไขการขาย / ข้อตกลงเพิ่มเติม"
            className={`${DRAWER_INPUT_CLS} w-full resize-y`}
          />
        </FormRow>
      </DrawerSection>

      {/* 5. มูลค่า & เอกสาร */}
      <DrawerSection icon={<IconFileInvoice size={16} />} iconClass="bg-emerald-50 text-emerald-600" title="มูลค่า & เอกสารอ้างอิง">
        <FormRow label="มูลค่าแผนขาย" hint="(บาท)" required span2 error={errors.planValue}>
          <MoneyBox value={f.planValue} onChange={(v) => set('planValue', v)} invalid={!!errors.planValue} />
        </FormRow>
        <FormRow label="เลขที่ใบเสนอราคา" hint="(เลือก หรือพิมพ์เอง)">
          <ComboInput
            id="quotation-list"
            value={f.quotationId}
            onChange={(v) => set('quotationId', v)}
            options={QUOTATION_OPTIONS}
            placeholder="QT-25xx-xxxx"
          />
        </FormRow>
        <FormRow label="เลขที่ PO">
          <TextBox value={f.poid} onChange={(v) => set('poid', v)} placeholder="PO-..." mono />
        </FormRow>
      </DrawerSection>
    </div>

    {/* ===== Footer ===== */}
    <div className="flex shrink-0 items-center gap-2.5 border-t border-gray-200 bg-white px-5 py-3.5">
      {errorCount > 0 && (
        <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-red-600">
          <IconAlertTriangle size={15} />
          ยังกรอกไม่ครบ {errorCount} รายการ
        </span>
      )}
      <button
        onClick={onClose}
        className="ml-auto rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-100"
      >
        ยกเลิก
      </button>
      <button
        onClick={onSave}
        className="flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-[13px] font-bold text-white shadow-md shadow-accent/30 transition hover:bg-[#134a8e]"
      >
        <IconCheck size={15} stroke={2.1} />
        {isEdit ? 'บันทึกการแก้ไข' : 'บันทึกแผนขาย'}
      </button>
    </div>
    </>
  );
}

function DrawerSection({
  icon,
  iconClass,
  title,
  children,
}: {
  icon: React.ReactNode;
  iconClass: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${iconClass}`}>{icon}</div>
        <h3 className="text-sm font-bold text-gray-800">{title}</h3>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">{children}</div>
    </section>
  );
}

export function SalesPlan() {
  const { user, isAuthenticated, sessionExpired } = useAuth();
  const token = user?.token;

  const [preset, setPreset] = useState<PresetKey>('default');
  const [search, setSearch] = useState('');
  const [showClosed, setShowClosed] = useState(false);
  const [pageSize, setPageSize] = useState<number | 'all'>(20);
  const [page, setPage] = useState(1);
  // เรียงลำดับ (คลิกหัวคอลัมน์ วน asc → desc → ไม่เรียง)
  const [sort, setSort] = useState<{ id: string; dir: 'asc' | 'desc' } | null>(null);
  // ตัวกรองรายคอลัมน์แบบ Excel — columnId → ค่าที่เลือก
  const [filters, setFilters] = useState<Record<string, Set<string>>>({});
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  // แถวที่คลิกเลือกไว้ (โฟกัสเพื่ออ่านข้อมูลง่ายขึ้น) — ไม่เกี่ยวกับการเปิดฟอร์มแก้ไข
  const [focusedRow, setFocusedRow] = useState<number | null>(null);
  // คีย์ของแถวที่ลบออกจากมุมมองแล้ว (ยังไม่ผูก API — ซ่อนในหน้าจอก่อน)
  const [deletedKeys, setDeletedKeys] = useState<Set<string>>(new Set());
  // ความกว้างคอลัมน์ที่ถูกปรับเอง (override) — id → px
  const [colWidths, setColWidths] = useState<Record<string, number>>({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState<SalesPlanLineApi>(() => emptyLine(''));
  const [formKey, setFormKey] = useState(0);

  // ── เอกสารแผนขาย + บรรทัด (data-fetching อยู่ใน hook) ──
  const {
    plans,
    plansLoading,
    plansError,
    selectedPlanId,
    rows: apiRows,
    linesLoading,
    linesError,
    selectPlan,
  } = useSalesPlanDocs(token);

  // ── Master Data สำหรับฟอร์มเพิ่มแผนขาย (data-fetching อยู่ใน hook) ──
  const { master, error: masterError, reload: reloadMaster } = useMasterData(token);

  // เลือกเลขที่เอกสาร → โหลดบรรทัด (ใน hook) + reset สถานะตาราง (ของ UI นี้)
  const onSelectPlan = (planId: string) => {
    selectPlan(planId);
    setSelectedId(null);
    setFocusedRow(null);
    setDeletedKeys(new Set());
    setPage(1);
    setSort(null);
    setFilters({});
  };

  // ลบแถวออกจากมุมมอง (ยังไม่ผูก API — ยืนยันก่อนแล้วซ่อนในหน้าจอ)
  const deleteRow = (line: SalesPlanLineApi) => {
    if (!window.confirm(`ต้องการลบแถวนี้ออกจากรายการ?\n${line.custName || line.spid || ''}`)) return;
    setDeletedKeys((prev) => {
      const next = new Set(prev);
      next.add(rowKey(line));
      return next;
    });
  };

  // ชุดข้อมูล: ถ้ายังไม่เลือกเลขที่เอกสาร = ว่าง (ไม่มี mock) ; เลือกแล้วใช้ข้อมูลจาก API
  const baseData = apiRows ?? [];

  const columns = useMemo(
    () => SALES_PLAN_COLUMNS.filter((c) => COLUMN_PRESETS[preset].groups.includes(c.group)),
    [preset]
  );

  // ความกว้างจริงของคอลัมน์ (ค่าที่ปรับเอง ถ้าไม่มีใช้ค่าเริ่มต้น)
  const widthOf = React.useCallback(
    (c: SalesPlanColumn) => colWidths[c.id] ?? c.width,
    [colWidths]
  );

  // ระยะ left ของคอลัมน์ที่ตรึง (สะสมความกว้างของคอลัมน์ตรึงก่อนหน้า)
  const stickyLeft = useMemo(() => {
    const map: Record<string, number> = {};
    let acc = 0;
    for (const c of columns) {
      if (!STICKY_COLUMN_IDS.includes(c.id)) break; // คอลัมน์ตรึงอยู่ต้น ๆ ต่อเนื่องกัน
      map[c.id] = acc;
      acc += colWidths[c.id] ?? c.width;
    }
    return map;
  }, [columns, colWidths]);

  // id ของคอลัมน์ตรึงตัวสุดท้าย (ใส่เส้น/เงาแบ่งจากคอลัมน์ที่เลื่อนได้)
  const lastStickyId = useMemo(() => {
    let last = '';
    for (const c of columns) {
      if (!STICKY_COLUMN_IDS.includes(c.id)) break;
      last = c.id;
    }
    return last;
  }, [columns]);

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

  // ล้างเฉพาะตัวกรอง/การเรียงของตาราง
  const clearTableFilters = () => {
    setFilters({});
    setSort(null);
    setPage(1);
  };

  // คีย์แถวที่คงที่ (ไม่ผูกกับหน้า/การเรียง) ใช้กับการลบแถวออกจากมุมมอง
  const rowKey = (l: SalesPlanLineApi) => `${l.spid || l.planId}-${l.recNo}`;

  // ผ่านตัวกรองพื้นฐาน (สถานะปิด + ค้นหารวม) — ยังไม่รวมตัวกรองรายคอลัมน์
  const preFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return baseData.filter((r) => {
      const st = mapPlanStatus(r.planStatus);
      if (!showClosed && (st === 'won' || st === 'lost')) return false;
      if (!q) return true;
      return (
        (r.custName || '').toLowerCase().includes(q) ||
        (r.spid || '').toLowerCase().includes(q) ||
        (r.planId || '').toLowerCase().includes(q)
      );
    });
  }, [search, showClosed, baseData]);

  // ใช้ตัวกรองรายคอลัมน์ โดยข้ามคอลัมน์ที่ระบุ (เพื่อคำนวณรายการตัวเลือกแบบ Excel)
  const applyFilters = React.useCallback(
    (list: SalesPlanLineApi[], exceptId?: string) => {
      const active = Object.entries(filters).filter(([id]) => id !== exceptId);
      if (active.length === 0) return list;
      return list.filter((line) =>
        active.every(([id, set]) => {
          const c = SALES_PLAN_COLUMNS.find((x) => x.id === id);
          return c ? set.has(cellText(line, c)) : true;
        })
      );
    },
    [filters]
  );

  const rows = useMemo(() => {
    const visible = deletedKeys.size ? preFiltered.filter((l) => !deletedKeys.has(rowKey(l))) : preFiltered;
    const filtered = applyFilters(visible);
    if (!sort) return filtered;
    const c = SALES_PLAN_COLUMNS.find((x) => x.id === sort.id);
    if (!c) return filtered;
    const sorted = [...filtered].sort((a, b) => compareLines(a, b, c));
    return sort.dir === 'desc' ? sorted.reverse() : sorted;
  }, [preFiltered, applyFilters, sort, deletedKeys]);

  // ค่าที่เลือกได้ในตัวกรองของคอลัมน์ (อิงรายการที่ผ่านตัวกรองคอลัมน์อื่นแล้ว — เหมือน Excel)
  const filterOptions = (c: SalesPlanColumn) =>
    Array.from(new Set(applyFilters(preFiltered, c.id).map((l) => cellText(l, c)))).sort((a, b) =>
      a.localeCompare(b, 'th')
    );

  // คลิกหัวคอลัมน์: ไม่เรียง → asc → desc → ไม่เรียง
  const toggleSort = (id: string) => {
    setSort((prev) => (prev?.id !== id ? { id, dir: 'asc' } : prev.dir === 'asc' ? { id, dir: 'desc' } : null));
    setPage(1);
  };

  const activeFilterCount = Object.keys(filters).length;

  // แบ่งหน้า (20/50/100/ทั้งหมด)
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

  // ยอดรวมคิดจากชุดข้อมูลปัจจุบัน (ไม่ผูกกับตัวกรอง) ตามดีไซน์
  const totals = useMemo(() => {
    const sum = (pick: (r: SalesPlanLineApi) => number) => baseData.reduce((s, r) => s + (pick(r) || 0), 0);
    return {
      plan: sum((r) => r.planValue),
      sold: sum((r) => r.actualValue),
      remain: sum((r) => r.subValue),
      lost: sum((r) => r.lostSale),
    };
  }, [baseData]);

  const openRow = (line: SalesPlanLineApi, index: number) => {
    setSelectedId(index);
    setForm(line);
    setFormKey((k) => k + 1);
    setDrawerOpen(true);
  };
  const openAdd = () => {
    // กันเคสเปิดหน้าไว้นานจน token หมดอายุ — เด้ง login ก่อน ไม่ให้เสียเวลากรอกฟอร์ม
    if (!isAuthenticated) {
      sessionExpired();
      return;
    }
    setSelectedId(null);
    setForm(emptyLine(selectedPlanId));
    setFormKey((k) => k + 1);
    setDrawerOpen(true);
  };

  const renderCell = (line: SalesPlanLineApi, col: SalesPlanColumn) => {
    const value = line[col.key];
    const text = cellText(line, col);
    const blank = <span className="text-slate-300">—</span>;

    switch (col.kind) {
      case 'status': {
        if (!value) return blank;
        const m = SALE_STATUS_META[mapPlanStatus(String(value))];
        return (
          <span
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11.5px] font-semibold"
            style={{ background: m.bg, color: m.color, borderColor: m.border }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: m.color }} />
            {text}
          </span>
        );
      }
      case 'plan': {
        if (!text) return blank;
        const lost = mapPlanStatus(line.planStatus) === 'lost';
        return <span className={`mono font-semibold ${lost ? 'text-red-600' : 'text-accent'}`}>{text}</span>;
      }
      case 'dept': {
        if (!text) return blank;
        const teal = text === 'WD';
        return (
          <span
            className={`inline-block rounded-md border px-2 py-0.5 text-[11px] font-bold ${
              teal ? 'border-cyan-200 bg-cyan-50 text-cyan-700' : 'border-indigo-200 bg-indigo-50 text-indigo-700'
            }`}
          >
            {text}
          </span>
        );
      }
      case 'tag': {
        if (!text) return blank;
        const insert = /insert/i.test(text);
        return (
          <span
            className={`inline-block rounded-md px-2 py-0.5 text-[11.5px] font-semibold ${
              insert ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {text}
          </span>
        );
      }
      case 'money': {
        const num = Number(value) || 0;
        const green = col.id === 'actualValueStd' || col.id === 'actualValueG2';
        return (
          <span className={`mono font-semibold ${green ? (num ? 'text-emerald-700' : 'text-slate-300') : 'text-gray-900'}`}>
            {formatMoney(num)}
          </span>
        );
      }
      case 'num':
        return text ? <span className="mono">{text}</span> : blank;
      case 'mono':
        return text ? <span className="mono">{text}</span> : blank;
      case 'date':
        return text && text !== '—' ? <span className="text-slate-600">{text}</span> : blank;
      case 'check':
        return value ? (
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
            <IconCheck size={13} stroke={3} />
          </span>
        ) : (
          <span className="text-slate-300">–</span>
        );
      default:
        if (col.key === 'custName') return <span className="font-semibold text-gray-900">{text || '—'}</span>;
        return text ? <span>{text}</span> : blank;
    }
  };

  return (
    <Layout title="แผนขาย" subtitle="Sales Plan">
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* ===== Action toolbar ===== */}
      <div className="flex shrink-0 flex-wrap items-center gap-2.5 border-b border-gray-200 bg-white px-5 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex flex-col rounded-lg border border-gray-200 bg-gray-50 px-3 py-1">
            <span className="text-[9.5px] tracking-wide text-gray-400">เลขที่เอกสาร</span>
            <div className="flex items-center gap-1.5">
              <select
                value={selectedPlanId}
                onChange={(e) => onSelectPlan(e.target.value)}           
                disabled={plansLoading || !!plansError}
                title={plansError ?? 'เลือกเลขที่เอกสารแผนขาย'}
                className="mono min-w-[150px] max-w-[220px] cursor-pointer rounded-md border border-gray-200 bg-white px-2 py-0.5 text-xs font-semibold text-gray-800 outline-none transition focus:border-accent disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="">
                  {plansLoading
                    ? 'กำลังโหลด...'
                    : plansError
                    ? 'โหลดไม่สำเร็จ'
                    : '-- เลือกเลขที่เอกสาร --'}
                </option>
                {plans.map((p) => (
                  <option key={p.planId} value={p.planId}>
                    {p.planId}
                  </option>
                ))}
              </select>
              {linesLoading && <IconLoader2 size={14} className="animate-spin text-accent" />}
              {plansError && <IconAlertTriangle size={14} className="text-red-500" />}
            </div>
          </div>
          <div className="flex flex-col rounded-lg border border-gray-200 bg-gray-50 px-3 py-1">
            <span className="text-[9.5px] tracking-wide text-gray-400">ความต้องการแผนขาย</span>
            <span className="text-xs font-semibold text-gray-800">{PLAN_MONTH}</span>
          </div>
          <div className="mx-1.5 h-8 w-px bg-gray-200" />
        </div>
        <button
          onClick={openAdd}
          // 1. เช็คว่าถ้า selectedPlanId เป็นค่าว่าง (หรือ falsy) ให้ปุ่มเป็น disabled
          disabled={!selectedPlanId}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-[13.5px] font-semibold text-white shadow-md shadow-accent/30 transition hover:bg-[#134a8e] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none"
          // className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-[13.5px] font-semibold text-white shadow-md shadow-accent/30 transition hover:bg-[#134a8e]"
        >
          <IconPlus size={16} stroke={2.2} />
          เพิ่มแผนขาย
        </button>

        <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 bg-slate-100 p-1">
          <ToolButton icon={<IconDeviceFloppy size={14} />} className="border-gray-200 bg-white text-slate-700 hover:border-gray-300">
            บันทึก
          </ToolButton>
          <ToolButton icon={<IconCopy size={14} />} className="border-transparent text-slate-600 hover:border-gray-200 hover:bg-white">
            คัดลอกแถว
          </ToolButton>
          <ToolButton icon={<IconTrash size={14} />} className="border-transparent text-red-700 hover:border-red-200 hover:bg-red-50">
            ลบแถว
          </ToolButton>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <ToolButton icon={<IconRefresh size={15} />} className="border-gray-200 bg-white text-slate-700 hover:border-gray-300 hover:bg-slate-50">
            รีเฟรช
          </ToolButton>
          <ToolButton icon={<IconDatabase size={15} />} className="border-gray-200 bg-white text-slate-700 hover:border-gray-300 hover:bg-slate-50">
            Master Sales Plan
          </ToolButton>
          <ToolButton icon={<IconFileSpreadsheet size={15} />} className="border-emerald-200 bg-emerald-50 font-semibold text-emerald-700 hover:bg-emerald-100">
            Export Excel
          </ToolButton>
          <ToolButton icon={<IconPrinter size={15} />} className="border-gray-200 bg-white text-slate-700 hover:border-gray-300 hover:bg-slate-50">
            พิมพ์
          </ToolButton>
        </div>
      </div>

      {/* ===== Filter / preset bar ===== */}
      <div className="flex shrink-0 flex-wrap items-center gap-3.5 border-b border-gray-200 bg-slate-50 px-5 py-2">
        <div className="flex items-center gap-2">
          <span className="text-[11.5px] font-semibold text-gray-500">คอลัมน์</span>
          <div className="flex gap-0.5 rounded-lg border border-gray-200 bg-[#eef1f6] p-1">
            {(Object.keys(COLUMN_PRESETS) as PresetKey[]).map((key) => (
              <button
                key={key}
                onClick={() => setPreset(key)}
                className={`rounded-md px-3 py-1.5 text-[12.5px] font-semibold transition ${
                  preset === key ? 'bg-[#0b1220] text-white shadow-sm' : 'text-slate-600 hover:text-gray-900'
                }`}
              >
                {COLUMN_PRESETS[key].label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex w-[280px] max-w-[32vw] items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 transition focus-within:border-accent">
          <IconSearch size={16} className="shrink-0 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="ค้นหาลูกค้า / เลขที่แผน..."
            className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-gray-400"
          />
        </div>

        <label className="flex cursor-pointer select-none items-center gap-2 text-[12.5px] text-slate-600">
          <input
            type="checkbox"
            checked={showClosed}
            onChange={(e) => {
              setShowClosed(e.target.checked);
              setPage(1);
            }}
            className="h-[15px] w-[15px] cursor-pointer accent-[#1a5fb4]"
          />
          แสดงสถานะ รถออกงานแล้ว และ LOST SALES
        </label>

        <button
          onClick={() => {
            setSearch('');
            setShowClosed(false);
            setFilters({});
            setSort(null);
            setPage(1);
          }}
          className="flex items-center gap-1.5 px-2 py-1.5 text-[12.5px] font-medium text-slate-500 transition hover:text-gray-900"
        >
          <IconFilterOff size={14} />
          ล้างตัวกรอง
          {activeFilterCount > 0 && (
            <span className="mono rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>

        <div className="ml-auto flex items-center gap-3 text-xs">
          {masterError && (
            <span className="flex items-center gap-1.5 font-semibold text-amber-700">
              <IconAlertTriangle size={13} />
              {masterError}
              <button
                onClick={reloadMaster}
                className="rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-800 transition hover:bg-amber-100"
              >
                ลองใหม่
              </button>
            </span>
          )}
          {linesError && (
            <span className="flex items-center gap-1 font-semibold text-red-600">
              <IconAlertTriangle size={13} />
              {linesError}
            </span>
          )}
          {selectedPlanId && !linesError && (
            <span className="text-slate-400">
              แผน <b className="mono text-gray-700">{selectedPlanId}</b>
            </span>
          )}
        </div>
      </div>

      {/* ===== KPI strip ===== */}
      <div className="grid shrink-0 grid-cols-4 gap-3.5 border-b border-gray-200 bg-white px-5 py-3.5">
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 p-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-accent">
            <IconTrendingUp size={21} />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-slate-500">มูลค่าแผนขายรวม</div>
            <div className="mono text-xl font-bold leading-tight text-gray-900">{formatMoney(totals.plan)}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 p-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <IconCheck size={21} />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-slate-500">มูลค่าที่ขายได้</div>
            <div className="mono text-xl font-bold leading-tight text-emerald-700">{formatMoney(totals.sold)}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 p-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <IconCalendar size={21} />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-slate-500">คงเหลือ (รอปิด)</div>
            <div className="mono text-xl font-bold leading-tight text-amber-700">{formatMoney(totals.remain)}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
            <IconX size={21} />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-red-700">LOST SALES</div>
            <div className="mono text-xl font-bold leading-tight text-red-600">{formatMoney(totals.lost)}</div>
          </div>
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

      {/* ===== Data grid ===== */}
      <div className="relative min-h-0 flex-1">
        <div className="absolute inset-0 overflow-auto bg-white">
          <table className="w-full min-w-max border-separate border-spacing-0">
            <thead>
              <tr>
                {columns.map((col) => {
                  const sorted = sort?.id === col.id;
                  const filtered = !!filters[col.id];
                  const sticky = STICKY_COLUMN_IDS.includes(col.id);
                  const resizable = RESIZABLE_COLUMN_IDS.includes(col.id);
                  const w = widthOf(col);
                  return (
                    <th
                      key={col.id}
                      className={`top-0 whitespace-nowrap border-b-2 border-accent bg-[#0b1220] px-2 py-1.5 text-[11.5px] font-semibold text-slate-300 ${
                        sticky ? 'sticky z-30' : 'sticky z-20'
                      } ${col.id === lastStickyId ? 'shadow-[inset_-6px_0_6px_-6px_rgba(0,0,0,0.5)]' : ''}`}
                      style={{
                        width: w,
                        minWidth: w,
                        maxWidth: w,
                        left: sticky ? stickyLeft[col.id] : undefined,
                      }}
                    >
                      <div className="relative flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => toggleSort(col.id)}
                          title={`เรียงตาม ${col.label}`}
                          className={`flex min-w-0 flex-1 items-center gap-1 rounded px-1 py-1 transition hover:bg-white/10 ${
                            col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'
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
                            align={STICKY_COLUMN_IDS.includes(col.id) ? 'left' : 'right'}
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
                {/* คอลัมน์การกระทำ (แก้ไข / ลบ) — ตรึงไว้ด้านขวาสุด */}
                <th
                  className="sticky right-0 top-0 z-30 whitespace-nowrap border-b-2 border-accent bg-[#0b1220] px-2 py-1.5 text-center text-[11.5px] font-semibold text-slate-300 shadow-[inset_6px_0_6px_-6px_rgba(0,0,0,0.5)]"
                  style={{ width: 88, minWidth: 88, maxWidth: 88 }}
                >
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody>
              {displayRows.length === 0 && (
                <tr>
                  <td colSpan={columns.length + 1} className="h-24 border-b border-[#eef1f6] text-center text-[13px] text-slate-400">
                    {linesLoading
                      ? 'กำลังโหลดรายละเอียดแผนขาย...'
                      : selectedPlanId
                      ? 'ไม่พบรายการในแผนที่เลือก'
                      : 'กรุณาเลือกเลขที่เอกสารเพื่อแสดงข้อมูล'}
                  </td>
                </tr>
              )}
              {displayRows.map((line, i) => {
                const rowIndex = (pageSize === 'all' ? 0 : (safePage - 1) * pageSize) + i;
                const selected = selectedId === rowIndex && drawerOpen;
                const focused = focusedRow === rowIndex;
                const highlight = selected || focused;
                const lost = mapPlanStatus(line.planStatus) === 'lost';
                return (
                  <tr
                    key={`${line.spid || line.planId}-${line.recNo}-${rowIndex}`}
                    onClick={() => setFocusedRow(rowIndex)}
                    className={`group cursor-pointer transition-colors ${
                      highlight ? 'bg-[#eef4fb]' : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    {columns.map((col, ci) => {
                      const sticky = STICKY_COLUMN_IDS.includes(col.id);
                      const w = widthOf(col);
                      // แถบสีบอกสถานะ (เลือก/lost) วางที่เซลล์แรกซึ่งเป็นคอลัมน์ตรึง
                      const accent =
                        ci === 0 && highlight
                          ? 'shadow-[inset_3px_0_0_#1a5fb4]'
                          : ci === 0 && lost
                          ? 'shadow-[inset_3px_0_0_#fca5a5]'
                          : '';
                      return (
                        <td
                          key={col.id}
                          className={`h-[46px] overflow-hidden text-ellipsis whitespace-nowrap border-b border-[#eef1f6] px-3 text-[13px] text-slate-700 ${
                            sticky
                              ? `sticky z-10 ${highlight ? 'bg-[#eef4fb]' : 'bg-white group-hover:bg-slate-50'} ${
                                  col.id === lastStickyId
                                    ? 'shadow-[inset_-6px_0_6px_-6px_rgba(0,0,0,0.12)]'
                                    : ''
                                }`
                              : ''
                          } ${accent}`}
                          style={{
                            width: sticky ? w : undefined,
                            minWidth: sticky ? w : undefined,
                            maxWidth: w,
                            textAlign: col.align,
                            left: sticky ? stickyLeft[col.id] : undefined,
                          }}
                        >
                          {col.id === 'no' ? (
                            <span className="mono text-slate-500">{cellText(line, col)}</span>
                          ) : (
                            renderCell(line, col)
                          )}
                        </td>
                      );
                    })}
                    {/* ปุ่มจัดการ (แก้ไข / ลบ) — ตรึงไว้ด้านขวาสุด */}
                    <td
                      className={`sticky right-0 z-10 h-[46px] border-b border-[#eef1f6] px-2 shadow-[inset_6px_0_6px_-6px_rgba(0,0,0,0.12)] ${
                        highlight ? 'bg-[#eef4fb]' : 'bg-white group-hover:bg-slate-50'
                      }`}
                      style={{ width: 88, minWidth: 88, maxWidth: 88 }}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openRow(line, rowIndex);
                          }}
                          title="แก้ไข / อนุมัติ"
                          className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 bg-white text-slate-500 opacity-60 transition hover:border-accent hover:bg-[#eef4fb] hover:text-accent group-hover:opacity-100"
                        >
                          <IconPencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteRow(line);
                          }}
                          title="ลบแถวนี้"
                          className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 bg-white text-slate-400 opacity-60 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                        >
                          <IconTrash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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

      {/* ===== Totals footer ===== */}
      <footer className="flex shrink-0 items-center gap-6 bg-[#0b1220] px-5 py-3 text-white">
        <div className="text-xs font-semibold tracking-wide text-slate-500">รวมทั้งหมด</div>
        <div className="flex items-baseline gap-2">
          <span className="text-[11.5px] text-slate-400">มูลค่าแผนขาย</span>
          <span className="mono text-[15px] font-bold">{formatMoney(totals.plan)}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-[11.5px] text-slate-400">ขายได้</span>
          <span className="mono text-[15px] font-bold text-emerald-300">{formatMoney(totals.sold)}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-[11.5px] text-slate-400">คงเหลือ</span>
          <span className="mono text-[15px] font-bold text-amber-300">{formatMoney(totals.remain)}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-[11.5px] text-red-300">LOST SALES</span>
          <span className="mono text-[15px] font-bold text-red-300">{formatMoney(totals.lost)}</span>
        </div>
        <div className="ml-auto text-xs text-slate-500">
          อัปเดตล่าสุด{' '}
          {new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      </footer>
      </div>

      {/* ===== Add/Edit modal ===== */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          {/* คลิกฉากหลังไม่ปิด modal — ปิดได้เฉพาะปุ่ม X และ ยกเลิก เท่านั้น */}
          <div className="backdrop-fade-in absolute inset-0 bg-slate-900/50" />
          <div className="modal-pop relative flex max-h-[92vh] w-[min(760px,96vw)] flex-col overflow-hidden rounded-2xl bg-[#f4f6fa] shadow-2xl">
            <div className="flex shrink-0 items-center gap-3.5 border-b border-gray-200 bg-white px-5 py-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-accent">
                <IconPlus size={18} stroke={2.2} />
              </div>
              <div className="min-w-0">
                <div className="text-base font-bold text-gray-900">
                  {selectedId !== null ? `แก้ไขแผนขาย ${form.planId || ''}`.trim() : 'เพิ่มแผนขายใหม่'}
                </div>
                <div className="mono truncate text-xs text-slate-400">
                  {form.custName || 'กรอกข้อมูลแผนขาย'}
                </div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white transition hover:bg-slate-100"
                aria-label="ปิด"
              >
                <IconX size={18} className="text-slate-700" />
              </button>
            </div>

            <PlanEntryForm
              key={formKey}
              line={form}
              isEdit={selectedId !== null}
              onClose={() => setDrawerOpen(false)}
              token={token}
              master={master}
              currentSalemanId={user?.salemanId ?? null}
            />
          </div>
        </div>
      )}
    </Layout>
  );
}
