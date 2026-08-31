import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchPlMasterData } from '../api/masterData';
import { MasterOptionApi, PlMasterDataApi } from '../types/masterData';
import { FieldOption } from '../data/requestForm';

const EMPTY: PlMasterDataApi = { sites: [], types: [], requestTypes: [], units: [] };

// ⚠️ value = ชื่อ ไม่ใช่ id — ทั้ง POST/PUT ของใบ PL เก็บ "ชื่อ" ลง DB
// (PlRequestPayload.type / requestType) และใบที่โหลดกลับมาก็เป็นชื่อ
// ถ้าเก็บ id ไว้ในฟอร์ม ค่าที่โหลดมาจะไม่ตรงกับตัวเลือกไหนเลย select จะเด้งว่าง
const toNameOptions = (rows: MasterOptionApi[]): FieldOption[] =>
  rows.map((r) => ({ value: r.name, label: r.name }));

// ── ตัวเลือกของใบแจ้งเรื่อง PL (GET /MasterData/pl) ───────────
// ใช้ที่ฟอร์มสร้างใบ (ประเภท / เรื่องที่แจ้ง / หน่วยของรายการที่ขอ)
// และฟอร์มแก้ไขใบในหน้ารายละเอียด
//
// enabled = ยิงเฉพาะตอนอยู่กับใบ/ฟอร์มของแผนก PL
export function usePlMasterData(token?: string, enabled = true) {
  const [data, setData] = useState<PlMasterDataApi>(EMPTY);
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
    fetchPlMasterData(token)
      .then((res) => {
        if (!alive) return;
        setData({
          sites: res?.sites ?? [],
          types: res?.types ?? [],
          requestTypes: res?.requestTypes ?? [],
          units: res?.units ?? [],
        });
      })
      .catch(() => {
        if (!alive) return;
        setData(EMPTY);
        setError('โหลดตัวเลือกของแผนก PL ไม่สำเร็จ');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [token, enabled, reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  const typeOptions = useMemo(() => toNameOptions(data.types), [data.types]);
  const requestTypeOptions = useMemo(() => toNameOptions(data.requestTypes), [data.requestTypes]);
  const unitNames = useMemo(() => data.units.map((u) => u.name), [data.units]);

  return { pl: data, typeOptions, requestTypeOptions, unitNames, loading, error, reload };
}

export type PlMasterData = ReturnType<typeof usePlMasterData>;
