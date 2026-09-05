import React, { useState } from 'react';
import { IconCalendar, IconX } from '@tabler/icons-react';
import {
  DateRangeKey,
  DateRangeValue,
  RANGE_PRESETS,
  isRangeInvalid,
  rangeOf,
  rangeText,
} from '../../data/dateRange';

// ── ตัวกรอง "ช่วงวันที่แจ้ง" ของตารางใบแจ้งเรื่อง ────────────────
// ค่าที่ได้ถูกส่งไปกรองที่ API (dateFrom/dateTo) ไม่ใช่กรองในตาราง
// → เปลี่ยนช่วง = ยิงใหม่ ข้อมูลที่ดึงมาจึงเท่าที่ต้องดูจริง
//
// ปุ่มลัดเก็บเป็น key ไม่ใช่วันที่ที่คำนวณแล้ว เพราะช่วงต้องขยับตามวันปัจจุบัน
// (หน้าเปิดค้างข้ามวัน "30 วัน" ต้องยังหมายถึง 30 วันล่าสุดจริง ๆ)
export function DateRangeFilter({
  presetKey,
  value,
  onChange,
  label = 'ช่วงวันที่แจ้ง',
}: {
  presetKey: DateRangeKey;
  value: DateRangeValue;
  onChange: (key: DateRangeKey, value: DateRangeValue) => void;
  label?: string;
}) {
  const [openCustom, setOpenCustom] = useState(false);
  const invalid = isRangeInvalid(value);

  const pick = (key: Exclude<DateRangeKey, 'custom'>) => {
    setOpenCustom(false);
    onChange(key, rangeOf(key));
  };

  const setCustom = (patch: Partial<DateRangeValue>) =>
    onChange('custom', { ...value, ...patch });

  return (
    <div className="flex items-center gap-2">
      <span className="text-[11.5px] font-semibold text-gray-500">{label}</span>
      <div className="flex gap-0.5 rounded-lg border border-gray-200 bg-[#eef1f6] p-1">
        {RANGE_PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => pick(p.key)}
            className={`rounded-md px-2.5 py-1.5 text-[12.5px] font-semibold transition ${
              presetKey === p.key
                ? 'bg-[#0b1220] text-white shadow-sm'
                : 'text-slate-600 hover:text-gray-900'
            }`}
          >
            {p.label}
          </button>
        ))}
        <div className="relative">
          <button
            onClick={() => setOpenCustom((v) => !v)}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[12.5px] font-semibold transition ${
              presetKey === 'custom'
                ? 'bg-[#0b1220] text-white shadow-sm'
                : 'text-slate-600 hover:text-gray-900'
            }`}
          >
            <IconCalendar size={13} />
            กำหนดเอง
          </button>

          {openCustom && (
            <>
              {/* คลิกนอกกล่องเพื่อปิด */}
              <div className="fixed inset-0 z-40" onClick={() => setOpenCustom(false)} />
              <div
                className="absolute left-0 top-full z-50 mt-1.5 w-[268px] rounded-xl border border-gray-200 bg-white p-3 shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-slate-700">ระบุช่วงวันที่</span>
                  <button
                    onClick={() => setOpenCustom(false)}
                    className="rounded p-0.5 text-gray-400 hover:bg-slate-100 hover:text-gray-700"
                  >
                    <IconX size={13} />
                  </button>
                </div>
                <label className="mb-1 block text-[11.5px] font-semibold text-gray-500">จากวันที่</label>
                <input
                  type="date"
                  value={value.from}
                  onChange={(e) => setCustom({ from: e.target.value })}
                  className="mono mb-2 w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-[12.5px] outline-none focus:border-accent"
                />
                <label className="mb-1 block text-[11.5px] font-semibold text-gray-500">ถึงวันที่</label>
                <input
                  type="date"
                  value={value.to}
                  min={value.from || undefined}
                  onChange={(e) => setCustom({ to: e.target.value })}
                  className="mono w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-[12.5px] outline-none focus:border-accent"
                />
                {invalid && (
                  <p className="mt-2 text-[11.5px] font-semibold text-red-600">
                    วันเริ่มต้นอยู่หลังวันสิ้นสุด — ยังไม่ได้กรองข้อมูลใหม่
                  </p>
                )}
                <button
                  onClick={() => {
                    setOpenCustom(false);
                    onChange('all', rangeOf('all'));
                  }}
                  className="mt-2.5 w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  ล้างช่วงวันที่ (ดูทั้งหมด)
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ป้ายช่วงที่กำลังกรอง — ต้องเห็นได้ว่าตารางนี้ไม่ใช่ข้อมูลทั้งหมด */}
      <span
        className={`mono rounded-md px-2 py-1 text-[11.5px] font-semibold ${
          invalid ? 'bg-red-50 text-red-600' : 'bg-white text-slate-500'
        }`}
        title="ตารางแสดงเฉพาะใบที่วันที่แจ้งอยู่ในช่วงนี้"
      >
        {rangeText(value)}
      </span>
    </div>
  );
}
