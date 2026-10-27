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
const time = (value: unknown): string => typeof value === 'string' ? value.match(/[T\s](\d{2}:\d{2})/)?.[1] ?? '' : '';
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
function PsPrelimField({ label, value }: { label: string; value?: React.ReactNode }) {
  return <span className="bc-form-ps-prelim-field"><span>{label}</span><Dotted>{value}</Dotted></span>;
}
function Sign({ label, name, dateText }: { label: string; name?: string; dateText?: string }) {
  return <div className="bc-form-sign"><Field label="ลงชื่อ" value={name} /><span>{label}</span><Field label="วันที่" value={dateText} /></div>;
}
function CRSign({ label }: { label: string }) {
  return <div className="bc-form-cr-sign">
    <Field label="ลงชื่อ" /><span>{label}</span>
    <Field label="ตำแหน่ง" />
    <Field label="วันที่" />
  </div>;
}
function SQASign({ label, name, dateText, position }: { label: string; name: string; dateText: string; position?: string }) {
  return <div className="bc-form-sqa-signature">
    <div><Field label="ลงชื่อ" value={name} /><span>{label}</span></div>
    {position !== undefined && <Field label="ตำแหน่ง" value={position} />}
    <Field label="วันที่" value={dateText} />
  </div>;
}
function SQARuledField({ label, value, lines, className = '' }: { label: string; value: string; lines: number; className?: string }) {
  return <div className={`bc-form-sqa-ruled-field ${className}`}>
    <span>{label}</span>
    <div className="bc-form-sqa-ruled-lines" style={{ minHeight: `${lines * 4.5}mm` }}>
      <span>{value}</span>
      {Array.from({ length: lines }, (_, index) => <i key={index} aria-hidden="true" style={{ top: `${(index + 1) * 4.5}mm` }} />)}
    </div>
  </div>;
}
function Head({ form, title, subtitle, assetType }: { form: BCPrintForm; title: string; subtitle?: string; assetType?: string }) {
  const h = form.header;
  return <header className={`bc-form-head${form.module === 'AF' ? ' bc-form-head-af' : ''}`}>
    <div className="bc-form-logo"><img src={logo} alt="Big Crane" /></div>
    <div className="bc-form-head-title"><strong>บริษัท บิ๊กเครน แอนด์ อิควิปเม้นต์ เร้นทัลส์ จำกัด</strong><span>{title}</span>{subtitle && <small>{subtitle}</small>}</div>
    <div className={`bc-form-head-meta${assetType !== undefined ? ' bc-form-head-meta-asset' : ''}`}>
      <div className="bc-form-head-meta-details"><div>เลขที่ใบรับเรื่อง : <b>{form.docNo}</b></div>{form.module === 'AF'
        ? <div className="bc-form-af-head-date-time"><Field label="วันที่ :" value={d(h, 'docDate')} /><Field label="เวลา :" value={time(raw(h, 'docDate'))} /></div>
        : <div>วันที่ : {d(h, 'docDate', true, form.module === 'IM')}</div>}</div>
      {assetType !== undefined && <div className="bc-form-head-asset-types"><Check checked={assetType.includes('ทรัพย์สิน')}>ทรัพย์สิน</Check><Check checked={assetType.includes('ค่าใช้จ่าย')}>ค่าใช้จ่าย</Check></div>}
    </div>
  </header>;
}
function DocumentHead({ form, title }: { form: BCPrintForm; title: string }) {
  return <header className={`bc-form-head bc-form-head-${form.module.toLowerCase()}`}>
    <div className="bc-form-logo"><img src={logo} alt="Big Crane" /></div>
    <div className="bc-form-head-title">
      <strong>บริษัท บิ๊กเครน แอนด์ อิควิปเม้นต์ เร้นทัลส์ จำกัด</strong>
      <small>3/4-5 ม.9 ถ.บางนา-ตราด กม.18 ต.บางโฉลง อ.บางพลี จ.สมุทรปราการ 10540</small>
      <span>{title}</span>
    </div>
    <div className="bc-form-document-head-meta">
      <span>เลขที่เอกสาร</span><strong>{form.docNo}</strong>
      <span>วันที่</span><span>เวลา</span>
      <span>{d(form.header, 'docDate')}</span><span>{time(raw(form.header, 'docDate'))}</span>
    </div>
  </header>;
}
function SVHead({ form, title }: { form: BCPrintForm; title: string }) {
  return <header className="bc-form-head bc-form-head-sv">
    <div className="bc-form-logo"><img src={logo} alt="Big Crane" /></div>
    <div className="bc-form-head-title">
      <strong>บริษัท บิ๊กเครน แอนด์ อิควิปเม้นต์ เร้นทัลส์ จำกัด</strong>
      <span>{title}</span>
    </div>
    <div className="bc-form-sv-head-meta">
      <Field label="เลขที่ใบรับเรื่อง :" value={form.docNo} />
      <div><Field label="วันที่" value={d(form.header, 'docDate')} /><Field label="เวลา" value={time(raw(form.header, 'docDate'))} /></div>
    </div>
  </header>;
}
function SVSign({ caption, role, name, signedAt }: { caption: string; role: string; name: string; signedAt: unknown }) {
  return <div className="bc-form-sv-signature">
    <div className="bc-form-sv-sign-name"><Field label={caption} value={name} /><span>{role}</span></div>
    <div className="bc-form-sv-sign-date"><Field label="วันที่" value={date(signedAt)} /><Field label="เวลา" value={time(signedAt)} /></div>
  </div>;
}
function HRSign({ label, name, dateText }: { label: string; name: string; dateText: string }) {
  return <div className="bc-form-hr-signature">
    <div><Field label="ลงชื่อ" value={name} /><span>{label}</span></div>
    <Dotted>{dateText}</Dotted>
  </div>;
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
function AFLineTable({ form }: { form: BCPrintForm }) {
  const rows = form.lines.length ? form.lines : [null];
  return <table className="bc-form-lines bc-form-af-lines"><colgroup><col className="bc-form-af-col-item" /><col className="bc-form-af-col-qty" /><col className="bc-form-af-col-unit" /><col className="bc-form-af-col-reason" /></colgroup><thead><tr><th>รายการ</th><th>จำนวน</th><th>หน่วย</th><th>เหตุผลการขอ</th></tr></thead><tbody>
    {rows.map((line, index) => <tr key={txt(line, 'recNo') || `blank-${index}`}><td>{txt(line, 'item')}</td><td>{txt(line, 'qty')}</td><td>{txt(line, 'unit')}</td><td>{txt(line, 'remark')}</td></tr>)}
  </tbody></table>;
}
function AFClosingSign({ name, dateText, role, dateRole }: { name?: string; dateText?: string; role: string; dateRole?: string }) {
  return <div className="bc-form-af-closing-sign">
    <div><Field label="ลงชื่อ" value={name} /><span>{role}</span></div>
    <div><Field label="วันที่" value={dateText} /><span>{dateRole}</span></div>
  </div>;
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
  { code: '1', check: 'chkPartTrue', prefix: 'partTrue1', prelim: 'partTrue_Prelim', label: 'อะไหล่แท้ มือ1' },
  { code: '2', check: 'chkPartTrue2', prefix: 'partTrue2', label: 'อะไหล่แท้ มือ2' },
  { code: '3', check: 'chkPartCompare1', prefix: 'partCompare1', label: 'อะไหล่เทียบ มือ1' },
  { code: '4', check: 'chkPartCompare2', prefix: 'partCompare2', label: 'อะไหล่เทียบ มือ2' },
  { code: '5', check: 'chkPartOrder', prefix: 'partOrder', label: 'อะไหล่สั่งทำ' },
  { code: '6', check: 'chkPartRepair', prefix: 'partRepair', label: 'อะไหล่ส่งซ่อม' },
  { code: '7', check: 'chkRepairValueInCompany', prefix: 'repairValueInCompany', label: 'ค่าแรงในการซ่อมในบริษัท', kind: 'estimateOnly' },
  { code: '8', check: 'chkRepairValueOutCompany', prefix: 'repairValueOutCompany', label: 'ค่าแรงในการซ่อมนอกสถานที่', kind: 'location' },
  { code: '9', check: 'chkPartOnSite', prefix: 'partOnSite', label: 'อะไหล่ตามหน้างาน (ต่างจังหวัด)', kind: 'location' },
  { code: '9.1', check: 'chkPartOnSite_True1', prefix: 'partOnSite_True1', label: 'อะไหล่แท้ มือ1' },
  { code: '9.2', check: 'chkPartOnSite_True2', prefix: 'partOnSite_True2', label: 'อะไหล่แท้ มือ2' },
  { code: '9.3', check: 'chkPartOnSite_Compare1', prefix: 'partOnSite_Compare1', label: 'อะไหล่เทียบ มือ1' },
  { code: '9.4', check: 'chkPartOnSite_Compare2', prefix: 'partOnSite_Compare2', label: 'อะไหล่เทียบ มือ2' },
  { code: '10', check: 'chkServiceCenter', prefix: 'serviceCenter', label: 'นำเข้าศูนย์บริการ', kind: 'center' },
] as const;
function PsTableCheck({ checked }: { checked: boolean }) {
  return <span className="bc-form-ps-table-check">{checked ? '✓' : ''}</span>;
}
function PsAttachmentRows({ attachment }: { attachment: BCPrintFields | null }) {
  const selectedRows = PS_PARTS.filter((row) => yes(attachment, row.check));
  return <>{selectedRows.map((row) => {
    const prelim = 'prelim' in row ? row.prelim : `${row.prefix}_Prelim`;
    const isLocation = 'kind' in row && row.kind === 'location';
    const isCenter = 'kind' in row && row.kind === 'center';
    const isEstimateOnly = 'kind' in row && row.kind === 'estimateOnly';
    return <tr key={row.code}>
      <td>{row.code}</td><td>{row.label}</td><td><PsTableCheck checked={yes(attachment, prelim)} /></td>
      {isLocation || isCenter || isEstimateOnly ? <td colSpan={5} className="bc-form-ps-table-extra">
        {isLocation && <><Field label="อำเภอ" value={txt(attachment, `${row.prefix}_Area`)} /><Field label="จังหวัด" value={txt(attachment, `${row.prefix}_City`)} /></>}
        {isCenter && <><Field label="ชื่อศูนย์บริการ" value={txt(attachment, `${row.prefix}_Name`)} /><Field label="จังหวัด" value={txt(attachment, `${row.prefix}_City`)} /></>}
      </td> : <>
        <td><PsTableCheck checked={yes(attachment, `${row.prefix}_PartBook`)} /></td>
        <td><PsTableCheck checked={yes(attachment, `${row.prefix}_Pic`)} /></td>
        <td><PsTableCheck checked={yes(attachment, `${row.prefix}_PartEx`)} /></td>
        <td><PsTableCheck checked={yes(attachment, `${row.prefix}_PartOldRepair`)} /></td>
        <td><PsTableCheck checked={yes(attachment, `${row.prefix}_Other`)} /></td>
      </>}
    </tr>;
  })}</>;
}
function PsRequestSign({ name, role, dateText, underlineName = false }: { name?: string; role: string; dateText?: string; underlineName?: boolean }) {
  return <div className="bc-form-ps-request-sign">
    <span className="bc-form-ps-request-sign-line" />
    <span className={underlineName ? 'bc-form-ps-request-sign-name-underline' : undefined}>({name || '....................'})</span>
    <span>{role}</span>
    <span className="bc-form-ps-request-sign-date">วันที่ <Dotted>{dateText}</Dotted></span>
  </div>;
}
function PSForm({ form }: { form: BCPrintForm }) {
  const h = form.header;
  const a = form.attachment;
  const first = approval(form.approvals, 1);
  const workResults = txt(h, 'workResults');
  const refPR = txt(h, 'refPR');
  const refPO = txt(h, 'refPO');
  const otherRemark = txt(h, 'otherRemark');
  return <>
    <Head form={form} title="ใบขอราคาเกี่ยวกับลูกค้าภายนอก ลูกค้าภายในและภายในแผนก" />
    <div className="bc-form-type-strip"><Check checked={txt(h, 'type').includes('ภายนอก')}>ลูกค้าภายนอก</Check><Check checked={txt(h, 'type').includes('ภายใน')}>ลูกค้าภายใน</Check><Check checked={txt(h, 'type').includes('แผนก')}>ภายในแผนก</Check></div>
    <Section title="ส่วนที่ 1. สำหรับผู้ร้องขอ" className="bc-form-ps-request">
      <div className="bc-form-check-grid bc-form-ps-request-types"><Check checked={txt(h, 'requestType').includes('ขอราคา')}>ขอราคา</Check><Check checked={txt(h, 'requestType').includes('งานเคลม')}>งานเคลมสินค้า</Check><Check checked={txt(h, 'requestType').includes('งบประมาณ')}>งบประมาณ</Check><Check checked={txt(h, 'requestType') === 'อื่น ๆ' || Boolean(txt(h, 'requestOther'))}>อื่น ๆ {txt(h, 'requestOther')}</Check></div>
      <strong>สิ่งที่แนบมาด้วย :</strong>
      <div className="bc-form-ps-attachment-rows">
        <div><Check checked={yes(h, 'attach_Spec')}>รายละเอียด/Spec</Check><Field label="เลขที่ใบ Spec" value={txt(h, 'budget_DocNo')} /></div>
        <div><Check checked={yes(h, 'attach_Quatation')}>Quotation เปรียบเทียบราคา</Check><Field label="เลขที่ Quotation" value={txt(h, 'exBudget_DocNo')} /></div>
      </div>
      <strong>ข้อมูลใบประเมิน :</strong>
      <div className="bc-form-ps-prelim">
        <PsPrelimField label="หมายเลขเครื่องจักร" value={txt(h, 'prelim_CarID')} />
        <PsPrelimField label="เลขที่ใบประเมิน" value={txt(h, 'prelim_ID')} />
        <PsPrelimField label="วันที่ประเมิน" value={d(h, 'prelim_Date')} />
        <PsPrelimField label="ประเภทรถ" value={txt(h, 'car_type')} />
        <PsPrelimField label="รุ่นเครื่องยนต์" value={txt(h, 'car_engineno')} />
        <PsPrelimField label="รุ่นรถ" value={txt(h, 'car_model')} />
        <PsPrelimField label="ทะเบียน S/N" value={txt(h, 'car_serial')} />
        <PsPrelimField label="ระบบ" value={txt(h, 'groupName')} />
        <PsPrelimField label="รายละเอียดอาการ" value={txt(h, 'subGroupName')} />
        <PsPrelimField label="รายละเอียดเพิ่มเติม" value={txt(h, 'rE_Comment', 're_Comment')} />
      </div>
    </Section>
    <table className="bc-form-ps-attachments"><colgroup><col className="bc-form-ps-col-no" /><col className="bc-form-ps-col-item" /><col className="bc-form-ps-col-prelim" /><col className="bc-form-ps-col-partbook" /><col className="bc-form-ps-col-picture" /><col className="bc-form-ps-col-example" /><col className="bc-form-ps-col-repair" /><col className="bc-form-ps-col-other" /></colgroup><thead><tr><th rowSpan={2}>ลำดับ</th><th rowSpan={2}>รายการที่ต้องขอราคา</th><th colSpan={6}>เอกสารแนบการขอราคา</th></tr><tr><th>ใบประเมิน</th><th>Part book<br />(รูปอะไหล่+ตำแหน่งที่ใส่)</th><th>รูปภาพ<br />ประกอบ</th><th>อะไหล่<br />ตัวอย่าง</th><th>อะไหล่เก่าเพื่อ<br />เอาไปซ่อม</th><th>อื่นๆ</th></tr></thead><tbody>
      <PsAttachmentRows attachment={a} />
    </tbody></table>
    <div className="bc-form-ps-main-lines"><LineTable form={form} minRows={Math.max(1, form.lines.length)} /></div>
    <div className="bc-form-ps-people">
      <div className="bc-form-ps-people-dates"><Field label="วันที่ต้องการใช้งาน" value={d(h, 'planDate')} /><Field label="วันที่ต้องการราคา" value={d(h, 'priceDate')} /></div>
      <div className="bc-form-ps-people-signatures"><PsRequestSign name={txt(h, 'requestBy')} role="ผู้ขอราคาPS" dateText={d(h, 'requestDate')} underlineName /><PsRequestSign name={first?.approveBy ?? ''} role="ผู้จัดการฝ่ายPS" dateText={date(first?.approveDate)} /></div>
    </div>
    <Section title="ส่วนที่ 2. สำหรับหน่วยงาน PS" className="bc-form-ps-service">
      <strong>ดำเนินการ :</strong>
      <div className="bc-form-ps-service-fields">
        <div className="bc-form-ps-service-column">
          <Check checked={Boolean(workResults)}>{workResults || '\u00a0'}</Check>
          <Check checked={Boolean(refPR)}>Reference PR <Dotted>{refPR}</Dotted></Check>
          <Check checked={Boolean(otherRemark)}>อื่น ๆ ระบุหมายเหตุ <Dotted>{otherRemark}</Dotted></Check>
        </div>
        <div className="bc-form-ps-service-column">
          <Field label="Status Report" value={txt(h, 'rp_Status')} />
          <Check checked={Boolean(refPO)}>Reference PO <Dotted>{refPO}</Dotted></Check>
          <Field label="Supplier Name" value={txt(h, 'suplier')} />
        </div>
      </div>
      <div className="bc-form-sign-grid"><Sign label="ผู้รับเรื่องเจ้าหน้าที่ PS" name={txt(h, 'serviceBy')} dateText={d(h, 'serviceDate')} /><Sign label="ผู้ตรวจสอบ PS Mgr." /></div>
    </Section>
    <section className="bc-form-section bc-form-ps-result">
      <div className="bc-form-ps-result-head"><strong>ผลการดำเนินงาน :</strong><Check checked={workResults.includes('เรียบร้อย') && !workResults.includes('ยัง')}>จัดการเรียบร้อย</Check><Check checked={workResults.includes('ยังไม่')}>ยังไม่เรียบร้อย</Check></div>
      <div className="bc-form-ps-result-remark"><span>หมายเหตุ</span><div>{txt(h, 'wrDetail', 'wRDetail', 'remark')}</div></div>
      <div className="bc-form-sign-grid"><Sign label="ผู้แจ้งรับทราบ" /><Sign label="ผู้ตรวจสอบ PS Mgr." /></div>
    </section>
    <Footer code="(P)FM-BC/PS-001/08" revision="REV.02 (04/12/67)" />
  </>;
}

const AF_OPTIONS = [
  ['chkProduct', 'ขอให้ผลิต'], ['chkSaveAcc', 'ขอวิธีปฏิบัติการในการบันทึกเพื่อบัญชี'],
  ['chkRule', 'ขอข้อกำหนด/กติกา'], ['chkTracking', 'ขอติดตามงาน'],
  ['chkComplain', 'ข้อร้องเรียน'], ['chkDevelop', 'ขอส่งมอบงานพัฒนาและอบรม'],
  ['chkOther', 'อื่นๆ'],
] as const;
function AFForm({ form }: { form: BCPrintForm }) {
  const h = form.header;
  return <>
    <Head form={form} title="ใบรับเรื่อง AF" />
    <div className="bc-form-short-strip bc-form-af-request-meta"><Field label="ชื่อผู้เปิดเรื่อง" value={txt(h, 'requestBy')} /><Field label="แผนก" value={form.department ?? ''} /></div>
    <Section title="ส่วนที่ 1.ส่วนเปิดเรื่อง" className="bc-form-af-request"><div className="bc-form-check-grid">{AF_OPTIONS.map(([key, label]) => <Check key={key} checked={yes(h, key)}>{label}{key === 'chkOther' && <Dotted>{txt(h, 'other')}</Dotted>}</Check>)}</div></Section>
    <AFLineTable form={form} />
    <div className="bc-form-short-strip bc-form-af-plan-date"><Field label="วันที่ต้องการใช้งาน" value={d(h, 'plantDate')} /></div>
    <Section title="ส่วนผู้ร้องขอ" className="bc-form-af-signatures"><div className="bc-form-sign-grid bc-form-sign-grid-three bc-form-af-sign-grid-three"><Sign label="ผู้ร้องขอ" name={txt(h, 'req1')} dateText={d(h, 'reqDate1')} /><Sign label="ผู้จัดการผู้ร้องขอ" name={txt(h, 'mgrReq1')} dateText={d(h, 'mgrReqDate1')} /><Sign label="ผู้บริหารผู้ร้องขอ" /></div></Section>
    <Section title="ส่วน AF รับทราบการร้องขอ" className="bc-form-af-signatures"><div className="bc-form-sign-grid"><Sign label="ผู้จัดการฝ่าย AF" name={txt(h, 'afMgr1')} dateText={d(h, 'afMgrDate1')} /><Sign label="ผู้บริหารฝ่าย AF" /></div></Section>
    <Section title="ส่วนที่ 2. ส่วนเปิดเรื่อง" className="bc-form-af-detail">
      <div className="bc-form-af-ruled-field"><span>รายละเอียดการปิด</span><div>{txt(h, 'action2')}</div></div>
      <div className="bc-form-af-ruled-field"><span>เอกสารแนบการปิด</span><div>{txt(h, 'attach2')}</div></div>
      <div className="bc-form-af-close-date"><Field label="วันที่ปิดเรื่อง" value={d(h, 'closeJobDate2')} /></div>
      <div className="bc-form-af-closing-signatures">
        <AFClosingSign name={txt(h, 'closeAF2')} dateText={d(h, 'closeAFDate2')} role="ผู้เปิดเรื่องฝ่าย AF" />
        <AFClosingSign name={txt(h, 'closeAFMgr2')} dateText={d(h, 'closeAFMgrDate2')} role="ผู้ตรวจสอบการปิดเรื่อง" dateRole="ผู้จัดการฝ่าย AF" />
        <AFClosingSign role="ผู้รับรองการปิดเรื่อง" dateRole="ผู้บริหารฝ่าย AF" />
      </div>
    </Section>
    <Section title="ผู้ร้องขอที่ได้รับงาน" className="bc-form-af-received">
      <div className="bc-form-af-received-signatures">
        <AFClosingSign role="ผู้ตรวจสอบและรับทราบ" dateRole="ผู้จัดการผู้ร้องขอ" />
        <AFClosingSign role="ผู้เห็นชอบการรับงาน" dateRole="ผู้บริหารผู้ร้องขอ" />
      </div>
    </Section>
    <Section title="ส่วนระบบคุณภาพ" className="bc-form-af-quality">
      <div className="bc-form-af-quality-options">
        <strong>ผลกระทบด้านระบบคุณภาพ</strong>
        <Check checked={yes(h, 'chkQSDAR')}><span className="bc-form-af-quality-dar">มี Ref. DAR No. : <Dotted>{txt(h, 'qSDAR')}</Dotted></span></Check>
        <Check checked={yes(h, 'chkQSNothing')}>ไม่มี</Check>
        <strong>ระบบเอกสาร</strong>
        <Check checked={yes(h, 'chkQSDoc')}>จัดทำ/แก้ไข WI</Check>
        <Check checked={yes(h, 'chkQSDocFlow')}>จัดทำ/แก้ไข Flow การทำงาน</Check>
        <Check checked={yes(h, 'chkQSManuel')}>จัดทำ/แก้ไข คู่มือการใช้โปรแกรม</Check>
      </div>
      <div className="bc-form-af-ruled-field bc-form-af-quality-description"><span>คำอธิบายเพิ่มเติม</span><div>{txt(h, 'qSRemark')}</div></div>
      <div className="bc-form-af-quality-signatures">
        <AFClosingSign role="QMR รับทราบ" />
        <AFClosingSign role="รับทราบ" dateRole="ผู้บริหารดูแลด้านคุณภาพ" />
      </div>
    </Section>
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
    <header className="bc-form-head-hr">
      <div className="bc-form-logo"><img src={logo} alt="Big Crane" /></div>
      <div className="bc-form-head-title"><strong>บริษัท บิ๊กเครน แอนด์ อิควิปเม้นต์ เร้นทัลส์ จำกัด</strong><span>ใบรับเรื่องบุคคล</span></div>
    </header>
    <div className="bc-form-hr-document-meta"><Field label="เลขที่" value={form.docNo} /><Field label="วันที่" value={d(h, 'docDate')} /></div>
    <section className="bc-form-hr-employee">
      <h2>สำหรับพนักงาน</h2>
      <div className="bc-form-hr-meta">
        <Field label="ชื่อ - สกุล" value={txt(h, 'requestBy')} />
        <Field label="ตำแหน่ง" value={txt(h, 'position')} />
        <Field label="สังกัด" value={form.department ?? ''} />
      </div>
      <div className="bc-form-hr-categories">
        <div>
          <div className="bc-form-hr-category-heading"><u>ส่วนงาน</u> : สวัสดิการ</div>
          {HR_WELFARE.map((label) => <Check key={label} checked={selected === label || selected === label.replace(/\s+\(\d+\)$/, '')}>{label}{label === 'ER อื่นๆ' && <Dotted />}</Check>)}
        </div>
        <div>
          <div className="bc-form-hr-category-heading"><u>ส่วนงาน</u> : Payroll</div>
          {HR_PAYROLL.map((label) => <Check key={label} checked={selected === label}>{label}{label === 'PR อื่นๆ' && <Dotted />}</Check>)}
        </div>
      </div>
      <Section title="เรื่องที่แจ้ง" className="bc-form-hr-detail"><div>{txt(h, 'requestDetail')}</div></Section>
    </section>
    <div className="bc-form-hr-request-sign">
      <HRSign label="ผู้ร้องขอ" name={txt(h, 'requestBy')} dateText={date(raw(h, 'reqDate', 'requestDate'))} />
      <HRSign label="ผู้บังคับบัญชาต้นสังกัด" name={first?.approveBy ?? ''} dateText={date(first?.approveDate)} />
    </div>
    <Section title="สำหรับฝ่ายทรัพยากรมนุษย์" className="bc-form-hr-service">
      <div className="bc-form-hr-service-signatures">
        <HRSign label="ผู้รับเรื่อง" name={txt(h, 'receiptBy')} dateText={d(h, 'receiptDate')} />
        <HRSign label="ผช./ผจก ฝ่ายทรัพยากรมนุษย์" name={txt(h, 'receipt_InspectorBy')} dateText={d(h, 'receipt_InspectorDate')} />
      </div>
      <h3>ผลการดำเนินงาน :</h3>
      <div className="bc-form-hr-service-signatures">
        <HRSign label="ผู้ดำเนินการ" name={txt(h, 'serviceBy')} dateText={d(h, 'serviceDate')} />
        <HRSign label="ผู้รับเอกสาร" name={txt(h, 'receiptDocBy')} dateText={d(h, 'receiptDocDate')} />
      </div>
    </Section>
    <Section title="นโยบาย :" className="bc-form-hr-policy">
      <p>1. ดำเนินการด้านเอกสาร โดยมีเงื่อนไขดังนี้</p>
      <p className="bc-form-hr-policy-sub">1.1 สแกนลายนิ้วมือ ดำเนินการภายใน 1 วันทำการ</p>
      <p className="bc-form-hr-policy-sub">1.2 สวัสดิการช่วยเหลืองานศพ, สวัสดิการเยี่ยมไข้, ER อื่นๆ ดำเนินการภายใน 3 วันทำการ</p>
      <p className="bc-form-hr-policy-sub">1.3 ทบทวนการคิดเงินเดือน, เงินประกัน, หนังสือรับรองเงินเดือน, รับรองการทำงาน, PR อื่นๆ ดำเนินการภายใน 3 วัน</p>
      <p className="bc-form-hr-policy-sub">1.4 ใบเตือน ดำเนินการภายใน 7 วันทำการ</p>
      <p>2. พนักงานต้องรับเอกสารด้วยตัวเอง</p>
      <p>3. กรณีพนักงานไม่ติดต่อรับเอกสารหรือไม่มีการติดต่อภายใน 30 วัน ทางฝ่าย HR จะดำเนินการทำลายเอกสารทันที</p>
    </Section>
    <Footer code="FM-BC/HR-005/12" revision="REV.:07 (14/09/63)" />
  </>;
}

function CRForm({ form }: { form: BCPrintForm }) {
  const h = form.header;
  const printedAt = new Date();
  return <>
    <DocumentHead form={form} title="ใบรับเรื่อง CR" />
    <section className="bc-form-section bc-form-cr-request">
      <div className="bc-form-cr-request-heading">
        <h2>ส่วนที่ 1: รายละเอียดแจ้งเรื่อง</h2>
        <Check checked={txt(h, 'subDepartid').includes('HV')}>HV</Check>
        <Check checked={txt(h, 'subDepartid').includes('FL')}>FL</Check>
      </div>
      <div className="bc-form-cr-request-meta">
        <div>ชื่อ : <span>{txt(h, 'requestBy')}</span></div>
        <div>ฝ่าย/แผนก : <span>{form.department ?? ''}</span></div>
        <div>วันที่ต้องการ : <span>{d(h, 'requestDate')}</span></div>
      </div>
      <div className="bc-form-cr-request-types">
        <div>ประเภทที่แจ้ง : <span>{txt(h, 'requestType')}</span></div>
        <div>รายละเอียดที่แจ้ง : <span>{txt(h, 'requestSubType', 'requestSubOther')}</span></div>
      </div>
      <div className="bc-form-cr-detail">รายละเอียด : {txt(h, 'requestDetail')}</div>
      <div className="bc-form-cr-signatures">
        <CRSign label="ผู้แจ้ง" />
        <CRSign label="ผู้อนุมัติ" />
      </div>
    </section>
    <Section title="ส่วนที่ 2: สำหรับเจ้าหน้าที่ CR" className="bc-form-cr-service">
      <div className="bc-form-cr-service-meta">
        <div>ผู้รับเรื่อง : <span>{txt(h, 'receiveBy')}</span></div>
        <div>มอบหมายผู้ดำเนินการ : <span>{txt(h, 'requestService')}</span></div>
        <div>วันที่รับเรื่อง : <span>{d(h, 'receiveDate')}</span></div>
        <div>มาตรฐานการดำเนินการ : <span>{d(h, 'serviceStdDate')}</span></div>
      </div>
      <div className="bc-form-cr-service-detail">การดำเนินการ : {txt(h, 'serviceDetail')}</div>
      <div className="bc-form-cr-signatures">
        <CRSign label="ผู้ดำเนินการ" />
        <CRSign label="ผู้ตรวจสอบ" />
      </div>
    </Section>
    <Section title="ส่วนที่ 3: ข้อเสนอแนะ" className="bc-form-cr-close">
      <div className="bc-form-cr-result">
        <span>ผลดำเนินการ</span>
        <Check checked={yes(h, 'actionClose')}>ปิดจบรับแจ้งเรื่อง</Check>
        <Check checked={yes(h, 'actionEdit')}>ผู้แจ้งขอแก้ไขเพิ่มเติม</Check>
        <Check checked={yes(h, 'actionOther')}><span className="bc-form-cr-other">อื่นๆ <Dotted /></span></Check>
      </div>
      <div className="bc-form-cr-suggestion-label">ข้อเสนอแนะ</div>
      <div className="bc-form-cr-suggestion-lines">
        <span>{txt(h, 'actionDetail')}</span>
        <i aria-hidden="true" /><i aria-hidden="true" /><i aria-hidden="true" />
      </div>
      <div className="bc-form-cr-close-signature">
        <CRSign label="ผู้แจ้ง" />
      </div>
    </Section>
    <footer className="bc-form-footer bc-form-cr-footer">
      <span>FM-BC/CR-001/01</span>
      <span className="bc-form-cr-print-stamp">
        <span>วันที่พิมพ์ {printedAt.toLocaleDateString('en-GB')}</span>
        <span>เวลาที่พิมพ์ {printedAt.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
      </span>
      <span>Rev.00 (01/09/63)</span>
    </footer>
  </>;
}

const SV_REASONS = ['รถเสีย', 'ลูกค้า/ฝ่ายขาย ติดตามงานซ่อม', 'Operator ติดตามงานซ่อม', 'พนักงานช่าง (พฤติกรรม)', 'ใบเปลี่ยนแปลงใบแจ้งหนี้ (กรณีรถเสีย)', 'อื่นๆ'];
function SVForm({ form }: { form: BCPrintForm }) {
  const h = form.header;
  const svDepartment = yes(h, 'typeHV') ? 'SV-HV' : 'SV-FL';
  const title = `ใบรับเรื่องฝ่าย ${svDepartment}`;
  return <>
    <SVHead form={form} title={title} />
    <Section title="ส่วนที่ 1.สำหรับผู้ร้องขอ" className="bc-form-sv-request">
      <div className="bc-form-sv-request-types">
        <Check checked={yes(h, 's1_Req_chkExternal')}>ลูกค้าภายนอก</Check>
        <Check checked={yes(h, 's1_Req_chkInternal')}><span className="bc-form-sv-check-value">หน่วยงานภายในองค์กรระบุ <Dotted>{form.internalDepartment ?? ''}</Dotted></span></Check>
      </div>
      <div className="bc-form-radio-list">{SV_REASONS.map((label) => <span key={label}>
        <i>{txt(h, 's1_Req_Request') === label ? '✓' : ''}</i>
        <span className="bc-form-sv-reason-label">{label}{label === 'อื่นๆ' && <Dotted>{txt(h, 's1_Req_Other')}</Dotted>}</span>
      </span>)}</div>
      <div className="bc-form-sv-attachment-label">สิ่งที่แนบมาด้วย</div>
      <div className="bc-form-sv-attachments">
        <Check checked={yes(h, 's1_Req_chkAttachDocCust')}>เอกสารจากลูกค้า</Check>
        <Check checked={yes(h, 's1_Req_chkAttachPic')}>รูปถ่าย</Check>
        <Check checked={yes(h, 's1_Req_chkAttachOther')}><span className="bc-form-sv-check-value">อื่นๆ <Dotted>{txt(h, 's1_Req_AttachOther')}</Dotted></span></Check>
      </div>
    </Section>
    <table className="bc-form-sv-lines"><thead><tr><th>ลำดับ</th><th>รายละเอียด</th><th>เบอร์รถ</th><th>วันที่ต้องการใช้งาน</th></tr></thead><tbody>{[...form.lines, ...Array.from({ length: Math.max(0, 5 - form.lines.length) }, () => null)].map((line, index) => <tr key={txt(line, 'recNo') || `blank-${index}`}><td>{line ? txt(line, 's1_ReqLine_NO') || index + 1 : ''}</td><td>{txt(line, 's1_ReqLine_Details')}</td><td>{txt(line, 's1_ReqLine_CarId')}</td><td>{d(line, 's1_ReqLine_ReqDate')}</td></tr>)}</tbody></table>
    <div className="bc-form-sv-request-sign">
      <SVSign caption="ผู้แจ้ง" role="ต้นสังกัด" name={txt(h, 'requestBy')} signedAt={raw(h, 'requestDate')} />
      <SVSign caption="ลงชื่อ" role="ผู้จัดการฝ่ายต้นสังกัด" name={txt(h, 's1_Req_NameMgr')} signedAt={raw(h, 's1_Req_DateMgr')} />
    </div>
    <Section title={`ส่วนที่ 2.สำหรับหน่วยงาน ${svDepartment} ดำเนินการแก้ไข`} className="bc-form-sv-service">
      <div className="bc-form-sv-service-details">
        <span>ผลดำเนินการ : {txt(h, 's2_SV_ServiceDetails')}</span>
        {Array.from({ length: 5 }, (_, index) => <i key={index} aria-hidden="true" style={{ top: `${(index + 1) * 4.5}mm` }} />)}
      </div>
      <div className="bc-form-sv-complete-date"><Field label="วันที่กำหนดเสร็จ" value={d(h, 's2_SV_DateComplete')} /></div>
      <div className="bc-form-sv-service-signatures">
        <SVSign caption="ผู้รับเรื่อง" role={`เจ้าหน้าที่ ${svDepartment}`} name={txt(h, 's2_SV_Name')} signedAt={raw(h, 's2_SV_Date')} />
        <SVSign caption="ผู้ตรวจสอบ" role={`ผู้จัดการฝ่าย ${svDepartment}`} name={txt(h, 's2_SV_NameMgr')} signedAt={raw(h, 's2_SV_DateMgr')} />
      </div>
    </Section>
    <Section title="ส่วนที่ 3.สำหรับหน่วยงานผู้แจ้งเรื่องพิจารณา" className="bc-form-sv-review">
      <div className="bc-form-sv-review-details">
        <span className="bc-form-sv-review-options">
          <span>ผลการพิจารณา</span>
          <Check checked={yes(h, 's3_chkAccept')}>ยอมรับ</Check>
          <Check checked={yes(h, 's3_chkDontAccept')}>ไม่ยอมรับ</Check>
        </span>
        <span className="bc-form-sv-review-text">{txt(h, 's3_DontAcceptDetails')}</span>
        {Array.from({ length: 4 }, (_, index) => <i key={index} aria-hidden="true" style={{ top: `${(index + 1) * 4.5}mm` }} />)}
      </div>
      <div className="bc-form-sv-review-signatures">
        <SVSign caption="ลงชื่อ" role="รับทราบ/ต้นสังกัด" name={txt(h, 's3_Name')} signedAt={raw(h, 's3_Date')} />
        <SVSign caption="ผู้ตรวจสอบ" role="ผู้จัดการฝ่ายต้นสังกัด" name={txt(h, 's3_NameMgr')} signedAt={raw(h, 's3_DateMgr')} />
      </div>
    </Section>
    <Section title="เงื่อนไข" className="bc-form-sv-terms">
      <div className="bc-form-sv-terms-heading">1.กรณีแจ้งเรื่องรถเสีย</div>
      <div className="bc-form-sv-terms-row">
        <span>1.1 ทันกำหนด</span><span>:</span>
        <span>หน่วยงาน SV ดำเนินการประสานงานภายใน 1 ชม. นับจากวันที่ได้รับใบแจ้งเรื่อง พร้อมทั้งส่งเอกสารให้ผู้แจ้งเรื่องทราบภายใน 3 ชม.</span>
      </div>
      <div className="bc-form-sv-terms-row">
        <span>1.2 ไม่ทันกำหนด</span><span>:</span>
        <span>หน่วยงาน SV ดำเนินการประสานงานเกิน 1 ชม. นับจากวันที่ได้รับใบแจ้งเรื่อง หรือส่งเอกสารให้ผู้แจ้งเรื่องทราบเกิน 3 ชม.</span>
      </div>
      <div className="bc-form-sv-terms-heading">2.กรณีแจ้งเรื่องอื่นๆ</div>
      <div className="bc-form-sv-terms-row">
        <span>2.1 ทันกำหนด</span><span>:</span>
        <span>หน่วยงาน SV ดำเนินการประสานงานลูกค้าภายใน 3 วัน นับจากวันที่ได้รับใบแจ้งเรื่อง พร้อมทั้งดำเนินการส่งเอกสารให้ผู้แจ้งเรื่องรับทราบภายใน 3 วัน</span>
      </div>
      <div className="bc-form-sv-terms-row">
        <span>2.2 ไม่ทันกำหนด</span><span>:</span>
        <span>หน่วยงาน SV ดำเนินการประสานงานลูกค้าเกิน 3 วัน นับจากวันที่ได้รับใบแจ้งเรื่อง พร้อมทั้งดำเนินการส่งเอกสารให้ผู้แจ้งเรื่องรับทราบเกิน 3 วัน</span>
      </div>
    </Section>
    <Footer code="(P) FM-BC/SV-018/01" revision="REV.01 (12/04/67)" />
  </>;
}

function SQAForm({ form }: { form: BCPrintForm }) {
  const h = form.header;
  const printedAt = new Date();
  return <>
    <DocumentHead form={form} title="ใบรับเรื่อง SQA" />
    <section className="bc-form-section bc-form-sqa-request">
      <div className="bc-form-sqa-request-heading">
        <h2>ส่วนที่ 1: รายละเอียดแจ้งเรื่อง</h2><span>ส่วนงาน :</span>
        <Check checked={yes(h, 'typeHV')}>HV</Check><Check checked={yes(h, 'typeFL')}>FL</Check>
      </div>
      <div className="bc-form-sqa-request-meta">
        <Field label="ชื่อ:" value={txt(h, 'requestBy')} />
        <Field label="ฝ่าย/แผนก :" value={form.department ?? ''} />
        <Field label="วันที่ต้องการ :" value={d(h, 'requestDate')} />
      </div>
      <div className="bc-form-sqa-request-fields">
        <Field label="ประเภทที่แจ้ง :" value={txt(h, 'requestType')} />
        <Field label="รายละเอียดที่แจ้ง :" value={txt(h, 'requestDetail')} />
      </div>
      <SQARuledField label="รายละเอียด :" value={txt(h, 'details')} lines={5} />
      <SQASign label="ผู้แจ้ง" name={txt(h, 'requestByName', 'requestBy')} position={txt(h, 'requestByPosition')} dateText={d(h, 'requestByDate')} />
    </section>
    <Section title="ส่วนที่ 2: สำหรับเจ้าหน้าที่ SQA" className="bc-form-sqa-receive">
      <SQARuledField label="มอบหมายผู้ดำเนินการ :" value={txt(h, 'requestService')} lines={2} className="bc-form-sqa-assignment" />
      <SQASign label="ผู้รับเรื่อง" name={txt(h, 'receiveBy')} dateText={d(h, 'receiveDate')} />
    </Section>
    <Section title="ส่วนที่ 3: Service" className="bc-form-sqa-service">
      <SQARuledField label="มาตรฐานการดำเนินการ :" value={txt(h, 'serviceStd')} lines={2} className="bc-form-sqa-standard" />
      <SQARuledField label="การดำเนินการ :" value={txt(h, 'serviceDetail')} lines={9} className="bc-form-sqa-service-detail" />
      <SQASign label="ผู้ดำเนินการ" name={txt(h, 'serviceBy')} position={txt(h, 'servicePosition')} dateText={d(h, 'serviceDate')} />
    </Section>
    <div className="bc-form-print-stamp bc-form-sqa-print-stamp">
      <span>วันที่พิมพ์ {printedAt.toLocaleDateString('en-GB')}</span>
      <span>เวลาที่พิมพ์ {printedAt.toLocaleTimeString('th-TH', { hour12: false })}</span>
    </div>
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
