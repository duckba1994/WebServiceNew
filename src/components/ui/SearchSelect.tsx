import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { IconSearch, IconX, IconChevronDown, IconAlertTriangle } from '@tabler/icons-react';

export interface SearchOption {
  value: string;
  label: string;
  hint?: string; // ข้อความรอง เช่น รหัส/ชื่อย่อ (ใช้ค้นหาได้ด้วย)
}

const MAX_SHOWN = 100; // จำกัดจำนวนแถวที่เรนเดอร์เพื่อประสิทธิภาพ

// ── Combobox ค้นหาได้ แต่เลือกได้เฉพาะค่าที่มีในรายการ ─────────
// ข้อความที่พิมพ์เป็น "คำค้น" เท่านั้น ไม่ถูกบันทึกเป็นค่า —
// ค่าจะถูกตั้งก็ต่อเมื่อผู้ใช้เลือกรายการจริง (กันข้อมูลที่ไม่ตรง master)
// นี่คือคอมโบบ็อกซ์มาตรฐานของโปรเจกต์ — ทุกหน้าต้องใช้ตัวนี้ ห้ามเขียนใหม่รายหน้า
export function SearchSelect({
  value,
  onChange,
  options,
  placeholder = '-- เลือก --',
  emptyText = 'ไม่พบข้อมูลที่ตรงกับคำค้น',
  disabled,
  invalid,
  autoFocus,
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  options: SearchOption[];
  placeholder?: string;
  emptyText?: string;
  disabled?: boolean;
  invalid?: boolean;
  autoFocus?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0); // ไฮไลต์อยู่แถวที่เท่าไรของ shown
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);

  const matched = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || (o.hint ?? '').toLowerCase().includes(q)
    );
  }, [query, options]);
  const shown = useMemo(() => matched.slice(0, MAX_SHOWN), [matched]);

  // กัน active ค้างเกินขอบเขตเมื่อผลการค้นหาสั้นลง
  const activeIdx = shown.length === 0 ? -1 : Math.min(active, shown.length - 1);

  const choose = (o: SearchOption) => {
    onChange(o.value);
    setQuery('');
    setOpen(false);
    setActive(0);
  };

  const openList = useCallback(() => {
    if (disabled) return;
    setOpen(true);
    setQuery('');
    // ไฮไลต์เริ่มต้นที่รายการที่เลือกไว้ (ถ้าอยู่ในช่วงที่แสดง)
    const idx = value ? options.slice(0, MAX_SHOWN).findIndex((o) => o.value === value) : -1;
    setActive(idx >= 0 ? idx : 0);
  }, [disabled, options, value]);

  // ปิดโดยไม่เลือก → ทิ้งคำค้น (ไม่บันทึกข้อความที่พิมพ์เป็นค่า)
  const closeWithoutPick = useCallback(() => {
    setOpen(false);
    setQuery('');
    setActive(0);
  }, []);

  // ปิดเมื่อคลิกนอกคอมโพเนนต์ — ใช้ listener แทน overlay เต็มจอ
  // (overlay จะกินคลิกแรกของผู้ใช้เสมอ ทำให้ต้องคลิกสองครั้ง)
  useEffect(() => {
    if (!open) return;
    const onDocDown = (e: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) closeWithoutPick();
    };
    document.addEventListener('mousedown', onDocDown);
    document.addEventListener('touchstart', onDocDown);
    return () => {
      document.removeEventListener('mousedown', onDocDown);
      document.removeEventListener('touchstart', onDocDown);
    };
  }, [open, closeWithoutPick]);

  // ถูกสั่ง disable ระหว่างเปิดอยู่ → ปิดให้เรียบร้อย
  useEffect(() => {
    if (disabled && open) closeWithoutPick();
  }, [disabled, open, closeWithoutPick]);

  // เลื่อนแถวที่ไฮไลต์ให้เห็นเสมอ
  useEffect(() => {
    if (!open || activeIdx < 0) return;
    const el = listRef.current?.children[activeIdx] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx, open]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        openList();
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        // ลบค่าที่เลือกได้จากคีย์บอร์ด (ช่องแสดง label แบบอ่านอย่างเดียวตอนปิด)
        if (selected) {
          e.preventDefault();
          onChange('');
        }
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(Math.min(activeIdx + 1, shown.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(Math.max(activeIdx - 1, 0));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActive(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActive(shown.length - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const o = shown[activeIdx];
      if (o) choose(o); // เลือกได้เฉพาะรายการที่มีจริงเท่านั้น
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeWithoutPick();
    } else if (e.key === 'Tab') {
      closeWithoutPick();
    }
  };

  const inputCls = `w-full rounded-lg border bg-slate-50 dark:bg-slate-800/60 py-2 pl-8 text-[13px] text-gray-800 dark:text-slate-100 outline-none transition focus:bg-white dark:focus:bg-slate-900 ${
    invalid ? 'border-red-400 bg-red-50 dark:bg-red-950/40 focus:border-red-500' : 'border-gray-200 dark:border-slate-700 focus:border-accent'
  } ${disabled ? 'cursor-not-allowed bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500' : ''} ${
    selected && !open ? 'pr-14' : 'pr-8'
  } ${className}`;

  const listId = useRef(`ss-${Math.random().toString(36).slice(2, 9)}`).current;

  return (
    <div className="relative" ref={rootRef}>
      <div className="relative">
        <IconSearch size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          autoFocus={autoFocus}
          disabled={disabled}
          value={open ? query : selected?.label ?? ''}
          placeholder={selected ? selected.label : placeholder}
          onFocus={openList}
          // คลิกที่ช่องต้อง toggle ได้เสมอ — หลังเลือกค่า input ยัง focus อยู่
          // (รายการใช้ onMouseDown+preventDefault) onFocus จึงไม่ยิงซ้ำ
          onMouseDown={() => {
            if (disabled) return;
            if (open) closeWithoutPick();
            else openList();
          }}
          onKeyDown={onKeyDown}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            if (!open) setOpen(true);
          }}
          className={inputCls}
        />
        {selected && !open && !disabled && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()} // กันไม่ให้ input โฟกัส/เปิดรายการก่อนล้างค่า
            onClick={() => {
              onChange('');
              inputRef.current?.focus();
            }}
            title="ล้างการเลือก"
            className="absolute right-7 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded text-gray-400 dark:text-slate-500 transition hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-700"
          >
            <IconX size={13} />
          </button>
        )}
        <IconChevronDown
          size={15}
          className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 transition ${
            open ? 'rotate-180' : ''
          }`}
        />
      </div>

      {open && (
        <div
          id={listId}
          role="listbox"
          ref={listRef}
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[260px] overflow-auto rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-1 shadow-xl"
        >
          {shown.length === 0 ? (
            <div className="flex items-center gap-2 px-3 py-3 text-[12px] text-amber-700 dark:text-amber-300">
              <IconAlertTriangle size={14} className="shrink-0" />
              {emptyText}
            </div>
          ) : (
            shown.map((o, idx) => (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={o.value === value}
                // onMouseDown กัน input เสีย focus ก่อนคลิกติด
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(o);
                }}
                onMouseEnter={() => setActive(idx)}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] transition ${
                  o.value === value
                    ? 'bg-blue-50 dark:bg-blue-950/40 font-semibold text-accent'
                    : idx === activeIdx
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-800'
                    : 'text-slate-700 dark:text-slate-200'
                }`}
              >
                <span className="truncate">{o.label}</span>
                {o.hint && <span className="mono ml-auto shrink-0 text-[11px] text-slate-400 dark:text-slate-500">{o.hint}</span>}
              </button>
            ))
          )}
          {matched.length > shown.length && (
            <div className="border-t border-gray-100 dark:border-slate-800 px-3 py-1.5 text-[11px] text-gray-400 dark:text-slate-500">
              แสดง {shown.length} จาก {matched.length} รายการ — พิมพ์เพื่อค้นหาให้แคบลง
            </div>
          )}
        </div>
      )}
    </div>
  );
}
