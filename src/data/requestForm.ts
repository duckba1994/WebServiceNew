import { RequestPriority } from '../types/request';
import { DepartmentApi } from '../types/masterData';

// ── PURE form logic ของ "สร้างใบแจ้งเรื่อง" (ไม่มี JSX/hooks — เทสได้) ──
// แต่ละแผนกกรอกข้อมูลไม่เหมือนกัน จึงประกาศเป็น schema ต่อแผนก
// แล้วหน้า CreateItem เรนเดอร์ตาม schema (ดู PROJECT_STRUCTURE.md §6.5)

export type FieldKind =
  | 'text'
  | 'textarea'
  | 'select'
  | 'radio' // เหมือน select แต่โชว์ทุกตัวเลือกพร้อมกัน (ใช้กับรายการสั้น ๆ)
  | 'checkboxes' // ติ๊กได้หลายข้อ (เก็บเป็นสตริงเดียวคั่นด้วย CHECK_SEP)
  | 'searchSelect' // combobox ค้นหาได้ (รายการยาว เช่น รายชื่อแผนก)
  | 'filled' // อ่านอย่างเดียว — ค่ามาจากตัวเลือกของฟิลด์อื่น (ดู FieldDef.fills)
  | 'date'
  | 'number'
  | 'auto' // ดึงมาให้อัตโนมัติ (จาก login / AD) — ผู้ใช้ไม่ต้องกรอก
  | 'images' // อัปโหลดรูป + พรีวิว
  | 'lineItems'; // ตารางรายการย่อย (เช่น รายการอะไหล่ + ราคา)

// แหล่งข้อมูลของฟิลด์ kind='auto'
// reporter/department = จากการ login ครั้งแรก, computer = ชื่อเครื่องจาก AD,
// today = วันที่แจ้งเรื่อง (วันที่เปิดฟอร์ม — เวลาจริงกำหนดอีกครั้งตอนส่ง)
export type AutoSource = 'reporter' | 'department' | 'computer' | 'today';

export interface AutoFillValues {
  reporter: string;
  department: string;
  computer: string;
  today: string;
}

// ตัวเลือกของ select — ใช้สตริงเปล่าได้ (value = label)
// หรือ { value, label } เมื่อค่าที่ต้องส่งให้ API เป็นรหัส (id) ไม่ใช่ข้อความ
export interface FieldOption {
  value: string;
  label: string;
  // ข้อความรองใต้ป้าย (ไม่ระบุ = ไม่แสดง) — เช่นส่วนงานของ CR ที่ป้ายเป็นโค้ด HV/FL
  // ส่วนชื่อไทย "รถใหญ่/รถยก" เป็นตัวช่วยอ่าน
  sub?: string;
  // ข้อมูลอื่นของระเบียนนี้ (คีย์ = key ของฟิลด์ปลายทาง) — เลือกตัวเลือกนี้แล้ว
  // ฟิลด์ที่ประกาศไว้ใน FieldDef.fills จะถูกเติมด้วยค่าเหล่านี้
  // เช่นเลขที่ใบประเมินราคาของ PS ที่ลากข้อมูลเครื่องจักรทั้งใบมาด้วย
  data?: Record<string, string>;
}
export type FieldOptionDef = string | FieldOption;

// ชุดตัวเลือกที่ต้องดึงจาก API — ห้าม hardcode รายการไว้ในโค้ด เพราะ master
// ฝั่ง backend แก้ได้ตลอด (เพิ่ม/ปิดตัวเลือก) แล้วของที่พิมพ์ไว้จะไม่ตรงกัน
export type MasterListKey =
  | 'plTypes'
  | 'plRequestTypes'
  // CR: ตัวเลือกขึ้นกับค่าที่เลือกไว้ก่อนหน้า (ดู dependsOn/resets ด้านล่าง)
  | 'crSections'
  | 'crRequestTypes'
  | 'crRequestSubTypes'
  // GA / IM / AF / SV / SQA: endpoint แยกตามแผนก แต่รูปร่างข้อมูลเดียวกัน
  // (GET /MasterData/{ga|im|af|sv|sqa} — ดู useDeptMasterData) จึงใช้คีย์กลางชุดนี้
  | 'deptSections' // ส่วนงาน HV/FL
  | 'deptTypes' // ประเภท / ประเภทเรื่องที่แจ้ง
  | 'deptRequestTypes' // เรื่องที่แจ้ง
  | 'deptRequestSubTypes' // รายละเอียดที่แจ้ง (ผูกกับประเภท)
  | 'psEstimates' // ใบประเมินราคาของ PS (ตัวเลือกหิ้วข้อมูลทั้งใบมาด้วย)
  | 'departments'; // รายชื่อแผนกทั้งหมด (GET /MasterData/departments)

// แปลงตัวเลือกให้อยู่ในรูป { value, label } เสมอ
export const fieldOptions = (options?: FieldOptionDef[]): FieldOption[] =>
  (options ?? []).map((o) => (typeof o === 'string' ? { value: o, label: o } : o));

// ฟิลด์ที่มีเงื่อนไข showWhen จะถูกซ่อนจนกว่าฟิลด์แม่จะมีค่าตามที่ระบุ
// ต้องใช้ทั้งตอนเรนเดอร์และตอน validate ไม่งั้นจะติด "กรุณากรอก…" ของช่องที่มองไม่เห็น
export const fieldVisible = (fd: FieldDef, values: Record<string, string>): boolean => {
  const w = fd.showWhen;
  if (!w) return true;
  const v = values[w.key] ?? '';
  // includes = ฟิลด์แม่เป็นแบบติ๊กหลายข้อ — โผล่เมื่อข้อนี้ถูกติ๊กไว้
  if (w.includes !== undefined) return checkedValues(v).includes(w.includes);
  return v === (w.equals ?? '');
};

// ข้อความที่ผู้ใช้เห็นของค่าที่เลือกไว้ (ค่าที่เก็บอาจเป็น id)
export const optionLabel = (options: FieldOptionDef[] | undefined, value: string): string =>
  fieldOptions(options).find((o) => o.value === value)?.label ?? value;

