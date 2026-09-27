'use client';

import React, { useState, useEffect } from 'react';
import { useImpersonation } from '@/components/providers';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  Kanban,
  Table as TableIcon,
  Filter,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MessageSquare,
  Sparkles,
  User,
  Plus,
} from 'lucide-react';

export default function ContentTrackerPage() {
  const { openQuickAdd, refreshTrigger, triggerRefresh } = useImpersonation();
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [contentItems, setContentItems] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [approvalFilter, setApprovalFilter] = useState('');

  // Drag & drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const fetchTrackerData = () => {
    setLoading(true);
    fetch('/api/clients')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setClients(data);
      })
      .catch((err) => console.error('Failed to fetch clients:', err));

    fetch('/api/users')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setUsers(data);
      })
      .catch((err) => console.error('Failed to fetch users:', err));

    const params = new URLSearchParams();
    if (selectedClient) params.append('clientId', selectedClient);
    if (selectedType) params.append('type', selectedType);
    if (selectedStatus) params.append('status', selectedStatus);

    fetch(`/api/content?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setContentItems(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch content:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTrackerData();
  }, [selectedClient, selectedType, selectedStatus, refreshTrigger]);

  const columns = [
    { id: 'PLANNED', label: '1. Planned', color: '#64748B' },
    { id: 'SHOT', label: '2. Shot', color: '#3B82F6' },
    { id: 'EDITED', label: '3. Edited', color: '#8B5CF6' },
    { id: 'CLIENT_APPROVAL', label: '4. Client Approval', color: '#F59E0B' },
    { id: 'SCHEDULED', label: '5. Scheduled', color: '#06B6D4' },
    { id: 'PUBLISHED', label: '6. Published', color: '#10B981' },
  ];

  const updateItemStatus = async (id: string, newStatus: string, approvalOutcome?: string) => {
    try {
      const res = await fetch('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus, approvalOutcome }),
      });
      if (res.ok) {
        fetchTrackerData();
        triggerRefresh();
      }
    } catch (e) {
      console.error('Update status failed:', e);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const itemId = active.id as string;
    const newStatus = over.id as string;

    if (columns.some((c) => c.id === newStatus)) {
      updateItemStatus(itemId, newStatus);
    }
  };

  const exportCSV = () => {
    const headers = ['Title', 'Client', 'Type', 'Platform', 'Scheduled Date', 'Status', 'Approval Outcome', 'Assignee'];
    const rows = contentItems.map((item) => [
      `"${item.title.replace(/"/g, '""')}"`,
      `"${item.client?.name || ''}"`,
      item.type,
      item.platform,
      new Date(item.scheduledDate).toLocaleDateString(),
      item.status,
      item.approvalOutcome || 'None',
      `"${item.assignee?.name || 'Unassigned'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TrexoByte_Content_Tracker_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            CONTENT TRACKER <Kanban className="h-5 w-5 text-[#FF3B00]" />
          </h1>
          <p className="text-xs text-muted-foreground font-mono">
            Pipeline Kanban Board & Comprehensive Deliverable Data Matrix
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg border border-border">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                viewMode === 'kanban'
                  ? 'bg-[#FF3B00] text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Kanban className="h-4 w-4" /> Kanban Board
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                viewMode === 'table'
                  ? 'bg-[#FF3B00] text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <TableIcon className="h-4 w-4" /> Table View
            </button>
          </div>

          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 rounded-md border border-input bg-card px-3 py-2 text-xs font-bold hover:bg-muted transition-colors"
          >
            <Download className="h-4 w-4 text-[#FF3B00]" /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-card p-3 rounded-xl border border-border">
        <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
          <Filter className="h-3.5 w-3.5 text-[#FF3B00]" /> Filter:
        </div>

        <select
          value={selectedClient}
          onChange={(e) => setSelectedClient(e.target.value)}
          className="rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium outline-hidden focus:border-[#FF3B00]"
        >
          <option value="">All Clients</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium outline-hidden focus:border-[#FF3B00]"
        >
          <option value="">All Formats</option>
          <option value="REEL">Reel</option>
          <option value="SHOOT">Shoot Day</option>
          <option value="CAROUSEL">Carousel</option>
          <option value="STATIC_POST">Static Post</option>
          <option value="AD_CREATIVE">Ad Creative</option>
        </select>
      </div>

      {/* KANBAN VIEW */}
      {viewMode === 'kanban' && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
            {columns.map((col) => {
              const colItems = contentItems.filter((i) => i.status === col.id);
              return (
                <div
                  key={col.id}
                  id={col.id}
                  className="flex flex-col rounded-xl border border-border bg-card/60 p-3 min-h-[500px]"
                >
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-border">
                    <span className="font-extrabold text-xs tracking-tight text-foreground flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: col.color }} />
                      {col.label}
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-muted px-2 py-0.5 rounded text-muted-foreground">
                      {colItems.length}
                    </span>
                  </div>

                  <div className="space-y-3 flex-1">
                    {colItems.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg border border-border bg-card p-3 shadow-xs hover:border-[#FF3B00] transition-all cursor-grab active:cursor-grabbing space-y-2 group"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className="px-2 py-0.5 rounded text-[9px] font-black text-white uppercase"
                            style={{ backgroundColor: item.client?.color || '#FF3B00' }}
                          >
                            {item.client?.name}
                          </span>
                          <span className="text-[9px] font-mono text-muted-foreground uppercase">{item.type}</span>
                        </div>

                        <h4 className="font-bold text-xs text-foreground group-hover:text-[#FF3B00] transition-colors">
                          {item.title}
                        </h4>

                        {/* Approval Outcome Badge */}
                        {item.approvalOutcome && (
                          <div className="flex items-center gap-1 text-[10px] font-bold">
                            {item.approvalOutcome === 'APPROVED' && (
                              <span className="text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Approved
                              </span>
                            )}
                            {item.approvalOutcome === 'REVISION_REQUESTED' && (
                              <span className="text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" /> Revision
                              </span>
                            )}
                          </div>
                        )}

                        {item.clientFeedbackNotes && (
                          <p className="text-[10px] text-muted-foreground bg-muted p-1.5 rounded italic line-clamp-2">
                            "{item.clientFeedbackNotes}"
                          </p>
                        )}

                        {/* Card Footer */}
                        <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                          <span>{new Date(item.scheduledDate).toLocaleDateString()}</span>
                          {item.assignee && (
                            <span className="font-semibold text-foreground">{item.assignee.name.split(' ')[0]}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </DndContext>
      )}

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted text-muted-foreground uppercase text-[10px] font-mono border-b border-border">
              <tr>
                <th className="p-3">Client</th>
                <th className="p-3">Format</th>
                <th className="p-3">Title</th>
                <th className="p-3">Platform</th>
                <th className="p-3">Scheduled Date</th>
                <th className="p-3">Status</th>
                <th className="p-3">Approval Outcome</th>
                <th className="p-3">Assignee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {contentItems.map((item) => (
                <tr key={item.id} className="hover:bg-muted/30">
                  <td className="p-3">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase inline-block"
                      style={{ backgroundColor: item.client?.color || '#FF3B00' }}
                    >
                      {item.client?.name}
                    </span>
                  </td>
                  <td className="p-3 font-mono font-bold text-foreground">{item.type}</td>
                  <td className="p-3 font-bold text-foreground">{item.title}</td>
                  <td className="p-3 font-mono text-muted-foreground">{item.platform}</td>
                  <td className="p-3 font-mono">{new Date(item.scheduledDate).toLocaleDateString()}</td>
                  <td className="p-3">
                    <select
                      value={item.status}
                      onChange={(e) => updateItemStatus(item.id, e.target.value)}
                      className="rounded border border-input bg-background px-2 py-1 text-xs font-bold text-[#FF3B00] outline-hidden"
                    >
                      {columns.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3">
                    <select
                      value={item.approvalOutcome || ''}
                      onChange={(e) => updateItemStatus(item.id, item.status, e.target.value)}
                      className="rounded border border-input bg-background px-2 py-1 text-xs font-semibold outline-hidden"
                    >
                      <option value="">Pending / None</option>
                      <option value="APPROVED">APPROVED</option>
                      <option value="REVISION_REQUESTED">REVISION REQUESTED</option>
                      <option value="DECLINED">DECLINED</option>
                    </select>
                  </td>
                  <td className="p-3 font-medium text-foreground">{item.assignee?.name || 'Unassigned'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
