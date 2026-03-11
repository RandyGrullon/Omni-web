// src/components/admin/UsersTable.tsx
import React from 'react';
import { Search, Globe, Zap, AlertTriangle, ShieldCheck, Activity, Clock, ArrowRight, Users } from 'lucide-react';

interface UsersTableProps {
  profiles: any[];
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  filterPlan: string;
  setFilterPlan: (v: string) => void;
  setPage: (v: any) => void;
  selectedUser: any;
  setSelectedUser: (v: any) => void;
  fetchUserHistory: (email: string) => void;
  isKeyExpired: (date: string | null, plan?: string) => boolean;
}

export const UsersTable: React.FC<UsersTableProps> = ({
  profiles, searchQuery, setSearchQuery, filterPlan, setFilterPlan, 
  setPage, selectedUser, setSelectedUser, fetchUserHistory, isKeyExpired
}) => {
  const filters = [
    { id: 'all', label: 'Todos', icon: Globe },
    { id: 'active', label: 'Vigentes', icon: Zap },
    { id: 'expired', label: 'Expirados', icon: AlertTriangle },
    { id: 'architect', label: 'Architects', icon: ShieldCheck }
  ];

  return (
    <>
      <div className="p-8 border-b border-zinc-800/50 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4 text-left">
            <div className="p-3 bg-zinc-800/50 rounded-xl text-[#10b981]"><Users size={20} /></div>
            <h3 className="font-bold text-xl tracking-tight text-left">Directorio de Usuarios</h3>
          </div>
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-[#10b981] transition-colors" size={18} />
            <input 
              type="text" placeholder="Buscar por ID, Email o Alias..." 
              className="w-full bg-black/40 border border-zinc-800/50 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-[#10b981]/50 focus:bg-black transition-all text-white"
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button key={f.id} onClick={() => { setFilterPlan(f.id); setPage(1); }} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all border ${filterPlan === f.id ? 'bg-[#10b981]/10 border-[#10b981] text-[#10b981]' : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}>
              <f.icon size={12} /> {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] bg-black/40">
              <th className="px-8 py-5 text-left">Sujeto</th>
              <th className="px-8 py-5 text-left">Neural Key</th>
              <th className="px-8 py-5 text-left">Plan / Vigencia</th>
              <th className="px-8 py-5 text-left">Última Sinc</th>
              <th className="px-8 py-5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/30">
            {profiles.map((p) => (
              <tr key={p.id} onClick={() => setSelectedUser(selectedUser?.id === p.id ? null : p)} className={`hover:bg-white/[0.01] transition-colors group cursor-pointer ${selectedUser?.id === p.id ? 'bg-[#10b981]/5 ring-1 ring-inset ring-[#10b981]/20' : ''}`}>
                <td className="px-8 py-6 text-left">
                  <div className="flex items-center gap-4 text-left">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black transition-colors ${selectedUser?.id === p.id ? 'bg-[#10b981] text-black' : 'bg-zinc-800 text-zinc-500'}`}>{p.first_name ? p.first_name[0] : '?'}</div>
                    <div className="flex flex-col text-left">
                      <span className={`font-bold text-sm transition-colors text-left ${selectedUser?.id === p.id ? 'text-[#10b981]' : 'text-zinc-200'}`}>{p.first_name ? `${p.first_name} ${p.last_name}` : 'N/A'}</span>
                      <span className="text-[10px] text-zinc-500 lowercase text-left">{p.email}</span>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6 text-left">
                  {p.purchase_id ? (
                    <code className="text-[10px] font-mono font-black text-[#10b981] bg-[#10b981]/5 px-2 py-1 rounded border border-[#10b981]/10 uppercase">{p.purchase_id}</code>
                  ) : (<span className="text-[9px] text-zinc-700 font-bold uppercase">Locked</span>)}
                </td>
                <td className="px-8 py-6 text-left">
                  <div className="flex flex-col gap-1 text-left">
                    <span className={`w-fit px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${p.plan === 'architect' ? 'bg-purple-500/10 text-purple-400' : 'bg-zinc-800 text-zinc-400'}`}>{p.plan || 'Free'}</span>
                    <span className="text-[9px] text-zinc-500 font-bold">{p.plan === 'architect' ? '∞' : p.plan_expires_at ? new Date(p.plan_expires_at).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </td>
                <td className="px-8 py-6 text-left">
                  <span className="text-[10px] text-zinc-500 font-medium">{p.updated_at ? new Date(p.updated_at).toLocaleDateString() : 'Never'}</span>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex justify-end gap-2 text-right">
                    <button onClick={(e) => {e.stopPropagation(); fetchUserHistory(p.email)}} className="p-2.5 bg-zinc-800/30 rounded-lg hover:bg-blue-500 transition-all border border-zinc-800/50 text-zinc-500 hover:text-white"><Clock size={14} /></button>
                    <button className="p-2.5 bg-zinc-800/30 rounded-lg hover:bg-[#10b981] hover:text-black transition-all border border-zinc-800/50 text-zinc-500 hover:text-black"><ArrowRight size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};
