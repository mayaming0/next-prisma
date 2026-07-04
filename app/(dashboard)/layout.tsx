'use client';

import { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import MobileHeader from '@/components/layout/MobileHeader';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="app-shell">
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <main className="main-content">
        <MobileHeader onMenuClick={toggleSidebar} />
        <div className="page-view">{children}</div>
      </main>
    </div>
  );
}
