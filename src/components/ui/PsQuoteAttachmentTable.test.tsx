import React, { useState } from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PsQuoteAttachmentTable } from './PsQuoteAttachmentTable';
import { fetchAddresses } from '../../api/masterData';
import { toPsAttachment } from '../../data/psRequestForm';

jest.mock('../../api/masterData', () => ({ fetchAddresses: jest.fn() }));
const fetchMaster = fetchAddresses as jest.Mock;
const master = { provinces: [
  { nameTH: 'สงขลา', districts: [{ nameTH: 'หาดใหญ่' }] },
  { nameTH: 'เชียงใหม่', districts: [{ nameTH: 'แม่ริม' }] },
] };
beforeEach(() => {
  jest.clearAllMocks();
  fetchMaster.mockImplementation(() => new Promise(() => {}));
  HTMLElement.prototype.scrollIntoView = jest.fn();
});

const Wrapper = () => {
  const [value, setValue] = useState('');
  return <PsQuoteAttachmentTable value={value} onChange={setValue} />;
};

const button = (name: string) => screen.getByRole('button', { name });

test('loads once, filters districts and clears only the changed row district; PS payload stores names', async () => {
  fetchMaster.mockResolvedValue(master);
  let current = '';
  const Form = () => {
    const [value, setValue] = useState(JSON.stringify({
      '8': { selected: true, province: 'สงขลา', district: 'หาดใหญ่' },
      '9': { selected: true, province: 'สงขลา', district: 'หาดใหญ่' },
      '10': { selected: true, serviceCenter: 'ศูนย์เดิม', province: 'สงขลา' },
    }));
    current = value;
    return <PsQuoteAttachmentTable token="token" value={value} onChange={setValue} />;
  };
  render(<Form />);
  const province = screen.getByLabelText('จังหวัด — ลำดับ 8');
  const district = screen.getByLabelText('อำเภอ — ลำดับ 8');
  await waitFor(() => expect(province).toBeEnabled());
  fireEvent.focus(province);
  fireEvent.mouseDown(screen.getByRole('option', { name: 'เชียงใหม่' }));
  expect(district).toHaveValue('');
  expect(screen.getByLabelText('อำเภอ — ลำดับ 9')).toHaveValue('หาดใหญ่');
  fireEvent.focus(district);
  expect(screen.queryByRole('option', { name: 'หาดใหญ่' })).not.toBeInTheDocument();
  fireEvent.mouseDown(screen.getByRole('option', { name: 'แม่ริม' }));
  expect(toPsAttachment(current)).toMatchObject({ repairValueOutCompany_City: 'เชียงใหม่', repairValueOutCompany_Area: 'แม่ริม' });
  fireEvent.focus(screen.getByLabelText('จังหวัด — ลำดับ 10'));
  fireEvent.mouseDown(screen.getByRole('option', { name: 'เชียงใหม่' }));
  expect(toPsAttachment(current)).toMatchObject({ serviceCenter_City: 'เชียงใหม่', serviceCenter_Name: 'ศูนย์เดิม' });
  fireEvent.keyDown(province, { key: 'Delete' });
  expect(district).toHaveValue('');
  expect(district).toBeDisabled();
  expect(fetchMaster).toHaveBeenCalledTimes(1);
  expect(fetchMaster).toHaveBeenCalledWith('token');
});

test('retains saved locations on load failure and retries without clearing them', async () => {
  fetchMaster.mockRejectedValueOnce(new Error('โหลดไม่สำเร็จ')).mockResolvedValueOnce(master);
  const change = jest.fn();
  render(<PsQuoteAttachmentTable value={JSON.stringify({ '8': { selected: true, province: 'จังหวัดเดิม', district: 'อำเภอเดิม' } })} onChange={change} />);
  await screen.findByRole('alert');
  expect(screen.getByLabelText('จังหวัด — ลำดับ 8')).toHaveValue('จังหวัดเดิม');
  expect(screen.getByLabelText('อำเภอ — ลำดับ 8')).toHaveValue('อำเภอเดิม');
  expect(screen.getByLabelText('จังหวัด — ลำดับ 8')).toBeDisabled();
  fireEvent.click(button('ลองใหม่'));
  await waitFor(() => expect(screen.getByLabelText('จังหวัด — ลำดับ 8')).toBeEnabled());
  expect(screen.getByLabelText('จังหวัด — ลำดับ 8')).toHaveValue('จังหวัดเดิม');
  expect(screen.getByLabelText('อำเภอ — ลำดับ 8')).toHaveValue('อำเภอเดิม');
  expect(change).not.toHaveBeenCalled();
});

