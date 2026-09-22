import React from 'react';
import logo from '../../assets/BCLogo.png';
import { ITServiceFormItem } from '../../types/itReport';

const QUESTIONS = [
  { key: 'friendlyService', text: 'ให้บริการด้วยความสุภาพและเป็นมิตร' },
  { key: 'fastService', text: 'ความรวดเร็วในการให้บริการ' },
  { key: 'focusService', text: 'เจ้าหน้าที่กระตือรือร้น และตั้งใจทำงาน' },
  { key: 'directService', text: 'ได้รับบริการตรงตามที่คาดหวัง' },
  { key: 'serviceKnowledge', text: 'การแนะนำขั้นตอนและให้ความรู้ในเรื่องที่ให้บริการ' },
] as const;

const LEVELS = [5, 4, 3, 2, 1] as const;

function dateText(value?: string | null): string {
  if (!value) return '—';
  const match = String(value).slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) return `${match[3]}/${match[2]}/${match[1]}`;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

function Signature({ label = 'ลงชื่อ', role, name, date }: { label?: string; role: string; name?: string | null; date?: string | null }) {
  return (
    <div className="it-work-signature">
      <div>{label} <span>{name || ''}</span> {role}</div>
      <div>วันที่ <span>{date ? dateText(date) : ''}</span></div>
    </div>
  );
}

export function ItWorkOrderPrint({ item }: { item: ITServiceFormItem }) {
  const score = item.serviceScore;
  const total = item.serviceTotal ?? 25;
  const percentage = item.servicePercentage ?? (score != null && total > 0 ? (score / total) * 100 : null);
  const now = new Date();
  const printDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  const printTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="print-root">
      <article className="it-work-order-print">
        <header className="it-work-head">
          <div className="it-work-logo"><img src={logo} alt="Big Crane" /></div>
          <div className="it-work-heading">
            <strong>บริษัท บิ๊กเครน แอนด์ อิควิปเม้นต์ เร้นทัลส์ จำกัด</strong>
            <span>ใบรับเรื่องฝ่ายเทคโนโลยีสารสนเทศ</span>
          </div>
          <div className="it-work-document-meta">
            <div><span>เลขที่ใบรับเรื่อง :</span><b>{item.jobNo}</b></div>
            <div><span>วันที่ใบรับเรื่อง :</span><b>{dateText(item.requestDate)}</b></div>
          </div>
        </header>

        <section className="it-work-section it-work-requester">
          <h2>ส่วนที่ 1 สำหรับผู้แจ้งเรื่อง</h2>
          <div className="it-work-fields two-cols">
            <div><label>ผู้แจ้งเรื่อง :</label><span>{item.requestBy || '—'}</span></div>
            <div />
            <div><label>หน่วยงาน :</label><span>{item.department || '—'}</span></div>
            <div><label>ชื่อคอมพิวเตอร์ :</label><span>{item.comName || '—'}</span></div>
            <div className="wide detail"><label>รายละเอียดที่แจ้ง :</label><span>{[item.requestDetail, item.remark].filter(Boolean).join('\n') || '—'}</span></div>
          </div>
          <div className="it-work-signature-row">
            <Signature label="ผู้แจ้งเรื่อง" role="ต้นสังกัด" name={item.requestBy} date={item.requestDate} />
            <Signature label="ผู้อนุมัติ" role="ผจก.ฝ่าย ต้นสังกัด" name={item.mgrApproveBy} date={item.mgrApproveDate} />
          </div>
        </section>

        <section className="it-work-section it-work-service">
          <h2>ส่วนที่ 2: สำหรับฝ่ายเทคโนโลยีสารสนเทศ</h2>
          <div className="it-work-fields">
            <div className="cause"><label>สาเหตุ :</label><span>{item.hw || '—'}</span></div>
            <div className="detail"><label>รายละเอียดการดำเนินงาน :</label><span>{item.repairDetail || '—'}</span></div>
          </div>
          <div className="it-work-signature-row single">
            <Signature
              role="ผู้ดำเนินการ"
              name={item.serviceBy}
              date={item.serviceDate}
            />
          </div>
        </section>

        <section className="it-work-section it-work-survey">
          <h2>ส่วนที่ 3 สำหรับการสำรวจความพึงพอใจในการให้บริการ</h2>
          <p className="it-work-survey-intro">ความพึงพอใจต่อการใช้บริการระบบเทคโนโลยีสารสนเทศ</p>
          <table>
            <thead>
              <tr>
                <th className="no">ลำดับ</th>
                <th>ข้อคำถาม</th>
                <th>ดีมาก<br />(5)</th>
                <th>ดี<br />(4)</th>
                <th>ปานกลาง<br />(3)</th>
                <th>น้อย<br />(2)</th>
                <th>น้อยที่สุด<br />(1)</th>
              </tr>
            </thead>
            <tbody>
              {QUESTIONS.map((question, index) => (
                <tr key={question.key}>
                  <td>{index + 1}</td>
                  <td className="question">{question.text}</td>
                  {LEVELS.map((level) => <td key={level}>{item[`${question.key}${level}`] ? '✓' : ''}</td>)}
                </tr>
              ))}
              <tr className="summary"><th colSpan={2}>คะแนนเต็ม</th><td colSpan={5}>{total}</td></tr>
              <tr className="summary"><th colSpan={2}>คะแนนที่ได้</th><td colSpan={5}>{score ?? '—'}</td></tr>
              <tr className="summary"><th colSpan={2}>คิดเป็น %</th><td colSpan={5}>{percentage == null ? '—' : `${percentage.toFixed(2)}%`}</td></tr>
            </tbody>
          </table>
          <div className="it-work-remark"><label>ข้อเสนอแนะอื่น</label><span>{item.surveyRemark || ''}</span><span /></div>
          <div className="it-work-criteria">
            <strong>หลักเกณฑ์ในการพิจารณา</strong>
            <p>- ความพึงพอใจในการให้บริการ ตั้งแต่ 20 คะแนนขึ้นไป ถือว่าเป็นไปตามเป้าหมายตั้งไว้</p>
            <p>- ความพึงพอใจในการให้บริการ น้อยกว่า 20 คะแนน ต้องเก็บสถิติเพื่อปรับปรุงการให้บริการของฝ่าย IT โดยจะรวบรวมปีละ 2 ครั้ง เพื่อจัดทำ Action Plan ในการแก้ไขปัญหาในปีต่อไป</p>
          </div>
          <div className="it-work-signature-row survey-signatures">
            <Signature role="ผู้รับบริการ" name={item.surveyBy} date={item.surveyDate} />
            <Signature label="ผู้ตรวจสอบ" role="IT Mgr." name={item.closeBy} date={item.closeDate} />
          </div>
        </section>

        <footer className="it-work-footer">
          <span>(P) FM-BC/IT-002/04</span>
          <span>REV.05(16/03/66)</span>
          <span>วันที่พิมพ์&nbsp;&nbsp;&nbsp;&nbsp;{printDate}</span>
          <span>เวลาที่พิมพ์&nbsp;&nbsp;&nbsp;&nbsp;{printTime}</span>
        </footer>
      </article>
    </div>
  );
}
