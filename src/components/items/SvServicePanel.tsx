import React, { useEffect, useState } from 'react';
import { IconLoader2 } from '@tabler/icons-react';
import { RequestAction, RequestResolution } from '../../types/requestList';
import { ActionFieldValues, cleanFieldValues } from '../../data/requestActionFields';
import { actionBtnClass } from './RequestActionDialog';
import { fmtDateTime } from '../../data/requestListData';

const INPUT =
  'w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-[13px] text-gray-800 dark:text-slate-100 outline-none transition focus:border-accent disabled:opacity-60';
const LABEL = 'mb-1 block text-[11.5px] font-semibold text-gray-500 dark:text-slate-400';
const SERVICE_DETAIL_MAX = 400;

export function SvServicePanel({
  state,
  actions,
  resolution,
  pending,
  onSubmit,
}: {
  state: 'done' | 'current' | 'upcoming';
  actions: RequestAction[];
  resolution: RequestResolution | null | undefined;
  pending: boolean;
  onSubmit?: (action: RequestAction, fields: ActionFieldValues) => void | Promise<void>;
}) {
  const [serviceDetail, setServiceDetail] = useState('');
  const [planCompleteDate, setPlanCompleteDate] = useState('');
  const [touched, setTouched] = useState(false);
  const [confirmReceive, setConfirmReceive] = useState(false);

  useEffect(() => {
    if (!resolution) return;
    setServiceDetail(resolution.resolutionDetail ?? '');
    setPlanCompleteDate(resolution.planCompleteDate?.slice(0, 10) ?? '');
  }, [resolution]);

  const save = actions.find((action) => action.code === 'saveService');
  const receive = actions.find((action) => action.code === 'receive');
  const editable = !!onSubmit && (!!save || !!receive);
  const missingDetail = serviceDetail.trim() === '';
  const missingDate = planCompleteDate === '';

  const fields = (): ActionFieldValues =>
    cleanFieldValues({
      serviceDetail,
      planCompleteDate: planCompleteDate ? `${planCompleteDate}T00:00:00` : '',
    }) ?? {};

  const beginReceive = () => {
    setTouched(true);
    if (missingDetail || missingDate) return;
    setConfirmReceive(true);
  };

  if (state === 'upcoming') {
    return <p className="text-[12.5px] text-slate-400 dark:text-slate-500">— ยังไม่ถึงขั้นรับเรื่อง / ดำเนินการ</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-x-5 gap-y-4">
        <div className="col-span-2">
          <label className={LABEL}>
            ผลดำเนินการ{receive && <span className="text-rose-600 dark:text-rose-400"> *</span>}
          </label>
          {editable ? (
            <>
              <textarea
                rows={5}
                maxLength={SERVICE_DETAIL_MAX}
                value={serviceDetail}
                disabled={pending}
                placeholder="ระบุผลการตรวจสอบ งานที่ดำเนินการ หรือความคืบหน้า"
                onChange={(event) => {
                  setServiceDetail(event.target.value);
                  setConfirmReceive(false);
                }}
                className={`${INPUT} resize-y leading-relaxed ${
                  touched && receive && missingDetail
                    ? 'border-rose-300 dark:border-rose-800 bg-rose-50/40'
                    : ''
                }`}
              />
              <span className="mt-1 block text-right text-[11px] text-slate-400 dark:text-slate-500">
                {serviceDetail.length}/{SERVICE_DETAIL_MAX}
              </span>
            </>
          ) : (
            <div className="min-h-[88px] whitespace-pre-wrap rounded-lg border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3.5 py-3 text-[13px] text-gray-800 dark:text-slate-100">
              {serviceDetail || '— (ยังไม่ได้บันทึก)'}
            </div>
          )}
        </div>

        <div>
          <label className={LABEL}>
            วันที่กำหนดเสร็จ{receive && <span className="text-rose-600 dark:text-rose-400"> *</span>}
          </label>
          {editable ? (
            <input
              type="date"
              value={planCompleteDate}
              disabled={pending}
              onChange={(event) => {
                setPlanCompleteDate(event.target.value);
                setConfirmReceive(false);
              }}
              className={`${INPUT} mono ${
                touched && receive && missingDate
                  ? 'border-rose-300 dark:border-rose-800 bg-rose-50/40'
                  : ''
              }`}
            />
          ) : (
            <div className="rounded-lg border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3.5 py-2 text-[13px] text-gray-800 dark:text-slate-100">
              {planCompleteDate || '—'}
            </div>
          )}
        </div>
      </div>

      {touched && receive && (missingDetail || missingDate) && (
        <p className="text-[11.5px] font-semibold text-rose-600 dark:text-rose-400">
          กรุณากรอกผลดำเนินการและวันที่กำหนดเสร็จก่อนกดรับเรื่อง
        </p>
      )}

      {editable && (
        <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 dark:border-slate-800 pt-4">
          {save && (
            <button
              type="button"
              disabled={pending}
              onClick={() => onSubmit?.(save, fields())}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-[13px] font-semibold transition disabled:opacity-50 ${actionBtnClass(save.style)}`}
            >
              {pending && <IconLoader2 size={15} className="animate-spin" />}
              {save.label}
            </button>
          )}

          {receive && !confirmReceive && (
            <button
              type="button"
              disabled={pending}
              onClick={beginReceive}
              className={`rounded-lg border px-4 py-2 text-[13px] font-semibold transition disabled:opacity-50 ${actionBtnClass(receive.style)}`}
            >
              {receive.label}
            </button>
          )}

          {receive && confirmReceive && (
            <span className="inline-flex flex-wrap items-center gap-2 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1.5">
              <span className="text-[12px] font-semibold text-amber-900 dark:text-amber-200">
                ยืนยันรับเรื่องและส่งข้อมูลชุดนี้?
              </span>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setConfirmReceive(false);
                  onSubmit?.(receive, fields());
                }}
                className={`rounded-lg border px-3 py-1.5 text-[12.5px] font-semibold ${actionBtnClass(receive.style)}`}
              >
                ยืนยัน
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => setConfirmReceive(false)}
                className="rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-1.5 text-[12.5px] font-semibold text-slate-700 dark:text-slate-200"
              >
                ยกเลิก
              </button>
            </span>
          )}

          <span className="text-[11.5px] text-slate-400 dark:text-slate-500">
            บันทึกรายละเอียดได้เรื่อย ๆ โดยไม่เลื่อนสถานะ · รับเรื่องจะบันทึกข้อมูลและเลื่อนไปขั้นถัดไป
          </span>
        </div>
      )}
    </div>
  );
}

export function SvMgrReviewPanel({
  state,
  actions,
  resolution,
  pending,
  onSubmit,
}: {
  state: 'done' | 'current' | 'upcoming';
  actions: RequestAction[];
  resolution: RequestResolution | null | undefined;
  pending: boolean;
  onSubmit?: (action: RequestAction, fields: ActionFieldValues) => void | Promise<void>;
}) {
  const [serviceDetail, setServiceDetail] = useState('');
  const [planCompleteDate, setPlanCompleteDate] = useState('');
  const [touched, setTouched] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    setServiceDetail(resolution?.resolutionDetail ?? '');
    setPlanCompleteDate(resolution?.planCompleteDate?.slice(0, 10) ?? '');
  }, [resolution]);

  const action = actions.find((item) => item.code === 'mgrClose');
  const editable = state === 'current' && !!action && !!onSubmit;
  const missingDetail = serviceDetail.trim() === '';
  const missingDate = planCompleteDate === '';

  const begin = () => {
    setTouched(true);
    if (missingDetail || missingDate) return;
    setConfirming(true);
  };

  const submit = () => {
    if (!action || missingDetail || missingDate) return;
    setConfirming(false);
    onSubmit?.(
      action,
      cleanFieldValues({
        serviceDetail,
        planCompleteDate: `${planCompleteDate}T00:00:00`,
      }) ?? {}
    );
  };

  if (state === 'upcoming') {
    return <p className="text-[12.5px] text-slate-400 dark:text-slate-500">— ยังไม่ถึงขั้น Mgr SV ตรวจสอบ</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[12.5px] text-slate-500 dark:text-slate-400">
        ตรวจสอบผลดำเนินการและวันที่กำหนดเสร็จ สามารถแก้ไขก่อนกดยืนยันได้
      </p>
      <div className="grid grid-cols-2 gap-x-5 gap-y-4">
        <div className="col-span-2">
          <label className={LABEL}>
            ผลดำเนินการ{editable && <span className="text-rose-600 dark:text-rose-400"> *</span>}
          </label>
          {editable ? (
            <>
              <textarea
                rows={5}
                maxLength={SERVICE_DETAIL_MAX}
                value={serviceDetail}
                disabled={pending}
                onChange={(event) => {
                  setServiceDetail(event.target.value);
                  setConfirming(false);
                }}
                className={`${INPUT} resize-y leading-relaxed ${
                  touched && missingDetail ? 'border-rose-300 dark:border-rose-800 bg-rose-50/40' : ''
                }`}
              />
              <span className="mt-1 block text-right text-[11px] text-slate-400 dark:text-slate-500">
                {serviceDetail.length}/{SERVICE_DETAIL_MAX}
              </span>
            </>
          ) : (
            <div className="min-h-[88px] whitespace-pre-wrap rounded-lg border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3.5 py-3 text-[13px] text-gray-800 dark:text-slate-100">
              {serviceDetail || '— (ยังไม่ได้บันทึก)'}
            </div>
          )}
        </div>
        <div>
          <label className={LABEL}>
            วันที่กำหนดเสร็จ{editable && <span className="text-rose-600 dark:text-rose-400"> *</span>}
          </label>
          {editable ? (
            <input
              type="date"
              value={planCompleteDate}
              disabled={pending}
              onChange={(event) => {
                setPlanCompleteDate(event.target.value);
                setConfirming(false);
              }}
              className={`${INPUT} mono ${
                touched && missingDate ? 'border-rose-300 dark:border-rose-800 bg-rose-50/40' : ''
              }`}
            />
          ) : (
            <div className="rounded-lg border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3.5 py-2 text-[13px] text-gray-800 dark:text-slate-100">
              {planCompleteDate || '—'}
            </div>
          )}
        </div>
        {state === 'done' && (
          <>
            <div>
              <span className={LABEL}>Mgr SV ผู้ตรวจสอบ</span>
              <span className="text-[13px] text-gray-800 dark:text-slate-100">{resolution?.mgrClosedBy || '—'}</span>
            </div>
            <div>
              <span className={LABEL}>วันที่ตรวจสอบ</span>
              <span className="mono text-[13px] text-gray-800 dark:text-slate-100">
                {resolution?.mgrClosedDate ? fmtDateTime(resolution.mgrClosedDate) : '—'}
              </span>
            </div>
          </>
        )}
      </div>

      {touched && (missingDetail || missingDate) && (
        <p className="text-[11.5px] font-semibold text-rose-600 dark:text-rose-400">
          กรุณากรอกผลดำเนินการและวันที่กำหนดเสร็จก่อนยืนยัน
        </p>
      )}

      {editable && (
        <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 dark:border-slate-800 pt-4">
          {!confirming ? (
            <button
              type="button"
              disabled={pending}
              onClick={begin}
              className={`rounded-lg border px-4 py-2 text-[13px] font-semibold transition disabled:opacity-50 ${actionBtnClass(action!.style)}`}
            >
              {action!.label}
            </button>
          ) : (
            <span className="inline-flex flex-wrap items-center gap-2 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1.5">
              <span className="text-[12px] font-semibold text-amber-900 dark:text-amber-200">
                ยืนยันผลการตรวจสอบและส่งไปขั้นผู้แจ้งพิจารณา?
              </span>
              <button
                type="button"
                disabled={pending}
                onClick={submit}
                className={`rounded-lg border px-3 py-1.5 text-[12.5px] font-semibold ${actionBtnClass(action!.style)}`}
              >
                ยืนยัน
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => setConfirming(false)}
                className="rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-1.5 text-[12.5px] font-semibold text-slate-700 dark:text-slate-200"
              >
                ยกเลิก
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function SvRequesterReviewPanel({
  state,
  actions,
  resolution,
  pending,
  onSubmit,
}: {
  state: 'done' | 'current' | 'upcoming';
  actions: RequestAction[];
  resolution: RequestResolution | null | undefined;
  pending: boolean;
  onSubmit?: (action: RequestAction, fields: ActionFieldValues) => void | Promise<void>;
}) {
  const [accepted, setAccepted] = useState<boolean | null>(null);
  const [notAcceptedDetail, setNotAcceptedDetail] = useState('');
  const [touched, setTouched] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    setAccepted(resolution?.accepted ?? null);
    setNotAcceptedDetail(resolution?.notAcceptedDetail ?? '');
  }, [resolution]);

  // saveReview ต้องมาจาก availableActions หลัง backend เพิ่ม action แบบ SaveOnly แล้ว
  const save = actions.find((action) => action.code === 'saveReview');
  const confirm = actions.find((action) => action.code === 'close');
  const editable = state === 'current' && !!onSubmit && (!!save || !!confirm);
  const missingChoice = accepted === null;
  const missingReason = accepted === false && notAcceptedDetail.trim() === '';

  const validate = () => {
    setTouched(true);
    return !missingChoice && !missingReason;
  };

  const fields = (): ActionFieldValues =>
    accepted === null
      ? {}
      : cleanFieldValues({
          accepted,
          ...(accepted === false ? { notAcceptedDetail } : {}),
        }) ?? {};

  const choose = (value: boolean) => {
    setAccepted(value);
    if (value) setNotAcceptedDetail('');
    setTouched(false);
    setConfirming(false);
  };

  if (state === 'upcoming') {
    return <p className="text-[12.5px] text-slate-400 dark:text-slate-500">— ยังไม่ถึงขั้นผู้แจ้งพิจารณา</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <span className={LABEL}>
          ผลพิจารณา{editable && <span className="text-rose-600 dark:text-rose-400"> *</span>}
        </span>
        <div className="flex flex-wrap gap-3">
          {[
            { value: true, label: 'ยอมรับ' },
            { value: false, label: 'ไม่ยอมรับ' },
          ].map((option) => (
            <label
              key={String(option.value)}
              className={`flex items-center gap-2 rounded-lg border px-3.5 py-2 text-[13px] font-semibold ${
                accepted === option.value
                  ? option.value
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'border-rose-400 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                  : 'border-gray-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
              } ${editable ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <input
                type="checkbox"
                checked={accepted === option.value}
                disabled={!editable || pending}
                onChange={() => choose(option.value)}
                className="h-4 w-4 accent-accent"
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      {accepted === false && (
        <div>
          <label className={LABEL}>
            รายละเอียดที่ไม่ยอมรับ<span className="text-rose-600 dark:text-rose-400"> *</span>
          </label>
          {editable ? (
            <textarea
              rows={4}
              maxLength={SERVICE_DETAIL_MAX}
              value={notAcceptedDetail}
              disabled={pending}
              placeholder="ระบุงานที่ยังไม่เรียบร้อยหรือสิ่งที่ต้องแก้ไขเพิ่มเติม"
              onChange={(event) => {
                setNotAcceptedDetail(event.target.value);
                setConfirming(false);
              }}
              className={`${INPUT} resize-y ${
                touched && missingReason ? 'border-rose-300 dark:border-rose-800 bg-rose-50/40' : ''
              }`}
            />
          ) : (
            <div className="min-h-[76px] whitespace-pre-wrap rounded-lg border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3.5 py-3 text-[13px] text-gray-800 dark:text-slate-100">
              {notAcceptedDetail || '—'}
            </div>
          )}
        </div>
      )}

      {touched && (missingChoice || missingReason) && (
        <p className="text-[11.5px] font-semibold text-rose-600 dark:text-rose-400">
          {missingChoice ? 'กรุณาเลือกผลพิจารณา' : 'ไม่ยอมรับงานต้องระบุรายละเอียด'}
        </p>
      )}

      {editable && (
        <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 dark:border-slate-800 pt-4">
          {save && (
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (validate()) onSubmit?.(save, fields());
              }}
              className={`rounded-lg border px-4 py-2 text-[13px] font-semibold transition disabled:opacity-50 ${actionBtnClass(save.style)}`}
            >
              {save.label}
            </button>
          )}

          {confirm && !confirming && (
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (validate()) setConfirming(true);
              }}
              className={`rounded-lg border px-4 py-2 text-[13px] font-semibold transition disabled:opacity-50 ${actionBtnClass(confirm.style)}`}
            >
              ยืนยันการพิจารณา
            </button>
          )}

          {confirm && confirming && (
            <span className="inline-flex flex-wrap items-center gap-2 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1.5">
              <span className="text-[12px] font-semibold text-amber-900 dark:text-amber-200">
                ยืนยันผลพิจารณาและส่งต่อให้ Mgr ผู้แจ้งปิดงาน?
              </span>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setConfirming(false);
                  onSubmit?.(confirm, fields());
                }}
                className={`rounded-lg border px-3 py-1.5 text-[12.5px] font-semibold ${actionBtnClass(confirm.style)}`}
              >
                ยืนยัน
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => setConfirming(false)}
                className="rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-1.5 text-[12.5px] font-semibold text-slate-700 dark:text-slate-200"
              >
                ยกเลิก
              </button>
            </span>
          )}

          {save && (
            <span className="text-[11.5px] text-slate-400 dark:text-slate-500">
              บันทึกผลพิจารณาได้เรื่อย ๆ โดยไม่เลื่อนสถานะ
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function SvMgrRequestClosePanel({
  state,
  actions,
  resolution,
  pending,
  onSubmit,
}: {
  state: 'done' | 'current' | 'upcoming';
  actions: RequestAction[];
  resolution: RequestResolution | null | undefined;
  pending: boolean;
  onSubmit?: (action: RequestAction, fields: ActionFieldValues) => void | Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const action = actions.find((item) => item.code === 'mgrRequestClose');
  const editable = state === 'current' && !!action && !!onSubmit;

  if (state === 'upcoming') {
    return <p className="text-[12.5px] text-slate-400 dark:text-slate-500">— ยังไม่ถึงขั้น Mgr ผู้แจ้งปิดงาน</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {state === 'done' ? (
        <div className="grid grid-cols-2 gap-x-5 gap-y-3">
          <div>
            <span className={LABEL}>Mgr ผู้ปิดงาน</span>
            <span className="text-[13px] text-gray-800 dark:text-slate-100">{resolution?.jobClosedBy || '—'}</span>
          </div>
          <div>
            <span className={LABEL}>วันที่ปิดงาน</span>
            <span className="mono text-[13px] text-gray-800 dark:text-slate-100">
              {resolution?.jobClosedDate ? fmtDateTime(resolution.jobClosedDate) : '—'}
            </span>
          </div>
        </div>
      ) : (
        <p className="text-[12.5px] text-slate-500 dark:text-slate-400">
          ผู้แจ้งยืนยันผลการพิจารณาแล้ว กรุณาตรวจสอบและยืนยันปิดใบงาน
        </p>
      )}

      {editable && (
        <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 dark:border-slate-800 pt-4">
          {!confirming ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => setConfirming(true)}
              className={`rounded-lg border px-4 py-2 text-[13px] font-semibold transition disabled:opacity-50 ${actionBtnClass(action!.style)}`}
            >
              {action!.label}
            </button>
          ) : (
            <span className="inline-flex flex-wrap items-center gap-2 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1.5">
              <span className="text-[12px] font-semibold text-amber-900 dark:text-amber-200">
                ยืนยันปิดใบงานนี้?
              </span>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setConfirming(false);
                  onSubmit?.(action!, {});
                }}
                className={`rounded-lg border px-3 py-1.5 text-[12.5px] font-semibold ${actionBtnClass(action!.style)}`}
              >
                ยืนยัน
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => setConfirming(false)}
                className="rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-1.5 text-[12.5px] font-semibold text-slate-700 dark:text-slate-200"
              >
                ยกเลิก
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
