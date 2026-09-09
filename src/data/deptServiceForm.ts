import { RequestListItem } from '../types/requestList';
import { ActionFieldValues } from './requestActionFields';

// Exact values supplied by the GA/IM service guide (2026-09-09), not fallback master data.
export const DEPT_SERVICE_ACTIONS: Record<string, string[]> = {
  GA: ['ยังไม่ดำเนินการ', 'มีอุปกรณ์ในสต๊อก', 'ผู้รับเหมา/ร้านค้า', 'จัดซื้อใหม่', 'ซ่อมภายนอก', 'อื่นๆ ระบุหมายเหตุ'],
  IM: ['ยังไม่ดำเนินการ', 'มีอุปกรณ์ในสต๊อก', 'จัดซื้อใหม่', 'ส่งซ่อมภายนอก', 'อื่นๆ ระบุหมายเหตุ'],
};
export const DEPT_SERVICE_RESULTS = ['ยังไม่เรียบร้อย', 'จัดการเรียบร้อย'];

export interface DeptServiceForm {
  repairStatus: string;
  exPrNo: string;
  leadTime: string;
  workResults: string;
  remark: string;
}

export const toDeptServiceForm = (item: RequestListItem): DeptServiceForm => ({
  repairStatus: item.resolution?.repairStatus ?? '',
  exPrNo: item.resolution?.exPrNo ?? '',
  leadTime: item.resolution?.leadTime == null ? '' : String(item.resolution.leadTime),
  workResults: item.resolution?.solution ?? '',
  remark: item.remark ?? '',
});

export function validateDeptServiceForm(module: string, form: DeptServiceForm, completing: boolean): string | null {
  if (form.repairStatus && !DEPT_SERVICE_ACTIONS[module]?.includes(form.repairStatus)) return 'กรุณาเลือกดำเนินการโดยจากรายการ';
  if (form.exPrNo.length > 20) return 'PR ต้องไม่เกิน 20 ตัวอักษร';
  if (form.remark.length > 500) return 'หมายเหตุต้องไม่เกิน 500 ตัวอักษร';
  if (module === 'GA' && form.leadTime.trim() !== '' &&
      (!Number.isFinite(Number(form.leadTime)) || Number(form.leadTime) < 0 || Number(form.leadTime) > 100)) {
    return 'ระยะเวลาต้องเป็นตัวเลขระหว่าง 0–100 วัน';
  }
  if (form.workResults && !DEPT_SERVICE_RESULTS.includes(form.workResults)) return 'กรุณาเลือกผลการดำเนินงานจากรายการ';
  if (completing && form.workResults !== 'จัดการเรียบร้อย') return 'กรุณาเลือกผลการดำเนินงานเป็น “จัดการเรียบร้อย” ก่อนปิดงาน';
  return null;
}

export function toDeptServiceFields(module: string, form: DeptServiceForm): ActionFieldValues {
  // Empty strings deliberately clear stored text; cleanFieldValues would lose this intent.
  // Empty leadTime is omitted: the contract defines null/omission as keep, not clear.
  return {
    repairStatus: form.repairStatus,
    exPrNo: form.exPrNo,
    workResults: form.workResults,
    remark: form.remark,
    ...(module === 'GA' && form.leadTime.trim() !== '' ? { leadTime: Number(form.leadTime) } : {}),
  };
}
