import { toSvRequestPayload } from './svRequestForm';
import { RequestFormState, SV_INTERNAL } from './requestForm';

test('maps the SV section, customer flags, attachments and SV line shape', () => {
  const form = {
    values: {
      reporterName: 'ผู้แจ้ง',
      customerType: SV_INTERNAL,
      customerDept: '05',
      section: 'HV',
      topic: 'รถเสีย',
      attachedDocs: 'เอกสารจากลูกค้า|รูปถ่าย|อื่นๆ',
      attachedOther: 'ใบตรวจเช็กเดิม',
    },
    lineItems: [
      {
        id: '1',
        name: ' ตรวจระบบไฮดรอลิก ',
        qty: '',
        unit: '',
        price: '',
        vendor: '',
        note: '',
        carId: ' HV-001 ',
        requestDate: '2026-09-12',
      },
    ],
  } as unknown as RequestFormState;

  expect(toSvRequestPayload(form, 'ผู้แจ้ง')).toEqual({
    section: 'HV',
    requestBy: 'ผู้แจ้ง',
    external: false,
    internal: true,
    internalDepartid: '05',
    requestType: 'รถเสีย',
    other: null,
    attachCustomerDocument: true,
    attachPicture: true,
    attachOther: true,
    attachOtherDetail: 'ใบตรวจเช็กเดิม',
    remark: null,
    lines: [
      { no: 1, details: 'ตรวจระบบไฮดรอลิก', carId: 'HV-001', requestDate: '2026-09-12' },
    ],
  });
});

test('clears conditional SV values when their choices are not active', () => {
  const form = {
    values: {
      customerType: 'ลูกค้าภายนอก',
      customerDept: '05',
      section: 'FL',
      topic: 'ตรวจเช็ก',
      other: 'ค่าที่ห้ามส่ง',
      attachedDocs: '',
      attachedOther: 'ค่าที่ห้ามส่ง',
    },
    lineItems: [],
  } as unknown as RequestFormState;

  expect(toSvRequestPayload(form, 'ผู้แจ้ง')).toMatchObject({
    external: true,
    internal: false,
    internalDepartid: null,
    other: null,
    attachCustomerDocument: false,
    attachPicture: false,
    attachOther: false,
    attachOtherDetail: null,
  });
});
