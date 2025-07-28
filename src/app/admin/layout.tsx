"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import ActualAdminSidebar from '@/components/admin/AdminSidebar';
import { SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, Bell } from 'lucide-react';
import LogoIcon from '@/components/icons/LogoIcon';

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { state } = useSidebar();

  return (
    <div 
      className={`grid min-h-screen w-full transition-all duration-300 ease-in-out ${
        state === 'collapsed' 
          ? 'md:grid-cols-[50px_1fr]' 
          : 'md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]'
      }`}
    >
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/admin/dashboard" className="flex items-center gap-2 font-semibold text-primary">
              <LogoIcon className="h-6 w-6" />
              <span className={`${state === 'collapsed' ? 'hidden' : 'block'}`}>Wallet Watch Admin</span>
            </Link>
          </div>
          <div className="flex-1 overflow-auto">
            <ActualAdminSidebar />
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 md:hidden">
          <SidebarTrigger className="flex items-center justify-center w-8 h-8 rounded-full bg-background hover:bg-muted transition-colors">
            <Menu className="h-4 w-4" />
          </SidebarTrigger>
          <div className="w-full flex-1" />
          <Button variant="outline" size="icon" className="h-8 w-8">
            <Bell className="h-4 w-4" />
            <span className="sr-only">Toggle notifications</span>
          </Button>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/20">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // The middleware handles authentication. Here, we just decide which layout to show.
  // The login page should not have the admin sidebar.
  if (pathname === '/admin/login') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        {children}
      </div>
    );
  }

  // All other admin pages get the full layout.
  return (
    <SidebarProvider defaultOpen>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </SidebarProvider>
  );
}
