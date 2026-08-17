import { apiFetch } from './client';
import { SalesPlanApi, SalesPlanLineApi } from '../types/salesPlan';

// GET /api/v1/SalesPlans — รายการหัวเอกสารแผนขาย (สำหรับ combobox เลขที่เอกสาร)
export async function fetchSalesPlans(token?: string): Promise<SalesPlanApi[]> {
  const res = await apiFetch('/SalesPlans', { token });
  if (!res.ok) throw new Error(`โหลดรายการแผนขายไม่สำเร็จ (HTTP ${res.status})`);
  return res.json();
}

// GET /api/v1/SalesPlans/lines?planId={planId}&planType={planType} — บรรทัดรายละเอียดของแผนขายที่เลือก
// planId/planType ส่งเป็น query param (planId มี '/' จึงต้อง encode เป็น %2F)
// planType มาจาก header ของแผนที่เลือก (เช่น 'H') ; salemanId ฝั่ง API ดึงจาก token เอง
export async function fetchSalesPlanLines(
  planId: string,
  planType: string,
  token?: string
): Promise<SalesPlanLineApi[]> {
  const qs = `planId=${encodeURIComponent(planId)}&planType=${encodeURIComponent(planType)}`;
  const res = await apiFetch(`/SalesPlans/lines?${qs}`, { token });
  if (!res.ok) throw new Error(`โหลดรายละเอียดแผนขายไม่สำเร็จ (HTTP ${res.status})`);
  return res.json();
}
