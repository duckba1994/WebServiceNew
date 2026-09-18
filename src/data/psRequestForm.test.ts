import { PS_ATTACH, RequestFormState, validateRequestForm } from './requestForm';
import { PS_QUOTE_ROWS } from '../components/ui/PsQuoteAttachmentTable';
import { fromPsAttachment, toPsAttachment, toPsRequestPayload, toPsUpdate } from './psRequestForm';
import { PsRequestDetail } from '../api/psRequest';

const detailFixture = (): PsRequestDetail => ({
  docNo: 'PS-01', canEdit: true, canEditAttachment: true,
  form: { ...toPsRequestPayload(psForm({}), 'original'), prelimId: 'EST-01', attachment: toPsAttachment('{}') },
  lines: [{ recNo: '0001', item: 'อะไหล่', qty: 2, unit: 'ชิ้น' }],
});

test('saved attachment round-trips all 14 rows without applying selection defaults', () => {
  const a = toPsAttachment(JSON.stringify({ '1': { selected: true, documents: { estimate: false, other: true } }, '8': { selected: true, province: 'สงขลา', district: 'หาดใหญ่' }, '10': { selected: true, serviceCenter: 'ศูนย์', province: 'กรุงเทพ' } }));
  expect(toPsAttachment(fromPsAttachment(a))).toEqual(a);
});
test('PS edit preserves original requester, recNo, unchanged snapshot and hidden header flags', () => {
  const original = detailFixture();
  const payload = toPsUpdate({ ...original, form: { ...original.form, requestBy: 'not-current-user', requestDetail: 'แก้ไข' } }, original);
  expect(payload.requestBy).toBe('original');
  expect(payload.lines?.[0].recNo).toBe('0001');
  expect(payload).not.toHaveProperty('prelimId');
  expect(payload).not.toHaveProperty('departid');
  expect(payload).not.toHaveProperty('attachBudget');
  expect(payload.budgetDocNo).toBe('');
});
test('PS attachment-only edit omits general fields and lines; changed prelim clears explicitly', () => {
  const original = detailFixture();
  expect(toPsUpdate(original, { ...original, canEdit: false })).not.toHaveProperty('lines');
  expect(toPsUpdate(original, { ...original, canEditAttachment: false })).not.toHaveProperty('attachment');
  expect(toPsUpdate({ ...original, form: { ...original.form, prelimId: '' } }, original).prelimId).toBe('');
  expect(toPsUpdate(original, { ...original, canEdit: false, canEditAttachment: false })).toEqual({ requestBy: 'original' });
});

const psForm = (values: Record<string, string>): RequestFormState => ({
  departid: '15',
  departmentShort: 'PS',
  departmentName: 'อะไหล่และบริการ',
  category: '',
  subject: '',
  priority: 'normal',
  dueDate: '',
  detail: '',
  values: {
    reporterDept: 'IT',
    reporterName: 'สมชาย',
    requestType: 'อะไหล่',
    topic: 'ขอราคาอะไหล่',
    priceDate: '2026-09-15',
    dueDate: '2026-09-20',
    topicDetail: 'ขอราคาอะไหล่สำหรับงานซ่อม',
    ...values,
  },
  images: [],
  lineItems: [],
});

test('PS บังคับเลขที่รายละเอียด/Spec เมื่อเลือกเอกสารนี้', () => {
  const errors = validateRequestForm(psForm({ psAttachDocs: PS_ATTACH.spec }));

  expect(errors.psSpecNo).toBe('กรุณากรอกเลขที่รายละเอียด/Spec');
  expect(errors.psQuotationNo).toBeUndefined();
});

test('PS บังคับเลขที่ Quotation เมื่อเลือกเอกสารเปรียบเทียบราคา', () => {
  const errors = validateRequestForm(psForm({ psAttachDocs: PS_ATTACH.quotation }));

  expect(errors.psSpecNo).toBeUndefined();
  expect(errors.psQuotationNo).toBe('กรุณากรอกเลขที่ Quotation');
});

test('PS ผ่าน validation ของเอกสารเมื่อกรอกเลขที่ของรายการที่เลือกครบ', () => {
  const errors = validateRequestForm(
    psForm({
      psAttachDocs: `${PS_ATTACH.spec}|${PS_ATTACH.quotation}`,
      psSpecNo: 'SPEC-001',
      psQuotationNo: 'QT-001',
    })
  );

  expect(errors.psSpecNo).toBeUndefined();
  expect(errors.psQuotationNo).toBeUndefined();
});

test('ตารางเอกสารแนบการขอราคาแสดงรายการคงที่ครบ 14 หัวข้อ', () => {
  expect(PS_QUOTE_ROWS.map((row) => row.code)).toEqual([
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '9.1', '9.2', '9.3', '9.4', '10',
  ]);
  expect(PS_QUOTE_ROWS.find((row) => row.code === '8')?.location).toBe('provinceDistrict');
  expect(PS_QUOTE_ROWS.find((row) => row.code === '9')?.location).toBe('provinceDistrict');
  expect(PS_QUOTE_ROWS.find((row) => row.code === '10')?.location).toBe('serviceCenter');
});

