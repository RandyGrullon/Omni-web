// src/components/admin/SubjectExpedient.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Plus, RefreshCcw, CheckCircle2, Clipboard, X, Users, Clock } from 'lucide-react';

interface SubjectExpedientProps {
  selectedUser: any;
  setSelectedUser: (user: any) => void;
  planType: 'monthly' | 'yearly';
  setPlanType: (type: 'monthly' | 'yearly') => void;
  generating: boolean;
  generateKey: () => void;
  recentKey: any;
  copied: boolean;
  setCopied: (v: boolean) => void;
  fetchUserHistory: (email: string) => void;
  isKeyExpired: (date: string | null, plan?: string) => boolean;
  prices: { monthly: number; yearly: number };
}

export const SubjectExpedient: React.FC<SubjectExpedientProps> = ({
  selectedUser, setSelectedUser, planType, setPlanType, generating, 
  generateKey, recentKey, copied, setCopied, fetchUserHistory, isKeyExpired, prices
}) => {
  return (
    <div className="lg:col-span-4 space-y-8">
      <AnimatePresence mode="wait">
        {!selectedUser ? (
          <motion.div 
            key="generator" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="bg-zinc-900/30 border border-zinc-800/50 p-8 rounded-[2.5rem] backdrop-blur-2xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] rotate-12 transition-transform group-hover:scale-110 duration-700"><Zap size={120} /></div>
            <h2 className="text-xl font-bold mb-8 flex items-center gap-3 text-left"><Zap className="text-[#10b981]" size={24} /> Generar Acceso</h2>
            
            <div className="flex p-1.5 bg-black/50 rounded-2xl mb-8 border border-zinc-800/50 relative z-10">
              {['monthly', 'yearly'].map((t) => (
                <button key={t} onClick={() => setPlanType(t as any)} className={`flex-1 py-3 text-[10px] font-black tracking-widest rounded-xl transition-all ${planType === t ? 'bg-[#10b981] text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>
                  {t.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="mb-8 p-6 rounded-3xl border border-zinc-800/30 bg-gradient-to-b from-black/20 to-transparent text-center">
              <p className="text-[10px] text-zinc-500 font-bold uppercase mb-2 tracking-[0.2em]">Créditos Requeridos</p>
              <div className="flex justify-center items-end gap-1">
                <span className="text-5xl font-black text-[#10b981]">${planType === 'monthly' ? prices.monthly : prices.yearly.toFixed(2)}</span>
                <span className="text-xs text-zinc-600 font-bold mb-2">USD</span>
              </div>
            </div>

            <button onClick={generateKey} disabled={generating} className="w-full h-16 rounded-2xl bg-[#10b981] text-black font-black flex items-center justify-center gap-3 transition-all group shadow-2xl shadow-[#10b981]/20">
              {generating ? <RefreshCcw className="animate-spin" size={24} /> : <><Plus size={24} className="group-hover:rotate-90 transition-transform" /> GENERAR KEY NEURAL</>}
            </button>

            {recentKey && (
              <div className="mt-8 p-6 bg-[#10b981]/5 border border-[#10b981]/20 rounded-3xl animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center justify-between gap-4 p-4 bg-black/40 rounded-2xl border border-zinc-800/50">
                  <code className="text-base font-mono font-black text-white truncate text-left">{recentKey.text}</code>
                  <button onClick={() => {navigator.clipboard.writeText(recentKey.text); setCopied(true); setTimeout(() => setCopied(false), 2000)}} className={`p-3 rounded-xl transition-all ${copied ? 'bg-green-500 text-black' : 'bg-[#10b981]/20 text-[#10b981]'}`}>
                    {copied ? <CheckCircle2 size={20} /> : <Clipboard size={20} />}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="subject-detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden text-left"
          >
            <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none"><Users size={150} /></div>
            <div className="flex justify-between items-start mb-8 text-left">
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-[#10b981] text-left">Subject_Profile_File</h2>
              <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-zinc-500 hover:text-white"><X size={18} /></button>
            </div>

            <div className="flex flex-col items-center text-center mb-10">
              <div className="w-24 h-24 bg-[#10b981]/10 rounded-3xl flex items-center justify-center text-3xl font-black text-[#10b981] border-2 border-[#10b981]/20 mb-6 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                {selectedUser.first_name ? selectedUser.first_name[0] : '?'}
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tighter text-white">{selectedUser.first_name ? `${selectedUser.first_name} ${selectedUser.last_name}` : 'No Sincronizado'}</h3>
              <p className="text-zinc-500 text-xs font-medium lowercase mt-1">{selectedUser.email}</p>
              
              <div className="flex gap-2 mt-4">
                <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${isKeyExpired(selectedUser.plan_expires_at, selectedUser.plan) ? 'bg-red-500/10 text-red-500' : 'bg-[#10b981]/10 text-[#10b981]'}`}>
                  {isKeyExpired(selectedUser.plan_expires_at, selectedUser.plan) ? 'PROTOCOLO EXPIRADO' : 'PROTOCOLO VIGENTE'}
                </span>
              </div>
            </div>

            <div className="space-y-4 mb-10">
              <div className="bg-black/40 border border-zinc-800/50 p-4 rounded-2xl text-left">
                <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest mb-1 text-left">Neural_Auth_Key_Active</p>
                <code className="text-[11px] font-mono font-bold text-[#10b981] text-left">{selectedUser.purchase_id || 'N/A'}</code>
              </div>
              <div className="bg-black/40 border border-zinc-800/50 p-4 rounded-2xl text-left">
                <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest mb-1 text-left">Protocol_Expiration</p>
                <p className={`text-xs font-bold text-left ${isKeyExpired(selectedUser.plan_expires_at, selectedUser.plan) ? 'text-red-500' : 'text-zinc-300'}`}>
                  {selectedUser.plan_expires_at ? new Date(selectedUser.plan_expires_at).toLocaleDateString() : '∞ PERMANENTE'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <button onClick={() => fetchUserHistory(selectedUser.email)} className="w-full py-4 bg-blue-600/10 text-blue-400 border border-blue-600/20 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-3">
                <Clock size={16} /> Ver Historial
              </button>
              
              <div className="pt-4 border-t border-zinc-800/50">
                <div className="flex p-1 bg-black/50 rounded-xl mb-4 border border-zinc-800/50">
                  <button onClick={() => setPlanType('monthly')} className={`flex-1 py-2 text-[8px] font-black tracking-widest rounded-lg transition-all ${planType === 'monthly' ? 'bg-[#10b981] text-black' : 'text-zinc-500'}`}>MENSUAL</button>
                  <button onClick={() => setPlanType('yearly')} className={`flex-1 py-2 text-[8px] font-black tracking-widest rounded-lg transition-all ${planType === 'yearly' ? 'bg-[#10b981] text-black' : 'text-zinc-500'}`}>ANUAL</button>
                </div>
                <button onClick={generateKey} disabled={generating || (!!selectedUser?.purchase_id && !isKeyExpired(selectedUser.plan_expires_at, selectedUser.plan))} className={`w-full py-5 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-3 transition-all ${selectedUser?.purchase_id && !isKeyExpired(selectedUser.plan_expires_at, selectedUser.plan) ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : 'bg-[#10b981] text-black hover:scale-[1.02]'}`}>
                  {generating ? <RefreshCcw className="animate-spin" size={16} /> : <><Zap size={16} /> {selectedUser?.purchase_id && !isKeyExpired(selectedUser.plan_expires_at, selectedUser.plan) ? 'PROTOCOLO VIGENTE' : 'RENOVAR ACCESO'}</>}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
