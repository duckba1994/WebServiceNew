import { fireEvent, render, screen } from '@testing-library/react';
import { RequestAction } from '../../types/requestList';
import {
  SvMgrRequestClosePanel,
  SvMgrReviewPanel,
  SvRequesterReviewPanel,
  SvServicePanel,
} from './SvServicePanel';

const save = { code: 'saveService', label: 'บันทึกรายละเอียด', style: 'neutral' } as RequestAction;
const receive = { code: 'receive', label: 'รับเรื่อง', style: 'primary' } as RequestAction;

test('saveService stores current SV fields without requiring them', () => {
  const submit = jest.fn();
  const { container } = render(
    <SvServicePanel state="current" actions={[save, receive]} resolution={null} pending={false} onSubmit={submit} />
  );

  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'เปลี่ยนสายไฮดรอลิก' } });
  fireEvent.change(container.querySelector('input[type="date"]')!, { target: { value: '2026-09-13' } });
  fireEvent.click(screen.getByRole('button', { name: 'บันทึกรายละเอียด' }));

  expect(submit).toHaveBeenCalledWith(save, {
    serviceDetail: 'เปลี่ยนสายไฮดรอลิก',
    planCompleteDate: '2026-09-13T00:00:00',
  });
});

test('receive requires both fields and submits the same values after confirmation', () => {
  const submit = jest.fn();
  const { container } = render(
    <SvServicePanel state="current" actions={[save, receive]} resolution={null} pending={false} onSubmit={submit} />
  );

  fireEvent.click(screen.getByRole('button', { name: 'รับเรื่อง' }));
  expect(submit).not.toHaveBeenCalled();
  expect(screen.getByText('กรุณากรอกผลดำเนินการและวันที่กำหนดเสร็จก่อนกดรับเรื่อง')).toBeTruthy();

  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'ตรวจสอบเสร็จแล้ว' } });
  fireEvent.change(container.querySelector('input[type="date"]')!, { target: { value: '2026-09-14' } });
  fireEvent.click(screen.getByRole('button', { name: 'รับเรื่อง' }));
  fireEvent.click(screen.getByRole('button', { name: 'ยืนยัน' }));

  expect(submit).toHaveBeenCalledWith(receive, {
    serviceDetail: 'ตรวจสอบเสร็จแล้ว',
    planCompleteDate: '2026-09-14T00:00:00',
  });
});

test('Mgr SV submits mgrClose with the reviewed service values', () => {
  const submit = jest.fn();
  const mgrClose = { code: 'mgrClose', label: 'Mgr ตรวจสอบ', style: 'primary' } as RequestAction;
  const { container } = render(
    <SvMgrReviewPanel
      state="current"
      actions={[mgrClose]}
      resolution={{ resolutionDetail: 'งานเสร็จแล้ว', planCompleteDate: '2026-09-15T00:00:00' } as any}
      pending={false}
      onSubmit={submit}
    />
  );

  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'ตรวจสอบงานเรียบร้อย' } });
  fireEvent.change(container.querySelector('input[type="date"]')!, { target: { value: '2026-09-16' } });
  fireEvent.click(screen.getByRole('button', { name: 'Mgr ตรวจสอบ' }));
  fireEvent.click(screen.getByRole('button', { name: 'ยืนยัน' }));

  expect(submit).toHaveBeenCalledWith(mgrClose, {
    serviceDetail: 'ตรวจสอบงานเรียบร้อย',
    planCompleteDate: '2026-09-16T00:00:00',
  });
});

test('requester can save a rejected review repeatedly and confirm it with the same fields', () => {
  const submit = jest.fn();
  const saveReview = { code: 'saveReview', label: 'บันทึกผลพิจารณา', style: 'neutral' } as RequestAction;
  const close = { code: 'close', label: 'พิจารณา / ปิดงาน', style: 'success' } as RequestAction;
  render(
    <SvRequesterReviewPanel
      state="current"
      actions={[saveReview, close]}
      resolution={null}
      pending={false}
      onSubmit={submit}
    />
  );

  fireEvent.click(screen.getByRole('checkbox', { name: 'ไม่ยอมรับ' }));
  fireEvent.click(screen.getByRole('button', { name: 'บันทึกผลพิจารณา' }));
  expect(submit).not.toHaveBeenCalled();
  expect(screen.getByText('ไม่ยอมรับงานต้องระบุรายละเอียด')).toBeTruthy();

  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'ยังมีน้ำมันรั่ว' } });
  fireEvent.click(screen.getByRole('button', { name: 'บันทึกผลพิจารณา' }));
  expect(submit).toHaveBeenLastCalledWith(saveReview, {
    accepted: false,
    notAcceptedDetail: 'ยังมีน้ำมันรั่ว',
  });

  fireEvent.click(screen.getByRole('button', { name: 'ยืนยันการพิจารณา' }));
  fireEvent.click(screen.getByRole('button', { name: 'ยืนยัน' }));
  expect(submit).toHaveBeenLastCalledWith(close, {
    accepted: false,
    notAcceptedDetail: 'ยังมีน้ำมันรั่ว',
  });
});

test('requester Mgr closes without resubmitting review fields', () => {
  const submit = jest.fn();
  const close = { code: 'mgrRequestClose', label: 'Mgr ผู้เปิดเรื่องปิดงาน', style: 'success' } as RequestAction;
  render(
    <SvMgrRequestClosePanel
      state="current"
      actions={[close]}
      resolution={{ accepted: false, notAcceptedDetail: 'ข้อมูลเดิม' } as any}
      pending={false}
      onSubmit={submit}
    />
  );

  expect(screen.queryByRole('checkbox')).toBeNull();
  expect(screen.queryByRole('textbox')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Mgr ผู้เปิดเรื่องปิดงาน' }));
  fireEvent.click(screen.getByRole('button', { name: 'ยืนยัน' }));
  expect(submit).toHaveBeenCalledWith(close, {});
});
