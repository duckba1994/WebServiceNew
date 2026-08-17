import React from 'react';
import { BookingRow } from '../../types/booking';
import { COMPANY } from '../../data/menuData';
import { buildBookingProgress, MOCK_STEP_DETAIL } from '../../data/bookingData';
import {
  BookingMaster,
  EMPTY_BOOKING_MASTER,
  purposeOpts,
  planTypeOpts,
  jobCharacterOpts,
  presentWorkOpts,
  operatorServiceOpts,
  fuelConditionOpts,
  surveyWorkSiteOpts,
  documentBookingOpts,
  technicianConditionOpts,
  creditTypeOpts,
  carAssignmentsPLOpts,
  carVerificationsSVOpts,
  jobMatrix,
  hasTextInput,
  isOtherJobChar,
  isOtherLabel,
} from '../../data/bookingMaster';
import bcLogo from '../../assets/BCLogo.png';

// ══════════════════════════════════════════════════════════════════════════
// เอกสารพิมพ์ใบจองสินค้า — พอร์ตจากดีไซน์ BookingForm.dc.html
// ฟอร์มลงทะเบียน (P)FM-BC/SL-001/12 REV.08 (21/04/69)
//
// * ตัวเลือกช่องติ๊ก (วัตถุประสงค์ / matrix ประเภทงาน / ลักษณะงาน / เสนองาน /
//   อปต. / ช่าง / วงเงิน / สถานะ PL·SV) ดึงจาก master data ผ่าน selectors ใน
//   data/bookingMaster.ts — "แหล่งเดียวกับหน้าสร้างใบจอง" ; ถ้า master ยังว่าง
//   จะ fallback เป็น label ฟอร์มกระดาษจริง (ดูคอมเมนต์ในไฟล์นั้น)
// * ช่อง "ติ๊กไหน" ยัง render ว่าง เพราะ booking API ยังไม่ส่ง selected IDs มา —
//   เมื่อ backend ส่งค่าที่เลือก (IDs) มาแล้ว ค่อย lookup กับ Opt.id เพื่อติ๊ก
// * เมื่อ backend เปิด API พิมพ์ (รับเลข Booking) ให้เปลี่ยนไปเรียก API เปิด/
//   ดาวน์โหลด PDF ตัวจริงแทน (เอกสารลงทะเบียนถูกต้อง 100%)
// * กรอบกระดาษ/ฟอนต์อยู่ใน .bkp ที่ index.css
// ══════════════════════════════════════════════════════════════════════════

// ค่าที่แสดง ('-' ถ้าว่าง)
const v = (s?: string) => (s && s !== '—' ? s : '-');

// ── ช่องติ๊ก (สี่เหลี่ยม) / ปุ่มตัวเลือก (วงกลม) ──────────────
const BOX: React.CSSProperties = {
  display: 'inline-flex',
  width: 11,
  height: 11,
  border: '1px solid #000',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 8,
  lineHeight: 1,
  flex: 'none',
};
const ROW: React.CSSProperties = { display: 'flex', gap: 3, alignItems: 'center' };

// ช่องสี่เหลี่ยม (checkbox)
function Sq({ on, children }: { on?: boolean; children?: React.ReactNode }) {
  return (
    <label style={ROW}>
      <span style={BOX}>{on ? '✓' : ''}</span>
      {children}
    </label>
  );
}
// ช่องวงกลม (radio)
function Ci({ on, children }: { on?: boolean; children?: React.ReactNode }) {
  return (
    <label style={ROW}>
      <span style={{ ...BOX, borderRadius: '50%' }}>{on ? '✓' : ''}</span>
      {children}
    </label>
  );
}

const SUB: React.CSSProperties = { color: '#333', fontSize: 8 };

// จำนวนคอลัมน์ของตาราง matrix ประเภทงาน (ส่วนที่ 4)
const MATRIX_COLS = 8;

