// ═══════════════════════════════════════════════════════════════
//  ทะเบียนฟิลด์ของ action — ใช้วาดฟอร์มตอนกดปุ่ม
// ═══════════════════════════════════════════════════════════════
//
//  ⚠️ SHIM ชั่วคราว — API ส่ง `requiredFields` มาเป็น "ชื่อฟิลด์เปล่า ๆ"
//     (`["solve","hw","hwDetail","repairDetail"]`) ไม่ได้บอกชนิด/ตัวเลือก/ป้ายไทย
//     ไฟล์นี้เลยเก็บส่วนที่ขาดไว้ ที่เดียว
//
//     พอ backend ส่ง metadata มาตาม API_SPEC_REQUESTS_V2.md §10
//     (`[{ name, label, type, required, options, maxLength }]`) ให้ลบไฟล์นี้ทิ้ง
//     แล้วอ่านจาก action ตรง ๆ — ฟอร์มจะรองรับแผนกใหม่ได้เองโดยไม่ต้องแก้โค้ด
//
//  ที่มาของรายการ: API_v2_2 §3 (ฟิลด์ทั้งหมดที่ endpoint action รับได้)
// ───────────────────────────────────────────────────────────────

export type ActionFieldType = 'text' | 'textarea' | 'date' | 'select' | 'score';

export interface ActionField {
  name: string;
  label: string;
  type: ActionFieldType;
  placeholder?: string;
  hint?: string;
  options?: { value: string; text: string }[];
  min?: number;
  max?: number;
  /** กินพื้นที่เต็มแถว (ช่องข้อความยาว) */
  wide?: boolean;
}

export const ACTION_FIELDS: Record<string, ActionField> = {
  // ── ขั้นดำเนินการ (service / skipService) ──
  solve: { name: 'solve', label: 'วิธีแก้ไข', type: 'text', placeholder: 'เช่น เปลี่ยน RAM' },
  hw: { name: 'hw', label: 'ประเภทอุปกรณ์', type: 'text', placeholder: 'เช่น Notebook / PC / Printer' },
  hwDetail: { name: 'hwDetail', label: 'รายละเอียดอุปกรณ์', type: 'text', placeholder: 'เช่น Dell Latitude 5420' },
  repairDetail: {
    name: 'repairDetail',
    label: 'รายละเอียดการซ่อม',
    type: 'textarea',
    wide: true,
    placeholder: 'อธิบายสิ่งที่ทำไป ผลการทดสอบ ฯลฯ',
  },
  repairStatus: { name: 'repairStatus', label: 'สถานะการซ่อม', type: 'text' },
  // ── ใบ CR (ดู MdApi/CR-workflow-frontend-guide.md §8) ──
  // ⚠️ ชื่อ "ส่งไป" กับ "อ่านกลับ" ไม่ตรงกันโดยตั้งใจ: ส่ง serviceDetail แต่อ่านที่
  //    resolution.resolutionDetail (resolution เป็น shape กลางใช้ร่วมกับ IT/PL)
  requestService: {
    name: 'requestService',
    label: 'ผู้ดำเนินการ',
    type: 'text',
    placeholder: 'ระบุผู้ที่จะรับไปดำเนินการ',
    hint: 'ไม่เกิน 100 ตัวอักษร',
  },
  serviceDetail: {
    name: 'serviceDetail',
    label: 'รายละเอียดการดำเนินการ',
    type: 'textarea',
    wide: true,
    placeholder: 'สรุปสิ่งที่ทำไป / ความคืบหน้า',
  },
  // PL: ผลการดำเนินงาน (คนละช่องกับ solve ของฝั่ง IT)
  actionDetail: {
    name: 'actionDetail',
    label: 'ผลการดำเนินงาน',
    type: 'textarea',
    wide: true,
    placeholder: 'สรุปผลที่ได้จากการดำเนินงาน',
  },

  // ── ส่งซ่อมภายนอก / รออะไหล่ (ไม่บังคับทั้งชุด) ──
  exVendor: { name: 'exVendor', label: 'ผู้รับซ่อมภายนอก', type: 'text', placeholder: 'ชื่อร้าน / บริษัท' },
  exContact: { name: 'exContact', label: 'ผู้ติดต่อ', type: 'text', placeholder: 'ชื่อ / เบอร์โทร' },
  exPlanDate: { name: 'exPlanDate', label: 'กำหนดเสร็จ', type: 'date' },
  exPrNo: { name: 'exPrNo', label: 'เลขที่ PR', type: 'text' },

  // ── ขั้นสำรวจความพึงพอใจ (survey) ──
  serviceScore: {
    name: 'serviceScore',
    label: 'คะแนนความพึงพอใจ',
    type: 'score',
    min: 1,
    max: 25,
    hint: 'เต็ม 25 คะแนน (5 หัวข้อ × 5 ระดับ)',
  },
  surveyRemark: {
    name: 'surveyRemark',
    label: 'ความคิดเห็นเพิ่มเติม',
    type: 'textarea',
    wide: true,
    placeholder: 'ข้อเสนอแนะถึงผู้ให้บริการ (ไม่บังคับ)',
  },

  // ── ขั้นปิดงาน (close) ──
  caseNo: {
    name: 'caseNo',
    label: 'เคส',
    type: 'select',
    options: [
      { value: '1', text: 'เคสที่ 1' },
      { value: '2', text: 'เคสที่ 2' },
      { value: '3', text: 'เคสที่ 3' },
      { value: '4', text: 'เคสที่ 4' },
    ],
  },
  kpi: {
    name: 'kpi',
    label: 'ผล KPI',
    type: 'select',
    options: [
      { value: 'ตาม KPI', text: 'ตาม KPI' },
      { value: 'ตก KPI', text: 'ตก KPI' },
      { value: 'ยกเลิก', text: 'ยกเลิก' },
      { value: 'ยังไม่ถึงกำหนด', text: 'ยังไม่ถึงกำหนด' },
    ],
  },
};

