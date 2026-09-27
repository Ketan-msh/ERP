'use client';

import React, { useState, useEffect } from 'react';
import { useImpersonation } from '@/components/providers';
import {
  CheckSquare,
  Kanban,
  List,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Plus,
  Filter,
  User,
  Sparkles,
  Link as LinkIcon,
  X,
} from 'lucide-react';

export default function TasksPage() {
  const { openQuickAdd, refreshTrigger, triggerRefresh } = useImpersonation();
  const [viewMode, setViewMode] = useState<'urgency' | 'kanban'>('urgency');
  const [tasks, setTasks] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [selectedUrgency, setSelectedUrgency] = useState('');

  // Complete modal prompt state (for tasks linked to ContentItems)
  const [promptContentItem, setPromptContentItem] = useState<any | null>(null);

  // Listen to Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && promptContentItem) {
        setPromptContentItem(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [promptContentItem]);

  const fetchTasks = () => {
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
    if (selectedAssignee) params.append('assigneeId', selectedAssignee);
    if (selectedUrgency) params.append('urgency', selectedUrgency);

    fetch(`/api/tasks?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setTasks(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch tasks:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTasks();
  }, [selectedClient, selectedAssignee, selectedUrgency, refreshTrigger]);

  const toggleTaskDone = async (task: any, updateContentStatus?: string) => {
    const nextStatus = task.status === 'DONE' ? 'TO_DO' : 'DONE';
    try {
      const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: task.id,
          status: nextStatus,
          updateContentStatus,
        }),
      });

      if (res.ok) {
        setPromptContentItem(null);
        fetchTasks();
        triggerRefresh();
      }
    } catch (e) {
      console.error('Toggle task status failed:', e);
    }
  };

  const handleCheckboxClick = (task: any) => {
    if (task.status !== 'DONE' && task.contentItem) {
      setPromptContentItem(task);
    } else {
      toggleTaskDone(task);
    }
  };

  const currentDate = new Date('2026-09-27T23:59:59Z');

  const urgencyGroups = [
    { key: 'URGENT', label: '🔴 Urgent Priority', color: '#FF3B00', badgeClass: 'bg-[#FF3B00] text-white' },
    { key: 'HIGH', label: '🟠 High Priority', color: '#F59E0B', badgeClass: 'bg-amber-500 text-white' },
    { key: 'MEDIUM', label: '🟡 Medium Priority', color: '#EAB308', badgeClass: 'bg-yellow-500 text-white' },
    { key: 'LOW', label: '⚪ Low Priority', color: '#64748B', badgeClass: 'bg-slate-600 text-white' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            TASKS & URGENCY STREAM <CheckSquare className="h-5 w-5 text-[#FF3B00]" />
          </h1>
          <p className="text-xs text-muted-foreground font-mono">
            Fast Quick-Complete Checklist & Cross-Module Deliverable Linkage
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg border border-border">
            <button
              onClick={() => setViewMode('urgency')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                viewMode === 'urgency'
                  ? 'bg-[#FF3B00] text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <List className="h-4 w-4" /> Urgency Groups
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                viewMode === 'kanban'
                  ? 'bg-[#FF3B00] text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Kanban className="h-4 w-4" /> Kanban View
            </button>
          </div>

          <button
            onClick={() => openQuickAdd('task')}
            className="flex items-center gap-1.5 rounded-md bg-[#FF3B00] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#e03400] transition-all clicky-btn"
          >
            <Plus className="h-4 w-4 stroke-[3]" /> Add Task
          </button>
        </div>
      </div>

      {/* Filter Bar */}
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
          value={selectedAssignee}
          onChange={(e) => setSelectedAssignee(e.target.value)}
          className="rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium outline-hidden focus:border-[#FF3B00]"
        >
          <option value="">All Assignees</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>

      {/* VIEW A: URGENCY GROUPS VIEW */}
      {viewMode === 'urgency' && (
        <div className="space-y-6">
          {urgencyGroups.map((group) => {
            const groupTasks = tasks.filter((t) => t.urgency === group.key);
            if (groupTasks.length === 0) return null;

            return (
              <div key={group.key} className="rounded-xl border border-border bg-card p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <span className="font-extrabold text-sm tracking-tight text-foreground flex items-center gap-2">
                    {group.label}
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {groupTasks.length} Tasks
                    </span>
                  </span>
                </div>

                <div className="space-y-2">
                  {groupTasks.map((task) => {
                    const isOverdue = task.status !== 'DONE' && new Date(task.dueDate) < currentDate;

                    return (
                      <div
                        key={task.id}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                          isOverdue
                            ? 'border-rose-500/80 bg-rose-500/10 shadow-xs'
                            : task.status === 'DONE'
                            ? 'border-border bg-muted/20 opacity-60'
                            : 'border-border bg-background hover:border-[#FF3B00]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Quick Complete Checkbox */}
                          <input
                            type="checkbox"
                            checked={task.status === 'DONE'}
                            onChange={() => handleCheckboxClick(task)}
                            className="h-4 w-4 rounded border-input text-[#FF3B00] focus:ring-[#FF3B00] cursor-pointer"
                          />

                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-bold text-xs ${
                                  task.status === 'DONE' ? 'line-through text-muted-foreground' : 'text-foreground'
                                }`}
                              >
                                {task.title}
                              </span>

                              {isOverdue && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-rose-500 text-white">
                                  Overdue
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-[11px] font-mono text-muted-foreground mt-0.5">
                              {task.client && (
                                <span className="flex items-center gap-1 font-semibold text-foreground">
                                  <span
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: task.client.color }}
                                  />
                                  {task.client.name}
                                </span>
                              )}
                              {task.contentItem && (
                                <span className="text-[#FF3B00] flex items-center gap-1">
                                  <LinkIcon className="h-3 w-3" /> Linked to {task.contentItem.type}
                                </span>
                              )}
                              <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        {task.assignee && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-foreground">{task.assignee.name}</span>
                            <img
                              src={
                                task.assignee.avatar ||
                                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                              }
                              className="h-6 w-6 rounded-full object-cover border border-border"
                              alt="Avatar"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW B: KANBAN VIEW */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { key: 'TO_DO', label: 'To Do', color: '#64748B' },
            { key: 'IN_PROGRESS', label: 'In Progress', color: '#3B82F6' },
            { key: 'DONE', label: 'Completed', color: '#10B981' },
          ].map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.key);

            return (
              <div key={col.key} className="flex flex-col rounded-xl border border-border bg-card p-4 min-h-[500px]">
                <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
                  <span className="font-extrabold text-sm tracking-tight text-foreground flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: col.color }} />
                    {col.label}
                  </span>
                  <span className="text-xs font-mono font-bold bg-muted px-2 py-0.5 rounded text-muted-foreground">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1">
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="rounded-lg border border-border bg-background p-3.5 shadow-xs space-y-2 hover:border-[#FF3B00] transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                            task.urgency === 'URGENT' ? 'bg-[#FF3B00] text-white' : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {task.urgency}
                        </span>
                        <input
                          type="checkbox"
                          checked={task.status === 'DONE'}
                          onChange={() => handleCheckboxClick(task)}
                          className="h-4 w-4 rounded border-input text-[#FF3B00] cursor-pointer"
                        />
                      </div>

                      <h4 className="font-bold text-xs text-foreground">{task.title}</h4>

                      {task.client && (
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: task.client.color }} />
                          <span>{task.client.name}</span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                        <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
                        <span>{task.assignee?.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CONTENT ITEM STATUS PROMPT MODAL ON TASK COMPLETE */}
      {promptContentItem && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setPromptContentItem(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200"
        >
          <div className="w-full max-w-md bg-card border-2 border-border shadow-2xl rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#FF3B00]" /> Linked Deliverable Found!
              </h3>
              <button
                onClick={() => setPromptContentItem(null)}
                className="p-1 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                title="Close (Esc)"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              This task is linked to <strong className="text-foreground">"{promptContentItem.contentItem?.title}"</strong>.
              Would you like to update its content status now?
            </p>

            <div className="space-y-2">
              <button
                onClick={() => toggleTaskDone(promptContentItem, 'EDITED')}
                className="w-full py-2 px-3 text-xs font-bold rounded bg-purple-600 text-white hover:bg-purple-700 text-left transition-colors"
              >
                Mark Task Done & Update Content Status to EDITED
              </button>
              <button
                onClick={() => toggleTaskDone(promptContentItem, 'CLIENT_APPROVAL')}
                className="w-full py-2 px-3 text-xs font-bold rounded bg-amber-500 text-white hover:bg-amber-600 text-left transition-colors"
              >
                Mark Task Done & Move Content to CLIENT APPROVAL
              </button>
              <button
                onClick={() => toggleTaskDone(promptContentItem)}
                className="w-full py-2 px-3 text-xs font-semibold rounded bg-muted hover:bg-muted/80 text-foreground text-left transition-colors"
              >
                Just Mark Task Done (Keep Content Status Same)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
