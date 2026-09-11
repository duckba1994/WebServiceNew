import React, { useState } from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { PsQuoteAttachmentTable } from './PsQuoteAttachmentTable';

const Wrapper = () => {
  const [value, setValue] = useState('');
  return <PsQuoteAttachmentTable value={value} onChange={setValue} />;
};

const button = (name: string) => screen.getByRole('button', { name });

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