// ── หัวข้อหมวด (คอลัมน์ป้ายซ้าย + เนื้อหาขวา) ─────────────────
function Line({ head, headW = 110, children }: { head: React.ReactNode; headW?: number; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex' }}>
      <div style={{ width: headW, flex: 'none', fontWeight: 700, padding: '4px 6px' }}>{head}</div>
      <div style={{ flex: 1, padding: '4px 6px' }}>{children}</div>
    </div>
  );
}

// ── กล่องลงนามชิดขวา (ส่วนที่ 2/3/4) ─────────────────────────
function SignRight({
  who,
  role,
  name,
  date,
  time,
  pending,
}: {
  who: string;
  role: string;
  name: string;
  date: string;
  time: string;
  pending?: boolean;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24, marginTop: 6, alignItems: 'baseline' }}>
      <div style={{ textAlign: 'center' }}>
        <div>{who}</div>
        <div style={{ fontWeight: 700 }}>{pending ? `( รอ ${v(name)} )` : v(name)}</div>
        <div>
          วันที่ <b>{pending ? '..../..../....' : v(date)}</b> เวลา <b>{pending ? '.....' : v(time)}</b> น
        </div>
      </div>
      <div style={{ alignSelf: 'flex-end' }}>{role}</div>
    </div>
  );
}

// ── ส่วนที่ 2 (ฝ่าย PL หยอดเบอร์รถ) — แม่แบบข้อความรายละเอียดต่อบรรทัด ──
// (ตัว label มาจาก master ; ข้อความรายละเอียดนี้เป็นแม่แบบช่องกรอกของฟอร์มกระดาษ
//  จับคู่ตามลำดับ index — ถ้า master มีจำนวนไม่ตรง บรรทัดเกินจะไม่มีรายละเอียด)
const PART2_DETAILS = [
  'หมายเลขรถเช่า :   สถานะรถ :   วันที่สิ้นสุดสถานะ :   ชื่อ Operator :',
  'หมายเลขรถเช่า :   สถานะรถ :   วันที่สิ้นสุดสถานะ :   ชื่อ Operator :   รวมสาเหตุ :',
  'หมายเลขรถเช่า :   สถานะรถ :   วันที่สิ้นสุดสถานะ :   ชื่อ Operator :   รวมสาเหตุ :',
  'หมายเลขรถเช่า :   วันที่สามารถผลิตรถได้ :   ระบุสาเหตุ :   ชื่อ Operator :',
  'หมายเลขรถเช่า :   สถานะรถ :   วันที่สิ้นสุดสถานะ :   ชื่อ Operator :',
  'หมายเลขรถเช่า :   สถานะรถ :   วันที่สิ้นสุดสถานะ :   ชื่อ Operator :',
  '',
];

