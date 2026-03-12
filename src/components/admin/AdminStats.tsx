// src/components/admin/AdminStats.tsx
import React from 'react';
import { Globe, Ban, UserX, Key, Activity } from 'lucide-react';

interface AdminStatsProps {
  totalUsers: number;
  activeUsersCount: number;
  architectsCount: number;
  blockedCount: number;
  cancelledCount: number;
  totalKeys: number;
  activeKeys: number;
}

export const AdminStats: React.FC<AdminStatsProps> = ({
  totalUsers, activeUsersCount, architectsCount,
  blockedCount, cancelledCount, totalKeys, activeKeys
}) => (
  <div className="space-y-4">
    {/* Main stat */}
    <div className="bg-gradient-to-br from-[#10b981]/20 to-transparent border border-[#10b981]/30 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
        <Globe size={100} className="text-[#10b981]" />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#10b981] mb-2">Censo_Neural_Global</p>
      <h2 className="text-6xl font-black text-white tracking-tighter mb-6 flex items-baseline gap-3">
        {totalUsers} <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Sujetos</span>
      </h2>
      <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-6">
        <div>
          <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Activos</p>
          <p className="text-xl font-bold text-[#10b981]">{activeUsersCount}</p>
        </div>
        <div>
          <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Architects</p>
          <p className="text-xl font-bold text-purple-400">{architectsCount}</p>
        </div>
      </div>
    </div>

    {/* Warning stats */}
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <Ban size={14} className="text-red-400" />
          <p className="text-[9px] font-black text-red-400 uppercase tracking-wider">Bloqueados</p>
        </div>
        <p className="text-2xl font-black text-red-300">{blockedCount}</p>
      </div>
      <div className="bg-zinc-800/20 border border-zinc-800/50 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <UserX size={14} className="text-zinc-500" />
          <p className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">Cancelados</p>
        </div>
        <p className="text-2xl font-black text-zinc-400">{cancelledCount}</p>
      </div>
    </div>

    {/* Keys stats */}
    <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Key size={14} className="text-[#10b981]" />
        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">Neural Keys</p>
      </div>
      <div className="flex gap-6">
        <div>
          <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Total</p>
          <p className="text-xl font-bold text-zinc-300">{totalKeys}</p>
        </div>
        <div className="w-px h-8 bg-zinc-800 self-end mb-1" />
        <div>
          <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Activas</p>
          <p className="text-xl font-bold text-[#10b981]">{activeKeys}</p>
        </div>
      </div>
    </div>
  </div>
);
