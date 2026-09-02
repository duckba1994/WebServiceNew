const fs = require('fs');
const E = (p) => {
  const raw = fs.readFileSync(p, 'utf8');
  const crlf = raw.indexOf('\r\n') >= 0;
  const st = { s: raw.split('\r\n').join('\n') };
  return {
    rep(a, b, many) {
      const n = st.s.split(a).length - 1;
      if (n === 0) throw new Error(p + ' :: 0 :: ' + a.slice(0, 70));
      if (n > 1 && !many) throw new Error(p + ' :: ' + n + ' :: ' + a.slice(0, 70));
      st.s = st.s.split(a).join(b);
      return this;
    },
    save() { fs.writeFileSync(p, crlf ? st.s.split('\n').join('\r\n') : st.s, 'utf8'); },
  };
};

// ══════════ requestForm.ts ══════════
const F = E('src/data/requestForm.ts');
// ฟิลด์ส่วนกลางไปอยู่ "ข้างใน" กล่องของแผนกได้ ไม่ต้องแตกเป็นกล่องใหม่
F.rep(`  commonTitle?: string; // หัวข้อของส่วนกลาง (ไม่ระบุ = "ข้อมูลเรื่องที่แจ้ง")
  // แทรกส่วนกลางไว้ลำดับที่เท่าไรของ sections (0 = บนสุด, ไม่ระบุ = 0)
  commonPosition?: number;`,
`  commonTitle?: string; // หัวข้อของส่วนกลาง (ไม่ระบุ = "เรื่องที่แจ้ง")
  // แทรกส่วนกลางไว้ลำดับที่เท่าไรของ sections (0 = บนสุด, ไม่ระบุ = 0)
  commonPosition?: number;
  // เรนเดอร์ฟิลด์ส่วนกลางต่อท้าย "ข้างใน" กล่องที่ชื่อนี้ แทนที่จะแยกเป็นกล่องใหม่
  // (ผู้ใช้สั่ง 2 ก.ย. 2026: รายละเอียด = เนื้อของเรื่องที่แจ้ง ไม่ใช่กล่องของตัวเอง)
  // ระบุแล้ว commonTitle/commonPosition จะไม่ถูกใช้
  commonInto?: string;`)
// CR — รายละเอียดไปอยู่ท้ายกล่อง "เรื่องที่แจ้ง"
  .rep(`    common: ['detail'],
    commonTitle: 'รายละเอียด',
    commonPosition: 2, // ผู้แจ้ง → เรื่องที่แจ้ง → รายละเอียด
    summaryKey: 'requestType', // ใช้ "ประเภทที่แจ้ง" เป็นชื่อเรื่องในหน้าสรุป
    // แยกเป็น 3 กล่องตามชุดมาตรฐาน (ผู้ใช้สั่ง 2 ก.ย. 2026)`,
`    common: ['detail'],
    commonInto: 'เรื่องที่แจ้ง', // ช่องรายละเอียดต่อท้ายกล่องเรื่องที่แจ้ง
    summaryKey: 'requestType', // ใช้ "ประเภทที่แจ้ง" เป็นชื่อเรื่องในหน้าสรุป
    // กล่องมาตรฐาน (ผู้ใช้สั่ง 2 ก.ย. 2026): ผู้แจ้ง / เรื่องที่แจ้ง / รายการที่ขอ / รูปภาพ`)
// IT — ไม่มีช่องเลือกอะไร กรอกแค่รายละเอียด กล่องนั้นจึงคือ "เรื่องที่แจ้ง"
  .rep(`    commonTitle: 'รายละเอียด',
    commonPosition: 1, // ผู้แจ้ง → รายละเอียด → รูปภาพ`,
`    commonTitle: 'เรื่องที่แจ้ง',
    commonPosition: 1, // ผู้แจ้ง → เรื่องที่แจ้ง → รูปภาพ`)
// PL — ยุบกล่อง "รายละเอียด" กลับเข้าไปในกล่องเรื่องที่แจ้ง
  .rep(`        ],
      },
      {
        // กล่องมาตรฐานลำดับที่ 3 ของทุกแผนก (ผู้ใช้สั่ง 2 ก.ย. 2026)
        title: 'รายละเอียด',
        fields: [
          {
            key: 'topicDetail',`,
`          {
            key: 'topicDetail',`);
F.save();

// ══════════ CreateItem.tsx ══════════
const C = E('src/pages/CreateItem.tsx');
// แยก "แถวของส่วนกลาง" ออกจากกล่อง เพื่อเอาไปวางในกล่องของแผนกได้
C.rep(`  const renderCommonSection = (no: number) => (
    <SectionCard
      key="__common"
      no={no}
      title={cfg.commonTitle ?? 'เรื่องที่แจ้ง'}
      accentColor={accentColor}
    >`,
`  const commonRows = (
    <>`)
  .rep(`          {f.detail.length}/{DETAIL_MAX_LEN}
        </span>
        </FormRow>
      )}
    </SectionCard>
  );`,
`          {f.detail.length}/{DETAIL_MAX_LEN}
        </span>
        </FormRow>
      )}
    </>
  );

  const renderCommonSection = (no: number) => (
    <SectionCard key="__common" no={no} title={cfg.commonTitle ?? 'เรื่องที่แจ้ง'} accentColor={accentColor}>
      {commonRows}
    </SectionCard>
  );`)
// กล่องของแผนกที่ถูกระบุใน commonInto = เอาแถวส่วนกลางมาต่อท้ายข้างใน
  .rep(`          {renderField(fd)}
        </FormRow>
      ))}
    </SectionCard>
  ));`,
`          {renderField(fd)}
        </FormRow>
      ))}
      {/* ฟิลด์ส่วนกลางของแผนกที่ให้รวมอยู่ในกล่องนี้ (เช่น รายละเอียดของ CR) */}
      {cfg.commonInto === sec.title && commonFields.length > 0 && commonRows}
    </SectionCard>
  ));`)
  .rep(`  const orderedSections = [...deptSections];
  if (commonFields.length > 0) {`,
`  const orderedSections = [...deptSections];
  if (commonFields.length > 0 && !cfg.commonInto) {`);
C.save();
console.log('done');
