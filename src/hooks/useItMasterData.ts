import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchItMasterData } from '../api/masterData';
import { ItMasterDataApi, ItOptionApi, ItSubCauseApi } from '../types/masterData';

const EMPTY: ItMasterDataApi = { solutions: [], repairStatuses: [], mainCauses: [], subCauses: [] };

const names = (rows: ItOptionApi[]) => rows.map((r) => r.name);

// ── ตัวเลือกของใบแจ้งเรื่อง IT (GET /MasterData/it) ───────────
// ใช้ที่แท็บ "ดำเนินการ" (repairStatuses) และ "ปิดงานรับเรื่อง"
// (solutions / mainCauses / subCauses) — เดิม hardcode ไว้ในหน้าจอ
//
// enabled = ยิงเฉพาะใบโมดูล IT (ใบแผนกอื่นไม่มีแท็บที่ใช้ชุดนี้)
export function useItMasterData(token?: string, enabled = true) {
  const [data, setData] = useState<ItMasterDataApi>(EMPTY);
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
    fetchItMasterData(token)
      .then((res) => {
        if (!alive) return;
        setData({
          solutions: res?.solutions ?? [],
          repairStatuses: res?.repairStatuses ?? [],
          mainCauses: res?.mainCauses ?? [],
          subCauses: res?.subCauses ?? [],
        });
      })
      .catch(() => {
        if (!alive) return;
        setData(EMPTY);
        setError('โหลดตัวเลือกของแผนก IT ไม่สำเร็จ');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [token, enabled, reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  // ชื่อล้วน — ค่าที่ส่งกลับไปกับ action เป็นข้อความ ไม่ใช่ id
  const solutionNames = useMemo(() => names(data.solutions), [data.solutions]);
  const repairStatusNames = useMemo(() => names(data.repairStatuses), [data.repairStatuses]);
  const mainCauseNames = useMemo(() => names(data.mainCauses), [data.mainCauses]);

  // สาเหตุรองของสาเหตุหลักที่เลือก (เทียบด้วยชื่อ เพราะ state ของฟอร์มเก็บชื่อ)
  // ยังไม่เลือกสาเหตุหลัก → ไม่มีตัวเลือก กันเลือกคู่ที่ไม่เข้ากัน
  const subCausesOf = useCallback(
    (mainCauseName: string): string[] => {
      if (!mainCauseName) return [];
      const main = data.mainCauses.find((m) => m.name === mainCauseName);
      if (!main) return [];
      return data.subCauses.filter((s: ItSubCauseApi) => s.mainCauseId === main.id).map((s) => s.name);
    },
    [data.mainCauses, data.subCauses]
  );

  return {
    it: data,
    solutionNames,
    repairStatusNames,
    mainCauseNames,
    subCausesOf,
    loading,
    error,
    reload,
  };
}

export type ItMasterData = ReturnType<typeof useItMasterData>;
