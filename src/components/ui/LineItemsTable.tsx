import React from 'react';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import {
  LineItem,
  LineItemsVariant,
  emptyLineItem,
  lineTotal,
  lineItemsTotal,
  formatBaht,
  UNIT_OPTIONS,
} from '../../data/requestForm';

// ── ตารางรายการย่อย (reusable) ───────────────────────────────
// ใช้กับฟอร์มที่ต้องกรอกหลายรายการ — คอลัมน์ขึ้นกับ variant:
//   purchase = รายการ/จำนวน/หน่วย/ราคา/ผู้ขาย/รวม (จัดซื้อ — สืบราคาหลายรายการ)
//   simple   = รายการ/จำนวน/หน่วย/หมายเหตุ (PL — ขอของ/ขอบริการ ไม่มีราคา)
const CELL_CLS =
  'w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[12.5px] text-gray-800 outline-none transition focus:border-accent';

export function LineItemsTable({
  value,
  onChange,
  accentColor = '#1a5fb4',
  variant = 'purchase',
  invalid,
}: {
  value: LineItem[];
  onChange: (items: LineItem[]) => void;
  accentColor?: string;
  variant?: LineItemsVariant;
  invalid?: boolean;
}) {
  const withPrice = variant === 'purchase';
  const update = (id: string, patch: Partial<LineItem>) =>
    onChange(value.map((li) => (li.id === id ? { ...li, ...patch } : li)));

  const addRow = () => onChange([...value, emptyLineItem()]);
  // เหลือแถวสุดท้าย → ล้างค่าแทนการลบ (ตารางต้องมีอย่างน้อย 1 แถว)
  const removeRow = (id: string) =>
    onChange(value.length <= 1 ? [emptyLineItem()] : value.filter((li) => li.id !== id));

  const total = withPrice ? lineItemsTotal(value) : 0;

  return (
    <div className={`overflow-hidden rounded-xl border ${invalid ? 'border-red-300' : 'border-gray-200'}`}>
      <div className="overflow-x-auto">
        <table className={`w-full border-collapse ${withPrice ? 'min-w-[720px]' : 'min-w-[560px]'}`}>
          <thead>
            <tr className="bg-[#0b1220] text-[11.5px] font-semibold text-slate-300">
              <th className="w-10 px-2 py-2 text-center">#</th>
              <th className="px-2 py-2 text-left">{withPrice ? 'รายการ / อะไหล่' : 'รายการ'}</th>
              <th className="w-20 px-2 py-2 text-center">จำนวน</th>
              <th className="w-24 px-2 py-2 text-center">หน่วย</th>
              {withPrice ? (
                <>
                  <th className="w-28 px-2 py-2 text-right">ราคา/หน่วย</th>
                  <th className="w-40 px-2 py-2 text-left">ผู้ขาย / ร้านค้า</th>
                  <th className="w-28 px-2 py-2 text-right">รวม</th>
                </>
              ) : (
                <th className="px-2 py-2 text-left">หมายเหตุ</th>
              )}
              <th className="w-10 px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {value.map((li, i) => (
              <tr key={li.id} className="border-b border-[#eef1f6] bg-white last:border-b-0">
                <td className="mono px-2 py-1.5 text-center text-[12px] text-slate-400">{i + 1}</td>
                <td className="px-2 py-1.5">
                  <input
                    value={li.name}
                    onChange={(e) => update(li.id, { name: e.target.value })}
                    placeholder={withPrice ? 'ชื่ออะไหล่ / วัสดุ' : 'ชื่อรายการที่ต้องการ'}
                    className={CELL_CLS}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    value={li.qty}
                    onChange={(e) => update(li.id, { qty: e.target.value.replace(/[^0-9.]/g, '') })}
                    inputMode="decimal"
                    placeholder="0"
                    className={`${CELL_CLS} mono text-right`}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <select
                    value={li.unit}
                    onChange={(e) => update(li.id, { unit: e.target.value })}
                    className={`${CELL_CLS} cursor-pointer`}
                  >
                    <option value="">—</option>
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </td>
                {withPrice ? (
                  <>
                    <td className="px-2 py-1.5">
                      <input
                        value={li.price}
                        onChange={(e) => update(li.id, { price: e.target.value.replace(/[^0-9.]/g, '') })}
                        inputMode="decimal"
                        placeholder="0.00"
                        className={`${CELL_CLS} mono text-right`}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        value={li.vendor}
                        onChange={(e) => update(li.id, { vendor: e.target.value })}
                        placeholder="ชื่อร้าน / ผู้ขาย"
                        className={CELL_CLS}
                      />
                    </td>
                    <td className="mono px-2 py-1.5 text-right text-[12.5px] font-semibold text-gray-900">
                      {formatBaht(lineTotal(li))}
                    </td>
                  </>
                ) : (
                  <td className="px-2 py-1.5">
                    <input
                      value={li.note}
                      onChange={(e) => update(li.id, { note: e.target.value })}
                      placeholder="หมายเหตุ (ถ้ามี)"
                      className={CELL_CLS}
                    />
                  </td>
                )}
                <td className="px-2 py-1.5 text-center">
                  <button
                    type="button"
                    onClick={() => removeRow(li.id)}
                    title="ลบรายการนี้"
                    className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 bg-white text-slate-400 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                  >
                    <IconTrash size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-gray-200 bg-slate-50 px-3 py-2">
        <button
          type="button"
          onClick={addRow}
          style={{ color: accentColor, borderColor: accentColor }}
          className="flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-[12.5px] font-semibold transition hover:bg-slate-50"
        >
          <IconPlus size={14} stroke={2.2} />
          เพิ่มรายการ
        </button>
        {withPrice ? (
          <div className="ml-auto flex items-baseline gap-2">
            <span className="text-[12px] font-semibold text-slate-500">รวมทั้งสิ้น</span>
            <span className="mono text-[15px] font-bold text-gray-900">{formatBaht(total)}</span>
            <span className="text-[12px] text-slate-500">บาท</span>
          </div>
        ) : (
          <div className="ml-auto flex items-baseline gap-2">
            <span className="text-[12px] font-semibold text-slate-500">จำนวนรายการ</span>
            <span className="mono text-[15px] font-bold text-gray-900">
              {value.filter((li) => li.name.trim() !== '').length}
            </span>
            <span className="text-[12px] text-slate-500">รายการ</span>
          </div>
        )}
      </div>
    </div>
  );
}
