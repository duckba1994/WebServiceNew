import { PsRequestDetail, PsRequestPayload, PsRequestUpdate } from '../api/psRequest';
import { checkedValues, PS_ATTACH, RequestFormState } from './requestForm';

interface QuoteRow {
  selected?: boolean;
  documents?: Record<string, boolean>;
  province?: string;
  district?: string;
  serviceCenter?: string;
}

// Names and underscore casing must match PSAttachmentInput exactly.
const GROUPS = [
  { code: '1', check: 'chkPartTrue', prefix: 'partTrue1', prelim: 'partTrue_Prelim' },
  { code: '2', check: 'chkPartTrue2', prefix: 'partTrue2' },
  { code: '3', check: 'chkPartCompare1', prefix: 'partCompare1' },
  { code: '4', check: 'chkPartCompare2', prefix: 'partCompare2' },
  { code: '5', check: 'chkPartOrder', prefix: 'partOrder' },
  { code: '6', check: 'chkPartRepair', prefix: 'partRepair' },
  { code: '7', check: 'chkRepairValueInCompany', prefix: 'repairValueInCompany', kind: 'estimateOnly' },
  { code: '8', check: 'chkRepairValueOutCompany', prefix: 'repairValueOutCompany', kind: 'location' },
  { code: '9', check: 'chkPartOnSite', prefix: 'partOnSite', kind: 'location' },
  { code: '9.1', check: 'chkPartOnSite_True1', prefix: 'partOnSite_True1' },
  { code: '9.2', check: 'chkPartOnSite_True2', prefix: 'partOnSite_True2' },
  { code: '9.3', check: 'chkPartOnSite_Compare1', prefix: 'partOnSite_Compare1' },
  { code: '9.4', check: 'chkPartOnSite_Compare2', prefix: 'partOnSite_Compare2' },
  { code: '10', check: 'chkServiceCenter', prefix: 'serviceCenter', kind: 'center' },
];

const DOCUMENTS = [
  ['partBook', 'PartBook'], ['photo', 'Pic'], ['samplePart', 'PartEx'],
  ['oldPart', 'PartOldRepair'], ['other', 'Other'],
];

export const toPsAttachment = (value?: string): PsRequestPayload['attachment'] => {
  const rows: Record<string, QuoteRow> = value ? JSON.parse(value) : {};
  if (!rows || typeof rows !== 'object' || Array.isArray(rows))
    throw new Error('ข้อมูลตารางเอกสารแนบการขอราคาไม่ถูกต้อง');
  const result: PsRequestPayload['attachment'] = {};
  for (const group of GROUPS) {
    const row = rows[group.code] ?? {};
    const selected = row.selected === true;
    result[group.check] = selected;
    result[group.prelim ?? `${group.prefix}_Prelim`] = selected && row.documents?.estimate === true;
    if (!group.kind) {
      for (const [key, suffix] of DOCUMENTS)
        result[`${group.prefix}_${suffix}`] = selected && row.documents?.[key] === true;
    }
    if (group.kind === 'location' || group.kind === 'center') {
      // Provisional legacy mapping: City = province, Area = district.
      // Keep this isolated so backend confirmation can change it in one place.
      result[`${group.prefix}_City`] = selected ? (row.province ?? '').trim() : '';
      if (group.kind === 'location')
        result[`${group.prefix}_Area`] = selected ? (row.district ?? '').trim() : '';
      else
        result[`${group.prefix}_Name`] = selected ? (row.serviceCenter ?? '').trim() : '';
    }
  }
  return result;
};

const apiDate = (date: string) => `${date}T00:00:00`;

export const fromPsAttachment = (attachment: PsRequestPayload['attachment'] = {}): string => {
  const rows: Record<string, QuoteRow> = {};
  for (const group of GROUPS) {
    const documents: Record<string, boolean> = {
      estimate: attachment[group.prelim ?? `${group.prefix}_Prelim`] === true,
    };
    if (!group.kind) for (const [key, suffix] of DOCUMENTS)
      documents[key] = attachment[`${group.prefix}_${suffix}`] === true;
    rows[group.code] = {
      selected: attachment[group.check] === true, documents,
      province: String(attachment[`${group.prefix}_City`] ?? ''),
      district: String(attachment[`${group.prefix}_Area`] ?? ''),
      serviceCenter: String(attachment[`${group.prefix}_Name`] ?? ''),
    };
  }
  return JSON.stringify(rows);
};

// Omit fields outside the editor: PUT preserves them, including legacy flags.
export const toPsUpdate = (draft: PsRequestDetail, original: PsRequestDetail): PsRequestUpdate => {
  const result: PsRequestUpdate = { requestBy: original.form.requestBy ?? '' };
  if (original.canEdit === true) {
    const f = draft.form;
    Object.assign(result, {
      type: f.type, requestType: f.requestType, requestDetail: f.requestDetail.trim(),
      planDate: f.planDate, priceDate: f.priceDate,
      lines: draft.lines.map(({ recNo, item, qty, unit, remark }) => ({
        ...(recNo ? { recNo } : {}), item: item.trim(), qty: Number(qty),
        unit: unit ?? '', remark: remark ?? '',
      })),
    });
    if (f.planPrice !== original.form.planPrice) result.planPrice = f.planPrice;
    if (f.prelimId !== original.form.prelimId) result.prelimId = f.prelimId ?? '';
    if (f.rpDetailId !== original.form.rpDetailId) result.rpDetailId = f.rpDetailId;
  }
  if (original.canEditAttachment === true) Object.assign(result, {
    attachSpec: draft.form.attachSpec, attachQuatation: draft.form.attachQuatation,
    budgetDocNo: draft.form.attachSpec ? (draft.form.budgetDocNo ?? '').trim() : '',
    exBudgetDocNo: draft.form.attachQuatation ? (draft.form.exBudgetDocNo ?? '').trim() : '',
    attachment: { ...original.form.attachment, ...draft.form.attachment },
  });
  return result;
};

export const toPsRequestPayload = (form: RequestFormState, requestBy: string): PsRequestPayload => {
  const values = form.values;
  const picked = checkedValues(values.psAttachDocs);
  return {
    requestBy,
    ...(values.rpDetailId !== undefined ? { rpDetailId: values.rpDetailId } : {}),
    type: values.requestType ?? '',
    requestType: values.topic ?? '',
    requestDetail: (values.topicDetail ?? '').trim(),
    planDate: apiDate(values.dueDate ?? ''),
    priceDate: apiDate(values.priceDate ?? ''),
    planPrice: values.planPriceDate ? apiDate(values.planPriceDate) : undefined,
    prelimId: values.estimateNo || undefined,
    attachSpec: picked.includes(PS_ATTACH.spec),
    attachQuatation: picked.includes(PS_ATTACH.quotation),
    // Backend-confirmed PS mapping: the legacy budget columns store these
    // document numbers. Checkbox flags remain attachSpec / attachQuatation;
    // do not turn on attachBudget / attachExBudget just because of column names.
    budgetDocNo: picked.includes(PS_ATTACH.spec) ? (values.psSpecNo ?? '').trim() : undefined,
    exBudgetDocNo: picked.includes(PS_ATTACH.quotation) ? (values.psQuotationNo ?? '').trim() : undefined,
    attachment: toPsAttachment(values.psQuoteAttachments),
    lines: form.lineItems.filter((line) => line.name.trim()).map((line) => ({
      item: line.name.trim(),
      qty: Number(line.qty) || 0,
      unit: line.unit.trim() || undefined,
      remark: line.note.trim() || undefined,
    })),
  };
};
