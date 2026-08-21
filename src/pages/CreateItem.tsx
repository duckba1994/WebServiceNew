import React, { useMemo, useState } from 'react';
import {
  IconBuildingCommunity,
  IconArrowLeft,
  IconAlertTriangle,
  IconCheck,
  IconSend,
  IconLoader2,
  IconArrowRight,
  IconLock,
} from '@tabler/icons-react';
import { Layout } from '../components/layout/Layout';
import { ImageUpload } from '../components/ui/ImageUpload';
import { LineItemsTable } from '../components/ui/LineItemsTable';
import { SearchSelect, SearchOption } from '../components/ui/SearchSelect';
import { RequestPriority } from '../types/request';
import { DepartmentApi } from '../types/masterData';
import { deptMeta, REQUEST_PRIORITY_META } from '../data/requestData';
import { useDepartments } from '../hooks/useDepartments';
import {
  IT_ATTACHMENT_SLOTS,
  checkItAttachment,
  createItRequest,
  uploadItAttachment,
} from '../api/itRequest';
import { useAuth } from '../context/AuthContext';
import {
  FieldDef,
  RequestFormState,
  FormErrors,
  AutoFillValues,
  createEmptyForm,
  validateRequestForm,
  getDeptForm,
  commonFieldsOf,
  DETAIL_MAX_LEN,
  DEPT_FORMS,
  summaryTitle,
  fieldOptions,
} from '../data/requestForm';

// จำนวนช่องรูปของใบ IT (ImgPath1/2/3) — ฟอร์มจำกัดที่ max: 3 อยู่แล้ว
// แต่ต้องกันไว้อีกชั้นตอนอัป เผื่อ schema ฝั่งฟอร์มถูกแก้แล้วลืมช่องฝั่ง API
const IT_IMAGE_SLOTS = IT_ATTACHMENT_SLOTS.length;


const INPUT_CLS =
  'rounded-lg border border-gray-200 bg-slate-50 px-3 py-2 text-[13px] text-gray-800 outline-none transition focus:bg-white';
const INVALID_CLS = '!border-red-400 !bg-red-50';

const PRIORITIES: RequestPriority[] = ['low', 'normal', 'high', 'urgent'];

// ── ป้ายกำกับ + ช่องกรอก ─────────────────────────────────────
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
        {hint && <span className="text-[10.5px] font-normal text-gray-400">{hint}</span>}
      </span>
      {children}
      {error && <span className="text-[11px] font-medium text-red-500">{error}</span>}
    </div>
  );
}

function SectionCard({
  title,
  no,
  accentColor,
  children,
}: {
  title: string;
  no: number;
  accentColor: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <span
          className="flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold text-white"
          style={{ backgroundColor: accentColor }}
        >
          {no}
        </span>
        <h3 className="text-[15px] font-bold text-gray-800">{title}</h3>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">{children}</div>
    </section>
  );
}

// แปลงแผนกจาก API → ตัวเลือกของ combobox (ค้นได้ทั้งชื่อเต็ม ชื่อย่อ และรหัส)
const toDeptOptions = (rows: DepartmentApi[]): SearchOption[] =>
  rows.map((d) => ({
    value: d.departid,
    label: d.departmentShort ? `${d.departmentName} (${d.departmentShort})` : d.departmentName,
    hint: d.departid,
  }));

