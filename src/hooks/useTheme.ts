import { useCallback, useEffect, useState } from 'react';

// ── โหมดสีของแอป (สว่าง / มืด) ────────────────────────────────
// สลับด้วยคลาส .dark ที่ <html> (tailwind.config.js ตั้ง darkMode: 'class')
//
// เก็บ 3 ค่า: 'light' / 'dark' / 'system'
//   system = ตามเครื่อง และต้อง "ตามต่อเนื่อง" ด้วย — ผู้ใช้สลับธีมของ Windows
//   ระหว่างเปิดแอปค้างไว้ หน้าเว็บต้องเปลี่ยนตาม ไม่ใช่ค้างค่าที่อ่านตอนเปิด
//
// เขียนคลาสตั้งแต่ก่อน React mount ด้วย (ดู applyTheme ที่ index.tsx เรียก)
// ไม่งั้นจะเห็นจอขาวแวบนึงก่อนเปลี่ยนเป็นมืด

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'app_theme';

const prefersDark = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

export const readThemeMode = (): ThemeMode => {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
  } catch {
    return 'system'; // โหมดส่วนตัว/บล็อก storage — ไม่ควรทำให้แอปพัง
  }
};

export const isDarkMode = (mode: ThemeMode): boolean =>
  mode === 'dark' || (mode === 'system' && prefersDark());

// ใส่/ถอดคลาสที่ <html> + บอกเบราว์เซอร์ให้ระบายสี scrollbar/ฟอร์มตามธีม
export const applyTheme = (mode: ThemeMode): void => {
  const root = document.documentElement;
  const dark = isDarkMode(mode);
  root.classList.toggle('dark', dark);
  root.style.colorScheme = dark ? 'dark' : 'light';
};

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(readThemeMode);

  useEffect(() => {
    applyTheme(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // เขียนไม่ได้ก็ปล่อย — ธีมยังใช้ได้ในรอบนี้ แค่ไม่ถูกจำไว้
    }
  }, [mode]);

  // โหมด system: ตามเครื่องแบบต่อเนื่อง
  useEffect(() => {
    if (mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [mode]);

  // ปุ่มเดียวสลับไปมา — จาก 'system' ให้ไปอยู่ตรงข้ามกับที่เห็นอยู่ตอนนั้น
  const toggle = useCallback(() => {
    setMode((cur) => (isDarkMode(cur) ? 'light' : 'dark'));
  }, []);

  return { mode, setMode, toggle, isDark: isDarkMode(mode) };
}
