import React, { useMemo, useState } from 'react';
import { IconAlertTriangle, IconLoader2, IconChevronDown } from '@tabler/icons-react';
import { RequestAction, RequestListItem } from '../../types/requestList';
import {
  ActionField,
  ActionFieldValue,
  ActionFieldValues,
  cleanFieldValues,
  fieldSpec,
  missingRequired,
  optionalGroupsOf,
} from '../../data/requestActionFields';

// สีปุ่มมาจาก style ที่ API ส่งมา — ไม่ได้ผูกกับชื่อ action
// แผนกใหม่ส่ง action อะไรมาก็ได้สีถูกเอง โดยหน้าเว็บไม่ต้องรู้จัก
export const ACTION_BTN_CLASS: Record<string, string> = {
  primary: 'border-accent bg-accent text-white hover:bg-[#17539f]',
  success: 'border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700',
  danger: 'border-rose-600 bg-rose-600 text-white hover:bg-rose-700',
  neutral: 'border-gray-300 bg-white text-slate-700 hover:bg-slate-50',
};

export const actionBtnClass = (style: string): string =>
  ACTION_BTN_CLASS[style] ?? ACTION_BTN_CLASS.neutral;

const INPUT_CLS =
  'w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none transition focus:border-accent';

// ฟอร์มในกล่องนี้มีแต่ช่องค่าเดี่ยว — ฟิลด์แบบกลุ่ม (เช่น surveyRatings) วาดในแท็บของมันเอง
const scalar = (v: ActionFieldValue | undefined): string | number | undefined =>
  typeof v === 'string' || typeof v === 'number' ? v : undefined;

// ── คะแนนความพึงพอใจ 1–25 ────────────────────────────────────
// API รับเป็นตัวเลขเดียว 1–25 (เต็ม 25 = 5 หัวข้อ × 5 ระดับ) แต่ยังไม่ได้บอกว่า
// 5 หัวข้อนั้นคืออะไร → ให้เลือกระดับรวมก่อน (เร็วสุด) แล้วปรับตัวเลขละเอียดได้
const SCORE_LEVELS = [
  { score: 5, label: 'ไม่พอใจมาก' },
  { score: 10, label: 'ไม่พอใจ' },
  { score: 15, label: 'พอใช้' },
  { score: 20, label: 'พอใจ' },
  { score: 25, label: 'พอใจมาก' },
];

