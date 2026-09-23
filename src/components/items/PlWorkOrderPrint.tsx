import React from 'react';
import logo from '../../assets/BCLogo.png';
import {
  PLRequestFormHeader,
  PLRequestFormReport,
  PLRequestFormReportType,
} from '../../types/plReport';

export const PL_PRINT_OPTIONS: { kind: PLRequestFormReportType; label: string }[] = [
  { kind: 'master', label: 'Master Report' },
  { kind: 'approve', label: 'Approve Report' },
  { kind: 'header', label: 'Header Report' },
];

// ทั้งสามแบบเรียงซ้าย→ขวา 3 คอลัมน์; value คือชื่อที่ API เก็บจริง
const REQUEST_TYPE_OPTIONS = [
  { label: 'ข้อร้องเรียนลูกค้าภายนอก', value: 'ข้อร้องเรียนลูกค้าภายนอก' },
  { label: 'ขอเอกสารพนักงาน/เอกสารเครื่องจักร', value: 'ขอเอกสารพนักงาน/เอกสารเครื่องจักร' },
  { label: 'แจ้งขอลางาน', value: 'ขอลางาน' },
  { label: 'พนักงานขับรถ (พฤติกรรม)', value: 'พนักงานขับรถ (พฤติกรรม)' },
  { label: 'สำรวจหน้างาน', value: 'สำรวจหน้างาน' },
  { label: 'อุบัติเหตุ', value: 'อุบัติเหตุ' },
  { label: 'แจ้งเรื่องสภาพหน้างาน', value: 'แจ้งเรื่องสภาพหน้างาน' },
  { label: 'ขอใช้พนักงานขับรถ / ขอใช้เครื่องจักร', value: 'ขอใช้พนักงานขับรถ / ขอใช้เครื่องจักร' },
  { label: 'อุปกรณ์เสริม', value: 'อุปกรณ์เสริม' },
  { label: 'อื่นๆ', value: 'อื่นๆ' },
  { label: 'การขนส่ง / ขนย้าย', value: 'การขนส่ง / ขนย้าย' },
  { label: 'พนักงานขับรถติดตามงานซ่อม', value: 'พนักงานขับรถติดตามงานซ่อม' },
];

function dateText(value?: string | null, withTime = false): string {
  if (!value) return '—';
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (!match) return value;
  const day = `${match[3]}/${match[2]}/${match[1]}`;
  return withTime && match[4] ? `${day} ${match[4]}:${match[5]}:${match[6] ?? '00'}` : day;
}

function Mark({ checked, children }: { checked: boolean; children: React.ReactNode }) {
  return <span className="pl-form-mark"><span className="pl-form-box">{checked ? '✓' : ''}</span>{children}</span>;
}

function ReportHead({ header, kind }: { header: PLRequestFormHeader; kind: PLRequestFormReportType }) {
  return <header className="pl-form-head">
    <div className="pl-form-logo"><img src={logo} alt="Big Crane" /></div>
    <div className="pl-form-title">
      <strong>บริษัท บิ๊กเครน แอนด์ อิควิปเม้นต์ เร้นทัลส์ จำกัด</strong>
      <span>{kind === 'header' ? 'เอกสารอ้างอิงใบรับเรื่อง' : 'ใบรับเรื่องเกี่ยวกับลูกค้าภายนอก ลูกค้าภายในและภายในแผนก'}</span>
    </div>
    <div className="pl-form-doc-meta"><div>เลขที่ใบรับเรื่อง : <b>{header.docNo}</b></div><div>วันที่ : <b>{dateText(header.docDate, true)}</b></div></div>
  </header>;
}

function TypeChecks({ type }: { type: string | null }) {
  const text = (type ?? '').trim();
  return <div className="pl-form-type-row">
    <Mark checked={/ลูกค้าภายนอก/.test(text)}>ลูกค้าภายนอก:</Mark>
    <Mark checked={/ลูกค้าภายใน/.test(text)}>ลูกค้าภายใน:</Mark>
    <Mark checked={/ภายในแผนก/.test(text)}>ภายในแผนก</Mark>
  </div>;
}

