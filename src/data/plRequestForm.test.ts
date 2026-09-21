import { toPlRequestPayload } from './plRequestForm';
import { PL_CREATE_ATTACH, RequestFormState, validateRequestForm } from './requestForm';

const plForm = (values: Record<string, string>): RequestFormState => ({
  departid: '12',
  departmentShort: 'PL',
  departmentName: 'วางแผนและโลจิสติกส์',
  category: '',
  subject: '',
  priority: 'normal',
  dueDate: '',
  detail: '',
  values: {
    reporterName: 'สมชาย',
    reporterDept: 'IT',
    requestDate: '2026-09-21',
    requestType: 'จัดซื้อ',
    topic: 'ขอซื้อสินค้า',
    dueDate: '2026-09-30',
    topicDetail: 'ขอซื้ออุปกรณ์',
    reason: 'ใช้ในโครงการ',
    ...values,
  },
  images: [],
  lineItems: [],
});

test('PL create maps every selected attachment field to POST /PLRequest', () => {
  const payload = toPlRequestPayload(plForm({
    plAttachDocs: [
      PL_CREATE_ATTACH.budget,
      PL_CREATE_ATTACH.spec,
      PL_CREATE_ATTACH.quotation,
      PL_CREATE_ATTACH.picture,
      PL_CREATE_ATTACH.other,
    ].join('|'),
    plBudgetDocNo: ' BG-001 ',
    plExBudgetDocNo: 'stale-ex-budget',
    plAttachOtherDetail: ' เอกสารเพิ่มเติม ',
  }), 'สมชาย');

  expect(payload).toMatchObject({
    attachBudget: true,
    budgetDocNo: 'BG-001',
    attachExBudget: false,
    exBudgetDocNo: null,
    attachSpec: true,
    attachQuatation: true,
    attachPicture: true,
    attachCustDocConfirm: false,
    attachOther: true,
    attachOtherDetail: 'เอกสารเพิ่มเติม',
  });
});

test('PL create sends false and null for an empty attachment checklist', () => {
  const payload = toPlRequestPayload(plForm({
    plBudgetDocNo: 'stale-budget',
    plExBudgetDocNo: 'stale-ex-budget',
    plAttachOtherDetail: 'stale-other',
  }), 'สมชาย');

  expect(payload).toMatchObject({
    attachBudget: false,
    budgetDocNo: null,
    attachExBudget: false,
    exBudgetDocNo: null,
    attachSpec: false,
    attachQuatation: false,
    attachPicture: false,
    attachCustDocConfirm: false,
    attachOther: false,
    attachOtherDetail: null,
  });
});

test('PL requires the matching textbox only when its checkbox is selected', () => {
  const errors = validateRequestForm(plForm({
    plAttachDocs: [
      PL_CREATE_ATTACH.budget,
      PL_CREATE_ATTACH.exBudget,
      PL_CREATE_ATTACH.other,
    ].join('|'),
  }));

  expect(errors.plBudgetDocNo).toBe('กรุณากรอกเลขที่งบประมาณ');
  expect(errors.plExBudgetDocNo).toBe('กรุณากรอกเลขที่อนุมัตินอกงบ');
  expect(errors.plAttachOtherDetail).toBe('กรุณากรอกรายละเอียดอื่นๆ');

  const valid = validateRequestForm(plForm({
    plAttachDocs: [
      PL_CREATE_ATTACH.budget,
      PL_CREATE_ATTACH.exBudget,
      PL_CREATE_ATTACH.other,
    ].join('|'),
    plBudgetDocNo: 'BG-001',
    plExBudgetDocNo: 'EX-001',
    plAttachOtherDetail: 'เอกสารเพิ่มเติม',
  }));

  expect(valid.plBudgetDocNo).toBeUndefined();
  expect(valid.plExBudgetDocNo).toBeUndefined();
  expect(valid.plAttachOtherDetail).toBeUndefined();
});