// ฟิลด์ที่ API ยังไม่รู้จัก → วาดเป็นช่องข้อความธรรมดา ใช้ชื่อฟิลด์เป็นป้าย
// ดีกว่าปิดปุ่มทิ้ง เพราะผู้ใช้ยังทำงานต่อได้ แค่ป้ายไม่สวย
export const fieldSpec = (name: string): ActionField =>
  ACTION_FIELDS[name] ?? { name, label: name, type: 'text', hint: 'ฟิลด์นี้ยังไม่มีป้ายกำกับในระบบ' };

// ── ฟิลด์เสริมที่ "ไม่บังคับ" แต่ควรมีให้กรอก ─────────────────
// requiredFields บอกแค่ฟิลด์บังคับ ส่วนพวกนี้เป็นของแถมตามบริบทงานจริง:
// ขั้นดำเนินการมักใช้ตอนส่งซ่อมข้างนอกหรือรออะไหล่ ถ้าไม่มีที่กรอก
// ข้อมูลนั้นก็หายไปทั้งที่ DB มีคอลัมน์รองรับ
export interface OptionalGroup {
  title: string;
  hint: string;
  fields: string[];
}

export const OPTIONAL_GROUPS: Record<string, OptionalGroup[]> = {
  service: [
    {
      title: 'ส่งซ่อมภายนอก / รออะไหล่',
      hint: 'กรอกเมื่อส่งเครื่องออกไปซ่อมข้างนอก หรือรอของ',
      fields: ['exVendor', 'exContact', 'exPlanDate', 'exPrNo'],
    },
  ],
  skipService: [
    {
      title: 'ส่งซ่อมภายนอก / รออะไหล่',
      hint: 'กรอกเมื่อส่งเครื่องออกไปซ่อมข้างนอก หรือรอของ',
      fields: ['exVendor', 'exContact', 'exPlanDate', 'exPrNo'],
    },
  ],
  survey: [{ title: 'ความคิดเห็นเพิ่มเติม', hint: '', fields: ['surveyRemark'] }],
  close: [{ title: 'ข้อมูลปิดงาน', hint: 'ใช้ทำรายงาน KPI', fields: ['caseNo', 'kpi'] }],
};

// แผนกที่ขั้นปิดงานไม่เก็บอะไรเลย — ปุ่มปิดงานต้องเป็นกล่องยืนยันเปล่า ๆ
// PL: ผู้ใช้ยืนยัน 31 ส.ค. 2026 ว่าปิดงานคือ "รับทราบว่าเสร็จ" ไม่มีฟิลด์ ไม่มี KPI
//     (ผลงานถูกเก็บไปแล้วที่ขั้น Service ผ่าน repairDetail + actionDetail)
// CR: ปิดงานรับ actionDetail ได้ 1 ช่อง (ไม่บังคับ) แต่ไม่มี KPI — ช่องนั้นอยู่ในแผง
//     ปิดงานของ CR เอง (CrClosePanel) ไม่ได้ผ่านกล่องนี้ · ใส่ไว้กัน KPI ของ IT
//     หลุดไปโผล่กับใบ CR ถ้าวันหนึ่ง action close ตกมาที่กล่องยืนยัน
const NO_CLOSE_FIELDS = new Set(['PL', 'CR']);

export const optionalGroupsOf = (actionCode: string, module?: string): OptionalGroup[] => {
  if (actionCode === 'close' && module && NO_CLOSE_FIELDS.has(module)) return [];
  return OPTIONAL_GROUPS[actionCode] ?? [];
};

// ── ค่าที่ส่งกลับไปให้ API ─────────────────────────────────────
// ค่าเป็น object ได้ด้วย — บาง action ส่งกลุ่มค่ารายข้อ (survey: surveyRatings)
export type ActionFieldValue = string | number | Record<string, number>;
export type ActionFieldValues = Record<string, ActionFieldValue>;

// ตัดช่องว่าง ทิ้งค่าว่าง (API: "ฟิลด์ที่ไม่ส่งมา = คงค่าเดิมใน DB ไว้"
// → ส่งสตริงว่างไปจะกลายเป็นการล้างค่าเดิมโดยไม่ตั้งใจ)
export function cleanFieldValues(values: ActionFieldValues): ActionFieldValues | undefined {
  const out: ActionFieldValues = {};
  for (const [k, v] of Object.entries(values)) {
    if (typeof v === 'number') {
      out[k] = v;
    } else if (typeof v === 'string') {
      if (v.trim() !== '') out[k] = v.trim();
    } else if (v && typeof v === 'object') {
      // กลุ่มค่ารายข้อ (เช่น surveyRatings) — ส่งไปเมื่อมีค่าอย่างน้อย 1 ข้อ
      if (Object.keys(v).length > 0) out[k] = v;
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

// ตรวจฟิลด์บังคับก่อนยิง — API ตรวจซ้ำอยู่แล้ว แต่บอกผู้ใช้ตั้งแต่ยังไม่ยิงดีกว่า
export function missingRequired(required: string[], values: ActionFieldValues): string[] {
  return required.filter((name) => {
    const v = values[name];
    if (typeof v === 'number') return Number.isNaN(v);
    return !v || String(v).trim() === '';
  });
}
