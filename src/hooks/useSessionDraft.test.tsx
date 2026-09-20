import React, { useEffect } from 'react';
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { DraftScope, useSessionDraft } from './useSessionDraft';
import { clearDraftSession, draftGeneration, readDraft, startDraftSession, suspendDraftSession, writeDraft } from '../utils/sessionDrafts';

beforeEach(() => { clearDraftSession(); startDraftSession('alice'); });
afterEach(() => clearDraftSession());

function Form({ server = 'จาก API' }: { server?: string }) {
  const [form, setForm] = useSessionDraft('form', { detail: '', choice: '', date: '', lines: [] as string[], images: [] as File[] });
  useEffect(() => { setForm.hydrate({ detail: server, choice: '', date: '', lines: [], images: [] }); }, [server, setForm]);
  return <>
    <input aria-label="รายละเอียด" value={form.detail} onChange={e => setForm(f => ({ ...f, detail: e.target.value }))} />
    <button onClick={() => setForm(f => ({ ...f, choice: 'ตัวเลือก', date: '2026-09-20', lines: ['รายการ 1'], images: [new File(['image'], 'photo.png')] }))}>เลือก</button>
    <button onClick={() => setForm.reset({ detail: '', choice: '', date: '', lines: [], images: [] })}>ล้าง</button>
    <output>{JSON.stringify(form)}</output>
  </>;
}
const scope = (module: string, server?: string) => <DraftScope name="/inbox"><DraftScope name={`${module}::01`}><Form server={server} /></DraftScope></DraftScope>;

test.each(['IT', 'PL', 'CR', 'GA', 'IM', 'AF', 'HR_PR', 'SV', 'SQA', 'PS'])('%s restores text, choices, date and rows without files or API overwrites', module => {
  const first = render(scope(module));
  fireEvent.change(screen.getByLabelText('รายละเอียด'), { target: { value: 'กำลังพิมพ์' } });
  fireEvent.click(screen.getByText('เลือก'));
  suspendDraftSession('/inbox?myturn=1');
  first.unmount();
  expect(startDraftSession('alice', true)).toBe('/inbox?myturn=1');
  const next = render(scope(module, 'ข้อมูล API ล่าสุด'));
  expect(screen.getByLabelText('รายละเอียด')).toHaveValue('กำลังพิมพ์');
  expect(JSON.parse(screen.getByRole('status').textContent!)).toMatchObject({ choice: 'ตัวเลือก', date: '2026-09-20', lines: ['รายการ 1'], images: [] });
  next.rerender(scope(module, 'API โหลดช้า'));
  expect(screen.getByLabelText('รายละเอียด')).toHaveValue('กำลังพิมพ์');
});

test('different account and explicit logout discard the old draft', () => {
  const first = render(scope('PS'));
  fireEvent.change(screen.getByLabelText('รายละเอียด'), { target: { value: 'ส่วนตัว' } });
  suspendDraftSession('/inbox'); first.unmount();
  expect(startDraftSession('bob', true)).toBeNull();
  const second = render(scope('PS'));
  expect(screen.getByLabelText('รายละเอียด')).toHaveValue('จาก API');
  clearDraftSession(); second.unmount();
  expect(startDraftSession('alice', true)).toBeNull();
  render(scope('PS'));
  expect(screen.getByLabelText('รายละเอียด')).toHaveValue('จาก API');
});

test('closing a form normally discards its registered state', async () => {
  const first = render(scope('PS'));
  fireEvent.change(screen.getByLabelText('รายละเอียด'), { target: { value: 'ทิ้งร่าง' } });
  first.unmount();
  await act(async () => { await Promise.resolve(); });
  render(scope('PS'));
  expect(screen.getByLabelText('รายละเอียด')).toHaveValue('จาก API');
});

test('late writes after expiry/login cannot corrupt the snapshot or another account', () => {
  const generation = draftGeneration();
  writeDraft('test', { text: 'ล่าสุด', token: 'secret', password: 'secret' }, true, generation);
  suspendDraftSession('/create');
  writeDraft('test', 'คำตอบเก่าจาก API', false, generation);
  expect(startDraftSession('alice', true)).toBe('/create');
  expect(readDraft('test')?.value).toEqual({ text: 'ล่าสุด' });
  startDraftSession('bob', true);
  writeDraft('test', 'บัญชีเก่า', true, generation);
  expect(readDraft('test')).toBeUndefined();
});

test('StrictMode preserves restored state; reset permits new API defaults', () => {
  writeDraft('/%2Finbox/PS%3A%3A01/form', { detail: 'ร่าง', choice: '', date: '', lines: [], images: [] }, true, draftGeneration());
  const view = render(<React.StrictMode>{scope('PS')}</React.StrictMode>);
  expect(screen.getByLabelText('รายละเอียด')).toHaveValue('ร่าง');
  fireEvent.click(screen.getByText('ล้าง'));
  view.rerender(<React.StrictMode>{scope('PS', 'ค่าที่โหลดใหม่')}</React.StrictMode>);
  expect(screen.getByLabelText('รายละเอียด')).toHaveValue('ค่าที่โหลดใหม่');
});
