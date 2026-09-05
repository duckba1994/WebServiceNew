import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IconSearch, IconBell, IconLogout, IconMoon, IconSun, IconLayoutSidebarLeftCollapse, IconLayoutSidebarLeftExpand } from '@tabler/icons-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../hooks/useTheme';

interface TopbarProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

// อักษรย่อจากชื่อ เช่น "สมชาย ใจดี" → "สจ"
// ข้ามสระหน้าภาษาไทย (เ แ โ ใ ไ) เพื่อให้ได้พยัญชนะต้นจริง
export function initialsOf(name?: string) {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.replace(/^[เแโใไ]+/, '')[0] ?? w[0])
    .join('');
}

export function Topbar({ title, subtitle, action, isSidebarOpen, onToggleSidebar }: TopbarProps) {
  const { user, logout } = useAuth();
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="flex h-[70px] shrink-0 items-center gap-4 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-6">
      {/* <button
        onClick={onToggleSidebar}
        className="rounded-lg p-2 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800"
        aria-label={isSidebarOpen ? 'ซ่อนแถบด้านข้าง' : 'แสดงแถบด้านข้าง'}
      >
        <IconMelon size={20} />
      </button> */}

      <button 
        onClick={onToggleSidebar} 
        className="rounded-lg p-2 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800" 
        aria-label={isSidebarOpen ? 'ซ่อนแถบด้านข้าง' : 'แสดงแถบด้านข้าง'} 
      >
        {isSidebarOpen ? <IconLayoutSidebarLeftCollapse  size={20} /> : <IconLayoutSidebarLeftExpand  size={20} />}
      </button>

      <div className="min-w-0">
        <h1 className="truncate text-[17px] font-bold leading-tight text-gray-800 dark:text-slate-100">{title}</h1>
        {subtitle && <div className="truncate text-xs text-gray-400 dark:text-slate-500">{subtitle}</div>}
      </div>

      <div className="ml-auto hidden w-[340px] max-w-[38vw] items-center gap-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 px-3.5 py-2 transition focus-within:border-accent focus-within:bg-white dark:focus-within:bg-slate-900 md:flex">
        <IconSearch size={18} className="shrink-0 text-gray-400 dark:text-slate-500" />
        <input
          type="text"
          placeholder="ค้นหาเมนู หรือเลขที่ใบงาน..."
          className="min-w-0 flex-1 bg-transparent text-sm text-gray-800 dark:text-slate-100 outline-none placeholder:text-gray-400 dark:placeholder:text-slate-500"
        />
        <span className="rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-1.5 py-0.5 text-[11px] text-gray-400 dark:text-slate-500">
          Ctrl K
        </span>
      </div>

      <div className="flex items-center gap-3 md:ml-0 ml-auto">
        <button
          onClick={toggle}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-300 hover:border-gray-300 dark:hover:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-800"
          title={isDark ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด'}
          aria-label={isDark ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด'}
        >
          {isDark ? <IconSun size={20} /> : <IconMoon size={20} />}
        </button>
        <button
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-300 hover:border-gray-300 dark:hover:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-800"
          aria-label="การแจ้งเตือน"
        >
          <IconBell size={20} />
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full border-2 border-white dark:border-slate-900 bg-red-500 px-0.5 text-[10px] font-bold text-white">
            3
          </span>
        </button>
        {action}
        <div className="flex items-center gap-3 border-l border-gray-200 dark:border-slate-700 pl-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-[#134a8e] text-sm font-bold text-white">
            {initialsOf(user?.name)}
          </div>
          <div className="hidden text-right sm:block">
            <div className="text-sm font-semibold leading-tight text-gray-800 dark:text-slate-100">{user?.name}</div>
            <div className="text-xs text-gray-400 dark:text-slate-500">
              {user?.department ? `แผนก ${user.department}` : user?.email}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg p-2 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800"
            aria-label="ออกจากระบบ"
          >
            <IconLogout size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
