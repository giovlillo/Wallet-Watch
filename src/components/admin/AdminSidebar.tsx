"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ListChecks, ShieldAlert, CircleDollarSign, FileText, LogOut, Settings, SearchCode, Shield, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logout } from '@/lib/actions/authActions';
import LogoIcon from '@/components/icons/LogoIcon';
import { useSidebar, SidebarTrigger } from '@/components/ui/sidebar';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: Home },
  { href: '/admin/submissions', label: 'Submissions', icon: ListChecks },
  { href: '/admin/categories', label: 'Categories', icon: ShieldAlert },
  { href: '/admin/cryptocurrencies', label: 'Cryptocurrencies', icon: CircleDollarSign },
  { href: '/admin/export', label: 'Export Data', icon: FileText },
  { href: '/admin/security', label: 'Security', icon: Shield },
  { href: '/admin/api-info', label: 'API Info', icon: SearchCode },
  { href: '/admin/account', label: 'Account Settings', icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();

  return (
    <div className="flex flex-col h-full">
      <nav className="grid items-start px-2 text-sm font-medium lg:px-4 py-4">
        <SidebarTrigger className={`flex items-center gap-3 rounded-lg py-2 text-muted-foreground transition-all hover:text-primary mb-4 ${state === 'collapsed' ? 'justify-center px-2' : 'px-3'}`} />
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg py-2 text-muted-foreground transition-all hover:text-primary ${
              (pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href))) ? 'bg-muted text-primary' : ''
            } ${state === 'collapsed' ? 'justify-center px-2' : 'px-3'}`}
          >
            <item.icon className="h-4 w-4" />
            <span className={`${state === 'collapsed' ? 'hidden' : 'block'}`}>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="mt-auto p-4">
        <Button 
          onClick={logout} 
          size="sm" 
          className={`w-full ${state === 'collapsed' ? 'justify-center' : ''}`}
        >
          <LogOut className={`${state === 'collapsed' ? '' : 'mr-2'} h-4 w-4`} />
          <span className={`${state === 'collapsed' ? 'hidden' : 'block'}`}>Logout</span>
        </Button>
      </div>
    </div>
  );
}
