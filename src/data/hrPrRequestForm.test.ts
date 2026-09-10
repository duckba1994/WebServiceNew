import { hrPrDetailRequired, toHrPrRequestPayload } from './hrPrRequestForm';
import { RequestFormState, validateRequestForm } from './requestForm';

const hrForm = (values: Record<string, string>, detail = ''): RequestFormState =>
  ({
    departid: '06',
    departmentShort: 'HR-PR',
    departmentName: 'บุคคล',
    category: '',
    subject: '',
    priority: 'normal',
    dueDate: '',
    detail,
    values,
    images: [],
    lineItems: [],
  } as unknown as RequestFormState);

test('ส่งเฉพาะช่องที่ฟอร์ม HR มีจริง — ไม่มี lines/reference/planDate', () => {
  const form = hrForm(
    { topic: 'ขอสลิปเงินเดือน', position: ' เจ้าหน้าที่ธุรการ ', reporterName: 'สมชาย' },
    ' ขอย้อนหลัง 3 เดือน '
  );

  expect(toHrPrRequestPayload(form, 'สมชาย')).toEqual({
    requestType: 'ขอสลิปเงินเดือน',
    requestDetail: 'ขอย้อนหลัง 3 เดือน',
    position: 'เจ้าหน้าที่ธุรการ',
    requestBy: 'สมชาย',
  });
});

test('ไม่กรอกรายละเอียด = ไม่ส่งช่องนั้นไปเลย (ไม่ใช่ส่งสตริงว่าง)', () => {
  const payload = toHrPrRequestPayload(hrForm({ topic: 'ขอสลิปเงินเดือน', position: 'ธุรการ' }), 'สมชาย');
  expect(payload.requestDetail).toBeUndefined();
});

test('รายละเอียดบังคับเฉพาะ 2 เรื่องที่ API บังคับ', () => {
  expect(hrPrDetailRequired('สแกนลายนิ้วมือ')).toBe(true);
  expect(hrPrDetailRequired('หนังสือรับรองการทำงาน')).toBe(true);
  expect(hrPrDetailRequired('ขอสลิปเงินเดือน')).toBe(false);

  const optional = hrForm({ topic: 'ขอสลิปเงินเดือน', position: 'ธุรการ', reporterName: 'สมชาย' });
  expect(validateRequestForm(optional).detail).toBeUndefined();

  const mandatory = hrForm({ topic: 'สแกนลายนิ้วมือ', position: 'ธุรการ', reporterName: 'สมชาย' });
  expect(validateRequestForm(mandatory).detail).toBe('กรุณากรอกรายละเอียด');
});
