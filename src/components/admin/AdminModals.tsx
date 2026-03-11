// src/components/admin/AdminModals.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, CheckCircle2, AlertTriangle, Clock, Activity, Zap, X } from 'lucide-react';

interface AdminModalsProps {
  modalConfig: any;
  setModalConfig: (config: any) => void;
  isHistoryOpen: boolean;
  setIsHistoryOpen: (open: boolean) => void;
  userHistory: any[];
}

export const AdminModals: React.FC<AdminModalsProps> = ({
  modalConfig, setModalConfig, isHistoryOpen, setIsHistoryOpen, userHistory
}) => {
  return (
    <>
      {/* MODAL SISTEMA */}
      <AnimatePresence>
        {modalConfig.show && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModalConfig({...modalConfig, show: false})} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-10 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12"><ShieldCheck size={120} /></div>
              <div className="flex flex-col items-center text-center">
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-8 ${
                  modalConfig.type === 'success' ? 'bg-[#10b981]/10 text-[#10b981]' : 
                  modalConfig.type === 'confirm_delete' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-400'
                }`}>
                  {modalConfig.type === 'success' ? <CheckCircle2 size={40} /> : <AlertTriangle size={40} />}
                </div>
                <h3 className="text-xl font-black uppercase tracking-tighter mb-4 text-white">{modalConfig.title}</h3>
                <p className="text-zinc-500 text-sm font-medium leading-relaxed mb-10">{modalConfig.message}</p>
                <div className="flex gap-4 w-full">
                  {modalConfig.type === 'success' ? (
                    <button onClick={() => setModalConfig({...modalConfig, show: false})} className="w-full py-4 bg-[#10b981] text-black font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-[#059669] transition-all">ENTENDIDO</button>
                  ) : (
                    <>
                      <button onClick={() => setModalConfig({...modalConfig, show: false})} className="flex-1 py-4 bg-zinc-800 text-zinc-400 font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-zinc-700 transition-all">Cancelar</button>
                      <button onClick={modalConfig.action} className={`flex-1 py-4 font-black uppercase text-xs tracking-widest rounded-2xl transition-all ${modalConfig.type === 'confirm_delete' ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-[#10b981] text-black hover:bg-[#059669]'}`}>Confirmar</button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL HISTORIAL */}
      <AnimatePresence>
        {isHistoryOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsHistoryOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, x: 50 }}
              animate={{ scale: 1, opacity: 1, x: 0 }}
              exit={{ scale: 0.9, opacity: 0, x: 50 }}
              className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-10 shadow-2xl overflow-hidden"
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3 text-white">
                    <Clock className="text-blue-400" /> HISTORIAL DE PROTOCOLOS
                  </h3>
                  <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">Registros de sincronización neural</p>
                </div>
                <button onClick={() => setIsHistoryOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-zinc-500 hover:text-white"><X size={20} /></button>
              </div>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {userHistory.length === 0 ? (
                  <div className="text-center py-20 bg-black/20 rounded-3xl border border-zinc-800/50">
                    <Activity className="mx-auto text-zinc-800 mb-4" size={40} />
                    <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">Sin registros previos</p>
                  </div>
                ) : (
                  userHistory.map((h) => (
                    <div key={h.id} className="bg-black/40 border border-zinc-800/50 p-5 rounded-2xl flex items-center justify-between group hover:border-blue-500/30 transition-all">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${h.plan_type === 'yearly' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'}`}>
                          <Zap size={18} />
                        </div>
                        <div className="text-left">
                          <code className="text-xs font-mono font-black text-zinc-200">{h.key_text}</code>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] font-black uppercase text-zinc-500 tracking-tighter">{h.plan_type}</span>
                            <span className="w-1 h-1 rounded-full bg-zinc-800"></span>
                            <span className="text-[9px] font-bold text-zinc-600">${h.price_paid} USD</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-zinc-500 font-black uppercase tracking-tighter">Expiró el</p>
                        <p className="text-[10px] font-bold text-zinc-400">{new Date(h.expires_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <button onClick={() => setIsHistoryOpen(false)} className="w-full mt-8 py-4 bg-zinc-800 text-zinc-400 font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-zinc-700 transition-all">CERRAR REGISTRO</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
