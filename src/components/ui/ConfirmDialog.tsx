import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

export function ConfirmDialog({ title, children, pending, confirmClass, onCancel, onConfirm }: {
  title: string; children: React.ReactNode; pending: boolean; confirmClass: string;
  onCancel: () => void; onConfirm: () => void;
}) {
  const titleId = useId();
  const bodyId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    return () => { if (previous?.isConnected) previous.focus(); };
  }, []);
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={e => e.stopPropagation()} onKeyDown={e => {
      e.stopPropagation();
      if (e.key === 'Escape') { e.preventDefault(); if (!pending) onCancel(); }
      if (e.key === 'Tab') {
        e.preventDefault();
        if (document.activeElement === cancelRef.current) confirmRef.current?.focus();
        else cancelRef.current?.focus();
      }
    }}>
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={bodyId} aria-busy={pending}
        className="modal-pop w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <h3 id={titleId} className="text-base font-bold text-gray-900 dark:text-slate-100">{title}</h3>
        <div id={bodyId} className="mt-3 text-[13px] text-gray-600 dark:text-slate-300">{children}</div>
        <div className="mt-5 flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-slate-800">
          <button ref={cancelRef} type="button" disabled={pending} onClick={onCancel}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-[13px] font-semibold text-slate-700 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200">ยกเลิก</button>
          <button ref={confirmRef} type="button" disabled={pending} onClick={onConfirm}
            className={`rounded-lg border px-4 py-2 text-[13px] font-semibold disabled:opacity-50 ${confirmClass}`}>{pending ? 'กำลังบันทึก…' : 'ยืนยัน'}</button>
        </div>
      </div>
    </div>, document.body,
  );
}
