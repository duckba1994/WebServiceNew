import React from 'react';
import logo from '../../assets/BCLogo.png';
import { BCPrintApproval, BCPrintFields, BCPrintForm } from '../../types/bcPrintForm';
import './BCWorkOrderPrint.css';

const raw = (data: BCPrintFields | null, ...keys: string[]): unknown => {
  for (const key of keys) {
    const value = data?.[key];
    if (value !== null && value !== undefined && value !== '') return value;
  }
  return null;
};
const txt = (data: BCPrintFields | null, ...keys: string[]): string => {
  const value = raw(data, ...keys);
  return value === null ? '' : String(value);
};
const yes = (data: BCPrintFields | null, ...keys: string[]): boolean => raw(data, ...keys) === true;
const date = (value: unknown, withTime = false, withSeconds = false): string => {
  if (typeof value !== 'string') return '';
  const parts = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (!parts) return value;
  const day = `${parts[3]}/${parts[2]}/${parts[1]}`;
  return withTime && parts[4] ? `${day} ${parts[4]}:${parts[5]}${withSeconds && parts[6] ? `:${parts[6]}` : ''}` : day;
};
const d = (data: BCPrintFields | null, key: string, withTime = false, withSeconds = false): string => date(raw(data, key), withTime, withSeconds);
const approval = (rows: BCPrintApproval[], step: number): BCPrintApproval | undefined => rows.find((row) => row.step === step);

