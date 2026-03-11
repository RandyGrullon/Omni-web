// src/components/admin/AdminStats.tsx
import React from 'react';
import { Globe } from 'lucide-react';

interface AdminStatsProps {
  totalUsers: number;
  activeUsersCount: number;
  architectsCount: number;
}

export const AdminStats: React.FC<AdminStatsProps> = ({ totalUsers, activeUsersCount, architectsCount }) => (
  <div className="bg-gradient-to-br from-[#10b981]/20 to-transparent border border-[#10b981]/30 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
      <Globe size={100} className="text-[#10b981]" />
    </div>
    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#10b981] mb-2 text-left">Censo_Neural_Global</p>
    <h2 className="text-6xl font-black text-white tracking-tighter mb-6 flex items-baseline gap-3 text-left">
      {totalUsers} <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest text-left">Sujetos</span>
    </h2>
    <div className="flex gap-6 border-t border-white/5 pt-6 text-left">
      <div>
        <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1 text-left">Activos</p>
        <p className="text-xl font-bold text-[#10b981] text-left">{activeUsersCount}</p>
      </div>
      <div className="w-px h-8 bg-zinc-800" />
      <div>
        <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1 text-left">Admin_Nodes</p>
        <p className="text-xl font-bold text-purple-400 text-left">{architectsCount}</p>
      </div>
    </div>
  </div>
);
