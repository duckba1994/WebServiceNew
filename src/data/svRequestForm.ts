import { SvRequestLineInput, SvRequestPayload } from '../api/svRequest';
import {
  OTHER_ATTACHMENT,
  RequestFormState,
  SV_EXTERNAL,
  SV_INTERNAL,
  checkedValues,
} from './requestForm';

const CUSTOMER_DOCUMENT = 'เอกสารจากลูกค้า';
const PICTURE = 'รูปถ่าย';

export const toSvRequestLines = (f: RequestFormState): SvRequestLineInput[] =>
  f.lineItems
    .filter((line) => line.name.trim() !== '')
    .map((line, index) => ({
      no: index + 1,
      details: line.name.trim(),
      carId: line.carId.trim() || null,
      requestDate: line.requestDate || null,
    }));

export function toSvRequestPayload(f: RequestFormState, requestBy: string): SvRequestPayload {
  const values = f.values;
  const attachments = checkedValues(values.attachedDocs);
  const internal = values.customerType === SV_INTERNAL;

  return {
    section: values.section ?? '',
    requestBy,
    external: values.customerType === SV_EXTERNAL,
    internal,
    internalDepartid: internal ? values.customerDept || null : null,
    requestType: values.topic ?? '',
    other: values.topic === 'อื่นๆ' ? values.other?.trim() || null : null,
    attachCustomerDocument: attachments.includes(CUSTOMER_DOCUMENT),
    attachPicture: attachments.includes(PICTURE),
    attachOther: attachments.includes(OTHER_ATTACHMENT),
    attachOtherDetail: attachments.includes(OTHER_ATTACHMENT)
      ? values.attachedOther?.trim() || null
      : null,
    remark: null,
    lines: toSvRequestLines(f),
  };
}
