import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchDeptMasterData } from '../api/masterData';
import { DeptMasterDataApi, DeptMasterOptionApi } from '../types/masterData';
import { FieldOption } from '../data/requestForm';

const EMPTY: DeptMasterDataApi = {};

// ⚠️ value = "ชื่อ" ไม่ใช่ id (ยกเว้นส่วนงานที่เก็บ code) — ใบแจ้งเรื่องเก็บชื่อลง DB
// ถ้าเก็บ id ค่าที่โหลดกลับมาจะไม่ตรงกับตัวเลือกไหนเลย select จะเด้งว่าง (ดู CLAUDE.md)
// บาง master มีแถวชื่อว่าง (HR id 0 · SV id 1) — เป็นตัวเลือกเปล่าหัว dropdown ของเว็บเก่า
// ตัดทิ้งเพราะช่อง "-- เลือก --" ของหน้านี้ทำหน้าที่นั้นแล้ว และห้ามให้บันทึกค่าว่าง
// ⚠️ ตัดเฉพาะแถวที่ว่างจริง — ค่าที่ส่งกลับต้องเป็นชื่อดิบ ห้าม trim (ระบบเก่าเทียบสตริงตรง ๆ)
const toNameOptions = (rows: DeptMasterOptionApi[]): FieldOption[] =>
  rows
    .filter((r) => (r.name ?? '').trim() !== '')
    .map((r) => ({ value: r.name, label: r.name }));

// กรองตามส่วนงานที่เลือก — แต่เฉพาะเมื่อ API ผูก section มากับแถวจริง ๆ
// แผนกที่ไม่มีส่วนงาน (GA/IM/AF) ไม่มีฟิลด์ section ในฟอร์ม → ได้ทุกแถวเหมือนเดิม
const bySection = <T extends DeptMasterOptionApi>(rows: T[], section: string): T[] =>
  section && rows.some((r) => r.section) ? rows.filter((r) => r.section === section) : rows;

// ── ตัวเลือกของใบแจ้งเรื่องรายแผนก (GET /MasterData/{hr|ga|im|af|sv|sqa|ps}) ──
// ทุกแผนกในกลุ่มนี้ใช้สัญญาเดียวกัน (DeptMasterDataApi) ต่างแค่ endpoint
// จึงเป็นฮุคตัวเดียว รับ departmentShort เข้ามาแล้วยิงเส้นของแผนกนั้น
//
// dept = null → ไม่ยิง (แผนกนี้ไม่ได้ใช้ master ชุดนี้)
export function useDeptMasterData(dept: string | null, token?: string) {
  const [data, setData] = useState<DeptMasterDataApi>(EMPTY);
  const [loading, setLoading] = useState(!!dept);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!dept) {
      setData(EMPTY);
      setLoading(false);
      setError(null);
      return;
    }
    let alive = true;
    setLoading(true);
    setError(null);
    fetchDeptMasterData(dept, token)
      .then((res) => {
        if (!alive) return;
        setData({
          sections: res?.sections ?? [],
          types: res?.types ?? [],
          requestTypes: res?.requestTypes ?? [],
          requestSubTypes: res?.requestSubTypes ?? [],
          requestDetails: res?.requestDetails ?? [],
          units: res?.units ?? [],
        });
      })
      .catch(() => {
        if (!alive) return;
        setData(EMPTY);
        setError(`โหลดตัวเลือกของแผนก ${dept.toUpperCase()} ไม่สำเร็จ`);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [dept, token, reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  // ไม่มี sectionOptions ที่นี่ — ช่อง "ส่วนงาน" ของทุกฟอร์มใช้รายการ HV/FL ชุดเดียว
  // จาก GET /MasterData/cr (ดู useCrMasterData / MasterListKey 'crSections')
  // แผนกนี้ส่ง sections มาก็ไม่ได้ใช้ แต่ section ที่ผูกกับแถวอื่นต้องเป็นโค้ดชุดเดียวกัน
  const typeOptions = useCallback(
    (section = ''): FieldOption[] => toNameOptions(bySection(data.types ?? [], section)),
    [data.types]
  );

  const requestTypeOptions = useCallback(
    (section = ''): FieldOption[] => toNameOptions(bySection(data.requestTypes ?? [], section)),
    [data.requestTypes]
  );

  // รายการชั้นที่ 3 (รายละเอียดที่แจ้ง) — สองรูปแบบ:
  // SQA ส่งมาที่ requestDetails ผูกกับ "ประเภทเรื่องที่แจ้ง" ด้วยชื่อ (id ซ้ำข้ามส่วนงาน
  // จึงห้าม join ด้วย id เดี่ยว ๆ) · แผนกอื่นส่ง requestSubTypes ผูกกับ types ด้วย typeId
  // ประเภทที่ไม่มีลูกผูกไว้เลยต้องได้รายการว่าง (SQA "การขนย้าย" ของ FL เป็นแบบนั้นจริง ๆ)
  // ไม่ผูกอะไรมาเลย = ยังไม่แยกตามประเภท → คืนทั้งหมด (ดีกว่าเงียบเป็นรายการว่าง)
  const subTypeOptions = useCallback(
    (section = '', typeName = ''): FieldOption[] => {
      const details = bySection(data.requestDetails ?? [], section);
      if (details.length) {
        if (!typeName || !details.some((d) => d.requestType)) return toNameOptions(details);
        return toNameOptions(details.filter((d) => d.requestType === typeName));
      }
      const rows = bySection(data.requestSubTypes ?? [], section);
      if (!typeName || !rows.some((r) => r.typeId !== undefined)) return toNameOptions(rows);
      const type = bySection(data.types ?? [], section).find((t) => t.name === typeName);
      if (!type) return [];
      return toNameOptions(rows.filter((r) => r.typeId === type.id));
    },
    [data.requestDetails, data.requestSubTypes, data.types]
  );

  const unitNames = useMemo(() => (data.units ?? []).map((u) => u.name), [data.units]);

  return {
    master: data,
    typeOptions,
    requestTypeOptions,
    subTypeOptions,
    unitNames,
    loading,
    error,
    reload,
  };
}

export type DeptMasterData = ReturnType<typeof useDeptMasterData>;
