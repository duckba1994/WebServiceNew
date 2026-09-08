import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchPsPrelim, fetchPsPrelims } from '../api/masterData';
import { PsPrelimApi } from '../types/masterData';
import { FieldOption } from '../data/requestForm';

// วันที่ของใบประเมิน — ช่องบนฟอร์มเป็นข้อความอ่านอย่างเดียว จึงแปลง ISO ให้อ่านง่าย
// ส่งอะไรมาที่ไม่ใช่วันที่ (เช่นจัดรูปแบบมาแล้ว) ก็แสดงตามนั้น ไม่ไปยุ่ง
const dateText = (v?: string | null): string => {
  if (!v) return '';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString('en-GB');
};

// ข้อมูลใบประเมิน → ช่องอ่านอย่างเดียว 9 ช่องบนฟอร์ม PS
// ⚠️ คีย์ต้องตรงกับ FieldDef.fills ของช่อง "เลขที่ใบประเมินราคา" (ดู DEPT_FORMS.PS)
// ⚠️ ชื่อ field ฝั่ง API เป็นภาษาของระบบซ่อม (car*/group*) ไม่ได้สื่อถึงป้ายบนฟอร์มตรง ๆ —
//    คู่ที่ถูกต้องอยู่ในคู่มือ MasterData ข้อ 4.1 อย่าจับคู่เอาเองจากชื่อ
//    (groupName = ระบบ · subGroupName = รายละเอียดอาการ · reComment = รายละเอียดเพิ่มเติม)
export const prelimToFields = (p: PsPrelimApi): Record<string, string> => ({
  estDate: dateText(p.prelimDate),
  estMachineType: p.carType ?? '',
  estEngineModel: p.carEngineNo ?? '',
  estSerialNo: p.carSerial ?? '',
  estMachineNo: p.carId ?? '',
  estMachineModel: p.carModel ?? '',
  estSystem: p.groupName ?? '',
  estSymptom: p.subGroupName ?? '',
  estRemark: p.reComment ?? '',
});

export type PrelimDetail =
  | { ok: true; fields: Record<string, string> }
  | { ok: false; error: string };

// ── เลขที่ใบประเมินของ PS (GET /MasterData/ps/prelims) ──────────
// ต่างจาก master ชุดอื่นตรงที่ข้อมูลมาจากฐานของระบบซ่อมและเดินตลอดเวลา
// จึงโหลดใหม่ทุกครั้งที่เปิดฟอร์ม ไม่เก็บไว้ใช้ข้ามวัน (ดู PsPrelimApi)
//
// รายการเป็นเลขที่ใบล้วน ๆ (เฉพาะใบที่ยังเปิดอยู่) ส่วนรายละเอียดของแต่ละใบ
// อยู่คนละเส้น จึงยิงตอนผู้ใช้เลือกเท่านั้น (loadDetail)
export function usePsPrelims(token?: string, enabled = true) {
  const [ids, setIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setIds([]);
      setLoading(false);
      setError(null);
      return;
    }
    let alive = true;
    setLoading(true);
    setError(null);
    fetchPsPrelims(token)
      .then((res) => {
        if (alive) setIds(res ?? []);
      })
      .catch(() => {
        if (!alive) return;
        setIds([]);
        setError('โหลดรายการเลขที่ใบประเมินไม่สำเร็จ');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [token, enabled, reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  const options: FieldOption[] = useMemo(() => ids.map((id) => ({ value: id, label: id })), [ids]);

  // รายละเอียดของใบที่เลือก — คืนเป็นผลลัพธ์ ไม่โยน error เพราะฝั่งเรียกต้องแสดง
  // ข้อความให้ผู้ใช้อ่านตรงใต้ช่อง (404 = "ไม่พบข้อมูล ID : xxx" ตามข้อความของเดิม)
  const loadDetail = useCallback(
    async (id: string): Promise<PrelimDetail> => {
      try {
        return { ok: true, fields: prelimToFields(await fetchPsPrelim(id, token)) };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : 'ดึงข้อมูลใบประเมินไม่สำเร็จ' };
      }
    },
    [token]
  );

  return { options, loading, error, reload, loadDetail };
}
