import React, { useMemo, useState } from 'react';
import {
  IconArrowDown, IconArrowUp, IconArrowsSort, IconChevronLeft, IconChevronRight,
  IconChevronsLeft, IconChevronsRight, IconDeviceFloppy, IconFilter, IconFilterFilled,
  IconFilterOff, IconLoader2, IconPencil, IconPlus, IconRefresh, IconSearch, IconTrash, IconX,
} from '@tabler/icons-react';
import { Layout } from '../components/layout/Layout';
import { ColumnFilter } from '../components/ui/ColumnFilter';
import { SearchSelect } from '../components/ui/SearchSelect';
import { useAuth } from '../context/AuthContext';
import { useDepartments } from '../hooks/useDepartments';
import { usePhoneBook } from '../hooks/usePhoneBook';
import { PhoneBookEntry, PhoneBookPayload } from '../types/phoneBook';
import {
  comparePhoneBookRows,
  phoneBookCellText,
  PHONE_BOOK_COLUMNS,
  PHONE_BOOK_PRESETS,
  PhoneBookColumn,
  PhoneBookPresetKey,
} from '../data/phoneBookData';

type ViewMode = 'active' | 'inactive' | 'all';
type FormState = Omit<PhoneBookPayload, 'remark'> & { remark: string };
type FormErrors = Partial<Record<keyof FormState, string>>;
type SortState = { id: PhoneBookColumn['id']; dir: 'asc' | 'desc' } | null;

const PAGE_SIZES: (number | 'all')[] = [20, 50, 100, 'all'];
const MIN_COLUMN_WIDTH = 90;

const PHONE_TYPE_OPTIONS = [
  { value: 'Phone', label: 'Phone' },
  { value: 'Fax', label: 'Fax' },
];

const emptyForm = (): FormState => ({
  phoneNumber: '', userName: '', type: 'Phone', departId: '', remark: '',
});

const fromEntry = (row: PhoneBookEntry): FormState => ({
  phoneNumber: row.phoneNumber ?? '',
  userName: row.userName ?? '',
  type: row.type || 'Phone',
  departId: row.departId ?? '',
  remark: row.remark ?? '',
});

const payloadOf = (form: FormState): PhoneBookPayload => ({
  phoneNumber: form.phoneNumber.trim(),
  userName: form.userName.trim(),
  type: form.type.trim() || 'Phone',
  departId: form.departId,
  remark: form.remark.trim() || null,
});

const validate = (form: FormState): FormErrors => {
  const errors: FormErrors = {};
  if (!form.userName.trim()) errors.userName = 'กรุณากรอกชื่อผู้ติดต่อ';
  if (!form.phoneNumber.trim()) errors.phoneNumber = 'กรุณากรอกเบอร์โทรศัพท์';
  if (!form.type.trim()) errors.type = 'กรุณากรอกประเภท';
  if (!form.departId) errors.departId = 'กรุณาเลือกหน่วยงาน';
  return errors;
};

const inputClass = (error?: string) =>
  `w-full rounded-lg border bg-white px-3 py-2.5 text-[13px] text-gray-800 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 dark:bg-slate-900 dark:text-slate-100 ${
    error ? 'border-red-400 dark:border-red-700' : 'border-gray-200 dark:border-slate-700'
  }`;

