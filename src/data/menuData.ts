import type { ComponentType } from 'react';
import {
  IconSend,
  IconInbox,
  IconFilePlus,
  IconCalendarEvent,
  IconPhone,
  IconDatabase,
  IconShieldLock,
  IconHelp,
} from '@tabler/icons-react';

// ── ข้อมูลระบบ — ใช้ใน Sidebar และแบนเนอร์หน้าหลัก ─────────────
export const COMPANY = {
  nameEn: 'ระบบใบรับเรื่อง',
  taglineEn: 'REQUEST INTAKE',
  nameTh: 'ระบบใบรับเรื่อง',
  systemName: 'ระบบใบรับเรื่อง',
};

// ── โครงสร้างเมนู — ใช้ร่วมกันทั้ง Sidebar และหน้าเมนูหลัก ────
export type MenuIcon = ComponentType<{ size?: number | string; className?: string }>;

export interface MenuTag {
  label: string;
  variant: 'solid' | 'outline';
}

export interface MenuItem {
  label: string;
  icon: MenuIcon;
  // ยังไม่มีหน้าจริง (placeholder) — เติม to เมื่อสร้างหน้าแล้ว
  to?: string;
  tags?: MenuTag[];
}

export interface MenuGroup {
  key: 'INTAKE' | 'SERVICE';
  label: string;
  // สีประจำหมวดโทน corporate (ดู Design System ใน CLAUDE.md)
  color: string;
  // สีไอคอนแบบอ่อน สำหรับพื้น sidebar โทนเข้ม
  sidebarIconClass: string;
  items: MenuItem[];
}

export const MENU_GROUPS: MenuGroup[] = [
  {
    key: 'INTAKE',
    label: 'ใบรับเรื่อง',
    color: '#1a5fb4',
    sidebarIconClass: 'text-blue-400',
    items: [
      { label: 'สร้างใบแจ้งเรื่อง', icon: IconFilePlus, to: '/create' },
      { label: 'เรื่องที่แจ้งออกไป', icon: IconSend, to: '/my' },
      { label: 'เรื่องที่แจ้งเข้ามา', icon: IconInbox, to: '/inbox' },
    ],
  },
  {
    key: 'SERVICE',
    label: 'บริการทั่วไป',
    color: '#2d7d46',
    sidebarIconClass: 'text-emerald-400',
    items: [
      {
        label: 'จองห้องประชุม',
        icon: IconCalendarEvent,
        tags: [{ label: 'เร็วๆนี้', variant: 'outline' }],
      },
      {
        label: 'เบอร์โทรศัพท์โต๊ะ',
        icon: IconPhone,
        tags: [{ label: 'เร็วๆนี้', variant: 'outline' }],
      },
    ],
  },
];

// เมนูหมวด "ระบบ" — แสดงเฉพาะใน Sidebar
export const SYSTEM_MENU: MenuItem[] = [
  { label: 'Master Data', icon: IconDatabase },
  { label: 'Administrator', icon: IconShieldLock },
  { label: 'Help', icon: IconHelp },
];