function Check({ checked, children }: { checked: boolean; children: React.ReactNode }) {
  return <span className="bc-form-check"><i>{checked ? '✓' : ''}</i>{children}</span>;
}
function Dotted({ children }: { children?: React.ReactNode }) {
  return <span className="bc-form-dotted">{children}</span>;
}
function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  return <span className="bc-form-field">{label} <Dotted>{value}</Dotted></span>;
}
function Sign({ label, name, dateText }: { label: string; name?: string; dateText?: string }) {
  return <div className="bc-form-sign"><Field label="ลงชื่อ" value={name} /><span>{label}</span><Field label="วันที่" value={dateText} /></div>;
}
function Head({ form, title, subtitle, assetType }: { form: BCPrintForm; title: string; subtitle?: string; assetType?: string }) {
  const h = form.header;
  return <header className="bc-form-head">
    <div className="bc-form-logo"><img src={logo} alt="Big Crane" /></div>
    <div className="bc-form-head-title"><strong>บริษัท บิ๊กเครน แอนด์ อิควิปเม้นต์ เร้นทัลส์ จำกัด</strong><span>{title}</span>{subtitle && <small>{subtitle}</small>}</div>
    <div className={`bc-form-head-meta${assetType !== undefined ? ' bc-form-head-meta-asset' : ''}`}>
      <div className="bc-form-head-meta-details"><div>เลขที่ใบรับเรื่อง : <b>{form.docNo}</b></div><div>วันที่ : {d(h, 'docDate', true, form.module === 'IM')}</div></div>
      {assetType !== undefined && <div className="bc-form-head-asset-types"><Check checked={assetType.includes('ทรัพย์สิน')}>ทรัพย์สิน</Check><Check checked={assetType.includes('ค่าใช้จ่าย')}>ค่าใช้จ่าย</Check></div>}
    </div>
  </header>;
}
function Section({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return <section className={`bc-form-section ${className}`}><h2>{title}</h2>{children}</section>;
}
function LineTable({ form, minRows = 1, tall = false }: { form: BCPrintForm; minRows?: number; tall?: boolean }) {
  const rows = [...form.lines, ...Array.from({ length: Math.max(0, minRows - form.lines.length) }, () => null)];
  return <table className={`bc-form-lines${tall ? ' bc-form-lines-tall' : ''}`}><thead><tr><th>ลำดับ</th><th>รายการ</th><th>จำนวน</th><th>หน่วย</th><th>เหตุผลการขอ</th></tr></thead><tbody>
    {rows.map((line, index) => <tr key={txt(line, 'recNo') || `blank-${index}`}><td>{index + 1}</td><td>{txt(line, 'item')}</td><td>{txt(line, 'qty')}</td><td>{txt(line, 'unit')}</td><td>{txt(line, 'remark')}</td></tr>)}
  </tbody></table>;
}
function Footer({ code, revision }: { code: string; revision: string }) {
  return <footer className="bc-form-footer"><span>{code}</span><span>{revision}</span></footer>;
}

const ASSET_TYPES = ['จัดหาทรัพย์สิน', 'ขอซื้อทรัพย์สิน', 'แจ้งซ่อมทรัพย์สิน', 'ขอซื้ออุปกรณ์ สนง.', 'ขายทรัพย์สิน', 'ขายซาก', 'อื่นๆ'];
function AssetChecks({ form }: { form: BCPrintForm }) {
  const h = form.header;
  const selected = txt(h, 'requestType');
  const checks = form.module === 'GA' ? ASSET_TYPES.filter((label) => label !== 'ขายทรัพย์สิน' && label !== 'ขายซาก') : ASSET_TYPES;
  return <div className={`bc-form-check-grid${form.module === 'IM' ? ' bc-form-im-types' : ''}`}>{checks.map((label) => <Check key={label} checked={selected === label}>{label}</Check>)}</div>;
}
function BudgetChecks({ form }: { form: BCPrintForm }) {
  const h = form.header;
  return <div className="bc-form-check-grid bc-form-budget-checks">
    <Check checked={yes(h, 'attach_Spec')}>รายละเอียด/Spec</Check>
    <Check checked={yes(h, 'attach_Budget')}>งบประมาณเลขที่ <Dotted>{txt(h, 'budget_DocNo')}</Dotted></Check>
    <Check checked={yes(h, 'attach_Quatation')}>Quotation เปรียบเทียบราคา</Check>
    <Check checked={yes(h, 'attach_ExBudget')}>ใบขออนุมัติงบประมาณเลขที่ <Dotted>{txt(h, 'exBudget_DocNo')}</Dotted></Check>
  </div>;
}
function AssetForm({ form }: { form: BCPrintForm }) {
  const h = form.header;
  const ga = form.module === 'GA';
  const first = approval(form.approvals, 1);
  const second = approval(form.approvals, 2);
  return <>
    <Head form={form} title="ใบรับเรื่องเกี่ยวกับทรัพย์สินและค่าใช้จ่าย" assetType={ga ? txt(h, 'type') : undefined} />
    {!ga && <div className="bc-form-type-strip"><Check checked={txt(h, 'type').includes('ทรัพย์สิน')}>ทรัพย์สิน</Check><Check checked={txt(h, 'type').includes('ค่าใช้จ่าย')}>ค่าใช้จ่าย</Check></div>}
    <Section title="ส่วนที่ 1.สำหรับผู้ร้องขอ" className="bc-form-asset-request">
      <AssetChecks form={form} />
      <strong>สิ่งที่แนบมาด้วย :</strong><BudgetChecks form={form} />
    </Section>
    <LineTable form={form} minRows={ga ? 5 : 7} tall={ga} />
    <div className="bc-form-asset-people"><Field label="วันที่ต้องการใช้งาน" value={d(h, 'planDate')} />
      <div className="bc-form-sign-grid"><Sign label={`ผู้แจ้ง หน่วยงาน ${form.department ?? form.module}`} name={txt(h, 'requestBy')} dateText={d(h, 'requestDate')} />
        <Sign label="ผจก.ต้นสังกัด" name={first?.approveBy ?? ''} dateText={date(first?.approveDate)} /></div>
    </div>
    <Section title={`ส่วนที่ 2.สำหรับหน่วยงาน ${form.module}`} className={`bc-form-asset-service${ga ? ' bc-form-ga-service' : ''}`}><strong>ดำเนินการ :</strong>
      {ga ? <div className="bc-form-check-grid bc-form-ga-actions">
        <Check checked={txt(h, 'action') === 'ยังไม่ดำเนินการ'}>ยังไม่ดำเนินการ</Check>
        <Check checked={txt(h, 'action') === 'มีอุปกรณ์ในสต๊อก'}>มีอุปกรณ์ในสต๊อก</Check>
        <Check checked={txt(h, 'action') === 'ผู้รับเหมา/ร้านค้า'}>ผู้รับเหมา/ร้านค้า อ้างถึงเลขที่ PR Referent <Dotted>{txt(h, 'refPR')}</Dotted></Check>
        <Check checked={txt(h, 'action') === 'จัดซื้อใหม่'}>จัดซื้อใหม่</Check>
        <Check checked={txt(h, 'action') === 'ซ่อมภายนอก'}>ซ่อมภายนอก</Check>
        <Check checked={txt(h, 'action') === 'อื่นๆ ระบุหมายเหตุ'}>อื่นๆ ระบุหมายเหตุ</Check>
      </div> : <div className="bc-form-check-grid"><Check checked={txt(h, 'action').includes('ยังไม่ดำเนินการ')}>ยังไม่ดำเนินการ</Check><Check checked={txt(h, 'action').includes('สต๊อก')}>มีอุปกรณ์ในสต๊อก</Check><Check checked={txt(h, 'action').includes('จัดซื้อใหม่')}>จัดซื้อใหม่ PR <Dotted>{txt(h, 'refPR')}</Dotted></Check><Check checked={txt(h, 'action').includes('ซ่อม')}>ซ่อมภายนอก</Check><Check checked={txt(h, 'action').includes('อื่น')}>อื่น ๆ</Check></div>}
      <div className="bc-form-sign-grid"><Sign label={ga ? 'ผู้รับแจ้ง เจ้าหน้าที่ GA' : `ผู้รับเรื่อง เจ้าหน้าที่ ${form.module}`} name={txt(h, 'serviceBy')} dateText={d(h, 'serviceDate')} /><Sign label={ga ? 'ผู้ตรวจสอบ GA Sup/IM Mgr.' : `ผู้ตรวจสอบ ${form.module} Mgr.`} name={second?.approveBy ?? ''} dateText={date(second?.approveDate)} /></div>
    </Section>
    {ga ? <section className="bc-form-section bc-form-ga-result">
      <div className="bc-form-ga-result-head"><strong>ผลการดำเนินงาน :</strong><Check checked={txt(h, 'workResults') === 'จัดการเรียบร้อย'}>จัดการเรียบร้อย</Check><Check checked={txt(h, 'workResults') === 'ยังไม่เรียบร้อย'}>ยังไม่เรียบร้อย</Check></div>
      <div className="bc-form-ga-remark"><span>หมายเหตุ</span><div className="bc-form-ga-remark-lines"><span>{txt(h, 'remark')}</span><span /></div></div>
      <div className="bc-form-sign-grid"><Sign label="ผู้แจ้งรับทราบ" /><Sign label="ผู้ตรวจสอบ IM Mgr." /></div>
    </section> : <Section title="ส่วนที่ 3.ผลการดำเนินงาน" className="bc-form-asset-result"><div className="bc-form-check-grid"><Check checked={txt(h, 'workResults').includes('เรียบร้อย') && !txt(h, 'workResults').includes('ยัง')}>จัดการเรียบร้อย</Check><Check checked={txt(h, 'workResults').includes('ยังไม่')}>ยังไม่เรียบร้อย</Check></div><Field label="หมายเหตุ" value={txt(h, 'remark')} /><div className="bc-form-sign-grid"><Sign label="ผู้แจ้งรับทราบ" /><Sign label={`ผู้ตรวจสอบ ${form.module} Mgr.`} /></div></Section>}
    <Footer code={ga ? 'FM-BC/GA-001/01' : 'FM-BC/IM-004/01'} revision={ga ? 'REV.:04 (14/11/62)' : 'REV.:02 (11/11/62)'} />
  </>;
}
function ImSign({ prompt, name, dateText, role, footer }: { prompt: string; name?: string; dateText?: string; role: string; footer?: string }) {
  return <div className="bc-form-im-sign">
    <div className="bc-form-im-sign-row"><Field label={prompt} value={name} /><span>{role}</span></div>
    <Field label="วันที่" value={dateText} />
    {footer && <span className="bc-form-im-sign-footer">{footer}</span>}
  </div>;
}
function ImForm({ form }: { form: BCPrintForm }) {
  const h = form.header;
  const manager = approval(form.approvals, 1);
  const action = txt(h, 'action');
  const result = txt(h, 'workResults');
  return <>
    <Head form={form} title="ใบรับเรื่องเกี่ยวกับทรัพย์สินและค่าใช้จ่าย" assetType={txt(h, 'type')} />
    <Section title="ส่วนที่ 1.สำหรับผู้ร้องขอ" className="bc-form-asset-request bc-form-im-request">
      <AssetChecks form={form} />
      <strong>สิ่งที่แนบมาด้วย :</strong><BudgetChecks form={form} />
    </Section>
    <LineTable form={form} minRows={7} />
    <div className="bc-form-asset-people bc-form-im-people">
      <Field label="วันที่ต้องการใช้งาน" value={d(h, 'planDate')} />
      <div className="bc-form-im-sign-grid">
        <ImSign prompt="ผู้แจ้ง" name={txt(h, 'requestBy')} dateText={d(h, 'requestDate')} role={`ต้นสังกัด หน่วยงาน ${form.department ?? form.module}`} />
        <ImSign prompt="ลงชื่อ" name={manager?.approveBy ?? ''} dateText={date(manager?.approveDate)} role="ผจก.ต้นสังกัด" />
      </div>
    </div>
    <Section title="ส่วนที่ 2.สำหรับหน่วยงาน IM" className="bc-form-im-service">
      <strong>ดำเนินการ :</strong>
      <div className="bc-form-im-actions">
        <Check checked={action === 'มีอุปกรณ์ในสต๊อก'}>มีอุปกรณ์ในสต๊อก</Check>
        <Check checked={action === 'จัดซื้อใหม่'}>จัดซื้อใหม่ PR&nbsp; PR.: <Dotted>{action === 'จัดซื้อใหม่' ? txt(h, 'refPR') : ''}</Dotted> วันที่ <Dotted>{action === 'จัดซื้อใหม่' ? d(h, 'serviceDate') : ''}</Dotted></Check>
        <Check checked={action === 'ส่งซ่อมภายนอก' || action === 'ซ่อมภายนอก'}>ซ่อมภายนอก PR <Dotted>{action.includes('ซ่อม') ? txt(h, 'refPR') : ''}</Dotted> วันที่ <Dotted>{action.includes('ซ่อม') ? d(h, 'serviceDate') : ''}</Dotted></Check>
        <Check checked={action === 'อื่นๆ ระบุหมายเหตุ'}>อื่นๆ <Dotted>{action === 'อื่นๆ ระบุหมายเหตุ' ? txt(h, 'remark') : ''}</Dotted></Check>
      </div>
    </Section>
    <section className="bc-form-section bc-form-im-result">
      <div className="bc-form-im-result-head"><strong>ส่วนที่ 3.ผลการดำเนินงาน :</strong><Check checked={result === 'จัดการเรียบร้อย'}>เสร็จเรียบร้อย</Check><Check checked={result === 'ยังไม่เรียบร้อย'}>ยังไม่เรียบร้อย</Check></div>
      <div className="bc-form-ga-remark"><span>หมายเหตุ</span><div className="bc-form-ga-remark-lines"><span>{txt(h, 'remark')}</span><span /></div></div>
      <div className="bc-form-im-sign-grid">
        <ImSign prompt="ผู้รับทราบ" name={txt(h, 'requestBy')} dateText={d(h, 'requestDate')} role={`ต้นสังกัด หน่วยงาน ${form.department ?? form.module}`} footer="รับทราบ" />
        <ImSign prompt="ผู้ตรวจสอบ" role="IM Mgr." footer="ผู้ตรวจสอบ" />
      </div>
    </section>
    <Footer code="FM-BC/IM-004/01" revision="REV.:02 (11/11/62)" />
  </>;
}
const PS_PARTS = [
  { flag: 'chkPartTrue', prefix: 'PartTrue1', prelim: 'PartTrue_Prelim', label: 'อะไหล่แท้' },
  { flag: 'chkPartTrue2', prefix: 'PartTrue2', prelim: 'PartTrue2_Prelim', label: 'อะไหล่เทียบ' },
  { flag: 'chkPartCompare1', prefix: 'PartCompare1', prelim: 'PartCompare1_Prelim', label: 'เทียบราคา' },
  { flag: 'chkPartCompare2', prefix: 'PartCompare2', prelim: 'PartCompare2_Prelim', label: 'เทียบราคาเพิ่มเติม' },
  { flag: 'chkPartOrder', prefix: 'PartOrder', prelim: 'PartOrder_Prelim', label: 'สั่งซื้อ' },
  { flag: 'chkPartRepair', prefix: 'PartRepair', prelim: 'PartRepair_Prelim', label: 'ซ่อมอะไหล่' },
  { flag: 'chkRepairValueInCompany', prefix: 'RepairValueInCompany', prelim: 'RepairValueInCompany_Prelim', label: 'ซ่อมในบริษัท' },
  { flag: 'chkRepairValueOutCompany', prefix: 'RepairValueOutCompany', prelim: 'RepairValueOutCompany_Prelim', label: 'ซ่อมนอกบริษัท' },
  { flag: 'chkPartOnSite_True1', prefix: 'PartOnSite_True1', prelim: 'PartOnSite_True1_Prelim', label: 'อะไหล่แท้หน้างาน' },
  { flag: 'chkPartOnSite_True2', prefix: 'PartOnSite_True2', prelim: 'PartOnSite_True2_Prelim', label: 'อะไหล่เทียบหน้างาน' },
  { flag: 'chkPartOnSite_Compare1', prefix: 'PartOnSite_Compare1', prelim: 'PartOnSite_Compare1_Prelim', label: 'เทียบราคาหน้างาน' },
  { flag: 'chkPartOnSite_Compare2', prefix: 'PartOnSite_Compare2', prelim: 'PartOnSite_Compare2_Prelim', label: 'เทียบราคาเพิ่มเติมหน้างาน' },
  { flag: 'chkServiceCenter', prefix: 'ServiceCenter', prelim: 'ServiceCenter_Prelim', label: 'ศูนย์บริการ' },
] as const;
function PSForm({ form }: { form: BCPrintForm }) {
  const h = form.header;
  const a = form.attachment;
  const first = approval(form.approvals, 1);
  return <>
    <Head form={form} title="ใบขอราคาเกี่ยวกับลูกค้าภายนอก ลูกค้าภายในและภายในแผนก" />
    <div className="bc-form-type-strip"><Check checked={txt(h, 'type').includes('ภายนอก')}>ลูกค้าภายนอก</Check><Check checked={txt(h, 'type').includes('ภายใน')}>ลูกค้าภายใน</Check><Check checked={txt(h, 'type').includes('แผนก')}>ภายในแผนก</Check></div>
    <Section title="ส่วนที่ 1. สำหรับผู้ร้องขอ" className="bc-form-ps-request">
      <div className="bc-form-check-grid"><Check checked={txt(h, 'requestType').includes('ขอราคา')}>ขอราคา</Check><Check checked={txt(h, 'requestType').includes('งานเคลม')}>งานเคลมสินค้า</Check><Check checked={txt(h, 'requestType').includes('งบประมาณ')}>งบประมาณ</Check><Check checked={Boolean(txt(h, 'requestOther'))}>อื่น ๆ {txt(h, 'requestOther')}</Check></div>
      <strong>สิ่งที่แนบมาด้วย :</strong><div className="bc-form-check-grid"><Check checked={yes(h, 'attach_Spec')}>รายละเอียด/Spec</Check><Check checked={yes(h, 'attach_Quatation')}>Quotation เปรียบเทียบราคา</Check><Check checked={yes(h, 'attach_Picture')}>รูปภาพ</Check><Check checked={yes(h, 'attach_Other')}>อื่น ๆ {txt(h, 'attach_Other_Detail')}</Check></div>
      <strong>ข้อมูลใบประเมิน :</strong><div className="bc-form-field-grid"><Field label="หมายเลขเครื่องจักร" value={txt(h, 'prelim_CarID')} /><Field label="เลขที่ใบประเมิน" value={txt(h, 'prelim_ID')} /><Field label="วันที่ประเมิน" value={d(h, 'prelim_Date')} /><Field label="ประเภทรถ" value={txt(h, 'car_type')} /><Field label="รุ่นเครื่องยนต์" value={txt(h, 'car_model')} /><Field label="รายละเอียดอาการ" value={txt(h, 'requestDetail')} /></div>
    </Section>
    <table className="bc-form-ps-attachments"><thead><tr><th>ลำดับ</th><th>รายการที่ต้องขอราคา</th><th>ใบประเมิน</th><th>Part book</th><th>รูปภาพ</th><th>อะไหล่ตัวอย่าง</th><th>อะไหล่เก่าที่ส่งไปซ่อม</th><th>อื่น ๆ</th></tr></thead><tbody>
      {PS_PARTS.filter(({ flag, prefix, prelim }) => yes(a, flag) || yes(a, prelim) || yes(a, `${prefix}_Pic`)).map(({ flag, prefix, prelim, label }, index) => <tr key={flag}><td>{index + 1}</td><td>{label}</td><td>{yes(a, prelim) ? '✓' : ''}</td><td>{yes(a, `${prefix}_PartBook`) ? '✓' : ''}</td><td>{yes(a, `${prefix}_Pic`) ? '✓' : ''}</td><td>{yes(a, `${prefix}_PartEx`) ? '✓' : ''}</td><td>{yes(a, `${prefix}_PartOldRepair`) ? '✓' : ''}</td><td>{yes(a, `${prefix}_Other`) ? '✓' : ''}</td></tr>)}
    </tbody></table>
    <div className="bc-form-ps-main-lines"><LineTable form={form} minRows={Math.max(1, form.lines.length)} /></div>
    <div className="bc-form-ps-people"><div><Field label="วันที่ต้องการใช้งาน" value={d(h, 'planDate')} /><Field label="วันที่ต้องการราคา" value={d(h, 'priceDate')} /></div><div className="bc-form-sign-grid"><Sign label="ผู้ขอราคา PS" name={txt(h, 'requestBy')} dateText={d(h, 'requestDate')} /><Sign label="ผู้จัดการฝ่าย PS" name={first?.approveBy ?? ''} dateText={date(first?.approveDate)} /></div></div>
    <Section title="ส่วนที่ 2. สำหรับหน่วยงาน PS" className="bc-form-ps-service"><strong>ดำเนินการ :</strong><div className="bc-form-field-grid"><Field label="สถานะ" value={txt(h, 'action')} /><Field label="Reference PR" value={txt(h, 'refPR')} /><Field label="Reference PO" value={txt(h, 'refPO')} /><Field label="Supplier Name" value={txt(h, 'suplier')} /><Field label="Status Report" value={txt(h, 'rp_Status')} /></div><div className="bc-form-sign-grid"><Sign label="ผู้รับเรื่องเจ้าหน้าที่ PS" name={txt(h, 'serviceBy')} dateText={d(h, 'serviceDate')} /><Sign label="ผู้ตรวจสอบ PS Mgr." /></div></Section>
    <Section title="ผลการดำเนินงาน :" className="bc-form-ps-result"><div className="bc-form-check-grid"><Check checked={txt(h, 'workResults').includes('เรียบร้อย') && !txt(h, 'workResults').includes('ยัง')}>จัดการเรียบร้อย</Check><Check checked={txt(h, 'workResults').includes('ยังไม่')}>ยังไม่เรียบร้อย</Check></div><Field label="หมายเหตุ" value={txt(h, 'wrDetail', 'wRDetail', 'remark')} /><div className="bc-form-sign-grid"><Sign label="ผู้แจ้งรับทราบ" /><Sign label="ผู้ตรวจสอบ PS Mgr." /></div></Section>
    <Footer code="(P)FM-BC/PS-001/08" revision="REV.02 (04/12/67)" />
  </>;
}

const AF_OPTIONS = [
  ['chkProduct', 'ขอให้ผลิต'], ['chkSaveAcc', 'ขอวิธีปฏิบัติการในการบันทึกเพื่อบัญชี'],
  ['chkRule', 'ขอข้อกำหนด/กติกา'], ['chkTracking', 'ขอติดตามงาน'],
  ['chkComplain', 'ข้อร้องเรียน'], ['chkDevelop', 'ขอส่งมอบงานพัฒนาและอบรม'],
  ['chkOther', 'อื่น ๆ'],
] as const;
function AFForm({ form }: { form: BCPrintForm }) {
  const h = form.header;
  return <>
    <Head form={form} title="ใบรับเรื่อง AF" />
    <div className="bc-form-short-strip"><Field label="ชื่อผู้เปิดเรื่อง" value={txt(h, 'requestBy')} /><Field label="แผนก" value={form.department ?? ''} /></div>
    <Section title="ส่วนที่ 1.ส่วนเปิดเรื่อง" className="bc-form-af-request"><div className="bc-form-check-grid">{AF_OPTIONS.map(([key, label]) => <Check key={key} checked={yes(h, key)}>{label}{key === 'chkOther' ? ` ${txt(h, 'other')}` : ''}</Check>)}</div></Section>
    <LineTable form={form} minRows={1} tall />
    <div className="bc-form-short-strip"><Field label="วันที่ต้องการใช้งาน" value={d(h, 'plantDate')} /></div>
    <Section title="ส่วนผู้ร้องขอ" className="bc-form-af-signatures"><div className="bc-form-sign-grid bc-form-sign-grid-three"><Sign label="ผู้ร้องขอ" name={txt(h, 'req1')} dateText={d(h, 'reqDate1')} /><Sign label="ผู้จัดการผู้ร้องขอ" name={txt(h, 'mgrReq1')} dateText={d(h, 'mgrReqDate1')} /><Sign label="ผู้บริหารผู้ร้องขอ" /></div></Section>
    <Section title="ส่วน AF รับทราบการร้องขอ" className="bc-form-af-signatures"><div className="bc-form-sign-grid"><Sign label="ผู้จัดการฝ่าย AF" name={txt(h, 'aFMgr1')} dateText={d(h, 'aFMgrDate1')} /><Sign label="ผู้บริหารฝ่าย AF" /></div></Section>
    <Section title="ส่วนที่ 2. ส่วนเปิดเรื่อง" className="bc-form-af-detail"><Field label="รายละเอียดการเปิด" value={txt(h, 'action2')} /><Field label="เอกสารแนบการเปิด" value={txt(h, 'attach2')} /><Field label="วันที่ปิดเรื่อง" value={d(h, 'closeJobDate2')} /><div className="bc-form-sign-grid bc-form-sign-grid-three"><Sign label="ผู้เปิดเรื่องฝ่าย AF" name={txt(h, 'closeAF2')} dateText={d(h, 'closeAFDate2')} /><Sign label="ผู้ตรวจสอบการปิดเรื่อง" name={txt(h, 'closeAFMgr2')} dateText={d(h, 'closeAFMgrDate2')} /><Sign label="ผู้รับรองการปิดเรื่อง" /></div></Section>
    <Section title="ส่วนระบบคุณภาพ" className="bc-form-af-quality"><div className="bc-form-check-grid"><Check checked={yes(h, 'chkQSDAR')}>มี Ref. DAR No. {txt(h, 'qSDAR')}</Check><Check checked={yes(h, 'chkQSNothing')}>ไม่มี</Check><Check checked={yes(h, 'chkQSDoc')}>จัดทำ/แก้ไข WI</Check><Check checked={yes(h, 'chkQSDocFlow')}>จัดทำ/แก้ไข Flow การทำงาน</Check><Check checked={yes(h, 'chkQSManuel')}>จัดทำ/แก้ไข คู่มือการใช้โปรแกรม</Check></div><Field label="คำอธิบายเพิ่มเติม" value={txt(h, 'qSRemark')} /><div className="bc-form-sign-grid"><Sign label="QMR รับทราบ" /><Sign label="ผู้บริหารดูแลด้านคุณภาพ" /></div></Section>
    <Section title="ส่วน IT" className="bc-form-af-it"><div className="bc-form-field-grid"><Field label="ผลกระทบด้านรายงาน No." value={txt(h, 'reportIT')} /><Field label="ผลกระทบด้าน AX No." value={txt(h, 'aXIT')} /></div><div className="bc-form-sign-grid"><Sign label="IT รับทราบ" /><Sign label="IT Mgr." /></div></Section>
    <Footer code="(P)FM-BC/AF-002/13" revision="REV.:01 (12/05/65)" />
  </>;
}

const HR_WELFARE = ['ใบเตือน ปกติ (01)', 'ใบเตือน GPS (05)', 'สวัสดิการช่วยเหลืองานศพ', 'สวัสดิการเยี่ยมไข้', 'สแกนลายนิ้วมือ', 'พนักงานขาดการติดต่อ', 'ER อื่นๆ'];
const HR_PAYROLL = ['ทบทวนการคิดเงินเดือน', 'ติดตามเงินประกัน', 'หักค่าความเสียหาย', 'หนังสือรับรองเงินเดือน', 'หนังสือรับรองการทำงาน', 'ใบลดหนี้', 'PR อื่นๆ'];
function HRForm({ form }: { form: BCPrintForm }) {
  const h = form.header;
  const selected = txt(h, 'requestType');
  const first = approval(form.approvals, 1);
  return <>
    <Head form={form} title="ใบรับเรื่องบุคคล" />
    <div className="bc-form-hr-meta"><Field label="เลขที่" value={form.docNo} /><Field label="วันที่" value={d(h, 'docDate')} /><Field label="ชื่อ - สกุล" value={txt(h, 'requestBy')} /><Field label="ตำแหน่ง" value={txt(h, 'position')} /><Field label="สังกัด" value={form.department ?? ''} /></div>
    <div className="bc-form-hr-categories"><div><strong>ส่วนงาน : สวัสดิการ</strong>{HR_WELFARE.map((label) => <Check key={label} checked={selected === label}>{label}</Check>)}</div><div><strong>ส่วนงาน : Payroll</strong>{HR_PAYROLL.map((label) => <Check key={label} checked={selected === label}>{label}</Check>)}</div></div>
    <Section title="เรื่องที่แจ้ง" className="bc-form-hr-detail"><div>{txt(h, 'requestDetail')}</div></Section>
    <div className="bc-form-sign-grid bc-form-hr-request-sign"><Sign label="ผู้ร้องขอ" name={txt(h, 'requestBy')} dateText={d(h, 'requestDate')} /><Sign label="ผู้บังคับบัญชาต้นสังกัด" name={first?.approveBy ?? ''} dateText={date(first?.approveDate)} /></div>
    <Section title="สำหรับฝ่ายทรัพยากรมนุษย์" className="bc-form-hr-service"><div className="bc-form-sign-grid"><Sign label="ผู้รับเรื่อง" name={txt(h, 'receiptBy')} dateText={d(h, 'receiptDate')} /><Sign label="ผช./ผจก ฝ่ายทรัพยากรมนุษย์" name={txt(h, 'inspectorBy')} dateText={d(h, 'inspectorDate')} /></div><strong>ผลการดำเนินงาน :</strong><Field label="การดำเนินการ" value={txt(h, 'action')} /><div className="bc-form-sign-grid"><Sign label="ผู้ดำเนินการ" name={txt(h, 'serviceBy')} dateText={d(h, 'serviceDate')} /><Sign label="ผู้รับเอกสาร" name={txt(h, 'receiptDocBy')} dateText={d(h, 'receiptDocDate')} /></div></Section>
    <Section title="นโยบาย :" className="bc-form-hr-policy"><p>1. ดำเนินการด้านเอกสาร โดยมีเงื่อนไขดังนี้</p><p>1.1 สแกนลายนิ้วมือ ดำเนินการภายใน 1 วันทำการ</p><p>1.2 สวัสดิการช่วยเหลืองานศพ สวัสดิการเยี่ยมไข้ และ ER อื่นๆ ดำเนินการภายใน 3 วันทำการ</p><p>1.3 ทบทวนการคิดเงินเดือน เงินประกัน หนังสือรับรองเงินเดือน รับรองการทำงาน และ PR อื่นๆ ดำเนินการภายใน 3 วันทำการ</p><p>1.4 ใบเตือน ดำเนินการภายใน 7 วันทำการ</p><p>2. พนักงานต้องรับเอกสารด้วยตนเอง</p><p>3. กรณีไม่มาติดต่อรับเอกสารภายใน 30 วัน ทางฝ่าย HR จะดำเนินการทำลายเอกสารทันที</p></Section>
    <Footer code="FM-BC/HR-005/12" revision="REV.:07 (14/09/63)" />
  </>;
}

function CRForm({ form }: { form: BCPrintForm }) {
  const h = form.header;
  const first = approval(form.approvals, 1);
  return <>
    <Head form={form} title="ใบรับเรื่อง CR" subtitle="3/4-5 ม.9 ถ.บางนา-ตราด กม.18 ต.บางโฉลง อ.บางพลี จ.สมุทรปราการ 10540" />
    <Section title="ส่วนที่ 1: รายละเอียดแจ้งเรื่อง" className="bc-form-cr-request"><div className="bc-form-check-grid"><Check checked={txt(h, 'subDepartid').includes('HV')}>HV</Check><Check checked={txt(h, 'subDepartid').includes('FL')}>FL</Check></div><div className="bc-form-field-grid"><Field label="ชื่อ" value={txt(h, 'requestBy')} /><Field label="ฝ่าย/แผนก" value={form.department ?? ''} /><Field label="วันที่ต้องการ" value={d(h, 'requestDate')} /><Field label="ประเภทที่แจ้ง" value={txt(h, 'requestType')} /><Field label="รายละเอียดที่แจ้ง" value={txt(h, 'requestSubType', 'requestSubOther')} /></div><div className="bc-form-ruled bc-form-cr-detail"><b>รายละเอียด</b> {txt(h, 'requestDetail')}</div><div className="bc-form-sign-grid"><Sign label="ผู้แจ้ง" name={txt(h, 'reqBy', 'requestBy')} dateText={d(h, 'reqDate')} /><Sign label="ผู้อนุมัติ" name={first?.approveBy ?? ''} dateText={date(first?.approveDate)} /></div></Section>
    <Section title="ส่วนที่ 2: สำหรับเจ้าหน้าที่ CR" className="bc-form-cr-service"><div className="bc-form-field-grid"><Field label="ผู้รับเรื่อง" value={txt(h, 'receiveBy')} /><Field label="มอบหมายผู้ดำเนินการ" value={txt(h, 'requestService')} /><Field label="วันที่รับเรื่อง" value={d(h, 'receiveDate')} /><Field label="มาตรฐานการดำเนินการ" value={d(h, 'serviceStdDate')} /></div><div className="bc-form-ruled"><b>การดำเนินการ :</b> {txt(h, 'serviceDetail')}</div><div className="bc-form-sign-grid"><Sign label="ผู้ดำเนินการ" name={txt(h, 'serviceBy')} dateText={d(h, 'serviceDate')} /><Sign label="ผู้ตรวจสอบ" /></div></Section>
    <Section title="ส่วนที่ 3: ข้อเสนอแนะ" className="bc-form-cr-close"><div className="bc-form-check-grid"><Check checked={yes(h, 'actionClose')}>ปิดจบรับแจ้งเรื่อง</Check><Check checked={yes(h, 'actionEdit')}>ผู้แจ้งขอแก้ไขเพิ่มเติม</Check><Check checked={yes(h, 'actionOther')}>อื่น ๆ</Check></div><div className="bc-form-ruled"><b>ข้อเสนอแนะ</b> {txt(h, 'actionDetail')}</div><Sign label="ผู้แจ้ง" name={txt(h, 'closeBy')} dateText={d(h, 'closeDate')} /></Section>
    <Footer code="FM-BC/CR-001/01" revision="Rev.00 (01/09/63)" />
  </>;
}

const SV_REASONS = ['รถเสีย', 'ลูกค้า/ฝ่ายขาย ติดตามงานซ่อม', 'Operator ติดตามงานซ่อม', 'พนักงานขับรถ (พฤติกรรม)', 'ใบเปลี่ยนแปลงใบแจ้งหนี้ (กรณีรถเสีย)', 'อื่นๆ'];
function SVForm({ form }: { form: BCPrintForm }) {
  const h = form.header;
  const title = yes(h, 'typeHV') ? 'ใบรับเรื่องฝ่าย SV-HV' : 'ใบรับเรื่องฝ่าย SV-FL';
  return <>
    <Head form={form} title={title} />
    <Section title="ส่วนที่ 1.สำหรับผู้ร้องขอ" className="bc-form-sv-request"><div className="bc-form-check-grid"><Check checked={yes(h, 's1_Req_chkExternal')}>ลูกค้าภายนอก</Check><Check checked={yes(h, 's1_Req_chkInternal')}>หน่วยงานภายในองค์กรระบุ {form.internalDepartment ?? ''}</Check></div><div className="bc-form-radio-list">{SV_REASONS.map((label) => <span key={label}><i>{txt(h, 's1_Req_Request') === label ? '●' : ''}</i>{label}</span>)}</div><strong>สิ่งที่แนบมาด้วย</strong><div className="bc-form-check-grid"><Check checked={yes(h, 's1_Req_chkAttachDocCust')}>เอกสารจากลูกค้า</Check><Check checked={yes(h, 's1_Req_chkAttachPic')}>รูปถ่าย</Check><Check checked={yes(h, 's1_Req_chkAttachOther')}>อื่น ๆ {txt(h, 's1_Req_AttachOther')}</Check></div></Section>
    <table className="bc-form-sv-lines"><thead><tr><th>ลำดับ</th><th>รายละเอียด</th><th>เบอร์รถ</th><th>วันที่ต้องการใช้งาน</th></tr></thead><tbody>{[...form.lines, ...Array.from({ length: Math.max(0, 4 - form.lines.length) }, () => null)].map((line, index) => <tr key={txt(line, 'recNo') || `blank-${index}`}><td>{txt(line, 's1_ReqLine_NO') || index + 1}</td><td>{txt(line, 's1_ReqLine_Details')}</td><td>{txt(line, 's1_ReqLine_CarId')}</td><td>{d(line, 's1_ReqLine_ReqDate')}</td></tr>)}</tbody></table>
    <div className="bc-form-sign-grid bc-form-sv-request-sign"><Sign label="ผู้แจ้ง/ต้นสังกัด" name={txt(h, 'requestBy')} dateText={d(h, 'requestDate', true)} /><Sign label="ผู้จัดการฝ่ายต้นสังกัด" name={txt(h, 's1_Req_NameMgr')} dateText={d(h, 's1_Req_DateMgr', true)} /></div>
    <Section title={`ส่วนที่ 2.สำหรับหน่วยงาน ${yes(h, 'typeHV') ? 'SV-HV' : 'SV-FL'} ดำเนินการแก้ไข`} className="bc-form-sv-service"><div className="bc-form-ruled"><b>ผลดำเนินการ :</b> {txt(h, 's2_SV_ServiceDetails')}</div><Field label="วันที่กำหนดเสร็จ" value={d(h, 's2_SV_DateComplete')} /><div className="bc-form-sign-grid"><Sign label="เจ้าหน้าที่ SV" name={txt(h, 's2_SV_Name')} dateText={d(h, 's2_SV_Date', true)} /><Sign label="ผู้จัดการฝ่าย SV" name={txt(h, 's2_SV_NameMgr')} dateText={d(h, 's2_SV_DateMgr', true)} /></div></Section>
    <Section title="ส่วนที่ 3.สำหรับหน่วยงานผู้แจ้งเรื่องพิจารณา" className="bc-form-sv-review"><div className="bc-form-check-grid"><Check checked={yes(h, 's3_chkAccept')}>ยอมรับ</Check><Check checked={yes(h, 's3_chkDontAccept')}>ไม่ยอมรับ</Check></div><div className="bc-form-ruled">{txt(h, 's3_DontAcceptDetails')}</div><div className="bc-form-sign-grid"><Sign label="รับทราบ/ต้นสังกัด" name={txt(h, 's3_Name')} dateText={d(h, 's3_Date', true)} /><Sign label="ผู้จัดการฝ่ายต้นสังกัด" name={txt(h, 's3_NameMgr')} dateText={d(h, 's3_DateMgr', true)} /></div></Section>
    <Section title="เงื่อนไข" className="bc-form-sv-terms"><p>1. กรณีแจ้งเรื่องรถเสีย หน่วยงาน SV ประสานงานภายใน 1 ชั่วโมง และแจ้งผลกลับผู้แจ้งเรื่องภายใน 3 ชั่วโมง</p><p>2. กรณีแจ้งเรื่องอื่น ๆ หน่วยงาน SV ประสานงานภายใน 3 วันนับจากวันที่ได้รับใบแจ้งเรื่อง</p></Section>
    <Footer code="(P) FM-BC/SV-018/01" revision="REV.01 (12/04/67)" />
  </>;
}

function SQAForm({ form }: { form: BCPrintForm }) {
  const h = form.header;
  return <>
    <Head form={form} title="ใบรับเรื่อง SQA" subtitle="3/4-5 ม.9 ถ.บางนา-ตราด กม.18 ต.บางโฉลง อ.บางพลี จ.สมุทรปราการ 10540" />
    <Section title="ส่วนที่ 1: รายละเอียดแจ้งเรื่อง" className="bc-form-sqa-request"><div className="bc-form-check-grid"><Check checked={yes(h, 'typeHV')}>HV</Check><Check checked={yes(h, 'typeFL')}>FL</Check></div><div className="bc-form-field-grid"><Field label="ชื่อ" value={txt(h, 'requestBy')} /><Field label="ฝ่าย/แผนก" value={form.department ?? ''} /><Field label="วันที่ต้องการ" value={d(h, 'requestDate')} /><Field label="ประเภทที่แจ้ง" value={txt(h, 'requestType')} /><Field label="รายละเอียดที่แจ้ง" value={txt(h, 'requestDetail')} /></div><div className="bc-form-ruled"><b>รายละเอียด :</b> {txt(h, 'details')}</div><Sign label="ผู้แจ้ง" name={txt(h, 'requestByName', 'requestBy')} dateText={d(h, 'requestByDate')} /></Section>
    <Section title="ส่วนที่ 2: สำหรับเจ้าหน้าที่ SQA" className="bc-form-sqa-receive"><div className="bc-form-ruled"><b>มอบหมายผู้ดำเนินการ :</b> {txt(h, 'requestService')}</div><Sign label="ผู้รับเรื่อง" name={txt(h, 'receiveBy')} dateText={d(h, 'receiveDate')} /></Section>
    <Section title="ส่วนที่ 3: Service" className="bc-form-sqa-service"><Field label="มาตรฐานการดำเนินการ" value={txt(h, 'serviceStd')} /><div className="bc-form-ruled"><b>การดำเนินการ :</b> {txt(h, 'serviceDetail')}</div><Sign label="ผู้ดำเนินการ" name={txt(h, 'serviceBy')} dateText={d(h, 'serviceDate')} /></Section>
    <div className="bc-form-print-stamp">วันที่พิมพ์ {new Date().toLocaleDateString('en-GB')} &nbsp; เวลาที่พิมพ์ {new Date().toLocaleTimeString('th-TH', { hour12: false })}</div>
  </>;
}

export function BCWorkOrderPrint({ form }: { form: BCPrintForm }) {
  return <div className="print-root"><article className={`bc-work-order-print bc-form-${form.module.toLowerCase()}`}>
    {form.module === 'GA' ? <AssetForm form={form} />
      : form.module === 'IM' ? <ImForm form={form} />
      : form.module === 'PS' ? <PSForm form={form} />
      : form.module === 'AF' ? <AFForm form={form} />
      : form.module === 'HRPR' ? <HRForm form={form} />
      : form.module === 'CR' ? <CRForm form={form} />
      : form.module === 'SV' ? <SVForm form={form} />
      : <SQAForm form={form} />}
  </article></div>;
}
