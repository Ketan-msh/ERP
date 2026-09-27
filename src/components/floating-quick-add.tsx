'use client';

import React from 'react';
import { useImpersonation } from '@/components/providers';
import { Plus } from 'lucide-react';

export function FloatingQuickAdd() {
  const { openQuickAdd } = useImpersonation();

  return (
    <button
      onClick={() => openQuickAdd('content')}
      title="Quick Add Content, Shoot, or Task"
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-[#FF3B00] px-4 py-3 font-bold text-white shadow-xl hover:bg-[#e03400] hover:scale-105 active:scale-95 transition-all clicky-btn border-2 border-white/20"
    >
      <Plus className="h-5 w-5 stroke-[3]" />
      <span className="text-xs uppercase tracking-wider font-extrabold hidden sm:inline">Quick Add</span>
    </button>
  );
}
