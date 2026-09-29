'use client';

import React, { useState, useEffect } from 'react';
import { History, RotateCcw, X, Clock, User, CheckCircle2, AlertCircle } from 'lucide-react';
import { useImpersonation } from '@/components/providers';

interface AuditHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuditHistoryModal({ isOpen, onClose }: AuditHistoryModalProps) {
  const { refreshTrigger, triggerRefresh } = useImpersonation();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [undoingId, setUndoingId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLogs((prev) => {
      if (prev.length === 0) setLoading(true);
      return prev;
    });
    try {
      const res = await fetch('/api/activity-log', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Failed to fetch activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen, refreshTrigger]);

  const handleUndo = async (logId: string) => {
    setUndoingId(logId);
    try {
      const res = await fetch('/api/activity-log/undo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logId }),
      });

      if (res.ok) {
        const result = await res.json();
        alert(result.message || 'Action undone successfully!');
        fetchLogs();
        triggerRefresh();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Failed to undo action.');
      }
    } catch (err) {
      console.error('Undo failed:', err);
      alert('An error occurred while attempting to undo.');
    } finally {
      setUndoingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-2xl bg-card border-2 border-border shadow-2xl rounded-xl p-6 space-y-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-border pb-3 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#FF3B00]/10 text-[#FF3B00]">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-foreground">Changes Made & Edit History</h2>
              <p className="text-xs text-muted-foreground">
                Track all real-time ERP updates and restore previous versions like Google Docs history
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body list */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {loading ? (
            <div className="py-12 text-center text-xs text-muted-foreground animate-pulse">
              Loading audit logs & edit history...
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              No recent changes recorded yet.
            </div>
          ) : (
            logs.map((log) => {
              const hasUndo = Boolean(log.previousState);
              let diffs: { field: string; oldVal: string; newVal: string }[] = [];
              if (log.changes) {
                try {
                  diffs = JSON.parse(log.changes);
                } catch (e) {
                  // ignore
                }
              }

              const actionColors: Record<string, string> = {
                CREATE: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
                UPDATE: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
                DELETE: 'bg-rose-500/10 text-rose-500 border-rose-500/30',
                RESTORE: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
                UNDO: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
              };

              const isDelete = log.action === 'DELETE';

              return (
                <div
                  key={log.id}
                  className="p-3.5 rounded-lg border border-border bg-card hover:bg-muted/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-3 shadow-xs"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-background border border-border flex items-center justify-center font-bold text-foreground text-xs flex-shrink-0 mt-0.5">
                      {log.user?.avatar ? (
                        <img
                          src={log.user.avatar}
                          alt={log.user.name}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        log.user?.name?.slice(0, 2).toUpperCase() || 'EX'
                      )}
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-foreground">{log.user?.name || 'User'}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                            actionColors[log.action] || 'bg-gray-500/10 text-gray-500'
                          }`}
                        >
                          {log.action}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-foreground font-semibold">{log.details}</p>

                      {/* Field Diff Breakdown */}
                      {diffs.length > 0 && (
                        <div className="mt-2 space-y-1 p-2 rounded-md bg-muted/40 border border-border/60 text-[11px] font-mono">
                          {diffs.map((d, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-muted-foreground">
                              <span className="font-bold text-foreground">{d.field}:</span>
                              <span className="line-through text-rose-400">{d.oldVal}</span>
                              <span>→</span>
                              <span className="font-bold text-emerald-400">{d.newVal}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Undo / Restore Button if previousState snapshot is available */}
                  {hasUndo && log.action !== 'UNDO' && log.action !== 'RESTORE' && (
                    <button
                      onClick={() => handleUndo(log.id)}
                      disabled={undoingId === log.id}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold text-xs transition-all flex-shrink-0 clicky-btn ${
                        isDelete
                          ? 'bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white border-emerald-500/30'
                          : 'bg-[#FF3B00]/10 hover:bg-[#FF3B00] text-[#FF3B00] hover:text-white border-[#FF3B00]/30'
                      }`}
                      title={isDelete ? 'Restore deleted client account back to active roster' : 'Revert this change back to previous value'}
                    >
                      <RotateCcw className={`h-3.5 w-3.5 ${undoingId === log.id ? 'animate-spin' : ''}`} />
                      <span>{undoingId === log.id ? 'Processing...' : isDelete ? 'Restore Account' : 'Undo Edit'}</span>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-border flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-input hover:bg-muted"
          >
            Close History
          </button>
        </div>
      </div>
    </div>
  );
}
