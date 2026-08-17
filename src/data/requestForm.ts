import { RequestPriority } from '../types/request';
import { DepartmentApi } from '../types/masterData';

// ── PURE form logic ของ "สร้างใบแจ้งเรื่อง" (ไม่มี JSX/hooks — เทสได้) ──
// แต่ละแผนกกรอกข้อมูลไม่เหมือนกัน จึงประกาศเป็น schema ต่อแผนก
// แล้วหน้า CreateItem เรนเดอร์ตาม schema (ดู PROJECT_STRUCTURE.md §6.5)

export type FieldKind =
  | 'text'
  | 'textarea'
  | 'select'
  | 'date'
  | 'number'
  | 'auto' // ดึงมาให้อัตโนมัติ (จาก login / AD) — ผู้ใช้ไม่ต้องกรอก
  | 'images' // อัปโหลดรูป + พรีวิว
  | 'lineItems'; // ตารางรายการย่อย (เช่น รายการอะไหล่ + ราคา)

// แหล่งข้อมูลของฟิลด์ kind='auto'
// reporter/department = จากการ login ครั้งแรก, computer = ชื่อเครื่องจาก AD
export type AutoSource = 'reporter' | 'department' | 'computer';

export interface AutoFillValues {
  reporter: string;
  department: string;
  computer: string;
}

export interface FieldDef {
  key: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  span2?: boolean;
  placeholder?: string;
  hint?: string;
  options?: string[];
  // kind='auto' เท่านั้น
  auto?: AutoSource;
  // ดึงค่าอัตโนมัติไม่ได้ (เช่น AD ไม่ส่งชื่อเครื่องมา) → ให้ผู้ใช้พิมพ์เองแทนที่จะตัน
  fallbackEditable?: boolean;
  // kind='images' เท่านั้น — จำนวนรูปสูงสุด (ไม่ระบุ = ค่า default ของ ImageUpload)
  max?: number;
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
  commonTitle?: string; // หัวข้อของส่วนกลาง (ไม่ระบุ = "ข้อมูลเรื่องที่แจ้ง")
  // แทรกส่วนกลางไว้ลำดับที่เท่าไรของ sections (0 = บนสุด, ไม่ระบุ = 0)
  commonPosition?: number;
}

// ฟิลด์ส่วนกลางที่แผนกนี้ต้องกรอกจริง
export const commonFieldsOf = (cfg: DeptFormConfig): CommonField[] => cfg.common ?? ALL_COMMON_FIELDS;

// ความยาวสูงสุดของ "รายละเอียดที่แจ้ง" (ตกลงไว้ 17 ส.ค. 2026)
export const DETAIL_MAX_LEN = 1000;

// ── รายการย่อย (line item) — ใช้กับฟิลด์ kind='lineItems' ──
export interface LineItem {
  id: string;
  name: string;
  qty: string;
  unit: string;
  price: string; // ราคา/หน่วย
  vendor: string; // ผู้ขาย / ร้านค้า
}

