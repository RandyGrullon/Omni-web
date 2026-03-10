// src/app/complete-profile/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function CompleteProfilePage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profile?.first_name && profile?.last_name) {
      router.push('/dashboard'); // Ya está completo
    }
    setChecking(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName
        })
        .eq('id', user.id);

      if (!error) {
        router.push('/dashboard');
      } else {
        alert("Error: " + error.message);
      }
    }
    setLoading(false);
  };

  if (checking) return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><Loader2 className="text-[#00FF41] animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6 font-mono relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-[#0D0D0D] border border-white/5 p-12 rounded-[2.5rem] relative z-10 shadow-2xl"
      >
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-16 h-16 bg-[#00FF41]/10 rounded-full flex items-center justify-center border border-[#00FF41]/20 mb-6">
            <User className="text-[#00FF41]" size={32} />
          </div>
          <h1 className="text-3xl font-black tracking-tighter uppercase italic">Identity_Required</h1>
          <p className="text-gray-500 text-[10px] tracking-[0.3em] uppercase mt-2 leading-loose">
            To initialize the ARCHITECT protocol, you must identify yourself within the network.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-gray-600 tracking-widest uppercase ml-1">Legal First Name</label>
            <input 
              type="text" 
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full bg-black border border-white/5 py-4 px-5 rounded-2xl focus:border-[#00FF41] outline-none transition-all text-xs font-bold"
              placeholder="FIRST_NAME"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-gray-600 tracking-widest uppercase ml-1">Legal Last Name</label>
            <input 
              type="text" 
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full bg-black border border-white/5 py-4 px-5 rounded-2xl focus:border-[#00FF41] outline-none transition-all text-xs font-bold"
              placeholder="SURNAME"
              required
            />
          </div>

          <button 
            disabled={loading}
            className="w-full py-5 bg-[#00FF41] text-black font-black text-xs tracking-[0.3em] uppercase rounded-2xl hover:shadow-[0_0_40px_rgba(0,255,65,0.3)] transition-all flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : (
              <>AUTHORIZE IDENTITY <ArrowRight size={16} /></>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