function RequesterSection({ header, kind }: { header: PLRequestFormHeader; kind: PLRequestFormReportType }) {
  const selected = (header.requestType ?? '').trim();
  const isOther = selected !== '' && !REQUEST_TYPE_OPTIONS.some((type) => type.value === selected || type.label === selected);
  const attachmentOrder = kind === 'master'
    ? [
        { label: 'รายละเอียด/Spec', checked: header.attachSpec },
        { label: 'รูปถ่าย', checked: header.attachPicture },
        { label: 'เอกสารยืนยันจากบริษัทลูกค้า', checked: header.attachCustDocConfirm },
        { label: 'อื่น ๆ', checked: header.attachOther },
      ]
    : [
        { label: 'รายละเอียด/Spec', checked: header.attachSpec },
        { label: 'งบประมาณเลขที่', checked: header.attachBudget, number: header.budgetDocNo },
        { label: 'Quatation เปรียบเทียบราคา', checked: header.attachQuatation },
        { label: 'ใบขออนุมัตินอกงบเลขที่', checked: header.attachExBudget, number: header.exBudgetDocNo },
      ];

  return <section className="pl-form-requester">
    <h2>ส่วนที่ 1.สำหรับผู้ร้องขอ</h2>
    <div className="pl-form-request-types">
      {REQUEST_TYPE_OPTIONS.map((type) => <Mark key={type.value} checked={selected === type.value || selected === type.label || (type.value === 'อื่นๆ' && isOther)}>{type.label}{type.value === 'อื่นๆ' && isOther ? ` (${selected})` : ''}</Mark>)}
    </div>
    <strong className="pl-form-small-label">สิ่งที่แนบมาด้วย :</strong>
    <div className="pl-form-attachments">
      {attachmentOrder.map((attachment) => <div key={attachment.label} className="pl-form-attachment">
        <Mark checked={attachment.checked}>{attachment.label}</Mark>
        {'number' in attachment && <span className="pl-form-dotline">{attachment.number || ''}</span>}
        {attachment.label === 'อื่น ๆ' && header.attachOtherDetail && <span>{header.attachOtherDetail}</span>}
      </div>)}
    </div>
    {kind === 'header' && <>
      <div className="pl-form-request-detail"><strong>เรื่องที่ร้องขอ :</strong><span className="pl-form-dotline">{header.requestDetail || ''}</span></div>
      <div className="pl-form-header-sign"><span>ลงชื่อ <span className="pl-form-dotline">{header.requestBy || ''}</span> ผู้แจ้ง</span><span>หน่วยงาน <b>{header.departName || '—'}</b></span></div>
    </>}
  </section>;
}

function RequestLines({ report }: { report: PLRequestFormReport }) {
  const rows = report.reportType === 'approve' && report.lines.length < 5
    ? [...report.lines, ...Array.from({ length: 5 - report.lines.length }, () => null)]
    : report.lines;
  return <table className="pl-form-lines">
    <thead><tr><th>ลำดับ</th><th>รายการ</th><th>จำนวน</th><th>หน่วย</th><th>เหตุผลการขอ</th></tr></thead>
    <tbody>{rows.length ? rows.map((line, index) => <tr key={line?.recNo ?? `blank-${index}`}>
      <td>{index + 1}</td><td>{line?.item || ''}</td><td>{line?.qty ?? ''}</td><td>{line?.unit || ''}</td><td>{line?.remark || ''}</td>
    </tr>) : <tr><td>1</td><td /><td /><td /><td /></tr>}</tbody>
  </table>;
}

function Signature({ label, name, role }: { label: string; name?: string | null; role: string }) {
  return <span>{label} <span className="pl-form-dotline">{name || ''}</span> {role}</span>;
}

function MasterService({ header, approvals }: { header: PLRequestFormHeader; approvals: PLRequestFormReport['approvals'] }) {
  const requesterManager = approvals.find((approval) => approval.step === 1);
  return <>
    <section className="pl-form-master-signatures">
      <div className="pl-form-master-plan-date">วันที่ต้องการใช้งาน <span className="pl-form-dotline">{dateText(header.planDate)}</span></div>
      <div className="pl-form-master-requester"><Signature label="ลงชื่อ" name={header.requestBy} role="ผู้แจ้ง" /> หน่วยงาน <b>{header.departName || '—'}</b></div>
      <div className="pl-form-master-request-date">วันที่ <span className="pl-form-dotline">{dateText(header.requestDate)}</span></div>
      <div className="pl-form-master-manager"><Signature label="ลงชื่อ" name={requesterManager?.approveBy} role="ผจก.ต้นสังกัด" /></div>
      <div className="pl-form-master-manager-date">วันที่ <span className="pl-form-dotline">{requesterManager?.approveDate ? dateText(requesterManager.approveDate) : ''}</span></div>
    </section>
    <section className="pl-form-master-work">
      <h2>ส่วนที่ 2.สำหรับหน่วยงาน PL</h2>
      <strong>ดำเนินการ :</strong>
      <div className="pl-form-ruled">{header.actionDetail || header.action || ''}</div>
      <div className="pl-form-master-work-sign"><Signature label="ลงชื่อ" role="ผู้รับเรื่อง เจ้าหน้าที่ควบคุมและดูแล อปต." /><Signature label="ลงชื่อ" role="ผู้ตรวจสอบ PL Mgr." /></div>
      <div className="pl-form-master-work-sign"><span>วันที่ <span className="pl-form-dotline" /></span><span>วันที่ <span className="pl-form-dotline" /></span></div>
    </section>
    <section className="pl-form-master-results">
      <strong>ผลการดำเนินงาน :</strong>
      <div className="pl-form-ruled">{header.wrDetail || header.workResults || ''}</div>
      <div className="pl-form-master-work-sign"><Signature label="ลงชื่อ" role="ผู้แจ้งรับทราบ" /><Signature label="ลงชื่อ" role="ผู้ตรวจสอบ PL Mgr." /></div>
      <div className="pl-form-master-work-sign"><span>วันที่ <span className="pl-form-dotline" /></span><span>วันที่ <span className="pl-form-dotline" /></span></div>
    </section>
  </>;
}

