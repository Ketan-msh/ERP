'use client';

import React, { useState, useEffect } from 'react';
import { useImpersonation } from '@/components/providers';
import {
  Building2,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  MessageSquare,
  Users,
  Receipt,
  Sparkles,
  ChevronRight,
  Send,
  X,
} from 'lucide-react';

export default function ClientsPage() {
  const { effectiveRoleName, refreshTrigger, triggerRefresh } = useImpersonation();
  const isSuperAdmin = effectiveRoleName === 'Super Admin';
  const [clients, setClients] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Add Client Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#FF3B00');
  const [servicePackage, setServicePackage] = useState('Social & Growth');
  const [packageTier, setPackageTier] = useState('Standard');
  const [status, setStatus] = useState('ACTIVE');
  const [monthlyRetainer, setMonthlyRetainer] = useState('100000');
  const [billingCycleDay, setBillingCycleDay] = useState('1');
  const [assignedUserIds, setAssignedUserIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Detail Client Drawer/Modal
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'billing' | 'comms'>('content');
  const [commNote, setCommNote] = useState('');
  // Listen to Escape key to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showAddModal) setShowAddModal(false);
        if (selectedClient) setSelectedClient(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddModal, selectedClient]);

  const fetchClients = () => {
    setLoading(true);
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

    fetch('/api/users')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setUsers(data);
      })
      .catch((err) => console.error('Failed to fetch users:', err));
  };

  useEffect(() => {
    fetchClients();
  }, [refreshTrigger]);

  // ESC key listener for modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showAddModal) setShowAddModal(false);
        if (selectedClient) setSelectedClient(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddModal, selectedClient]);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          color,
          servicePackage,
          packageTier,
          status,
          monthlyRetainer,
          billingCycleDay,
          assignedUserIds,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setName('');
        fetchClients();
        triggerRefresh();
      }
    } catch (err) {
      console.error('Create client failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenClientDetails = async (client: any) => {
    try {
      const res = await fetch(`/api/clients/${client.id}`);
      const detailed = await res.json();
      setSelectedClient(detailed);
    } catch (e) {
      setSelectedClient(client);
    }
  };

  const filteredClients = clients.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            CLIENT ACCOUNTS <Building2 className="h-5 w-5 text-[#FF3B00]" />
          </h1>
          <p className="text-xs text-muted-foreground font-mono">
            Active Retainers, Assigned Team Leads, Comms Log & Account Performance
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 rounded-md bg-[#FF3B00] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#e03400] transition-all clicky-btn"
        >
          <Plus className="h-4 w-4 stroke-[3]" /> Add Client Account
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-card p-3 rounded-xl border border-border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by client name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-input bg-background pl-9 pr-4 py-1.5 text-xs outline-hidden focus:border-[#FF3B00]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium outline-hidden focus:border-[#FF3B00]"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active Clients</option>
          <option value="PROSPECT">Prospects</option>
          <option value="PAUSED">Paused</option>
          <option value="CHURNED">Churned</option>
        </select>
      </div>

      {/* Client Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs font-mono text-muted-foreground">Loading Client Roster...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              onClick={() => handleOpenClientDetails(client)}
              className="rounded-xl border border-border bg-card p-5 shadow-xs hover:border-[#FF3B00] transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center font-black text-white text-base shadow-sm group-hover:scale-105 transition-transform"
                      style={{ backgroundColor: client.color }}
                    >
                      {client.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-foreground line-clamp-1 group-hover:text-[#FF3B00] transition-colors">
                        {client.name}
                      </h3>
                      <span className="text-[10px] font-mono text-muted-foreground">{client.servicePackage}</span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                      client.status === 'ACTIVE'
                        ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                        : client.status === 'PROSPECT'
                        ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                        : 'bg-zinc-700/20 text-zinc-400'
                    }`}
                  >
                    {client.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 my-4 p-2.5 rounded-lg bg-muted/40 border border-border/50 text-xs font-mono">
                  <div>
                    <span className="text-muted-foreground text-[10px] block">Retainer (NPR):</span>
                    <span className="font-bold text-foreground">
                      {isSuperAdmin ? `NPR ${client.monthlyRetainer.toLocaleString()}` : '••••••'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10px] block">Package Tier:</span>
                    <span className="font-bold text-[#FF3B00]">{client.packageTier}</span>
                  </div>
                </div>

                {/* Assigned Team Avatars */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                  <span className="font-mono text-[11px]">Assigned Team:</span>
                  <div className="flex -space-x-2">
                    {client.assignedTeam?.map((ast: any, i: number) => (
                      <img
                        key={i}
                        src={
                          ast.user?.avatar ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                        }
                        title={ast.user?.name}
                        alt="Avatar"
                        className="h-6 w-6 rounded-full border-2 border-card object-cover"
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs font-mono text-[#FF3B00] font-bold">
                <span>View Full Account Profile</span>
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE CLIENT MODAL */}
      {showAddModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200"
        >
          <div className="w-full max-w-lg bg-card border-2 border-border shadow-2xl rounded-xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h2 className="font-extrabold text-base tracking-tight text-foreground flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[#FF3B00]" /> Add New Client Account
              </h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded text-muted-foreground hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Client Business Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shangri-La Hotel Kathmandu"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-[#FF3B00] outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Brand Accent Hex Color
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="h-8 w-12 rounded border border-input p-0 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-full rounded border border-input bg-background px-2 py-1 text-xs font-mono uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Package Tier
                  </label>
                  <select
                    value={packageTier}
                    onChange={(e) => setPackageTier(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-[#FF3B00] outline-hidden"
                  >
                    <option value="Basic">Basic</option>
                    <option value="Standard">Standard</option>
                    <option value="Premium">Premium</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Monthly Retainer (NPR)
                  </label>
                  <input
                    type="number"
                    value={monthlyRetainer}
                    onChange={(e) => setMonthlyRetainer(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-[#FF3B00] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Billing Cycle Day
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={billingCycleDay}
                    onChange={(e) => setBillingCycleDay(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-[#FF3B00] outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Assign Team Members
                </label>
                <div className="grid grid-cols-2 gap-2 border border-border p-2 rounded-md max-h-32 overflow-y-auto">
                  {users.map((u) => (
                    <label key={u.id} className="flex items-center gap-2 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={assignedUserIds.includes(u.id)}
                        onChange={(e) => {
                          if (e.target.checked) setAssignedUserIds([...assignedUserIds, u.id]);
                          else setAssignedUserIds(assignedUserIds.filter((id) => id !== u.id));
                        }}
                        className="rounded border-input text-[#FF3B00] focus:ring-[#FF3B00]"
                      />
                      <span>{u.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 font-semibold rounded-md border border-input hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 font-bold rounded-md bg-[#FF3B00] text-white hover:bg-[#e03400] clicky-btn"
                >
                  {submitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLIENT PROFILE DRAWER / MODAL */}
      {selectedClient && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedClient(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200"
        >
          <div className="w-full max-w-3xl bg-card border-2 border-border shadow-2xl rounded-xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-border pb-4">
              <div className="flex items-center gap-4">
                <div
                  className="h-12 w-12 rounded-xl flex items-center justify-center font-black text-white text-xl shadow-md"
                  style={{ backgroundColor: selectedClient.color }}
                >
                  {selectedClient.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-black text-foreground">{selectedClient.name}</h2>
                  <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mt-0.5">
                    <span>{selectedClient.servicePackage}</span>
                    <span>•</span>
                    <span className="font-bold text-[#FF3B00]">
                      {isSuperAdmin ? `NPR ${selectedClient.monthlyRetainer?.toLocaleString()}/mo` : '••••••'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedClient(null)}
                className="p-1 rounded text-muted-foreground hover:bg-muted"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Profile Navigation Tabs */}
            <div className="flex border-b border-border gap-2">
              <button
                onClick={() => setActiveTab('content')}
                className={`pb-2 px-3 text-xs font-bold transition-all border-b-2 ${
                  activeTab === 'content'
                    ? 'border-[#FF3B00] text-[#FF3B00]'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Content History ({selectedClient.contentItems?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('billing')}
                className={`pb-2 px-3 text-xs font-bold transition-all border-b-2 ${
                  activeTab === 'billing'
                    ? 'border-[#FF3B00] text-[#FF3B00]'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Billing History ({selectedClient.invoices?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('comms')}
                className={`pb-2 px-3 text-xs font-bold transition-all border-b-2 ${
                  activeTab === 'comms'
                    ? 'border-[#FF3B00] text-[#FF3B00]'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Feedback & WhatsApp Log
              </button>
            </div>

            {/* TAB 1: Content History */}
            {activeTab === 'content' && (
              <div className="space-y-3">
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {selectedClient.contentItems?.map((item: any) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg border border-border bg-muted/20 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-foreground block">{item.title}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {item.type} • {item.platform} • Scheduled {new Date(item.scheduledDate).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FF3B00]/10 text-[#FF3B00]">
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: Billing History */}
            {activeTab === 'billing' && (
              <div className="space-y-3">
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {selectedClient.invoices?.map((inv: any) => (
                    <div
                      key={inv.id}
                      className="p-3 rounded-lg border border-border bg-muted/20 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-foreground block">{inv.invoiceNumber}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          Period: {inv.billingPeriod} • Amount: NPR {inv.amount.toLocaleString()}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-500/15 text-emerald-500'
                            : inv.status === 'OVERDUE'
                            ? 'bg-rose-500/15 text-rose-500'
                            : 'bg-amber-500/15 text-amber-500'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: Verbal / WhatsApp Feedback Log */}
            {activeTab === 'comms' && (
              <div className="space-y-4">
                <div className="p-3 rounded-lg border border-border bg-muted/30">
                  <h4 className="font-bold text-xs text-foreground mb-2 flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4 text-[#FF3B00]" /> Log Client Feedback (Verbal / WhatsApp)
                  </h4>
                  <textarea
                    rows={3}
                    placeholder="Record feedback received from client GM or social team over WhatsApp call..."
                    value={commNote}
                    onChange={(e) => setCommNote(e.target.value)}
                    className="w-full rounded border border-input bg-background p-2 text-xs outline-hidden focus:border-[#FF3B00]"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => {
                        if (!commNote) return;
                        setCommNote('');
                        alert('Feedback note logged to Client Log!');
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded bg-[#FF3B00] text-white font-bold text-xs"
                    >
                      <Send className="h-3.5 w-3.5" /> Log Feedback
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
