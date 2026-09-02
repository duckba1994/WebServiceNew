import React, { useMemo, useState } from 'react';
import {
  IconSearch,
  IconFilterOff,
  IconFilter,
  IconFilterFilled,
  IconArrowUp,
  IconArrowDown,
  IconArrowsSort,
  IconEye,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconLoader2,
  IconAlertTriangle,
  IconRefresh,
  IconBell,
  IconCircleCheck,
  IconX,
} from '@tabler/icons-react';
import { ColumnFilter } from '../ui/ColumnFilter';
import { RequestDetailModal } from './RequestDetailModal';
import { RequestActionDialog } from './RequestActionDialog';
import { RequestAction, RequestListItem, RequestStatusSummary } from '../../types/requestList';
import { ActionFieldValues, visibleActionsOf } from '../../data/requestActionFields';
import {
  RequestColumn,
  ReqPresetKey,
  REQ_COLUMN_PRESETS,
  REQ_STICKY_IDS,
  REQ_RESIZABLE_IDS,
  cellText,
  compareRequests,
  jobStatusMeta,
  matchesSearch,
  requestKey,
} from '../../data/requestListData';
import { PHASE_META, phaseOf, isRequesterSide } from '../../data/requestPhase';

// การ์ดสรุปที่หน้าเรียกส่งเข้ามาเอง (เช่น การ์ดตามจังหวะงานของหน้าแจ้งออกไป)
export interface SummaryCardSpec {
  key: string;
  label: string;
  value: number;
  color: string;
  bg: string;
  active?: boolean;
  onClick?: () => void;
}

const PAGE_SIZES: (number | 'all')[] = [20, 50, 100, 'all'];
const MIN_COL_WIDTH = 90;

function Pill({ meta, dot }: { meta: { label: string; color: string; bg: string; border: string }; dot?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11.5px] font-semibold"
      style={{ background: meta.bg, color: meta.color, borderColor: meta.border }}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />}
      {meta.label}
    </span>
  );
}

