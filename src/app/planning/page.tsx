'use client';

import React, { useState, useEffect } from 'react';
import { useImpersonation } from '@/components/providers';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns';
import {
  DndContext,
  closestCenter,
  pointerWithin,
  rectIntersection,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  Calendar as CalendarIcon,
  Wand2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Copy,
  Check,
  Filter,
  User,
  Eye,
  EyeOff,
  Video,
  Camera,
  Image as ImageIcon,
  Sparkles,
  GripVertical,
  X,
} from 'lucide-react';

function DroppableDayCell({
  day,
  isCurrentDay,
  onQuickAdd,
  children,
}: {
  day: Date;
  isCurrentDay: boolean;
  onQuickAdd: () => void;
  children: React.ReactNode;
}) {
  const dateId = format(day, 'yyyy-MM-dd');
  const { setNodeRef, isOver } = useDroppable({
    id: dateId,
  });

  return (
    <div
      ref={setNodeRef}
      onClick={onQuickAdd}
      className={`min-h-32 bg-card p-2 transition-colors relative flex flex-col justify-between group cursor-pointer ${
        isOver ? 'ring-2 ring-[#FF3B00] bg-[#FF3B00]/15 z-20 shadow-lg' : ''
      } ${isCurrentDay ? 'bg-[#FF3B00]/5 ring-1 ring-[#FF3B00]/50 z-10' : ''}`}
    >
      <div className="flex justify-between items-center mb-1 pointer-events-none">
        <span
          className={`text-xs font-bold h-6 w-6 rounded-full flex items-center justify-center ${
            isCurrentDay ? 'bg-[#FF3B00] text-white' : 'text-foreground/80 font-mono'
          }`}
        >
          {format(day, 'd')}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickAdd();
          }}
          className="opacity-0 group-hover:opacity-100 text-[#FF3B00] hover:scale-110 transition-all pointer-events-auto"
          title="Quick Add on this date"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-1.5 flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}

function DraggableContentCard({ item, onClick }: { item: any; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item.id,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`rounded-lg px-2 py-0.5 text-[10px] font-semibold text-white shadow-xs cursor-grab active:cursor-grabbing hover:brightness-110 border border-black/20 group/card w-fit max-w-full flex flex-col gap-0.5 select-none transition-opacity ${
        isDragging ? 'opacity-25 scale-95' : 'opacity-100'
      }`}
      style={{
        backgroundColor: item.client?.color || '#FF3B00',
      }}
    >
      <div className="flex items-center gap-1 pointer-events-none max-w-full">
        <GripVertical className="h-2.5 w-2.5 opacity-60 group-hover/card:opacity-100 shrink-0" />
        <span className="font-extrabold truncate max-w-[120px] leading-tight">{item.title}</span>
        <span className="text-[8px] uppercase px-1 rounded-sm bg-black/30 font-mono shrink-0 leading-tight">
          {item.type}
        </span>
      </div>
      {item.assignee && (
        <span className="block text-[8.5px] text-white/85 font-mono truncate pointer-events-none pl-3.5 leading-none">
          {item.assignee.name}
        </span>
      )}
    </div>
  );
}

