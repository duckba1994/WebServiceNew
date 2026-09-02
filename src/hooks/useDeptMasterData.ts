import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchDeptMasterData } from '../api/masterData';
import { DeptMasterDataApi, DeptMasterOptionApi, PsEstimateApi } from '../types/masterData';
import { FieldOption } from '../data/requestForm';

const EMPTY: DeptMasterDataApi = {};

// ⚠️ value = "ชื่อ" ไม่ใช่ id (ยกเว้นส่วนงานที่เก็บ code) — ใบแจ้งเรื่องเก็บชื่อลง DB
// ถ้าเก็บ id ค่าที่โหลดกลับมาจะไม่ตรงกับตัวเลือกไหนเลย select จะเด้งว่าง (ดู CLAUDE.md)
const toNameOptions = (rows: DeptMasterOptionApi[]): FieldOption[] =>
  rows.map((r) => ({ value: r.name, label: r.name }));

// กรองตามส่วนงานที่เลือก — แต่เฉพาะเมื่อ API ผูก section มากับแถวจริง ๆ
// แผนกที่ไม่มีส่วนงาน (GA/IM/AF) ไม่มีฟิลด์ section ในฟอร์ม → ได้ทุกแถวเหมือนเดิม
const bySection = (rows: DeptMasterOptionApi[], section: string): DeptMasterOptionApi[] =>
  section && rows.some((r) => r.section) ? rows.filter((r) => r.section === section) : rows;

// วันที่ของใบประเมินราคา — ช่องนี้เป็นข้อความอ่านอย่างเดียว จึงแปลง ISO ให้อ่านง่าย
// ส่งอะไรมาที่ไม่ใช่วันที่ (เช่นจัดรูปแบบมาแล้ว) ก็แสดงตามนั้น ไม่ไปยุ่ง
const dateText = (v?: string): string => {
  if (!v) return '';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString('en-GB');
};

// ── ตัวเลือกของใบแจ้งเรื่องรายแผนก (GET /MasterData/{ga|im|af|sv|sqa}) ──
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
          units: res?.units ?? [],
          estimates: res?.estimates ?? [],
        });
      })
      .catch(() => {
        if (!alive) return;
        setData(EMPTY);
        setError(`โหลดตัวเลือกของแผนก ${dept} ไม่สำเร็จ`);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [dept, token, reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  // ส่วนงานเก็บเป็น code (HV/FL) เพราะเป็นคีย์ที่รายการชั้นล่างใช้อ้างถึง
  // ป้ายบนปุ่มคือ code ส่วนชื่อไทยเป็นข้อความรองไว้ช่วยอ่าน (เหมือน CR)
  const sectionOptions: FieldOption[] = useMemo(
    () => (data.sections ?? []).map((s) => ({ value: s.code, label: s.code, sub: s.name })),
    [data.sections]
  );

  const typeOptions = useCallback(
    (section = ''): FieldOption[] => toNameOptions(bySection(data.types ?? [], section)),
    [data.types]
  );

  const requestTypeOptions = useCallback(
    (section = ''): FieldOption[] => toNameOptions(bySection(data.requestTypes ?? [], section)),
    [data.requestTypes]
  );

  // รายการชั้นที่ 3 (SQA: รายละเอียดที่แจ้ง) — ฟอร์มเก็บ "ชื่อ" ของประเภทไว้
  // จึงต้องย้อนหา id ของประเภทก่อน แล้วค่อยกรองลูกด้วย typeId
  // API ยังไม่ผูก typeId มา = ยังไม่แยกตามประเภท → คืนทั้งหมด (ดีกว่าเงียบเป็นรายการว่าง)
  const subTypeOptions = useCallback(
    (section = '', typeName = ''): FieldOption[] => {
      const rows = bySection(data.requestSubTypes ?? [], section);
      if (!typeName || !rows.some((r) => r.typeId !== undefined)) return toNameOptions(rows);
      const type = bySection(data.types ?? [], section).find((t) => t.name === typeName);
      if (!type) return [];
      return toNameOptions(rows.filter((r) => r.typeId === type.id));
    },
    [data.requestSubTypes, data.types]
  );

  const unitNames = useMemo(() => (data.units ?? []).map((u) => u.name), [data.units]);

  // ใบประเมินราคา (PS) — ตัวเลือกหิ้ว "ข้อมูลทั้งใบ" มาด้วยใน data
  // เลือกเลขที่ใบแล้วหน้าเว็บเอา data ไปเติมช่องอ่านอย่างเดียวตามที่ฟิลด์ประกาศไว้ใน fills
  // คีย์ใน data ต้องตรงกับ key ของฟิลด์ปลายทาง (ดู DEPT_FORMS.PS)
  const estimateOptions: FieldOption[] = useMemo(
    () =>
      (data.estimates ?? []).map((e: PsEstimateApi) => ({
        value: e.docNo,
        label: e.docNo,
        // ข้อความรอง = เครื่องจักรของใบนั้น (SearchSelect ใช้ค้นหาได้ด้วย)
        sub: [e.machineNo, e.machineType].filter(Boolean).join(' · ') || undefined,
        data: {
          estDate: dateText(e.docDate),
          estMachineType: e.machineType ?? '',
          estEngineModel: e.engineModel ?? '',
          estSerialNo: e.serialNo ?? '',
          estMachineNo: e.machineNo ?? '',
          estMachineModel: e.machineModel ?? '',
          estSystem: e.system ?? '',
          estSymptom: e.symptom ?? '',
          estRemark: e.remark ?? '',
        },
      })),
    [data.estimates]
  );

  return {
    master: data,
    estimateOptions,
    sectionOptions,
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
