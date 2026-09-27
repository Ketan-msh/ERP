'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useImpersonation } from '@/components/providers';
import { hasPermission } from '@/lib/permissions';
import {
  LayoutDashboard,
  Calendar,
  Users2,
  Kanban,
  CheckSquare,
  Receipt,
  ShieldAlert,
  FileBarChart,
  ChevronLeft,
  ChevronRight,
  Zap,
  Building2,
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { effectivePermissions, effectiveRoleName } = useImpersonation();

  const navItems = [
    {
      label: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      module: 'dashboard',
    },
    {
      label: 'Planning & Calendar',
      href: '/planning',
      icon: Calendar,
      module: 'calendar',
    },
    {
      label: 'Clients & Accounts',
      href: '/clients',
      icon: Building2,
      module: 'clients',
    },
    {
      label: 'Content Tracker',
      href: '/tracker',
      icon: Kanban,
      module: 'tracker',
    },
    {
      label: 'Tasks & Urgency',
      href: '/tasks',
      icon: CheckSquare,
      module: 'tasks',
    },
    {
      label: 'Billing & Invoices',
      href: '/billing',
      icon: Receipt,
      module: 'billing',
    },
    {
      label: 'User & Role Access',
      href: '/users',
      icon: ShieldAlert,
      module: 'users',
    },
    {
      label: 'Reports & Analytics',
      href: '/reports',
      icon: FileBarChart,
      module: 'reports',
    },
  ];

  return (
    <aside
      className={`relative flex flex-col border-r border-border bg-card transition-all duration-300 z-30 select-none ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        {!collapsed ? (
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF3B00] text-white font-black text-sm tracking-tighter group-hover:scale-105 transition-transform shadow-xs">
              TB
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold tracking-tight text-sm text-foreground flex items-center gap-1">
                TREXOBYTE <span className="text-[10px] uppercase bg-[#FF3B00]/10 text-[#FF3B00] font-mono px-1 rounded">ERP</span>
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">KATHMANDU HQ</span>
            </div>
          </Link>
        ) : (
          <Link href="/" className="mx-auto">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FF3B00] text-white font-black text-base shadow-xs">
              TB
            </div>
          </Link>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Role Badge Indicator */}
      {!collapsed && (
        <div className="mx-3 mt-3 px-3 py-2 rounded-md bg-secondary/60 border border-border/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-[#FF3B00]" />
            <span className="text-xs font-semibold tracking-tight text-foreground truncate max-w-[140px]">
              {effectiveRoleName}
            </span>
          </div>
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      )}

      {/* Navigation Items */}
      <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
        {navItems.map((item) => {
          const isAllowed = hasPermission(effectivePermissions, item.module as any, 'view');
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

          if (!isAllowed) return null;

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-[#FF3B00] text-white font-bold shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              } ${collapsed ? 'justify-center px-0' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-foreground/80'}`} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      {!collapsed && (
        <div className="border-t border-border p-3">
          <div className="rounded-lg bg-muted/40 p-2.5 text-[11px] font-mono text-muted-foreground flex flex-col gap-1 border border-border/40">
            <div className="flex justify-between items-center">
              <span>Agency Team:</span>
              <span className="font-bold text-foreground">15+ Active</span>
            </div>
            <div className="flex justify-between items-center">
              <span>System Status:</span>
              <span className="text-emerald-500 font-semibold">Online (Kathmandu)</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
