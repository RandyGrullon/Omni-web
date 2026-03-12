// src/components/dashboard/ProfileDrawer.tsx
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, LogOut, Loader2, Key } from 'lucide-react';

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  profile: any;
  formData: any;
  setFormData: (data: any) => void;
  onUpdate: (e: React.FormEvent) => void;
  onSignOut: () => void;
  saving: boolean;
  hasGroqKey?: boolean;
  onSaveGroqKey?: (key: string, confirmKey: string) => void;
  groqKeySaving?: boolean;
  onOpen?: () => void;
}

export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({
  isOpen, onClose, profile, formData, setFormData, onUpdate, onSignOut, saving,
  hasGroqKey = false, onSaveGroqKey, groqKeySaving = false, onOpen
}) => {
  const [groqKey, setGroqKey] = useState('');
  const [groqKeyConfirm, setGroqKeyConfirm] = useState('');

  useEffect(() => {
    if (isOpen) onOpen?.();
  }, [isOpen, onOpen]);
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]" />
          <motion.div 
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25 }}
            className="fixed right-0 top-0 h-full w-full max-w-lg bg-[#0D0D0D] border-l border-[#222] p-8 md:p-12 z-[101] shadow-2xl overflow-y-auto"
          >
            <div className="flex justify-between items-start mb-12">
              <h2 className="text-3xl font-black uppercase tracking-tighter italic">Identity_Hub</h2>
              <button onClick={onClose} className="w-10 h-10 bg-[#111] border border-[#222] rounded-full flex items-center justify-center hover:border-white/20 transition-all text-white"><X size={18} /></button>
            </div>

            <div className="relative mb-12 bg-[#111] border border-[#222] rounded-[2rem] p-8 overflow-hidden">
              <div className="absolute top-6 right-6 bg-[#00FF41]/10 border border-[#00FF41]/30 px-3 py-1.5 rounded-full backdrop-blur-md">
                <span className="text-[9px] font-black text-[#00FF41] uppercase tracking-tighter">Verified Subscriber</span>
              </div>
              <div className="flex items-center gap-6 mb-8 text-left">
                <div className="w-20 h-20 bg-black border-2 border-[#00FF41]/20 rounded-2xl flex items-center justify-center text-3xl font-black text-[#00FF41]">
                  {profile.first_name?.[0]}{profile.last_name?.[0]}
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-white">{profile.username || 'Initializing...'}</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase">{profile.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-[#222] text-left">
                <div>
                  <p className="text-[8px] text-gray-600 font-black uppercase tracking-widest mb-1">Access_Level</p>
                  <p className="text-xs font-bold uppercase text-white">{profile.plan || 'Free'} PROTOCOL</p>
                </div>
                <div>
                  <p className="text-[8px] text-gray-600 font-black uppercase tracking-widest mb-1">Status</p>
                  <p className="text-[10px] font-bold text-[#00FF41]">ACTIVE_SESSION</p>
                </div>
              </div>
            </div>

            <div className="bg-[#111] border border-[#222] rounded-[2rem] p-8 text-left">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-8 flex items-center gap-3">
                <Settings size={16} /> Edit_Neural_ID
              </h3>
              <form onSubmit={onUpdate} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="text" value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    className="bg-black border border-[#222] p-4 rounded-xl text-xs text-white focus:border-[#00FF41] outline-none" placeholder="First Name" required
                  />
                  <input 
                    type="text" value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    className="bg-black border border-[#222] p-4 rounded-xl text-xs text-white focus:border-[#00FF41] outline-none" placeholder="Last Name" required
                  />
                </div>
                <input 
                  type="text" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full bg-black border border-[#222] p-4 rounded-xl text-xs text-[#00FF41] focus:border-[#00FF41] outline-none" placeholder="Username" required
                />
                <div className="flex gap-4 pt-4">
                  <button type="submit" disabled={saving} className="flex-1 bg-[#00FF41] text-black py-4 rounded-xl text-[10px] font-black uppercase hover:bg-[#00D736] transition-all flex items-center justify-center gap-2">
                    {saving ? <Loader2 className="animate-spin" size={14} /> : "Update Identity"}
                  </button>
                  <button type="button" onClick={onSignOut} className="flex-1 bg-red-500/5 text-red-500 border border-red-500/10 py-4 rounded-xl text-[10px] font-black uppercase hover:bg-red-500/10 transition-all flex items-center justify-center gap-2">
                    <LogOut size={14} /> End_Session
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-[#111] border border-[#222] rounded-[2rem] p-8 text-left mt-8">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-3">
                <Key size={16} /> Groq_API_Key
              </h3>
              {hasGroqKey ? (
                <p className="text-[10px] text-[#00FF41] font-bold uppercase mb-4">Key configured. You can change it below.</p>
              ) : (
                <p className="text-[10px] text-gray-500 mb-4">Set your Groq API key to use chat on the web. It is stored encrypted.</p>
              )}
              <div className="space-y-3">
                <input
                  type="password"
                  value={groqKey}
                  onChange={(e) => setGroqKey(e.target.value)}
                  placeholder="Groq API key"
                  className="w-full bg-black border border-[#222] p-4 rounded-xl text-xs text-white placeholder-gray-500 focus:border-[#00FF41] outline-none"
                  autoComplete="off"
                />
                <input
                  type="password"
                  value={groqKeyConfirm}
                  onChange={(e) => setGroqKeyConfirm(e.target.value)}
                  placeholder="Confirm key (optional)"
                  className="w-full bg-black border border-[#222] p-4 rounded-xl text-xs text-white placeholder-gray-500 focus:border-[#00FF41] outline-none"
                  autoComplete="off"
                />
                <button
                  type="button"
                  disabled={groqKeySaving || !groqKey.trim()}
                  onClick={() => onSaveGroqKey?.(groqKey, groqKeyConfirm)}
                  className="w-full bg-[#00FF41]/10 border border-[#00FF41]/30 text-[#00FF41] py-3 rounded-xl text-[10px] font-black uppercase hover:bg-[#00FF41]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {groqKeySaving ? <Loader2 className="animate-spin" size={14} /> : null} Verify and save
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
