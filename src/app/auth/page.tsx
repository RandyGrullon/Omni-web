// src/app/auth/page.tsx
"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, Loader2 } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { NeuralModal } from '@/components/ui/NeuralModal';

function AuthContent() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [modal, setModal] = useState<{ show: boolean; title: string; message: string; type: 'error' | 'info' | 'success' }>({
    show: false,
    title: '',
    message: '',
    type: 'info'
  });
  
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

    try {
      if (!isLogin) {
        if (password.length < 6) {
          throw new Error("SECURITY_PROTOCOL_ERROR: PASSWORD MUST BE AT LEAST 6 CHARACTERS");
        }
        if (password !== confirmPassword) {
          throw new Error("SYNC_ERROR: PASSWORDS DO NOT MATCH");
        }
      }

      if (isLogin) {
        const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) {
          if (error.message.toLowerCase().includes('invalid login credentials')) {
            setModal({
              show: true,
              type: 'error',
              title: 'IDENTITY_NOT_FOUND',
              message: 'The neural ID entered does not exist in our global registry. Please verify your email or create a new identity.'
            });
            setLoading(false);
            return;
          }
          throw error;
        }

        // FORZAR SINCRONIZACIÓN DE PERFIL AL LOGUEARSE
        if (authData.user) {
          const { data: profile } = await supabase.from('profiles').select('id').eq('id', authData.user.id).single();
          if (!profile) {
            await supabase.from('profiles').insert({
              id: authData.user.id,
              email: authData.user.email,
              first_name: authData.user.email?.split('@')[0],
              username: authData.user.email?.split('@')[0],
              plan: 'free'
            });
          }
        }

        toast("Neural Identity Authorized", "success");
        if (next && plan) {
          router.push(`${next}?plan=${plan}`);
        } else {
          router.push('/dashboard');
        }
      } else {
        const { data: signUpData, error } = await supabase.auth.signUp({ 
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
        
        if (error) {
          if (error.message.toLowerCase().includes('user already registered')) {
            setModal({
              show: true,
              type: 'info',
              title: 'IDENTITY_EXISTS',
              message: 'This neural protocol is already active in our network. Please switch to the login interface to authorize access.'
            });
            setLoading(false);
            return;
          }
          throw error;
        }

        // CREAR PERFIL PREVENTIVO AL REGISTRARSE
        if (signUpData.user) {
          await supabase.from('profiles').insert({
            id: signUpData.user.id,
            email: signUpData.user.email,
            first_name: firstName || email.split('@')[0],
            last_name: lastName || 'User',
            username: email.split('@')[0],
            plan: 'free'
          });
        }

        setModal({
          show: true,
          type: 'success',
          title: 'PROTOCOL_INITIALIZED',
          message: 'Your neural identity has been created. A verification link has been transmitted to your email address.'
        });
        setIsLogin(true);
      }
    } catch (err: any) {
      console.error("Auth error details:", err);
      const errorMsg = err.message === "Failed to fetch" 
        ? "NETWORK_OFFLINE: CHECK CONNECTION" 
        : err.message.toUpperCase();
      toast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    
    // El punto de redirección después del login es nuestra nueva ruta de servidor
    const callbackUrl = `${window.location.origin}/auth/callback`;
    
    // Si hay un 'next' (ej. para checkout), lo pasamos como parámetro a nuestra ruta de callback
    const redirectTo = next && plan 
      ? `${callbackUrl}?next=${encodeURIComponent(`${next}?plan=${plan}`)}` 
      : callbackUrl;
      
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });
      if (error) throw error;
    } catch (err: any) {
      console.error("Google Auth error:", err);
      toast(err.message.toUpperCase(), "error");
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

        <div className="space-y-4">
          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-4 bg-white text-black font-black text-xs tracking-[0.3em] uppercase rounded-xl hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all flex items-center justify-center gap-3 border border-zinc-200"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            AUTHORIZE WITH GOOGLE
          </button>

          <div className="flex items-center gap-4 my-6">
            <div className="h-px bg-zinc-800 flex-1" />
            <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">OR</span>
            <div className="h-px bg-zinc-800 flex-1" />
          </div>
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

      <NeuralModal 
        isOpen={modal.show} 
        onClose={() => setModal({ ...modal, show: false })}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />
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
