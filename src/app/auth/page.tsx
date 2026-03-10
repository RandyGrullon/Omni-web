// src/app/auth/page.tsx
"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, Loader2 } from 'lucide-react';

function AuthContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [mounted, setMounted] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const next = searchParams.get('next');
  const plan = searchParams.get('plan');

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Debug log para ver si las variables llegan al navegador
    console.log("Supabase URL Configurada:", !!process.env.NEXT_PUBLIC_SUPABASE_URL);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (next && plan) {
          router.push(`${next}?plan=${plan}`);
        } else {
          router.push('/dashboard');
        }
      } else {
        if (password !== confirmPassword) {
          throw new Error("PASSWORDS DO NOT MATCH");
        }
        
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: { 
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              first_name: firstName,
              last_name: lastName
            }
          }
        });
        if (error) throw error;
        setMessage('PROTOCOL CREATED. CHECK EMAIL.');
      }
    } catch (err: any) {
      console.error("Auth error details:", err);
      if (err.message === "Failed to fetch") {
        setMessage("NETWORK ERROR: COULD NOT CONNECT TO AUTH SERVER. CHECK ENV VARIABLES.");
      } else {
        setMessage(err.message.toUpperCase());
      }
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return <div className="min-h-screen bg-[#0D0D0D]" />;

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center p-6 font-mono">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-[#111] border border-[#222] p-10 rounded-3xl z-10 shadow-2xl"
      >
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-16 h-16 bg-[#00FF41]/10 rounded-full flex items-center justify-center border border-[#00FF41]/20 mb-6">
            <Shield className="text-[#00FF41]" size={32} />
          </div>
          <h1 className="text-3xl font-black tracking-tighter uppercase">Neural_ID</h1>
          <p className="text-gray-500 text-[10px] tracking-[0.3em] uppercase mt-2">
            {next ? 'AUTHENTICATION REQUIRED TO INITIALIZE ACCESS' : 'OMNI NETWORK AUTHENTICATION'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-500 tracking-widest uppercase ml-1">First Name</label>
                <input 
                  type="text" 
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="NAME"
                  className="w-full bg-[#080808] border border-[#222] py-3 px-4 rounded-xl focus:border-[#00FF41] outline-none transition-all text-xs"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-500 tracking-widest uppercase ml-1">Last Name</label>
                <input 
                  type="text" 
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="SURNAME"
                  className="w-full bg-[#080808] border border-[#222] py-3 px-4 rounded-xl focus:border-[#00FF41] outline-none transition-all text-xs"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[9px] font-bold text-gray-500 tracking-widest uppercase ml-1">Protocol Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3 text-gray-600" size={16} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="USER@NETWORK.HEX"
                className="w-full bg-[#080808] border border-[#222] py-3 pl-10 pr-4 rounded-xl focus:border-[#00FF41] outline-none transition-all text-xs"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-bold text-gray-500 tracking-widest uppercase ml-1">Security Key</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3 text-gray-600" size={16} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#080808] border border-[#222] py-3 pl-10 pr-4 rounded-xl focus:border-[#00FF41] outline-none transition-all text-xs"
                required
              />
            </div>
          </div>

          {!isLogin && (
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-gray-500 tracking-widest uppercase ml-1">Confirm Key</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3 text-gray-600" size={16} />
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#080808] border border-[#222] py-3 pl-10 pr-4 rounded-xl focus:border-[#00FF41] outline-none transition-all text-xs"
                  required
                />
              </div>
            </div>
          )}

          {message && (
            <div className={`p-4 rounded-xl text-[10px] font-bold uppercase tracking-widest text-center ${message.includes('CREATED') ? 'bg-[#00FF41]/10 text-[#00FF41]' : 'bg-red-500/10 text-red-500'}`}>
              {message}
            </div>
          )}

          <button 
            disabled={loading}
            className="w-full py-4 bg-[#00FF41] text-black font-black text-xs tracking-[0.3em] uppercase rounded-xl hover:shadow-[0_0_30px_rgba(0,255,65,0.3)] transition-all flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : (isLogin ? 'AUTHORIZE ACCESS' : 'CREATE PROTOCOL')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-[10px] text-gray-500 hover:text-white transition-colors uppercase tracking-widest font-bold"
          >
            {isLogin ? "Need a new Neural ID? Register" : "Already have an ID? Login"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="bg-[#0D0D0D] min-h-screen" />}>
      <AuthContent />
    </Suspense>
  );
}