export interface FieldDef {
  key: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  span2?: boolean;
  placeholder?: string;
  hint?: string;
  options?: FieldOptionDef[];
  // kind='select'|'radio' เท่านั้น — ตัวเลือกมาจาก master data ตอน runtime ไม่ใช่จากโค้ด
  // (หน้าฟอร์มเป็นคนโหลดแล้วเติมให้ ดู usePlMasterData / useCrMasterData)
  master?: MasterListKey;
  // ตัวเลือกของฟิลด์นี้ขึ้นกับค่าของฟิลด์ที่ระบุ — ยังไม่เลือกตัวนั้น = ยังเลือกตัวนี้ไม่ได้
  dependsOn?: string;
  // เปลี่ยนค่าฟิลด์นี้แล้วต้องล้างฟิลด์เหล่านี้ทิ้ง (ตัวเลือกเดิมใช้กับค่าใหม่ไม่ได้แล้ว)
  resets?: string[];
  // ฟิลด์ที่ถูก "เติม" ด้วยข้อมูลของตัวเลือกที่เลือก (FieldOption.data) — เลือกใบใหม่
  // ก็ทับทั้งชุด, ล้างตัวเลือกก็ล้างตามทั้งชุด (กันข้อมูลของคนละใบค้างปนกัน)
  fills?: string[];
  // kind='date' เท่านั้น — เพิ่มปุ่มลัด (วันนี้/พรุ่งนี้/…) + ข้อความไทยกำกับวันที่
  quickPick?: boolean;
  // ฟิลด์ที่โผล่เฉพาะเมื่อฟิลด์อื่นมีค่าตามที่ระบุ (ไม่ระบุ = แสดงเสมอ)
  // equals = ฟิลด์แม่มีค่านี้ · includes = ฟิลด์แม่แบบ checkboxes ติ๊กข้อนี้ไว้
  showWhen?: { key: string; equals?: string; includes?: string };
  // kind='auto' เท่านั้น
  auto?: AutoSource;
  // ดึงค่าอัตโนมัติไม่ได้ (เช่น AD ไม่ส่งชื่อเครื่องมา) → ให้ผู้ใช้พิมพ์เองแทนที่จะตัน
  fallbackEditable?: boolean;
  // kind='images' เท่านั้น — จำนวนรูปสูงสุด (ไม่ระบุ = ค่า default ของ ImageUpload)
  max?: number;
  // kind='text'|'textarea' เท่านั้น — จำกัดความยาว + แสดงตัวนับตัวอักษร
  maxLen?: number;
  // kind='lineItems' เท่านั้น — ชุดคอลัมน์ของตาราง (ไม่ระบุ = 'purchase')
  variant?: LineItemsVariant;
}

export interface DeptSection {
  title: string;
  fields: FieldDef[];
}

// ฟิลด์ในส่วนกลาง ("ข้อมูลเรื่องที่แจ้ง") ที่ทุกแผนกใช้ร่วมกัน
export type CommonField = 'category' | 'dueDate' | 'subject' | 'priority' | 'detail';
export const ALL_COMMON_FIELDS: CommonField[] = ['category', 'dueDate', 'subject', 'priority', 'detail'];

export interface DeptFormConfig {
  tagline: string; // เรื่องที่รับผิดชอบ (แสดงใต้ชื่อแผนก)
  examples: string; // ตัวอย่างเรื่องที่แจ้งได้
  categories: string[]; // ประเภทเรื่องของแผนกนี้
  sections: DeptSection[]; // ส่วนข้อมูลเฉพาะแผนก (นอกเหนือจากส่วนกลาง)
  // ฟิลด์ส่วนกลางที่แผนกนี้ใช้ (ไม่ระบุ = ครบทุกฟิลด์)
  common?: CommonField[];
  commonTitle?: string; // หัวข้อของส่วนกลาง (ไม่ระบุ = "เรื่องที่แจ้ง")
  // แทรกส่วนกลางไว้ลำดับที่เท่าไรของ sections (0 = บนสุด, ไม่ระบุ = 0)
  commonPosition?: number;
  // เรนเดอร์ฟิลด์ส่วนกลางต่อท้าย "ข้างใน" กล่องที่ชื่อนี้ แทนที่จะแยกเป็นกล่องใหม่
  // (ผู้ใช้สั่ง 2 ก.ย. 2026: รายละเอียด = เนื้อของเรื่องที่แจ้ง ไม่ใช่กล่องของตัวเอง)
  // ระบุแล้ว commonTitle/commonPosition จะไม่ถูกใช้
  commonInto?: string;
  // แผนกที่ไม่ใช้ฟิลด์ส่วนกลาง subject/detail — ใช้ค่าฟิลด์นี้เป็นชื่อเรื่องในหน้าสรุป
  summaryKey?: string;
}

// ฟิลด์ส่วนกลางที่แผนกนี้ต้องกรอกจริง
export const commonFieldsOf = (cfg: DeptFormConfig): CommonField[] => cfg.common ?? ALL_COMMON_FIELDS;

// ความยาวสูงสุดของ "รายละเอียดที่แจ้ง" (ตกลงไว้ 17 ส.ค. 2026)
export const DETAIL_MAX_LEN = 1000;

// ── รายการย่อย (line item) — ใช้กับฟิลด์ kind='lineItems' ──
// ชุดคอลัมน์ของตารางรายการย่อย
// purchase = รายการ/จำนวน/หน่วย/ราคา/ผู้ขาย/รวม (ใช้กับจัดซื้อ)
// simple   = รายการ/จำนวน/หน่วย/หมายเหตุ (ไม่มีราคา)
export type LineItemsVariant = 'purchase' | 'simple';

export interface LineItem {
  id: string;
  name: string;
  qty: string;
  unit: string;
  price: string; // ราคา/หน่วย (เฉพาะ variant='purchase')
  vendor: string; // ผู้ขาย / ร้านค้า (เฉพาะ variant='purchase')
  note: string; // หมายเหตุ (เฉพาะ variant='simple')
}

