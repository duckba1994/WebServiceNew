import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  IconX,
  IconBell,
  IconCheck,
  IconCircleCheck,
  IconAlertTriangle,
  IconLoader2,
  IconPaperclip,
  IconPencil,
  IconDeviceFloppy,
  IconTrash,
  IconPlus,
  IconPhotoPlus,
} from '@tabler/icons-react';
import {
  RequestAction,
  RequestAttachment,
  RequestDetailResponse,
  RequestListItem,
  RequestLog,
  RequestResolution,
  RequestWorkflow,
} from '../../types/requestList';
import { fmtDate, fmtDateTime, jobStatusMeta } from '../../data/requestListData';
import { isRequesterSide } from '../../data/requestPhase';
import { actionBtnClass } from './RequestActionDialog';
import { ActionFieldValues, cleanFieldValues, fieldSpec } from '../../data/requestActionFields';
import { useRequestDetail } from '../../hooks/useRequestDetail';
import { useRequestEdit } from '../../hooks/useRequestEdit';
import { ItMasterData, useItMasterData } from '../../hooks/useItMasterData';
import { usePlMasterData } from '../../hooks/usePlMasterData';
import { CrMasterData, useCrMasterData } from '../../hooks/useCrMasterData';
import { useCrRequest } from '../../hooks/useCrRequest';
import { CrRequestDetail } from '../../api/crRequest';
import { FieldOption, MasterListKey } from '../../data/requestForm';
import {
  EditFieldDef,
  EditFieldKey,
  EditLine,
  PL_ATTACH_CHECKS,
  PlAttachDocKey,
  PlAttachKey,
  toPlChecklistPayload,
  validatePlChecklist,
  RequestEditForm,
  canEditRequest,
  editBlockedReason,
  editFieldsOf,
  emptyEditLine,
  editFieldVisible,
  hasFormChanges,
  toCrUpdatePayload,
  toEditForm,
  toPlUpdatePayload,
  toUpdatePayload,
  validateEditForm,
} from '../../data/requestEdit';
import {
  PL_CHECKLIST_MAX,
  PlRequestDetail,
  PlRequestLine,
  updatePlChecklist,
} from '../../api/plRequest';
import { usePlRequest } from '../../hooks/usePlRequest';
import {
  PendingAttachment,
  PendingAttachments,
  attachmentApiOf,
  useRequestAttachments,
} from '../../hooks/useRequestAttachments';
import { useAuthedImage } from '../../hooks/useAuthedImage';
import { useAuth } from '../../context/AuthContext';

type Meta = { label: string; color: string; bg: string; border: string };

function Pill({ meta, dot }: { meta: Meta; dot?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11.5px] font-semibold"
      style={{ background: meta.bg, color: meta.color, borderColor: meta.border }}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />}
      {meta.label}
    </span>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11.5px] font-semibold text-gray-500">{label}</span>
      <span className="text-[13px] text-gray-800">{children}</span>
    </div>
  );
}

// ── นิยาม 5 ขั้นของ stepper (อิงงานฝั่ง IT ตาม WinForms) ────────
// reachedStep = wfStep ที่ขั้นนี้กลายเป็น "ขั้นปัจจุบัน"
//   (IT: 1 อนุมัติ → 2 รับเรื่อง → 3 ดำเนินการ/ปิดงานรับเรื่อง → 4 สำรวจ → 5 ปิดงาน)
//   "ดำเนินการ" กับ "ปิดงานรับเรื่อง" อยู่ใน step 3 เดียวกัน (ดำเนินการเสร็จก็ปิดรับเรื่องได้
//    หรือกดปิดรับเรื่องเลยโดยไม่ผ่านดำเนินการ) จึงใช้ reachedStep เท่ากัน
// logAction = action code ที่บันทึกลง logs ของขั้นนี้ (ใช้ดึงว่าใคร/เมื่อไร)
interface StepTab {
  key: string;
  label: string;
  reachedStep: number;
  logAction: string;
  // ชื่อ action อื่นที่ backend อาจใช้บันทึก log ของขั้นเดียวกัน (ชื่อไม่ตรงกันทุกแผนก)
  // — ใช้หาว่า "ใครทำ/เมื่อไร" ของขั้นนี้ ไม่เกี่ยวกับปุ่ม
  logAliases?: string[];
  // ปุ่มที่ยอมให้ขึ้นในแท็บนี้ — กรอง item.availableActions ด้วย code ชุดนี้
  // ([] = ไม่มีปุ่ม workflow ในแท็บนี้, undefined = โชว์ทุกปุ่มที่ API ส่งมา)
  // ทำให้แท็บ "รับเรื่อง" เหลือปุ่มรับเรื่องปุ่มเดียว ไม่ปนปุ่มดำเนินการ
  actionCodes?: string[];
  // code ที่ "แผงในแท็บวาดปุ่มเอง" (เพราะต้องส่งค่าจากฟอร์มไปด้วย) — นับเป็นของแท็บนี้
  // เหมือนกัน จะได้ไม่ตกไปโผล่ซ้ำที่แท็บ General แต่บล็อกปุ่มมาตรฐานจะไม่วาดให้
  panelCodes?: string[];
  // WFStatus ของขั้นนี้ — ระบุไว้แล้ว reachedStep จะถูกคำนวณใหม่จาก workflow ที่ API
  // ส่งมา (ดู resolveReachedStep) แทนเลขที่ฝังไว้ในโค้ด
  // → backend สลับ/แทรกขั้น หน้าเว็บก็ยังชี้ขั้นถูกโดยไม่ต้อง deploy ใหม่
  wfCodes?: string[];
}
// IT: 5 ขั้น — อนุมัติ → รับเรื่อง → ดำเนินการ/ปิดงานรับเรื่อง → สำรวจ → ปิดงาน
const IT_STEP_TABS: StepTab[] = [
  { key: 'general', label: 'General', reachedStep: 0, logAction: 'create', actionCodes: [] },
  { key: 'receive', label: 'รับเรื่อง', reachedStep: 2, logAction: 'receive', actionCodes: ['receive'] },
  { key: 'service', label: 'ดำเนินการ', reachedStep: 3, logAction: 'service', actionCodes: [] },
  { key: 'closeReceive', label: 'ปิดงานรับเรื่อง', reachedStep: 3, logAction: 'closeReceive', actionCodes: [] },
  { key: 'survey', label: 'สำรวจความพึงพอใจ', reachedStep: 4, logAction: 'survey', actionCodes: [] },
  { key: 'close', label: 'ปิดงาน', reachedStep: 5, logAction: 'close', actionCodes: [] },
];

// PL: 4 ขั้น — อนุมัติ → รับเรื่อง → Attachment/Service → ปิดงาน (ตามฟอร์ม WinForms)
// "Attachment" กับ "Service" อยู่ใน step 3 เดียวกัน (รับเรื่องแล้วเข้ามาดูเอกสารแนบ
// ก่อนลงมือ) — แบบเดียวกับที่ IT มี ดำเนินการ/ปิดงานรับเรื่อง ใช้ reachedStep เท่ากัน
// เรียงก่อน-หลังในลิสต์นี้คือลำดับที่ stepper จะโฟกัสให้เมื่อถึง step 3
const PL_STEP_TABS: StepTab[] = [
  { key: 'general', label: 'General', reachedStep: 0, logAction: 'create', actionCodes: [] },
  { key: 'receive', label: 'รับเรื่อง', reachedStep: 2, logAction: 'receive', actionCodes: ['receive'] },
  { key: 'plAttachment', label: 'Attachment', reachedStep: 3, logAction: 'create', actionCodes: [] },
  { key: 'plService', label: 'Service', reachedStep: 3, logAction: 'service', actionCodes: [] },
  // step 4 (Request-Close-Job) — งานเสร็จแล้ว แต่คนที่กดปิดคือ "แผนกผู้แจ้ง"
  // ไม่ใช่ PL (ownerType = requesterDepart) จึงเป็นขั้นที่ค้างเงียบได้ง่ายที่สุด
  { key: 'plClose', label: 'ปิดงาน', reachedStep: 4, logAction: 'close' },
];

// CR: 5 ขั้น — อนุมัติ → CR รับเรื่อง → CR ดำเนินการ → ต้นสังกัดรับงาน → CR ปิดงานที่แจ้งเรื่อง
// ยึดตาม MdApi/CR-workflow-frontend-guide.md (contract จาก backend)
//
// ⚠️ ขั้นอนุมัติ (step 1) ไม่มีแท็บของตัวเอง — ปุ่มอนุมัติกับข้อมูลที่ใช้ตัดสินใจอยู่ที่
//    แท็บ General ด้วยกัน (ผู้ใช้สั่ง 1 ก.ย. 2026) เหมือน IT/PL
//    → ห้ามใส่ 'approve' ลง actionCodes ของแท็บไหน ไม่งั้นปุ่มจะหายจาก General
//      (บล็อกปุ่มของ General รับเฉพาะ action ที่ "ไม่มีแท็บไหนจองไว้")
//
// ⚠️ step 1 กับ 4 เป็นของ "แผนกผู้แจ้ง" ไม่ใช่ CR (ในแม่แบบเก็บ DepartId = "00")
//    ขั้น 4 จึงเป็นขั้นที่ค้างเงียบง่ายที่สุด — งานเสร็จแล้วแต่ไม่มีใครกดรับ
const CR_STEP_TABS: StepTab[] = [
  { key: 'general', label: 'General', reachedStep: 0, logAction: 'create', actionCodes: [] },
  {
    key: 'crReceive',
    label: 'รับเรื่อง',
    reachedStep: 2,
    logAction: 'receive',
    actionCodes: [],
    panelCodes: ['receive'], // ต้องส่ง requestService ไปด้วย → ปุ่มอยู่ในแผง
    wfCodes: ['Receive-Request', 'Receive'],
  },
  {
    key: 'crService',
    label: 'ดำเนินการ',
    reachedStep: 3,
    logAction: 'service',
    actionCodes: [],
    panelCodes: ['saveService', 'service'],
    wfCodes: ['Service', 'Service And Close-Job'],
  },
  {
    key: 'crReceiveJob',
    label: 'รับงาน',
    reachedStep: 4,
    logAction: 'acceptWork',
    logAliases: ['receiveJob', 'receive_job', 'Received-Service'],
    actionCodes: ['acceptWork'], // ไม่มีฟิลด์ → ใช้กล่องยืนยันมาตรฐาน
    wfCodes: ['Received-Service', 'Receive-Service'],
  },
  {
    key: 'crClose',
    label: 'ปิดงานที่แจ้งเรื่อง',
    reachedStep: 5,
    logAction: 'close',
    actionCodes: [],
    panelCodes: ['close'], // มีช่องรายละเอียดการปิดงาน (ไม่บังคับ) → ปุ่มอยู่ในแผง
    wfCodes: ['Close-Job', 'Request-Close-Job', 'ReceiveJob-Close-Job', 'Mgr Close-Job'],
  },
];

const STEP_TABS_BY_MODULE: Record<string, StepTab[]> = {
  IT: IT_STEP_TABS,
  PL: PL_STEP_TABS,
  CR: CR_STEP_TABS,
};

// แผนกที่ยังไม่ได้ทำหน้าจอเฉพาะ ใช้ชุดของ IT ไปก่อน (ของเดิมก่อนแยกรายโมดูล)
// — เปิดแผนกใหม่เมื่อไรให้เพิ่มชุดของแผนกนั้นในตารางข้างบน อย่าปล่อยให้ตกมาที่นี่
const stepTabsOf = (module: string): StepTab[] => STEP_TABS_BY_MODULE[module] ?? IT_STEP_TABS;

// เลขขั้นจริงของแท็บ — ยึด workflow ที่ API ส่งมาก่อนเสมอ (workflow เป็นข้อมูล ไม่ใช่โค้ด)
// เลข reachedStep ที่ฝังไว้เป็นแค่ค่าสำรองตอน detail ยังโหลดไม่เสร็จ/โหลดไม่ได้
const resolveReachedStep = (tab: StepTab, workflow?: RequestWorkflow | null): number => {
  const codes = tab.wfCodes;
  if (!codes || !workflow?.steps?.length) return tab.reachedStep;
  const hit = workflow.steps.find((s) => s.code && codes.includes(s.code.trim()));
  return hit?.step ?? tab.reachedStep;
};

// รหัส action ที่มี "ที่ทางของตัวเอง" อยู่แล้ว — แท็บใดแท็บหนึ่งเป็นคนแสดงปุ่มให้
// (จาก actionCodes ของแท็บ + code ที่แผงในแท็บสร้างปุ่มเอง เช่น ปิดงานรับเรื่อง/
//  ประเมิน/ปิดงาน) ที่เหลือทั้งหมดตกมาโผล่ในแท็บ General แทนที่จะหายไปเฉย ๆ
//
// ⚠️ คิดแยกรายโมดูล ห้ามรวมเป็นเซ็ตเดียวทั้งระบบ: CR มีแท็บ "อนุมัติ" ที่รับปุ่ม
//    approve ไปแล้ว ถ้าใช้เซ็ตรวม ปุ่มอนุมัติของ IT/PL (ซึ่งไม่มีแท็บนั้น) จะหายไปทั้งใบ
const PANEL_ACTION_CODES = ['saveService', 'service', 'closeReceive', 'survey', 'close'];
const claimedCodesOf = (module: string): Set<string> =>
  new Set<string>([
    ...stepTabsOf(module).flatMap((t) => [...(t.actionCodes ?? []), ...(t.panelCodes ?? [])]),
    ...PANEL_ACTION_CODES,
  ]);

type StepState = 'done' | 'current' | 'upcoming';

// ผ่านแล้ว / กำลังทำ / ยังไม่ถึง — คิดจาก wfStep ปัจจุบันของใบ
// General = ข้อมูลใบที่แจ้งเข้ามา มีอยู่แล้วเสมอ จึงถือว่า "ทำแล้ว" ตลอด
function stepStateOf(tab: StepTab, wfStep: number | null | undefined, closed: boolean): StepState {
  if (tab.key === 'general') return 'done';
  if (closed) return 'done';
  if (wfStep === null || wfStep === undefined) return 'upcoming';
  if (wfStep > tab.reachedStep) return 'done';
  if (wfStep === tab.reachedStep) return 'current';
  return 'upcoming';
}

