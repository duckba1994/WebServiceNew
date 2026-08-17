// โหลดเอกสารแผนขาย (data-fetching แยกออกจาก UI)
// - plans: รายการหัวเอกสาร (combobox เลขที่เอกสาร)
// - rows: บรรทัดของแผนที่เลือก
// การ reset ตัวกรอง/เรียง/หน้า ของตาราง "ไม่อยู่ที่นี่" — คอมโพเนนต์เรียก selectPlan() แล้ว reset state ตัวเอง
import { useEffect, useState } from 'react';
import { fetchSalesPlans, fetchSalesPlanLines } from '../api/salesPlan';
import { SalesPlanApi, SalesPlanLineApi } from '../types/salesPlan';

export interface UseSalesPlanDocsResult {
  plans: SalesPlanApi[];
  plansLoading: boolean;
  plansError: string | null;
  selectedPlanId: string;
  rows: SalesPlanLineApi[] | null; // null = ยังไม่ได้เลือกเอกสาร
  linesLoading: boolean;
  linesError: string | null;
  selectPlan: (planId: string) => void;
}

export function useSalesPlanDocs(token?: string): UseSalesPlanDocsResult {
  const [plans, setPlans] = useState<SalesPlanApi[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [rows, setRows] = useState<SalesPlanLineApi[] | null>(null);
  const [linesLoading, setLinesLoading] = useState(false);
  const [linesError, setLinesError] = useState<string | null>(null);

  // โหลดรายการเลขที่เอกสารครั้งแรก
  useEffect(() => {
    let alive = true;
    setPlansLoading(true);
    setPlansError(null);
    fetchSalesPlans(token)
      .then((data) => {
        if (alive) setPlans(data);
      })
      .catch((e) => {
        if (alive) setPlansError(e instanceof Error ? e.message : 'โหลดรายการแผนขายไม่สำเร็จ');
      })
      .finally(() => {
        if (alive) setPlansLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [token]);

  // เลือกเลขที่เอกสาร → โหลดบรรทัดของแผนนั้น (เฉพาะส่วน fetch)
  const selectPlan = (planId: string) => {
    setSelectedPlanId(planId);
    if (!planId) {
      setRows(null);
      setLinesError(null);
      return;
    }
    // planType มาจาก header ของแผนที่เลือก
    const planType = plans.find((p) => p.planId === planId)?.planType ?? '';
    setLinesLoading(true);
    setLinesError(null);
    fetchSalesPlanLines(planId, planType, token)
      .then((lines) => setRows(lines))
      .catch((e) => {
        setRows([]);
        setLinesError(e instanceof Error ? e.message : 'โหลดรายละเอียดแผนขายไม่สำเร็จ');
      })
      .finally(() => setLinesLoading(false));
  };

  return {
    plans,
    plansLoading,
    plansError,
    selectedPlanId,
    rows,
    linesLoading,
    linesError,
    selectPlan,
  };
}