function ApproveService({ header }: { header: PLRequestFormHeader }) {
  const action = header.action ?? '';
  const result = header.workResults ?? '';
  return <>
    <section className="pl-form-approve-signatures">
      <span>วันที่ต้องการใช้งาน <span className="pl-form-dotline">{dateText(header.planDate, true)}</span></span>
      <span><Signature label="ลงชื่อ" name={header.requestBy} role="ผู้แจ้ง" /> หน่วยงาน {header.departName || '—'}</span>
      <span>วันที่ <span className="pl-form-dotline">{dateText(header.requestDate, true)}</span></span>
    </section>
    <section className="pl-form-approve-work">
      <h2>ส่วนที่ 2.สำหรับหน่วยงาน PL</h2>
      <strong>ดำเนินการ :</strong>
      <div className="pl-form-service-checks">
        {['ยังไม่ดำเนินการ', 'มีอุปกรณ์ในสต๊อก', 'ผู้รับเหมา/ร้านค้า อ้างอิง PRเลขที่', 'จัดซื้อใหม่', 'ซ่อมภายนอก', 'อื่นๆ ระบุหมายเหตุ'].map((label) => <Mark key={label} checked={action.includes(label)}>{label}{label.includes('PRเลขที่') && header.refPR ? ` ${header.refPR}` : ''}</Mark>)}
      </div>
      <strong>ผลการดำเนินงาน :</strong>
      <div className="pl-form-service-checks pl-form-result-checks">
        {['จัดการเรียบร้อย', 'ยังไม่เรียบร้อย'].map((label) => <Mark key={label} checked={result.includes(label)}>{label}</Mark>)}
      </div>
      <div className="pl-form-request-detail"><strong>หมายเหตุ</strong><span className="pl-form-dotline">{header.actionDetail || header.wrDetail || ''}</span></div>
    </section>
  </>;
}

export function PlWorkOrderPrint({ report }: { report: PLRequestFormReport }) {
  const { header, approvals, reportType } = report;
  return <div className="print-root">
    <article className={`pl-work-order-print pl-form-${reportType}`}>
      <div className="pl-form-frame">
        <ReportHead header={header} kind={reportType} />
        <TypeChecks type={header.type} />
        <RequesterSection header={header} kind={reportType} />
        {reportType !== 'header' && <>
          <RequestLines report={report} />
          {reportType === 'master' ? <MasterService header={header} approvals={approvals} /> : <ApproveService header={header} />}
        </>}
        {reportType === 'approve' && <section className="pl-form-approvals">
          <h2>ส่วนที่ 3.การอนุมัติ</h2>
          <table><thead><tr><th>ลำดับ</th><th>อนุมัติโดย</th><th>วันที่อนุมัติ</th><th>รายละเอียด</th></tr></thead>
            <tbody>{approvals.map((approval, index) => <tr key={`${approval.step}-${index}`}><td>{approval.step}</td><td>{approval.approveBy || ''}</td><td>{dateText(approval.approveDate, true)}</td><td>{approval.description || ''}</td></tr>)}</tbody>
          </table>
        </section>}
      </div>
      {reportType === 'master' && <div className="pl-form-footer"><span>FM-BC/PL-002/06</span><span>Rev.:05 (02/04/62)</span></div>}
    </article>
  </div>;
}
