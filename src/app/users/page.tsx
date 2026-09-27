'use client';

import React, { useState, useEffect } from 'react';
import { useImpersonation } from '@/components/providers';
import {
  ShieldAlert,
  Users2,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Key,
  Shield,
  Sparkles,
  Lock,
  X,
} from 'lucide-react';

export default function UsersPage() {
  const { effectivePermissions, refreshTrigger, triggerRefresh } = useImpersonation();
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs: Users List vs Role Builder Matrix
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');

  // Search/Filter
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  // Add User Modal
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('password123');
  const [userDepartment, setUserDepartment] = useState('Social Media');
  const [userRoleId, setUserRoleId] = useState('');
  const [userAssignedClients, setUserAssignedClients] = useState<string[]>([]);
  const [submittingUser, setSubmittingUser] = useState(false);

  // Role Builder State
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [permissionsMatrix, setPermissionsMatrix] = useState<any>({
    dashboard: 'view',
    calendar: 'edit',
    clients: 'view',
    tracker: 'edit',
    tasks: 'edit',
    billing: 'none',
    reports: 'view',
    users: 'none',
  });

  // Listen to Escape key to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showAddUserModal) setShowAddUserModal(false);
        if (showRoleModal) setShowRoleModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddUserModal, showRoleModal]);

  const isSuperAdmin = true; // Route protection check

  const fetchUsersAndRoles = () => {
    setLoading(true);
    fetch('/api/users')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setUsers(data);
      })
      .catch((err) => console.error('Failed to fetch users:', err));

    fetch('/api/roles')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setRoles(data);
          if (data.length > 0 && !userRoleId) setUserRoleId(data[0].id);
        }
      })
      .catch((err) => console.error('Failed to fetch roles:', err));

    fetch('/api/clients')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setClients(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch clients:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUsersAndRoles();
  }, [refreshTrigger]);

  // ESC key listener for modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showAddUserModal) setShowAddUserModal(false);
        if (showRoleModal) setShowRoleModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddUserModal, showRoleModal]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !userEmail) return;
    setSubmittingUser(true);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userName,
          email: userEmail,
          password: userPassword,
          department: userDepartment,
          roleId: userRoleId,
          assignedClientIds: userAssignedClients,
        }),
      });

      if (res.ok) {
        setShowAddUserModal(false);
        setUserName('');
        setUserEmail('');
        fetchUsersAndRoles();
        triggerRefresh();
      }
    } catch (e) {
      console.error('Create user error:', e);
    } finally {
      setSubmittingUser(false);
    }
  };

  const handleCreateCustomRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName) return;

    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: roleName,
          permissions: permissionsMatrix,
          isCustom: true,
        }),
      });

      if (res.ok) {
        setShowRoleModal(false);
        setRoleName('');
        fetchUsersAndRoles();
        triggerRefresh();
      }
    } catch (e) {
      console.error('Create role error:', e);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchesDept = !departmentFilter || u.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  const modulesList = [
    { key: 'dashboard', label: 'Main Dashboard' },
    { key: 'calendar', label: 'Planning & Calendar' },
    { key: 'clients', label: 'Clients & Accounts' },
    { key: 'tracker', label: 'Content Tracker' },
    { key: 'tasks', label: 'Tasks Stream' },
    { key: 'billing', label: 'Billing & Invoices' },
    { key: 'reports', label: 'Reports & Analytics' },
    { key: 'users', label: 'User & Role Access' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Mode Switch */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            USER & ROLE MANAGEMENT <ShieldAlert className="h-5 w-5 text-[#FF3B00]" />
          </h1>
          <p className="text-xs text-muted-foreground font-mono">
            Granular Module Permission Matrix & Department Access Control
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg border border-border">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === 'users'
                  ? 'bg-[#FF3B00] text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users2 className="h-4 w-4" /> Team Users ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === 'roles'
                  ? 'bg-[#FF3B00] text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Shield className="h-4 w-4" /> Role Permission Builder
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-card p-3 rounded-xl border border-border">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search user name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-md border border-input bg-background pl-9 pr-4 py-1.5 text-xs outline-hidden focus:border-[#FF3B00]"
              />
            </div>

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium outline-hidden focus:border-[#FF3B00]"
            >
              <option value="">All Departments</option>
              <option value="Management">Management</option>
              <option value="Social Media">Social Media</option>
              <option value="Content Production">Content Production</option>
              <option value="Ads">Ads</option>
              <option value="Client Servicing">Client Servicing</option>
              <option value="Billing">Billing</option>
            </select>

            <button
              onClick={() => setShowAddUserModal(true)}
              className="flex items-center gap-1.5 rounded-md bg-[#FF3B00] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#e03400] clicky-btn"
            >
              <Plus className="h-4 w-4 stroke-[3]" /> Add User
            </button>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted text-muted-foreground uppercase text-[10px] font-mono border-b border-border">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Assigned Role</th>
                  <th className="p-3">Assigned Clients</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Date Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/30">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            u.avatar ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                          }
                          alt={u.name}
                          className="h-8 w-8 rounded-full object-cover border border-border"
                        />
                        <div>
                          <span className="font-bold text-foreground block">{u.name}</span>
                          <span className="text-[10px] font-mono text-muted-foreground">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="font-mono px-2 py-0.5 rounded bg-muted font-semibold text-foreground">
                        {u.department}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-[#FF3B00]">{u.role?.name || 'Viewer'}</td>
                    <td className="p-3 font-mono text-muted-foreground">
                      {u.assignedClients?.length > 0 ? (
                        <span className="flex flex-wrap gap-1">
                          {u.assignedClients.map((a: any) => (
                            <span
                              key={a.client?.id}
                              className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white"
                              style={{ backgroundColor: a.client?.color || '#FF3B00' }}
                            >
                              {a.client?.name.slice(0, 10)}
                            </span>
                          ))}
                        </span>
                      ) : (
                        <span>All / Global</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.active
                            ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-500'
                        }`}
                      >
                        {u.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-muted-foreground">
                      {new Date(u.dateJoined).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ROLE BUILDER MATRIX */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border">
            <div>
              <h2 className="font-extrabold text-sm tracking-tight text-foreground">
                CUSTOM ROLE & PERMISSION MATRIX
              </h2>
              <p className="text-xs text-muted-foreground font-mono">
                Define exact access levels (None, View, Edit, Full) for each ERP module.
              </p>
            </div>
            <button
              onClick={() => setShowRoleModal(true)}
              className="flex items-center gap-1.5 rounded-md bg-[#FF3B00] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#e03400] clicky-btn"
            >
              <Plus className="h-4 w-4 stroke-[3]" /> Build Custom Role
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {roles.map((role) => {
              let perms: any = {};
              try {
                perms = JSON.parse(role.permissions);
              } catch (e) {}

              return (
                <div
                  key={role.id}
                  className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-3 hover:border-[#FF3B00] transition-all"
                >
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                      <Shield className="h-4 w-4 text-[#FF3B00]" /> {role.name}
                    </h3>
                    {role.isCustom && (
                      <span className="text-[10px] font-mono bg-[#FF3B00]/10 text-[#FF3B00] px-2 py-0.5 rounded font-bold">
                        CUSTOM
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs">
                    {modulesList.map((m) => {
                      const level = perms[m.key] || 'none';
                      return (
                        <div key={m.key} className="flex justify-between items-center font-mono">
                          <span className="text-muted-foreground">{m.label}:</span>
                          <span
                            className={`font-bold uppercase text-[10px] px-1.5 py-0.5 rounded ${
                              level === 'full'
                                ? 'bg-emerald-500/15 text-emerald-500'
                                : level === 'edit'
                                ? 'bg-amber-500/15 text-amber-500'
                                : level === 'view'
                                ? 'bg-blue-500/15 text-blue-500'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {level}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ADD USER MODAL */}
      {showAddUserModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddUserModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200"
        >
          <div className="w-full max-w-md bg-card border-2 border-border shadow-2xl rounded-xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h2 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                <Users2 className="h-4 w-4 text-[#FF3B00]" /> Add TrexoByte Team Member
              </h2>
              <button onClick={() => setShowAddUserModal(false)} className="p-1 rounded text-muted-foreground hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Suman Tamang"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-[#FF3B00] outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="suman@trexobyte.com"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-[#FF3B00] outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Department
                  </label>
                  <select
                    value={userDepartment}
                    onChange={(e) => setUserDepartment(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-[#FF3B00] outline-hidden"
                  >
                    <option value="Social Media">Social Media</option>
                    <option value="Content Production">Content Production</option>
                    <option value="Ads">Ads Manager</option>
                    <option value="Client Servicing">Client Servicing</option>
                    <option value="Management">Management</option>
                    <option value="Billing">Billing</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Assigned Role
                  </label>
                  <select
                    value={userRoleId}
                    onChange={(e) => setUserRoleId(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-[#FF3B00] outline-hidden"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 font-semibold rounded-md border border-input hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingUser}
                  className="px-5 py-2 font-bold rounded-md bg-[#FF3B00] text-white hover:bg-[#e03400] clicky-btn"
                >
                  {submittingUser ? 'Adding...' : 'Add Team Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ROLE BUILDER MODAL */}
      {showRoleModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowRoleModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200"
        >
          <div className="w-full max-w-lg bg-card border-2 border-border shadow-2xl rounded-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h2 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#FF3B00]" /> Build Custom Role Permission Matrix
              </h2>
              <button onClick={() => setShowRoleModal(false)} className="p-1 rounded text-muted-foreground hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomRole} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Custom Role Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lead Motion Graphic Designer"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-[#FF3B00] outline-hidden font-bold"
                />
              </div>

              <div className="space-y-3 border border-border p-3 rounded-lg bg-muted/20">
                <span className="block font-bold text-foreground">Per-Module Access Matrix:</span>
                {modulesList.map((m) => (
                  <div key={m.key} className="flex justify-between items-center">
                    <span className="font-semibold text-muted-foreground">{m.label}</span>
                    <select
                      value={permissionsMatrix[m.key] || 'none'}
                      onChange={(e) =>
                        setPermissionsMatrix({
                          ...permissionsMatrix,
                          [m.key]: e.target.value,
                        })
                      }
                      className="rounded border border-input bg-background px-2 py-1 text-xs outline-hidden focus:border-[#FF3B00]"
                    >
                      <option value="none">None</option>
                      <option value="view">View Only</option>
                      <option value="edit">Edit Access</option>
                      <option value="full">Full Admin</option>
                    </select>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="px-4 py-2 font-semibold rounded-md border border-input hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold rounded-md bg-[#FF3B00] text-white hover:bg-[#e03400] clicky-btn"
                >
                  Save Custom Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
