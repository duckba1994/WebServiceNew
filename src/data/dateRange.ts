// ── ช่วงวันที่สำหรับกรองรายการ (ตรรกะล้วน ไม่มี JSX/hook) ─────────
// ใช้กับตัวกรอง "ช่วงวันที่แจ้ง" ที่ส่ง dateFrom/dateTo ไปกรองที่ API
// (เดิมหน้าเว็บดึงใบทั้งหมดมาแล้วค่อยกรองเอง — โตขึ้นเรื่อย ๆ ไม่ไหว)
//
// ค่าเป็น 'YYYY-MM-DD' หรือ '' (= ไม่จำกัดด้านนั้น) เหมือน RequestListQuery
// ห้ามใช้ toISOString() แปลงวันที่ — จะเป็น UTC แล้ววันถอยไป 1 วันในโซนไทย

export interface DateRangeValue {
  from: string;
  to: string;
}

export type DateRangeKey = 'month' | 'd30' | 'm3' | 'm6' | 'year' | 'all' | 'custom';

export const ymd = (d: Date): string =>
  `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}-${`${d.getDate()}`.padStart(2, '0')}`;

const today = (): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// คำนวณตอนเรียก ไม่ใช่ตอน import — หน้าเปิดค้างข้ามวันแล้วช่วงจะเพี้ยน
const backDays = (days: number): DateRangeValue => {
  const to = today();
  const from = today();
  from.setDate(from.getDate() - days);
  return { from: ymd(from), to: ymd(to) };
};

const backMonths = (months: number): DateRangeValue => {
  const to = today();
  const from = today();
  from.setMonth(from.getMonth() - months);
  return { from: ymd(from), to: ymd(to) };
};

export const RANGE_PRESETS: { key: Exclude<DateRangeKey, 'custom'>; label: string }[] = [
  { key: 'month', label: 'เดือนนี้' },
  { key: 'd30', label: '30 วัน' },
  { key: 'm3', label: '3 เดือน' },
  { key: 'm6', label: '6 เดือน' },
  { key: 'year', label: 'ปีนี้' },
  { key: 'all', label: 'ทั้งหมด' },
];

export const rangeOf = (key: DateRangeKey): DateRangeValue => {
  switch (key) {
    // เดือนปัจจุบัน: วันที่ 1 → วันสุดท้ายของเดือน (day 0 ของเดือนถัดไป = สิ้นเดือนนี้
    // จึงถูกทั้งเดือน 28/29/30/31 วัน โดยไม่ต้องเช็คปีอธิกสุรทินเอง)
    // ปิดท้ายที่สิ้นเดือน ไม่ใช่วันนี้ — ใบที่ลงวันที่ล่วงหน้าในเดือนนี้ต้องเห็นด้วย
    case 'month': {
      const t = today();
      return {
        from: ymd(new Date(t.getFullYear(), t.getMonth(), 1)),
        to: ymd(new Date(t.getFullYear(), t.getMonth() + 1, 0)),
      };
    }
    case 'd30':
      return backDays(30);
    case 'm3':
      return backMonths(3);
    case 'm6':
      return backMonths(6);
    case 'year': {
      const t = today();
      return { from: ymd(new Date(t.getFullYear(), 0, 1)), to: ymd(t) };
    }
    // 'all' และ 'custom' ไม่มีช่วงตั้งต้น — custom ให้ผู้ใช้กรอกเอง
    default:
      return { from: '', to: '' };
  }
};

// ป้ายสรุปช่วงที่กำลังกรองอยู่ — ต้องอ่านออกเสมอว่าตารางนี้ "ไม่ใช่ทั้งหมด"
export const rangeText = (v: DateRangeValue): string => {
  const fmt = (s: string) => (s ? s.split('-').reverse().join('/') : '');
  if (!v.from && !v.to) return 'ทุกช่วงเวลา';
  if (v.from && !v.to) return `ตั้งแต่ ${fmt(v.from)}`;
  if (!v.from && v.to) return `ถึง ${fmt(v.to)}`;
  return `${fmt(v.from)} – ${fmt(v.to)}`;
};

// ช่วงที่กรอกกลับหัว (from > to) API จะคืนศูนย์รายการเงียบ ๆ — เตือนที่หน้าเว็บก่อน
export const isRangeInvalid = (v: DateRangeValue): boolean =>
  !!v.from && !!v.to && v.from > v.to;