const STATE_CHIP: Record<StepState, Meta> = {
  done: { label: 'ทำแล้ว', color: '#047857', bg: '#ecfdf5', border: '#a7f3d0' },
  current: { label: 'ขั้นปัจจุบัน', color: '#1a5fb4', bg: '#eff6ff', border: '#bfdbfe' },
  upcoming: { label: 'ยังไม่ถึงขั้นนี้', color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0' },
};

// ── รายละเอียดใบแจ้งเรื่อง — wizard ตามขั้นของ workflow ─────────
// เปิดใบ = โหลด detail (item เต็ม + logs + workflow) จาก GET /Requests/{module}/{docNo}
// ถ้าเส้นนั้นยังไม่พร้อม → ใช้ item จาก list ไปก่อน (stepper ยังขึ้นตาม wfStep ได้)
//
// ปุ่มดำเนินการมาจาก item.availableActions ที่ API ส่งมา ไม่ได้ฝังไว้ในโค้ด
// และจะโชว์อยู่ใน tab ที่เป็น "ขั้นปัจจุบัน" เท่านั้น (คิวของคนที่เปิดดู)
export function RequestDetailModal({
  item,
  onClose,
  onPickAction,
  onEdited,
  onStepSubmit,
  actionPending,
  notice,
  onDismissNotice,
}: {
  item: RequestListItem;
  onClose: () => void;
  onPickAction?: (action: RequestAction) => void; // ไม่ส่งมา = อ่านอย่างเดียว
  // ใบถูกแก้ไขสำเร็จ — ส่งแถวที่อัปเดตแล้วกลับให้ลิสต์เอาไปแทนของเดิม
  onEdited?: (item: RequestListItem) => void;
  // ยิง action จากฟอร์มในแท็บ (ดำเนินการ/ปิดงานรับเรื่อง/สำรวจ) ตรง ไม่ผ่านกล่องยืนยัน
  onStepSubmit?: (action: RequestAction, fields: ActionFieldValues) => void | Promise<void>;
  actionPending?: boolean;
  // ผลของการกดปุ่ม — โชว์ในตัว modal เพราะแถบของตารางถูก modal บังไว้
  notice?: { kind: 'success' | 'error'; text: string } | null;
  onDismissNotice?: () => void;
}) {
  const { user } = useAuth();
  // โหลด detail ใหม่เมื่อ: ใบขยับ (updatedDate/wfStep) หรือเพิ่งกดปุ่มในแท็บ (refreshTick)
  // ต้องมี refreshTick เพราะ saveService/service ไม่เลื่อน step และไม่แตะ updatedDate
  // (= MAX(ApproveDate)) → ถ้าไม่บังคับโหลด จะไม่เห็น servicedBy / ค่าที่เพิ่งบันทึก
  const [refreshTick, setRefreshTick] = useState(0);
  const { detail, loading: detailLoading, error: detailError } = useRequestDetail(
    item.module,
    item.docNo,
    user?.token,
    `${item.updatedDate ?? ''}|${item.wfStep ?? ''}|${refreshTick}`
  );

  // ชุดแท็บของโมดูลนี้ — จำนวน/ชื่อขั้นต่างกันต่อแผนก (IT 6 แท็บ, PL 5 แท็บ, CR 6 แท็บ)
  // เลขขั้นของแต่ละแท็บยึดจาก workflow ที่ API ส่งมาก่อน (ค่าในโค้ดเป็นแค่ตัวสำรอง)
  const tabs = useMemo(
    () =>
      stepTabsOf(item.module).map((t) => ({
        ...t,
        reachedStep: resolveReachedStep(t, detail?.workflow),
      })),
    [item.module, detail?.workflow]
  );
  const claimedCodes = useMemo(() => claimedCodesOf(item.module), [item.module]);

  // ยิง action จากฟอร์มในแท็บ แล้วบังคับโหลดใบใหม่เพื่อดึงค่าที่เพิ่งบันทึกกลับมา
  const submitStep = async (action: RequestAction, fields: ActionFieldValues) => {
    await onStepSubmit?.(action, fields);
    setRefreshTick((t) => t + 1);
    // กด "ดำเนินการเสร็จ" (service ไม่เลื่อน step) → เด้งไปแท็บปิดงานรับเรื่องเลย
    if (action.code === 'service') {
      const i = tabs.findIndex((t) => t.key === 'closeReceive');
      if (i !== -1) setSelected(i);
    }
  };

  // item เต็มจาก detail (คำนวณสำหรับคนที่เปิดดู) — ถ้ายังโหลดไม่เสร็จใช้ตัวจากลิสต์ไปก่อน
  const full = detail?.item ?? item;
  // เช็คลิสต์เอกสารแนบ / รายการย่อย / canEdit ของ PL ไม่ได้มากับ /Requests/PL/{docNo}
  // ต้องดึงจากเส้นของฟอร์ม PL (ใบโมดูลอื่นไม่ยิง)
  // โหลดที่นี่ไม่ใช่ในแผง เพราะทั้งหน้าอ่านและฟอร์มแก้ไขต้องใช้ชุดเดียวกัน
  // และต้องโหลดใหม่หลังบันทึก (refreshTick) ไม่งั้นข้อมูลยังเป็นของเก่า
  const plDoc = usePlRequest(
    item.module === 'PL' ? item.docNo : null,
    user?.token,
    `${item.updatedDate ?? ''}|${refreshTick}`
  );
  // ตัวเลือกของแท็บ "ดำเนินการ" / "ปิดงานรับเรื่อง" — มาจาก GET /MasterData/it
  // ยิงตามชุดแท็บ ไม่ใช่ตามชื่อโมดูล เพราะแผนกที่ยังไม่มีหน้าจอของตัวเองใช้ชุดของ IT อยู่
  // (ใบ PL ใช้แท็บของตัวเอง จึงไม่ยิง)
  const itMaster = useItMasterData(
    user?.token,
    tabs.some((t) => t.key === 'service' || t.key === 'closeReceive')
  );
  // ตัวเลือกของฟอร์มแก้ไขใบ CR (ส่วนงาน → ประเภทที่แจ้ง → รายละเอียดที่แจ้ง)
  const isCrItem = item.module === 'CR';
  const crMaster = useCrMasterData(user?.token, isCrItem);
  // ค่าดิบของใบ CR — ต้องใช้เส้นนี้เติมฟอร์มแก้ไข ไม่ใช่ item ของเส้นกลาง
  // (เส้นกลางรวม requestType กับ requestSubType เป็นข้อความเดียว ผูก dropdown ไม่ได้)
  // โหลดที่นี่ไม่ใช่ในแผง เพราะทั้งหน้าอ่าน ฟอร์มแก้ไข และ submitEdit ต้องใช้ชุดเดียวกัน
  const crDoc = useCrRequest(
    isCrItem ? item.docNo : null,
    user?.token,
    `${item.updatedDate ?? ''}|${refreshTick}`
  );
  // รายการย่อยในรูปแบบที่ตารางใช้ (loading/error ใช้ก้อนเดียวกับใบ)
  const plLines = {
    lines: plDoc.doc?.lines ?? null,
    loading: plDoc.loading,
    error: plDoc.error,
  };
  // ⚠️ ต้องอ่านจาก full (= detail.item) ไม่ใช่ item ของลิสต์:
  // /Requests/{module}/{docNo} คำนวณ availableActions ให้ "คนที่เปิดดูใบนี้"
  // ส่วนลิสต์อาจไม่ส่งมา/ส่งไม่ครบ → ถ้าอ่านจาก item ปุ่มจะไม่ขึ้นทั้งที่มีสิทธิ์
  const actions = onPickAction ? full.availableActions ?? [] : [];
  const status = jobStatusMeta(item);
  const r = full.resolution;
  const logs = detail?.logs ?? [];
  const closed = full.phase === 'closed';

  // log ล่าสุดของแต่ละ action — ใช้ดึงว่าใคร/แผนก/เมื่อไร ของแต่ละขั้น
  const lastLogOf = (action: string): RequestLog | null => {
    let found: RequestLog | null = null;
    for (const l of logs) if (l.action === action) found = l;
    return found;
  };

  // log ของแท็บ — รับได้หลายชื่อ (logAliases) เพราะแต่ละแผนกตั้งชื่อ action ของขั้น
  // เดียวกันไม่เหมือนกัน เช่นขั้น "รับงาน" ที่อาจบันทึกเป็น receiveJob หรือ Received-Service
  const logOfTab = (t: StepTab): RequestLog | null => {
    const codes = [t.logAction, ...(t.logAliases ?? [])];
    let found: RequestLog | null = null;
    for (const l of logs) if (codes.includes(l.action)) found = l;
    return found;
  };

  // log ของขั้นปิดงาน — backend ไม่ได้ตั้งชื่อ action ว่า 'close' เสมอไป:
  // ใบ PL จริงบันทึกเป็นโค้ดของขั้นสุดท้ายใน workflow (เช่น 'Request-Close-Job')
  // จึงเทียบกับ code ของ step สุดท้ายที่ workflow ส่งมาด้วย — ไม่ hardcode ชื่อไว้
  const finalStepCode = (() => {
    const steps = detail?.workflow?.steps ?? [];
    return steps.length > 0 ? steps[steps.length - 1].code ?? null : null;
  })();
  const lastCloseLog = (): RequestLog | null => {
    let found: RequestLog | null = null;
    for (const l of logs) {
      const a = (l.action ?? '').toLowerCase();
      if (a.startsWith('close') || (finalStepCode && l.action === finalStepCode)) found = l;
    }
    return found;
  };

  // "ดำเนินการเสร็จ" (service) ไม่เลื่อน step แต่ประทับ servicedBy → ถือว่าแท็บดำเนินการ "ทำแล้ว"
  const serviceDone = !!(full.resolution?.servicedBy || lastLogOf('service')?.actionByName);
  const tabState = (t: StepTab): StepState => {
    const base = stepStateOf(t, full.wfStep, closed);
    if (t.key === 'service' && serviceDone && base === 'current') return 'done';
    return base;
  };

  // tab เริ่มต้น = ขั้นปัจจุบัน (ตัวแรกที่ state = current) ไม่งั้นตัวสุดท้ายที่ทำแล้ว
  const defaultTab = useMemo(() => {
    const cur = tabs.findIndex((t) => tabState(t) === 'current');
    if (cur !== -1) return cur;
    let lastDone = 0;
    tabs.forEach((t, i) => {
      if (tabState(t) === 'done') lastDone = i;
    });
    return lastDone;
    // tabs อยู่ในลิสต์ด้วย เพราะเลขขั้นของแท็บเปลี่ยนได้ตอน workflow จาก API มาถึง
    // (wfStep เท่าเดิม แต่ reachedStep ขยับ → ขั้นปัจจุบันย้ายแท็บ)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabs, full.wfStep, closed, serviceDone]);

  const [selected, setSelected] = useState(defaultTab);

  // เดิน stepper ไปขั้นปัจจุบันเมื่อ wfStep เปลี่ยน (เช่นหลังกดรับเรื่อง → ไปแท็บดำเนินการ)
  // ไม่ override ตอนผู้ใช้กดดูแท็บอื่นเอง เพราะ wfStep ไม่เปลี่ยน effect จึงไม่ยิง
  const currentIndex = useMemo(
    () => tabs.findIndex((t) => tabState(t) === 'current'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tabs, full.wfStep, closed, serviceDone]
  );
  useEffect(() => {
    if (currentIndex !== -1) setSelected(currentIndex);
  }, [currentIndex]);
  const activeTab = tabs[selected] ?? tabs[0];
  const activeState = tabState(activeTab);
  const activeLog = logOfTab(activeTab);
  // ปุ่มที่โชว์ในแท็บนี้ = availableActions กรองด้วย actionCodes ของแท็บ
  // (แท็บรับเรื่องจึงเหลือแค่ปุ่มรับเรื่อง, แท็บดำเนินการไม่มีปุ่ม workflow)
  const activeActions = activeTab.actionCodes
    ? actions.filter((a) => activeTab.actionCodes!.includes(a.code))
    : actions;
  // ปุ่มในแท็บ General = ทุก action ที่ไม่มีแท็บอื่น "รับไป" แล้ว (อนุมัติ/ไม่อนุมัติ
  // ของ MGR ต้นสังกัด + ยกเลิก + action ที่แผนกอื่นตั้งชื่อ code ไม่เหมือน IT)
  // ห้าม hardcode รายชื่อ code ตรงนี้ — แผนกที่ตั้งชื่อไม่ตรงลิสต์จะไม่มีที่ให้ปุ่ม
  // โผล่เลยทั้งใบ (กติกา "ปุ่มคือ data ไม่ใช่ code" ใน CLAUDE.md)
  const generalActions = actions.filter((a) => !claimedCodes.has(a.code));

  // ── แก้ไขข้อมูลใบ (ก่อนปลายทางกดรับงาน) ──────────────────────
  // สิทธิ์มาจาก item.canEdit ที่ API ส่งมา (ยังไม่ส่ง → fallback กติกาใน requestEdit.ts)
  const {
    save: saveEdit,
    pending: editPending,
    notice: editNotice,
    showNotice: showEditNotice,
    dismissNotice: dismissEditNotice,
  } = useRequestEdit(user?.token);
  const [editing, setEditing] = useState(false);
  // สิทธิ์แก้ไข = กติกาหน้าเว็บ AND canEdit ที่ API ส่งมา (PL/CR ส่งมาแล้ว, IT ยังไม่ส่ง
  // → undefined ถือว่าไม่คัดค้าน) backend ตรวจซ้ำตอน PUT อยู่ดี ปุ่มเป็นแค่ UX
  //
  // ⚠️ CR: backend เปิดให้แก้ได้ตลอด step 1-5 (canEdit = false เฉพาะใบปิด/ยกเลิก)
  //    แต่ผู้ใช้สั่งว่า "อนุมัติแล้วห้ามแก้" (1 ก.ย. 2026) กติกาหน้าเว็บจึงเข้มกว่า
  //    → ตอนนี้เป็นแค่การซ่อนปุ่ม ไม่ใช่การบังคับ ใครยิง PUT ตรงยังแก้ได้อยู่
  //    ต้องให้ backend ใส่เงื่อนไขเดียวกันด้วย (เขาเสนอไว้เองใน guide §7)
  const apiCanEdit = plDoc.doc?.canEdit ?? crDoc.doc?.canEdit;
  // สิทธิ์แก้ "ฟิลด์หัวใบ + รายการที่ขอ" (PUT /{module}/{docNo})
  const canEditFields = !!onEdited && canEditRequest(full, user) && apiCanEdit !== false;
  // สิทธิ์แนบ/ลบรูปเป็นคนละชุด — ห้ามผูกกับ canEdit เพราะปลายทางที่รับงานแล้ว
  // ได้ canEdit: false แต่ canAttach: true (backend แยกให้ 27 ส.ค. 2026)
  // โมดูลที่ยังไม่ส่ง canAttach มา (IT) = undefined → ใช้สิทธิ์เดียวกับฟิลด์เหมือนเดิม
  const canAttachFiles = plDoc.doc?.canAttach ?? canEditFields;
  const attachBlockedReason = plDoc.doc?.attachBlockedReason ?? null;
  // เช็คลิสต์เอกสารแนบมีสิทธิ์เป็นตัวที่สาม (เงื่อนไขเดียวกับ canAttach แต่ส่งแยกมา)
  const canEditChecklist = plDoc.doc?.canEditChecklist ?? false;
  const checklistBlockedReason = plDoc.doc?.checklistBlockedReason ?? null;
  // เปิดฟอร์มแก้ไขได้ถ้าแก้อะไรได้สักอย่าง — ปลายทางเปิดเข้ามาเพื่อจัดการรูปอย่างเดียวได้
  // (ฟิลด์หัวใบจะถูกล็อกไว้ให้ ดู fieldsEditable ใน RequestEditPanel)
  const editable = !!onEdited && (canEditFields || canAttachFiles);

  // รูปที่ผู้ใช้เลือก/สั่งลบไว้แต่ยังไม่ได้ยิง — endpoint เป็นรายช่องและมีผลทันที
  // จึงต้องพักไว้เองเพื่อให้ "มีผลตอนกดบันทึก" เหมือนฟิลด์อื่นในฟอร์ม
  // เก็บที่นี่ไม่ใช่ในแผง เพราะหลังยิงเสร็จต้องเคลียร์เฉพาะช่องที่สำเร็จ
  const attRef = useRef<PendingAttachments>({});
  const [pendingAtt, setPendingAtt] = useState<PendingAttachments>({});
  const [attachBusy, setAttachBusy] = useState(false);
  const { applyPending } = useRequestAttachments(item.module, item.docNo, user?.token);

  // object URL ของไฟล์ที่เลือกไว้ต้องคืนหน่วยความจำเมื่อถูกแทนที่หรือถูกยกเลิก
  const setAtt = React.useCallback((next: PendingAttachments, revoke: PendingAttachments) => {
    Object.values(revoke).forEach((c) => {
      if (c.kind === 'upload') URL.revokeObjectURL(c.previewUrl);
    });
    attRef.current = next;
    setPendingAtt(next);
  }, []);

  const stageAtt = React.useCallback(
    (slot: number, change: PendingAttachment | null) => {
      const prev = attRef.current[slot];
      const next = { ...attRef.current };
      if (change) next[slot] = change;
      else delete next[slot];
      setAtt(next, prev ? { [slot]: prev } : {});
    },
    [setAtt]
  );

  // ทิ้งของที่ค้างเมื่อออกจากฟอร์ม (กดยกเลิก / ปิดใบ / สิทธิ์หาย)
  const clearAtt = React.useCallback(() => {
    if (Object.keys(attRef.current).length === 0) return;
    setAtt({}, attRef.current);
  }, [setAtt]);
  // ใบขยับระหว่างที่ฟอร์มเปิดค้างอยู่ (ปลายทางเพิ่งกดรับเรื่อง) → ปิดฟอร์มทิ้งเอง
  useEffect(() => {
    if (!editable) setEditing(false);
  }, [editable]);
  // ออกจากโหมดแก้ไข = ทิ้งรูปที่เลือกค้างไว้ ไม่ให้ค้างข้ามรอบ
  useEffect(() => {
    if (!editing) clearAtt();
  }, [editing, clearAtt]);

  // ปุ่มบันทึกเดียวคุมทั้งฟิลด์และรูปแนบ แต่เป็นคนละ endpoint กัน จึงยิงเรียงกัน:
  // ฟิลด์ก่อน (ถ้าฟิลด์ไม่ผ่านก็ไม่ต้องแตะรูป จอยังแก้ต่อได้) แล้วค่อยรูปทีละช่อง
  const submitEdit = async (form: RequestEditForm) => {
    const attSlots = Object.keys(attRef.current).length;
    const fieldsChanged =
      canEditFields && hasFormChanges(toEditForm(full, plLines.lines, crDoc.doc), form);
    // ไม่ได้แก้อะไรเลย → ไม่ต้องยิง API ให้เปลืองรอบ
    if (!fieldsChanged && attSlots === 0) {
      setEditing(false);
      return;
    }

    if (fieldsChanged) {
      const payload =
        full.module === 'PL'
          ? toPlUpdatePayload(full, form, plDoc.doc)
          : full.module === 'CR'
          ? toCrUpdatePayload(form)
          : toUpdatePayload(full, form);
      const res = await saveEdit(full, payload);
      if (res.item) onEdited?.(res.item);
      // ฟิลด์ไม่ผ่าน (403/409/400) → หยุดไว้ ไม่ยิงรูปตาม notice ตั้งไว้ให้แล้ว
      if (!res.ok) {
        setRefreshTick((t) => t + 1);
        return;
      }
    }

    if (attSlots > 0) {
      setAttachBusy(true);
      const { done, errors } = await applyPending(attRef.current);
      // ช่องที่ผ่านแล้วมีผลจริง เอาออกจากคิว เหลือไว้เฉพาะช่องที่ยังพัง
      const left: PendingAttachments = {};
      const applied: PendingAttachments = {};
      Object.entries(attRef.current).forEach(([k, c]) => {
        if (done.includes(Number(k))) applied[Number(k)] = c;
        else left[Number(k)] = c;
      });
      setAtt(left, applied);
      setAttachBusy(false);
      if (errors.length > 0) {
        // จอเก่าไปแล้ว (ช่องที่ผ่านมีผลจริง) — โหลดใหม่แล้วคาฟอร์มไว้ให้แก้ช่องที่พัง
        setRefreshTick((t) => t + 1);
        showEditNotice({
          kind: 'error',
          text:
            done.length > 0
              ? `บันทึกรูปแนบไม่ครบ — สำเร็จ ${done.length} ช่อง · ${errors.join(' · ')}`
              : `บันทึกรูปแนบไม่สำเร็จ — ${errors.join(' · ')}`,
        });
        return;
      }
      showEditNotice({ kind: 'success', text: 'บันทึกการแก้ไขเรียบร้อย' });
    }

    setEditing(false);
    // สำเร็จก็โหลดใหม่ (ดึง logs/รูปล่าสุด), 403/409 ยิ่งต้องโหลด — จอเก่าไปแล้ว
    setRefreshTick((t) => t + 1);
  };

  // บันทึกเช็คลิสต์เอกสารแนบจากแท็บ Attachment — กดกี่ครั้งก็ได้ ไม่เลื่อน step
  // เส้นของตัวเอง (PUT /PLRequest/{docNo}/attach-checklist) ไม่ใช่เส้นแก้หัวใบ
  // จึงไม่โดน canEdit บล็อกตอนปลายทางรับงานแล้ว และไม่แตะหัวใบ/lines ของผู้แจ้ง
  const [checklistPending, setChecklistPending] = useState(false);
  const submitChecklist = async (
    attach: Record<PlAttachKey, boolean>,
    attachDocs: Record<PlAttachDocKey, string>
  ) => {
    setChecklistPending(true);
    try {
      await updatePlChecklist(item.docNo, toPlChecklistPayload(attach, attachDocs), user?.token);
      showEditNotice({ kind: 'success', text: 'บันทึกเอกสารแนบเรียบร้อย' });
    } catch (e: unknown) {
      const status = (e as { status?: number })?.status;
      const traceId = (e as { traceId?: string })?.traceId;
      const msg = e instanceof Error ? e.message : 'บันทึกเอกสารแนบไม่สำเร็จ';
      showEditNotice({
        kind: 'error',
        text: traceId && (status ?? 0) >= 500 ? `${msg} (อ้างอิง ${traceId})` : msg,
        // 409/403 = ใบขยับไปแล้ว จอเก่า — โหลดใหม่ด้านล่างจัดการให้
        stale: status === 409 || status === 403,
        traceId,
      });
    } finally {
      setChecklistPending(false);
      // โหลดใบใหม่เสมอ: สำเร็จ = เอาค่าที่ trim แล้วกลับมา, ล้มเหลว = sync flag ใหม่
      // (ต้องโหลด ไม่ใช่แค่ set state เพราะ toPlUpdatePayload หิ้วค่าเช็คลิสต์จาก doc
      //  ไปกับ PUT หัวใบ — doc เก่าค้างไว้จะเขียนทับของที่เพิ่งบันทึก)
      setRefreshTick((t) => t + 1);
    }
  };

  // แถบข้อความรวม — action กับ edit ใช้แถบเดียวกัน (ที่ว่างในหัว modal มีแถบเดียว)
  const bannerNotice = notice ?? editNotice;
  const dismissBanner = notice ? onDismissNotice : dismissEditNotice;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="backdrop-fade-in absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <div className="modal-pop relative flex max-h-[92vh] w-[min(760px,96vw)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* หัว: เลขที่ใบ + โมดูล + สถานะย่อ + ปุ่มปิด */}
        <div className="flex shrink-0 items-center gap-3.5 border-b border-gray-200 bg-white px-5 py-4">
          <div className="min-w-0">
            <div className="mono text-xs text-slate-400">เลขที่ใบแจ้ง</div>
            <div className="flex items-center gap-2">
              <span className="mono truncate text-base font-bold text-gray-900">{item.docNo}</span>
              <span className="mono rounded-md border border-gray-200 bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                {item.module}
              </span>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Pill meta={status} dot />
            {(item.isMyTurn || isRequesterSide(item)) && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[11.5px] font-bold text-amber-700">
                <IconBell size={13} />
                {isRequesterSide(item) ? 'รอแผนกผู้แจ้ง' : 'ถึงคิวเรา'}
              </span>
            )}
            <button
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white transition hover:bg-slate-100"
              aria-label="ปิด"
            >
              <IconX size={18} className="text-slate-700" />
            </button>
          </div>
        </div>

        {/* ===== stepper คลิกได้ (แทนแถบ pill เดิม) ===== */}
        <div className="shrink-0 border-b border-gray-100 bg-slate-50 px-5 py-4">
          <div className="mb-1 flex items-center gap-2">
            {detailLoading && (
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                <IconLoader2 size={12} className="animate-spin" />
                กำลังโหลด...
              </span>
            )}
            {/* โหลดใบเต็มไม่สำเร็จ = availableActions ที่คำนวณให้ "คนที่เปิดดู" ไม่มา
                → ปุ่มจะหายไปเงียบ ๆ ทั้งที่ผู้ใช้มีสิทธิ์ ต้องบอกให้เห็น ไม่ใช่กลืน error */}
            {!detailLoading && detailError && (
              <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                <IconAlertTriangle size={12} className="shrink-0" />
                โหลดรายละเอียดใบไม่สำเร็จ ({detailError}) — ปุ่มดำเนินการอาจไม่ขึ้น
                <button
                  type="button"
                  onClick={() => setRefreshTick((t) => t + 1)}
                  className="ml-1 underline underline-offset-2"
                >
                  ลองใหม่
                </button>
              </span>
            )}
          </div>
          <div className="no-scrollbar overflow-x-auto pb-1 pt-1.5">
            <ol className="flex w-full items-start">
              {tabs.map((t, i) => {
                const state = tabState(t);
                const done = state === 'done';
                const current = state === 'current';
                const isSel = i === selected;
                const leftOn = i > 0 && (done || current);
                const rightOn = done;
                const lg = logOfTab(t);
                const tip = [lg?.actionByName, lg?.actionByDepartment, lg?.actionDate ? fmtDateTime(lg.actionDate) : null]
                  .filter(Boolean)
                  .join(' · ');
                return (
                  <li key={t.key} className="relative flex min-w-[104px] flex-1 flex-col items-center px-1">
                    {i > 0 && (
                      <span
                        className="absolute right-1/2 top-[15px] h-[3px] w-full"
                        style={{ background: leftOn ? '#16a34a' : '#e2e8f0' }}
                      />
                    )}
                    {i < tabs.length - 1 && (
                      <span
                        className="absolute left-1/2 top-[15px] h-[3px] w-full"
                        style={{ background: rightOn ? '#16a34a' : '#e2e8f0' }}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => setSelected(i)}
                      title={tip || t.label}
                      className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full transition ${
                        isSel ? 'ring-4 ring-offset-1 ring-[#1a5fb4]/40' : current ? 'ring-4 ring-[#1a5fb4]/20' : ''
                      }`}
                      style={{ background: done ? '#16a34a' : current ? '#1a5fb4' : '#cbd5e1' }}
                    >
                      {done ? (
                        <IconCheck size={16} stroke={3} className="text-white" />
                      ) : (
                        <span className="text-[12px] font-bold text-white">{i + 1}</span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelected(i)}
                      className={`mt-2 text-center text-[11px] leading-tight transition ${
                        isSel
                          ? 'font-bold text-gray-900 underline decoration-2 underline-offset-4'
                          : done
                          ? 'text-gray-600 hover:text-gray-900'
                          : current
                          ? 'font-semibold text-[#1a5fb4]'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {t.label}
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>

        {/* ผลของการกดปุ่ม — message ไทยจาก API (สำเร็จ/ error) โชว์ในตัว modal */}
        {bannerNotice && (
          <div
            className={`flex shrink-0 items-center gap-2 border-b px-5 py-2.5 text-[12.5px] font-semibold ${
              bannerNotice.kind === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {bannerNotice.kind === 'success' ? (
              <IconCircleCheck size={16} className="shrink-0" />
            ) : (
              <IconAlertTriangle size={16} className="shrink-0" />
            )}
            <span className="min-w-0 flex-1">{bannerNotice.text}</span>
            {dismissBanner && (
              <button onClick={dismissBanner} title="ปิดข้อความ" className="rounded p-1 opacity-60 transition hover:bg-white/60 hover:opacity-100">
                <IconX size={14} />
              </button>
            )}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* ===== แผงของ tab ที่เลือก ===== */}
          <div className="border-b border-gray-100 px-5 py-5">
            <div className="mb-3 flex items-center gap-2">
              <h4 className="text-[13px] font-bold text-gray-800">{activeTab.label}</h4>
              {activeTab.key !== 'general' && (
                <Pill meta={STATE_CHIP[activeState]} dot={activeState === 'current'} />
              )}
              {/* แก้ไขข้อมูลใบได้ก่อน Mgr อนุมัติเท่านั้น — คนในแผนกผู้แจ้ง (รวม Mgr) เอง */}
              {activeTab.key === 'general' && editable && !editing && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  title="แก้ไขข้อมูลใบ — ทำได้ก่อน Mgr อนุมัติเท่านั้น"
                  className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/5 px-3 py-1.5 text-[12.5px] font-semibold text-accent transition hover:bg-accent/10"
                >
                  <IconPencil size={14} />
                  แก้ไขข้อมูล
                </button>
              )}
            </div>

            {activeTab.key === 'general' ? (
              <GeneralPanel
                item={item}
                full={full}
                plDoc={plDoc.doc}
                plLines={plLines}
                attachments={detail?.attachments ?? null}
                approveLogs={logs.filter((l) => l.action === 'approve')}
                editing={editing}
                editPending={editPending || attachBusy}
                editHint={
                  onEdited && !editable
                    ? plDoc.doc?.editBlockedReason || editBlockedReason(full, user)
                    : null
                }
                onEditCancel={() => setEditing(false)}
                onEditSubmit={submitEdit}
                crMaster={crMaster}
                crDoc={crDoc}
                canEditFields={canEditFields}
                canAttachFiles={canAttachFiles}
                attachBlockedReason={attachBlockedReason}
                pendingAtt={pendingAtt}
                attachBusy={attachBusy}
                onStageAttachment={stageAtt}
              />
            ) : activeTab.key === 'plAttachment' ? (
              <PlAttachmentPanel
                doc={plDoc.doc}
                loading={plDoc.loading}
                plLines={plLines}
                pending={checklistPending}
                // ⚠️ ห้ามเอา canEdit มาปิดแท็บนี้ — canEdit เป็นสิทธิ์ "แก้หัวใบ" ของฝั่ง
                // ผู้แจ้ง (ปิดทันทีที่ปลายทางรับงาน) ส่วนเช็คลิสต์เป็นงานของปลายทาง
                // ที่เพิ่งเริ่มได้ตอนรับงานแล้ว — ใช้ canEditChecklist เท่านั้น
                blockedReason={checklistBlockedReason}
                onSave={onEdited && canEditChecklist ? submitChecklist : undefined}
              />
            ) : activeTab.key === 'plClose' ? (
              <PlClosePanel state={activeState} resolution={r} closeLog={lastCloseLog()} />
            ) : activeTab.key === 'plService' ? (
              <PlServicePanel
                state={activeState}
                actions={actions}
                resolution={r}
                serviceLog={lastLogOf('service')}
                plLines={plLines}
                pending={!!actionPending}
                onSubmit={onStepSubmit ? submitStep : undefined}
              />
            ) : activeTab.key === 'crReceive' ? (
              <CrReceivePanel
                state={activeState}
                actions={actions}
                resolution={r}
                receiveLog={lastLogOf('receive')}
                pending={!!actionPending}
                onSubmit={onStepSubmit ? submitStep : undefined}
              />
            ) : activeTab.key === 'crService' ? (
              <CrServicePanel
                state={activeState}
                actions={actions}
                resolution={r}
                serviceLog={lastLogOf('service')}
                pending={!!actionPending}
                onSubmit={onStepSubmit ? submitStep : undefined}
              />
            ) : activeTab.key === 'crReceiveJob' ? (
              <CrReceiveJobPanel
                state={activeState}
                resolution={r}
                serviceLog={lastLogOf('service')}
                acceptLog={logOfTab(activeTab)}
                // isMyTurn ไม่ใช่ isRequesterSide: ขั้นนี้เป็นของฝั่งผู้แจ้งเสมอ
                // (isRequesterSide จริงทั้งคู่) แต่คนของ CR ที่เปิดดูต้องเห็นว่า "รอผู้แจ้งกด"
                // ไม่ใช่ "กดรับงานได้เลย" — API คำนวณ isMyTurn ให้คนที่เปิดดูใบอยู่แล้ว
                isOurTurn={!!full.isMyTurn}
              />
            ) : activeTab.key === 'crClose' ? (
              <CrClosePanel
                state={activeState}
                actions={actions}
                resolution={r}
                closeLog={lastCloseLog()}
                pending={!!actionPending}
                onSubmit={onStepSubmit ? submitStep : undefined}
              />
            ) : activeTab.key === 'service' ? (
              <ServicePanel
                state={activeState}
                actions={actions}
                resolution={r}
                master={itMaster}
                pending={!!actionPending}
                onSubmit={onStepSubmit ? submitStep : undefined}
                serviceLog={lastLogOf('service')}
                onNext={() => {
                  const i = tabs.findIndex((t) => t.key === 'closeReceive');
                  if (i !== -1) setSelected(i);
                }}
              />
            ) : activeTab.key === 'closeReceive' ? (
              <ClosePanel
                state={activeState}
                resolution={r}
                master={itMaster}
                pending={!!actionPending}
                onSubmit={onStepSubmit ? submitStep : undefined}
              />
            ) : activeTab.key === 'survey' ? (
              <SurveyPanel
                state={activeState}
                resolution={r}
                surveyLog={lastLogOf('survey')}
                pending={!!actionPending}
                onSubmit={onStepSubmit ? submitStep : undefined}
              />
            ) : activeTab.key === 'close' ? (
              <KpiPanel
                state={activeState}
                resolution={r}
                closeLog={lastLogOf('close')}
                pending={!!actionPending}
                onSubmit={onStepSubmit ? submitStep : undefined}
              />
            ) : (
              <StepPanel tab={activeTab} state={activeState} log={activeLog} resolution={r} />
            )}

            {/* ปุ่มในแท็บ General (อนุมัติ/ไม่อนุมัติ/ยกเลิก…) — ผ่านกล่องยืนยันเหมือน action อื่น
                รับทุก action ที่ไม่มีแท็บอื่นแสดงให้ ไม่ว่าแผนกนั้นตั้งชื่อ code ว่าอะไร */}
            {activeTab.key === 'general' && !editing && onPickAction && generalActions.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
                {generalActions.map((a) => (
                  <button
                    key={a.code}
                    type="button"
                    disabled={actionPending}
                    onClick={() => onPickAction(a)}
                    className={`rounded-lg border px-4 py-2 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${actionBtnClass(
                      a.style
                    )}`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            )}

            {/* ปุ่มดำเนินการของขั้นนี้ — โชว์เฉพาะ tab ที่เป็นคิวปัจจุบัน + ตรง actionCodes
                ปุ่มมาจาก availableActions ที่ API ส่งมา (กดแล้วเปิดกล่องยืนยัน+ฟอร์ม) */}
            {activeState === 'current' && activeActions.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
                {activeActions.map((a) => {
                  const needs = a.requiredFields ?? [];
                  return (
                    <button
                      key={a.code}
                      type="button"
                      disabled={actionPending}
                      onClick={() => onPickAction?.(a)}
                      title={
                        needs.length > 0
                          ? `${a.label} — ต้องกรอก ${needs.map((f) => fieldSpec(f).label).join(', ')}`
                          : a.label
                      }
                      className={`rounded-lg border px-4 py-2 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${actionBtnClass(
                        a.style
                      )}`}
                    >
                      {a.label}
                      {needs.length > 0 && <span className="ml-1 opacity-70">…</span>}
                    </button>
                  );
                })}
              </div>
            )}
            {/* ขั้นปัจจุบันแต่กดอะไรไม่ได้ = ไม่ใช่คิวของเรา (สิทธิ์ไม่ถึง / รอฝั่งอื่น)
                แท็บที่ไม่มีปุ่ม workflow (actionCodes = []) ไม่ต้องขึ้นข้อความนี้ */}
            {activeState === 'current' &&
              (activeTab.actionCodes?.length ?? 1) > 0 &&
              activeActions.length === 0 && (
                <p className="mt-3 text-[12px] text-slate-400">— ขั้นนี้ยังไม่ใช่คิวของคุณ หรือยังไม่มีสิทธิ์ดำเนินการ</p>
              )}
          </div>

        </div>
      </div>
    </div>
  );
}

// ── เนื้อหาแต่ละขั้น — โชว์ใคร/เมื่อไร + ข้อมูลที่บันทึกไว้ (เท่าที่ API ส่งมา) ──
function StepPanel({
  tab,
  state,
  log,
  resolution,
}: {
  tab: StepTab;
  state: StepState;
  log: RequestLog | null;
  resolution: RequestListItem['resolution'];
}) {
  if (state === 'upcoming') {
    return <p className="text-[12.5px] text-slate-400">ยังไม่ถึงขั้นนี้ — จะบันทึกข้อมูลเมื่อดำเนินการถึง</p>;
  }

  const who = log?.actionByName;
  const when = log?.actionDate;
  const r = resolution;

  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-4">
      {(who || when) && (
        <>
          <DetailRow label="ผู้ดำเนินการ">{who || '—'}</DetailRow>
          <DetailRow label="วันที่">{when ? fmtDateTime(when) : '—'}</DetailRow>
        </>
      )}

      {/* ข้อมูลเฉพาะขั้น — เท่าที่ resolution ที่ API ส่งมามีให้
          (ช่องละเอียดของ WinForms เช่น ส่งซ่อมภายนอก/คะแนนสำรวจ/KPI ยังไม่ได้ส่งมาใน resolution
           จะโชว์ครบเมื่อ backend เพิ่มฟิลด์ หรือกรอกผ่านฟอร์มตอนกดปุ่ม) */}
      {tab.key === 'closeReceive' && r && (r.repairStatus || r.solution || r.resolutionDetail) && (
        <>
          <DetailRow label="สถานะการซ่อม">{r.repairStatus || '—'}</DetailRow>
          <DetailRow label="แนวทางแก้ไข">{r.solution || '—'}</DetailRow>
          <div className="col-span-2">
            <DetailRow label="รายละเอียดการดำเนินการ">
              <span className="whitespace-pre-wrap">{r.resolutionDetail || '—'}</span>
            </DetailRow>
          </div>
        </>
      )}

      {!who && !when && (
        <div className="col-span-2">
          <p className="text-[12.5px] text-slate-400">
            {state === 'current'
              ? 'ยังไม่ได้บันทึกข้อมูลขั้นนี้ — กดปุ่มด้านล่างเพื่อดำเนินการ'
              : 'ระบบยังไม่ส่งรายละเอียดของขั้นนี้มา'}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Tab ดำเนินการ (step 3 Service) — ฟอร์มชุด "ส่งบริษัท" ──────
// ปุ่ม 2 ปุ่มมาจาก availableActions ที่ API ส่งมาที่ step 3:
//   saveService (บันทึกรายละเอียด, ไม่เลื่อน step กดกี่ครั้งก็ได้) / service (ดำเนินการเสร็จ → Survey)
// ฟิลด์: repairStatus(ดำเนินการ) · exVendor(ส่งบริษัท, บังคับ) · exContact(เบอร์) · exPrNo · exPlanDate
const SVC_INPUT =
  'w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none transition focus:border-accent disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500';
const SVC_LABEL = 'mb-1 block text-[11.5px] font-semibold text-gray-500';

function ServicePanel({
  state,
  actions,
  resolution,
  master,
  pending,
  onSubmit,
  onNext,
  serviceLog,
}: {
  state: StepState;
  actions: RequestAction[];
  resolution: RequestListItem['resolution'];
  master: ItMasterData;
  pending: boolean;
  onSubmit?: (action: RequestAction, fields: ActionFieldValues) => void | Promise<void>;
  onNext?: () => void; // ไปแท็บปิดงานรับเรื่อง (การส่งต่อทำที่นั่นด้วย closeReceive)
  serviceLog?: RequestLog | null; // fallback ชื่อ/เวลา ถ้า resolution ยังไม่คืน servicedBy
}) {
  const [mode, setMode] = useState('');
  const [vendor, setVendor] = useState('');
  const [phone, setPhone] = useState('');
  const [refPr, setRefPr] = useState('');
  const [planDate, setPlanDate] = useState('');
  const [touched, setTouched] = useState(false);

  // เติมฟอร์มจากค่าที่บันทึกไว้ (resolution) — resolution จะเปลี่ยน reference เฉพาะตอน
  // โหลด detail ใหม่ (เปิดใบ / หลังเซฟ) ระหว่างพิมพ์ไม่ refetch จึงไม่ล้างที่พิมพ์ค้าง
  // ตั้งเฉพาะช่องที่ API คืนค่ามา (กัน API ที่ยังไม่คืน exVendor มาล้างของที่พิมพ์)
  useEffect(() => {
    if (!resolution) return;
    if (resolution.repairStatus) setMode(resolution.repairStatus);
    if (resolution.exVendor) setVendor(resolution.exVendor);
    if (resolution.exContact) setPhone(resolution.exContact);
    if (resolution.exPrNo) setRefPr(resolution.exPrNo);
    if (resolution.exPlanDate) setPlanDate(String(resolution.exPlanDate).slice(0, 10));
  }, [resolution]);

  if (state === 'upcoming') {
    return <p className="text-[12.5px] text-slate-400">ยังไม่ถึงขั้นนี้ — จะกรอกได้เมื่อรับเรื่องแล้ว</p>;
  }

  // step 3 (มี saveService/service ให้กด) = แก้ไขได้ · พอ service ถูกยิงจากแท็บปิดงานรับเรื่อง
  // แล้ว step เลื่อน 3→4 availableActions หาย → ปุ่มหายเอง แล้วแท็บนี้กลายเป็น read-only
  // service ไม่เลื่อน step แต่ประทับ ServiceBy/ServiceDate → ใช้ servicedBy เป็นตัวบอกว่า
  // "ดำเนินการเสร็จแล้ว" (ถาวรจาก API ไม่ใช่ state ชั่วคราว) แล้วซ่อนปุ่ม เหลือแค่ปิดงานรับเรื่อง
  const serviceBy = resolution?.servicedBy || serviceLog?.actionByName || null;
  const serviceAt = resolution?.servicedDate || serviceLog?.actionDate || null;
  const serviceDone = !!serviceBy;
  const svc = actions.filter((a) => a.code === 'saveService' || a.code === 'service');
  const editable = !serviceDone && svc.length > 0;

  // ทำเสร็จแล้ว (ปุ่มหายไป) → โชว์ชื่อผู้ดำเนินการ + ข้อมูลที่บันทึกไว้ อ่านอย่างเดียว
  if (!editable) {
    const rs = resolution;
    return (
      <div className="grid grid-cols-2 gap-x-5 gap-y-4">
        <DetailRow label="ผู้ดำเนินการ">{serviceBy || '—'}</DetailRow>
        <DetailRow label="วันที่ดำเนินการ">{serviceAt ? fmtDateTime(serviceAt) : '—'}</DetailRow>
        <DetailRow label="การดำเนินการ">{rs?.repairStatus || mode || '—'}</DetailRow>
        <DetailRow label="ส่งบริษัท">{rs?.exVendor || vendor || '—'}</DetailRow>
        <DetailRow label="เบอร์โทร">{rs?.exContact || phone || '—'}</DetailRow>
        <DetailRow label="Ref PR">{rs?.exPrNo || refPr || '—'}</DetailRow>
        <DetailRow label="วันที่กำหนดเสร็จ">
          {rs?.exPlanDate ? fmtDate(rs.exPlanDate) : planDate ? fmtDate(planDate) : '—'}
        </DetailRow>
      </div>
    );
  }

  // ฟิลด์ทั้งชุด optional (ส่งเท่าที่กรอก) — ตัดค่าว่างก่อนยิง เพราะ API ถือว่า
  // "ไม่ส่ง = คงค่าเดิมใน DB" ส่ง "" ไปคือล้างค่าเดิมโดยไม่ตั้งใจ
  const collect = (): ActionFieldValues =>
    cleanFieldValues({
      repairStatus: mode,
      exVendor: vendor,
      exContact: phone,
      exPrNo: refPr,
      exPlanDate: planDate ? `${planDate}T00:00:00` : '',
    }) ?? {};
  const vendorMissing = vendor.trim() === '';
  const submit = (a: RequestAction) => {
    setTouched(true);
    if (vendorMissing) return; // "ส่งบริษัท" (exVendor) บังคับพิมพ์ทุกครั้ง
    onSubmit?.(a, collect());
  };

  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-4">
      <SelectField
        label="ดำเนินการ"
        value={mode}
        options={master.repairStatusNames}
        loading={master.loading}
        error={master.error}
        onRetry={master.reload}
        disabled={pending}
        onChange={setMode}
      />
      <div />
      <div className="col-span-2">
        <label className={SVC_LABEL}>
          ส่งบริษัท<span className="text-rose-600"> *</span>
        </label>
        <textarea
          rows={2}
          value={vendor}
          disabled={pending}
          onChange={(e) => setVendor(e.target.value)}
          className={`${SVC_INPUT} resize-none ${touched && vendorMissing ? 'border-rose-300 bg-rose-50/40' : ''}`}
        />
      </div>
      <div>
        <label className={SVC_LABEL}>เบอร์โทร</label>
        <input value={phone} disabled={pending} onChange={(e) => setPhone(e.target.value)} className={SVC_INPUT} />
      </div>
      <div>
        <label className={SVC_LABEL}>Ref PR</label>
        <input value={refPr} disabled={pending} onChange={(e) => setRefPr(e.target.value)} className={SVC_INPUT} />
      </div>
      <div>
        <label className={SVC_LABEL}>วันที่กำหนดเสร็จ</label>
        <input
          type="date"
          value={planDate}
          disabled={pending}
          onChange={(e) => setPlanDate(e.target.value)}
          className={SVC_INPUT}
        />
      </div>

      {touched && vendorMissing && (
        <p className="col-span-2 text-[11.5px] font-semibold text-rose-600">ต้องกรอก “ส่งบริษัท” ก่อนบันทึก/ดำเนินการเสร็จ</p>
      )}

      <div className="col-span-2 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
        {svc.map((a) => (
          <button
            key={a.code}
            type="button"
            disabled={pending}
            onClick={() => submit(a)}
            className={`rounded-lg border px-4 py-2 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${actionBtnClass(
              a.style
            )}`}
          >
            {a.label}
          </button>
        ))}
        <span className="text-[11.5px] text-slate-400">บันทึกได้เรื่อย ๆ · กด “ดำเนินการเสร็จ” แล้วไปปิดงานรับเรื่องที่แท็บถัดไป</span>
      </div>
    </div>
  );
}

// ── Tab ปิดงานรับเรื่อง — สรุปผลแล้วปิดขั้นดำเนินการ ────────────
// ช่อง: แนวทางการแก้ไข · สาเหตุหลัก · สาเหตุรอง · รายละเอียดการดำเนินการ · หมายเหตุ
// ยิง action 'closeReceive' → เขียน Solve/HW/HWDetail/RepairDetail/Remark + CloseBy/Date
// แล้วเลื่อน step 3→4 (Survey) ส่งต่อให้ผู้แจ้งประเมิน

// ตัวเลือกมาจาก master data (GET /MasterData/it) — โหลดพลาดต้องบอกผู้ใช้ + ให้กดลองใหม่
// ไม่ใส่รายการสำรองไว้ในโค้ด เพราะชื่อที่ตั้งเองอาจไม่ตรงกับที่ระบบเก็บจริง
function SelectField({
  label,
  value,
  options,
  disabled,
  invalid,
  loading,
  error,
  hint,
  onRetry,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  disabled: boolean;
  invalid?: boolean;
  loading?: boolean;
  error?: string | null;
  hint?: string;
  onRetry?: () => void;
  onChange: (v: string) => void;
}) {
  // ค่าที่บันทึกไว้แล้วแต่ไม่มีในรายการ (master ถูกแก้ทีหลัง) — ต้องยังโชว์ได้ ไม่งั้นช่องจะว่าง
  const opts = value && !options.includes(value) ? [value, ...options] : options;
  return (
    <div>
      <label className={SVC_LABEL}>{label}</label>
      <select
        value={value}
        disabled={disabled || loading}
        onChange={(e) => onChange(e.target.value)}
        className={`${SVC_INPUT} cursor-pointer ${invalid ? 'border-rose-300 bg-rose-50/40' : ''}`}
      >
        <option value="">{loading ? '— กำลังโหลด… —' : '— เลือก —'}</option>
        {opts.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      {error ? (
        <p className="mt-1 text-[11px] font-semibold text-rose-600">
          {error}
          {onRetry && (
            <button type="button" onClick={onRetry} className="ml-1.5 underline hover:no-underline">
              ลองใหม่
            </button>
          )}
        </p>
      ) : (
        hint && !loading && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>
      )}
    </div>
  );
}

function ClosePanel({
  state,
  resolution,
  master,
  pending,
  onSubmit,
}: {
  state: StepState;
  resolution: RequestListItem['resolution'];
  master: ItMasterData;
  pending: boolean;
  onSubmit?: (action: RequestAction, fields: ActionFieldValues) => void | Promise<void>;
}) {
  const [solve, setSolve] = useState('');
  const [causeMain, setCauseMain] = useState('');
  const [causeSub, setCauseSub] = useState('');
  const [detail, setDetail] = useState('');
  const [remark, setRemark] = useState('');
  const [touched, setTouched] = useState(false);

  if (state === 'upcoming') {
    return <p className="text-[12.5px] text-slate-400">ยังไม่ถึงขั้นนี้ — จะปิดงานได้เมื่อดำเนินการแล้ว</p>;
  }

  // ขั้นที่ทำแล้ว — โชว์สรุปที่บันทึกไว้ อ่านอย่างเดียว
  // (solution=solve · hw · hwDetail · resolutionDetail=repairDetail · closedBy/closedDate)
  if (state === 'done') {
    const r = resolution;
    return (
      <div className="grid grid-cols-2 gap-x-5 gap-y-4">
        <DetailRow label="ผู้ปิดงานรับเรื่อง">{r?.closedBy || '—'}</DetailRow>
        <DetailRow label="วันที่ปิดงานรับเรื่อง">{r?.closedDate ? fmtDateTime(r.closedDate) : '—'}</DetailRow>
        <DetailRow label="แนวทางการแก้ไข">{r?.solution || '—'}</DetailRow>
        <DetailRow label="สาเหตุหลัก">{r?.hw || '—'}</DetailRow>
        <DetailRow label="สาเหตุรอง">{r?.hwDetail || '—'}</DetailRow>
        <div className="col-span-2">
          <DetailRow label="รายละเอียดการดำเนินการ">
            <span className="whitespace-pre-wrap">{r?.resolutionDetail || '—'}</span>
          </DetailRow>
        </div>
      </div>
    );
  }

  // สาเหตุรองกรองตาม mainCauseId ของสาเหตุหลักที่เลือก
  const subOptions = master.subCausesOf(causeMain);
  // เปลี่ยนสาเหตุหลัก → ล้างสาเหตุรองเดิม (คู่เก่าจะไม่อยู่ในรายการใหม่แล้ว)
  const pickMain = (v: string) => {
    setCauseMain(v);
    setCauseSub('');
  };

  const missing = { solve: !solve, causeMain: !causeMain, causeSub: !causeSub, detail: !detail.trim() };
  const blocked = missing.solve || missing.causeMain || missing.causeSub || missing.detail;

  const submit = () => {
    setTouched(true);
    if (blocked) return;
    onSubmit?.(
      { code: 'closeReceive', label: 'ปิดงานรับเรื่อง', style: 'success', requireNote: false, requiredFields: [] },
      // บังคับ solve/hw/hwDetail/repairDetail · remark ไม่บังคับ
      cleanFieldValues({ solve, hw: causeMain, hwDetail: causeSub, repairDetail: detail, remark }) ?? {}
    );
  };

  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-4">
      <SelectField
        label="แนวทางการแก้ไข"
        value={solve}
        options={master.solutionNames}
        loading={master.loading}
        error={master.error}
        onRetry={master.reload}
        disabled={pending}
        invalid={touched && missing.solve}
        onChange={setSolve}
      />
      <div className="hidden md:block" />
      <SelectField
        label="สาเหตุหลัก"
        value={causeMain}
        options={master.mainCauseNames}
        loading={master.loading}
        error={master.error}
        onRetry={master.reload}
        disabled={pending}
        invalid={touched && missing.causeMain}
        onChange={pickMain}
      />
      <SelectField
        label="สาเหตุรอง"
        value={causeSub}
        options={subOptions}
        loading={master.loading}
        error={master.error}
        hint={causeMain ? undefined : 'เลือกสาเหตุหลักก่อน'}
        disabled={pending || !causeMain}
        invalid={touched && missing.causeSub}
        onChange={setCauseSub}
      />
      <div className="col-span-2">
        <label className={SVC_LABEL}>รายละเอียดการดำเนินการ</label>
        <textarea
          rows={3}
          value={detail}
          disabled={pending}
          onChange={(e) => setDetail(e.target.value)}
          className={`${SVC_INPUT} resize-none ${touched && missing.detail ? 'border-rose-300 bg-rose-50/40' : ''}`}
        />
      </div>
      <div className="col-span-2">
        <label className={SVC_LABEL}>หมายเหตุ</label>
        <input value={remark} disabled={pending} onChange={(e) => setRemark(e.target.value)} className={SVC_INPUT} />
      </div>

      {touched && blocked && (
        <p className="col-span-2 text-[11.5px] font-semibold text-rose-600">กรอกแนวทางแก้ไข / สาเหตุหลัก / สาเหตุรอง / รายละเอียดให้ครบก่อนปิดงาน</p>
      )}

      <div className="col-span-2 flex items-center gap-2 border-t border-gray-100 pt-4">
        <button
          type="button"
          disabled={pending || !onSubmit}
          onClick={submit}
          className="rounded-lg border border-emerald-600 bg-emerald-600 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          ปิดงานรับเรื่อง
        </button>
      </div>
    </div>
  );
}

// ── Tab สำรวจความพึงพอใจ — 5 หัวข้อ × 5 ระดับ รวม 25 คะแนน ─────
// ยิง action 'survey' พร้อม surveyRatings (คะแนนรายข้อ 1–5) + surveyRemark
// backend คำนวณ ServiceScore/ServiceTotal/ServicePercentage แล้วติ๊กรายข้อลง
// BC_IT_Service_Survey ให้เอง — หน้าเว็บไม่ต้องส่งคะแนนรวม
// key = ชื่อฟิลด์ใน surveyRatings ที่ API รับ (ห้ามเปลี่ยนชื่อ) · เรียงตามข้อ 1–5
const SURVEY_QUESTIONS: { key: string; text: string }[] = [
  { key: 'friendlyService', text: 'ให้บริการด้วยความสุภาพและเป็นมิตร' },
  { key: 'fastService', text: 'ความรวดเร็วในการให้บริการ' },
  { key: 'focusService', text: 'เจ้าหน้าที่กระตือรือร้น และตั้งใจทำงาน' },
  { key: 'directService', text: 'ได้รับบริการตรงตามที่คาดหวัง' },
  { key: 'serviceKnowledge', text: 'การแนะนำขั้นตอนและให้ความรู้ในเรื่องที่ให้บริการ' },
];
const SURVEY_LEVELS = [
  { v: 5, t: 'ดีมาก' },
  { v: 4, t: 'ดี' },
  { v: 3, t: 'ปานกลาง' },
  { v: 2, t: 'น้อย' },
  { v: 1, t: 'น้อยที่สุด' },
];
const SURVEY_MAX = SURVEY_QUESTIONS.length * 5; // 25

// ตารางคะแนนรายหัวข้อ — ใช้ทั้งตอนกรอก (radio) และตอนอ่านผลย้อนหลัง (readOnly = จุดทึบ)
// อ่านผลใช้จุดแทน radio disabled เพราะ radio ที่ถูก disable จะจาง จนดูไม่ออกว่าติ๊กข้อไหน
function SurveyTable({
  scores,
  disabled,
  readOnly,
  onPick,
}: {
  scores: number[];
  disabled?: boolean;
  readOnly?: boolean;
  onPick?: (i: number, v: number) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-separate border-spacing-0 text-[12px]">
        <thead>
          <tr className="text-slate-600">
            <th className="border-b border-gray-200 px-2 py-2 text-left font-semibold">หัวข้อ</th>
            {SURVEY_LEVELS.map((lv) => (
              <th key={lv.v} className="border-b border-gray-200 px-1 py-2 text-center font-semibold">
                {lv.t}
                <div className="mono text-[10.5px] text-slate-400">({lv.v})</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SURVEY_QUESTIONS.map((q, i) => (
            <tr key={q.key}>
              <td className="border-b border-gray-100 px-2 py-2 text-gray-800">
                <span className="mono mr-1.5 text-slate-400">{i + 1}</span>
                {q.text}
              </td>
              {SURVEY_LEVELS.map((lv) => (
                <td key={lv.v} className="border-b border-gray-100 px-1 py-2 text-center">
                  {readOnly ? (
                    <span
                      title={scores[i] === lv.v ? lv.t : undefined}
                      className={`inline-block h-3.5 w-3.5 rounded-full border ${
                        scores[i] === lv.v ? 'border-accent bg-accent' : 'border-gray-200 bg-slate-50'
                      }`}
                    />
                  ) : (
                    <input
                      type="radio"
                      name={`q${i}`}
                      checked={scores[i] === lv.v}
                      disabled={disabled}
                      onChange={() => onPick?.(i, lv.v)}
                      className="h-4 w-4 cursor-pointer accent-accent"
                    />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SurveyPanel({
  state,
  resolution,
  surveyLog,
  pending,
  onSubmit,
}: {
  state: StepState;
  resolution: RequestListItem['resolution'];
  surveyLog?: RequestLog | null;
  pending: boolean;
  onSubmit?: (action: RequestAction, fields: ActionFieldValues) => void | Promise<void>;
}) {
  const [scores, setScores] = useState<number[]>(Array(SURVEY_QUESTIONS.length).fill(0));
  const [remark, setRemark] = useState('');
  const [touched, setTouched] = useState(false);

  if (state === 'upcoming') {
    return <p className="text-[12.5px] text-slate-400">ยังไม่ถึงขั้นนี้ — จะประเมินได้เมื่อปิดงานรับเรื่องแล้ว</p>;
  }
  // ประเมินแล้ว → โชว์ข้อมูลที่บันทึก + ผู้ประเมิน/เวลา (อ่านอย่างเดียว)
  if (state === 'done') {
    const rs = resolution;
    const by = rs?.surveyBy || surveyLog?.actionByName || null;
    const at = rs?.surveyDate || surveyLog?.actionDate || null;
    // คะแนนรายหัวข้อจาก backend — เรียงตามลำดับคำถามบนจอ (ข้อที่ไม่ได้ส่งมา = 0 → ไม่ติ๊ก)
    const rated = SURVEY_QUESTIONS.map((q) => Number(rs?.surveyRatings?.[q.key]) || 0);
    const hasRatings = rated.some((v) => v > 0);
    // serviceScore ไม่มาแต่มีคะแนนรายข้อ → รวมเองได้ ไม่ต้องโชว์ขีด
    const score = rs?.serviceScore ?? (hasRatings ? rated.reduce((a, v) => a + v, 0) : null);
    const pctDone = rs?.servicePercentage ?? (score != null ? Math.round((score / SURVEY_MAX) * 100) : null);
    return (
      <div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-4">
          <DetailRow label="ผู้ประเมิน">{by || '—'}</DetailRow>
          <DetailRow label="วันที่ประเมิน">{at ? fmtDateTime(at) : '—'}</DetailRow>
          <DetailRow label="คะแนนที่ได้">{score != null ? `${score} / ${SURVEY_MAX}` : '—'}</DetailRow>
          <DetailRow label="คิดเป็น">{pctDone != null ? `${pctDone}%` : '—'}</DetailRow>
        </div>

        {hasRatings && (
          <div className="mt-5">
            <p className={SVC_LABEL}>คะแนนที่ให้แต่ละหัวข้อ</p>
            <SurveyTable scores={rated} readOnly />
          </div>
        )}

        <div className="mt-5">
          <DetailRow label="ข้อเสนอแนะอื่น ๆ">
            <span className="whitespace-pre-wrap">{rs?.surveyRemark || '—'}</span>
          </DetailRow>
        </div>
      </div>
    );
  }

  const total = scores.reduce((s, v) => s + v, 0);
  const answered = scores.every((v) => v > 0);
  const pct = Math.round((total / SURVEY_MAX) * 100);
  // คะแนน < 20 ต้องมีข้อเสนอแนะยาวอย่างน้อย 20 ตัวอักษร (ไม่งั้น API ตอบ 400)
  const needRemark = answered && total < 20 && remark.trim().length < 20;
  const blocked = !answered || needRemark;

  const setScore = (i: number, v: number) => setScores((prev) => prev.map((x, k) => (k === i ? v : x)));

  const submit = () => {
    setTouched(true);
    if (blocked) return;
    // ส่งคะแนน "รายข้อ" (1–5) เป็น surveyRatings เพื่อให้ backend ติ๊กระดับที่เลือกลง
    // BC_IT_Service_Survey ได้ — แต่ต้องส่ง serviceScore (ผลรวม 1–25) ไปด้วยเสมอ
    // เพราะ action `survey` บังคับฟิลด์นี้ (ไม่ส่ง = 400 "ที่ขาด: serviceScore")
    const surveyRatings: Record<string, number> = {};
    SURVEY_QUESTIONS.forEach((q, i) => {
      surveyRatings[q.key] = scores[i];
    });
    onSubmit?.(
      { code: 'survey', label: 'ส่งผลประเมิน', style: 'primary', requireNote: false, requiredFields: [] },
      cleanFieldValues({ serviceScore: total, surveyRatings, surveyRemark: remark }) ?? {
        serviceScore: total,
        surveyRatings,
      }
    );
  };

  return (
    <div>
      <SurveyTable scores={scores} disabled={pending} onPick={setScore} />

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 rounded-lg border border-gray-200 bg-slate-50 px-3.5 py-2.5 text-[12.5px]">
        <span className="text-slate-500">คะแนนเต็ม <b className="mono text-gray-800">{SURVEY_MAX}</b></span>
        <span className="text-slate-500">คะแนนที่ได้ <b className="mono text-gray-800">{total}</b></span>
        <span className="text-slate-500">คิดเป็น <b className="mono text-gray-800">{pct}%</b></span>
        {!answered && <span className="text-rose-600">— ยังตอบไม่ครบทุกข้อ</span>}
      </div>

      <div className="mt-4">
        <label className={SVC_LABEL}>
          ข้อเสนอแนะอื่น ๆ
          {answered && total < 20 && (
            <span className="text-rose-600"> * (คะแนนต่ำกว่า 20 ต้องระบุอย่างน้อย 20 ตัวอักษร — ตอนนี้ {remark.trim().length})</span>
          )}
        </label>
        <textarea
          rows={2}
          value={remark}
          disabled={pending}
          onChange={(e) => setRemark(e.target.value)}
          className={`${SVC_INPUT} resize-none ${touched && needRemark ? 'border-rose-300 bg-rose-50/40' : ''}`}
        />
      </div>

      {touched && blocked && (
        <p className="mt-2 text-[11.5px] font-semibold text-rose-600">
          {!answered ? 'กรุณาให้คะแนนครบทั้ง 5 ข้อ' : 'คะแนนต่ำกว่า 20 ต้องระบุข้อเสนอแนะอย่างน้อย 20 ตัวอักษร'}
        </p>
      )}

      <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-4">
        <button
          type="button"
          disabled={pending || !onSubmit}
          onClick={submit}
          className="rounded-lg border border-accent bg-accent px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[#17539f] disabled:cursor-not-allowed disabled:opacity-50"
        >
          ส่งผลประเมิน
        </button>
      </div>
    </div>
  );
}

// ── Tab ปิดงาน — สรุปผล KPI แล้วปิดใบ ──────────────────────────
// ตาราง 4 กรณี × 4 ผล เลือกได้ช่องเดียวทั้งตาราง → caseNo (แถว) + kpi (คอลัมน์)
// ยิง action 'close' พร้อม caseNo/kpi (ฟิลด์มีใน shim อยู่แล้ว)
const KPI_CASES = [
  'แก้ไขเองได้ (ทั้ง Software และ Hardware) ภายใน 1 ชั่วโมงทำงาน หลังจากต้นสังกัดอนุมัติในโปรแกรม ยกเว้นแจ้งก่อนเวลาเลิกงานไม่เกิน 1 ชั่วโมงหรือแจ้งในวันเสาร์ จะต้องแก้ไขให้แล้วเสร็จภายใน 9 โมงเช้าของวันทำงานถัดไป',
  'กรณีแก้ไขเองได้ (ทั้ง Software และ Hardware อาการหนัก เช่น ลง Windows ใหม่) ภายใน 3 วันทำการ หลังจากต้นสังกัดอนุมัติในโปรแกรม',
  'กรณี Software ที่ต้องปรึกษาการแก้ไขปัญหาจากบุคคลภายนอก ภายใน 7-15 วัน หลังจากต้นสังกัดอนุมัติในโปรแกรม',
  'กรณี Hardware ที่ต้องส่งซ่อมภายนอกหรือขอซื้อใหม่ทั้ง Software + Hardware ภายใน 15-30 วัน หลังจากต้นสังกัดอนุมัติในโปรแกรม',
];
const KPI_RESULTS = ['ตาม KPI', 'ตก KPI', 'ยกเลิก', 'ยังไม่ถึงกำหนด'];

// สีป้ายผล KPI — ผลที่ backend ส่งมานอกลิสต์ (แผนกอื่น) ใช้สีกลาง ไม่เดาความหมาย
function kpiChipStyle(kpi: string): React.CSSProperties {
  if (kpi === 'ตาม KPI') return { background: '#ecfdf5', color: '#047857' };
  if (kpi === 'ตก KPI') return { background: '#fef2f2', color: '#b91c1c' };
  if (kpi === 'ยกเลิก') return { background: '#f1f5f9', color: '#475569' };
  return { background: '#fffbeb', color: '#b45309' };
}

function KpiPanel({
  state,
  resolution,
  closeLog,
  pending,
  onSubmit,
}: {
  state: StepState;
  resolution: RequestListItem['resolution'];
  // fallback ชื่อ/เวลา ถ้า backend ยังไม่คืน jobClosedBy/jobClosedDate
  closeLog?: RequestLog | null;
  pending: boolean;
  onSubmit?: (action: RequestAction, fields: ActionFieldValues) => void | Promise<void>;
}) {
  // เลือกได้ช่องเดียวทั้งตาราง: sel = "แถว:คอลัมน์"
  const [sel, setSel] = useState<string>('');
  const [touched, setTouched] = useState(false);

  if (state === 'upcoming') {
    return <p className="text-[12.5px] text-slate-400">ยังไม่ถึงขั้นนี้ — จะปิดงานได้เมื่อผ่านขั้นก่อนหน้า</p>;
  }

  // ปิดงานแล้ว = ตารางเดิมแบบอ่านอย่างเดียว ติ๊กช่องที่บันทึกไว้ (ไม่สรุปเป็นข้อความ)
  // ผู้ใช้จะได้เห็นหน้าตาเหมือนตอนกดปิดเป๊ะ ๆ ว่าเลือกกรณีไหน ผลอะไร
  const done = state === 'done';
  const rs = resolution;
  const closedBy = rs?.jobClosedBy || closeLog?.actionByName || null;
  const closedAt = rs?.jobClosedDate || closeLog?.actionDate || null;
  const hasTiming = !!(rs?.kpiStartDate || rs?.kpiDueDate || rs?.kpiUsedHours != null);

  // ช่องที่ติ๊ก: ตอนปิดแล้วอ่านจาก resolution, ตอนกำลังกรอกอ่านจาก state
  const savedRow = done && rs?.caseNo ? Number(rs.caseNo) - 1 : -1;
  const savedCol = done && rs?.kpi ? KPI_RESULTS.indexOf(rs.kpi) : -1;
  const [selRow, selCol] = done
    ? [savedRow, savedCol]
    : sel
    ? (sel.split(':').map(Number) as [number, number])
    : [-1, -1];
  const blocked = sel === '';

  const submit = () => {
    setTouched(true);
    if (blocked) return;
    onSubmit?.(
      { code: 'close', label: 'ปิดงาน', style: 'success', requireNote: false, requiredFields: [] },
      // ช่องที่เลือกในตาราง = caseNo (แถว, ฐาน 1) + kpi (คอลัมน์) — ส่งข้อความผล KPI
      // ไม่ใช่ index เพราะ DB เก็บเป็นข้อความ (ดู ACTION_FIELDS.kpi)
      cleanFieldValues({ caseNo: String(selRow + 1), kpi: KPI_RESULTS[selCol] }) ?? {}
    );
  };

  return (
    <div>
      {done && (
        <div className="mb-4 grid grid-cols-2 gap-x-5 gap-y-4 border-b border-gray-100 pb-4">
          <DetailRow label="ผู้ปิดงาน">{closedBy || '—'}</DetailRow>
          <DetailRow label="วันที่ปิดงาน">{closedAt ? fmtDateTime(closedAt) : '—'}</DetailRow>
          {/* ตัวเลข KPI มาจาก backend เท่านั้น — แผนกที่ไม่มีเกณฑ์จะไม่ส่งมา ก็ไม่ต้องโชว์ */}
          {hasTiming && (
            <>
              <DetailRow label="เริ่มนับ KPI">{rs?.kpiStartDate ? fmtDateTime(rs.kpiStartDate) : '—'}</DetailRow>
              <DetailRow label="ครบกำหนด / เวลาที่ใช้">
                <span className="mono">
                  {rs?.kpiDueDate ? fmtDateTime(rs.kpiDueDate) : '—'}
                  {rs?.kpiUsedHours != null && ` · ใช้ไป ${rs.kpiUsedHours} ชม.`}
                </span>
              </DetailRow>
            </>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-separate border-spacing-0 text-[12px]">
          <thead>
            <tr className="text-slate-600">
              <th className="border-b border-gray-200 px-2 py-2 text-left font-semibold">กรณี / รายละเอียด</th>
              {KPI_RESULTS.map((res) => (
                <th key={res} className="w-20 border-b border-gray-200 px-1 py-2 text-center font-semibold">
                  {res}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {KPI_CASES.map((desc, row) => (
              <tr key={row} className={done && selRow === row ? 'bg-emerald-50/60' : undefined}>
                <td className="border-b border-gray-100 px-2 py-2 align-top text-gray-800">
                  <span className="mono mr-1.5 text-slate-400">{row + 1}</span>
                  {/* เกณฑ์ที่ backend คืนมา (caseName) ชนะลิสต์ในโค้ดเสมอ — เกณฑ์อาจถูกแก้ทีหลัง */}
                  {done && selRow === row && rs?.caseName ? rs.caseName : desc}
                </td>
                {KPI_RESULTS.map((res, col) => (
                  <td key={col} className="border-b border-gray-100 px-1 py-2 text-center align-top">
                    <input
                      type="radio"
                      name="kpi-matrix"
                      checked={selRow === row && selCol === col}
                      disabled={pending || done}
                      readOnly={done}
                      onChange={() => setSel(`${row}:${col}`)}
                      className={`h-4 w-4 accent-accent ${done ? '' : 'cursor-pointer'}`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ปิดแล้วแต่ backend ยังไม่คืน caseNo/kpi → ตารางจะว่างทั้งตาราง บอกไปตรง ๆ ดีกว่าปล่อยงง */}
      {done && (selRow < 0 || selCol < 0) && (
        <p className="mt-2 text-[11.5px] text-slate-400">
          ไม่มีผล KPI ที่บันทึกไว้
          {rs?.kpi && selCol < 0 && (
            <>
              {' '}
              — ผลที่บันทึก:{' '}
              <span className="rounded-md px-1.5 py-0.5 font-semibold" style={kpiChipStyle(rs.kpi)}>
                {rs.kpi}
              </span>
            </>
          )}
        </p>
      )}

      {!done && touched && blocked && (
        <p className="mt-2 text-[11.5px] font-semibold text-rose-600">เลือกผล KPI 1 ช่องก่อนปิดงาน</p>
      )}

      <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-4">
        {done ? (
          <span className="text-[12px] font-semibold text-emerald-700">ปิดใบเรียบร้อย</span>
        ) : (
          <button
            type="button"
            disabled={pending || !onSubmit}
            onClick={submit}
            className="rounded-lg border border-emerald-600 bg-emerald-600 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ปิดงาน
          </button>
        )}
      </div>
    </div>
  );
}

// ── Tab General — ข้อมูลเรื่องที่แจ้งเข้ามา ────────────────────
// ส่วนกลาง: เลขใบ / ผู้แจ้ง / หน่วยงาน / รายละเอียด / รูป / ผู้อนุมัติ(MGR)+เวลา
// ช่องที่เหลือขึ้นกับโมดูล เพราะแต่ละแผนกกรอกคนละอย่างตอนสร้างใบ —
//   IT = เบอร์ติดต่อ + ชื่อคอมพิวเตอร์
//   PL = ประเภท + เรื่องที่แจ้ง + วันที่ต้องการใช้งาน + เหตุผลการขอ + รายการที่ขอ
// (ห้ามโชว์ช่องของ IT กับใบแผนกอื่น — ผู้อนุมัติจะอ่านใบผิดเรื่อง)
function GeneralPanel({
  item,
  full,
  plDoc,
  plLines,
  attachments,
  approveLogs,
  editing,
  editPending,
  editHint,
  onEditCancel,
  onEditSubmit,
  canEditFields,
  canAttachFiles,
  attachBlockedReason,
  pendingAtt,
  attachBusy,
  onStageAttachment,
  crMaster,
  crDoc,
}: {
  item: RequestListItem;
  full: RequestListItem;
  plDoc: PlRequestDetail | null;
  plLines: { lines: PlRequestLine[] | null; loading: boolean; error: string | null };
  attachments: RequestAttachment[] | null;
  approveLogs: RequestLog[];
  editing?: boolean;
  editPending?: boolean;
  // เหตุผลที่ปุ่มแก้ไขไม่ขึ้น (null = แก้ได้ หรือไม่ต้องบอก)
  editHint?: string | null;
  onEditCancel?: () => void;
  onEditSubmit?: (form: RequestEditForm) => void | Promise<void>;
  // สองสิทธิ์นี้แยกกัน: ฟิลด์หัวใบ (canEdit) กับรูปแนบ (canAttach)
  // ปลายทางที่รับงานแล้วเข้าฟอร์มมาได้โดยแก้ได้แค่รูป
  canEditFields?: boolean;
  canAttachFiles?: boolean;
  attachBlockedReason?: string | null;
  pendingAtt?: PendingAttachments;
  attachBusy?: boolean;
  onStageAttachment?: (slot: number, change: PendingAttachment | null) => void;
  // ตัวเลือก + ค่าดิบของใบ CR (ใช้ทั้งหน้าอ่านและฟอร์มแก้ไข)
  crMaster: CrMasterData;
  crDoc: { doc: CrRequestDetail | null; loading: boolean; error: string | null };
}) {
  const imgs = attachments ?? [];
  const isPl = full.module === 'PL';
  // ใบ CR กรอกคนละชุดกับ IT/PL (ส่วนงาน → ประเภทที่แจ้ง → รายละเอียดที่แจ้ง)
  // ถ้าไม่แยกออกมา ใบ CR จะไปโชว์ช่องของ IT (เบอร์ติดต่อ/ชื่อคอมพิวเตอร์) ซึ่งว่างเปล่าทุกใบ
  const isCr = full.module === 'CR';
  // โมดูลนี้มีเส้นรูปแนบไหม — ดูจากทะเบียน endpoint ไม่ใช่ชื่อโมดูล
  // (เปิดเส้นให้ CR เมื่อไร หัวข้อรูปภาพจะกลับมาเองโดยไม่ต้องแก้ตรงนี้)
  const hasAttachments = attachmentApiOf(full.module).slots.length > 0;

  if (editing && onEditSubmit) {
    return (
      <RequestEditPanel
        item={full}
        lines={plLines.lines}
        doc={plDoc}
        attachments={imgs}
        pending={!!editPending}
        fieldsEditable={canEditFields !== false}
        canAttachFiles={canAttachFiles !== false}
        attachBlockedReason={attachBlockedReason}
        pendingAtt={pendingAtt ?? {}}
        attachBusy={!!attachBusy}
        onStageAttachment={onStageAttachment}
        onCancel={() => onEditCancel?.()}
        onSubmit={onEditSubmit}
        crMaster={crMaster}
        crDoc={crDoc}
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-4">
      <DetailRow label="เลขใบแจ้งเรื่อง">
        <span className="mono font-semibold text-gray-900">{item.docNo}</span>
      </DetailRow>
      <DetailRow label="ผู้แจ้งเรื่อง">{full.requestBy || '—'}</DetailRow>
      <DetailRow label="หน่วยงาน">{full.departmentName || '—'}</DetailRow>

      {isPl ? (
        <>
          <DetailRow label="ประเภท">{full.type || '—'}</DetailRow>
          <DetailRow label="เรื่องที่แจ้ง">{full.requestType || '—'}</DetailRow>
          <DetailRow label="วันที่ต้องการใช้งาน">
            {full.planDate ? <span className="mono">{fmtDate(full.planDate)}</span> : '—'}
          </DetailRow>
        </>
      ) : isCr ? (
        <>
          {/* ชุดนี้คือข้อมูลที่ Mgr ใช้ตัดสินใจก่อนกดอนุมัติ — ปุ่มอนุมัติอยู่ท้ายแท็บนี้
              ค่าดิบจาก GET /CRRequest/{docNo} แยกช่องมาให้ (เส้นกลางรวม ประเภท+รายละเอียด
              เป็นข้อความเดียว) — ยังโหลดไม่เสร็จ/ไม่ติด ค่อย fallback ไปใช้ของเส้นกลาง */}
          <DetailRow label="ส่วนงาน">
            {crDoc.doc?.section || full.type ? (
              <span className="mono font-semibold">{crDoc.doc?.section || full.type}</span>
            ) : (
              '—'
            )}
          </DetailRow>
          <DetailRow label="ประเภทที่แจ้ง">
            {crDoc.doc?.requestType || full.requestType || '—'}
          </DetailRow>
          {crDoc.doc && (
            <DetailRow label="รายละเอียดที่แจ้ง">{crDoc.doc.requestSubType || '—'}</DetailRow>
          )}
          {crDoc.doc?.requestSubOther && (
            <DetailRow label="ระบุเพิ่มเติม">{crDoc.doc.requestSubOther}</DetailRow>
          )}
          {/* ⚠️ ใบ CR เก็บ "วันที่ต้องการ" ไว้ในคอลัมน์ RequestDate (ยืนยัน 1 ก.ย. 2026)
              ไม่ใช่วันที่แจ้ง — ดู MdApi/API_SPEC_CR_FLOW.md §3 */}
          <DetailRow label="วันที่ต้องการ">
            {crDoc.doc?.requestDate || full.requestDate ? (
              <span className="mono">{fmtDate(crDoc.doc?.requestDate || full.requestDate)}</span>
            ) : (
              '—'
            )}
          </DetailRow>
        </>
      ) : (
        <>
          <DetailRow label="เบอร์ติดต่อ">{full.phoneNumber || '—'}</DetailRow>
          <DetailRow label="ชื่อคอมพิวเตอร์">{full.comName || '—'}</DetailRow>
        </>
      )}

      <div className="col-span-2">
        <span className="mb-1 block text-[11.5px] font-semibold text-gray-500">
          {isPl ? 'ระบุเรื่องที่แจ้ง' : 'รายละเอียดเรื่องที่แจ้ง'}
        </span>
        <div className="rounded-lg border border-gray-200 bg-slate-50 px-3.5 py-3 text-[13px] leading-relaxed text-gray-800">
          <span className="whitespace-pre-wrap">{full.detail || '— (ผู้แจ้งไม่ได้กรอกรายละเอียด)'}</span>
        </div>
      </div>

      {isPl && (
        <>
          <div className="col-span-2">
            <span className="mb-1 block text-[11.5px] font-semibold text-gray-500">เหตุผลการขอ</span>
            <div className="rounded-lg border border-gray-200 bg-slate-50 px-3.5 py-3 text-[13px] leading-relaxed text-gray-800">
              <span className="whitespace-pre-wrap">{full.remark || '— (ไม่ได้ระบุ)'}</span>
            </div>
          </div>

          <div className="col-span-2">
            <span className="mb-1.5 block text-[11.5px] font-semibold text-gray-500">รายการที่ขอ</span>
            <PlLinesTable {...plLines} />
          </div>
        </>
      )}

      {/* รูปภาพ — เสิร์ฟผ่าน API ที่ต้องใช้ token จึงโหลดเป็น blob เอง (ดู AttachmentThumb)
          หน้าอ่านโชว์อย่างเดียว การเพิ่ม/ลบอยู่ในฟอร์มแก้ไขและมีผลตอนกดบันทึกเท่านั้น
          โมดูลที่ไม่มีเส้นรูปแนบ (CR) ไม่ต้องขึ้นหัวข้อนี้เลย — ขึ้นแล้วบอกว่า
          "ไม่มีรูปแนบ" ทุกใบตลอดกาล ทำให้คนอ่านนึกว่าผู้แจ้งลืมแนบ */}
      {hasAttachments && (
        <div className="col-span-2">
          <span className="mb-1.5 block text-[11.5px] font-semibold text-gray-500">รูปภาพ</span>
          {imgs.length === 0 ? (
            <span className="text-[13px] text-slate-400">— ไม่มีรูปแนบ</span>
          ) : (
            <div className="flex flex-wrap gap-2">
              {imgs.map((f) => (
                <AttachmentThumb key={f.fileId} url={f.url} fileName={f.fileName} />
              ))}
            </div>
          )}
          {canAttachFiles === false && attachBlockedReason && (
            <p className="mt-1.5 text-[11.5px] text-slate-400">{attachBlockedReason}</p>
          )}
        </div>
      )}

      {/* ชื่อ MGR ที่อนุมัติ พร้อมวันเวลา — จาก logs (action = approve)
          workflow ที่อนุมัติหลายรอบ (เช่น PS) จะขึ้นครบทุกคน */}
      <div className="col-span-2">
        <span className="mb-1.5 block text-[11.5px] font-semibold text-gray-500">ผู้อนุมัติ (MGR)</span>
        {approveLogs.length === 0 ? (
          <span className="text-[13px] text-slate-400">— ยังไม่มีการอนุมัติ</span>
        ) : (
          <div className="flex flex-col gap-1.5">
            {approveLogs.map((l, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[12.5px]"
              >
                <IconCircleCheck size={15} className="shrink-0 text-emerald-600" />
                <span className="font-semibold text-gray-800">{l.actionByName || '—'}</span>
                {l.actionByDepartment && <span className="text-slate-500">· {l.actionByDepartment}</span>}
                {l.actionDate && <span className="mono ml-auto text-slate-500">{fmtDateTime(l.actionDate)}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* แก้ไม่ได้ = บอกเหตุผลไปเลย ดีกว่าปล่อยให้หาปุ่มที่ไม่มี */}
      {editHint && (
        <p className="col-span-2 text-[12px] text-slate-400">— {editHint}</p>
      )}
    </div>
  );
}

// ── ตารางรายการที่ขอของใบ PL (อ่านอย่างเดียว) ──────────────────
// แถวที่ cancel = true คือแถวที่ถูกยกเลิกไปแล้วแต่ยังเก็บไว้เป็นประวัติ
// → แสดงจาง + ขีดฆ่า ไม่ใช่ซ่อน (ผู้อนุมัติต้องเห็นว่าเคยขออะไรมาก่อน)
function PlLinesTable({
  lines,
  loading,
  error,
  showReceived,
}: {
  lines: PlRequestLine[] | null;
  loading: boolean;
  error: string | null;
  // "รับจำนวน" มีความหมายหลังปลายทางเริ่มจ่ายของแล้ว — ตอนขอยังเป็น 0 ทุกแถว
  // จึงโชว์เฉพาะแท็บ Attachment / Service ไม่ใช่หน้า General
  showReceived?: boolean;
}) {
  if (loading)
    return (
      <span className="flex items-center gap-1.5 text-[13px] text-slate-400">
        <IconLoader2 size={14} className="animate-spin" />
        กำลังโหลดรายการ…
      </span>
    );

  if (error)
    return (
      <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-amber-700">
        <IconAlertTriangle size={14} className="shrink-0" />
        {error}
      </span>
    );

  if (!lines || lines.length === 0)
    return <span className="text-[13px] text-slate-400">— ใบนี้ไม่มีรายการที่ขอ</span>;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-[#0b1220] text-[11.5px] font-semibold text-slate-300">
            <th className="w-10 px-2 py-2 text-center">#</th>
            <th className="px-2 py-2 text-left">รายการ</th>
            <th className="w-20 px-2 py-2 text-center">จำนวน</th>
            {showReceived && <th className="w-20 px-2 py-2 text-center">รับจำนวน</th>}
            <th className="w-24 px-2 py-2 text-center">หน่วย</th>
            <th className="px-2 py-2 text-left">หมายเหตุ</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((li, i) => (
            <tr
              key={li.recNo}
              className={`border-b border-[#eef1f6] text-[12.5px] last:border-b-0 ${
                li.cancel ? 'bg-slate-50 text-slate-400 line-through' : 'bg-white text-gray-800'
              }`}
              title={li.cancel ? `ยกเลิกโดย ${li.cancelBy || '—'}` : undefined}
            >
              <td className="mono px-2 py-2 text-center text-slate-400">{i + 1}</td>
              <td className="px-2 py-2">{li.item}</td>
              <td className="mono px-2 py-2 text-center">{li.qty}</td>
              {showReceived && (
                <td className="mono px-2 py-2 text-center">
                  {/* รับครบแล้วเน้นเขียว ยังไม่ครบเป็นสีส้ม — เห็นได้ทันทีว่าค้างแถวไหน */}
                  <span className={li.received >= li.qty ? 'font-semibold text-emerald-700' : 'text-amber-700'}>
                    {li.received}
                  </span>
                </td>
              )}
              <td className="px-2 py-2 text-center">{li.unit || '—'}</td>
              <td className="px-2 py-2">{li.remark || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type PlLinesState = { lines: PlRequestLine[] | null; loading: boolean; error: string | null };

// ── แท็บ Attachment ของใบ PL (อ่านอย่างเดียว) ───────────────────
// เช็คลิสต์ "ส่งแนบมาด้วย" + เลขที่เอกสารแนบ + รายการที่ขอ ตามฟอร์ม WinForms
// ⚠️ คนละเรื่องกับรูปแนบ (ImgPath1-3) ที่อยู่ในแท็บ General
function PlAttachmentPanel({
  doc,
  loading,
  plLines,
  pending,
  blockedReason,
  onSave,
}: {
  doc: PlRequestDetail | null;
  loading: boolean;
  plLines: PlLinesState;
  pending: boolean;
  blockedReason?: string | null; // เหตุผลไทยจาก API เมื่อบันทึกไม่ได้
  // ไม่ส่งมา = เปิดดูอย่างเดียว (ไม่มีสิทธิ์บันทึก)
  onSave?: (
    attach: Record<PlAttachKey, boolean>,
    attachDocs: Record<PlAttachDocKey, string>
  ) => void | Promise<void>;
}) {
  const [attach, setAttach] = useState<Record<PlAttachKey, boolean>>(emptyAttach);
  const [attachDocs, setAttachDocs] = useState<Record<PlAttachDocKey, string>>(emptyAttachDocs);
  const [docErrors, setDocErrors] = useState<Partial<Record<PlAttachDocKey, string>>>({});

  // เติมค่าจากใบเมื่อโหลดเสร็จ / โหลดใหม่หลังบันทึก — doc เปลี่ยน reference เฉพาะตอน
  // fetch ใหม่ ระหว่างที่ผู้ใช้ติ๊กค้างไว้จึงไม่โดนล้าง
  useEffect(() => {
    if (!doc) return;
    setAttach(
      PL_ATTACH_CHECKS.reduce(
        (acc, c) => ({ ...acc, [c.key]: !!doc[c.key] }),
        {} as Record<PlAttachKey, boolean>
      )
    );
    setAttachDocs({
      budgetDocNo: doc.budgetDocNo ?? '',
      exBudgetDocNo: doc.exBudgetDocNo ?? '',
      attachOtherDetail: doc.attachOtherDetail ?? '',
    });
    setDocErrors({});
  }, [doc]);

  if (loading)
    return (
      <span className="flex items-center gap-1.5 text-[13px] text-slate-400">
        <IconLoader2 size={14} className="animate-spin" />
        กำลังโหลด…
      </span>
    );

  if (!doc)
    return (
      <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-amber-700">
        <IconAlertTriangle size={14} className="shrink-0" />
        โหลดข้อมูลเอกสารแนบของใบนี้ไม่สำเร็จ
      </p>
    );

  const editable = !!onSave;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <span className="mb-1.5 block text-[11.5px] font-semibold text-gray-500">ส่งแนบมาด้วย</span>
        <div className="flex flex-col gap-1.5 rounded-xl border border-gray-200 bg-white p-3">
          {PL_ATTACH_CHECKS.map((c) => {
            const docKey = c.docKey;
            // ช่องข้อความโผล่เฉพาะหัวข้อที่ติ๊ก และเมื่อโผล่แล้วต้องกรอก
            const showDoc = !!docKey && attach[c.key];
            const err = docKey ? docErrors[docKey] : undefined;
            return (
              <div key={c.key} className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <label
                    className={`flex min-w-[230px] items-center gap-2 text-[12.5px] text-gray-800 ${
                      editable ? 'cursor-pointer' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={attach[c.key]}
                      disabled={!editable || pending}
                      onChange={(e) => {
                        setAttach((a) => ({ ...a, [c.key]: e.target.checked }));
                        // ปลดติ๊ก = ช่องหาย error ของช่องนั้นต้องหายตาม
                        if (docKey) setDocErrors((x) => ({ ...x, [docKey]: undefined }));
                      }}
                      className="h-4 w-4 accent-accent disabled:cursor-not-allowed"
                    />
                    {c.label}
                  </label>
                  {showDoc && docKey && (
                    <>
                      <input
                        type="text"
                        value={attachDocs[docKey]}
                        maxLength={c.docMax ?? PL_CHECKLIST_MAX[docKey]}
                        disabled={!editable || pending}
                        placeholder={c.docLabel}
                        onChange={(e) => {
                          const v = e.target.value;
                          setAttachDocs((d) => ({ ...d, [docKey]: v }));
                          setDocErrors((x) => ({ ...x, [docKey]: undefined }));
                        }}
                        className={`${LINE_INPUT_CLS} max-w-[260px] flex-1 ${
                          err ? 'border-red-300' : ''
                        }`}
                      />
                      <span className="text-[11.5px] font-bold text-red-500">*</span>
                    </>
                  )}
                </div>
                {showDoc && err && (
                  <p className="pl-6 text-[11.5px] font-semibold text-red-600">{err}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {!editable && (
        <p className="flex items-center gap-1.5 text-[12px] text-slate-500">
          <IconAlertTriangle size={13} className="shrink-0 text-slate-400" />
          {blockedReason || 'ตอนนี้บันทึกเอกสารแนบไม่ได้'}
        </p>
      )}

      {editable && (
        <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              const errs = validatePlChecklist(attach, attachDocs);
              setDocErrors(errs);
              if (Object.keys(errs).length > 0) return;
              onSave?.(attach, attachDocs);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-accent bg-accent px-4 py-2 text-[13px] font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? <IconLoader2 size={15} className="animate-spin" /> : <IconDeviceFloppy size={15} />}
            บันทึกข้อมูล
          </button>
          <span className="text-[11.5px] text-slate-400">บันทึกได้เรื่อย ๆ ไม่เลื่อนขั้นงาน</span>
        </div>
      )}

      <div>
        <span className="mb-1.5 block text-[11.5px] font-semibold text-gray-500">รายการที่ขอ</span>
        <PlLinesTable {...plLines} showReceived />
      </div>
    </div>
  );
}

const emptyAttach = (): Record<PlAttachKey, boolean> =>
  PL_ATTACH_CHECKS.reduce((acc, c) => ({ ...acc, [c.key]: false }), {} as Record<PlAttachKey, boolean>);

const emptyAttachDocs = (): Record<PlAttachDocKey, string> => ({
  budgetDocNo: '',
  exBudgetDocNo: '',
  attachOtherDetail: '',
});

// ── แท็บ Service ของใบ PL (อ่านอย่างเดียว) ──────────────────────
// ปุ่มของขั้นนี้ไม่ได้อยู่ในแผง — มาจาก availableActions ที่ API ส่งมา
// แล้วบล็อกปุ่มมาตรฐานด้านล่างเป็นคนแสดงให้ (ดูกติกา "ปุ่มคือ data ไม่ใช่ code")
function PlServicePanel({
  state,
  actions,
  resolution,
  serviceLog,
  plLines,
  pending,
  onSubmit,
}: {
  state: StepState;
  actions: RequestAction[];
  resolution: RequestResolution | null | undefined;
  serviceLog: RequestLog | null;
  plLines: PlLinesState;
  pending: boolean;
  onSubmit?: (action: RequestAction, fields: ActionFieldValues) => void | Promise<void>;
}) {
  const by = resolution?.servicedBy || serviceLog?.actionByName;
  const when = resolution?.servicedDate || serviceLog?.actionDate;

  // ปุ่ม 2 ปุ่มมาจาก availableActions ที่ API ส่งมาในขั้นนี้:
  //   saveService (บันทึกอย่างเดียว กดกี่ครั้งก็ได้) / service (บันทึก + เลื่อน step)
  // ไม่มีปุ่ม = ไม่ใช่คิวเรา/ไม่มีสิทธิ์ → แผงกลายเป็นอ่านอย่างเดียวเอง
  const svc = actions.filter((a) => a.code === 'saveService' || a.code === 'service');
  const editable = svc.length > 0 && !!onSubmit;

  const [actionDetail, setActionDetail] = useState('');
  const [repairDetail, setRepairDetail] = useState('');
  const [touched, setTouched] = useState(false);

  // เติมฟอร์มจากค่าที่บันทึกไว้ — resolution เปลี่ยน reference เฉพาะตอนโหลดใบใหม่
  // (เปิดใบ / หลังเซฟ) ระหว่างพิมพ์จึงไม่โดนล้าง · ตั้งเฉพาะช่องที่ API คืนค่ามา
  useEffect(() => {
    if (!resolution) return;
    // actionDetail = ช่องจริงของ PL · solution เป็นค่าเก่าของใบที่บันทึกก่อนเปลี่ยนชื่อฟิลด์
    if (resolution.actionDetail || resolution.solution)
      setActionDetail(resolution.actionDetail || resolution.solution || '');
    if (resolution.resolutionDetail) setRepairDetail(resolution.resolutionDetail);
  }, [resolution]);

  // actionDetail บังคับตอนกด service (API ระบุว่าเป็นฟิลด์บังคับของขั้นนี้)
  const actionDetailMissing = actionDetail.trim() === '';
  const submit = (a: RequestAction) => {
    setTouched(true);
    if (a.code === 'service' && actionDetailMissing) return;
    // ไม่ส่ง repairStatus / exPrNo แล้ว (เอาช่องออกจากจอ) — ฟิลด์ที่ไม่ส่ง
    // backend ถือว่า "ไม่เปลี่ยน" ค่าเดิมในใบเก่าจึงไม่ถูกล้างทิ้ง
    // ⚠️ ชิม: API ยังบังคับ solve อยู่ (400 "ที่ขาด: solve") จึงส่งค่าเดียวกันไปด้วย
    //    ลบ solve ออกได้เมื่อ backend รับ actionDetail เป็นฟิลด์บังคับแทน
    onSubmit?.(a, cleanFieldValues({ actionDetail, solve: actionDetail, repairDetail }) ?? {});
  };

  return (
    <div className="flex flex-col gap-4">
      {state === 'upcoming' ? (
        <p className="text-[12.5px] text-slate-400">— ยังไม่ถึงขั้นดำเนินการ</p>
      ) : editable ? (
        <>
          {/* ชื่อฟิลด์ตามสเปก PL: actionDetail = ผลการดำเนินงาน
              · repairDetail = รายละเอียดการดำเนินงาน
              ช่อง "การดำเนินการ" (repairStatus) กับ "เลขที่ใบ PR อ้างอิง" (exPrNo)
              ถูกเอาออกจากจอตามที่ผู้ใช้สั่ง 27 ส.ค. 2026 — ฟิลด์ยังมีใน API อยู่ */}
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <div>
              <label className={SVC_LABEL}>รายละเอียดการดำเนินงาน</label>
              <textarea
                rows={4}
                value={repairDetail}
                disabled={pending}
                onChange={(e) => setRepairDetail(e.target.value)}
                className={`${SVC_INPUT} resize-y leading-relaxed`}
              />
            </div>
            <div>
              <label className={SVC_LABEL}>
                ผลการดำเนินงาน<span className="text-rose-600"> *</span>
              </label>
              <textarea
                rows={4}
                value={actionDetail}
                disabled={pending}
                onChange={(e) => setActionDetail(e.target.value)}
                className={`${SVC_INPUT} resize-y leading-relaxed ${
                  touched && actionDetailMissing ? 'border-rose-300 bg-rose-50/40' : ''
                }`}
              />
            </div>
          </div>

          {touched && actionDetailMissing && (
            <p className="text-[11.5px] font-semibold text-rose-600">
              ต้องกรอก “ผลการดำเนินงาน” ก่อนกดดำเนินการ
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
            {svc.map((a) => (
              <button
                key={a.code}
                type="button"
                disabled={pending}
                onClick={() => submit(a)}
                className={`rounded-lg border px-4 py-2 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${actionBtnClass(
                  a.style
                )}`}
              >
                {a.label}
              </button>
            ))}
            <span className="text-[11.5px] text-slate-400">
              “บันทึกข้อมูล” เก็บค่าไว้เฉย ๆ · “ดำเนินการ” บันทึกแล้วเลื่อนขั้นงาน
            </span>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-2 gap-x-5 gap-y-3">
          <div>
            <span className="mb-1 block text-[11.5px] font-semibold text-gray-500">รายละเอียดการดำเนินงาน</span>
            <div className="min-h-[76px] rounded-lg border border-gray-200 bg-slate-50 px-3.5 py-3 text-[13px] leading-relaxed text-gray-800">
              <span className="whitespace-pre-wrap">{resolution?.resolutionDetail || '— (ยังไม่ได้บันทึก)'}</span>
            </div>
          </div>
          <div>
            <span className="mb-1 block text-[11.5px] font-semibold text-gray-500">ผลการดำเนินงาน</span>
            <div className="min-h-[76px] rounded-lg border border-gray-200 bg-slate-50 px-3.5 py-3 text-[13px] leading-relaxed text-gray-800">
              <span className="whitespace-pre-wrap">
                {resolution?.actionDetail || resolution?.solution || '— (ยังไม่ได้บันทึก)'}
              </span>
            </div>
          </div>
          <DetailRow label="ผู้ดำเนินการ">{by || '—'}</DetailRow>
          <DetailRow label="วันที่ดำเนินการ">{when ? fmtDateTime(when) : '—'}</DetailRow>
        </div>
      )}

      <div>
        <span className="mb-1.5 block text-[11.5px] font-semibold text-gray-500">รายการที่ขอ</span>
        <PlLinesTable {...plLines} showReceived />
      </div>
    </div>
  );
}

// ── แท็บปิดงานของใบ PL (ขั้นสุดท้าย — แผนกผู้แจ้งเป็นคนกด) ────────
// ⚠️ ใช้ jobClosedBy/jobClosedDate (action `close`) ไม่ใช่ closedBy/closedDate
//    ซึ่งเป็นของขั้น "ปิดงานรับเรื่อง" ของ IT — คนละขั้น คนละคนกด
function PlClosePanel({
  state,
  resolution,
  closeLog,
}: {
  state: StepState;
  resolution: RequestResolution | null | undefined;
  closeLog: RequestLog | null;
}) {
  // ลำดับที่มาของ "ใครปิด/ปิดเมื่อไร" — เอาตัวแรกที่ API ส่งมาจริง:
  //   1) jobClosedBy/jobClosedDate — ชุดของขั้นปิดงานโดยตรง (ที่ขอ backend ไว้)
  //   2) log ของ action close
  //   3) closedBy/closedDate — ปลอดภัยเฉพาะ PL เพราะ PL ไม่มีขั้น "ปิดงานรับเรื่อง"
  //      มาแย่งใช้คอลัมน์นี้ (ห้ามทำแบบนี้กับ IT — คนละขั้น คนละคนกด)
  const by = resolution?.jobClosedBy || closeLog?.actionByName || resolution?.closedBy;
  const when = resolution?.jobClosedDate || closeLog?.actionDate || resolution?.closedDate;

  if (state === 'upcoming')
    return (
      <p className="text-[12.5px] text-slate-400">
        — ยังไม่ถึงขั้นปิดงาน (รอแผนก PL ดำเนินการให้เสร็จก่อน)
      </p>
    );

  return (
    <div className="flex flex-col gap-4">
      {state === 'current' && (
        <p className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12.5px] font-semibold text-amber-800">
          <IconBell size={14} className="shrink-0" />
          งานเสร็จแล้ว รอ "แผนกผู้แจ้ง" เป็นคนกดปิดใบนี้
        </p>
      )}

      <div className="grid grid-cols-2 gap-x-5 gap-y-3">
        <DetailRow label="ผู้ปิดงาน">{by || '—'}</DetailRow>
        <DetailRow label="วันที่ปิดงาน">{when ? fmtDateTime(when) : '—'}</DetailRow>
      </div>

      {/* ปิดไปแล้วแต่ไม่มีทั้ง 3 แหล่ง = API ยังไม่ส่งข้อมูลขั้นปิดงานกลับมา
          บอกไปตรง ๆ ดีกว่าปล่อยขีดกลางเปล่า ๆ ให้ผู้ใช้เดาว่าจอพัง */}
      {state === 'done' && !by && !when && (
        <p className="text-[11.5px] text-slate-400">
          — ระบบยังไม่ส่งข้อมูลผู้ปิดงาน/วันที่ปิดงานกลับมา (รอ API)
        </p>
      )}

      {closeLog?.note && (
        <div>
          <span className="mb-1 block text-[11.5px] font-semibold text-gray-500">หมายเหตุปิดงาน</span>
          <div className="rounded-lg border border-gray-200 bg-slate-50 px-3.5 py-3 text-[13px] leading-relaxed text-gray-800">
            <span className="whitespace-pre-wrap">{closeLog.note}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  แผงของใบ CR — 5 ขั้น (อนุมัติ → รับเรื่อง → ดำเนินการ → รับงาน → ปิดงาน)
// ═══════════════════════════════════════════════════════════════
//  ทุกปุ่มในแท็บพวกนี้มาจาก item.availableActions ที่ API ส่งมาเสมอ
//  (ดูกติกา "ปุ่มคือ data ไม่ใช่ code" ใน CLAUDE.md) — แผงเป็นแค่ที่วาง
//  ข้อมูล/ฟอร์ม ไม่ได้ตัดสินใจเองว่าใครกดได้
//  ⚠️ ห้ามเดาว่า "ขั้นนี้ต้องมีปุ่ม" แล้ววาดปุ่มขึ้นมาเอง — ไม่มีปุ่ม = ยังไม่ใช่คิวเรา
// ───────────────────────────────────────────────────────────────

// กล่องข้อความอ่านอย่างเดียว (ผลงานที่บันทึกไว้) — ว่างก็ยังมีกรอบ ไม่ใช่ขีดกลางลอย ๆ
function ReadBox({ text, empty }: { text?: string | null; empty?: string }) {
  return (
    <div className="min-h-[76px] rounded-lg border border-gray-200 bg-slate-50 px-3.5 py-3 text-[13px] leading-relaxed text-gray-800">
      <span className="whitespace-pre-wrap">{text || empty || '— (ยังไม่ได้บันทึก)'}</span>
    </div>
  );
}

// ปุ่มที่ต้องกด 2 ครั้ง — ใช้กับ action ที่ย้อนไม่ได้ซึ่งวาดปุ่มเองในแผง
// (ปุ่มที่ผ่านบล็อกมาตรฐานมีกล่องยืนยันของ RequestActionDialog อยู่แล้ว แต่ปุ่มในแผง
//  ยิงตรงเพื่อพาค่าในฟอร์มไปด้วย จึงต้องมีจังหวะให้ทบทวนของตัวเอง)
function ConfirmButton({
  label,
  className,
  question,
  pending,
  guard,
  onConfirm,
}: {
  label: string;
  className: string;
  question: string;
  pending?: boolean;
  // ตรวจฟอร์มก่อน "ติดอาวุธ" — คืน false = ยังกรอกไม่ครบ (ตัว guard เป็นคนโชว์ข้อความเอง)
  // ถ้าไปตรวจตอนกดยืนยัน ผู้ใช้จะต้องกด 2 ครั้งก่อนถึงจะรู้ว่าลืมกรอกอะไร
  guard?: () => boolean;
  onConfirm: () => void;
}) {
  const [armed, setArmed] = useState(false);

  if (!armed)
    return (
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (guard && !guard()) return;
          setArmed(true);
        }}
        className={`rounded-lg border px-4 py-2 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      >
        {label}
      </button>
    );

  return (
    <span className="inline-flex flex-wrap items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5">
      <span className="text-[12px] font-semibold text-amber-900">{question}</span>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setArmed(false);
          onConfirm();
        }}
        className={`rounded-lg border px-3 py-1.5 text-[12.5px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      >
        ยืนยัน
      </button>
      <button
        type="button"
        onClick={() => setArmed(false)}
        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-[12.5px] font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        ยกเลิก
      </button>
    </span>
  );
}

// ── แท็บรับเรื่องของใบ CR (ขั้น 2 — แผนก CR) ────────────────────
// action `receive` ต้องส่ง `requestService` ("ผู้ดำเนินการ" ≤ 100) ไปด้วย ปุ่มจึงอยู่ในแผง
// ผู้รับเรื่อง / วันที่รับเรื่อง / มาตรฐานการดำเนินการ (= วันรับเรื่อง + 3 วัน)
// backend เติมให้ทั้งหมด — ห้ามส่งขึ้นไปเอง (ส่งไปก็ถูกเมิน)
const CR_REQUEST_SERVICE_MAX = 100;

function CrReceivePanel({
  state,
  actions,
  resolution,
  receiveLog,
  pending,
  onSubmit,
}: {
  state: StepState;
  actions: RequestAction[];
  resolution: RequestResolution | null | undefined;
  receiveLog: RequestLog | null;
  pending: boolean;
  onSubmit?: (action: RequestAction, fields: ActionFieldValues) => void | Promise<void>;
}) {
  const [requestService, setRequestService] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (resolution?.requestService) setRequestService(resolution.requestService);
  }, [resolution]);

  if (state === 'upcoming')
    return (
      <p className="text-[12.5px] text-slate-400">
        — ยังไม่ถึงขั้นนี้ (รอ Mgr ต้นสังกัดอนุมัติก่อน แผนก CR จึงจะรับเรื่องได้)
      </p>
    );

  const by = resolution?.receivedBy || receiveLog?.actionByName;
  const when = resolution?.receivedDate || receiveLog?.actionDate;
  const recv = actions.find((a) => a.code === 'receive');
  const editable = !!recv && !!onSubmit;
  const missing = requestService.trim() === '';

  const check = () => {
    setTouched(true);
    return !missing;
  };
  const submit = () => {
    if (missing || !recv) return;
    onSubmit?.(recv, cleanFieldValues({ requestService }) ?? {});
  };

  return (
    <div className="flex flex-col gap-4">
      {state === 'current' && editable && (
        <p className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[12.5px] font-semibold text-blue-800">
          <IconBell size={14} className="shrink-0" />
          ใบนี้อนุมัติแล้ว — ระบุผู้ดำเนินการแล้วกดรับเรื่องเพื่อเริ่มงาน
        </p>
      )}

      {editable ? (
        <div>
          <label className={SVC_LABEL}>
            ผู้ดำเนินการ<span className="text-rose-600"> *</span>
          </label>
          <input
            value={requestService}
            maxLength={CR_REQUEST_SERVICE_MAX}
            disabled={pending}
            placeholder="ระบุผู้ที่จะรับเรื่องนี้ไปดำเนินการ"
            onChange={(e) => setRequestService(e.target.value)}
            className={`${SVC_INPUT} ${touched && missing ? 'border-rose-300 bg-rose-50/40' : ''}`}
          />
          <p className="mt-1 text-[11px] text-slate-400">
            {requestService.length}/{CR_REQUEST_SERVICE_MAX} ตัวอักษร · ผู้รับเรื่องและวันที่ระบบบันทึกให้เอง
          </p>
          {touched && missing && (
            <p className="mt-1 text-[11.5px] font-semibold text-rose-600">ต้องระบุ “ผู้ดำเนินการ” ก่อนกดรับเรื่อง</p>
          )}
        </div>
      ) : (
        <DetailRow label="ผู้ดำเนินการ">{resolution?.requestService || '—'}</DetailRow>
      )}

      <div className="grid grid-cols-2 gap-x-5 gap-y-4">
        <DetailRow label="ผู้รับเรื่อง">{by || '—'}</DetailRow>
        <DetailRow label="วันที่รับเรื่อง">{when ? fmtDateTime(when) : '—'}</DetailRow>
        <div className="col-span-2">
          <DetailRow label="มาตรฐานการดำเนินการ">
            {resolution?.planCompleteDate ? (
              <span className="mono">{fmtDate(resolution.planCompleteDate)}</span>
            ) : editable ? (
              <span className="text-slate-400">— ระบบคำนวณให้ตอนกดรับเรื่อง (วันที่รับเรื่อง + 3 วัน)</span>
            ) : (
              '—'
            )}
          </DetailRow>
        </div>
      </div>

      {editable && (
        <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
          <ConfirmButton
            label={recv!.label}
            className={actionBtnClass(recv!.style)}
            question="รับเรื่องใบนี้เข้าแผนก CR?"
            pending={pending}
            guard={check}
            onConfirm={submit}
          />
        </div>
      )}
    </div>
  );
}

// ── แท็บดำเนินการของใบ CR (ขั้น 3 — แผนก CR) ────────────────────
// บันทึกได้เรื่อย ๆ ด้วย saveService (ไม่เลื่อนขั้น ไม่ประทับชื่อ/เวลา) แล้วค่อยกด
// service เพื่อส่งต่อให้ต้นสังกัดรับงาน
//
// ⚠️ ชื่อฟิลด์ไม่สมมาตรโดยตั้งใจ (contract ของ backend):
//    ส่งขึ้นไป = `serviceDetail` · อ่านกลับ = `resolution.resolutionDetail`
const CR_SERVICE_DETAIL_MAX = 1000;

function CrServicePanel({
  state,
  actions,
  resolution,
  serviceLog,
  pending,
  onSubmit,
}: {
  state: StepState;
  actions: RequestAction[];
  resolution: RequestResolution | null | undefined;
  serviceLog: RequestLog | null;
  pending: boolean;
  onSubmit?: (action: RequestAction, fields: ActionFieldValues) => void | Promise<void>;
}) {
  const [serviceDetail, setServiceDetail] = useState('');
  const [touched, setTouched] = useState(false);
  // ผู้ใช้พิมพ์ค้างอยู่หรือยัง — กันเคสนี้: กด "บันทึก" แล้วพิมพ์ต่อทันที พอ refetch
  // เสร็จค่าจากเซิร์ฟเวอร์ (ของตอนกด) จะทับสิ่งที่เพิ่งพิมพ์ไป
  const typing = useRef(false);

  // เติมฟอร์มจากค่าที่บันทึกไว้ — resolution เปลี่ยน reference เฉพาะตอนโหลดใบใหม่
  // (เปิดใบ / หลังเซฟ) และต้องไม่ทับของที่ผู้ใช้พิมพ์ค้างไว้
  useEffect(() => {
    if (typing.current) return;
    if (resolution?.resolutionDetail) setServiceDetail(resolution.resolutionDetail);
  }, [resolution]);

  // ชื่อ/เวลา ประทับตอนกด `service` เท่านั้น — `saveService` ไม่ประทับ
  // จึงห้ามเอามาโชว์เป็น "บันทึกล่าสุด" (จะว่างตลอดทั้งที่บันทึกไปหลายรอบแล้ว)
  const by = resolution?.servicedBy || serviceLog?.actionByName;
  const when = resolution?.servicedDate || serviceLog?.actionDate;

  if (state === 'upcoming')
    return <p className="text-[12.5px] text-slate-400">— ยังไม่ถึงขั้นดำเนินการ (รอแผนก CR รับเรื่องก่อน)</p>;

  // ปุ่มจาก API เท่านั้น: saveService = บันทึกเฉย ๆ · service = บันทึกแล้วเลื่อนขั้น
  // ไม่มีปุ่ม = ไม่ใช่คิวเรา/ผ่านขั้นนี้ไปแล้ว → แผงกลายเป็นอ่านอย่างเดียวเอง
  const save = actions.find((a) => a.code === 'saveService');
  const done = actions.find((a) => a.code === 'service');
  const editable = (!!save || !!done) && !!onSubmit;

  if (!editable) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <span className="mb-1 block text-[11.5px] font-semibold text-gray-500">รายละเอียดการดำเนินการ</span>
          <ReadBox text={resolution?.resolutionDetail} />
        </div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-3">
          <DetailRow label="ผู้ดำเนินการ">{resolution?.requestService || '—'}</DetailRow>
          <DetailRow label="มาตรฐานการดำเนินการ">
            {resolution?.planCompleteDate ? <span className="mono">{fmtDate(resolution.planCompleteDate)}</span> : '—'}
          </DetailRow>
          <DetailRow label="ผู้ดำเนินงาน">{by || '—'}</DetailRow>
          <DetailRow label="วันที่ดำเนินการ">{when ? fmtDateTime(when) : '—'}</DetailRow>
        </div>
      </div>
    );
  }

  const missing = serviceDetail.trim() === '';
  // ยิงแล้ว = ค่าที่พิมพ์ไปถึงเซิร์ฟเวอร์แล้ว ปล่อยให้ค่าที่โหลดกลับมาทับได้ตามปกติ
  const fields = (): ActionFieldValues => {
    typing.current = false;
    return cleanFieldValues({ serviceDetail }) ?? {};
  };
  // บังคับกรอกเฉพาะตอน "ดำเนินการเสร็จ" (เลื่อนขั้น) — กดบันทึกทิ้งไว้ว่าง ๆ ได้
  const checkDone = () => {
    setTouched(true);
    return !missing;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-x-5 gap-y-3">
        <DetailRow label="ผู้ดำเนินการ">{resolution?.requestService || '—'}</DetailRow>
        <DetailRow label="มาตรฐานการดำเนินการ">
          {resolution?.planCompleteDate ? (
            <span className="mono">{fmtDate(resolution.planCompleteDate)}</span>
          ) : (
            '—'
          )}
        </DetailRow>
      </div>

      <div>
        <label className={SVC_LABEL}>
          การดำเนินการ<span className="text-rose-600"> *</span>
        </label>
        <textarea
          rows={6}
          value={serviceDetail}
          maxLength={CR_SERVICE_DETAIL_MAX}
          disabled={pending}
          onChange={(e) => {
            typing.current = true;
            setServiceDetail(e.target.value);
          }}
          placeholder="บันทึกสิ่งที่ทำไปแล้ว / ความคืบหน้า — บันทึกกี่ครั้งก็ได้จนกว่าจะกดดำเนินการเสร็จ"
          className={`${SVC_INPUT} resize-y leading-relaxed ${
            touched && missing ? 'border-rose-300 bg-rose-50/40' : ''
          }`}
        />
        <p className="mt-1 text-[11px] text-slate-400">
          {serviceDetail.length}/{CR_SERVICE_DETAIL_MAX} ตัวอักษร · กด “บันทึก” แล้วข้อความจะยังอยู่เมื่อเปิดใบใหม่
        </p>
      </div>

      {touched && missing && (
        <p className="text-[11.5px] font-semibold text-rose-600">ต้องกรอก “การดำเนินการ” ก่อนกดดำเนินการเสร็จ</p>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
        {/* บันทึกอยู่กับที่ = ย้อนได้ (บันทึกทับใหม่) จึงไม่ต้องยืนยัน */}
        {save && (
          <button
            type="button"
            disabled={pending}
            onClick={() => onSubmit?.(save, fields())}
            className={`rounded-lg border px-4 py-2 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${actionBtnClass(
              save.style
            )}`}
          >
            {save.label}
          </button>
        )}
        {/* เลื่อนขั้นแล้วย้อนไม่ได้ ใบออกจากแผนก CR ทันที → ต้องยืนยันก่อน */}
        {done && (
          <ConfirmButton
            label={done.label}
            className={actionBtnClass(done.style)}
            question="ส่งงานให้ต้นสังกัดตรวจรับ? กดแล้วกลับมาแก้ไม่ได้"
            pending={pending}
            guard={checkDone}
            onConfirm={() => onSubmit?.(done, fields())}
          />
        )}
        <span className="text-[11.5px] text-slate-400">
          “{save?.label ?? 'บันทึกรายละเอียด'}” เก็บค่าไว้เฉย ๆ ไม่เลื่อนขั้น · “{done?.label ?? 'ดำเนินการเสร็จ'}”
          ส่งต่อให้ต้นสังกัดรับงาน
        </span>
      </div>
    </div>
  );
}

// ── แท็บรับงานของใบ CR (ขั้น 4 — ฝั่งผู้แจ้ง) ─────────────────────
// ⚠️ ขั้นนี้เป็นของ "ต้นสังกัดผู้แจ้ง" ไม่ใช่ CR → เป็นขั้นที่ค้างเงียบง่ายที่สุด
//    (งานเสร็จหมดแล้วแต่ไม่มีใครกดรับ) จึงต้องบอกให้ชัดว่ารออะไรอยู่
// ปุ่ม "รับงาน" (`acceptWork`) ไม่มีฟิลด์ → บล็อกปุ่มมาตรฐาน + กล่องยืนยันจัดการให้
// ยังไม่มีปุ่ม "ไม่รับงาน" ในเฟสนี้ (เว็บเก่าก็มีปุ่มเดียว)
function CrReceiveJobPanel({
  state,
  resolution,
  serviceLog,
  acceptLog,
  isOurTurn,
}: {
  state: StepState;
  resolution: RequestResolution | null | undefined;
  serviceLog: RequestLog | null;
  acceptLog: RequestLog | null;
  isOurTurn: boolean;
}) {
  if (state === 'upcoming')
    return <p className="text-[12.5px] text-slate-400">— ยังไม่ถึงขั้นรับงาน (รอแผนก CR ดำเนินการให้เสร็จก่อน)</p>;

  const by = resolution?.acceptedBy || acceptLog?.actionByName;
  // ReceiveDateJob เก็บเป็น date (ตัดเวลาทิ้ง) → โชว์เฉพาะวันที่ ไม่ใส่เวลาให้เข้าใจผิด
  const when = resolution?.acceptedDate || acceptLog?.actionDate;
  const serviceBy = resolution?.servicedBy || serviceLog?.actionByName;
  const serviceAt = resolution?.servicedDate || serviceLog?.actionDate;
  // เทียบวันที่ทำเสร็จจริงกับกำหนดมาตรฐาน (รับเรื่อง + 3 วัน) ให้ผู้ตรวจรับเห็นทันที
  const late =
    resolution?.planCompleteDate && serviceAt
      ? new Date(serviceAt).getTime() > new Date(resolution.planCompleteDate).getTime()
      : false;

  return (
    <div className="flex flex-col gap-4">
      {state === 'current' && (
        <p className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12.5px] font-semibold text-amber-800">
          <IconBell size={14} className="shrink-0" />
          {isOurTurn
            ? 'แผนก CR ดำเนินการเสร็จแล้ว — ตรวจผลงานด้านล่างแล้วกด “รับงาน”'
            : 'งานเสร็จแล้ว รอ "หน่วยงานผู้แจ้ง" เป็นคนกดรับงาน'}
        </p>
      )}

      {/* ต้องเห็นว่า CR ทำอะไรไปก่อนถึงจะกดรับงานได้อย่างมีความหมาย */}
      <div>
        <span className="mb-1 block text-[11.5px] font-semibold text-gray-500">รายละเอียดการดำเนินการของแผนก CR</span>
        <ReadBox text={resolution?.resolutionDetail} />
      </div>

      <div className="grid grid-cols-2 gap-x-5 gap-y-3">
        <DetailRow label="ผู้ดำเนินการ">{resolution?.requestService || '—'}</DetailRow>
        <DetailRow label="ผู้ดำเนินงาน">{serviceBy || '—'}</DetailRow>
        <DetailRow label="วันที่ดำเนินการ">{serviceAt ? fmtDateTime(serviceAt) : '—'}</DetailRow>
        <DetailRow label="กำหนดแล้วเสร็จตามมาตรฐาน">
          {resolution?.planCompleteDate ? (
            <span className="flex items-center gap-1.5">
              <span className="mono">{fmtDate(resolution.planCompleteDate)}</span>
              {serviceAt && (
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
                    late ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {late ? 'เกินกำหนด' : 'ตรงกำหนด'}
                </span>
              )}
            </span>
          ) : (
            '—'
          )}
        </DetailRow>
        <DetailRow label="ผู้รับงาน">{by || '—'}</DetailRow>
        <DetailRow label="วันที่รับงาน">{when ? <span className="mono">{fmtDate(when)}</span> : '—'}</DetailRow>
      </div>
    </div>
  );
}

// ── แท็บปิดงานที่แจ้งเรื่องของใบ CR (ขั้น 5 — แผนก CR) ────────────
// action `close` รับ `actionDetail` (รายละเอียดการปิดงาน ≤ 500) แบบไม่บังคับ
// ปุ่มจึงอยู่ในแผงเพื่อพาค่าในช่องไปด้วย
// ⚠️ ใช้ jobClosedBy/jobClosedDate ก่อน แล้วค่อย fallback ไป closedBy/closedDate —
//    CR ไม่มีขั้น "ปิดงานรับเรื่อง" มาแย่งคอลัมน์นี้ จึงใช้ต่อท้ายได้ (ต่างจาก IT)
const CR_ACTION_DETAIL_MAX = 500;

function CrClosePanel({
  state,
  actions,
  resolution,
  closeLog,
  pending,
  onSubmit,
}: {
  state: StepState;
  actions: RequestAction[];
  resolution: RequestResolution | null | undefined;
  closeLog: RequestLog | null;
  pending: boolean;
  onSubmit?: (action: RequestAction, fields: ActionFieldValues) => void | Promise<void>;
}) {
  const [actionDetail, setActionDetail] = useState('');

  useEffect(() => {
    if (resolution?.actionDetail) setActionDetail(resolution.actionDetail);
  }, [resolution]);

  if (state === 'upcoming')
    return (
      <p className="text-[12.5px] text-slate-400">
        — ยังไม่ถึงขั้นปิดงาน (รอหน่วยงานผู้แจ้งกดรับงานก่อน)
      </p>
    );

  const by = resolution?.jobClosedBy || closeLog?.actionByName || resolution?.closedBy;
  const when = resolution?.jobClosedDate || closeLog?.actionDate || resolution?.closedDate;
  const close = actions.find((a) => a.code === 'close');
  const editable = !!close && !!onSubmit;

  return (
    <div className="flex flex-col gap-4">
      {state === 'current' && editable && (
        <p className="flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-[12.5px] font-semibold text-teal-800">
          <IconBell size={14} className="shrink-0" />
          ผู้แจ้งรับงานแล้ว — แผนก CR กด “{close!.label}” เพื่อจบใบนี้
        </p>
      )}

      <div>
        <span className="mb-1 block text-[11.5px] font-semibold text-gray-500">รายละเอียดการดำเนินการ</span>
        <ReadBox text={resolution?.resolutionDetail} />
      </div>

      {editable ? (
        <div>
          <label className={SVC_LABEL}>รายละเอียดการปิดงาน</label>
          <textarea
            rows={3}
            value={actionDetail}
            maxLength={CR_ACTION_DETAIL_MAX}
            disabled={pending}
            placeholder="ไม่บังคับ — เช่น ลูกค้ารับเอกสารครบแล้ว"
            onChange={(e) => setActionDetail(e.target.value)}
            className={`${SVC_INPUT} resize-y leading-relaxed`}
          />
          <p className="mt-1 text-[11px] text-slate-400">
            {actionDetail.length}/{CR_ACTION_DETAIL_MAX} ตัวอักษร
          </p>
        </div>
      ) : (
        resolution?.actionDetail && (
          <div>
            <span className="mb-1 block text-[11.5px] font-semibold text-gray-500">รายละเอียดการปิดงาน</span>
            <ReadBox text={resolution.actionDetail} />
          </div>
        )
      )}

      <div className="grid grid-cols-2 gap-x-5 gap-y-3">
        <DetailRow label="ผู้ปิดงาน">{by || '—'}</DetailRow>
        <DetailRow label="วันที่ปิดงาน">{when ? fmtDateTime(when) : '—'}</DetailRow>
      </div>

      {editable && (
        <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
          <ConfirmButton
            label={close!.label}
            className={actionBtnClass(close!.style)}
            question="ปิดใบรับเรื่องนี้? กดแล้วใบจะจบและกลับมาแก้ไม่ได้"
            pending={pending}
            onConfirm={() => onSubmit?.(close!, cleanFieldValues({ actionDetail }) ?? {})}
          />
        </div>
      )}
    </div>
  );
}

// ── รูปแนบแบบอ่านอย่างเดียว ────────────────────────────────────
// ⚠️ <img src={url}> ตรง ๆ ใช้ไม่ได้ — endpoint รูปมี [Authorize] เบราว์เซอร์ไม่แนบ
//    token ให้ จะได้ 401 เสมอ ต้องโหลดเป็น blob ผ่าน useAuthedImage
function AttachmentThumb({ url, fileName }: { url: string | null; fileName: string }) {
  const { user } = useAuth();
  const src = useAuthedImage(url, user?.token);

  if (!src) {
    return (
      <span
        title={url ? 'กำลังโหลดรูป…' : 'ไม่มีไฟล์'}
        className="inline-flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border border-gray-200 bg-slate-50 px-1.5 text-center"
      >
        <IconPaperclip size={15} className="text-slate-400" />
        <span className="line-clamp-2 break-all text-[10px] text-slate-500">{fileName}</span>
      </span>
    );
  }
  return (
    <a href={src} target="_blank" rel="noreferrer" className="block">
      <img
        src={src}
        alt={fileName}
        title={fileName}
        className="h-24 w-24 rounded-lg border border-gray-200 object-cover transition hover:opacity-90"
      />
    </a>
  );
}

// ── ฟอร์มแก้ไขข้อมูลใบ (แทนที่แผง General ชั่วคราว) ──────────────
// ฟิลด์มาจาก EDIT_FIELDS ใน data/requestEdit.ts — ผู้แจ้ง/หน่วยงาน/วันที่แจ้ง
// ช่องเลือกของฟอร์มแก้ไข — ตัวเลือกอาจมาจาก master data ที่โหลดตอน runtime
// จึงต้องรับมือทั้งตอนกำลังโหลดและตอนโหลดไม่สำเร็จ
function SelectWithMaster({
  value,
  options,
  disabled,
  loading,
  error,
  cls,
  onRetry,
  onChange,
}: {
  value: string;
  options: FieldOption[];
  disabled: boolean;
  loading: boolean;
  error: string | null;
  cls: string;
  onRetry: () => void;
  onChange: (v: string) => void;
}) {
  return (
    <>
      <select
        value={value}
        disabled={disabled || loading}
        onChange={(e) => onChange(e.target.value)}
        className={cls}
      >
        {/* ค่าเดิมในใบอาจเป็นชื่อที่ถูกถอดออกจาก master ไปแล้ว —
            ใส่เป็นตัวเลือกไว้ด้วย ไม่งั้น select เด้งว่างแล้วผู้ใช้
            เผลอบันทึกทับของเดิมโดยไม่ตั้งใจ */}
        <option value="">{loading ? '— กำลังโหลด… —' : '— เลือก —'}</option>
        {value && !options.some((o) => o.value === value) && <option value={value}>{value}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-[11.5px] font-semibold text-red-600">
          {error}
          <button type="button" onClick={onRetry} className="ml-1.5 underline hover:no-underline">
            ลองใหม่
          </button>
        </p>
      )}
    </>
  );
}

// แก้ไม่ได้โดยตั้งใจ (เป็นตัวตนของใบ) จึงโชว์เป็นข้อความอ่านอย่างเดียวไว้ด้านบน
function RequestEditPanel({
  item,
  lines,
  doc,
  attachments,
  pending,
  fieldsEditable,
  canAttachFiles,
  attachBlockedReason,
  pendingAtt,
  attachBusy,
  onStageAttachment,
  onCancel,
  onSubmit,
  crMaster,
  crDoc,
}: {
  item: RequestListItem;
  lines: PlRequestLine[] | null;
  doc: PlRequestDetail | null;
  attachments: RequestAttachment[];
  pending: boolean;
  // แก้ฟิลด์หัวใบ/รายการที่ขอได้ไหม — ปลายทางที่รับงานแล้วเข้ามาได้แต่แก้ได้แค่รูป
  fieldsEditable: boolean;
  canAttachFiles: boolean;
  attachBlockedReason?: string | null;
  pendingAtt: PendingAttachments;
  attachBusy: boolean;
  onStageAttachment?: (slot: number, change: PendingAttachment | null) => void;
  onCancel: () => void;
  onSubmit: (form: RequestEditForm) => void | Promise<void>;
  crMaster: CrMasterData;
  crDoc: { doc: CrRequestDetail | null; loading: boolean; error: string | null };
}) {
  const isPl = item.module === 'PL';
  const isCr = item.module === 'CR';
  const fields = editFieldsOf(item.module);
  // ตัวเลือกของใบ PL (ประเภท / เรื่องที่แจ้ง / หน่วย) — GET /MasterData/pl
  const { user } = useAuth();
  const plMaster = usePlMasterData(user?.token, isPl);
  const [form, setForm] = useState<RequestEditForm>(() => toEditForm(item, lines, crDoc.doc));
  const [errors, setErrors] = useState<ReturnType<typeof validateEditForm>>({});
  // ล็อกช่องกรอกทั้งหมดเมื่อเข้ามาเพื่อจัดการรูปอย่างเดียว (canEdit ปิดไปแล้ว)
  const lock = pending || !fieldsEditable;

  // ค่าดิบของใบ CR อาจมาถึงหลังฟอร์มถูกสร้าง (เปิดแท็บแก้ไขเร็วกว่า API ตอบ)
  // → เติมให้เมื่อมาถึง แต่ไม่ทับของที่ผู้ใช้เริ่มแก้แล้ว
  const crRaw = crDoc.doc;
  useEffect(() => {
    if (!isCr || !crRaw) return;
    setForm((f) => (f.requestType ? f : toEditForm(item, lines, crRaw)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCr, crRaw]);

  // ตัวเลือกของแต่ละช่อง — ของ CR เป็นลูกโซ่ จึงคำนวณจากค่าที่เลือกอยู่ในฟอร์ม
  const optionsOf = (f: EditFieldDef): FieldOption[] => {
    switch (f.master) {
      case 'plTypes':
        return plMaster.typeOptions;
      case 'plRequestTypes':
        return plMaster.requestTypeOptions;
      // ป้ายเป็นโค้ด HV/FL เฉย ๆ คนอ่านไม่ออก — พ่วงชื่อไทยไว้ในป้ายเดียวกัน
      case 'crSections':
        return crMaster.sectionOptions.map((o) => ({ ...o, label: o.sub ? `${o.label} · ${o.sub}` : o.label }));
      case 'crRequestTypes':
        return crMaster.requestTypeOptions(form.section);
      case 'crRequestSubTypes':
        return crMaster.requestSubTypeOptions(form.section, form.requestType);
      default:
        return f.options ?? [];
    }
  };
  const isCrMaster = (m?: MasterListKey) => m === 'crSections' || m === 'crRequestTypes' || m === 'crRequestSubTypes';

  // โหลดค่าดิบไม่สำเร็จ = ฟอร์มไม่รู้ค่าเดิมของส่วนงาน/ประเภทที่แจ้ง ซึ่งต้องส่งกลับไปกับ PUT
  // ด้วยค่าเดิมเสมอ → ปล่อยให้กดบันทึกไม่ได้ (บันทึกทั้งที่ค่าว่าง = เขียนทับประเภทของใบ)
  const crDocFailed = isCr && !crDoc.loading && !crDoc.doc;

  const set = (k: EditFieldKey, v: string, resets?: EditFieldKey[]) => {
    setForm((f) => {
      const next = { ...f, [k]: v };
      for (const r of resets ?? []) next[r] = '';
      return next;
    });
    setErrors((e) => {
      const n = { ...e, [k]: undefined };
      for (const r of resets ?? []) n[r] = undefined;
      return n;
    });
  };

  const setLines = (next: EditLine[]) => {
    setForm((f) => ({ ...f, lines: next }));
    setErrors((e) => ({ ...e, lines: undefined }));
  };
  const setLine = (i: number, patch: Partial<EditLine>) =>
    setLines(form.lines.map((l, n) => (n === i ? { ...l, ...patch } : l)));

  const submit = () => {
    // ใบ CR ที่ยังไม่รู้ค่าเดิม = ห้ามบันทึก (จะเขียนทับประเภทของใบด้วยค่าว่าง)
    if (isCr && !crDoc.doc) return;
    // ฟิลด์ถูกล็อกอยู่ = ไม่มีอะไรให้ตรวจ (บันทึกรอบนี้เป็นเรื่องรูปแนบล้วน)
    if (fieldsEditable) {
      const errs = validateEditForm(item.module, form);
      setErrors(errs);
      if (Object.keys(errs).length > 0) return;
    }
    onSubmit(form);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-x-5 gap-y-3 rounded-lg border border-gray-200 bg-slate-50 px-3.5 py-3">
        <DetailRow label="ผู้แจ้งเรื่อง">{item.requestBy || '—'}</DetailRow>
        <DetailRow label="หน่วยงาน">{item.departmentName || '—'}</DetailRow>
        {/* ใบ CR เก็บ "วันที่ต้องการ" ไว้ในคอลัมน์ RequestDate ซึ่งเป็นช่องที่แก้ได้ในฟอร์มนี้
            — โชว์ซ้ำตรงนี้ในชื่อ "วันที่แจ้ง" ด้วยจะกลายเป็นค่าเดียวกัน 2 ป้ายคนละความหมาย */}
        {item.module !== 'CR' && <DetailRow label="วันที่แจ้ง">{fmtDate(item.requestDate)}</DetailRow>}
        <DetailRow label="สถานะ">{item.jobStatusName || '—'}</DetailRow>
        {/* ส่วนงาน + ประเภทที่แจ้ง แก้ไม่ได้ — เลขที่ใบออกจากชุดของ 2 ค่านี้ไปแล้ว
            และเลขไม่เปลี่ยนตามเวลาแก้ (guide §7) จึงโชว์ไว้เฉย ๆ ให้เห็นว่าใบนี้คือเรื่องอะไร */}
        {isCr && (
          <>
            <DetailRow label="ส่วนงาน">
              <span className="mono font-semibold">{crDoc.doc?.section || item.type || '—'}</span>
            </DetailRow>
            <DetailRow label="ประเภทที่แจ้ง">{crDoc.doc?.requestType || '—'}</DetailRow>
            <div className="col-span-2 text-[11px] text-slate-400">
              ส่วนงานและประเภทที่แจ้งแก้ไม่ได้ — เลขที่ใบ <span className="mono">{item.docNo}</span>{' '}
              ถูกออกจากชุดของสองค่านี้ไปแล้ว ถ้าเลือกผิดต้องเปิดใบใหม่
            </div>
          </>
        )}
      </div>

      {/* โหลดค่าดิบของใบไม่สำเร็จ = ช่องส่วนงาน/ประเภท/รายละเอียดที่แจ้ง ไม่มีค่าเดิม
          ห้ามให้บันทึก ไม่งั้นจะเขียนทับประเภทของใบด้วยค่าว่าง */}
      {isCr && crDoc.loading && (
        <p className="flex items-center gap-1.5 text-[12px] text-slate-400">
          <IconLoader2 size={14} className="animate-spin" />
          กำลังโหลดข้อมูลเดิมของใบ...
        </p>
      )}
      {crDocFailed && (
        <p className="flex items-start gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-700">
          <IconAlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>
            โหลดข้อมูลเดิมของใบไม่สำเร็จ{crDoc.error ? ` (${crDoc.error})` : ''} — แก้ไขไม่ได้ตอนนี้
            ปิดหน้าต่างแล้วเปิดใหม่อีกครั้ง
          </span>
        </p>
      )}

      <div className="grid grid-cols-2 gap-x-5 gap-y-4">
        {/* ช่องที่มีเงื่อนไข showWhen (เช่น "ระบุเพิ่มเติม" ของ CR) ซ่อนจนกว่าจะถึงเงื่อนไข */}
        {fields.filter((f) => editFieldVisible(f, form)).map((f) => {
          const value = form[f.key] ?? '';
          const err = errors[f.key];
          // ลูกโซ่: ยังไม่เลือกฟิลด์แม่ = ช่องนี้ยังไม่มีตัวเลือกให้เลือก
          const waitingParent = !!f.dependsOn && !form[f.dependsOn];
          const fieldLock = lock || waitingParent;
          const cls = `w-full rounded-lg border bg-white px-3 py-2 text-[13px] text-gray-800 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:bg-slate-50 ${
            err ? 'border-red-300' : 'border-gray-200'
          }`;
          return (
            <div key={f.key} className={f.span2 ? 'col-span-2' : ''}>
              <div className="mb-1 flex items-baseline gap-1.5">
                <span className="text-[11.5px] font-semibold text-gray-500">{f.label}</span>
                {f.required && <span className="text-[11.5px] font-bold text-red-500">*</span>}
                {f.maxLen && (
                  <span className="mono ml-auto text-[10.5px] text-slate-400">
                    {value.length}/{f.maxLen}
                  </span>
                )}
              </div>
              {f.kind === 'textarea' ? (
                <textarea
                  value={value}
                  maxLength={f.maxLen}
                  disabled={fieldLock}
                  rows={5}
                  placeholder={f.placeholder}
                  onChange={(e) => set(f.key, e.target.value, f.resets)}
                  className={`${cls} resize-y leading-relaxed`}
                />
              ) : f.kind === 'select' ? (
                <SelectWithMaster
                  value={value}
                  options={optionsOf(f)}
                  disabled={fieldLock}
                  loading={!!f.master && (isCrMaster(f.master) ? crMaster.loading : plMaster.loading)}
                  error={f.master ? (isCrMaster(f.master) ? crMaster.error : plMaster.error) : null}
                  onRetry={isCrMaster(f.master) ? crMaster.reload : plMaster.reload}
                  cls={cls}
                  onChange={(v) => set(f.key, v, f.resets)}
                />
              ) : f.kind === 'date' ? (
                <input
                  type="date"
                  value={value}
                  disabled={fieldLock}
                  onChange={(e) => set(f.key, e.target.value, f.resets)}
                  className={cls}
                />
              ) : (
                <input
                  type="text"
                  value={value}
                  maxLength={f.maxLen}
                  disabled={fieldLock}
                  placeholder={f.placeholder}
                  onChange={(e) => set(f.key, e.target.value, f.resets)}
                  className={cls}
                />
              )}
              {err && <p className="mt-1 text-[11.5px] font-semibold text-red-600">{err}</p>}
              {!err && waitingParent && (
                <p className="mt-1 text-[11px] text-slate-400">
                  เลือก{fields.find((p) => p.key === f.dependsOn)?.label ?? 'ช่องก่อนหน้า'}ก่อน
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* รายการที่ขอ (เฉพาะ PL) — ส่งขึ้น API พร้อมกับปุ่มบันทึก ไม่ใช่ทีละแถว
          แถวเดิมหิ้ว recNo ไว้ใน state ไม่ได้โชว์ให้ผู้ใช้เห็น */}
      {isPl && (
        <div>
          <div className="mb-1.5 flex items-baseline gap-1.5">
            <span className="text-[11.5px] font-semibold text-gray-500">รายการที่ขอ</span>
            <span className="text-[10.5px] text-slate-400">(ไม่บังคับ — ลบแถวออก = ลบรายการนั้นทิ้ง)</span>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#0b1220] text-[11.5px] font-semibold text-slate-300">
                  <th className="w-9 px-2 py-2 text-center">#</th>
                  <th className="px-2 py-2 text-left">รายการ</th>
                  <th className="w-20 px-2 py-2 text-center">จำนวน</th>
                  <th className="w-24 px-2 py-2 text-center">หน่วย</th>
                  <th className="px-2 py-2 text-left">หมายเหตุ</th>
                  <th className="w-10 px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {form.lines.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-3 text-center text-[12.5px] text-slate-400">
                      ยังไม่มีรายการ — กด "เพิ่มรายการ" ด้านล่าง
                    </td>
                  </tr>
                )}
                {form.lines.map((l, i) => (
                  <tr key={l.recNo ?? `new-${i}`} className="border-t border-gray-100">
                    <td className="mono px-2 py-1.5 text-center text-[12px] text-slate-400">{i + 1}</td>
                    <td className="px-1.5 py-1.5">
                      <input
                        type="text"
                        value={l.item}
                        maxLength={2000}
                        disabled={lock}
                        placeholder="ชื่อรายการที่ต้องการ"
                        onChange={(e) => setLine(i, { item: e.target.value })}
                        className={LINE_INPUT_CLS}
                      />
                    </td>
                    <td className="px-1.5 py-1.5">
                      <input
                        type="number"
                        min={1}
                        value={l.qty}
                        disabled={lock}
                        onChange={(e) => setLine(i, { qty: e.target.value })}
                        className={`${LINE_INPUT_CLS} mono text-center`}
                      />
                    </td>
                    <td className="px-1.5 py-1.5">
                      {/* หน่วยมาจาก master (GET /MasterData/pl) — หน่วยเดิมที่ไม่มีใน
                          รายการแล้วยังต้องโชว์ได้ ไม่งั้นบันทึกทับของเดิมโดยไม่ตั้งใจ */}
                      <select
                        value={l.unit}
                        disabled={lock || plMaster.loading}
                        onChange={(e) => setLine(i, { unit: e.target.value })}
                        className={`${LINE_INPUT_CLS} cursor-pointer text-center`}
                      >
                        <option value="">{plMaster.loading ? '…' : 'หน่วย'}</option>
                        {(l.unit && !plMaster.unitNames.includes(l.unit)
                          ? [l.unit, ...plMaster.unitNames]
                          : plMaster.unitNames
                        ).map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-1.5 py-1.5">
                      <input
                        type="text"
                        value={l.remark}
                        maxLength={1000}
                        disabled={lock}
                        onChange={(e) => setLine(i, { remark: e.target.value })}
                        className={LINE_INPUT_CLS}
                      />
                    </td>
                    <td className="px-1.5 py-1.5 text-center">
                      <button
                        type="button"
                        disabled={lock}
                        title="ลบรายการนี้"
                        onClick={() => setLines(form.lines.filter((_, n) => n !== i))}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                      >
                        <IconTrash size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {errors.lines && <p className="mt-1 text-[11.5px] font-semibold text-red-600">{errors.lines}</p>}
          <button
            type="button"
            disabled={lock}
            onClick={() => setLines([...form.lines, emptyEditLine()])}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[12.5px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
          >
            <IconPlus size={14} />
            เพิ่มรายการ
          </button>
        </div>
      )}

      {/* โมดูลที่ไม่มีเส้นรูปแนบ (CR) ไม่ต้องขึ้นช่องอัปโหลดที่กดแล้วได้แต่ error */}
      {attachmentApiOf(item.module).slots.length > 0 && (
        <AttachmentSlots
          module={item.module}
          attachments={attachments}
          pending={pendingAtt}
          onStage={(slot, change) => onStageAttachment?.(slot, change)}
          readOnly={!canAttachFiles}
          blockedReason={attachBlockedReason}
          busy={attachBusy}
        />
      )}

      <p className="text-[11.5px] text-slate-400">
        {fieldsEditable
          ? 'แก้ไขได้ก่อน Mgr อนุมัติเท่านั้น — อนุมัติแล้วต้องแจ้งกับผู้รับเรื่องโดยตรง'
          : 'ตอนนี้แก้ได้เฉพาะรูปแนบ — ข้อมูลใบถูกล็อกแล้ว ต้องแจ้งกับผู้รับเรื่องโดยตรง'}
      </p>

      <div className="flex items-center gap-2 border-t border-gray-100 pt-4">
        <button
          type="button"
          disabled={pending || (isCr && !crDoc.doc)}
          onClick={submit}
          className="inline-flex items-center gap-1.5 rounded-lg border border-accent bg-accent px-4 py-2 text-[13px] font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? <IconLoader2 size={15} className="animate-spin" /> : <IconDeviceFloppy size={15} />}
          บันทึกการแก้ไข
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={onCancel}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          ยกเลิก
        </button>
      </div>
    </div>
  );
}

// input ในตารางรายการที่ขอ — เตี้ยกว่าฟิลด์ปกติเพื่อให้แถวไม่สูงเกินไป
const LINE_INPUT_CLS =
  'w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-[12.5px] text-gray-800 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:bg-slate-50';

// ── รูปแนบ 3 ช่อง (ImgPath1/2/3) ────────────────────────────────
// เป็น "ช่อง" ไม่ใช่ลิสต์ — เลือกไฟล์ทับช่องเดิม = เขียนทับ ไม่ใช่เพิ่มรูปที่ 4
//
// ⚠️ แผงนี้ไม่ยิง API เอง: การเลือกไฟล์/สั่งลบเป็นแค่การ "พักไว้" (PendingAttachments)
// แล้วรอปุ่มบันทึกของฟอร์มยิงทีเดียวพร้อมฟิลด์อื่น (ผู้ใช้สั่งไว้ 27 ส.ค. 2026 —
// เพิ่ม/ลบรูปต้องมีผลตอนกดบันทึกเท่านั้น) ก่อนกดบันทึกจึงย้อนคืนได้ทุกช่อง
// และไม่ต้องมีกล่องยืนยันตอนลบเหมือนเดิมที่ยิงจริงทันที
function AttachmentSlots({
  module,
  attachments,
  pending,
  onStage,
  readOnly,
  blockedReason,
  busy,
}: {
  module: string;
  attachments: RequestAttachment[];
  // ช่องที่ยังไม่ได้ยิง — ช่องที่ไม่มีคีย์ = ไม่ถูกแตะ
  pending: PendingAttachments;
  onStage: (slot: number, change: PendingAttachment | null) => void;
  // สิทธิ์แนบ/ลบมาจาก canAttach ของใบ (คนละตัวกับ canEdit) — true = ดูอย่างเดียว
  readOnly?: boolean;
  blockedReason?: string | null; // เหตุผลไทยจาก API พร้อมโชว์ใต้ช่อง
  busy?: boolean; // กำลังยิงชุดที่ค้างอยู่ (กดบันทึกไปแล้ว)
}) {
  const api = attachmentApiOf(module);
  const [error, setError] = useState<string | null>(null);

  const fileOf = (slot: number) => attachments.find((f) => Number(f.fileId) === slot && f.url);

  const pick = (slot: number, file: File) => {
    // กรองที่หน้าเว็บก่อน ไม่ให้ผู้ใช้กดบันทึกแล้วค่อยรู้ว่าไฟล์ใช้ไม่ได้
    // (backend ตรวจ magic bytes ซ้ำอยู่ดี — เปลี่ยนนามสกุลมาหลอกไม่ผ่าน)
    const bad = api.check(file);
    if (bad) {
      setError(bad);
      return;
    }
    setError(null);
    onStage(slot, { kind: 'upload', file, previewUrl: URL.createObjectURL(file) });
  };

  const staged = Object.keys(pending).length;

  return (
    <div>
      <div className="mb-1.5 flex items-baseline gap-1.5">
        <span className="text-[11.5px] font-semibold text-gray-500">รูปภาพประกอบ</span>
        <span className="text-[10.5px] text-slate-400">
          {readOnly ? '(3 ช่อง — ดูได้อย่างเดียว)' : '(3 ช่อง — เลือกไฟล์ทับช่องเดิมได้)'}
        </span>
        {staged > 0 && (
          <span className="ml-auto rounded-md bg-amber-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-amber-700">
            รอบันทึก {staged} ช่อง
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {api.slots.map((slot) => (
          <AttachmentSlot
            key={slot}
            slot={slot}
            file={fileOf(slot)}
            change={pending[slot]}
            readOnly={!!readOnly}
            busy={!!busy}
            onPick={(f) => pick(slot, f)}
            onStageDelete={() => {
              setError(null);
              onStage(slot, { kind: 'delete' });
            }}
            onUndo={() => {
              setError(null);
              onStage(slot, null);
            }}
          />
        ))}
      </div>

      {error && (
        <p className="mt-1.5 flex items-center gap-1.5 text-[11.5px] font-semibold text-red-600">
          <IconAlertTriangle size={13} className="shrink-0" />
          {error}
        </p>
      )}
      <p className="mt-1.5 text-[11px] text-slate-400">
        {readOnly
          ? blockedReason || 'ตอนนี้แนบหรือลบรูปไม่ได้'
          : `รองรับ ${api.extensions.join(' ')} · ไม่เกิน 10 MB ต่อรูป · มีผลเมื่อกดบันทึก`}
      </p>
    </div>
  );
}

function AttachmentSlot({
  slot,
  file,
  change,
  readOnly,
  busy,
  onPick,
  onStageDelete,
  onUndo,
}: {
  slot: number;
  file?: RequestAttachment;
  change?: PendingAttachment;
  readOnly: boolean;
  busy: boolean;
  onPick: (file: File) => void;
  onStageDelete: () => void;
  onUndo: () => void;
}) {
  const { user } = useAuth();
  const src = useAuthedImage(file?.url ?? null, user?.token);
  const inputRef = useRef<HTMLInputElement>(null);

  const willDelete = change?.kind === 'delete';
  const preview = change?.kind === 'upload' ? change.previewUrl : null;
  // ช่องที่สั่งลบไว้ยังโชว์รูปเดิม (หรี่ลง) ให้เห็นว่ากำลังจะลบอะไร
  const shown = preview ?? (file ? src : null);
  const hasSomething = !!preview || !!file;

  return (
    <div className="relative aspect-square overflow-hidden rounded-xl border border-gray-200 bg-slate-50">
      {hasSomething ? (
        shown ? (
          <img
            src={shown}
            alt={file?.fileName ?? `ช่องที่ ${slot}`}
            className={`h-full w-full object-cover ${willDelete ? 'opacity-30 grayscale' : ''}`}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-1.5 text-center">
            <IconLoader2 size={16} className="animate-spin text-slate-400" />
            <span className="line-clamp-2 break-all text-[10px] text-slate-500">{file?.fileName}</span>
          </div>
        )
      ) : (
        <button
          type="button"
          disabled={readOnly || busy}
          onClick={() => inputRef.current?.click()}
          className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-slate-400 transition enabled:hover:bg-white enabled:hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          <IconPhotoPlus size={20} />
          <span className="text-[11px] font-semibold">ช่องที่ {slot}</span>
        </button>
      )}

      {/* ป้ายบอกว่าช่องนี้ยังไม่มีผลจนกว่าจะกดบันทึก */}
      {change && (
        <span className="absolute inset-x-1 top-1 rounded-md bg-amber-500/90 px-1.5 py-0.5 text-center text-[10px] font-semibold text-white">
          {willDelete ? 'จะลบเมื่อบันทึก' : 'รูปใหม่ · รอบันทึก'}
        </span>
      )}

      {!readOnly && !busy && (
        <div className="absolute bottom-1 right-1 flex gap-1">
          {change ? (
            <button
              type="button"
              onClick={onUndo}
              title={`ยกเลิกการเปลี่ยนแปลงช่องที่ ${slot}`}
              className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-900/60 text-white transition hover:bg-slate-900"
            >
              <IconX size={13} />
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                title={file ? `เปลี่ยนรูปช่องที่ ${slot} (เขียนทับรูปเดิม)` : `เลือกรูปช่องที่ ${slot}`}
                className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-900/60 text-white transition hover:bg-slate-900"
              >
                <IconPhotoPlus size={13} />
              </button>
              {file && (
                <button
                  type="button"
                  onClick={onStageDelete}
                  title={`ลบรูปช่องที่ ${slot}`}
                  className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-900/60 text-white transition hover:bg-red-600"
                >
                  <IconTrash size={13} />
                </button>
              )}
            </>
          )}
        </div>
      )}

      {busy && change && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70">
          <IconLoader2 size={20} className="animate-spin text-accent" />
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = ''; // เลือกไฟล์เดิมซ้ำได้
          if (f) onPick(f);
        }}
      />
    </div>
  );
}
