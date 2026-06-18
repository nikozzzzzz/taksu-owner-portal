'use client';

import { useState } from 'react';
import { PortalSidebar } from '@/components/layout/portal-sidebar';
import { PortalHeader } from '@/components/layout/portal-header';
import { IdleTimer } from '@/components/auth/idle-timer';

interface PortalLayoutClientProps {
  ownerName: string;
  villaName?: string;
  children: React.ReactNode;
}

export function PortalLayoutClient({
  ownerName,
  villaName,
  children,
}: PortalLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-taksu-cream">
      {/* Idle timeout — 60 minutes */}
      <IdleTimer />

      {/* Desktop Sidebar */}
      <div className="hidden w-64 shrink-0 lg:flex lg:flex-col">
        <PortalSidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 w-72">
            <PortalSidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <PortalHeader
          ownerName={ownerName}
          villaName={villaName}
          onMenuToggle={() => setSidebarOpen(true)}
        />

        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
