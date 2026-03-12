// src/components/dashboard/DashboardNavbar.tsx
import React from 'react';
import Link from 'next/link';
import { ShieldCheck, User, MessageSquare } from 'lucide-react';
import { NeuralBadge } from '@/components/ui/NeuralBadge';

interface DashboardNavbarProps {
  profile: any;
  isPurchaseValid: boolean;
  onProfileOpen: () => void;
}

export const DashboardNavbar: React.FC<DashboardNavbarProps> = ({ profile, isPurchaseValid, onProfileOpen }) => {
  return (
    <header className="flex justify-between items-center mb-12 bg-[#111] border border-[#222] p-6 rounded-[2rem] shadow-2xl relative overflow-hidden text-left">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00FF41]/20 to-transparent" />
      
      <div className="flex items-center gap-5 text-left">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-500 ${isPurchaseValid ? 'bg-[#00FF41]/10 border-[#00FF41]/20' : 'bg-red-500/5 border-red-500/20'}`}>
          <ShieldCheck className={isPurchaseValid ? 'text-[#00FF41]' : 'text-red-500/50'} size={32} />
        </div>
        <div className="text-left">
          <div className="flex items-center gap-2 text-left">
            <h1 className="text-2xl font-black tracking-tighter uppercase italic text-left text-white">Omni_Core</h1>
            <NeuralBadge variant="info">v4.0.2</NeuralBadge>
          </div>
          <p className="text-gray-500 text-[9px] mt-1 tracking-[0.4em] font-bold uppercase text-left">Heads-Up Display Network</p>
        </div>
      </div>

      <div className="flex items-center gap-6 text-left">
        <Link
          href="/dashboard/chat"
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#222] text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:border-[#00FF41]/40 hover:text-[#00FF41] transition-colors"
        >
          <MessageSquare size={14} /> Chat
        </Link>
        <div className="text-right hidden sm:block">
          <p className="text-[10px] font-black text-white uppercase tracking-tight">{profile.username || 'Initializing...'}</p>
          <p className={`text-[8px] uppercase font-bold tracking-[0.2em] mt-0.5 ${isPurchaseValid ? 'text-[#00FF41]' : 'text-gray-600'}`}>
            {isPurchaseValid ? 'Verified_Operator' : 'Guest_Subject'}
          </p>
        </div>
        <button 
          onClick={onProfileOpen}
          className="group relative w-14 h-14 bg-black border border-[#222] rounded-2xl flex items-center justify-center hover:border-[#00FF41]/50 transition-all overflow-hidden"
        >
          <User size={24} className="text-gray-500 group-hover:text-[#00FF41] transition-colors relative z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#00FF41]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>
    </header>
  );
};
