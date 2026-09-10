import { fireEvent, render, screen } from '@testing-library/react';
import { AfServicePanel } from './AfServicePanel';
import { RequestAction } from '../../types/requestList';

test('AF requires a close date and submits service without a confirmation popup', () => {
  const submit = jest.fn();
  const done = { code: 'service', label: 'ดำเนินการเสร็จ', style: 'success' } as RequestAction;
  const { container } = render(
    <AfServicePanel actions={[done]} resolution={{ resolutionDetail: 'ปิดงานแล้ว' } as any} pending={false} onSubmit={submit} />
  );

  fireEvent.click(screen.getByRole('button', { name: 'ดำเนินการเสร็จ' }));
  expect(submit).not.toHaveBeenCalled();
  expect(screen.getByText('กรุณาระบุวันที่ปิดเรื่อง')).toBeTruthy();

  fireEvent.change(container.querySelector('input[type="date"]')!, { target: { value: '2026-09-10' } });
  fireEvent.click(screen.getByRole('button', { name: 'ดำเนินการเสร็จ' }));

  expect(screen.queryByRole('alertdialog')).toBeNull();
  expect(submit).toHaveBeenCalledWith(done, {
    serviceDetail: 'ปิดงานแล้ว',
    planCompleteDate: '2026-09-10T00:00:00',
  });
});
