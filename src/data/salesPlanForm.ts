// ตรรกะฟอร์ม "เพิ่ม/แก้ไขแผนขาย" แบบ pure (ไม่ผูกกับ UI/React)
// - แปลงข้อมูล API ↔ state ของฟอร์ม
// - ตรวจสอบข้อมูล (validation)
// - สร้างตัวเลือก (options) จาก Master Data
// แยกออกจากคอมโพเนนต์เพื่อให้ทดสอบง่ายและ reuse ได้
import { SalesPlanLineApi } from '../types/salesPlan';
import { MasterData } from '../hooks/useMasterData';
import { toDateInput } from './salesPlanData';

// ── สถานะฟอร์มเพิ่มแผนขาย ──
export interface PlanFormState {
  salemanId: string;
  planFrom: string; // แผนขายมาจากที่ไหน
  leadSource: string; // แหล่งที่มาของข้อมูล
  leadSourceOther: string; // ระบุเมื่อเลือก "อื่นๆ"
  custAccount: string; // รหัสลูกค้าที่เลือก
  deliveryAddress: string; // สถานที่ทำงาน
  city: string; // จังหวัด
  machineTypeId: string; // ประเภทเครื่องจักร
  mark: string; // รุ่น
  planStatus: string; // สถานะการขาย
  useMode: 'specified' | 'interchangeable'; // ใช้เครื่องระบุ / ใช้รถทดแทน
  interchangeableRemarks: string; // ขนาดที่ใช้ทดแทนได้
  workKind: string; // ประเภทงาน (เดือน/วัน/เที่ยว/ชิ้น)
  period: string; // จำนวน
  planValue: string; // มูลค่าแผนขาย
  startFromDate: string; // วันที่ต้องการใช้งาน
  remark: string; // หมายเหตุ เงื่อนไขการขาย
  jobDetail: string; // ลักษณะงาน
  quotationId: string; // เลขที่ใบเสนอราคา
  poid: string; // เลขที่ PO
}

// แปลง 1 บรรทัดจาก API → state ของฟอร์ม (โหมดแก้ไข prefill, โหมดเพิ่มใช้ค่าว่างจาก emptyLine)
export function toPlanForm(line: SalesPlanLineApi): PlanFormState {
  return {
    salemanId: line.salemanId || '',
    planFrom: line.contactChannelId ? String(line.contactChannelId) : '',
    leadSource: line.leadSourceId ? String(line.leadSourceId) : '',
    leadSourceOther: line.leadSourceRemark || '',
    custAccount: line.custAccount || '',
    deliveryAddress: line.deliveryAddress || '',
    city: line.city || '',
    machineTypeId: line.machineTypeId || '',
    mark: line.mark || '',
    planStatus: line.planStatus || '',
    useMode: line.isInterchangeable ? 'interchangeable' : 'specified',
    interchangeableRemarks: line.interchangeableRemarks || '',
    // NOTE: workKind ยัง round-trip ไม่ครบ (รองรับเฉพาะ เดือน/วัน) — รอทำตอน create เสร็จ
    workKind: line.conditionMonth ? 'งานเดือน' : line.conditionDay ? 'งานวัน' : '',
    period: line.periodNotLess ? String(line.periodNotLess) : '',
    planValue: line.planValue ? String(line.planValue) : '',
    startFromDate: toDateInput(line.startFromDate),
    remark: line.remark || '',
    jobDetail: line.jobType || '',
    quotationId: line.quotationId || '',
    poid: line.poid || '',
  };
}

// ฟิลด์ที่ต้องกรอก (ใช้ตรวจสอบตอนกดบันทึก) — label ใช้ในสรุปข้อผิดพลาด
export const REQUIRED_FIELDS: { key: keyof PlanFormState; label: string }[] = [
  { key: 'salemanId', label: 'ชื่อพนักงานขาย' },
  { key: 'planFrom', label: 'แผนขายมาจากที่ไหน' },
  { key: 'leadSource', label: 'แหล่งที่มาของข้อมูล' },
  { key: 'custAccount', label: 'ชื่อลูกค้า' },
  { key: 'deliveryAddress', label: 'สถานที่ทำงาน' },
  { key: 'city', label: 'จังหวัด' },
  { key: 'machineTypeId', label: 'ประเภทเครื่องจักร' },
  { key: 'mark', label: 'รุ่น' },
  { key: 'planStatus', label: 'สถานะการขาย' },
  { key: 'workKind', label: 'ประเภทงาน' },
  { key: 'period', label: 'จำนวน' },
  { key: 'planValue', label: 'มูลค่าแผนขาย' },
  { key: 'startFromDate', label: 'วันที่ต้องการใช้งาน' },
  { key: 'jobDetail', label: 'ลักษณะงาน' },
];

export type PlanFormErrors = Partial<Record<keyof PlanFormState, string>>;

// ตรวจสอบข้อมูลก่อนบันทึก — คืน map ของช่องที่ยังไม่ได้กรอก (ว่าง = ผ่าน)
// isOtherLead: ผู้เรียกคำนวณมาจากรายการแหล่งที่มาที่เลือก (ต้องระบุเพิ่มเมื่อเลือก "อื่นๆ")
export function validatePlanForm(f: PlanFormState, opts: { isOtherLead: boolean }): PlanFormErrors {
  const e: PlanFormErrors = {};
  REQUIRED_FIELDS.forEach((r) => {
    if (!String(f[r.key] ?? '').trim()) e[r.key] = 'กรุณาระบุ';
  });
  if (opts.isOtherLead && !f.leadSourceOther.trim()) e.leadSourceOther = 'กรุณาระบุแหล่งที่มา';
  if (f.useMode === 'interchangeable' && !f.interchangeableRemarks.trim())
    e.interchangeableRemarks = 'กรุณาระบุขนาดที่ใช้ทดแทนได้';
  return e;
}

// ── ตัวเลือก (options) ของ combobox — pure เพื่อให้ memo ได้ ──
export interface PlanFormOption {
  value: string;
  label: string;
}
export interface PlanFormOptions {
  salesman: PlanFormOption[];
  planFrom: PlanFormOption[];
  leadSource: PlanFormOption[];
  customer: PlanFormOption[];
  province: PlanFormOption[];
  machineType: PlanFormOption[];
  planStatus: PlanFormOption[];
}

// สร้างตัวเลือกทั้งหมดจาก Master Data (เรียกใน useMemo ที่คอมโพเนนต์)
export function buildPlanFormOptions(master: MasterData): PlanFormOptions {
  return {
    salesman: master.salesmen.map((s) => ({
      value: s.code,
      label: s.fullNameTH ? `${s.nameShort} — ${s.fullNameTH}` : s.nameShort,
    })),
    planFrom: master.contactChannels.map((c) => ({
      value: String(c.contactChannelID),
      label: c.contactChannelNameTH || c.contactChannelNameEN,
    })),
    leadSource: master.leadSources.map((l) => ({
      value: String(l.leadSourceID),
      label: l.leadSourceNameTH || l.leadSourceNameEN,
    })),
    customer: master.customers.map((c) => ({
      value: c.customerID,
      label: `${c.customerName} (${c.customerID})`,
    })),
    province: master.provinces.map((p) => ({ value: p.nameTH, label: p.nameTH })),
    machineType: master.machineTypes.map((m) => ({ value: m.machineTypeId, label: m.machineTypeId })),
    planStatus: master.planStatuses.map((s) => ({ value: s.name, label: s.name })),
  };
}
