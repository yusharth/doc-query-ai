"use client";

import React from "react";
import { useState } from "react";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { TopNavbar } from "@/components/top-navbar";

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar isOpen={sidebarOpen} onOpenChange={setSidebarOpen} />
      <div className="flex flex-1 flex-col">
        <TopNavbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="md:hidden">
            {React.cloneElement(children as React.ReactElement, {
              // @ts-ignore
              onMenuClick: () => setSidebarOpen(true),
            })}
          </div>
          <div className="hidden md:block">{children}</div>
        </main>
      </div>
    </div>
  );
}
