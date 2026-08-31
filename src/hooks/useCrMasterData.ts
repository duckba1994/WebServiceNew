import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchCrMasterData } from '../api/masterData';
import { CrMasterDataApi } from '../types/masterData';
import { FieldOption } from '../data/requestForm';

const EMPTY: CrMasterDataApi = { sections: [], requestTypes: [], requestSubTypes: [] };

// ── ตัวเลือกของใบแจ้งเรื่อง CR (GET /MasterData/cr) ───────────
// เป็นชุดลูกโซ่ 3 ชั้น: ส่วนงาน → ประเภทที่แจ้ง → รายละเอียดที่แจ้ง
//
// ⚠️ id ซ้ำข้ามส่วนงาน (HV/FL ต่างมี id 1) จึงต้องกรองด้วย section ทุกครั้ง
//    ไม่งั้นเลือก "รถยก" แล้วจะได้รายการของ "รถใหญ่" ปนมา
export function useCrMasterData(token?: string, enabled = true) {
  const [data, setData] = useState<CrMasterDataApi>(EMPTY);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setData(EMPTY);
      setLoading(false);
      setError(null);
      return;
    }
    let alive = true;
    setLoading(true);
    setError(null);
    fetchCrMasterData(token)
      .then((res) => {
        if (!alive) return;
        setData({
          sections: res?.sections ?? [],
          requestTypes: res?.requestTypes ?? [],
          requestSubTypes: res?.requestSubTypes ?? [],
        });
      })
      .catch(() => {
        if (!alive) return;
        setData(EMPTY);
        setError('โหลดตัวเลือกของแผนก CR ไม่สำเร็จ');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [token, enabled, reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  // ส่วนงานเก็บเป็น "code" (HV/FL) ไม่ใช่ชื่อ — เพราะ code คือคีย์ที่ requestTypes
  // และ requestSubTypes ใช้อ้างถึง และ API รับ section เป็นโค้ดด้วย
  // (ต่างจากฟิลด์อื่นของ IT/PL ที่เก็บชื่อ)
  // ป้ายบนปุ่มคือโค้ด ส่วนชื่อไทยเป็นข้อความรองไว้ช่วยอ่าน
  const sectionOptions: FieldOption[] = useMemo(
    () => data.sections.map((s) => ({ value: s.code, label: s.code, sub: s.name })),
    [data.sections]
  );

  // ประเภทที่แจ้งของส่วนงานที่เลือก (ยังไม่เลือกส่วนงาน = ไม่มีตัวเลือก)
  const requestTypeOptions = useCallback(
    (sectionCode: string): FieldOption[] =>
      sectionCode
        ? data.requestTypes
            .filter((t) => t.section === sectionCode)
            .map((t) => ({ value: t.name, label: t.name }))
        : [],
    [data.requestTypes]
  );

  // รายละเอียดที่แจ้งของ (ส่วนงาน + ประเภทที่แจ้ง) ที่เลือก
  // ฟอร์มเก็บ "ชื่อ" ประเภทไว้ จึงต้องย้อนหา id ของประเภทในส่วนงานนั้นก่อน
  const requestSubTypeOptions = useCallback(
    (sectionCode: string, requestTypeName: string): FieldOption[] => {
      if (!sectionCode || !requestTypeName) return [];
      const type = data.requestTypes.find(
        (t) => t.section === sectionCode && t.name === requestTypeName
      );
      if (!type) return [];
      return data.requestSubTypes
        .filter((s) => s.section === sectionCode && s.requestTypeId === type.id)
        .map((s) => ({ value: s.name, label: s.name }));
    },
    [data.requestTypes, data.requestSubTypes]
  );

  return { cr: data, sectionOptions, requestTypeOptions, requestSubTypeOptions, loading, error, reload };
}

export type CrMasterData = ReturnType<typeof useCrMasterData>;
