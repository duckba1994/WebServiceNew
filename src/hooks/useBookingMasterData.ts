// โหลด Master Data ทั้งหมดสำหรับฟอร์มใบจองสินค้า (Booking) — data-fetching แยกจาก UI.
// - โหลดครั้งเดียวตอน mount (และเมื่อ token เปลี่ยน)
// - endpoint ไหนพลาดจะไม่ล้มทั้งชุด แต่ "ต้องแจ้งผู้ใช้" ผ่าน error (ห้ามกลืนเงียบ)
// - ใช้ร่วมกันทั้งหน้าสร้างใบจอง และเอกสารพิมพ์ (รายงาน) เพื่อให้ตัวเลือกมาจากที่เดียว
import { useCallback, useEffect, useState } from 'react';
import {
  fetchPurposes,
  fetchPlanTypes,
  fetchJobCharacters,
  fetchJobGroups,
  fetchJobGroupDetails,
  fetchPresentWorks,
  fetchOperatorServiceTypes,
  fetchFuelConditions,
  fetchSurveyWorkSites,
  fetchSurveyWorkSiteDetails,
  fetchMachineConditions,
  fetchDriverConditions,
  fetchDocumentBookings,
  fetchTechnicianConditions,
  fetchCreditTypes,
  fetchCarAssignmentsPL,
  fetchCarVerificationsSV,
} from '../api/masterData';
import { BookingMaster, EMPTY_BOOKING_MASTER } from '../data/bookingMaster';

export interface UseBookingMasterDataResult {
  master: BookingMaster;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useBookingMasterData(token?: string): UseBookingMasterDataResult {
  const [master, setMaster] = useState<BookingMaster>(EMPTY_BOOKING_MASTER);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    Promise.allSettled([
      fetchPurposes(token),
      fetchPlanTypes(token),
      fetchJobCharacters(token),
      fetchJobGroups(token),
      fetchJobGroupDetails(token),
      fetchPresentWorks(token),
      fetchOperatorServiceTypes(token),
      fetchFuelConditions(token),
      fetchSurveyWorkSites(token),
      fetchSurveyWorkSiteDetails(token),
      fetchMachineConditions(token),
      fetchDriverConditions(token),
      fetchDocumentBookings(token),
      fetchTechnicianConditions(token),
      fetchCreditTypes(token),
      fetchCarAssignmentsPL(token),
      fetchCarVerificationsSV(token),
    ]).then((results) => {
      if (!alive) return;
      const [
        purposes,
        planTypes,
        jobCharacters,
        jobGroups,
        jobGroupDetails,
        presentWorks,
        operatorServiceTypes,
        fuelConditions,
        surveyWorkSites,
        surveyWorkSiteDetails,
        machineConditions,
        driverConditions,
        documentBookings,
        technicianConditions,
        creditTypes,
        carAssignmentsPL,
        carVerificationsSV,
      ] = results;
      // helper: ค่าถ้าสำเร็จ, [] ถ้าพลาด
      const val = <T,>(r: PromiseSettledResult<T[]>): T[] => (r.status === 'fulfilled' ? r.value : []);
      setMaster({
        purposes: val(purposes),
        planTypes: val(planTypes),
        jobCharacters: val(jobCharacters),
        jobGroups: val(jobGroups),
        jobGroupDetails: val(jobGroupDetails),
        presentWorks: val(presentWorks),
        operatorServiceTypes: val(operatorServiceTypes),
        fuelConditions: val(fuelConditions),
        surveyWorkSites: val(surveyWorkSites),
        surveyWorkSiteDetails: val(surveyWorkSiteDetails),
        machineConditions: val(machineConditions),
        driverConditions: val(driverConditions),
        documentBookings: val(documentBookings),
        technicianConditions: val(technicianConditions),
        creditTypes: val(creditTypes),
        carAssignmentsPL: val(carAssignmentsPL),
        carVerificationsSV: val(carVerificationsSV),
      });
      const failed = results.filter((r) => r.status === 'rejected').length;
      setError(failed > 0 ? `โหลดข้อมูลตั้งต้นใบจองไม่สำเร็จ ${failed} รายการ` : null);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [token, reloadKey]);

  return { master, loading, error, reload };
}