// ── ตารางใบแจ้งเรื่อง (ใช้ร่วมกันทั้งแจ้งออกไป/แจ้งเข้ามา) ──────
// API ไม่มี pagination — คืนมาทั้งหมดครั้งเดียว จึงค้นหา/เรียง/แบ่งหน้าที่ฝั่งนี้
export function RequestGrid({
  columns: allColumns,
  items: data,
  summary,
  summaryCards,
  totalCount,
  loading,
  error,
  onReload,
  toolbar,
  onAction,
  onEdited,
  actionPending,
  notice,
  onDismissNotice,
  searchPlaceholder = 'ค้นหาเลขที่ / ผู้แจ้ง / รายละเอียด...',
  emptyText = 'ไม่พบรายการ',
}: {
  columns: RequestColumn[];
  items: RequestListItem[];
  summary?: RequestStatusSummary[];
  // ส่งมาแทน summary ได้ — ใช้เมื่อหน้าอยากนับด้วยเกณฑ์ของตัวเอง (เช่น จังหวะงาน)
  summaryCards?: SummaryCardSpec[];
  totalCount?: number; // จำนวนก่อนถูกกรองในหน้า (ไม่ส่ง = นับจาก items)
  loading?: boolean;
  error?: string | null;
  onReload?: () => void;
  toolbar?: React.ReactNode; // ตัวกรองที่ส่งไปให้ API (สถานะ / เฉพาะคิวเรา)
  // กดปุ่มดำเนินการ — ไม่ส่งมา = ตารางอ่านอย่างเดียว (ไม่มีปุ่มโผล่)
  onAction?: (
    item: RequestListItem,
    action: RequestAction,
    note: string,
    fields?: ActionFieldValues
  ) => void | Promise<void>;
  // แก้ไขข้อมูลใบสำเร็จ — ไม่ส่งมา = ปิดการแก้ไข (ตารางอ่านอย่างเดียว)
  onEdited?: (item: RequestListItem) => void;
  actionPending?: boolean;
  notice?: { kind: 'success' | 'error'; text: string } | null;
  onDismissNotice?: () => void;
  searchPlaceholder?: string;
  emptyText?: string;
}) {
  const [preset, setPreset] = useState<ReqPresetKey>('default');
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState<number | 'all'>(20);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ id: string; dir: 'asc' | 'desc' } | null>(null);
  const [filters, setFilters] = useState<Record<string, Set<string>>>({});
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [colWidths, setColWidths] = useState<Record<string, number>>({});
  // เก็บคีย์ของแถว ไม่ใช่ตัว object — พอ refetch แล้ว object จะเป็นตัวใหม่
  // ต้องใช้ module+docNo เพราะตารางรวมหลายแผนก docNo ซ้ำกันได้
  const [viewKey, setViewKey] = useState<string | null>(null);
  const view = useMemo(() => data.find((r) => requestKey(r) === viewKey) ?? null, [data, viewKey]);
  // ใบ + ปุ่มที่กำลังรอยืนยัน (การอนุมัติย้อนกลับไม่ได้ จึงต้องถามก่อนเสมอ)
  const [confirm, setConfirm] = useState<{ item: RequestListItem; action: RequestAction } | null>(null);

  // ตั้งใจไม่มีปุ่มดำเนินการในตาราง — ทุก action ต้องเปิดใบเข้าไปกดข้างใน
  // เพื่อบังคับให้คนอนุมัติได้อ่านก่อนว่าลูกน้องขออะไรมา (ตัดสินใจจากแถวเดียวไม่พอ)
  // นับเฉพาะ action ที่โผล่บนจอจริง — ตัวที่สั่งซ่อน (เช่น skipService ของ IT)
  // ไม่นับ ไม่งั้นแถวจะเน้นสีชวนให้เปิด แล้วข้างในไม่มีปุ่มให้กดสักปุ่ม
  const hasAction = React.useCallback(
    (row: RequestListItem): boolean => !!onAction && visibleActionsOf(row).length > 0,
    [onAction]
  );

  const columns = useMemo(
    () => allColumns.filter((c) => REQ_COLUMN_PRESETS[preset].groups.includes(c.group)),
    [allColumns, preset]
  );

  const widthOf = React.useCallback((c: RequestColumn) => colWidths[c.id] ?? c.width, [colWidths]);

  const stickyLeft = useMemo(() => {
    const map: Record<string, number> = {};
    let acc = 0;
    for (const c of columns) {
      if (!REQ_STICKY_IDS.includes(c.id)) break;
      map[c.id] = acc;
      acc += colWidths[c.id] ?? c.width;
    }
    return map;
  }, [columns, colWidths]);

  const lastStickyId = useMemo(() => {
    let last = '';
    for (const c of columns) {
      if (!REQ_STICKY_IDS.includes(c.id)) break;
      last = c.id;
    }
    return last;
  }, [columns]);

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

  const clearTableFilters = () => {
    setFilters({});
    setSort(null);
    setPage(1);
  };

  const preFiltered = useMemo(() => data.filter((r) => matchesSearch(r, search)), [search, data]);

  const applyFilters = React.useCallback(
    (list: RequestListItem[], exceptId?: string) => {
      const active = Object.entries(filters).filter(([id]) => id !== exceptId);
      if (active.length === 0) return list;
      return list.filter((row) =>
        active.every(([id, set]) => {
          const c = allColumns.find((x) => x.id === id);
          return c ? set.has(cellText(row, c)) : true;
        })
      );
    },
    [filters, allColumns]
  );

  const rows = useMemo(() => {
    const filtered = applyFilters(preFiltered);
    if (!sort) return filtered;
    const c = allColumns.find((x) => x.id === sort.id);
    if (!c) return filtered;
    const sorted = [...filtered].sort((a, b) => compareRequests(a, b, c));
    return sort.dir === 'desc' ? sorted.reverse() : sorted;
  }, [preFiltered, applyFilters, sort, allColumns]);

  const filterOptions = (c: RequestColumn) =>
    Array.from(new Set(applyFilters(preFiltered, c.id).map((r) => cellText(r, c)))).sort((a, b) =>
      a.localeCompare(b, 'th')
    );

  const toggleSort = (id: string) => {
    setSort((prev) => (prev?.id !== id ? { id, dir: 'asc' } : prev.dir === 'asc' ? { id, dir: 'desc' } : null));
    setPage(1);
  };

  const activeFilterCount = Object.keys(filters).length;
  const myTurnCount = useMemo(() => data.filter((r) => r.isMyTurn).length, [data]);

  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const displayRows = useMemo(
    () => (pageSize === 'all' ? rows : rows.slice((safePage - 1) * pageSize, safePage * pageSize)),
    [rows, pageSize, safePage]
  );
  const firstIndex = rows.length === 0 ? 0 : (pageSize === 'all' ? 0 : (safePage - 1) * pageSize) + 1;
  const lastIndex = pageSize === 'all' ? rows.length : (safePage - 1) * pageSize + displayRows.length;

  const pageItems = useMemo<(number | 'gap')[]>(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const items: (number | 'gap')[] = [1];
    if (safePage > 3) items.push('gap');
    for (let p = Math.max(2, safePage - 1); p <= Math.min(totalPages - 1, safePage + 1); p++) items.push(p);
    if (safePage < totalPages - 2) items.push('gap');
    items.push(totalPages);
    return items;
  }, [totalPages, safePage]);

  const renderCell = (row: RequestListItem, col: RequestColumn) => {
    const text = cellText(row, col);
    const blank = <span className="text-slate-300">—</span>;
    switch (col.kind) {
      case 'status':
        return <Pill meta={jobStatusMeta(row)} dot />;
      case 'phase':
        // ชื่อจังหวะใช้ phaseName จาก API (cellText คืนมาให้แล้ว) สีมาจากตาราง UI
        return <Pill meta={{ ...PHASE_META[phaseOf(row)], label: text }} />;
      case 'module':
        // รหัสโมดูล = แผนกปลายทาง (IT / AF / PL / GA …) — คอลัมน์ที่สำคัญที่สุด
        // ของตารางที่รวมทุกแผนกไว้ด้วยกัน
        return (
          <span className="mono rounded-md border border-gray-200 bg-slate-50 px-2 py-0.5 text-[11.5px] font-bold text-slate-700">
            {row.module}
          </span>
        );
      case 'turn':
        return row.isMyTurn ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
            <IconBell size={12} />
            คิวเรา
          </span>
        ) : (
          <span className="text-[11.5px] text-slate-400">รอแผนกอื่น</span>
        );
      case 'ourTurn':
        // ใบที่ workflow วนกลับมาหาผู้แจ้ง (Survey / Received-Service /
        // Request-Close-Job) — งานเสร็จหมดแล้วรอแค่เรากดปิด ถ้าไม่ชี้ให้เห็นจะค้างเงียบ
        return isRequesterSide(row) ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
            <IconBell size={12} />
            รอเรา
          </span>
        ) : (
          <span className="text-[11.5px] text-slate-400">—</span>
        );
      case 'step':
        return text ? <span className="mono text-slate-600">{text}</span> : blank;
      case 'mono':
        return text ? <span className="mono font-semibold text-accent">{text}</span> : blank;
      case 'date':
        return text ? <span className="text-slate-600">{text}</span> : blank;
      default:
        return text ? <span className={col.id === 'detail' ? 'text-gray-800' : ''}>{text}</span> : blank;
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* ===== สรุปตามสถานะ (มาจาก summary ของ API — นับจากชุดที่กรองแล้ว) ===== */}
      <div className="flex shrink-0 flex-wrap items-center gap-2.5 border-b border-gray-200 bg-white px-5 py-3">
        {summaryCards ? (
          summaryCards.map((c) => (
            <SummaryCard
              key={c.key}
              label={c.label}
              value={c.value}
              color={c.color}
              bg={c.bg}
              active={c.active}
              onClick={c.onClick}
            />
          ))
        ) : (
          <>
            <SummaryCard label="ทั้งหมด" value={data.length} color="#475569" bg="#f1f5f9" />
            {myTurnCount > 0 && (
              <SummaryCard label="ถึงคิวแผนกเรา" value={myTurnCount} color="#b45309" bg="#fffbeb" />
            )}
            {(summary ?? []).map((s) => (
              <SummaryCard key={s.jobStatus} label={s.jobStatusName} value={s.count} color="#0f172a" bg="#f8fafc" />
            ))}
          </>
        )}
        {onReload && (
          <button
            onClick={onReload}
            disabled={loading}
            title="โหลดข้อมูลใหม่"
            className="ml-auto flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[12.5px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <IconRefresh size={14} className={loading ? 'animate-spin' : ''} />
            รีเฟรช
          </button>
        )}
      </div>

      {/* ===== Filter / preset bar ===== */}
      <div className="flex shrink-0 flex-wrap items-center gap-3.5 border-b border-gray-200 bg-slate-50 px-5 py-2">
        {toolbar}

        <div className="flex items-center gap-2">
          <span className="text-[11.5px] font-semibold text-gray-500">คอลัมน์</span>
          <div className="flex gap-0.5 rounded-lg border border-gray-200 bg-[#eef1f6] p-1">
            {(Object.keys(REQ_COLUMN_PRESETS) as ReqPresetKey[]).map((key) => (
              <button
                key={key}
                onClick={() => {
                  setPreset(key);
                  setPage(1);
                }}
                className={`rounded-md px-3 py-1.5 text-[12.5px] font-semibold transition ${
                  preset === key ? 'bg-[#0b1220] text-white shadow-sm' : 'text-slate-600 hover:text-gray-900'
                }`}
              >
                {REQ_COLUMN_PRESETS[key].label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex w-[300px] max-w-[36vw] items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 transition focus-within:border-accent">
          <IconSearch size={16} className="shrink-0 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={searchPlaceholder}
            className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* ===== Table meta bar ===== */}
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-gray-200 bg-slate-50 px-5 py-1.5 text-xs">
        <span className="text-slate-500">
          ตาราง <b className="text-gray-900">{rows.length}</b> รายการ
          {totalCount !== undefined && totalCount !== rows.length && (
            <> จากทั้งหมด <b className="text-gray-900">{totalCount}</b></>
          )}
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

      {/* ===== โหลดไม่สำเร็จ — ต้องบอกผู้ใช้ ไม่ใช่โชว์ตารางว่าง ===== */}
      {error && (
        <div className="flex shrink-0 items-center gap-2 border-b border-red-200 bg-red-50 px-5 py-2.5 text-[12.5px] font-semibold text-red-700">
          <IconAlertTriangle size={16} className="shrink-0" />
          {error}
          {onReload && (
            <button
              onClick={onReload}
              className="ml-auto rounded border border-red-300 bg-white px-2.5 py-1 text-[11.5px] font-semibold text-red-700 transition hover:bg-red-100"
            >
              ลองใหม่
            </button>
          )}
        </div>
      )}

      {/* ===== ผลของการกดปุ่ม — message เป็นข้อความไทยจาก API ตรง ๆ ===== */}
      {notice && (
        <div
          className={`flex shrink-0 items-center gap-2 border-b px-5 py-2.5 text-[12.5px] font-semibold ${
            notice.kind === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {notice.kind === 'success' ? (
            <IconCircleCheck size={16} className="shrink-0" />
          ) : (
            <IconAlertTriangle size={16} className="shrink-0" />
          )}
          {notice.text}
          {onDismissNotice && (
            <button
              onClick={onDismissNotice}
              title="ปิดข้อความ"
              className="ml-auto rounded p-1 opacity-60 transition hover:bg-white/60 hover:opacity-100"
            >
              <IconX size={14} />
            </button>
          )}
        </div>
      )}

      {/* ===== Data grid ===== */}
      <div className="relative min-h-0 flex-1">
        <div className="absolute inset-0 overflow-auto bg-white">
          <table className="w-full min-w-max border-separate border-spacing-0">
            <thead>
              <tr>
                {columns.map((col) => {
                  const sorted = sort?.id === col.id;
                  const filtered = !!filters[col.id];
                  const sticky = REQ_STICKY_IDS.includes(col.id);
                  const resizable = REQ_RESIZABLE_IDS.includes(col.id);
                  const w = widthOf(col);
                  return (
                    <th
                      key={col.id}
                      className={`top-0 whitespace-nowrap border-b-2 border-accent bg-[#0b1220] px-2 py-1.5 text-[11.5px] font-semibold text-slate-300 ${
                        sticky ? 'sticky z-30' : 'sticky z-20'
                      } ${col.id === lastStickyId ? 'shadow-[inset_-6px_0_6px_-6px_rgba(0,0,0,0.5)]' : ''}`}
                      style={{ width: w, minWidth: w, maxWidth: w, left: sticky ? stickyLeft[col.id] : undefined }}
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
                            align={sticky ? 'left' : 'right'}
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
                <th
                  className="sticky right-0 top-0 z-30 whitespace-nowrap border-b-2 border-accent bg-[#0b1220] px-2 py-1.5 text-center text-[11.5px] font-semibold text-slate-300 shadow-[inset_6px_0_6px_-6px_rgba(0,0,0,0.5)]"
                  style={{ width: 64, minWidth: 64, maxWidth: 64 }}
                >
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && displayRows.length === 0 && (
                <tr>
                  <td colSpan={columns.length + 1} className="h-24 border-b border-[#eef1f6] text-center text-[13px] text-slate-400">
                    <span className="inline-flex items-center gap-2">
                      <IconLoader2 size={16} className="animate-spin text-accent" />
                      กำลังโหลดข้อมูล...
                    </span>
                  </td>
                </tr>
              )}
              {!loading && displayRows.length === 0 && (
                <tr>
                  <td colSpan={columns.length + 1} className="h-24 border-b border-[#eef1f6] text-center text-[13px] text-slate-400">
                    {emptyText}
                  </td>
                </tr>
              )}
              {displayRows.map((row) => (
                <tr
                  key={requestKey(row)}
                  className={`group transition-colors hover:bg-slate-50 ${row.isMyTurn ? 'bg-amber-50/40' : 'bg-white'}`}
                >
                  {columns.map((col) => {
                    const sticky = REQ_STICKY_IDS.includes(col.id);
                    const w = widthOf(col);
                    return (
                      <td
                        key={col.id}
                        className={`h-[46px] truncate border-b border-[#eef1f6] px-2 text-[13px] text-slate-700 ${
                          sticky
                            ? `sticky z-10 ${row.isMyTurn ? 'bg-amber-50' : 'bg-white'} group-hover:bg-slate-50`
                            : ''
                        } ${col.id === lastStickyId ? 'shadow-[inset_-6px_0_6px_-6px_rgba(0,0,0,0.12)]' : ''}`}
                        title={cellText(row, col)}
                        style={{
                          width: w,
                          minWidth: w,
                          maxWidth: w,
                          textAlign: col.align,
                          left: sticky ? stickyLeft[col.id] : undefined,
                        }}
                      >
                        {renderCell(row, col)}
                      </td>
                    );
                  })}
                  <td
                    className={`sticky right-0 z-10 h-[46px] border-b border-[#eef1f6] px-2 shadow-[inset_6px_0_6px_-6px_rgba(0,0,0,0.12)] group-hover:bg-slate-50 ${
                      row.isMyTurn ? 'bg-amber-50' : 'bg-white'
                    }`}
                    style={{ width: 64, minWidth: 64, maxWidth: 64 }}
                  >
                    <div className="flex items-center justify-center">
                      {/* ปุ่มเดียวคือ "เปิดใบ" — ใบที่กดดำเนินการได้จะเน้นสีไว้
                          ให้หาเจอ แต่ยังต้องเปิดเข้าไปอ่านก่อนถึงจะกดอนุมัติได้ */}
                      <button
                        type="button"
                        onClick={() => setViewKey(requestKey(row))}
                        title={hasAction(row) ? `เปิดใบ ${row.docNo} เพื่ออ่านและดำเนินการ` : 'ดูรายละเอียด'}
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-md border transition ${
                          hasAction(row)
                            ? 'border-accent bg-[#eef4fb] text-accent hover:bg-[#dce9f8]'
                            : 'border-gray-200 bg-white text-slate-500 opacity-60 hover:border-accent hover:bg-[#eef4fb] hover:text-accent group-hover:opacity-100'
                        }`}
                      >
                        <IconEye size={14} />
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
              <button onClick={() => setPage(1)} disabled={safePage === 1} title="หน้าแรก" className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">
                <IconChevronsLeft size={16} />
              </button>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1} title="ก่อนหน้า" className="flex h-8 items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 text-[12.5px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">
                <IconChevronLeft size={15} />
                ก่อนหน้า
              </button>
              {pageItems.map((p, i) =>
                p === 'gap' ? (
                  <span key={`gap${i}`} className="px-1 text-xs text-slate-400">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`mono flex h-8 min-w-[32px] items-center justify-center rounded-lg border px-2 text-[12.5px] font-semibold transition ${
                      p === safePage ? 'border-accent bg-accent text-white' : 'border-gray-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} title="ถัดไป" className="flex h-8 items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 text-[12.5px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">
                ถัดไป
                <IconChevronRight size={15} />
              </button>
              <button onClick={() => setPage(totalPages)} disabled={safePage === totalPages} title="หน้าสุดท้าย" className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">
                <IconChevronsRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {view && (
        <RequestDetailModal
          item={view}
          onClose={() => setViewKey(null)}
          onPickAction={onAction ? (action) => setConfirm({ item: view, action }) : undefined}
          // ฟอร์มในแท็บ (ดำเนินการ/ปิดงานรับเรื่อง/สำรวจ) ยิง action ตรงผ่าน onAction
          // ไม่ต้องผ่านกล่องยืนยัน — panel เป็นคนกำหนด code/fields เอง
          onStepSubmit={onAction ? (action, fields) => onAction(view, action, '', fields) : undefined}
          onEdited={onEdited}
          actionPending={actionPending}
          notice={notice}
          onDismissNotice={onDismissNotice}
        />
      )}

      {confirm && (
        <RequestActionDialog
          item={confirm.item}
          action={confirm.action}
          pending={!!actionPending}
          onCancel={() => setConfirm(null)}
          onConfirm={async (note, fields) => {
            await onAction?.(confirm.item, confirm.action, note, fields);
            setConfirm(null);
            // ไม่ปิดหน้ารายละเอียด — ให้ stepper เดินหน้าโชว์ขั้นถัดไป (รับเรื่อง → ดำเนินการ)
            // ถ้าใบหลุดจากลิสต์ (ย้ายคิว/ถูกกรอง) view จะกลายเป็น null แล้ว modal ปิดเอง
          }}
        />
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  color,
  bg,
  active,
  onClick,
}: {
  label: string;
  value: number;
  color: string;
  bg: string;
  active?: boolean;
  onClick?: () => void;
}) {
  const body = (
    <>
      <span
        className="mono flex h-7 min-w-[28px] items-center justify-center rounded-lg px-1.5 text-[13px] font-bold"
        style={{ background: bg, color }}
      >
        {value}
      </span>
      <span className={`text-[11.5px] font-medium ${active ? 'text-gray-900' : 'text-slate-500'}`}>{label}</span>
    </>
  );

  if (!onClick) {
    return <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-1.5">{body}</div>;
  }
  return (
    <button
      type="button"
      onClick={onClick}
      title={`ดูเฉพาะ ${label}`}
      className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 transition ${
        active ? 'border-accent bg-[#eef4fb] shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-slate-50'
      }`}
    >
      {body}
    </button>
  );
}