export function BookingPrintDoc({ row, master = EMPTY_BOOKING_MASTER }: { row: BookingRow; master?: BookingMaster }) {
  const { steps } = buildBookingProgress(row);
  const creator = steps[0];
  const creatorMgr = steps[2];
  const plStep = steps[3];
  const svStep = steps[5];
  const finalStep = steps[7];
  const rentNo = row.truckPL !== '—' && row.truckPL ? row.truckPL : '-';
  const operator = MOCK_STEP_DETAIL.pl.operator;

  // ── ตัวเลือกจาก master data (fallback = label ฟอร์มกระดาษ) ──
  const purposes = purposeOpts(master);
  const planTypes = planTypeOpts(master);
  const matrix = jobMatrix(master);
  const jobChars = jobCharacterOpts(master);
  const presentWorks = presentWorkOpts(master);
  const operatorServices = operatorServiceOpts(master);
  const fuels = fuelConditionOpts(master);
  const surveys = surveyWorkSiteOpts(master);
  const optDocs = documentBookingOpts(master);
  const techConds = technicianConditionOpts(master);
  const credits = creditTypeOpts(master);
  const plStatuses = carAssignmentsPLOpts(master);
  const svStatuses = carVerificationsSVOpts(master);

  return (
    <div className="bkp">
      <div style={{ width: '100%', border: '1.5px solid #000', lineHeight: 1.25 }}>
        {/* ══════════ หัวเอกสาร ══════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 150px', borderBottom: '1.5px solid #000' }}>
          <div style={{ borderRight: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 6 }}>
            <img src={bcLogo} alt="BIG CRANE" style={{ width: 52, height: 32, objectFit: 'contain' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 6 }}>
            <div style={{ fontWeight: 700, fontSize: 12 }}>{COMPANY.nameTh}</div>
            <div style={{ fontWeight: 700, fontSize: 11, marginTop: 2 }}>ใบจองสินค้า</div>
          </div>
          <div style={{ borderLeft: '1px solid #000', padding: '6px 8px' }}>
            <div style={{ display: 'flex', gap: 4 }}>
              <span>เลขที่</span>
              <b>{v(row.book)}</b>
            </div>
            <div style={{ display: 'flex', gap: 4, marginTop: 6, borderTop: '1px dotted #000', paddingTop: 4 }}>
              <span>วันที่</span>
              <b>{v(row.createDate)}</b>
            </div>
          </div>
        </div>

        {/* ══════════ ส่วนที่ 1 : ฝ่ายขาย / ผู้จอง ══════════ */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 6px', fontWeight: 700 }}>
          <span style={{ fontSize: 11}}>
            <span style={{ padding: '0 3px', marginRight: 5 }}>ส่วนที่ 1</span>
            สำหรับฝ่ายขาย/ผู้จอง (เพื่อให้รายละเอียดการจอง)
          </span>
          <span style={{ fontWeight: 400 }}>
            ฝ่ายขาย : <b>{v(row.salesperson)}</b>
          </span>
        </div>

        {/* 1. วัตถุประสงค์ — 70:30 (ซ้าย วัตถุประสงค์ 3 รายการ/แถว | ขวา เลขที่·ลำดับแผนขาย) */}
        <div>
          <span style={{ fontSize: 11}}></span>
        </div>
        <Line  head="1. วัตถุประสงค์ :">
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: '0 0 70%', maxWidth: '60%' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px 10px' }}>
                {purposes.map((o) => (
                  <Ci key={o.id}>{o.name}</Ci>
                ))}
              </div>
            </div>
            <div style={{ flex: '0 0 30%', maxWidth: '40%', display: 'flex', gap: 10, alignItems: 'baseline' }}>
              <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <Ci>
                  <span style={{ whiteSpace: 'nowrap' }}>เลขที่แผนขาย</span>
                </Ci>
                <b style={{ borderBottom: '1px dotted #000', minWidth: 70, display: 'inline-block', textAlign: 'center' }}>
                  SP-SLHV-11/07/2026
                </b>
              </span>
              <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <Ci>
                  <span style={{ whiteSpace: 'nowrap' }}>ลำดับแผนขาย</span>
                </Ci>
                <b style={{ borderBottom: '1px dotted #000', minWidth: 40, display: 'inline-block', textAlign: 'center' }}>SP690877</b>
              </span>
            </div>
          </div>
        </Line>

        {/* 2. ข้อมูลลูกค้า — 50:50, 3 แถว (แถว 3: ประเภทลูกค้า | ประเภทแผน plan-types) */}
        <Line head="2. ข้อมูลลูกค้า :">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 16px', alignItems: 'start' }}>
            {/* แถว 1 */}
            <span>
              ชื่อลูกค้า : <b style={{ borderBottom: '1px dotted #000', minWidth: 270 , display: 'inline-block', textAlign: 'left' }}>{v(row.customer)}</b>
            </span>
            <span>
              สถานที่ทำงาน : <b style={{ borderBottom: '1px dotted #000', minWidth: 255 , display: 'inline-block', textAlign: 'left' }} >{v(row.site)}</b>
            </span>
            {/* แถว 2 */}
            <span>
              ชื่อผู้ติดต่อ : <b style={{ borderBottom: '1px dotted #000', minWidth: 260 , display: 'inline-block', textAlign: 'left' }} >{v(row.contactName)}</b>
            </span>
            <span>
              เบอร์โทรศัพท์ : <b style={{ borderBottom: '1px dotted #000', minWidth: 260 , display: 'inline-block', textAlign: 'left' }} >{v(row.contactPhone)}</b>
            </span>
            {/* แถว 3 col1 : ประเภทลูกค้า (ดังเดิม) */}
            <div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 12px', alignItems: 'center' }}>
                <Sq>ลูกค้าใหม่</Sq>
                <Sq>ลูกค้าเก่า</Sq>
              </div>
            </div>
            {/* แถว 3 col2 : ประเภทแผน (plan-types) */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 12px', alignItems: 'center' }}>
              {planTypes.map((o) => (
                <Sq key={o.id}>{o.name}</Sq>
              ))}
               <div style={SUB}>(ระบบโชว์อัตโนมัติอ้างอิงรหัสลูกค้าและแผนขาย)</div>
            </div>
          </div>
        </Line>

        {/* 3. เครื่องจักรที่ต้องการ */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: 110, flex: 'none', fontWeight: 700, padding: '4px 6px' }}>3. เครื่องจักรที่ต้องการ</div>
          <div style={{ flex: 1, padding: '4px 6px', display: 'flex', flexWrap: 'wrap', gap: '2px 20px' }}>
            <span>
              ประเภทเครื่องจักรที่ต้องการ : <b style={{ borderBottom: '1px dotted #000', minWidth: 60 , display: 'inline-block', textAlign: 'left' }}>{v(row.machine)}</b>
            </span>
            <span>ขนาดรถที่ต้องการ (ตัน) : <b style={{ borderBottom: '1px dotted #000', minWidth: 60 , display: 'inline-block', textAlign: 'left' }}>50/5</b></span>
            <span>รุ่น/ปี : <b style={{ borderBottom: '1px dotted #000', minWidth: 60 , display: 'inline-block', textAlign: 'left' }}>50/8</b></span>
          </div>
        </div>

        {/* 4. รายละเอียดลักษณะงาน */}
        <div>
          {/* <div style={{padding: '4px 6px' }}>
            <span >4. รายละเอียดลักษณะงาน :
              <b>v(row.jobType)</b>
            </span>
          </div> */}

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: 80, flex: 'none', fontWeight: 700, padding: '4px 6px' }}>4. รายละเอียดลักษณะงาน :</div>
          <b style={{ borderBottom: '1px dotted #000', minWidth: 60 , display: 'inline-block', textAlign: 'left' }}>{v(row.machine)}</b>
        </div>


          <div style={{ padding: '0 6px 4px 6px' }}>
            <div style={{ display: 'flex', gap: 4 }}>
              <b style={{ width: 65,textDecoration: 'underline', whiteSpace: 'nowrap' }}>* เกี่ยวกับลักษณะงาน :</b>
              {/* 5 รายการต่อแถว ; inputTypeID = 1 → มีช่องกรอก "ระบุ" + แสดง description */}
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '2px 12px' }}>
                {jobChars.map((o) => (
                  <span
                    key={o.id}
                    style={{
                      display: 'flex',
                      gap: 3,
                      alignItems: 'center',
                      minWidth: 0,
                      // "อื่นๆ" (JobCharacterID = 7) ผู้ใช้กรอกข้อความยาว → ขยายเป็น 2 คอลัมน์
                      gridColumn: isOtherJobChar(o) ? 'span 3' : undefined,
                    }}
                  >
                    <Ci>
                      <span style={{ whiteSpace: 'nowrap' }}>{o.name}</span>
                    </Ci>
                    {hasTextInput(o) && (
                      <b style={{ flex: 1, minWidth: 24, borderBottom: '1px dotted #000', textAlign: 'center' }}>&nbsp;</b>
                    )}
                    {o.description && <span style={{ ...SUB, whiteSpace: 'nowrap' }}>{o.description}</span>}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* MATRIX ประเภทงาน */}
          <div style={{ display: 'flex', borderTop: '1px solid #000', borderBottom: '1px solid #000' }}>
            <div style={{ width: 16, flex: 'none', borderRight: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontWeight: 600 }}>ประเภทงาน</span>
            </div>
            <div style={{ flex: 1 }}>
              {matrix.map((g) => (
                <div key={g.id} style={{ display: 'flex', borderBottom: '1px solid #000', alignItems: 'stretch' }}>
                  <div style={{ width: 85, flex: 'none', padding: '2px 6px', borderRight: '1px solid #000' }}>{g.label}</div>
                  {/* ประเภทงานของกลุ่มนี้ — 8 รายการต่อแถว ; inputTypeID = 1 → มีช่องกรอก "ระบุ" */}
                  <div style={{ flex: 1, display: 'grid', gridTemplateColumns: `repeat(${MATRIX_COLS}, 1fr)`, minWidth: 0 }}>
                    {g.cells.map((c, i) => (
                      <label
                        key={c.id}
                        style={{
                          display: 'flex',
                          gap: 3,
                          alignItems: 'center',
                          padding: '2px 4px',
                          minWidth: 0,
                          // "อื่นๆ" — ขยายกินคอลัมน์ที่เหลือในแถวนั้นจนสุด (ผู้ใช้กรอกข้อความยาว)
                          gridColumn: isOtherLabel(c) ? `span ${MATRIX_COLS - (i % MATRIX_COLS)}` : undefined,
                        }}
                      >
                        <span style={{ ...BOX, width: 10, height: 10, fontSize: 7 }}></span>
                        <span style={{ whiteSpace: 'nowrap' , letterSpacing: '-0.2px'}}>{c.name}</span>
                        {hasTextInput(c) && (
                          <b style={{ flex: 1, minWidth: 20, borderBottom: '1px dotted #000', textAlign: 'center' }}>&nbsp;</b>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 5. ต้องการเสนองาน */}
        <Line head="5. ต้องการเสนองาน :">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 12px', alignItems: 'center' }}>
            {presentWorks.map((o) => (
              <Sq key={o.id}>{o.name}</Sq>
            ))}
            <span>
              วันที่เริ่มทำงาน : <b>{v(row.startDate)}</b>
            </span>
            <span>
              เวลาที่เริ่มทำงาน : <b>-</b> น.
            </span>
            <span>
              ชั่วโมงทำงานต่อวัน : <b>-</b> ชั่วโมง
            </span>
            <span>
              วันที่สิ้นสุดการทำงาน : <b>{v(row.endDate)}</b>
            </span>
            <span>
              รวมระยะเวลาเช่า : <b>{v(row.duration)}</b>
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 12px', marginTop: 3, alignItems: 'center' }}>
            {operatorServices.map((o) => (
              <Sq key={o.id}>{o.name}</Sq>
            ))}
            <span style={SUB}>
              (กรณีเช่าแบบ ไม่รวม อปต. ลค. จะต้องทำประกันภัยเครื่องจักรที่เช่า และ ฝ่าย HR + PL ต้องทำการสัมภาษณ์ตาม CheckList ก่อนจัดส่งเครื่องจักร)
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 12px', marginTop: 3, alignItems: 'center' }}>
            {fuels.map((o) => (
              <Ci key={o.id}>{o.name}</Ci>
            ))}
            <span style={SUB}>
              [กรณีซิโน-ไทย, วัฒนไพศาล, กรากการรุ่งค้า CKST-OR, กรากการรุ่งค้า CKST-PL, ทักษิณ, ช.การช่าง, พลัส โพรเกรส
              ต้องเติมน้ำมันเต็มถัง (ตรวจหน้างาน) ในวันแรกของการเริ่มงาน]
            </span>
          </div>
        </Line>

        {/* 6. สำรวจหน้างาน */}
        <Line head="6. เกี่ยวกับการสำรวจหน้างาน :" headW={130}>
          <div style={{ ...SUB, marginBottom: 3 }}>
            (กติกาสำรวจหน้างาน : งานวัน และ เครื่องจักรประเภท TB , CC สาเหตุ : สำรวจหน้างาน ทางเข้า-ออก พื้นที่รถ TT ใช้ขนส่ง
            และรถเครนประกอบบูม)
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 16px', alignItems: 'center' }}>
            {surveys.map((o) => (
              <Sq key={o.id}>{o.name}</Sq>
            ))}
          </div>
        </Line>

        {/* 7. หมวดเพิ่มเติม Operation */}
        <div>
          <div style={{ padding: '3px 6px', fontWeight: 700 }}>7.หมวดเพิ่มเติม Operation :</div>

          {/* * เกี่ยวกับอปต. */}
          <Line head={<b style={{ textDecoration: 'underline' }}>* เกี่ยวกับอปต. :</b>}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 14px', alignItems: 'center' }}>
              {optDocs.map((o) => (
                <Ci key={o.id}>{o.name}</Ci>
              ))}
            </div>
          </Line>

          {/* * เกี่ยวกับใบงาน (ไม่มี master — เป็นข้อกำหนดฟอร์มกระดาษ) */}
          <Line head={<b style={{ textDecoration: 'underline' }}>* เกี่ยวกับใบงาน. :</b>}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 14px', alignItems: 'center' }}>
              <Ci>เครื่องจักรใช้ใบงานเดิม (กรณีย้ายไซต์ใช้งบโครงการเดิม)</Ci>
              <Ci>ค่าขนส่งเปิดใบงานเฉพาะกร</Ci>
              <Ci>งานใหม่ต้องเปิดใบงานใหม่</Ci>
              <Ci>งาน Support เปิดใบงานเฉพาะกร</Ci>
              <Ci>รถทดแทนต้องเปิดใบงานใหม่</Ci>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 8px', marginTop: 2, alignItems: 'center' }}>
              <Ci>ใบเสนอราคาเลขที่</Ci>
              <b>{v(row.quotationNo)}</b>
            </div>
          </Line>

          {/* * เกี่ยวกับช่าง */}
          <Line head={<b style={{ textDecoration: 'underline' }}>* เกี่ยวกับช่าง :</b>}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 14px', alignItems: 'center' }}>
              {techConds.map((o) => (
                <Ci key={o.id}>{o.name}</Ci>
              ))}
            </div>
          </Line>
        </div>

        {/* 8. หมวดเพิ่มเติมฝ่ายขาย */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 20px', alignItems: 'center', padding: '4px 6px' }}>
          <b>8.หมวดเพิ่มเติมฝ่ายขาย :</b>
          {credits.map((o) => (
            <Sq key={o.id}>{o.name}</Sq>
          ))}
        </div>

        {/* 9. หมายเหตุ อื่นๆ */}
        <div style={{ padding: '4px 6px' }}>
          <b>9. หมายเหตุ อื่นๆ :</b> -
        </div>

        {/* ลงนามส่วนที่ 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '1.5px solid #000' }}>
          <div style={{ padding: '4px 6px' }}>
            <div>ผู้จัดทำ ต้นสังกัด</div>
            <div style={{ textAlign: 'center', fontWeight: 700, marginTop: 4 }}>
              {creator.state === 'done' ? v(creator.actor) : `( รอ ${v(creator.actor)} )`}
            </div>
            <div style={{ marginTop: 2 }}>
              วันที่ <b>{creator.state === 'done' ? v(row.createDate) : '..../..../....'}</b> เวลา{' '}
              <b>{creator.state === 'done' ? v(creator.atShort) : '.....'}</b> น.
            </div>
          </div>
          <div style={{ padding: '4px 6px' }}>
            <div>ผู้ตรวจสอบ ผช.ผจก./ผจก. ต้นสังกัด</div>
            <div style={{ textAlign: 'center', fontWeight: 700, marginTop: 4 }}>
              {creatorMgr.state === 'done' ? v(creatorMgr.actor) : `( รอ ${v(creatorMgr.actor)} )`}
            </div>
            <div style={{ marginTop: 2 }}>
              วันที่ <b>{creatorMgr.state === 'done' ? v(row.createDate) : '..../..../....'}</b> เวลา{' '}
              <b>{creatorMgr.state === 'done' ? v(creatorMgr.atShort) : '.....'}</b> น.
            </div>
          </div>
          <div style={{ padding: '4px 6px' }}>
            <div>ผู้อนุมัติ เจ้าหน้าที่ฝ่าย PL / ผจก. ฝ่าย PL</div>
            <div style={{ textAlign: 'center', fontWeight: 700, marginTop: 4 }}>
              {plStep.state === 'done' ? v(plStep.actor) : `( รอ ${v(plStep.actor)} )`}
            </div>
            <div style={{ marginTop: 2 }}>
              วันที่ <b>{plStep.state === 'done' ? v(row.createDate) : '..../..../....'}</b> เวลา{' '}
              <b>{plStep.state === 'done' ? v(plStep.atShort) : '.....'}</b> น
            </div>
          </div>
        </div>

        {/* ══════════ ส่วนที่ 2 : ฝ่าย PL หยอดเบอร์รถ ══════════ */}
        <div style={{ padding: '2px 6px', fontWeight: 700 }}>
          <span style={{ padding: '0 3px', marginRight: 5 }}>ส่วนที่ 2</span>สำหรับฝ่าย PL หยอดเบอร์รถ
        </div>
        <div style={{ borderBottom: '1px solid #000', padding: '4px 6px' }}>
          {plStatuses.map((o, idx) => (
            <div key={o.id} style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 2, flexWrap: 'wrap' }}>
              <span style={BOX}></span>
              <span style={{ flex: 1, minWidth: 300 }}>{o.name}</span>
              <span style={{ color: '#333' }}>
                {idx === 0
                  ? `หมายเลขรถเช่า : ${rentNo}   สถานะรถ : ${v(MOCK_STEP_DETAIL.pl.carStatus)}   วันที่สิ้นสุดสถานะ : ${v(
                      row.plSupplyDate
                    )}   ชื่อ Operator : ${v(operator)}`
                  : PART2_DETAILS[idx] ?? ''}
              </span>
            </div>
          ))}
          <SignRight
            who="ผู้ยืนยัน"
            role="ผช.ผจก. ฝ่าย SV /ผจก. ฝ่าย SV"
            name={plStep.actor}
            date={row.createDate}
            time={plStep.atShort}
            pending={plStep.state !== 'done'}
          />
        </div>

        {/* ══════════ ส่วนที่ 3 : ฝ่าย SV ยืนยันข้อมูลเบอร์รถ ══════════ */}
        <div style={{ padding: '2px 6px', fontWeight: 700 }}>
          <span style={{ padding: '0 3px', marginRight: 5 }}>ส่วนที่ 3</span>สำหรับฝ่าย SV ยืนยันข้อมูลเบอร์รถ
        </div>
        <div style={{ borderBottom: '1px solid #000', padding: '4px 6px' }}>
          {svStatuses.map((o) => (
            <div key={o.id} style={{ marginBottom: 2 }}>
              <Sq>{o.name}</Sq>
            </div>
          ))}
          <SignRight
            who="ผู้ยืนยันการจัดส่ง"
            role="ผจก. ฝ่ายต้นสังกัด"
            name={svStep.actor}
            date={row.createDate}
            time={svStep.atShort}
            pending={svStep.state !== 'done'}
          />
        </div>

        {/* ══════════ ส่วนที่ 4 : ฝ่ายขาย / ผู้แจ้งจอง ══════════ */}
        <div style={{ padding: '2px 6px', fontWeight: 700 }}>
          <span style={{ padding: '0 3px', marginRight: 5 }}>ส่วนที่ 4</span>
          สำหรับฝ่ายขาย/ผู้แจ้งจอง (เพื่อยืนยันจัดส่งสินค้า หรือ ยกเลิกการจัดส่งสินค้า)
        </div>
        <div style={{ borderBottom: '1.5px solid #000', padding: '4px 6px' }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'baseline', marginBottom: 2, flexWrap: 'wrap' }}>
            <Sq on={row.docStatus === 'approved'}>ยืนยันการจัดส่งสินค้าใช้เครื่องจักรตัวเอง</Sq>
            <span>
              หมายเลขรถเช่า <b>{rentNo}</b>
            </span>
            <span>
              ชื่อ Operator <b>{v(operator)}</b>
            </span>
            <span>
              วันที่เริ่มทำงาน <b>{v(row.startDate)}</b>
            </span>
          </div>
          <div style={{ marginBottom: 2 }}>
            <Sq>ยืนยันการจัดส่งสินค้าใช้รถเช่าช่วงจากบริษัท</Sq>
          </div>
          <Sq on={row.docStatus === 'cancelled' || !!row.remarkCancel}>ยกเลิกการจอง (ระบุสาเหตุ)</Sq>
          <SignRight
            who="ผู้ยืนยันการจัดส่ง"
            role="ผจก. ฝ่ายต้นสังกัด"
            name={finalStep.actor}
            date={row.createDate}
            time={finalStep.atShort}
            pending={finalStep.state !== 'done'}
          />
        </div>

        {/* ══════════ หมายเหตุ / กติกา / รหัสฟอร์ม ══════════ */}
        <div style={{ padding: '4px 6px', fontSize: 8, lineHeight: 1.35 }}>
          <div style={{ fontWeight: 700 }}>หมายเหตุ &nbsp; ข้อกำหนด / กรอบเวลา การส่งเอกสารใบจองสินค้า</div>
          <div style={{ fontWeight: 700, marginTop: 2 }}>1. ) กติกา การจอง/จัดส่ง SV-HV , PL ตอบไม่เกิน 11.00 น. ม 14.00 น. ในวันนั้น</div>
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '1px 6px', marginTop: 2 }}>
            <div>1.1 ฝ่ายขาย</div>
            <div>SL-HV คีย์แผนขายทุกวันพุธ กรณีฝ่ายขายไปพบลูกค้า เจ้าหน้าที่ธุรการจะคีย์ข้อมูลแทน</div>
            <div>1.2 ฝ่ายขาย</div>
            <div>SL-Mgr นำส่งแผนขายให้ AD , SV , PL , HR และ IM รับทราบทุกวันพฤหัสบดี เวลา 16.00 น</div>
            <div>1.3 จองในแผนขาย</div>
            <div>
              SL-Mgr ทวนสอบข้อมูลแผนขาย พร้อมทั้ง Approved Step3 ทุกวันศุกร์ ภายในเวลา 10.00 น PL , SV ตอบกลับภายในเวลา 11.00 น
              ทุกรายการตามใบจองสินค้าที่ได้รับ
            </div>
            <div>1.4 จองนอกแผนขาย</div>
            <div>
              SL-HV เขียนใบจองสินค้า/คีย์แผนขาย(ไม่อยู่ในแผนขายวันพฤหัสบดี) SL-Mgr ทวนสอบพร้อม Approved Step3 ให้ PL ภายในเวลา 10.00 น ,
              13.00 น PL , SV ประชุมสอบถามกรอกข้อมูลตอบกลับ ภายในเวลา 11.00 น , 14.00 น SL-Mgr , SL-Asst-Mgr (แทน)
              ยืนยันการจัดส่งภายในเวลา 14.30 น
            </div>
            <div>1.5 ฉุกเฉิน</div>
            <div>
              SL-HV เขียนใบจองสินค้า/คีย์แผนขาย (ไม่อยู่ในแผนขายวันพฤหัสบดี และเป็นการจอง เริ่มงานวันถัดไปนับจากวันที่จองรถ) SL-Mgr
              ทวนสอบพร้อม Approved Step3 ให้ PL หลังเวลา 10.00 น PL , SV ประชุมสอบถามกรอกข้อมูลตอบกลับ ภายในเวลา 12.00น SL-Mgr /
              SL-Asst-Mgr (แทน) ยืนยันการจัดส่งภายในเวลา 13.00น
            </div>
            <div>หมายเหตุ :</div>
            <div>
              เจ้าหน้าที่ธุรการขาย/เจ้าหน้าที่ PL รายงานใบจองสินค้า / ใบจัดส่งสินค้า / ใบเปลี่ยนจัดส่งจัดส่งตัดกลับ(ถ้ามี) /ใบตัดกลับ
              (ถ้ามี) ในกลุ่ม Focus SL จอง-รับจอง ยืนยันให้จัดส่ง-ยืนยันจัดส่ง
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontWeight: 600 }}>
            <span>(P)FM-BC/SL-001/12</span>
            <span>REV.08 (21/04/69)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
