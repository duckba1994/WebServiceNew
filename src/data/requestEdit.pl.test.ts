import { PlRequestDetail } from '../api/plRequest';
import { RequestListItem } from '../types/requestList';
import {
  hasFormChanges,
  toEditForm,
  toPlUpdatePayload,
  validateEditForm,
} from './requestEdit';

const item = {
  module: 'PL',
  docNo: 'PL-001',
  requestBy: 'สมชาย',
  detail: 'รายละเอียดเดิม',
  remark: 'เหตุผลเดิม',
  type: 'จัดซื้อ',
  requestType: 'ขอซื้อสินค้า',
  planDate: '2026-09-30T00:00:00',
} as RequestListItem;

const doc = {
  docNo: 'PL-001',
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
} as PlRequestDetail;

const editForm = () => toEditForm(item, [], null, null, null, null, null, doc);

test('PL edit loads checklist values with direct budget and ex-budget field names', () => {
  const form = editForm();

  expect(form.plAttach).toMatchObject({
    attachBudget: true,
    attachExBudget: false,
    attachSpec: true,
    attachQuatation: true,
    attachPicture: true,
    attachCustDocConfirm: false,
    attachOther: true,
  });
  expect(form.plAttachDocs).toEqual({
    budgetDocNo: 'BG-001',
    exBudgetDocNo: '',
    attachOtherDetail: 'เอกสารเพิ่มเติม',
  });
});

test('PL edit maps checklist changes back to the main PUT payload', () => {
  const form = editForm();
  form.plAttach = { ...form.plAttach!, attachBudget: false, attachExBudget: true };
  form.plAttachDocs = { ...form.plAttachDocs!, exBudgetDocNo: ' EX-001 ' };

  expect(toPlUpdatePayload(item, form, doc)).toMatchObject({
    attachBudget: false,
    budgetDocNo: null,
    attachExBudget: true,
    exBudgetDocNo: 'EX-001',
    attachSpec: true,
    attachQuatation: true,
    attachPicture: true,
    attachCustDocConfirm: false,
    attachOther: true,
    attachOtherDetail: 'เอกสารเพิ่มเติม',
  });
  expect(hasFormChanges(editForm(), form)).toBe(true);
});

test('PL edit requires document number and other detail only for selected rows', () => {
  const form = editForm();
  form.plAttach = { ...form.plAttach!, attachBudget: true, attachExBudget: true, attachOther: true };
  form.plAttachDocs = { budgetDocNo: '', exBudgetDocNo: '', attachOtherDetail: '' };

  const errors = validateEditForm('PL', form);
  expect(errors.budgetDocNo).toBe('ระบุเลขที่งบประมาณด้วย');
  expect(errors.exBudgetDocNo).toBe('ระบุเลขที่อนุมัตินอกงบด้วย');
  expect(errors.attachOtherDetail).toBe('ระบุรายละเอียดอื่นๆด้วย');
});