export function PhoneBook() {
  const { user } = useAuth();
  const { departments, loading: departmentsLoading } = useDepartments(user?.token);
  const { items, loading, pending, error, create, update, remove, reload } = usePhoneBook(user?.token);
  const [query, setQuery] = useState('');
  const [view, setView] = useState<ViewMode>('active');
  const [editing, setEditing] = useState<PhoneBookEntry | null | undefined>(undefined);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [deleting, setDeleting] = useState<PhoneBookEntry | null>(null);
  const [notice, setNotice] = useState('');
  const [preset, setPreset] = useState<PhoneBookPresetKey>('standard');
  const [pageSize, setPageSize] = useState<number | 'all'>(20);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortState>(null);
  const [filters, setFilters] = useState<Record<string, Set<string>>>({});
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});

  const departmentOptions = useMemo(() => {
    const options = departments.map((department) => ({
      value: department.departid,
      label: department.departmentName,
      hint: department.departmentShort,
    }));
    if (editing?.departId && !options.some((option) => option.value === editing.departId)) {
      options.unshift({
        value: editing.departId,
        label: editing.departmentName || editing.departId,
        hint: editing.departId,
      });
    }
    return options;
  }, [departments, editing]);

  const columns = useMemo(
    () => PHONE_BOOK_COLUMNS.filter((column) => PHONE_BOOK_PRESETS[preset].groups.includes(column.group)),
    [preset]
  );

  const searched = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((row) => {
      if (view === 'active' && !row.activeStatus) return false;
      if (view === 'inactive' && row.activeStatus) return false;
      if (!needle) return true;
      return [row.userName, row.phoneNumber, row.department, row.departmentName, row.departId, row.type, row.remark ?? '']
        .some((value) => value.toLowerCase().includes(needle));
    });
  }, [items, query, view]);

  const applyFilters = React.useCallback((rows: PhoneBookEntry[], exceptId?: string) => {
    const active = Object.entries(filters).filter(([id]) => id !== exceptId);
    return rows.filter((row) => active.every(([id, selected]) => {
      const column = PHONE_BOOK_COLUMNS.find((candidate) => candidate.id === id);
      return !column || selected.has(phoneBookCellText(row, column));
    }));
  }, [filters]);

  const rows = useMemo(() => {
    const filtered = applyFilters(searched);
    if (!sort) return filtered;
    const column = PHONE_BOOK_COLUMNS.find((candidate) => candidate.id === sort.id);
    if (!column) return filtered;
    const ordered = [...filtered].sort((a, b) => comparePhoneBookRows(a, b, column));
    return sort.dir === 'desc' ? ordered.reverse() : ordered;
  }, [applyFilters, searched, sort]);

  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const firstIndex = rows.length === 0 ? 0 : pageSize === 'all' ? 1 : (safePage - 1) * pageSize + 1;
  const displayRows = pageSize === 'all' ? rows : rows.slice(firstIndex - 1, firstIndex - 1 + pageSize);
  const lastIndex = rows.length === 0 ? 0 : firstIndex + displayRows.length - 1;
  const activeFilterCount = Object.keys(filters).length;

  const filterOptions = (column: PhoneBookColumn) =>
    Array.from(new Set(applyFilters(searched, String(column.id)).map((row) => phoneBookCellText(row, column))))
      .sort((a, b) => a.localeCompare(b, 'th', { numeric: true }));

  const toggleSort = (id: PhoneBookColumn['id']) => {
    setSort((current) => current?.id !== id ? { id, dir: 'asc' } : current.dir === 'asc' ? { id, dir: 'desc' } : null);
    setPage(1);
  };
  const clearTableFilters = () => {
    setFilters({});
    setSort(null);
    setPage(1);
  };
  const startResize = (id: string, startWidth: number) => (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const onMove = (moveEvent: MouseEvent) =>
      setColumnWidths((current) => ({ ...current, [id]: Math.max(MIN_COLUMN_WIDTH, startWidth + moveEvent.clientX - startX) }));
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

  const pageItems = useMemo(() => {
    const values: (number | 'gap')[] = [];
    for (let candidate = 1; candidate <= totalPages; candidate += 1) {
      if (candidate === 1 || candidate === totalPages || Math.abs(candidate - safePage) <= 1) values.push(candidate);
      else if (values[values.length - 1] !== 'gap') values.push('gap');
    }
    return values;
  }, [safePage, totalPages]);

  const activeCount = items.filter((row) => row.activeStatus).length;
  const inactiveCount = items.length - activeCount;

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setErrors({});
  };
  const openEdit = (row: PhoneBookEntry) => {
    setEditing(row);
    setForm(fromEntry(row));
    setErrors({});
  };
  const set = (key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };
  const submit = async () => {
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    try {
      if (editing) {
        await update(editing.recId, payloadOf(form));
        setNotice('แก้ไขรายชื่อเรียบร้อย');
      } else {
        await create(payloadOf(form));
        setNotice('เพิ่มรายชื่อเรียบร้อย');
      }
      setEditing(undefined);
    } catch {
      // usePhoneBook แสดงข้อความจาก API ให้แล้ว และคงฟอร์มไว้ให้แก้ไข
    }
  };
  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await remove(deleting.recId);
      setDeleting(null);
      setNotice('ปิดใช้งานรายชื่อเรียบร้อย');
    } catch {
      // คง dialog ไว้เมื่อ API ปฏิเสธรายการ
    }
  };

  return (
    <Layout title="สมุดโทรศัพท์" subtitle="Phone Book">
      <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-gray-200 px-5 py-3 dark:border-slate-700">
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">รายชื่อผู้ติดต่อ</h2>
            <p className="text-[11.5px] text-slate-400">จัดการข้อมูลสมุดโทรศัพท์ภายในองค์กร</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button type="button" onClick={reload} title="โหลดข้อมูลใหม่" className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-slate-500 transition hover:border-accent hover:text-accent dark:border-slate-700 dark:text-slate-300"><IconRefresh size={16} /></button>
            <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-accent px-3.5 py-2 text-[13px] font-semibold text-white shadow-sm transition hover:brightness-110"><IconPlus size={17} /> เพิ่มรายชื่อ</button>
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-3 gap-3 border-b border-gray-200 px-5 py-3 dark:border-slate-700">
          <Summary label="ใช้งาน" value={activeCount} tone="emerald" active={view === 'active'} onClick={() => { setView('active'); setPage(1); }} />
          <Summary label="ปิดใช้งาน" value={inactiveCount} tone="slate" active={view === 'inactive'} onClick={() => { setView('inactive'); setPage(1); }} />
          <Summary label="ทั้งหมด" value={items.length} tone="blue" active={view === 'all'} onClick={() => { setView('all'); setPage(1); }} />
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-gray-200 px-5 py-2.5 dark:border-slate-700">
          <div className="flex rounded-lg border border-gray-200 p-1 dark:border-slate-700">
            {(Object.keys(PHONE_BOOK_PRESETS) as PhoneBookPresetKey[]).map((key) => (
              <button key={key} type="button" onClick={() => { setPreset(key); setPage(1); }} className={`rounded-md px-3 py-1.5 text-[12px] font-semibold transition ${preset === key ? 'bg-[#0b1220] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}>{PHONE_BOOK_PRESETS[key].label}</button>
            ))}
          </div>
          <div className="relative ml-auto w-full sm:w-[320px]">
            <IconSearch size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="ค้นหาชื่อ หน่วยงาน หรือเบอร์โทร" className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-[13px] outline-none transition focus:border-accent dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-gray-200 bg-slate-50 px-5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800/60">
          <span className="text-slate-500 dark:text-slate-400">ตาราง <b className="text-gray-900 dark:text-slate-100">{rows.length}</b> รายการ</span>
          <button type="button" onClick={clearTableFilters} disabled={!activeFilterCount && !sort} className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1 font-medium text-slate-600 transition hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"><IconFilterOff size={13} />ล้างตัวกรองตาราง{activeFilterCount > 0 && <span className="mono rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-white">{activeFilterCount}</span>}</button>
          <label className="ml-auto flex items-center gap-1.5 text-slate-500 dark:text-slate-400">แสดง<select value={String(pageSize)} onChange={(event) => { setPageSize(event.target.value === 'all' ? 'all' : Number(event.target.value)); setPage(1); }} className="cursor-pointer rounded-md border border-gray-200 bg-white px-2 py-1 text-[12px] font-semibold text-gray-700 outline-none focus:border-accent dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">{PAGE_SIZES.map((size) => <option key={size} value={String(size)}>{size === 'all' ? 'ทั้งหมด' : size}</option>)}</select>รายการ/หน้า</label>
        </div>

        {error && <div className="flex shrink-0 items-center gap-3 border-b border-red-200 bg-red-50 px-5 py-2.5 text-[12.5px] font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"><span>{error}</span><button type="button" onClick={reload} className="ml-auto rounded border border-red-300 px-2.5 py-1 text-[11.5px]">ลองใหม่</button></div>}
        {notice && <Notice text={notice} onClose={() => setNotice('')} />}

        <div className="relative min-h-0 flex-1">
          <div className="absolute inset-0 overflow-auto bg-white dark:bg-slate-900">
            <table className="w-full min-w-max border-separate border-spacing-0">
              <thead><tr>
                {columns.map((column) => {
                  const id = String(column.id);
                  const sorted = sort?.id === column.id;
                  const filtered = !!filters[id];
                  const width = columnWidths[id] ?? column.width;
                  return <th key={id} className="sticky top-0 z-20 whitespace-nowrap border-b-2 border-accent bg-[#0b1220] px-2 py-1.5 text-[11.5px] font-semibold text-slate-300" style={{ width, minWidth: width, maxWidth: width }}><div className="relative flex items-center gap-1"><button type="button" onClick={() => toggleSort(column.id)} className={`flex min-w-0 flex-1 items-center gap-1 rounded px-1 py-1 transition hover:bg-white/10 ${column.align === 'center' ? 'justify-center' : 'justify-start'} ${sorted ? 'text-white' : ''}`}><span className="truncate">{column.label}</span>{sorted ? sort!.dir === 'asc' ? <IconArrowUp size={12} /> : <IconArrowDown size={12} /> : <IconArrowsSort size={11} className="opacity-30" />}</button><button type="button" onClick={() => setOpenFilter((current) => current === id ? null : id)} className={`shrink-0 rounded p-1 transition hover:bg-white/10 ${filtered ? 'text-accent' : 'opacity-40 hover:opacity-100'}`}>{filtered ? <IconFilterFilled size={12} /> : <IconFilter size={12} />}</button>{openFilter === id && <ColumnFilter options={filterOptions(column)} selected={filters[id]} align="right" onClose={() => setOpenFilter(null)} onApply={(next) => { setFilters((current) => { const updated = { ...current }; if (next) updated[id] = next; else delete updated[id]; return updated; }); setPage(1); }} />}</div>{column.resizable && <span onMouseDown={startResize(id, width)} className="absolute right-0 top-0 z-30 h-full w-1.5 cursor-col-resize hover:bg-accent" />}</th>;
                })}
                <th className="sticky right-0 top-0 z-30 border-b-2 border-accent bg-[#0b1220] px-2 py-1.5 text-center text-[11.5px] font-semibold text-slate-300 shadow-[inset_6px_0_6px_-6px_rgba(0,0,0,0.5)]" style={{ width: 76, minWidth: 76 }}>จัดการ</th>
              </tr></thead>
              <tbody>
                {loading && displayRows.length === 0 && <tr><td colSpan={columns.length + 1} className="h-24 border-b border-[#eef1f6] text-center text-[13px] text-slate-400 dark:border-slate-800"><span className="inline-flex items-center gap-2"><IconLoader2 size={16} className="animate-spin text-accent" />กำลังโหลดข้อมูล...</span></td></tr>}
                {!loading && displayRows.length === 0 && <tr><td colSpan={columns.length + 1} className="h-24 border-b border-[#eef1f6] text-center text-[13px] text-slate-400 dark:border-slate-800">ไม่พบรายชื่อ</td></tr>}
                {displayRows.map((row) => <tr key={row.recId} className="group bg-white transition-colors hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800">{columns.map((column) => { const id = String(column.id); const width = columnWidths[id] ?? column.width; return <td key={id} className="h-[46px] truncate border-b border-[#eef1f6] px-2 text-[13px] text-slate-700 dark:border-slate-800 dark:text-slate-200" style={{ width, minWidth: width, maxWidth: width, textAlign: column.align ?? 'left' }} title={phoneBookCellText(row, column)}>{renderPhoneBookCell(row, column)}</td>; })}<td className="sticky right-0 z-10 h-[46px] border-b border-[#eef1f6] bg-white px-2 shadow-[inset_6px_0_6px_-6px_rgba(0,0,0,0.12)] group-hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:group-hover:bg-slate-800"><ActionButtons row={row} onEdit={openEdit} onDelete={setDeleting} /></td></tr>)}
              </tbody>
            </table>
          </div>
        </div>

        {rows.length > 0 && <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-gray-200 bg-white px-5 py-2 dark:border-slate-700 dark:bg-slate-900"><span className="text-xs text-slate-500 dark:text-slate-400">แสดง <b className="text-gray-900 dark:text-slate-100">{firstIndex}</b>–<b className="text-gray-900 dark:text-slate-100">{lastIndex}</b> จาก <b className="text-gray-900 dark:text-slate-100">{rows.length}</b> รายการ</span>{totalPages > 1 && <div className="ml-auto flex items-center gap-1"><PageButton title="หน้าแรก" disabled={safePage === 1} onClick={() => setPage(1)}><IconChevronsLeft size={16} /></PageButton><PageButton title="ก่อนหน้า" disabled={safePage === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}><IconChevronLeft size={15} /><span className="hidden sm:inline">ก่อนหน้า</span></PageButton>{pageItems.map((item, index) => item === 'gap' ? <span key={`gap-${index}`} className="px-1 text-xs text-slate-400">…</span> : <button key={item} type="button" onClick={() => setPage(item)} className={`mono flex h-8 min-w-[32px] items-center justify-center rounded-lg border px-2 text-[12.5px] font-semibold ${item === safePage ? 'border-accent bg-accent text-white' : 'border-gray-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'}`}>{item}</button>)}<PageButton title="ถัดไป" disabled={safePage === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}><span className="hidden sm:inline">ถัดไป</span><IconChevronRight size={15} /></PageButton><PageButton title="หน้าสุดท้าย" disabled={safePage === totalPages} onClick={() => setPage(totalPages)}><IconChevronsRight size={16} /></PageButton></div>}</div>}
      </section>

      {editing !== undefined && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <button type="button" aria-label="ปิดแบบฟอร์ม" disabled={pending} onClick={() => setEditing(undefined)} className="absolute inset-0 bg-slate-900/50 backdrop-fade-in" />
          <div className="drawer-slide-in relative z-10 flex h-full w-full max-w-xl flex-col bg-[#f4f6fa] shadow-2xl dark:bg-slate-950">
            <div className="sticky top-0 z-10 flex items-center border-b border-gray-200 bg-white px-4 py-4 dark:border-slate-700 dark:bg-slate-900 sm:px-5">
              <div><h2 className="text-base font-bold text-gray-900 dark:text-white">{editing ? 'แก้ไขรายชื่อ' : 'เพิ่มรายชื่อ'}</h2><p className="text-[11.5px] text-slate-400">ข้อมูลติดต่อภายในองค์กร</p></div>
              <button type="button" disabled={pending} onClick={() => setEditing(undefined)} className="ml-auto rounded-lg border border-gray-200 p-2 dark:border-slate-700" aria-label="ปิด"><IconX size={18} /></button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 sm:grid-cols-2">
                <FormField label="ชื่อผู้ติดต่อ" required error={errors.userName} span2><input autoFocus value={form.userName} maxLength={200} onChange={(event) => set('userName', event.target.value)} className={inputClass(errors.userName)} /></FormField>
                <FormField label="หน่วยงาน" required error={errors.departId}>
                  <SearchSelect value={form.departId} options={departmentOptions} disabled={departmentsLoading} invalid={!!errors.departId} ariaLabel="หน่วยงาน" placeholder={departmentsLoading ? 'กำลังโหลดหน่วยงาน…' : '-- เลือกหน่วยงาน --'} onChange={(value) => set('departId', value)} />
                </FormField>
                <FormField label="เบอร์โทรศัพท์" required error={errors.phoneNumber}><input value={form.phoneNumber} maxLength={50} inputMode="tel" onChange={(event) => set('phoneNumber', event.target.value)} placeholder="เช่น 102 หรือ 081-234-5678" className={inputClass(errors.phoneNumber)} /></FormField>
                <FormField label="ประเภท" required error={errors.type}>
                  <SearchSelect value={form.type} options={PHONE_TYPE_OPTIONS} invalid={!!errors.type} ariaLabel="ประเภท" placeholder="-- เลือกประเภท --" onChange={(value) => set('type', value)} />
                </FormField>
                <FormField label="หมายเหตุ" span2><textarea value={form.remark} maxLength={500} rows={3} onChange={(event) => set('remark', event.target.value)} className={`${inputClass()} resize-y`} /></FormField>
              </div>
            </div>
            <div className="flex shrink-0 justify-end gap-2 border-t border-gray-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900 sm:px-5">
              <button type="button" disabled={pending} onClick={() => setEditing(undefined)} className="rounded-lg border border-gray-200 px-4 py-2 text-[13px] font-semibold text-slate-600 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300">ยกเลิก</button>
              <button type="button" disabled={pending} onClick={submit} className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-50"><IconDeviceFloppy size={16} />{pending ? 'กำลังบันทึก…' : 'บันทึก'}</button>
            </div>
          </div>
        </div>
      )}

      {deleting && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-300"><IconTrash size={21} /></div>
            <h3 className="font-bold text-gray-900 dark:text-white">ปิดใช้งานรายชื่อนี้?</h3>
            <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">{deleting.userName} จะถูกปิดใช้งาน โดยข้อมูลยังคงอยู่ในระบบ</p>
            <div className="mt-5 flex justify-end gap-2"><button type="button" disabled={pending} onClick={() => setDeleting(null)} className="rounded-lg border border-gray-200 px-4 py-2 text-[13px] font-semibold disabled:opacity-50 dark:border-slate-700">ยกเลิก</button><button type="button" disabled={pending} onClick={confirmDelete} className="rounded-lg bg-red-600 px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-50">{pending ? 'กำลังดำเนินการ…' : 'ปิดใช้งาน'}</button></div>
          </div>
        </div>
      )}
    </Layout>
  );
}

function Notice({ text, onClose }: { text: string; onClose: () => void }) {
  return <div className="flex shrink-0 items-center justify-between border-b border-emerald-200 bg-emerald-50 px-5 py-2.5 text-[12.5px] font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"><span>{text}</span><button type="button" onClick={onClose} aria-label="ปิดข้อความ"><IconX size={15} /></button></div>;
}

function Summary({ label, value, tone, active, onClick }: { label: string; value: number; tone: 'emerald' | 'slate' | 'blue'; active: boolean; onClick: () => void }) {
  const colors = tone === 'emerald' ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200' : tone === 'blue' ? 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200' : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200';
  return <button type="button" onClick={onClick} className={`rounded-xl border px-4 py-2.5 text-left transition ${colors} ${active ? 'ring-2 ring-accent ring-offset-1 dark:ring-offset-slate-900' : 'opacity-75 hover:opacity-100'}`}><div className="text-[11.5px] font-semibold opacity-75">{label}</div><div className="mt-0.5 text-xl font-bold">{value}</div></button>;
}

function FormField({ label, required, error, span2, children }: { label: string; required?: boolean; error?: string; span2?: boolean; children: React.ReactNode }) {
  return <label className={span2 ? 'sm:col-span-2' : ''}><span className="mb-1.5 flex items-center gap-1 text-[11.5px] font-semibold text-slate-500 dark:text-slate-400">{label}{required && <span className="text-red-500">*</span>}</span>{children}{error && <span className="mt-1 block text-[11.5px] font-semibold text-red-600 dark:text-red-400">{error}</span>}</label>;
}

type RowActions = { row: PhoneBookEntry; onEdit: (row: PhoneBookEntry) => void; onDelete: (row: PhoneBookEntry) => void };

function ActionButtons({ row, onEdit, onDelete }: RowActions) {
  if (!row.activeStatus) return <span className="text-[11.5px] text-slate-400">—</span>;
  return <div className="flex justify-center gap-1"><button type="button" onClick={() => onEdit(row)} title="แก้ไข" className="rounded-lg p-2 text-accent hover:bg-accent/10"><IconPencil size={16} /></button><button type="button" onClick={() => onDelete(row)} title="ปิดใช้งาน" className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"><IconTrash size={16} /></button></div>;
}

function Status({ active }: { active: boolean }) {
  return <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${active ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>{active ? 'ใช้งาน' : 'ปิดใช้งาน'}</span>;
}

function renderPhoneBookCell(row: PhoneBookEntry, column: PhoneBookColumn) {
  if (column.id === 'status') return <Status active={row.activeStatus} />;
  if (column.id === 'phoneNumber') return <span className="mono font-semibold text-accent">{row.phoneNumber || '—'}</span>;
  if (column.id === 'departmentName') return <><span>{row.departmentName || '—'}</span>{row.department && <span className="ml-1.5 text-[11px] text-slate-400">({row.department})</span>}</>;
  return phoneBookCellText(row, column);
}

function PageButton({ title, disabled, onClick, children }: { title: string; disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" title={title} disabled={disabled} onClick={onClick} className="flex h-8 min-w-8 items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-2 text-[12.5px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800">{children}</button>;
}