export const emptyLineItem = (): LineItem => ({
  id: `li-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  name: '',
  qty: '',
  unit: '',
  price: '',
  vendor: '',
  note: '',
});

export const lineTotal = (li: LineItem): number => (Number(li.qty) || 0) * (Number(li.price) || 0);
export const lineItemsTotal = (items: LineItem[]): number =>
  items.reduce((s, li) => s + lineTotal(li), 0);

// ── ตัวเลือกแบบติ๊กได้หลายข้อ (kind='checkboxes') ─────────────
// values เป็น Record<string,string> จึงเก็บของที่ติ๊กไว้เป็นสตริงเดียวคั่นด้วย '|'
// (ห้ามใช้ ',' เพราะข้อความตัวเลือกมีลูกน้ำได้) — อ่านค่าออกมาด้วย checkedValues เสมอ
export const CHECK_SEP = '|';

export const checkedValues = (v?: string): string[] =>
  (v ?? '')
    .split(CHECK_SEP)
    .map((x) => x.trim())
    .filter(Boolean);

export const toggleChecked = (v: string | undefined, opt: string): string => {
  const cur = checkedValues(v);
  return (cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt]).join(CHECK_SEP);
};

// ข้อความอ่านง่ายของสิ่งที่ติ๊กไว้ (ใช้ตอนสรุป / ตอนส่งให้ API)
export const checkedText = (v?: string): string => checkedValues(v).join(', ');

// ── ค่าคงที่ของฟอร์ม SV ──────────────────────────────────────
// ข้อความต้องตรงกับตัวเลือกใน schema เพราะ showWhen เทียบด้วยข้อความ
export const SV_EXTERNAL = 'ลูกค้าภายนอก';
export const SV_INTERNAL = 'ลูกค้าภายใน';
export const OTHER_ATTACHMENT = 'อื่นๆ';

// ประเภทที่แจ้งของ CR ที่เปิดช่อง "ระบุเพิ่มเติม" (ชื่อตรงตาม master ของ API)
export const CR_OTHER_TYPE = 'อื่นๆ';

// ── หน่วยของรายการย่อย (แผนกที่ยังไม่มี master data ของตัวเอง เช่น จัดซื้อ) ──
// PL ไม่ใช้ชุดนี้แล้ว — ดึงจาก GET /MasterData/pl (units) ผ่าน usePlMasterData
export const UNIT_OPTIONS = ['ชิ้น', 'อัน', 'ชุด', 'กล่อง', 'เส้น', 'ลิตร', 'งาน'];

// ── สถานะฟอร์ม ───────────────────────────────────────────────
export interface RequestFormState {
  // ── แผนกปลายทาง — ชื่อฟิลด์ตาม GET /MasterData/departments (ห้ามเปลี่ยนชื่อ) ──
  departid: string;
  departmentShort: string;
  departmentName: string;
  category: string;
  subject: string;
  priority: RequestPriority;
  dueDate: string;
  detail: string;
  // ค่าของฟิลด์เฉพาะแผนก (key ตาม FieldDef.key)
  values: Record<string, string>;
  images: File[];
  lineItems: LineItem[];
}

// auto = ค่าที่ระบบดึงมาให้ (ผู้แจ้ง/หน่วยงานจาก login, ชื่อเครื่องจาก AD)
// เติมลง values ตั้งแต่แรก เพื่อให้ถูกส่งไปกับฟอร์มเหมือนฟิลด์อื่น
export function createEmptyForm(dep: DepartmentApi, auto?: Partial<AutoFillValues>): RequestFormState {
  const values: Record<string, string> = {};
  for (const sec of getDeptForm(dep.departmentShort).sections) {
    for (const fd of sec.fields) {
      if (fd.kind === 'auto' && fd.auto) values[fd.key] = auto?.[fd.auto] ?? '';
    }
  }
  return {
    departid: dep.departid,
    departmentShort: dep.departmentShort,
    departmentName: dep.departmentName,
    category: '',
    subject: '',
    priority: 'normal',
    dueDate: '',
    detail: '',
    values,
    images: [],
    lineItems: [emptyLineItem()],
  };
}

// ── กล่องมาตรฐานที่ใช้ซ้ำหลายแผนก ────────────────────────────
// ผู้แจ้ง/หน่วยงานมาจาก login เสมอ (ผู้ใช้ไม่ต้องกรอก)
const REPORTER_SECTION: DeptSection = {
  title: 'ผู้แจ้ง',
  fields: [
    { key: 'reporterDept', label: 'หน่วยงาน', kind: 'auto', auto: 'department', required: true },
    { key: 'reporterName', label: 'ผู้แจ้งเรื่อง', kind: 'auto', auto: 'reporter', required: true },
  ],
};

// "รายการที่ขอ" แบบเดียวกับ PL — ไม่มีช่องราคา และไม่บังคับกรอก
const ITEMS_SECTION: DeptSection = {
  title: 'รายการที่ขอ',
  fields: [
    {
      key: 'items',
      label: 'รายการ',
      kind: 'lineItems',
      variant: 'simple',
      hint: '(ไม่บังคับ — เพิ่มได้มากกว่า 1 แถว)',
      span2: true,
    },
  ],
};

// รูปภาพ 3 รูปแบบเดียวกับ PL และ IT
const PHOTOS_SECTION: DeptSection = {
  title: 'รูปภาพ',
  fields: [
    { key: 'photos', label: 'รูปภาพ', kind: 'images', max: 3, hint: '(เพิ่มได้ไม่เกิน 3 รูป)', span2: true },
  ],
};

// ── ฟอร์มกลุ่ม "ขอของ / ขอบริการ" (GA / IM / AF) ───────────────
// หน้าตาเดียวกันหมด ต่างกันแค่ชุดตัวเลือกที่ดึงจาก endpoint ของแผนกตัวเอง
// (GET /MasterData/ga · /im · /af) — AF ไม่มีชั้น "ประเภท" และไม่มีช่องระบุเรื่อง
const supplyForm = (o: {
  tagline: string;
  examples: string;
  withType?: boolean; // มีชั้น "ประเภท" ก่อนเรื่องที่แจ้ง (GA/IM)
  withDetail?: boolean; // มีช่อง "ระบุเรื่องที่แจ้ง" (GA/IM)
}): DeptFormConfig => ({
  tagline: o.tagline,
  examples: o.examples,
  categories: [], // ไม่ได้ใช้ — ทุกฟิลด์ประกาศเองในส่วนของแผนก
  common: [],
  summaryKey: 'topic', // ใช้ "เรื่องที่แจ้ง" เป็นชื่อเรื่องในหน้าสรุป
  sections: [
    REPORTER_SECTION,
    {
      title: 'เรื่องที่แจ้ง',
      fields: [
        ...(o.withType
          ? ([
              { key: 'requestType', label: 'ประเภท', kind: 'select', required: true, master: 'deptTypes' },
            ] as FieldDef[])
          : []),
        { key: 'topic', label: 'เรื่องที่แจ้ง', kind: 'select', required: true, master: 'deptRequestTypes' },
        { key: 'dueDate', label: 'วันที่ต้องการใช้งาน', kind: 'date', required: true, quickPick: true },
        ...(o.withDetail
          ? ([
              {
                key: 'topicDetail',
                label: 'ระบุเรื่องที่แจ้ง',
                kind: 'textarea',
                required: true,
                span2: true,
                maxLen: 1000,
                placeholder: 'อธิบายรายละเอียดของเรื่องที่ต้องการแจ้ง',
              },
            ] as FieldDef[])
          : []),
      ],
    },
    ITEMS_SECTION,
  ],
});

// ── schema ของแต่ละแผนก ──────────────────────────────────────
// key = departmentShort จาก /MasterData/departments (เช่น 'IT', 'HR', 'MD')
// แผนกที่ยังไม่มี schema เฉพาะ จะใช้ DEFAULT_FORM แทน
export const DEPT_FORMS: Record<string, DeptFormConfig> = {
  HR: {
    tagline: 'เอกสาร / สวัสดิการ / หนังสือแจ้งเตือน',
    examples: 'ขอใบรับรองเงินเดือน, ออกหนังสือแจ้งเตือนคนขับ, ขอสลิปเงินเดือน',
    categories: ['ขอเอกสาร', 'ออกหนังสือ', 'สวัสดิการ', 'ข้อมูลบุคคล', 'อื่นๆ'],
    sections: [
      {
        title: 'รายละเอียดคำร้อง',
        fields: [
          { key: 'docType', label: 'ประเภทเอกสารที่ขอ', kind: 'select', required: true, options: ['ใบรับรองเงินเดือน', 'หนังสือรับรองการทำงาน', 'สลิปเงินเดือน', 'หนังสือแจ้งเตือน', 'อื่นๆ'] },
          { key: 'copies', label: 'จำนวนชุด', kind: 'number', required: true, placeholder: '1' },
          { key: 'language', label: 'ภาษาเอกสาร', kind: 'select', options: ['ภาษาไทย', 'ภาษาอังกฤษ', 'ไทย-อังกฤษ'] },
          { key: 'purpose', label: 'วัตถุประสงค์การใช้', kind: 'text', required: true, placeholder: 'เช่น ยื่นกู้ธนาคาร / ทำวีซ่า' },
          { key: 'targetPerson', label: 'พนักงานที่เกี่ยวข้อง', kind: 'text', hint: '(กรณีออกหนังสือแจ้งเตือน)', span2: true, placeholder: 'ชื่อ-นามสกุล / รหัสพนักงาน' },
        ],
      },
    ],
  },

  // ── ใบแจ้งเรื่อง PL (Product Packing & Logistics) ──────────
  // ตามที่ตกลงไว้ (21 ส.ค. 2026): ผู้แจ้ง/หน่วยงาน/วันที่แจ้ง มาจากระบบ,
  // ประเภท + เรื่องที่แจ้ง เลือกจากรายการ, ระบุเรื่องที่แจ้ง 1000 ตัวอักษร,
  // เหตุผลการขอ 500 ตัวอักษร, รายการที่ขอกรอกได้หลายแถว และรูปไม่เกิน 3 รูป
  PL: {
    tagline: 'พนักงานขับรถ / ขนส่ง-ขนย้าย / สำรวจหน้างาน',
    examples: 'แจ้งพฤติกรรมพนักงานขับรถ, แจ้งอุบัติเหตุ, ขอใช้เครื่องจักร, ขอสำรวจหน้างาน',
    categories: [], // ไม่ได้ใช้ — PL ไม่มีช่อง "ประเภทเรื่อง" (common: [] ด้านล่าง)
    common: [], // ทุกฟิลด์ประกาศเองในส่วนของแผนก เพื่อคุมลำดับตามแบบฟอร์มจริง
    summaryKey: 'topic', // ใช้ "หัวข้อเรื่อง" เป็นชื่อเรื่องในหน้าสรุป
    sections: [
      {
        title: 'ผู้แจ้ง',
        fields: [
          { key: 'reporterName', label: 'ผู้แจ้งเรื่อง', kind: 'auto', auto: 'reporter', required: true },
          { key: 'reporterDept', label: 'หน่วยงาน', kind: 'auto', auto: 'department', required: true },
          { key: 'requestDate', label: 'วันที่แจ้งเรื่อง', kind: 'auto', auto: 'today', required: true },
        ],
      },
      {
        title: 'เรื่องที่แจ้ง',
        fields: [
          { key: 'requestType', label: 'ประเภท', kind: 'select', required: true, master: 'plTypes' },
          { key: 'topic', label: 'หัวข้อเรื่อง', kind: 'select', required: true, master: 'plRequestTypes' },
          // วันที่ต้องการใช้งาน = สิ่งที่ขอ ไม่ใช่ข้อมูลตัวผู้แจ้ง จึงอยู่การ์ดนี้
          // (ผู้ใช้สั่ง 2 ก.ย. 2026 — เดิมอยู่กลุ่ม "ข้อมูลผู้แจ้ง")
          { key: 'dueDate', label: 'วันที่ต้องการใช้งาน', kind: 'date', required: true },
          {
            key: 'topicDetail',
            label: 'รายละเอียด',
            kind: 'textarea',
            required: true,
            span2: true,
            maxLen: 1000,
            placeholder: 'อธิบายรายละเอียดของเรื่องที่ต้องการแจ้ง',
          },
          {
            key: 'reason',
            label: 'เหตุผลการขอ',
            kind: 'textarea',
            required: true,
            span2: true,
            maxLen: 500,
            placeholder: 'ระบุความจำเป็น / ผลกระทบหากไม่ได้รับ',
          },
        ],
      },
      {
        title: 'รายการที่ขอ',
        fields: [
          {
            key: 'items',
            label: 'รายการ',
            kind: 'lineItems',
            variant: 'simple',
            hint: '(ไม่บังคับ — เพิ่มได้มากกว่า 1 แถว)',
            span2: true,
          },
        ],
      },
      {
        title: 'รูปภาพ',
        fields: [
          { key: 'photos', label: 'รูปภาพ', kind: 'images', max: 3, hint: '(เพิ่มได้ไม่เกิน 3 รูป)', span2: true },
        ],
      },
    ],
  },

  // ── ใบแจ้งเรื่อง SV (บริการหลังการขาย) ──────────────────────
  // ผู้ใช้สั่ง 2 ก.ย. 2026: ประเภทเรื่องที่แจ้ง (ลูกค้าภายนอก/ภายใน) → ส่วนงาน →
  // เรื่องที่แจ้ง → สิ่งที่แนบมาด้วย → รายการที่ขอ → รูปภาพ 3 รูป
  SV: {
    tagline: 'บริการหลังการขาย / ซ่อมบำรุงเครื่องจักร',
    examples: 'แจ้งซ่อมเครื่องจักร, ขอช่างเข้าหน้างาน, แจ้งอาการผิดปกติของเครื่อง',
    categories: [], // ไม่ได้ใช้ — SV ไม่มีช่อง "ประเภทเรื่อง" ส่วนกลาง
    common: [],
    summaryKey: 'topic',
    sections: [
      REPORTER_SECTION,
      {
        title: 'เรื่องที่แจ้ง',
        fields: [
          // ลูกค้าภายใน = แผนกในองค์กรเป็นผู้ใช้บริการ → ต้องระบุว่าแผนกไหน
          {
            key: 'customerType',
            label: 'ประเภทเรื่องที่แจ้ง',
            kind: 'radio',
            required: true,
            span2: true,
            options: [SV_EXTERNAL, SV_INTERNAL],
            resets: ['customerDept'],
          },
          {
            key: 'customerDept',
            label: 'แผนกลูกค้าภายใน',
            kind: 'searchSelect',
            required: true,
            master: 'departments',
            placeholder: 'พิมพ์ชื่อแผนก หรือชื่อย่อ เช่น IT, HR',
            showWhen: { key: 'customerType', equals: SV_INTERNAL },
          },
          {
            key: 'section',
            label: 'ส่วนงาน',
            kind: 'radio',
            required: true,
            span2: true,
            master: 'deptSections',
            // ตัวเลือกชั้นล่างอาจแยกตามส่วนงาน (ถ้า API ผูก section มา) → เปลี่ยนแล้วต้องล้าง
            resets: ['topic'],
          },
          { key: 'topic', label: 'เรื่องที่แจ้ง', kind: 'select', required: true, master: 'deptRequestTypes' },
          // ไม่บังคับติ๊ก — แต่ติ๊ก "อื่นๆ" แล้วต้องระบุข้อความ (ช่องด้านล่างจะโผล่มาเอง)
          {
            key: 'attachedDocs',
            label: 'สิ่งที่แนบมาด้วย',
            kind: 'checkboxes',
            span2: true,
            options: ['เอกสารจากลูกค้า', 'รูปถ่าย', OTHER_ATTACHMENT],
          },
          {
            key: 'attachedOther',
            label: 'ระบุสิ่งที่แนบมาด้วย',
            kind: 'text',
            required: true,
            span2: true,
            maxLen: 100,
            placeholder: 'ระบุสิ่งที่แนบมาด้วย',
            showWhen: { key: 'attachedDocs', includes: OTHER_ATTACHMENT },
          },
        ],
      },
      ITEMS_SECTION,
      PHOTOS_SECTION,
    ],
  },

  // ── ใบแจ้งเรื่อง SQA (ประกันคุณภาพ) ─────────────────────────
  // ประเภทเรื่องที่แจ้ง → รายละเอียดที่แจ้ง ผูกกันเป็นลูกโซ่ (เหมือน CR)
  // ส่วนงาน HV/FL กรองชั้นล่างให้อีกชั้นเมื่อ API ผูก section มากับรายการ
  SQA: {
    tagline: 'ประกันคุณภาพ / มาตรฐานการให้บริการ',
    examples: 'ขอตรวจสอบคุณภาพงาน, แจ้งข้อร้องเรียนคุณภาพ, ขอเอกสารมาตรฐาน',
    categories: [],
    common: ['detail'], // "รายละเอียด" ต่อท้ายกล่องเรื่องที่แจ้ง
    commonInto: 'เรื่องที่แจ้ง',
    summaryKey: 'requestType',
    sections: [
      REPORTER_SECTION,
      {
        title: 'เรื่องที่แจ้ง',
        fields: [
          {
            key: 'section',
            label: 'ส่วนงาน',
            kind: 'radio',
            required: true,
            span2: true,
            master: 'deptSections',
            resets: ['requestType', 'requestSubType'],
          },
          {
            key: 'requestType',
            label: 'ประเภทเรื่องที่แจ้ง',
            kind: 'select',
            required: true,
            master: 'deptTypes',
            resets: ['requestSubType'],
          },
          {
            key: 'requestSubType',
            label: 'รายละเอียดที่แจ้ง',
            kind: 'select',
            required: true,
            master: 'deptRequestSubTypes',
            dependsOn: 'requestType',
          },
          { key: 'dueDate', label: 'วันที่ต้องการใช้งาน', kind: 'date', required: true, quickPick: true },
        ],
      },
    ],
  },

  // ── ใบแจ้งเรื่อง PS (ประเมินราคา / อะไหล่) ───────────────────
  // ต่างจากแผนกอื่นตรงกล่อง "ข้อมูลใบประเมินราคา": เลือกเลขที่ใบแล้วข้อมูล
  // เครื่องจักรทั้งชุดถูกเติมให้อัตโนมัติ (อ่านอย่างเดียว — แก้ที่ใบประเมินราคาต้นทาง)
  PS: {
    tagline: 'ประเมินราคา / งานซ่อม / อะไหล่',
    examples: 'ขอราคางานซ่อม, ขอราคาอะไหล่, ขอประเมินราคาตามใบประเมิน',
    categories: [],
    common: [],
    summaryKey: 'topic',
    sections: [
      REPORTER_SECTION,
      {
        title: 'เรื่องที่แจ้ง',
        fields: [
          { key: 'requestType', label: 'ประเภท', kind: 'select', required: true, master: 'deptTypes' },
          { key: 'topic', label: 'เรื่องที่แจ้ง', kind: 'select', required: true, master: 'deptRequestTypes' },
          { key: 'priceDate', label: 'วันที่ต้องการราคา', kind: 'date', required: true, quickPick: true },
          // แผนวันที่จะได้ราคา — ยังไม่บังคับ (รอยืนยันว่าผู้แจ้งเป็นคนกรอกเองหรือฝั่ง PS เติมทีหลัง)
          { key: 'planPriceDate', label: 'Plan วันที่ต้องการราคา', kind: 'date', hint: '(ถ้ามี)' },
          { key: 'dueDate', label: 'วันที่ต้องการใช้งาน', kind: 'date', required: true, quickPick: true },
          {
            key: 'topicDetail',
            label: 'ระบุเรื่องที่แจ้ง',
            kind: 'textarea',
            required: true,
            span2: true,
            maxLen: 1000,
            placeholder: 'อธิบายรายละเอียดของเรื่องที่ต้องการแจ้ง',
          },
        ],
      },
      {
        title: 'ข้อมูลใบประเมินราคา',
        fields: [
          {
            key: 'estimateNo',
            label: 'เลขที่ใบประเมินราคา',
            kind: 'searchSelect',
            master: 'psEstimates',
            span2: true,
            hint: '(ไม่บังคับ — เลือกแล้วระบบดึงข้อมูลใบนั้นมาให้)',
            placeholder: 'พิมพ์เลขที่ใบ หรือหมายเลขเครื่องจักร',
            // ทั้งชุดนี้ถูกเติม/ล้างพร้อมกันตามใบที่เลือก — คีย์ต้องตรงกับ FieldOption.data
            fills: [
              'estDate',
              'estMachineType',
              'estEngineModel',
              'estSerialNo',
              'estMachineNo',
              'estMachineModel',
              'estSystem',
              'estSymptom',
              'estRemark',
            ],
          },
          { key: 'estDate', label: 'วันที่', kind: 'filled' },
          { key: 'estMachineType', label: 'ประเภทเครื่องจักร', kind: 'filled' },
          { key: 'estEngineModel', label: 'รุ่นเครื่องยนต์', kind: 'filled' },
          { key: 'estSerialNo', label: 'ทะเบียน S/N', kind: 'filled' },
          { key: 'estMachineNo', label: 'หมายเลขเครื่องจักร', kind: 'filled' },
          { key: 'estMachineModel', label: 'รุ่นเครื่องจักร', kind: 'filled' },
          { key: 'estSystem', label: 'ระบบ', kind: 'filled' },
          { key: 'estSymptom', label: 'รายละเอียดอาการ', kind: 'filled', span2: true },
          { key: 'estRemark', label: 'รายละเอียดเพิ่มเติม', kind: 'filled', span2: true },
        ],
      },
      ITEMS_SECTION,
    ],
  },

  // ── ใบแจ้งเรื่อง GA / IM / AF — ฟอร์มเดียวกัน คนละชุดตัวเลือก ──
  GA: supplyForm({
    tagline: 'ธุรการ / อาคารสถานที่ / งานบริการทั่วไป',
    examples: 'ขอวัสดุสำนักงาน, แจ้งซ่อมอาคาร, ขอใช้รถส่วนกลาง',
    withType: true,
    withDetail: true,
  }),

  IM: supplyForm({
    tagline: 'คลังพัสดุ / อะไหล่ / เบิก-จ่ายของ',
    examples: 'ขอเบิกอะไหล่, ขอตรวจสอบสต็อก, ขอโอนย้ายพัสดุ',
    withType: true,
    withDetail: true,
  }),

  AF: supplyForm({
    tagline: 'บัญชี / การเงิน',
    examples: 'ขอเอกสารทางบัญชี, ขอตั้งเบิก, สอบถามยอดค้างชำระ',
  }),

  // ── ใบแจ้งเรื่อง CR (ประสานงานเอกสารฝ่ายขาย) ────────────────
  // ตัวเลือกทั้ง 3 ชั้นมาจาก GET /MasterData/cr และผูกกันเป็นลูกโซ่:
  // ส่วนงาน (HV/FL) → ประเภทที่แจ้ง → รายละเอียดที่แจ้ง
  // เปลี่ยนชั้นบน ชั้นล่างต้องถูกล้าง (resets) ไม่งั้นจะเหลือค่าที่ไม่มีในรายการใหม่
  CR: {
    tagline: 'ประสานงานเอกสารฝ่ายขาย (รถใหญ่ / รถยก)',
    examples: 'ขอจัดทำใบเสนอราคา, ติดตามใบสั่งขาย, ขอสำเนาสัญญาเช่า',
    categories: [], // ไม่ได้ใช้ — CR ไม่มีช่อง "ประเภทเรื่อง" (common ด้านล่างไม่มี category)
    common: ['detail'],
    commonInto: 'เรื่องที่แจ้ง', // ช่องรายละเอียดต่อท้ายกล่องเรื่องที่แจ้ง
    summaryKey: 'requestType', // ใช้ "ประเภทที่แจ้ง" เป็นชื่อเรื่องในหน้าสรุป
    // กล่องมาตรฐาน (ผู้ใช้สั่ง 2 ก.ย. 2026): ผู้แจ้ง / เรื่องที่แจ้ง / รายการที่ขอ / รูปภาพ
    sections: [
      {
        title: 'ผู้แจ้ง',
        fields: [
          { key: 'reporterDept', label: 'หน่วยงาน', kind: 'auto', auto: 'department', required: true },
          { key: 'reporterName', label: 'ผู้แจ้งเรื่อง', kind: 'auto', auto: 'reporter', required: true },
        ],
      },
      {
        title: 'เรื่องที่แจ้ง',
        fields: [
          {
            key: 'section',
            label: 'ส่วนงาน',
            kind: 'radio',
            required: true,
            span2: true,
            master: 'crSections',
            resets: ['requestType', 'requestSubType', 'requestSubOther'],
          },
          {
            key: 'requestType',
            label: 'ประเภทที่แจ้ง',
            kind: 'select',
            required: true,
            master: 'crRequestTypes',
            dependsOn: 'section',
            resets: ['requestSubType', 'requestSubOther'],
          },
          {
            key: 'requestSubType',
            // ชั้นที่ 3 ของลูกโซ่ CR — เดิมชื่อ "รายละเอียดที่แจ้ง" ซึ่งชนกับกล่อง
            // "รายละเอียด" (ผู้ใช้สั่งแก้ 2 ก.ย. 2026) ค่าที่ส่ง API ยังเป็น requestSubType เหมือนเดิม
            label: 'หัวข้อเรื่อง',
            kind: 'select',
            required: true,
            master: 'crRequestSubTypes',
            dependsOn: 'requestType',
          },
          // โผล่เฉพาะตอนประเภทที่แจ้ง = "อื่นๆ" (ตามฟอร์มเว็บเก่า) — ไม่บังคับ
          {
            key: 'requestSubOther',
            label: 'ระบุเพิ่มเติม',
            kind: 'text',
            maxLen: 100,
            span2: true,
            placeholder: 'ระบุเรื่องที่ต้องการให้ชัดเจน',
            showWhen: { key: 'requestType', equals: CR_OTHER_TYPE },
          },
          // วันที่ต้องการ = สิ่งที่ขอ ไม่ใช่ข้อมูลตัวผู้แจ้ง จึงอยู่กล่องนี้
          // (ผู้ใช้สั่ง 2 ก.ย. 2026 — เหมือน "วันที่ต้องการใช้งาน" ของ PL)
          // ไม่ span2 — เต็มความกว้างฟอร์มแล้วช่องวันที่ลอยอยู่กลางที่ว่าง (ผู้ใช้สั่ง 2 ก.ย. 2026)
          { key: 'requireDate', label: 'วันที่ต้องการ', kind: 'date', required: true, quickPick: true },
        ],
      },
    ],
  },

  // ── ใบแจ้งเรื่อง IT ────────────────────────────────────────
  // ตามที่ตกลงไว้ (17 ส.ค. 2026): กรอกเฉพาะ 6 อย่างนี้เท่านั้น —
  // ผู้แจ้ง/หน่วยงาน (จาก login), เบอร์ติดต่อ, ชื่อเครื่อง (จาก AD),
  // รายละเอียดที่แจ้ง และรูปภาพไม่เกิน 3 รูป
  IT: {
    tagline: 'คอมพิวเตอร์ / ฮาร์ดแวร์ / ซอฟต์แวร์ / เครือข่าย',
    examples: 'คอมเปิดไม่ติด, ขอลงโปรแกรม, เน็ตหลุด, ขอสิทธิ์ใช้งานระบบ',
    categories: ['ฮาร์ดแวร์', 'ซอฟต์แวร์', 'เครือข่าย', 'อีเมล', 'สิทธิ์การใช้งาน', 'อื่นๆ'],
    common: ['detail'],
    commonTitle: 'เรื่องที่แจ้ง',
    commonPosition: 1, // ผู้แจ้ง → เรื่องที่แจ้ง → รูปภาพ
    sections: [
      {
        title: 'ผู้แจ้ง',
        fields: [
          { key: 'reporterName', label: 'ผู้แจ้งเรื่อง', kind: 'auto', auto: 'reporter', required: true },
          { key: 'reporterDept', label: 'หน่วยงาน', kind: 'auto', auto: 'department', required: true },
          { key: 'contactPhone', label: 'เบอร์ติดต่อ', kind: 'text', required: true, placeholder: 'เบอร์ติดต่อภายใน' },
          {
            key: 'computerName',
            label: 'ชื่อเครื่องคอมพิวเตอร์',
            kind: 'auto',
            auto: 'computer',
            required: true,
            fallbackEditable: true, // ดึงจาก AD ไม่ได้ → ให้พิมพ์เองแทน
            placeholder: 'เช่น IT-PC-0142',
          },
        ],
      },
      {
        title: 'รูปภาพ',
        fields: [
          { key: 'photos', label: 'รูปภาพ', kind: 'images', max: 3, hint: '(เพิ่มได้ไม่เกิน 3 รูป)', span2: true },
        ],
      },
    ],
  },

  PU: {
    tagline: 'จัดซื้ออะไหล่ / สืบราคา / จ้างเหมาบริการ',
    examples: 'ขอจัดซื้ออะไหล่, ขอสืบราคาเปรียบเทียบ, ขอจ้างเหมาซ่อม',
    categories: ['จัดซื้ออะไหล่', 'จัดซื้อวัสดุ', 'สืบราคา', 'จ้างเหมาบริการ', 'อื่นๆ'],
    sections: [
      {
        title: 'ข้อมูลการจัดซื้อ',
        fields: [
          { key: 'forMachine', label: 'ใช้กับเครื่องจักร / หน่วยงาน', kind: 'text', required: true, placeholder: 'เช่น CR-014 / ฝ่ายซ่อมบำรุง' },
          { key: 'neededDate', label: 'วันที่ต้องการใช้ของ', kind: 'date', required: true },
          { key: 'budget', label: 'งบประมาณที่ตั้งไว้ (บาท)', kind: 'number', placeholder: '0.00' },
          { key: 'reason', label: 'เหตุผลในการจัดซื้อ', kind: 'textarea', required: true, span2: true, placeholder: 'ระบุความจำเป็น / ผลกระทบหากไม่จัดซื้อ' },
        ],
      },
      {
        title: 'รายการที่ต้องการจัดซื้อ',
        fields: [
          { key: 'items', label: 'รายการอะไหล่ / วัสดุ', kind: 'lineItems', hint: '(เพิ่มได้หลายรายการ พร้อมราคาที่สืบได้)', span2: true },
        ],
      },
      {
        title: 'รูปภาพ',
        fields: [
          { key: 'photos', label: 'รูปอะไหล่ / ใบเสนอราคา', kind: 'images', hint: '(แนบได้หลายรูป)', span2: true },
        ],
      },
    ],
  },
};

// ฟอร์มมาตรฐาน — ใช้กับแผนกใน master ที่ยังไม่มี schema เฉพาะ
export const DEFAULT_FORM: DeptFormConfig = {
  tagline: 'แจ้งเรื่องทั่วไป',
  examples: 'แจ้งเรื่อง / ขอความอนุเคราะห์ / สอบถามข้อมูล',
  categories: ['ขอเอกสาร', 'ขอความอนุเคราะห์', 'สอบถามข้อมูล', 'แจ้งปัญหา', 'อื่นๆ'],
  sections: [
    {
      title: 'ข้อมูลประกอบ',
      fields: [
        { key: 'contactPerson', label: 'ผู้ประสานงาน', kind: 'text', placeholder: 'ชื่อผู้ติดต่อ / เบอร์ภายใน' },
        { key: 'refDoc', label: 'เอกสารอ้างอิง', kind: 'text', placeholder: 'เลขที่เอกสาร (ถ้ามี)' },
        { key: 'photos', label: 'ไฟล์ / รูปประกอบ', kind: 'images', hint: '(ถ้ามี)', span2: true },
      ],
    },
  ],
};

// หา schema ของแผนก — ไม่พบก็ใช้ฟอร์มมาตรฐาน (master มีแผนกได้มากกว่าที่ประกาศไว้)
export const getDeptForm = (departmentShort: string): DeptFormConfig =>
  DEPT_FORMS[departmentShort] ?? DEFAULT_FORM;

// แผนกที่ใช้กล่อง "รายการที่ขอ" แบบ PL (ไม่มีราคา — บังคับแค่จำนวนของแถวที่กรอกชื่อ)
const LINE_ITEM_QTY_DEPTS = ['PL', 'GA', 'IM', 'AF', 'SV', 'PS'];

// ── ตรวจสอบความถูกต้อง (คืน map ของ error — ไม่มี React) ──────
export type FormErrors = Record<string, string>;

export function validateRequestForm(f: RequestFormState): FormErrors {
  const e: FormErrors = {};
  const cfg = getDeptForm(f.departmentShort);

  // ส่วนกลาง — ตรวจเฉพาะฟิลด์ที่แผนกนี้ใช้จริง
  const common = commonFieldsOf(cfg);
  if (!f.departid) e.departid = 'กรุณาเลือกแผนกปลายทางจากรายการ';
  if (common.includes('category') && !f.category) e.category = 'กรุณาเลือกประเภทเรื่อง';
  if (common.includes('subject') && !f.subject.trim()) e.subject = 'กรุณาระบุเรื่อง';
  if (common.includes('detail')) {
    if (!f.detail.trim()) e.detail = 'กรุณากรอกรายละเอียด';
    else if (f.detail.length > DETAIL_MAX_LEN)
      e.detail = `รายละเอียดยาวเกิน ${DETAIL_MAX_LEN} ตัวอักษร (ตอนนี้ ${f.detail.length})`;
  }
  if (common.includes('dueDate') && !f.dueDate) e.dueDate = 'กรุณาระบุวันที่ต้องการให้เสร็จ';

  // ฟิลด์เฉพาะแผนก
  for (const sec of cfg.sections) {
    for (const fd of sec.fields) {
      // ฟิลด์ที่ถูกซ่อนอยู่ = ยังไม่ใช่เรื่องของผู้ใช้ตอนนี้ (ค่าก็ถูกล้างไปแล้ว)
      if (!fieldVisible(fd, f.values)) continue;
      // ฟิลด์ไม่บังคับ แต่ถ้ามี maxLen ก็ยังต้องตรวจความยาว
      if (!fd.required) {
        const val = f.values[fd.key] || '';
        if (fd.maxLen && val.length > fd.maxLen)
          e[fd.key] = `${fd.label}ยาวเกิน ${fd.maxLen} ตัวอักษร (ตอนนี้ ${val.length})`;
        continue;
      }
      if (fd.kind === 'auto') {
        // ดึงมาไม่ได้ + พิมพ์เองไม่ได้ = ข้อมูลผู้ใช้ไม่ครบ ต้องบอกให้ชัด
        if (!(f.values[fd.key] || '').trim()) {
          e[fd.key] = fd.fallbackEditable
            ? `กรุณากรอก${fd.label}`
            : `ระบบดึง${fd.label}ไม่ได้ กรุณาติดต่อผู้ดูแลระบบ`;
        }
        continue;
      }
      if (fd.kind === 'lineItems') {
        const valid = f.lineItems.filter((li) => li.name.trim() !== '');
        if (valid.length === 0) e[fd.key] = 'กรุณาเพิ่มอย่างน้อย 1 รายการ';
        continue;
      }
      if (fd.kind === 'images') {
        if (f.images.length === 0) e[fd.key] = 'กรุณาแนบรูปอย่างน้อย 1 รูป';
        continue;
      }
      if (fd.kind === 'checkboxes') {
        if (checkedValues(f.values[fd.key]).length === 0)
          e[fd.key] = `กรุณาเลือก${fd.label}อย่างน้อย 1 รายการ`;
        continue;
      }
      const v = f.values[fd.key] || '';
      if (!v.trim()) e[fd.key] = `กรุณากรอก${fd.label}`;
      else if (fd.maxLen && v.length > fd.maxLen)
        e[fd.key] = `${fd.label}ยาวเกิน ${fd.maxLen} ตัวอักษร (ตอนนี้ ${v.length})`;
    }
  }

  // แผนกที่ใช้ "รายการที่ขอ" แบบ PL: ไม่บังคับกรอก แต่แถวที่กรอกชื่อแล้วต้องระบุจำนวน
  if (LINE_ITEM_QTY_DEPTS.includes(f.departmentShort)) {
    const filled = f.lineItems.filter((li) => li.name.trim() !== '');
    if (filled.some((li) => !li.qty || Number(li.qty) <= 0)) e.items = 'กรุณาระบุจำนวนของทุกรายการ';
  }

  // จัดซื้อ: รายการที่กรอกชื่อแล้วต้องมีจำนวนและราคา
  if (f.departmentShort === 'PU') {
    const filled = f.lineItems.filter((li) => li.name.trim() !== '');
    if (filled.some((li) => !li.qty || Number(li.qty) <= 0)) e.items = 'กรุณาระบุจำนวนของทุกรายการ';
    else if (filled.some((li) => li.price === '')) e.items = 'กรุณาระบุราคาของทุกรายการ';
  }

  return e;
}

// ชื่อเรื่องที่ใช้แสดงในหน้าสรุปหลังส่ง — แผนกที่ไม่มีช่อง "เรื่อง"
// (IT ใช้ต้นข้อความรายละเอียด, PL ใช้ "เรื่องที่แจ้ง" ผ่าน cfg.summaryKey)
export function summaryTitle(f: RequestFormState): string {
  const cfg = getDeptForm(f.departmentShort);
  let fromKey = '';
  if (cfg.summaryKey) {
    const raw = (f.values[cfg.summaryKey] || '').trim();
    // ค่าที่เก็บอาจเป็น id ของตัวเลือก — แสดงเป็นข้อความที่ผู้ใช้เลือกไว้
    const fd = cfg.sections.flatMap((sec) => sec.fields).find((x) => x.key === cfg.summaryKey);
    fromKey = raw ? optionLabel(fd?.options, raw) : '';
  }
  return f.subject.trim() || fromKey || f.detail.trim().slice(0, 40);
}

export const formatBaht = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