test('default เอกสารของลำดับ 6–10 ตรงตามแบบฟอร์ม PS', () => {
  const defaults = Object.fromEntries(
    PS_QUOTE_ROWS.slice(5).map((row) => [row.code, row.defaultDocuments ?? []])
  );

  expect(defaults).toEqual({
    '6': ['estimate', 'samplePart', 'oldPart'],
    '7': ['estimate'],
    '8': ['estimate'],
    '9': ['estimate'],
    '9.1': ['partBook', 'photo'],
    '9.2': ['partBook', 'photo'],
    '9.3': ['partBook', 'photo'],
    '9.4': ['partBook', 'photo'],
    '10': ['estimate'],
  });
  expect(PS_QUOTE_ROWS.find((row) => row.code === '7')?.estimateOnly).toBe(true);
});

test('PS create maps form dates, names and the special row 1 API spelling', () => {
  const payload = toPsRequestPayload(psForm({
    psAttachDocs: `${PS_ATTACH.spec}|${PS_ATTACH.quotation}`,
    psSpecNo: 'SPEC-001', psQuotationNo: 'QT-001',
    planPriceDate: '2026-09-18', estimateNo: 'SBF26-001',
    psQuoteAttachments: JSON.stringify({
      '1': { selected: true, documents: { estimate: true, partBook: true, photo: true } },
    }),
  }), 'สมชาย');
  expect(payload).toMatchObject({
    requestBy: 'สมชาย', type: 'อะไหล่', requestType: 'ขอราคาอะไหล่',
    planDate: '2026-09-20T00:00:00', priceDate: '2026-09-15T00:00:00',
    planPrice: '2026-09-18T00:00:00', prelimId: 'SBF26-001',
    attachSpec: true, attachQuatation: true,
    budgetDocNo: 'SPEC-001', exBudgetDocNo: 'QT-001',
    attachment: { chkPartTrue: true, partTrue_Prelim: true, partTrue1_PartBook: true, partTrue1_Pic: true },
    lines: [],
  });
  expect(payload.attachment.partTrue1_Prelim).toBeUndefined();
  expect(payload).not.toHaveProperty('psSpecNo');
  expect(payload).not.toHaveProperty('psQuotationNo');
});

test('PS omits document numbers when their checkboxes are off and trims selected numbers', () => {
  const off = toPsRequestPayload(psForm({ psSpecNo: 'old-spec', psQuotationNo: 'old-qt' }), 'สมชาย');
  expect(off.budgetDocNo).toBeUndefined();
  expect(off.exBudgetDocNo).toBeUndefined();
  const on = toPsRequestPayload(psForm({
    psAttachDocs: `${PS_ATTACH.spec}|${PS_ATTACH.quotation}`,
    psSpecNo: ' SPEC-001 ', psQuotationNo: ' QT-001 ',
  }), 'สมชาย');
  expect(on.budgetDocNo).toBe('SPEC-001');
  expect(on.exBudgetDocNo).toBe('QT-001');
  expect(on).not.toHaveProperty('attachBudget');
  expect(on).not.toHaveProperty('attachExBudget');
});

test('PS document numbers accept 50 characters but reject 51 when selected', () => {
  const values = {
    psAttachDocs: `${PS_ATTACH.spec}|${PS_ATTACH.quotation}`,
    psSpecNo: 'S'.repeat(50), psQuotationNo: 'Q'.repeat(50),
  };
  expect(validateRequestForm(psForm(values)).psSpecNo).toBeUndefined();
  expect(validateRequestForm(psForm(values)).psQuotationNo).toBeUndefined();
  const errors = validateRequestForm(psForm({
    ...values, psSpecNo: 'S'.repeat(51), psQuotationNo: 'Q'.repeat(51),
  }));
  expect(errors.psSpecNo).toBeDefined();
  expect(errors.psQuotationNo).toBeDefined();
});

test('all 14 PS attachment groups map independently and disabled rows clear stale values', () => {
  const rows = Object.fromEntries(PS_QUOTE_ROWS.map((row) => [row.code, {
    selected: true,
    documents: { estimate: true, partBook: true, photo: true, samplePart: true, oldPart: true, other: true },
    province: 'สงขลา', district: 'หาดใหญ่', serviceCenter: 'ศูนย์ทดสอบ',
  }]));
  const mapped = toPsAttachment(JSON.stringify(rows));
  expect(Object.keys(mapped).filter((key) => key.startsWith('chk'))).toHaveLength(14);
  expect(mapped).toMatchObject({
    chkPartOnSite_True1: true, partOnSite_True1_PartBook: true,
    partOrder_PartEx: true, partRepair_PartOldRepair: true,
    repairValueInCompany_Prelim: true,
    repairValueOutCompany_City: 'สงขลา', repairValueOutCompany_Area: 'หาดใหญ่',
    serviceCenter_Name: 'ศูนย์ทดสอบ', serviceCenter_City: 'สงขลา',
  });
  expect(mapped.repairValueInCompany_PartBook).toBeUndefined();
  rows['8'].selected = false;
  rows['9'].selected = false;
  const cleared = toPsAttachment(JSON.stringify(rows));
  expect(cleared.repairValueOutCompany_Prelim).toBe(false);
  expect(cleared.repairValueOutCompany_City).toBe('');
  expect(cleared.partOnSite_Area).toBe('');
  expect(cleared.chkPartOnSite_True1).toBe(true);
});

test('PS rejects detail above 500 characters and malformed table state', () => {
  expect(validateRequestForm(psForm({ topicDetail: 'ก'.repeat(501) })).topicDetail).toBeDefined();
  expect(() => toPsAttachment('broken JSON')).toThrow();
  expect(() => toPsAttachment('[]')).toThrow();
});