// ══════════════════════════════════════════════════════════════
// ขั้นที่ 1 — เลือกแผนกปลายทาง (combobox ค้นหาได้ เลือกได้เฉพาะใน master)
// ══════════════════════════════════════════════════════════════
function DeptPicker({
  departments,
  loading,
  error,
  reload,
  onPick,
}: {
  departments: DepartmentApi[];
  loading: boolean;
  error: string | null;
  reload: () => void;
  onPick: (d: DepartmentApi) => void;
}) {
  const [departid, setDepartid] = useState('');
  const options = useMemo(() => toDeptOptions(departments), [departments]);
  const selected = departments.find((d) => d.departid === departid);
  const cfg = selected ? getDeptForm(selected.departmentShort) : null;
  const meta = selected ? deptMeta(selected.departmentShort) : null;
  const hasOwnForm = !!selected && !!DEPT_FORMS[selected.departmentShort];

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="shrink-0 border-b border-gray-200 px-6 py-5">
        <h2 className="text-lg font-bold text-gray-900">เลือกแผนกที่ต้องการแจ้งเรื่อง</h2>
        <p className="mt-1 text-[13px] text-slate-500">
          แต่ละแผนกใช้แบบฟอร์มและข้อมูลประกอบต่างกัน — เลือกแผนกปลายทางก่อนเพื่อแสดงฟอร์มที่ถูกต้อง
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-[#f4f6fa] p-6">
        <div className="mx-auto w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <FormRow
            label="แผนกปลายทาง"
            hint="(พิมพ์เพื่อค้นหา — เลือกได้เฉพาะแผนกในระบบ)"
            required
          >
            {error ? (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[12.5px] font-semibold text-red-700">
                <IconAlertTriangle size={15} className="shrink-0" />
                {error}
                <button
                  onClick={reload}
                  className="ml-auto rounded border border-red-300 bg-white px-2 py-0.5 text-[11.5px] font-semibold text-red-700 transition hover:bg-red-100"
                >
                  ลองใหม่
                </button>
              </div>
            ) : (
              <SearchSelect
                value={departid}
                onChange={setDepartid}
                options={options}
                disabled={loading}
                // ไม่ autoFocus — ไม่งั้นพอกลับมาหน้านี้ รายการแผนกจะเด้งเปิดเอง
                // ปล่อยให้ผู้ใช้กดเลือกเองตามจังหวะของเขา
                placeholder={loading ? 'กำลังโหลดรายชื่อแผนก...' : 'พิมพ์ชื่อแผนก หรือชื่อย่อ เช่น IT, HR'}
                emptyText="ไม่พบแผนกที่ตรงกับคำค้น — เลือกได้เฉพาะแผนกในระบบเท่านั้น"
              />
            )}
          </FormRow>

          {loading && (
            <div className="mt-3 flex items-center gap-2 text-[12.5px] text-slate-500">
              <IconLoader2 size={14} className="animate-spin text-accent" />
              กำลังโหลดรายชื่อแผนก...
            </div>
          )}

          {!loading && !error && (
            <div className="mt-2 text-[11.5px] text-gray-400">
              มีแผนกในระบบ {departments.length} แผนก
            </div>
          )}

          {/* พรีวิวแผนกที่เลือก */}
          {selected && cfg && meta && (
            <div className="mt-5 rounded-xl border border-gray-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: meta.bg, color: meta.color }}
                >
                  <IconBuildingCommunity size={20} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded-md border px-1.5 py-0.5 text-[10.5px] font-bold"
                      style={{ backgroundColor: meta.bg, color: meta.color, borderColor: meta.border }}
                    >
                      {selected.departmentShort || selected.departid}
                    </span>
                    <span className="truncate text-[14px] font-bold text-gray-900">
                      {selected.departmentName}
                    </span>
                  </div>
                  <div className="mt-0.5 truncate text-[11.5px] text-slate-500">{cfg.tagline}</div>
                </div>
              </div>
              <p className="mt-3 text-[12px] leading-relaxed text-slate-500">
                <span className="font-semibold text-slate-600">ตัวอย่างเรื่อง: </span>
                {cfg.examples}
              </p>
              {!hasOwnForm && (
                <p className="mt-2 text-[11.5px] text-amber-700">
                  แผนกนี้ยังไม่มีแบบฟอร์มเฉพาะ — จะใช้แบบฟอร์มมาตรฐาน
                </p>
              )}
            </div>
          )}

          <button
            type="button"
            disabled={!selected}
            onClick={() => selected && onPick(selected)}
            style={selected && meta ? { backgroundColor: meta.color } : undefined}
            className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-lg px-5 py-2.5 text-[13.5px] font-bold text-white shadow-md transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none"
          >
            ถัดไป — กรอกแบบฟอร์ม
            <IconArrowRight size={16} stroke={2.2} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ขั้นที่ 2 — ฟอร์มตามแผนกที่เลือก
// ══════════════════════════════════════════════════════════════
function RequestForm({
  dep,
  auto,
  onBack,
}: {
  dep: DepartmentApi;
  auto: AutoFillValues;
  onBack: () => void;
}) {
  const cfg = getDeptForm(dep.departmentShort);
  const meta = deptMeta(dep.departmentShort);
  const accentColor = meta.color;
  const commonFields = commonFieldsOf(cfg);

  const { user, isAuthenticated, sessionExpired } = useAuth();
  const [f, setF] = useState<RequestFormState>(() => createEmptyForm(dep, auto));
  const [errors, setErrors] = useState<FormErrors>({});
  const [saved, setSaved] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  // ผลของขั้นแนบรูป (ยิงหลังสร้างใบสำเร็จ) — ใบสร้างได้แล้วแม้รูปจะพลาด
  // จึงต้องแยกสถานะออกจาก sendError ไม่ให้กลบผลว่า "ส่งใบเรียบร้อย"
  const [docNo, setDocNo] = useState<string | null>(null);
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const [uploadFailed, setUploadFailed] = useState<{ name: string; reason: string }[]>([]);

  const clearError = (key: string) =>
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const n = { ...prev };
      delete n[key];
      return n;
    });

  const setTop = <K extends keyof RequestFormState>(k: K, v: RequestFormState[K]) => {
    setF((prev) => ({ ...prev, [k]: v }));
    clearError(k as string);
  };
  const setValue = (key: string, v: string) => {
    setF((prev) => ({ ...prev, values: { ...prev.values, [key]: v } }));
    clearError(key);
  };

  const errorCount = Object.keys(errors).length;

  const submit = async () => {
    const e = validateRequestForm(f);
    setErrors(e);
    setSendError(null);
    if (Object.keys(e).length > 0) {
      document.querySelector('[data-invalid="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // แผนกอื่นยังไม่มี API — คงพฤติกรรมเดิม (UI-first)
    if (dep.departmentShort !== 'IT') {
      setSaved(true);
      return;
    }

    // ฟอร์มยาว: เซสชันอาจหมดอายุระหว่างกรอก → เช็คก่อนยิง
    if (!isAuthenticated) {
      sessionExpired();
      return;
    }

    setSending(true);
    setUploadFailed([]);
    try {
      const jobNo = await createItRequest(
        {
          requestBy: f.values.reporterName ?? '',
          departid: user?.departid ?? '',
          phoneNumber: f.values.contactPhone ?? '',
          comName: f.values.computerName ?? '',
          requestDate: new Date().toISOString(),
          requestDetail: f.detail,
          remark: '', // ยังไม่มีช่องหมายเหตุในฟอร์ม
        },
        user?.token
      );
      setDocNo(jobNo);
      // ใบสร้างสำเร็จแล้ว — ตั้ง saved ก่อนอัปรูป ถึงรูปจะพลาดก็ไม่ทำให้ผลนี้หาย
      setSaved(true);
      await uploadImages(jobNo);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'บันทึกใบแจ้งเรื่องไม่สำเร็จ');
    } finally {
      setSending(false);
    }
  };

  // ── แนบรูปหลังสร้างใบ ────────────────────────────────────────
  // endpoint สร้างใบเป็น JSON ล้วน แนบรูปพร้อมกันไม่ได้ → ต้องได้ jobNo ก่อน
  // แล้วยิงทีละช่อง (slot 1-3) เรียงตามลำดับรูปที่ผู้ใช้เลือกไว้
  // ยิงทีละใบเรียงกัน ไม่ยิงพร้อมกัน เพราะ backend เขียนคนละคอลัมน์ของแถวเดียวกัน
  const uploadImages = async (jobNo: string | null) => {
    if (f.images.length === 0) return;
    if (!jobNo) {
      // ใบถูกสร้างแล้วแต่ไม่รู้เลขที่ → แนบรูปต่อไม่ได้ ต้องบอก ไม่ใช่เงียบ
      setUploadFailed(
        f.images.map((img) => ({ name: img.name, reason: 'ไม่ทราบเลขที่ใบที่เพิ่งสร้าง' }))
      );
      return;
    }
    const failed: { name: string; reason: string }[] = [];
    for (let i = 0; i < f.images.length && i < IT_IMAGE_SLOTS; i++) {
      const img = f.images[i];
      setUploading({ done: i, total: Math.min(f.images.length, IT_IMAGE_SLOTS) });
      const bad = checkItAttachment(img);
      if (bad) {
        failed.push({ name: img.name, reason: bad });
        continue;
      }
      try {
        await uploadItAttachment(jobNo, i + 1, img, user?.token);
      } catch (e) {
        failed.push({ name: img.name, reason: e instanceof Error ? e.message : 'อัปโหลดไม่สำเร็จ' });
      }
    }
    setUploading(null);
    setUploadFailed(failed);
  };

  // เรนเดอร์ช่องกรอกตามชนิดฟิลด์ที่ประกาศไว้ใน schema ของแผนก
  const renderField = (fd: FieldDef) => {
    const err = errors[fd.key];
    const bad = !!err;
    const common = `${INPUT_CLS} w-full ${bad ? INVALID_CLS : 'focus:border-accent'}`;

    switch (fd.kind) {
      // ระบบเติมให้เอง (ผู้แจ้ง/หน่วยงานจาก login, ชื่อเครื่องจาก AD) — แสดงแบบอ่านอย่างเดียว
      case 'auto': {
        const v = f.values[fd.key] ?? '';
        if (v) {
          return (
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-[13px] font-semibold text-gray-700">
              <IconLock size={14} className="shrink-0 text-gray-400" />
              <span className="truncate">{v}</span>
            </div>
          );
        }
        // ดึงมาไม่ได้ + อนุญาตให้พิมพ์เอง → กลายเป็นช่องกรอกปกติ ไม่ให้ผู้ใช้ตัน
        if (fd.fallbackEditable) {
          return (
            <input
              value={v}
              onChange={(e) => setValue(fd.key, e.target.value)}
              placeholder={fd.placeholder}
              className={common}
            />
          );
        }
        return (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12.5px] font-semibold text-amber-700">
            <IconAlertTriangle size={14} className="shrink-0" />
            ระบบดึงข้อมูลนี้ไม่ได้ — กรุณาติดต่อผู้ดูแลระบบ
          </div>
        );
      }
      case 'images':
        return (
          <ImageUpload
            value={f.images}
            onChange={(files) => {
              setF((prev) => ({ ...prev, images: files }));
              clearError(fd.key);
            }}
            max={fd.max}
            accentColor={accentColor}
            invalid={bad}
          />
        );
      case 'lineItems':
        return (
          <LineItemsTable
            variant={fd.variant}
            value={f.lineItems}
            onChange={(items) => {
              setF((prev) => ({ ...prev, lineItems: items }));
              clearError(fd.key);
            }}
            accentColor={accentColor}
            invalid={bad}
          />
        );
      case 'textarea': {
        const v = f.values[fd.key] ?? '';
        return (
          <>
            <textarea
              value={v}
              // ตัดตาม maxLen (maxLength ไม่กันการวางข้อความยาวในบางเบราว์เซอร์)
              onChange={(e) => setValue(fd.key, fd.maxLen ? e.target.value.slice(0, fd.maxLen) : e.target.value)}
              maxLength={fd.maxLen}
              rows={fd.maxLen && fd.maxLen > 500 ? 4 : 3}
              placeholder={fd.placeholder}
              className={`${common} resize-y`}
            />
            {fd.maxLen && (
              <span
                className={`mono self-end text-[11px] ${
                  v.length >= fd.maxLen ? 'font-semibold text-amber-600' : 'text-gray-400'
                }`}
              >
                {v.length}/{fd.maxLen}
              </span>
            )}
          </>
        );
      }
      case 'select':
        return (
          <select
            value={f.values[fd.key] ?? ''}
            onChange={(e) => setValue(fd.key, e.target.value)}
            className={`${common} cursor-pointer`}
          >
            <option value="">-- เลือก --</option>
            {/* ตัวเลือกอาจเก็บเป็นรหัส (id) — value = รหัสที่ส่งให้ API, label = ข้อความที่ผู้ใช้เห็น */}
            {fieldOptions(fd.options).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        );
      case 'date':
        return (
          <input
            type="date"
            value={f.values[fd.key] ?? ''}
            onChange={(e) => setValue(fd.key, e.target.value)}
            className={`${common} mono`}
          />
        );
      case 'number':
        return (
          <input
            inputMode="decimal"
            value={f.values[fd.key] ?? ''}
            onChange={(e) => setValue(fd.key, e.target.value.replace(/[^0-9.]/g, ''))}
            placeholder={fd.placeholder}
            className={`${common} mono text-right`}
          />
        );
      default:
        return (
          <input
            value={f.values[fd.key] ?? ''}
            onChange={(e) => setValue(fd.key, fd.maxLen ? e.target.value.slice(0, fd.maxLen) : e.target.value)}
            maxLength={fd.maxLen}
            placeholder={fd.placeholder}
            className={common}
          />
        );
    }
  };

  // ── ส่วนกลาง: เรนเดอร์เฉพาะฟิลด์ที่แผนกนี้ใช้ (cfg.common) ──
  const renderCommonSection = (no: number) => (
    <SectionCard
      key="__common"
      no={no}
      title={cfg.commonTitle ?? 'ข้อมูลเรื่องที่แจ้ง'}
      accentColor={accentColor}
    >
      {commonFields.includes('category') && (
        <FormRow label="ประเภทเรื่อง" required error={errors.category}>
          <select
            value={f.category}
            onChange={(e) => setTop('category', e.target.value)}
            className={`${INPUT_CLS} w-full cursor-pointer ${errors.category ? INVALID_CLS : 'focus:border-accent'}`}
          >
            <option value="">-- เลือกประเภทเรื่อง --</option>
            {cfg.categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </FormRow>
      )}

      {commonFields.includes('dueDate') && (
        <FormRow label="วันที่ต้องการให้เสร็จ" required error={errors.dueDate}>
          <input
            type="date"
            value={f.dueDate}
            onChange={(e) => setTop('dueDate', e.target.value)}
            className={`${INPUT_CLS} mono w-full ${errors.dueDate ? INVALID_CLS : 'focus:border-accent'}`}
          />
        </FormRow>
      )}

      {commonFields.includes('subject') && (
        <FormRow label="เรื่อง" required span2 error={errors.subject}>
          <input
            value={f.subject}
            onChange={(e) => setTop('subject', e.target.value)}
            placeholder="หัวข้อเรื่องโดยย่อ"
            className={`${INPUT_CLS} w-full ${errors.subject ? INVALID_CLS : 'focus:border-accent'}`}
          />
        </FormRow>
      )}

      {commonFields.includes('priority') && (
        <FormRow label="ความเร่งด่วน" required span2>
          <div className="flex flex-wrap gap-2">
            {PRIORITIES.map((p) => {
              const pm = REQUEST_PRIORITY_META[p];
              const on = f.priority === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setTop('priority', p)}
                  style={on ? { backgroundColor: pm.bg, color: pm.color, borderColor: pm.color } : undefined}
                  className={`rounded-lg border px-3.5 py-1.5 text-[12.5px] font-semibold transition ${
                    on ? 'shadow-sm' : 'border-gray-200 bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {pm.label}
                </button>
              );
            })}
          </div>
        </FormRow>
      )}

      {commonFields.includes('detail') && (
        <FormRow label="รายละเอียดที่แจ้ง" required span2 error={errors.detail}>
          <textarea
            value={f.detail}
            // ตัดที่ 1000 ตัวอักษร (maxLength ไม่กันการวางข้อความยาวในบางเบราว์เซอร์)
            onChange={(e) => setTop('detail', e.target.value.slice(0, DETAIL_MAX_LEN))}
            maxLength={DETAIL_MAX_LEN}
            rows={4}
            placeholder="อธิบายรายละเอียดของเรื่องที่ต้องการแจ้ง"
            className={`${INPUT_CLS} w-full resize-y ${errors.detail ? INVALID_CLS : 'focus:border-accent'}`}
          />
          <span
            className={`mono self-end text-[11px] ${
              f.detail.length >= DETAIL_MAX_LEN ? 'font-semibold text-amber-600' : 'text-gray-400'
            }`}
          >
            {f.detail.length}/{DETAIL_MAX_LEN}
          </span>
        </FormRow>
      )}
    </SectionCard>
  );

  // ส่วนเฉพาะแผนก — มาจาก schema ใน requestForm.ts
  const deptSections = cfg.sections.map((sec) => (no: number) => (
    <SectionCard key={sec.title} no={no} title={sec.title} accentColor={accentColor}>
      {sec.fields.map((fd) => (
        <FormRow
          key={fd.key}
          label={fd.label}
          hint={fd.hint}
          required={fd.required}
          span2={fd.span2 || fd.kind === 'lineItems' || fd.kind === 'images' || fd.kind === 'textarea'}
          error={errors[fd.key]}
        >
          {renderField(fd)}
        </FormRow>
      ))}
    </SectionCard>
  ));

  // แทรกส่วนกลางตามลำดับที่ schema กำหนด (IT: ผู้แจ้ง → รายละเอียด → รูปภาพ)
  const orderedSections = [...deptSections];
  if (commonFields.length > 0) {
    const at = Math.min(Math.max(cfg.commonPosition ?? 0, 0), deptSections.length);
    orderedSections.splice(at, 0, renderCommonSection);
  }

  if (saved) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex max-w-md flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <IconCheck size={34} stroke={2.2} />
          </div>
          <h2 className="mt-4 text-lg font-bold text-gray-900">ส่งใบแจ้งเรื่องเรียบร้อย</h2>
          <p className="mt-1.5 text-[13px] text-slate-500">
            {/* แผนกที่ไม่มีช่อง "เรื่อง": IT ใช้ต้นข้อความรายละเอียด, PL ใช้ "เรื่องที่แจ้ง" */}
            เรื่อง "{summaryTitle(f)}" ถูกส่งไปยัง {dep.departmentName} แล้ว
            ติดตามสถานะได้ที่เมนู "เรื่องที่แจ้งออกไป"
          </p>
          {docNo && (
            <p className="mono mt-2 rounded-lg border border-gray-200 bg-slate-50 px-3 py-1 text-[12.5px] font-bold text-gray-800">
              เลขที่ใบ {docNo}
            </p>
          )}

          {/* ── ผลของขั้นแนบรูป (ยิงหลังสร้างใบ) ──────────────────
              ใบสร้างสำเร็จแล้วเสมอเมื่อมาถึงจอนี้ — รูปพลาดเป็นเรื่องแยก
              ต้องบอกให้ชัดว่ารูปไหนไม่ขึ้นและเพราะอะไร แล้วชี้ทางแก้ต่อ */}
          {uploading && (
            <p className="mt-2 flex items-center gap-1.5 text-[12px] font-semibold text-slate-500">
              <IconLoader2 size={14} className="shrink-0 animate-spin" />
              กำลังแนบรูป {uploading.done + 1}/{uploading.total}...
            </p>
          )}
          {!uploading && f.images.length > 0 && uploadFailed.length === 0 && (
            <p className="mt-2 flex items-center gap-1.5 text-[12px] font-semibold text-emerald-700">
              <IconCheck size={14} className="shrink-0" />
              แนบรูป {Math.min(f.images.length, IT_IMAGE_SLOTS)} รูปเรียบร้อย
            </p>
          )}
          {!uploading && uploadFailed.length > 0 && (
            <div className="mt-2 w-full rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-left">
              <p className="flex items-center gap-1.5 text-[12px] font-bold text-amber-800">
                <IconAlertTriangle size={14} className="shrink-0" />
                แนบรูปไม่สำเร็จ {uploadFailed.length} รูป — ใบถูกส่งแล้ว
              </p>
              <ul className="mt-1 flex flex-col gap-0.5">
                {uploadFailed.map((x, i) => (
                  <li key={i} className="text-[11.5px] text-amber-800">
                    • {x.name} — {x.reason}
                  </li>
                ))}
              </ul>
              <p className="mt-1.5 text-[11.5px] text-amber-700">
                แนบใหม่ได้ที่เมนู "เรื่องที่แจ้งออกไป" → เปิดใบ → ปุ่มแก้ไขข้อมูล
                (ทำได้จนกว่าแผนก IT จะกดรับงาน)
              </p>
            </div>
          )}
          <div className="mt-5 flex gap-2.5">
            <button
              onClick={onBack}
              className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              กลับหน้าเลือกแผนก
            </button>
            <button
              onClick={() => {
                setF(createEmptyForm(dep, auto));
                setErrors({});
                setSendError(null);
                setSaved(false);
                setDocNo(null);
                setUploadFailed([]);
                setUploading(null);
              }}
              style={{ backgroundColor: accentColor }}
              className="rounded-lg px-5 py-2.5 text-[13px] font-bold text-white shadow-md transition hover:opacity-90"
            >
              แจ้งเรื่องใหม่อีกครั้ง
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* หัวฟอร์ม: แผนกที่เลือก + ปุ่มเปลี่ยนแผนก */}
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-gray-200 bg-white px-5 py-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-[12.5px] font-semibold text-slate-600 transition hover:bg-slate-100"
        >
          <IconArrowLeft size={15} />
          เปลี่ยนแผนก
        </button>
        <div className="mx-1 h-8 w-px bg-gray-200" />
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: meta.bg, color: meta.color }}
          >
            <IconBuildingCommunity size={19} />
          </div>
          <div className="min-w-0">
            <div className="text-[14.5px] font-bold text-gray-900">
              แจ้งเรื่องไปยัง {dep.departmentName}
            </div>
            <div className="text-[11.5px] text-slate-500">
              <span className="mono">{dep.departmentShort || dep.departid}</span> · {cfg.tagline}
            </div>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex flex-col rounded-lg border border-gray-200 bg-gray-50 px-3 py-1">
            <span className="text-[9.5px] tracking-wide text-gray-400">เลขที่ใบรับเรื่อง</span>
            <span className="mono text-xs font-semibold text-gray-800">AUTO</span>
          </div>
          <div className="flex flex-col rounded-lg border border-gray-200 bg-gray-50 px-3 py-1">
            <span className="text-[9.5px] tracking-wide text-gray-400">วันที่แจ้ง</span>
            <span className="mono text-xs font-semibold text-gray-800">
              {new Date().toLocaleDateString('en-GB')}
            </span>
          </div>
        </div>
      </div>

      {/* เนื้อฟอร์ม */}
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto bg-[#f4f6fa] px-5 py-5">
        {errorCount > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[12.5px] font-semibold text-red-700">
            <IconAlertTriangle size={16} className="shrink-0" />
            กรุณากรอกข้อมูลที่จำเป็นให้ครบ ({errorCount} รายการ)
          </div>
        )}

        {/* บันทึกไม่ผ่าน (API ตอบ error) — ข้อมูลในฟอร์มยังอยู่ครบ กดส่งซ้ำได้ */}
        {sendError && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[12.5px] font-semibold text-red-700">
            <IconAlertTriangle size={16} className="shrink-0" />
            {sendError}
          </div>
        )}

        {/* ส่วนกลาง + ส่วนเฉพาะแผนก — ลำดับ/หมายเลขตาม schema (commonPosition) */}
        {orderedSections.map((render, i) => render(i + 1))}
      </div>

      {/* ปุ่มท้ายฟอร์ม */}
      <div className="flex shrink-0 items-center gap-2.5 border-t border-gray-200 bg-white px-5 py-3.5">
        {errorCount > 0 && (
          <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-red-600">
            <IconAlertTriangle size={15} />
            ยังกรอกไม่ครบ {errorCount} รายการ
          </span>
        )}
        <button
          onClick={onBack}
          disabled={sending}
          className="ml-auto rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          ยกเลิก
        </button>
        <button
          onClick={submit}
          disabled={sending} // กันกดซ้ำจนเกิดใบซ้ำ
          style={{ backgroundColor: accentColor }}
          className="flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-[13px] font-bold text-white shadow-md transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {sending ? <IconLoader2 size={15} className="animate-spin" /> : <IconSend size={15} stroke={2.1} />}
          {sending ? 'กำลังส่ง...' : 'ส่งใบแจ้งเรื่อง'}
        </button>
      </div>
    </div>
  );
}


export function CreateItem() {
  const { user } = useAuth();
  const { departments, loading, error, reload } = useDepartments(user?.token);
  const [dep, setDep] = useState<DepartmentApi | null>(null);

  // ข้อมูลที่ระบบเติมให้เอง: ผู้แจ้ง/หน่วยงาน มาจากการ login,
  // ชื่อเครื่องมาจาก AD (backend ต้องส่งมาใน login response — เบราว์เซอร์อ่านเองไม่ได้)
  const auto: AutoFillValues = useMemo(
    () => ({
      reporter: user?.name ?? '',
      department:
        user?.departmentName ??
        (user?.departmentShort || user?.departid
          ? [user?.departmentShort, user?.departid].filter(Boolean).join(' · ')
          : ''),
      computer: user?.computerName ?? '',
      // วันที่แจ้งเรื่อง — แสดงวันที่เปิดฟอร์ม (เวลาจริงที่บันทึกกำหนดตอนกดส่ง)
      today: new Date().toLocaleDateString('en-GB'),
    }),
    [user]
  );

  const subtitle = dep ? `Create Request — ${dep.departmentName}` : 'Create Request';

  return (
    <Layout title="สร้างใบแจ้งเรื่อง" subtitle={subtitle}>
      {dep === null ? (
        <DeptPicker
          departments={departments}
          loading={loading}
          error={error}
          reload={reload}
          onPick={setDep}
        />
      ) : (
        // เปลี่ยนแผนก → remount ฟอร์มเพื่อล้างค่าเดิมทั้งหมด
        <RequestForm key={dep.departid} dep={dep} auto={auto} onBack={() => setDep(null)} />
      )}
    </Layout>
  );
}
