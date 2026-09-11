import { PS_ATTACH, RequestFormState, validateRequestForm } from './requestForm';
import { PS_QUOTE_ROWS } from '../components/ui/PsQuoteAttachmentTable';

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
