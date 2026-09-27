'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { SessionProvider, useSession } from 'next-auth/react';
import { parsePermissions, PermissionsMap } from '@/lib/permissions';

interface ImpersonationContextType {
  isImpersonating: boolean;
  impersonatedRoleName: string | null;
  effectiveRoleName: string;
  effectivePermissions: PermissionsMap;
  setImpersonatedRole: (roleName: string | null) => void;
  quickAddOpen: boolean;
  setQuickAddOpen: (open: boolean) => void;
  quickAddType: 'content' | 'task' | 'shoot';
  openQuickAdd: (type?: 'content' | 'task' | 'shoot') => void;
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const ImpersonationContext = createContext<ImpersonationContextType>({
  isImpersonating: false,
  impersonatedRoleName: null,
  effectiveRoleName: 'Super Admin',
  effectivePermissions: {},
  setImpersonatedRole: () => {},
  quickAddOpen: false,
  setQuickAddOpen: () => {},
  quickAddType: 'content',
  openQuickAdd: () => {},
  refreshTrigger: 0,
  triggerRefresh: () => {},
});

export function useImpersonation() {
  return useContext(ImpersonationContext);
}

const ROLE_PERMISSIONS_PRESETS: Record<string, PermissionsMap> = {
  'Super Admin': {
    dashboard: 'full',
    calendar: 'full',
    clients: 'full',
    tracker: 'full',
    tasks: 'full',
    billing: 'full',
    reports: 'full',
    users: 'full',
  },
  Manager: {
    dashboard: 'full',
    calendar: 'full',
    clients: 'edit',
    tracker: 'full',
    tasks: 'full',
    billing: 'view',
    reports: 'full',
    users: 'view',
  },
  'Social Media Manager': {
    dashboard: 'view',
    calendar: 'edit',
    clients: 'view',
    tracker: 'edit',
    tasks: 'edit',
    billing: 'none',
    reports: 'view',
    users: 'none',
  },
  'Content/Shoot Manager': {
    dashboard: 'view',
    calendar: 'full',
    clients: 'view',
    tracker: 'full',
    tasks: 'full',
    billing: 'none',
    reports: 'view',
    users: 'none',
  },
  'Ads Manager': {
    dashboard: 'view',
    calendar: 'edit',
    clients: 'view',
    tracker: 'edit',
    tasks: 'edit',
    billing: 'none',
    reports: 'view',
    users: 'none',
  },
  'Client Communication': {
    dashboard: 'view',
    calendar: 'view',
    clients: 'edit',
    tracker: 'edit',
    tasks: 'edit',
    billing: 'none',
    reports: 'view',
    users: 'none',
  },
  'Billing/Finance': {
    dashboard: 'view',
    calendar: 'view',
    clients: 'view',
    tracker: 'view',
    tasks: 'view',
    billing: 'full',
    reports: 'full',
    users: 'none',
  },
  Viewer: {
    dashboard: 'view',
    calendar: 'view',
    clients: 'view',
    tracker: 'view',
    tasks: 'view',
    billing: 'none',
    reports: 'none',
    users: 'none',
  },
};

function AppStateBridge({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [impersonatedRoleName, setImpersonatedRoleName] = useState<string | null>(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState<'content' | 'task' | 'shoot'>('content');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => setRefreshTrigger((prev) => prev + 1);

  const userRole = (session?.user as any)?.roleName || 'Super Admin';
  const rawPerms = (session?.user as any)?.permissions;

  const actualPermissions = parsePermissions(rawPerms);

  const effectiveRoleName = impersonatedRoleName || userRole;
  const effectivePermissions = impersonatedRoleName
    ? ROLE_PERMISSIONS_PRESETS[impersonatedRoleName] || actualPermissions
    : actualPermissions;

  const openQuickAdd = (type: 'content' | 'task' | 'shoot' = 'content') => {
    setQuickAddType(type);
    setQuickAddOpen(true);
  };

  return (
    <ImpersonationContext.Provider
      value={{
        isImpersonating: Boolean(impersonatedRoleName),
        impersonatedRoleName,
        effectiveRoleName,
        effectivePermissions,
        setImpersonatedRole: setImpersonatedRoleName,
        quickAddOpen,
        setQuickAddOpen,
        quickAddType,
        openQuickAdd,
        refreshTrigger,
        triggerRefresh,
      }}
    >
      {children}
    </ImpersonationContext.Provider>
  );
}

interface ThemeContextType {
  theme: string;
  setTheme: (theme: string) => void;
  resolvedTheme: string;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  setTheme: () => {},
  resolvedTheme: 'dark',
});

export function useTheme() {
  return useContext(ThemeContext);
}

function CustomThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<string>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'dark';
    setThemeState(saved);
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const setTheme = (newTheme: string) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme: theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider basePath="/api/auth">
      <CustomThemeProvider>
        <AppStateBridge>{children}</AppStateBridge>
      </CustomThemeProvider>
    </SessionProvider>
  );
}