function ScoreInput({
  value,
  onChange,
  spec,
}: {
  value: string | number | undefined;
  onChange: (v: number) => void;
  spec: ActionField;
}) {
  const min = spec.min ?? 1;
  const max = spec.max ?? 25;
  const num = typeof value === 'number' ? value : Number(value);
  const valid = value !== undefined && value !== '' && !Number.isNaN(num) && num >= min && num <= max;
  const pct = valid ? Math.round((num * 100) / max) : 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {SCORE_LEVELS.map((lv) => (
          <button
            key={lv.score}
            type="button"
            onClick={() => onChange(lv.score)}
            className={`rounded-lg border px-2.5 py-1.5 text-[12px] font-semibold transition ${
              num === lv.score
                ? 'border-accent bg-accent text-white'
                : 'border-gray-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {lv.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={min}
          max={max}
          value={value === undefined ? '' : String(value)}
          onChange={(e) => onChange(Number(e.target.value))}
          className={`${INPUT_CLS} w-24`}
        />
        <span className="text-[12px] text-slate-500">
          / {max} คะแนน
          {valid && <b className="ml-1.5 text-gray-800">({pct}%)</b>}
        </span>
      </div>
    </div>
  );
}

function FieldInput({
  spec,
  required,
  value,
  invalid,
  onChange,
}: {
  spec: ActionField;
  required: boolean;
  value: string | number | undefined;
  invalid: boolean;
  onChange: (v: string | number) => void;
}) {
  const cls = `${INPUT_CLS} ${invalid ? 'border-rose-300 bg-rose-50/40' : ''}`;
  return (
    <div className={spec.wide || spec.type === 'score' ? 'col-span-2' : ''}>
      <label className="mb-1 block text-[11.5px] font-semibold text-gray-500">
        {spec.label}
        {required && <span className="text-rose-600"> *</span>}
      </label>

      {spec.type === 'score' ? (
        <ScoreInput value={value} onChange={onChange} spec={spec} />
      ) : spec.type === 'textarea' ? (
        <textarea
          rows={3}
          value={(value as string) ?? ''}
          placeholder={spec.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`${cls} resize-none`}
        />
      ) : spec.type === 'select' ? (
        <select
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className={`${cls} cursor-pointer`}
        >
          <option value="">— ไม่ระบุ —</option>
          {(spec.options ?? []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.text}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={spec.type === 'date' ? 'date' : 'text'}
          value={(value as string) ?? ''}
          placeholder={spec.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={cls}
        />
      )}

      {spec.hint && <p className="mt-1 text-[11px] text-slate-400">{spec.hint}</p>}
    </div>
  );
}

// ── ยืนยัน + กรอกข้อมูลก่อนทำรายการ ───────────────────────────
// ทุก action เปลี่ยนสถานะจริงและย้อนกลับไม่ได้ จึงต้องยืนยันก่อนเสมอ
export function RequestActionDialog({
  item,
  action,
  pending,
  onCancel,
  onConfirm,
}: {
  item: RequestListItem;
  action: RequestAction;
  pending: boolean;
  onCancel: () => void;
  onConfirm: (note: string, fields?: ActionFieldValues) => void;
}) {
  const [note, setNote] = useState('');
  const [values, setValues] = useState<ActionFieldValues>({});
  const [showOptional, setShowOptional] = useState(false);
  const [touched, setTouched] = useState(false);

  const required = useMemo(() => action.requiredFields ?? [], [action.requiredFields]);

  // ฟิลด์ที่บังคับอยู่แล้ว ไม่ต้องโผล่ซ้ำในกลุ่มไม่บังคับ
  const optionalGroups = useMemo(
    () =>
      optionalGroupsOf(action.code, item.module)
        .map((g) => ({ ...g, fields: g.fields.filter((f) => !required.includes(f)) }))
        .filter((g) => g.fields.length > 0),
    [action.code, item.module, required]
  );

  const missing = missingRequired(required, values);
  const noteMissing = action.requireNote && note.trim() === '';
  const blocked = missing.length > 0 || noteMissing;

  const set = (name: string) => (v: string | number) => setValues((prev) => ({ ...prev, [name]: v }));

  // ฟอร์มที่มีฟิลด์ให้กรอกต้องกว้างกว่ากล่องยืนยันเปล่า ๆ
  const wide = required.length > 0 || optionalGroups.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="backdrop-fade-in absolute inset-0 bg-slate-900/50" onClick={pending ? undefined : onCancel} />
      <div
        className={`modal-pop relative flex max-h-[92vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ${
          wide ? 'w-[min(640px,96vw)]' : 'w-[min(460px,96vw)]'
        }`}
      >
        <div className="flex shrink-0 items-start gap-3 px-5 pb-3 pt-5">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <IconAlertTriangle size={19} />
          </span>
          <div className="min-w-0">
            <h3 className="text-[15px] font-bold text-gray-900">ยืนยัน{action.label}</h3>
            <p className="mt-0.5 text-[12.5px] text-slate-500">
              ใบเลขที่ <span className="mono font-semibold text-gray-700">{item.docNo}</span>
              {' · '}
              <span className="mono font-semibold text-gray-700">{item.module}</span>
              {item.requestBy ? ` · ${item.requestBy}` : ''}
            </p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">
          {item.detail && (
            <div className="mb-4 max-h-24 overflow-y-auto rounded-lg border border-gray-200 bg-slate-50 px-3 py-2 text-[12.5px] text-slate-600">
              {item.detail}
            </div>
          )}

          {required.length > 0 && (
            <div className="mb-4 grid grid-cols-2 gap-x-4 gap-y-3">
              {required.map((name) => (
                <FieldInput
                  key={name}
                  spec={fieldSpec(name)}
                  required
                  value={scalar(values[name])}
                  invalid={touched && missing.includes(name)}
                  onChange={set(name)}
                />
              ))}
            </div>
          )}

          {optionalGroups.map((g) => (
            <div key={g.title} className="mb-3 rounded-lg border border-gray-200">
              <button
                type="button"
                onClick={() => setShowOptional((v) => !v)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left transition hover:bg-slate-50"
              >
                <IconChevronDown
                  size={15}
                  className={`shrink-0 text-slate-400 transition ${showOptional ? '' : '-rotate-90'}`}
                />
                <span className="text-[12.5px] font-semibold text-gray-700">{g.title}</span>
                <span className="text-[11px] text-slate-400">(ไม่บังคับ)</span>
              </button>
              {showOptional && (
                <div className="border-t border-gray-100 px-3 py-3">
                  {g.hint && <p className="mb-2.5 text-[11.5px] text-slate-500">{g.hint}</p>}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    {g.fields.map((name) => (
                      <FieldInput
                        key={name}
                        spec={fieldSpec(name)}
                        required={false}
                        value={scalar(values[name])}
                        invalid={false}
                        onChange={set(name)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* ช่องเหตุผลโผล่เฉพาะตอน API บังคับ — backend ยังไม่มีคอลัมน์เก็บ note
              (API v2.2 §10 "รับค่าไว้แต่ละไว้") ถ้าโชว์ช่องให้กรอกทั้งที่ค่าหาย จะหลอกผู้ใช้ */}
          {action.requireNote && (
            <div>
              <label className="mb-1 block text-[11.5px] font-semibold text-gray-500">
                เหตุผล<span className="text-rose-600"> *</span>
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="ระบุเหตุผล..."
                className={`${INPUT_CLS} resize-none ${noteMissing && touched ? 'border-rose-300 bg-rose-50/40' : ''}`}
              />
            </div>
          )}

          {touched && blocked && (
            <p className="mt-2 text-[11.5px] font-semibold text-rose-600">
              {noteMissing
                ? 'ต้องระบุเหตุผลก่อนยืนยัน'
                : `ยังกรอกไม่ครบ: ${missing.map((m) => fieldSpec(m).label).join(', ')}`}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-gray-100 bg-slate-50 px-5 py-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={() => {
              setTouched(true);
              if (blocked) return;
              onConfirm(note, cleanFieldValues(values));
            }}
            disabled={pending}
            className={`flex items-center gap-1.5 rounded-lg border px-4 py-2 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${actionBtnClass(
              action.style
            )}`}
          >
            {pending && <IconLoader2 size={15} className="animate-spin" />}
            {action.label}
          </button>
        </div>
      </div>
    </div>
  );
}
