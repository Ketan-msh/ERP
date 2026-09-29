'use client';

import React, { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useImpersonation, useTheme } from '@/components/providers';
import {
  Search,
  Sun,
  Moon,
  Plus,
  LogOut,
  UserCheck,
  ChevronDown,
  Sparkles,
  ShieldAlert,
  History,
} from 'lucide-react';
import { AuditHistoryModal } from '@/components/audit-history-modal';

export function Header() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const {
    openQuickAdd,
    effectiveRoleName,
    impersonatedRoleName,
    setImpersonatedRole,
  } = useImpersonation();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const rolesList = [
    'Super Admin',
    'Manager',
    'Social Media Manager',
    'Content/Shoot Manager',
    'Ads Manager',
    'Client Communication',
    'Billing/Finance',
    'Viewer',
  ];

  const user = session?.user as any;
  const isSuperAdmin = user?.roleName === 'Super Admin' || true; // Allow testing impersonation

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-border bg-card/90 backdrop-blur-md px-6">
      {/* Global Search Bar */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search content, clients, tasks, invoices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowSearchModal(true)}
            className="w-full rounded-md border border-input bg-background pl-9 pr-4 py-1.5 text-xs focus:border-[#FF3B00] focus:ring-1 focus:ring-[#FF3B00] outline-hidden transition-all"
          />
        </div>
      </div>

      {/* Right Action Bar */}
      <div className="flex items-center gap-3">
        {/* Role Impersonator Selector */}
        {isSuperAdmin && (
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold border transition-all ${
                impersonatedRoleName
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400'
                  : 'bg-muted/50 border-border text-foreground hover:bg-muted'
              }`}
              title="Preview App as different Role"
            >
              <ShieldAlert className="h-3.5 w-3.5 text-[#FF3B00]" />
              <span className="hidden md:inline text-[11px] font-mono">
                {impersonatedRoleName ? `Preview: ${impersonatedRoleName}` : `Role: ${effectiveRoleName}`}
              </span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-card shadow-xl py-1 z-50 text-xs animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-border font-bold text-muted-foreground flex justify-between items-center">
                  <span>Impersonate Role View</span>
                  {impersonatedRoleName && (
                    <button
                      onClick={() => {
                        setImpersonatedRole(null);
                        setShowRoleMenu(false);
                      }}
                      className="text-[10px] text-[#FF3B00] hover:underline"
                    >
                      Reset
                    </button>
                  )}
                </div>
                {rolesList.map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setImpersonatedRole(r === user?.roleName ? null : r);
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-muted transition-colors ${
                      effectiveRoleName === r ? 'font-bold text-[#FF3B00] bg-[#FF3B00]/10' : 'text-foreground'
                    }`}
                  >
                    <span>{r}</span>
                    {effectiveRoleName === r && <UserCheck className="h-3.5 w-3.5 text-[#FF3B00]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Changes Made / Audit History Button */}
        <button
          onClick={() => setShowHistoryModal(true)}
          className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted hover:border-[#FF3B00]/40 transition-all"
          title="View Edit History & Changes Made (Google Docs style Undo)"
        >
          <History className="h-4 w-4 text-[#FF3B00]" />
          <span className="hidden md:inline">Changes Made</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="rounded-md border border-border bg-background p-2 text-foreground hover:bg-muted transition-colors"
          title="Toggle Light/Dark Theme"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
        </button>

        {/* Header "+ Quick Add" Trigger */}
        <button
          onClick={() => openQuickAdd('content')}
          className="flex items-center gap-1.5 rounded-md bg-[#FF3B00] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#e03400] transition-all clicky-btn shadow-xs"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span className="hidden sm:inline">Add</span>
        </button>

        {/* User Avatar Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 rounded-full border border-border p-0.5 hover:ring-2 hover:ring-[#FF3B00]/50 transition-all"
          >
            <img
              src={
                user?.avatar ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
              }
              alt={user?.name || 'User'}
              className="h-8 w-8 rounded-full object-cover"
            />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-52 rounded-lg border border-border bg-card shadow-xl py-2 z-50 text-xs animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 border-b border-border">
                <p className="font-bold text-foreground">{user?.name || 'Ketan Shrestha'}</p>
                <p className="text-[11px] text-muted-foreground truncate">{user?.email || 'ketan@trexobyte.com'}</p>
                <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-[#FF3B00]/10 text-[#FF3B00] font-mono text-[10px] font-semibold">
                  {effectiveRoleName}
                </span>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full text-left px-3 py-2 text-rose-500 hover:bg-rose-500/10 flex items-center gap-2 transition-colors font-medium mt-1"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>

        {/* Audit History & Rollback Modal */}
        <AuditHistoryModal
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
        />
      </div>
    </header>
  );
}
