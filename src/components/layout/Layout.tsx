import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface LayoutProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

// ครอบ Sidebar + Topbar + <main> — ใช้ทุกหน้าหลัง login
export function Layout({ title, subtitle, action, children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          title={title}
          subtitle={subtitle}
          action={action}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((o) => !o)}
        />
        <main className="flex-1 overflow-auto bg-[#eef1f6] dark:bg-slate-950 p-6">{children}</main>
      </div>
    </div>
  );
}
