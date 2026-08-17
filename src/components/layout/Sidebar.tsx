import React from 'react';
import { NavLink } from 'react-router-dom';
import { IconFileText, IconLayoutDashboard } from '@tabler/icons-react';
import { COMPANY, MENU_GROUPS, SYSTEM_MENU, MenuItem } from '../../data/menuData';

interface SidebarProps {
  isOpen: boolean;
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 pb-1 pt-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
      {children}
    </div>
  );
}

// เมนูใบงาน — เป็นลิงก์เมื่อมีหน้าจริง (item.to) นอกนั้นเป็นปุ่ม placeholder
function MenuButton({ item, iconClass }: { item: MenuItem; iconClass: string }) {
  const Icon = item.icon;
  const baseClass =
    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition';
  const content = (
    <>
      <Icon size={17} className={`shrink-0 ${iconClass}`} />
      <span className="truncate">{item.label}</span>
    </>
  );

  if (item.to) {
    return (
      <NavLink
        to={item.to}
        className={({ isActive }) =>
          `${baseClass} ${
            isActive
              ? 'bg-accent/20 text-white'
              : 'text-slate-300 hover:bg-[#161f30] hover:text-white'
          }`
        }
      >
        {content}
      </NavLink>
    );
  }
  return (
    <button
      type="button"
      className={`${baseClass} text-slate-300 hover:bg-[#161f30] hover:text-white`}
    >
      {content}
    </button>
  );
}

export function Sidebar({ isOpen }: SidebarProps) {
  return (
    <aside
      className={`flex shrink-0 flex-col overflow-hidden bg-[#0b1220] transition-all duration-200 ${
        isOpen ? 'w-64' : 'w-0'
      }`}
    >
      <div className="flex items-center gap-3 px-5 pb-4 pt-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent shadow-lg">
          <IconFileText size={24} className="text-white" />
        </div>
        <div className="leading-tight">
          <div className="whitespace-nowrap text-[15px] font-bold tracking-wide text-white">
            {COMPANY.nameEn}
          </div>
          <div className="whitespace-nowrap text-[10px] font-semibold tracking-[0.15em] text-slate-500">
            {COMPANY.taglineEn}
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-5">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
              isActive
                ? 'bg-accent/20 text-white'
                : 'text-slate-300 hover:bg-[#161f30] hover:text-white'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-full bg-accent" />
              )}
              <IconLayoutDashboard size={18} className="shrink-0 text-blue-400" />
              ภาพรวม
            </>
          )}
        </NavLink>

        {MENU_GROUPS.map((group) => (
          <div key={group.key}>
            <GroupLabel>{group.label}</GroupLabel>
            {group.items.map((item) => (
              <MenuButton key={item.label} item={item} iconClass={group.sidebarIconClass} />
            ))}
          </div>
        ))}

        <GroupLabel>ระบบ</GroupLabel>
        {SYSTEM_MENU.map((item) => (
          <MenuButton key={item.label} item={item} iconClass="text-slate-400" />
        ))}
      </nav>
    </aside>
  );
}