export const emptyLineItem = (): LineItem => ({
  id: `li-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  name: '',
  qty: '',
  unit: '',
  price: '',
  vendor: '',
});

export const lineTotal = (li: LineItem): number => (Number(li.qty) || 0) * (Number(li.price) || 0);
export const lineItemsTotal = (items: LineItem[]): number =>
  items.reduce((s, li) => s + lineTotal(li), 0);

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

  PL: {
    tagline: 'พฤติกรรมคนขับ / สำรวจหน้างาน / เปลี่ยนคนขับ',
    examples: 'แจ้งพฤติกรรมคนขับ, ขอสำรวจหน้างาน, ขอเปลี่ยนคนขับ',
    categories: ['พฤติกรรมคนขับ', 'เปลี่ยนคนขับ', 'สำรวจหน้างาน', 'แผนงาน', 'อื่นๆ'],
    sections: [
      {
        title: 'ข้อมูลคนขับ / รถ',
        fields: [
          { key: 'driverName', label: 'ชื่อคนขับ', kind: 'text', required: true, placeholder: 'ชื่อ-นามสกุลคนขับ' },
          { key: 'plateNo', label: 'ทะเบียนรถ / เบอร์รถ', kind: 'text', required: true, placeholder: 'เช่น 70-1234' },
          { key: 'project', label: 'โครงการ / ไซต์งาน', kind: 'text', required: true },
          { key: 'incidentDate', label: 'วันที่เกิดเหตุ', kind: 'date', required: true },
          { key: 'location', label: 'สถานที่เกิดเหตุ', kind: 'text', span2: true },
        ],
      },
      {
        title: 'หลักฐานประกอบ',
        fields: [
          { key: 'photos', label: 'รูปภาพประกอบ', kind: 'images', hint: '(แนบได้หลายรูป)', span2: true },
        ],
      },
    ],
  },

  SV: {
    tagline: 'เครื่องยนต์ / ไฮดรอลิก / ซ่อมบำรุงเครื่องจักร',
    examples: 'เครื่องยนต์มีเสียงผิดปกติ, น้ำมันไฮดรอลิกรั่ว, ขอตรวจเช็คตามระยะ',
    categories: ['เครื่องยนต์', 'ระบบไฮดรอลิก', 'ระบบไฟฟ้า', 'ซ่อมบำรุง', 'อื่นๆ'],
    sections: [
      {
        title: 'ข้อมูลเครื่องจักร',
        fields: [
          { key: 'machineNo', label: 'หมายเลขเครื่องจักร', kind: 'text', required: true, placeholder: 'เช่น CR-014' },
          { key: 'machineType', label: 'ประเภทเครื่องจักร', kind: 'select', required: true, options: ['รถเครน 4 ล้อ', 'รถเครนตีนตะขาบ', 'รถเฮี๊ยบ (Boom Truck)', 'รถกระเช้า', 'รถโฟล์คลิฟท์'] },
          { key: 'hourMeter', label: 'เลขชั่วโมงการใช้งาน', kind: 'number', placeholder: 'ชั่วโมง' },
          { key: 'siteLocation', label: 'สถานที่ตั้งเครื่องจักร', kind: 'text', required: true },
          { key: 'symptom', label: 'อาการที่พบ', kind: 'textarea', required: true, span2: true, placeholder: 'อธิบายอาการผิดปกติที่พบ' },
          { key: 'canOperate', label: 'ยังใช้งานได้หรือไม่', kind: 'select', required: true, options: ['ใช้งานได้ปกติ', 'ใช้งานได้บางส่วน', 'ใช้งานไม่ได้ / หยุดงาน'] },
        ],
      },
      {
        title: 'หลักฐานประกอบ',
        fields: [
          { key: 'photos', label: 'รูปความเสียหาย', kind: 'images', hint: '(แนบได้หลายรูป)', span2: true },
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
    commonTitle: 'รายละเอียดที่แจ้ง',
    commonPosition: 1, // ผู้แจ้ง → รายละเอียด → รูปภาพ
    sections: [
      {
        title: 'ข้อมูลผู้แจ้ง',
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
        title: 'รูปภาพประกอบ',
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
        title: 'หลักฐานประกอบ',
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
      if (!fd.required) continue;
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
      if (!(f.values[fd.key] || '').trim()) e[fd.key] = `กรุณากรอก${fd.label}`;
    }
  }

  // จัดซื้อ: รายการที่กรอกชื่อแล้วต้องมีจำนวนและราคา
  if (f.departmentShort === 'PU') {
    const filled = f.lineItems.filter((li) => li.name.trim() !== '');
    if (filled.some((li) => !li.qty || Number(li.qty) <= 0)) e.items = 'กรุณาระบุจำนวนของทุกรายการ';
    else if (filled.some((li) => li.price === '')) e.items = 'กรุณาระบุราคาของทุกรายการ';
  }

  return e;
}

export const formatBaht = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
