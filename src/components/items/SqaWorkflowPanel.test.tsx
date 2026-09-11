import { fireEvent, render, screen } from '@testing-library/react';
import { SqaReceivePanel, SqaServicePanel } from './SqaWorkflowPanel';
import { RequestAction } from '../../types/requestList';

const action = (code: string, label: string) => ({ code, label, style: 'primary' } as RequestAction);

test('SQA can save an assignee repeatedly before receiving the request', () => {
  const submit = jest.fn().mockResolvedValue(null);
  const save = action('saveReceive', 'บันทึก');
  const receive = action('receive', 'รับเรื่อง');
  render(<SqaReceivePanel doc={null} actions={[save, receive]} pending={false} onSubmit={submit} />);

  fireEvent.change(screen.getByLabelText('มอบหมายผู้ดำเนินการ'), { target: { value: 'เจ้าหน้าที่ SQA' } });
  fireEvent.click(screen.getByRole('button', { name: 'บันทึก' }));
  fireEvent.click(screen.getByRole('button', { name: 'บันทึก' }));
  expect(submit).toHaveBeenNthCalledWith(1, save, { requestService: 'เจ้าหน้าที่ SQA' });
  expect(submit).toHaveBeenNthCalledWith(2, save, { requestService: 'เจ้าหน้าที่ SQA' });

  fireEvent.click(screen.getByRole('button', { name: 'รับเรื่อง' }));
  expect(submit).toHaveBeenLastCalledWith(receive, { requestService: 'เจ้าหน้าที่ SQA' });
});

test('SQA service requires equal-sized standard and operation fields', () => {
  const submit = jest.fn();
  const service = action('service', 'ดำเนินการเสร็จ');
  render(<SqaServicePanel doc={null} actions={[service]} pending={false} onSubmit={submit} />);
  const standard = screen.getByLabelText('มาตรฐานการดำเนินการ');
  const detail = screen.getByLabelText('การดำเนินการ');
  expect(standard.tagName).toBe('TEXTAREA');
  expect(standard.getAttribute('rows')).toBe(detail.getAttribute('rows'));
  expect(screen.queryByText('ผลการดำเนินการ')).toBeNull();

  fireEvent.click(screen.getByRole('button', { name: 'ดำเนินการเสร็จ' }));
  expect(screen.getByText('กรุณากรอกมาตรฐานการดำเนินการ')).toBeTruthy();
  expect(screen.getByText('กรุณากรอกการดำเนินการ')).toBeTruthy();
  expect(submit).not.toHaveBeenCalled();

  fireEvent.change(standard, { target: { value: 'SQA-STD-01' } });
  fireEvent.change(detail, { target: { value: 'ตรวจสอบครบแล้ว' } });
  fireEvent.click(screen.getByRole('button', { name: 'ดำเนินการเสร็จ' }));
  expect(submit).toHaveBeenCalledWith(service, {
    serviceStd: 'SQA-STD-01',
    serviceDetail: 'ตรวจสอบครบแล้ว',
  });
});
