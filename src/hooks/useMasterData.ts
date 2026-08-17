// โหลด Master Data ทั้งหมดสำหรับฟอร์มเพิ่มแผนขาย (data-fetching แยกออกจาก UI).
// - โหลดครั้งเดียวตอน mount (และเมื่อ token เปลี่ยน)
// - endpoint ไหนพลาดจะไม่ล้มทั้งชุด แต่ "ต้องแจ้งผู้ใช้" ผ่าน error (ห้ามกลืนเงียบ)
import { useCallback, useEffect, useState } from 'react';
import {
  fetchSalesmen,
  fetchContactChannels,
  fetchLeadSources,
  fetchCustomers,
  fetchProvinces,
  fetchMachineTypes,
  fetchPlanStatuses,
} from '../api/masterData';
import {
  SalesmanApi,
  ContactChannelApi,
  LeadSourceApi,
  CustomerApi,
  ProvinceApi,
  MachineTypeApi,
  PlanStatusApi,
} from '../types/masterData';

export interface MasterData {
  salesmen: SalesmanApi[];
  contactChannels: ContactChannelApi[];
  leadSources: LeadSourceApi[];
  customers: CustomerApi[];
  provinces: ProvinceApi[];
  machineTypes: MachineTypeApi[];
  planStatuses: PlanStatusApi[];
}

const EMPTY_MASTER: MasterData = {
  salesmen: [],
  contactChannels: [],
  leadSources: [],
  customers: [],
  provinces: [],
  machineTypes: [],
  planStatuses: [],
};

export interface UseMasterDataResult {
  master: MasterData;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useMasterData(token?: string): UseMasterDataResult {
  const [master, setMaster] = useState<MasterData>(EMPTY_MASTER);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // เพิ่มค่าเพื่อ trigger โหลดใหม่ (ปุ่มลองใหม่)
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    Promise.allSettled([
      fetchSalesmen(token),
      fetchContactChannels(token),
      fetchLeadSources(token),
      fetchCustomers(token),
      fetchProvinces(token),
      fetchMachineTypes(token),
      fetchPlanStatuses(token),
    ]).then(([sm, cc, ls, cu, pv, mt, ps]) => {
      if (!alive) return;
      setMaster({
        salesmen: sm.status === 'fulfilled' ? sm.value : [],
        contactChannels: cc.status === 'fulfilled' ? cc.value : [],
        leadSources: ls.status === 'fulfilled' ? ls.value : [],
        customers: cu.status === 'fulfilled' ? cu.value : [],
        provinces: pv.status === 'fulfilled' ? pv.value : [],
        machineTypes: mt.status === 'fulfilled' ? mt.value : [],
        planStatuses: ps.status === 'fulfilled' ? ps.value : [],
      });
      // แจ้งผู้ใช้ถ้ามีบางส่วนโหลดไม่สำเร็จ (ไม่กลืน error เงียบ)
      const failed = [sm, cc, ls, cu, pv, mt, ps].filter((r) => r.status === 'rejected').length;
      setError(failed > 0 ? `โหลดข้อมูลตั้งต้นไม่สำเร็จ ${failed} รายการ` : null);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [token, reloadKey]);

  return { master, loading, error, reload };
}