export default function PlanningPage() {
  const { openQuickAdd, refreshTrigger, triggerRefresh } = useImpersonation();
  const [activeTab, setActiveTab] = useState<'calendar' | 'wizard'>('calendar');

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 8, 1)); // Sept 2026
  const [contentItems, setContentItems] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedClientFilter, setSelectedClientFilter] = useState('');
  const [myItemsOnly, setMyItemsOnly] = useState(false);
  const [hiddenClients, setHiddenClients] = useState<string[]>([]);

  // Item Detail & Edit Modal state
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editType, setEditType] = useState('REEL');
  const [editPlatform, setEditPlatform] = useState('INSTAGRAM');
  const [editStatus, setEditStatus] = useState('PLANNED');
  const [editScheduledDate, setEditScheduledDate] = useState('');
  const [editAssigneeId, setEditAssigneeId] = useState('');
  const [editClientId, setEditClientId] = useState('');
  const [editClientFeedbackNotes, setEditClientFeedbackNotes] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingEdit, setDeletingEdit] = useState(false);

  useEffect(() => {
    if (selectedItem) {
      setEditTitle(selectedItem.title || '');
      setEditType(selectedItem.type || 'REEL');
      setEditPlatform(selectedItem.platform || 'INSTAGRAM');
      setEditStatus(selectedItem.status || 'PLANNED');
      setEditScheduledDate(
        selectedItem.scheduledDate
          ? new Date(selectedItem.scheduledDate).toISOString().split('T')[0]
          : ''
      );
      setEditAssigneeId(selectedItem.assigneeId || selectedItem.assignee?.id || '');
      setEditClientId(selectedItem.clientId || selectedItem.client?.id || '');
      setEditClientFeedbackNotes(selectedItem.clientFeedbackNotes || '');
    }
  }, [selectedItem]);

  const handleSaveItemEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setSavingEdit(true);
    try {
      const res = await fetch('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedItem.id,
          title: editTitle,
          type: editType,
          platform: editPlatform,
          status: editStatus,
          scheduledDate: editScheduledDate,
          assigneeId: editAssigneeId || null,
          clientId: editClientId,
          clientFeedbackNotes: editClientFeedbackNotes,
        }),
      });
      if (res.ok) {
        setSelectedItem(null);
        fetchCalendarData();
        triggerRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!selectedItem) return;
    if (!confirm(`Are you sure you want to delete "${selectedItem.title}"?`)) return;
    setDeletingEdit(true);
    try {
      const res = await fetch(`/api/content?id=${selectedItem.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSelectedItem(null);
        fetchCalendarData();
        triggerRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingEdit(false);
    }
  };

  // Planning Wizard State
  const [wizardClientId, setWizardClientId] = useState('');
  const [wizardMonth, setWizardMonth] = useState('2026-09');
  const [wizardRows, setWizardRows] = useState<
    {
      type: string;
      platform: string;
      title: string;
      scheduledDate: string;
      assigneeId: string;
    }[]
  >([
    {
      type: 'REEL',
      platform: 'INSTAGRAM',
      title: 'Monsoon Special Reel',
      scheduledDate: '2026-09-05',
      assigneeId: '',
    },
    {
      type: 'CAROUSEL',
      platform: 'INSTAGRAM',
      title: 'Top 5 Highlights Carousel',
      scheduledDate: '2026-09-12',
      assigneeId: '',
    },
    {
      type: 'SHOOT',
      platform: 'INSTAGRAM',
      title: 'On-Location Shoot Day',
      scheduledDate: '2026-09-18',
      assigneeId: '',
    },
  ]);
  const [wizardSaving, setWizardSaving] = useState(false);

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    })
  );

  // ESC Key Listener for Item Detail Modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedItem) {
        setSelectedItem(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem]);

  const fetchCalendarData = () => {
    fetch('/api/clients')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setClients(data);
          if (data.length > 0 && !wizardClientId) setWizardClientId(data[0].id);
        }
      })
      .catch((err) => console.error('Failed to fetch clients:', err));

    fetch('/api/users')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setUsers(data);
      })
      .catch((err) => console.error('Failed to fetch users:', err));

    const params = new URLSearchParams();
    if (selectedClientFilter) params.append('clientId', selectedClientFilter);
    if (myItemsOnly) params.append('myItemsOnly', 'true');

    fetch(`/api/content?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setContentItems(data);
      })
      .catch((err) => console.error('Failed to fetch content:', err));
  };

  useEffect(() => {
    fetchCalendarData();
  }, [selectedClientFilter, myItemsOnly, refreshTrigger]);

  // Active drag item for DragOverlay
  const [activeDragItem, setActiveDragItem] = useState<any | null>(null);

  const customCollisionDetection = (args: any) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }
    return rectIntersection(args);
  };

  const getItemDateString = (scheduledDate: any) => {
    if (!scheduledDate) return '';
    if (typeof scheduledDate === 'string' && scheduledDate.length >= 10) {
      const datePart = scheduledDate.split('T')[0];
      if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
        return datePart;
      }
    }
    try {
      return format(new Date(scheduledDate), 'yyyy-MM-dd');
    } catch {
      return '';
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const item = contentItems.find((i) => i.id === event.active.id);
    if (item) setActiveDragItem(item);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);

    if (!over) {
      return;
    }

    const itemId = active.id as string;
    const targetDateStr = over.id as string; // "YYYY-MM-DD"

    const parts = targetDateStr.split('-');
    if (parts.length !== 3) return;

    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    // Set 12:00 PM local time to prevent timezone shift across day boundaries
    const targetDate = new Date(year, month, day, 12, 0, 0);
    const targetIso = targetDate.toISOString();

    // Optimistically update local state immediately (instant 0ms lag)
    setContentItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, scheduledDate: targetIso }
          : item
      )
    );

    try {
      await fetch('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: itemId,
          scheduledDate: targetIso,
        }),
      });
    } catch (err) {
      console.warn('Drag reschedule API error:', err);
    }
  };

  // Template pre-fill helper
  const applyTemplate = (templateType: string) => {
    if (templateType === 'standard') {
      setWizardRows([
        { type: 'SHOOT', platform: 'INSTAGRAM', title: 'Monthly Shoot Day', scheduledDate: '2026-09-02', assigneeId: '' },
        { type: 'REEL', platform: 'INSTAGRAM', title: 'Behind the Scenes Reel 1', scheduledDate: '2026-09-05', assigneeId: '' },
        { type: 'CAROUSEL', platform: 'INSTAGRAM', title: 'Product Showcase Carousel', scheduledDate: '2026-09-08', assigneeId: '' },
        { type: 'REEL', platform: 'INSTAGRAM', title: 'Trending Sound Reel 2', scheduledDate: '2026-09-12', assigneeId: '' },
        { type: 'STATIC_POST', platform: 'FACEBOOK', title: 'Customer Review Graphic', scheduledDate: '2026-09-15', assigneeId: '' },
        { type: 'REEL', platform: 'TIKTOK', title: 'Viral Challenge Short', scheduledDate: '2026-09-19', assigneeId: '' },
        { type: 'CAROUSEL', platform: 'LINKEDIN', title: 'Industry Insights Carousel', scheduledDate: '2026-09-22', assigneeId: '' },
        { type: 'REEL', platform: 'INSTAGRAM', title: 'Offer Promo Reel 4', scheduledDate: '2026-09-26', assigneeId: '' },
        { type: 'AD_CREATIVE', platform: 'FACEBOOK', title: 'Monthly Retargeting Ad', scheduledDate: '2026-09-29', assigneeId: '' },
      ]);
    } else if (templateType === 'heavy-reels') {
      setWizardRows([
        { type: 'SHOOT', platform: 'INSTAGRAM', title: 'Video Production Day', scheduledDate: '2026-09-03', assigneeId: '' },
        { type: 'REEL', platform: 'INSTAGRAM', title: 'Reel 1: High Energy Edit', scheduledDate: '2026-09-06', assigneeId: '' },
        { type: 'REEL', platform: 'INSTAGRAM', title: 'Reel 2: Tutorial / How-To', scheduledDate: '2026-09-10', assigneeId: '' },
        { type: 'REEL', platform: 'TIKTOK', title: 'Reel 3: Comedy / Relatable', scheduledDate: '2026-09-14', assigneeId: '' },
        { type: 'REEL', platform: 'INSTAGRAM', title: 'Reel 4: Client Testimonial', scheduledDate: '2026-09-18', assigneeId: '' },
        { type: 'REEL', platform: 'YOUTUBE', title: 'Reel 5: Cinematic Short', scheduledDate: '2026-09-24', assigneeId: '' },
      ]);
    }
  };

  const handleWizardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wizardClientId || wizardRows.length === 0) return;
    setWizardSaving(true);

    try {
      const res = await fetch('/api/content/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: wizardClientId,
          items: wizardRows,
        }),
      });

      if (res.ok) {
        setWizardSaving(false);
        setActiveTab('calendar');
        triggerRefresh();
      }
    } catch (err) {
      console.error('Wizard save failed:', err);
      setWizardSaving(false);
    }
  };

  // Calendar dates matrix
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const toggleHideClient = (cId: string) => {
    if (hiddenClients.includes(cId)) {
      setHiddenClients(hiddenClients.filter((id) => id !== cId));
    } else {
      setHiddenClients([...hiddenClients, cId]);
    }
  };

  const selectAllClients = () => setHiddenClients([]);
  const unselectAllClients = () => setHiddenClients(clients.map((c) => c.id));

  const filteredContent = contentItems.filter((item) => !hiddenClients.includes(item.clientId));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header with Mode Switcher */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            CONTENT & SHOOT PLANNING <Sparkles className="h-5 w-5 text-[#FF3B00]" />
          </h1>
          <p className="text-xs text-muted-foreground font-mono">
            Interactive Drag & Drop Calendar & Bulk Monthly Planning Wizard
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 bg-muted p-1 rounded-lg border border-border">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === 'calendar'
                ? 'bg-[#FF3B00] text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <CalendarIcon className="h-4 w-4" /> Calendar View
          </button>
          <button
            onClick={() => setActiveTab('wizard')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === 'wizard'
                ? 'bg-[#FF3B00] text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Wand2 className="h-4 w-4" /> Bulk Planning Wizard
          </button>
        </div>
      </div>

      {/* VIEW A: CALENDAR VIEW */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          {/* Calendar Bar & Legend */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="rounded-md border border-border p-1.5 text-foreground hover:bg-muted"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="rounded-md border border-border p-1.5 text-foreground hover:bg-muted"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <h2 className="text-lg font-black tracking-tight text-foreground uppercase">
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
              <button
                onClick={() => setCurrentMonth(new Date(2026, 8, 1))}
                className="text-xs font-mono text-[#FF3B00] hover:underline ml-2"
              >
                Today
              </button>
            </div>

            {/* Quick Toggles */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-mono text-muted-foreground bg-[#FF3B00]/10 text-[#FF3B00] px-2.5 py-1 rounded border border-[#FF3B00]/20 font-semibold flex items-center gap-1">
                ⚡ Drag & Drop to Reschedule
              </span>

              <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={myItemsOnly}
                  onChange={(e) => setMyItemsOnly(e.target.checked)}
                  className="rounded border-input text-[#FF3B00] focus:ring-[#FF3B00]"
                />
                <User className="h-3.5 w-3.5 text-[#FF3B00]" /> My Items Only
              </label>

              <button
                onClick={() => openQuickAdd('content')}
                className="flex items-center gap-1.5 rounded-md bg-[#FF3B00] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#e03400] transition-all clicky-btn"
              >
                <Plus className="h-4 w-4 stroke-[3]" /> Add Item
              </button>
            </div>
          </div>

          {/* Client Legend Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/40 p-3 rounded-lg border border-border/60">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono text-muted-foreground uppercase font-bold mr-2">
                Toggle Client Legend:
              </span>
              {clients.map((c) => {
                const isHidden = hiddenClients.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleHideClient(c.id)}
                    className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-all border ${
                      isHidden
                        ? 'bg-transparent text-muted-foreground border-border line-through opacity-50'
                        : 'bg-card text-foreground border-border shadow-2xs'
                    }`}
                  >
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                    <span>{c.name}</span>
                    {isHidden ? (
                      <EyeOff className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <Eye className="h-3 w-3 text-[#FF3B00]" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1.5 shrink-0 border-l border-border/60 pl-3">
              <button
                type="button"
                onClick={selectAllClients}
                className="px-2.5 py-1 rounded-md text-xs font-bold bg-[#FF3B00]/10 text-[#FF3B00] hover:bg-[#FF3B00] hover:text-white transition-all border border-[#FF3B00]/30 flex items-center gap-1 clicky-btn"
                title="Show all clients on calendar"
              >
                <Eye className="h-3.5 w-3.5" /> Select All
              </button>
              <button
                type="button"
                onClick={unselectAllClients}
                className="px-2.5 py-1 rounded-md text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-all border border-border flex items-center gap-1 clicky-btn"
                title="Hide all clients on calendar"
              >
                <EyeOff className="h-3.5 w-3.5" /> Unselect All
              </button>
            </div>
          </div>

          {/* Month Calendar Grid with DnD Context */}
          <DndContext
            sensors={sensors}
            collisionDetection={customCollisionDetection}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden border border-border shadow-sm">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="bg-muted p-2 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {d}
                </div>
              ))}

              {daysInMonth.map((day) => {
                const dateId = format(day, 'yyyy-MM-dd');
                const dayItems = filteredContent
                  .filter((item) => getItemDateString(item.scheduledDate) === dateId)
                  .sort((a, b) => a.id.localeCompare(b.id));

                const isCurrentDay = isToday(day) || isSameDay(day, new Date(2026, 8, 27));

                return (
                  <DroppableDayCell
                    key={day.toISOString()}
                    day={day}
                    isCurrentDay={isCurrentDay}
                    onQuickAdd={() => openQuickAdd('content')}
                  >
                    {dayItems.map((item) => (
                      <DraggableContentCard
                        key={item.id}
                        item={item}
                        onClick={() => setSelectedItem(item)}
                      />
                    ))}
                  </DroppableDayCell>
                );
              })}
            </div>

            <DragOverlay dropAnimation={null}>
              {activeDragItem ? (
                <div
                  className="rounded-lg px-2 py-0.5 text-[10px] font-semibold text-white shadow-2xl ring-2 ring-white scale-105 pointer-events-none w-fit max-w-full flex flex-col gap-0.5 cursor-grabbing"
                  style={{ backgroundColor: activeDragItem.client?.color || '#FF3B00' }}
                >
                  <div className="flex items-center gap-1 max-w-full">
                    <GripVertical className="h-2.5 w-2.5 opacity-80 shrink-0" />
                    <span className="font-extrabold truncate max-w-[120px] leading-tight">{activeDragItem.title}</span>
                    <span className="text-[8px] uppercase px-1 rounded-sm bg-black/30 font-mono shrink-0 leading-tight">
                      {activeDragItem.type}
                    </span>
                  </div>
                  {activeDragItem.assignee && (
                    <span className="text-[8.5px] text-white/85 font-mono truncate pl-3.5 leading-none">
                      {activeDragItem.assignee.name}
                    </span>
                  )}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      )}

      {/* VIEW B: PLANNING WIZARD (BULK FAST CREATION) */}
      {activeTab === 'wizard' && (
        <div className="space-y-6 bg-card p-6 rounded-xl border border-border shadow-md">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
            <div>
              <h2 className="text-lg font-black tracking-tight text-foreground flex items-center gap-2">
                FAST MONTHLY CONTENT PLANNER <Wand2 className="h-5 w-5 text-[#FF3B00]" />
              </h2>
              <p className="text-xs text-muted-foreground font-mono">
                Build out a client's full month shoot & post deliverable plan in one sitting.
              </p>
            </div>

            {/* Template Presets */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-muted-foreground">Load Template:</span>
              <button
                onClick={() => applyTemplate('standard')}
                className="px-2.5 py-1 text-xs font-semibold rounded bg-muted hover:bg-muted/80 text-foreground border border-border"
              >
                Standard (8 posts + 1 shoot)
              </button>
              <button
                onClick={() => applyTemplate('heavy-reels')}
                className="px-2.5 py-1 text-xs font-semibold rounded bg-muted hover:bg-muted/80 text-foreground border border-border"
              >
                Reel Focus (5 reels + shoot)
              </button>
            </div>
          </div>

          <form onSubmit={handleWizardSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Target Client Account *
                </label>
                <select
                  value={wizardClientId}
                  onChange={(e) => setWizardClientId(e.target.value)}
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-[#FF3B00] outline-hidden"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.packageTier})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Planning Month
                </label>
                <input
                  type="month"
                  value={wizardMonth}
                  onChange={(e) => setWizardMonth(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-[#FF3B00] outline-hidden"
                />
              </div>
            </div>

            {/* Fast Table Matrix */}
            <div className="border border-border rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted text-muted-foreground uppercase text-[10px] font-mono border-b border-border">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Platform</th>
                    <th className="p-3">Working Title</th>
                    <th className="p-3">Target Date</th>
                    <th className="p-3">Assignee</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {wizardRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-muted/30">
                      <td className="p-3 font-mono font-bold text-muted-foreground">{idx + 1}</td>
                      <td className="p-3">
                        <select
                          value={row.type}
                          onChange={(e) => {
                            const next = [...wizardRows];
                            next[idx].type = e.target.value;
                            setWizardRows(next);
                          }}
                          className="rounded border border-input bg-background px-2 py-1 text-xs outline-hidden"
                        >
                          <option value="REEL">Reel / Short</option>
                          <option value="CAROUSEL">Carousel</option>
                          <option value="STATIC_POST">Static Post</option>
                          <option value="SHOOT">Shoot Day</option>
                          <option value="STORY">Story Series</option>
                          <option value="AD_CREATIVE">Ad Creative</option>
                        </select>
                      </td>
                      <td className="p-3">
                        <select
                          value={row.platform}
                          onChange={(e) => {
                            const next = [...wizardRows];
                            next[idx].platform = e.target.value;
                            setWizardRows(next);
                          }}
                          className="rounded border border-input bg-background px-2 py-1 text-xs outline-hidden"
                        >
                          <option value="INSTAGRAM">Instagram</option>
                          <option value="FACEBOOK">Facebook</option>
                          <option value="TIKTOK">TikTok</option>
                          <option value="YOUTUBE">YouTube</option>
                          <option value="LINKEDIN">LinkedIn</option>
                        </select>
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={row.title}
                          onChange={(e) => {
                            const next = [...wizardRows];
                            next[idx].title = e.target.value;
                            setWizardRows(next);
                          }}
                          required
                          placeholder="Title / Concept"
                          className="w-full rounded border border-input bg-background px-2 py-1 text-xs outline-hidden focus:border-[#FF3B00]"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="date"
                          value={row.scheduledDate}
                          onChange={(e) => {
                            const next = [...wizardRows];
                            next[idx].scheduledDate = e.target.value;
                            setWizardRows(next);
                          }}
                          required
                          className="rounded border border-input bg-background px-2 py-1 text-xs outline-hidden focus:border-[#FF3B00]"
                        />
                      </td>
                      <td className="p-3">
                        <select
                          value={row.assigneeId}
                          onChange={(e) => {
                            const next = [...wizardRows];
                            next[idx].assigneeId = e.target.value;
                            setWizardRows(next);
                          }}
                          className="rounded border border-input bg-background px-2 py-1 text-xs outline-hidden"
                        >
                          <option value="">Unassigned</option>
                          {users.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3 text-right space-x-1">
                        <button
                          type="button"
                          onClick={() => {
                            const next = [...wizardRows];
                            next.splice(idx + 1, 0, { ...row, title: `${row.title} (Copy)` });
                            setWizardRows(next);
                          }}
                          className="p-1 rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="Duplicate Row"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const next = wizardRows.filter((_, i) => i !== idx);
                            setWizardRows(next);
                          }}
                          className="p-1 rounded text-rose-500 hover:bg-rose-500/10"
                          title="Delete Row"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() =>
                  setWizardRows([
                    ...wizardRows,
                    {
                      type: 'REEL',
                      platform: 'INSTAGRAM',
                      title: '',
                      scheduledDate: '2026-09-28',
                      assigneeId: '',
                    },
                  ])
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-input bg-background text-xs font-semibold hover:bg-muted"
              >
                <Plus className="h-4 w-4 text-[#FF3B00]" /> Add New Deliverable Row
              </button>

              <button
                type="submit"
                disabled={wizardSaving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-md bg-[#FF3B00] text-white font-bold text-xs hover:bg-[#e03400] transition-all shadow-md clicky-btn"
              >
                {wizardSaving ? 'Bulk Generating Content...' : `Save ${wizardRows.length} Items to Calendar`}
                <Check className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Item Edit Modal */}
      {selectedItem && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedItem(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200"
        >
          <div className="w-full max-w-xl bg-card border-2 border-border shadow-2xl rounded-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <span
                  className="px-2.5 py-0.5 rounded text-[10px] font-bold text-white uppercase"
                  style={{ backgroundColor: clients.find((c) => c.id === editClientId)?.color || '#FF3B00' }}
                >
                  {clients.find((c) => c.id === editClientId)?.name || selectedItem.client?.name || 'Client'}
                </span>
                <h3 className="font-extrabold text-base text-foreground">Edit Content Deliverable</h3>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                title="Close (Esc)"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItemEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Deliverable Title *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-semibold rounded-md border border-input bg-background focus:outline-hidden focus:ring-2 focus:ring-[#FF3B00]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Client Account *
                  </label>
                  <select
                    value={editClientId}
                    onChange={(e) => setEditClientId(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background font-medium focus:outline-hidden focus:ring-2 focus:ring-[#FF3B00]"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Assigned Lead
                  </label>
                  <select
                    value={editAssigneeId}
                    onChange={(e) => setEditAssigneeId(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background font-medium focus:outline-hidden focus:ring-2 focus:ring-[#FF3B00]"
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
                  <label className="block font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Format / Content Type
                  </label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background font-medium focus:outline-hidden focus:ring-2 focus:ring-[#FF3B00]"
                  >
                    <option value="REEL">REEL</option>
                    <option value="CAROUSEL">CAROUSEL</option>
                    <option value="SHOOT">SHOOT</option>
                    <option value="GRAPHIC">GRAPHIC</option>
                    <option value="STORY">STORY</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Platform
                  </label>
                  <select
                    value={editPlatform}
                    onChange={(e) => setEditPlatform(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background font-medium focus:outline-hidden focus:ring-2 focus:ring-[#FF3B00]"
                  >
                    <option value="INSTAGRAM">INSTAGRAM</option>
                    <option value="TIKTOK">TIKTOK</option>
                    <option value="FACEBOOK">FACEBOOK</option>
                    <option value="YOUTUBE">YOUTUBE</option>
                    <option value="LINKEDIN">LINKEDIN</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Deliverable Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background font-bold text-[#FF3B00] focus:outline-hidden focus:ring-2 focus:ring-[#FF3B00]"
                  >
                    <option value="PLANNED">PLANNED</option>
                    <option value="IN_PRODUCTION">IN_PRODUCTION</option>
                    <option value="EDITED">EDITED</option>
                    <option value="CLIENT_APPROVAL">CLIENT_APPROVAL</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="PUBLISHED">PUBLISHED</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Scheduled Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={editScheduledDate}
                    onChange={(e) => setEditScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background font-medium focus:outline-hidden focus:ring-2 focus:ring-[#FF3B00]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Client Feedback Notes / Brief
                </label>
                <textarea
                  rows={3}
                  value={editClientFeedbackNotes}
                  onChange={(e) => setEditClientFeedbackNotes(e.target.value)}
                  placeholder="Enter feedback, caption instructions, or client revisions..."
                  className="w-full px-3 py-2 rounded-md border border-amber-500/40 bg-amber-500/5 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-foreground font-medium"
                />
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={handleDeleteItem}
                  disabled={deletingEdit}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md text-red-500 hover:bg-red-500/10 font-bold transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  {deletingEdit ? 'Deleting...' : 'Delete Deliverable'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedItem(null)}
                    className="px-4 py-2 rounded-md font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="flex items-center gap-2 px-5 py-2 rounded-md bg-[#FF3B00] text-white font-bold hover:bg-[#e03400] transition-all shadow-md clicky-btn"
                  >
                    {savingEdit ? 'Saving...' : 'Save Changes'}
                    <Check className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
