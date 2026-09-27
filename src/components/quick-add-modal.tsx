'use client';

import React, { useState, useEffect } from 'react';
import { useImpersonation } from '@/components/providers';
import { X, Calendar, CheckSquare, Camera, Sparkles } from 'lucide-react';

export function QuickAddModal() {
  const { quickAddOpen, setQuickAddOpen, quickAddType, triggerRefresh } = useImpersonation();
  const [activeTab, setActiveTab] = useState<'content' | 'task' | 'shoot'>('content');
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Content form
  const [clientId, setClientId] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState('REEL');
  const [platform, setPlatform] = useState('INSTAGRAM');
  const [scheduledDate, setScheduledDate] = useState('2026-09-28');
  const [assigneeId, setAssigneeId] = useState('');
  const [description, setDescription] = useState('');

  // Task form
  const [taskTitle, setTaskTitle] = useState('');
  const [taskUrgency, setTaskUrgency] = useState('HIGH');
  const [taskDueDate, setTaskDueDate] = useState('2026-09-28');
  const [taskClientId, setTaskClientId] = useState('');
  const [taskAssigneeId, setTaskAssigneeId] = useState('');

  useEffect(() => {
    if (quickAddType) {
      setActiveTab(quickAddType);
    }
  }, [quickAddType]);

  useEffect(() => {
    if (quickAddOpen) {
      fetch('/api/clients')
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (Array.isArray(data)) {
            setClients(data);
            if (data.length > 0 && !clientId) setClientId(data[0].id);
          }
        })
        .catch((err) => console.error('Failed to fetch clients:', err));

      fetch('/api/users')
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (Array.isArray(data)) setUsers(data);
        })
        .catch((err) => console.error('Failed to fetch users:', err));
    }
  }, [quickAddOpen]);

  // ESC Key Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && quickAddOpen) {
        setQuickAddOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [quickAddOpen, setQuickAddOpen]);

  if (!quickAddOpen) return null;

  const handleSubmitContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !clientId) return;
    setLoading(true);

    try {
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          type: activeTab === 'shoot' ? 'SHOOT' : type,
          title,
          description,
          platform,
          scheduledDate: new Date(scheduledDate).toISOString(),
          status: 'PLANNED',
          assigneeId: assigneeId || null,
        }),
      });

      if (res.ok) {
        setQuickAddOpen(false);
        setTitle('');
        setDescription('');
        triggerRefresh();
      }
    } catch (err) {
      console.error('Quick add content error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle) return;
    setLoading(true);

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskTitle,
          urgency: taskUrgency,
          dueDate: new Date(taskDueDate).toISOString(),
          clientId: taskClientId || null,
          assigneeId: taskAssigneeId || null,
          status: 'TO_DO',
        }),
      });

      if (res.ok) {
        setQuickAddOpen(false);
        setTaskTitle('');
        triggerRefresh();
      }
    } catch (err) {
      console.error('Quick add task error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) setQuickAddOpen(false);
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-xl bg-card border-2 border-border shadow-2xl rounded-xl overflow-hidden text-card-foreground">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-secondary/50 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[#FF3B00] animate-pulse" />
            <h2 className="font-bold text-lg tracking-tight flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#FF3B00]" /> Fast Entry Quick Add
            </h2>
          </div>
          <button
            onClick={() => setQuickAddOpen(false)}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Close (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-border bg-muted/30 p-1.5 gap-1">
          <button
            onClick={() => setActiveTab('content')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md font-medium text-xs transition-all ${
              activeTab === 'content'
                ? 'bg-[#FF3B00] text-white shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Calendar className="h-4 w-4" /> Content Item
          </button>
          <button
            onClick={() => setActiveTab('shoot')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md font-medium text-xs transition-all ${
              activeTab === 'shoot'
                ? 'bg-[#FF3B00] text-white shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Camera className="h-4 w-4" /> Shoot Plan
          </button>
          <button
            onClick={() => setActiveTab('task')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md font-medium text-xs transition-all ${
              activeTab === 'task'
                ? 'bg-[#FF3B00] text-white shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <CheckSquare className="h-4 w-4" /> Quick Task
          </button>
        </div>

        {/* Content & Shoot Form */}
        {(activeTab === 'content' || activeTab === 'shoot') && (
          <form onSubmit={handleSubmitContent} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Client Account *
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-[#FF3B00] focus:ring-1 focus:ring-[#FF3B00] outline-hidden"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                {activeTab === 'shoot' ? 'Shoot Location / Title *' : 'Working Title *'}
              </label>
              <input
                type="text"
                placeholder={activeTab === 'shoot' ? 'e.g., Rooftop Pool Sunset Shoot' : 'e.g., Autumn Festival Promo Reel'}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-[#FF3B00] focus:ring-1 focus:ring-[#FF3B00] outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {activeTab === 'content' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Content Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-[#FF3B00] outline-hidden"
                  >
                    <option value="REEL">Reel / Short</option>
                    <option value="CAROUSEL">Carousel Post</option>
                    <option value="STATIC_POST">Static Graphic</option>
                    <option value="STORY">Story Series</option>
                    <option value="AD_CREATIVE">Ad Creative</option>
                    <option value="SHOOT">Shoot Day</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Target Platform
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-[#FF3B00] outline-hidden"
                >
                  <option value="INSTAGRAM">Instagram</option>
                  <option value="FACEBOOK">Facebook</option>
                  <option value="TIKTOK">TikTok</option>
                  <option value="YOUTUBE">YouTube</option>
                  <option value="LINKEDIN">LinkedIn</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Target Date
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-[#FF3B00] outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Assign Lead Member
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-[#FF3B00] outline-hidden"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.department})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Brief / Notes
              </label>
              <textarea
                rows={2}
                placeholder="Key concept, script points, or equipment needed..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-[#FF3B00] outline-hidden"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setQuickAddOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-md border border-input hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 text-xs font-bold rounded-md bg-[#FF3B00] text-white hover:bg-[#e03400] transition-all shadow-md clicky-btn"
              >
                {loading ? 'Creating...' : activeTab === 'shoot' ? 'Schedule Shoot' : 'Add Content Item'}
              </button>
            </div>
          </form>
        )}

        {/* Task Form */}
        {activeTab === 'task' && (
          <form onSubmit={handleSubmitTask} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Task Title *
              </label>
              <input
                type="text"
                placeholder="e.g., Export drone clips for Sky Park"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-[#FF3B00] outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Urgency Level
                </label>
                <select
                  value={taskUrgency}
                  onChange={(e) => setTaskUrgency(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-[#FF3B00] outline-hidden"
                >
                  <option value="URGENT">🔴 Urgent (Immediate Action)</option>
                  <option value="HIGH">🟠 High Urgency</option>
                  <option value="MEDIUM">🟡 Medium Urgency</option>
                  <option value="LOW">⚪ Low Priority</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-[#FF3B00] outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Client (Optional)
                </label>
                <select
                  value={taskClientId}
                  onChange={(e) => setTaskClientId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-[#FF3B00] outline-hidden"
                >
                  <option value="">Internal Agency Task</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Assignee
                </label>
                <select
                  value={taskAssigneeId}
                  onChange={(e) => setTaskAssigneeId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-[#FF3B00] outline-hidden"
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.department})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setQuickAddOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-md border border-input hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 text-xs font-bold rounded-md bg-[#FF3B00] text-white hover:bg-[#e03400] transition-all shadow-md clicky-btn"
              >
                {loading ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
