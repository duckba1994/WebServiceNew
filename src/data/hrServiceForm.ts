import { RequestListItem } from '../types/requestList';
import { ActionFieldValues } from './requestActionFields';

// ── ขั้นดำเนินการของใบ HR-PR — PURE logic ───────────────────────
// ค่าทั้งสามตัวมาจาก HR-PR-frontend-guide.md §Workflow actions ตรง ๆ ไม่ใช่ master data
// (เป็นค่าคงที่ของ workflow เหมือน DEPT_SERVICE_ACTIONS ของ GA/IM ไม่ได้เสิร์ฟจาก /MasterData/hr)
export const HR_PR_STATUS_NOT_STARTED = 'ยังไม่ดำเนินการ';
export const HR_PR_REPAIR_STATUSES = [
  HR_PR_STATUS_NOT_STARTED,
  'ทันตามนโยบาย',
  'ไม่ทันตามนโยบาย ระบุ',
];

export interface HrServiceForm {
  repairStatus: string;
  serviceDetail: string;
  remark: string;
}

// ⚠️ ส่งขึ้นไปเป็น serviceDetail แต่อ่านกลับที่ resolution.resolutionDetail
// (resolution เป็น shape กลางที่ใช้ร่วมกับ IT/PL — ชื่อคนละทิศทางโดยตั้งใจ)
export const toHrServiceForm = (item: RequestListItem): HrServiceForm => ({
  repairStatus: item.resolution?.repairStatus ?? '',
  serviceDetail: item.resolution?.resolutionDetail ?? '',
  remark: item.remark ?? '',
});

// completing = กดปุ่ม `service` (ดำเนินการเสร็จ) ไม่ใช่ `saveService`
export function validateHrServiceForm(form: HrServiceForm, completing: boolean): string | null {
  if (form.repairStatus && !HR_PR_REPAIR_STATUSES.includes(form.repairStatus))
    return 'กรุณาเลือกสถานะการดำเนินการจากรายการ';
  if (form.serviceDetail.length > 500) return 'รายละเอียดผลการดำเนินการต้องไม่เกิน 500 ตัวอักษร';
  if (form.remark.length > 500) return 'หมายเหตุต้องไม่เกิน 500 ตัวอักษร';
  if (!completing) return null;
  // `service` บังคับ repairStatus และห้ามเป็น "ยังไม่ดำเนินการ" (guide §Workflow actions)
  if (!form.repairStatus) return 'กรุณาเลือกสถานะการดำเนินการก่อนกดดำเนินการเสร็จ';
  if (form.repairStatus === HR_PR_STATUS_NOT_STARTED)
    return `“${HR_PR_STATUS_NOT_STARTED}” ปิดขั้นดำเนินการไม่ได้ — เลือกสถานะอื่นหรือกดบันทึกไว้ก่อน`;
  return null;
}

// สตริงว่างตั้งใจให้ล้างค่าเดิม จึงไม่ผ่าน cleanFieldValues (ซึ่งจะตัดช่องว่างทิ้ง
// แล้วกลายเป็น "ไม่เปลี่ยน" — ผู้ใช้ที่ลบข้อความออกจะงงว่าทำไมของเดิมยังอยู่)
export const toHrServiceFields = (form: HrServiceForm): ActionFieldValues => ({
  repairStatus: form.repairStatus,
  serviceDetail: form.serviceDetail,
  remark: form.remark,
});