test('read-only detail shows saved checks without applying defaults and cannot change any row', () => {
  const change = jest.fn();
  render(<PsQuoteAttachmentTable disabled value={JSON.stringify({ '1': { selected: true, documents: { other: true } }, '8': { selected: true, province: 'สงขลา' } })} onChange={change} />);
  expect(button('เลือกลำดับ 1 อะไหล่แท้ มือ 1')).toBeDisabled();
  expect(button('ใบประเมิน — ลำดับ 1 อะไหล่แท้ มือ 1')).toHaveAttribute('aria-pressed', 'false');
  expect(button('อื่น ๆ — ลำดับ 1 อะไหล่แท้ มือ 1')).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByLabelText('จังหวัด — ลำดับ 8')).toHaveValue('สงขลา');
  expect(screen.getByLabelText('จังหวัด — ลำดับ 8')).toBeDisabled();
  fireEvent.click(button('เลือกลำดับ 1 อะไหล่แท้ มือ 1'));
  expect(change).not.toHaveBeenCalled();
});

test('ต้องเลือกลำดับก่อน และลำดับ 1 ใช้ default ที่กำหนด', () => {
  render(<Wrapper />);

  const estimate = button('ใบประเมิน — ลำดับ 1 อะไหล่แท้ มือ 1');
  expect(estimate).toBeDisabled();
  expect(estimate).toHaveAttribute('aria-pressed', 'false');

  fireEvent.click(button('เลือกลำดับ 1 อะไหล่แท้ มือ 1'));

  expect(estimate).toBeEnabled();
  expect(estimate).toHaveAttribute('aria-pressed', 'true');
  expect(button('Part Book(รูปอะไหล่+ตำแหน่งที่ใส่) — ลำดับ 1 อะไหล่แท้ มือ 1'))
    .toHaveAttribute('aria-pressed', 'true');
  expect(button('รูปภาพประกอบ — ลำดับ 1 อะไหล่แท้ มือ 1')).toHaveAttribute('aria-pressed', 'true');
  expect(button('อะไหล่ตัวอย่าง — ลำดับ 1 อะไหล่แท้ มือ 1')).toHaveAttribute('aria-pressed', 'false');
});

test('ยกเลิกการเลือกล้างค่าทั้งแถว และเลือกใหม่กลับมาใช้ default', () => {
  render(<Wrapper />);

  const select = button('เลือกลำดับ 1 อะไหล่แท้ มือ 1');
  const sample = button('อะไหล่ตัวอย่าง — ลำดับ 1 อะไหล่แท้ มือ 1');
  fireEvent.click(select);
  fireEvent.click(sample);
  expect(sample).toHaveAttribute('aria-pressed', 'true');

  fireEvent.click(select);
  expect(sample).toBeDisabled();
  expect(sample).toHaveAttribute('aria-pressed', 'false');

  fireEvent.click(select);
  expect(sample).toBeEnabled();
  expect(sample).toHaveAttribute('aria-pressed', 'false');
});

test('ลำดับ 5 เปิดมาพร้อมใบประเมิน Part Book และอะไหล่ตัวอย่าง', () => {
  render(<Wrapper />);

  fireEvent.click(button('เลือกลำดับ 5 อะไหล่สั่งทำ'));

  expect(button('ใบประเมิน — ลำดับ 5 อะไหล่สั่งทำ')).toHaveAttribute('aria-pressed', 'true');
  expect(button('Part Book(รูปอะไหล่+ตำแหน่งที่ใส่) — ลำดับ 5 อะไหล่สั่งทำ'))
    .toHaveAttribute('aria-pressed', 'true');
  expect(button('อะไหล่ตัวอย่าง — ลำดับ 5 อะไหล่สั่งทำ')).toHaveAttribute('aria-pressed', 'true');
  expect(button('รูปภาพประกอบ — ลำดับ 5 อะไหล่สั่งทำ')).toHaveAttribute('aria-pressed', 'false');
});

test('ลำดับ 7 มีเฉพาะช่องใบประเมินและไม่มี checkbox เอกสารอื่น', () => {
  render(<Wrapper />);

  fireEvent.click(button('เลือกลำดับ 7 ค่าแรงในการซ่อมในบริษัท'));

  expect(button('ใบประเมิน — ลำดับ 7 ค่าแรงในการซ่อมในบริษัท')).toHaveAttribute('aria-pressed', 'true');
  expect(screen.queryByRole('button', {
    name: 'Part Book(รูปอะไหล่+ตำแหน่งที่ใส่) — ลำดับ 7 ค่าแรงในการซ่อมในบริษัท',
  })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', {
    name: 'อื่น ๆ — ลำดับ 7 ค่าแรงในการซ่อมในบริษัท',
  })).not.toBeInTheDocument();
});
