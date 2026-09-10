import {
  HR_PR_STATUS_NOT_STARTED,
  HrServiceForm,
  toHrServiceFields,
  validateHrServiceForm,
} from './hrServiceForm';

const form = (patch: Partial<HrServiceForm> = {}): HrServiceForm => ({
  repairStatus: '',
  serviceDetail: '',
  remark: '',
  ...patch,
});

test('บันทึกระหว่างดำเนินการ ปล่อยว่างได้ทุกช่อง', () => {
  expect(validateHrServiceForm(form(), false)).toBeNull();
  expect(validateHrServiceForm(form({ repairStatus: HR_PR_STATUS_NOT_STARTED }), false)).toBeNull();
});

test('ดำเนินการเสร็จ บังคับสถานะ และห้ามเป็น "ยังไม่ดำเนินการ"', () => {
  expect(validateHrServiceForm(form(), true)).toBe('กรุณาเลือกสถานะการดำเนินการก่อนกดดำเนินการเสร็จ');
  expect(validateHrServiceForm(form({ repairStatus: HR_PR_STATUS_NOT_STARTED }), true)).toContain(
    'ปิดขั้นดำเนินการไม่ได้'
  );
  expect(validateHrServiceForm(form({ repairStatus: 'ทันตามนโยบาย' }), true)).toBeNull();
});

test('ค่านอกรายการถูกปฏิเสธ', () => {
  expect(validateHrServiceForm(form({ repairStatus: 'เสร็จแล้วมั้ง' }), false)).toBe(
    'กรุณาเลือกสถานะการดำเนินการจากรายการ'
  );
});

test('สตริงว่างยังถูกส่งไป — ลบข้อความออกแล้วต้องล้างของเดิมจริง', () => {
  expect(toHrServiceFields(form({ repairStatus: 'ทันตามนโยบาย' }))).toEqual({
    repairStatus: 'ทันตามนโยบาย',
    serviceDetail: '',
    remark: '',
  });
});
