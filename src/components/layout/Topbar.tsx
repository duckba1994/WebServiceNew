import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IconSearch, IconBell, IconMenu2, IconLogout,IconLayoutSidebarLeftCollapse ,IconLayoutSidebarLeftExpand  } from '@tabler/icons-react';
import { useAuth } from '../../context/AuthContext';

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
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="flex h-[70px] shrink-0 items-center gap-4 border-b border-gray-200 bg-white px-6">
      {/* <button
        onClick={onToggleSidebar}
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
        aria-label={isSidebarOpen ? 'ซ่อนแถบด้านข้าง' : 'แสดงแถบด้านข้าง'}
      >
        <IconMelon size={20} />
      </button> */}

      <button 
        onClick={onToggleSidebar} 
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100" 
        aria-label={isSidebarOpen ? 'ซ่อนแถบด้านข้าง' : 'แสดงแถบด้านข้าง'} 
      >
        {isSidebarOpen ? <IconLayoutSidebarLeftCollapse  size={20} /> : <IconLayoutSidebarLeftExpand  size={20} />}
      </button>

      <div className="min-w-0">
        <h1 className="truncate text-[17px] font-bold leading-tight text-gray-800">{title}</h1>
        {subtitle && <div className="truncate text-xs text-gray-400">{subtitle}</div>}
      </div>

      <div className="ml-auto hidden w-[340px] max-w-[38vw] items-center gap-2.5 rounded-xl border border-gray-200 bg-gray-100 px-3.5 py-2 transition focus-within:border-accent focus-within:bg-white md:flex">
        <IconSearch size={18} className="shrink-0 text-gray-400" />
        <input
          type="text"
          placeholder="ค้นหาเมนู หรือเลขที่ใบงาน..."
          className="min-w-0 flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
        />
        <span className="rounded-md border border-gray-200 bg-white px-1.5 py-0.5 text-[11px] text-gray-400">
          Ctrl K
        </span>
      </div>

      <div className="flex items-center gap-3 md:ml-0 ml-auto">
        <button
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
          aria-label="การแจ้งเตือน"
        >
          <IconBell size={20} />
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full border-2 border-white bg-red-500 px-0.5 text-[10px] font-bold text-white">
            3
          </span>
        </button>
        {action}
        <div className="flex items-center gap-3 border-l border-gray-200 pl-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-[#134a8e] text-sm font-bold text-white">
            {initialsOf(user?.name)}
          </div>
          <div className="hidden text-right sm:block">
            <div className="text-sm font-semibold leading-tight text-gray-800">{user?.name}</div>
            <div className="text-xs text-gray-400">
              {user?.department ? `แผนก ${user.department}` : user?.email}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            aria-label="ออกจากระบบ"
          >
            <IconLogout size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
