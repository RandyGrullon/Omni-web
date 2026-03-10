// src/app/page.tsx
"use client";

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Zap, Layers, ChevronRight, Check, User, 
  Cpu, Globe, Lock, Terminal, Activity, ChevronDown, LogOut, LayoutDashboard, Mail
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user || null);
    };
    getSession();

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      // Llamar al endpoint de logout formal
      await fetch('/auth/signout', { method: 'POST' });
      // También limpiar cliente local por si acaso
      await supabase.auth.signOut();
      setUser(null);
      setShowUserMenu(false);
      router.refresh();
      window.location.href = '/'; // Forzar limpieza total
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleAccessClick = (plan: string) => {
    if (!user) {
      router.push(`/auth?next=/checkout&plan=${plan}`);
    } else {
      router.push(`/checkout?plan=${plan}`);
    }
  };

  if (!mounted) return <div className="bg-[#050505] min-h-screen" />;

  return (
    <div className="min-h-screen bg-[#050505] text-[#E0E0E0] font-mono selection:bg-[#00FF41] selection:text-black overflow-x-hidden">
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

      <nav className="flex justify-between items-center px-8 py-6 border-b border-white/5 sticky top-0 bg-[#050505]/60 backdrop-blur-2xl z-50">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-[#00FF41] flex items-center justify-center rounded-sm rotate-45">
            <Activity className="text-black -rotate-45" size={16} />
          </div>
          <div className="text-xl font-black tracking-tighter text-white">
            OMNI<span className="text-[#00FF41]">HUD</span>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-10 text-[10px] uppercase tracking-[0.3em] font-black">
          <a href="#specs" className="text-gray-500 hover:text-[#00FF41] transition-all">Architecture</a>
          <a href="#pricing" className="text-gray-500 hover:text-[#00FF41] transition-all">Network_Access</a>
          
          {user ? (
            <div className="relative" ref={menuRef}>
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={`flex items-center gap-3 px-5 py-2.5 rounded-full transition-all duration-300 border ${showUserMenu ? 'border-[#00FF41] bg-[#00FF41]/10 text-white shadow-[0_0_20px_rgba(0,255,65,0.2)]' : 'border-white/10 bg-white/5 text-gray-400 hover:border-[#00FF41]/40 hover:text-[#00FF41]'}`}
              >
                <div className="w-5 h-5 bg-gradient-to-tr from-[#00FF41] to-[#00A3FF] rounded-full flex items-center justify-center">
                  <User size={12} className="text-black" />
                </div>
                <span className="tracking-widest">ID_AUTH</span>
                <ChevronDown size={14} className={`transition-transform duration-500 ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                    className="absolute right-0 mt-4 w-64 bg-[#0D0D0D]/95 backdrop-blur-2xl border border-[#00FF41]/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_30px_rgba(0,255,65,0.05)] z-50 overflow-hidden"
                  >
                    {/* Glowing Top Line */}
                    <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#00FF41] to-transparent opacity-50" />
                    
                    <div className="p-5 border-b border-white/5 bg-white/[0.02]">
                      <div className="flex items-center gap-3 mb-1">
                        <Mail size={10} className="text-[#00FF41]" />
                        <span className="text-[8px] font-black text-gray-500 tracking-[0.2em] uppercase">Authenticated_As</span>
                      </div>
                      <p className="text-[11px] text-white font-bold truncate tracking-wide">{user.email}</p>
                    </div>

                    <div className="p-2">
                      <Link 
                        href="/dashboard" 
                        className="group flex items-center justify-between px-4 py-3 text-[10px] font-black text-gray-400 hover:text-[#00FF41] hover:bg-[#00FF41]/5 rounded-xl transition-all uppercase tracking-widest"
                      >
                        <div className="flex items-center gap-3">
                          <LayoutDashboard size={14} className="group-hover:rotate-12 transition-transform" />
                          Dashboard_Panel
                        </div>
                        <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                      
                      <button 
                        onClick={handleLogout}
                        className="group w-full flex items-center justify-between px-4 py-3 text-[10px] font-black text-red-500/70 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all uppercase tracking-widest mt-1"
                      >
                        <div className="flex items-center gap-3">
                          <LogOut size={14} className="group-hover:translate-x-[-2px] transition-transform" />
                          Terminate_Session
                        </div>
                      </button>
                    </div>

                    {/* Bottom Status */}
                    <div className="px-5 py-3 bg-[#00FF41]/5 flex items-center gap-2 border-t border-white/5">
                      <div className="w-1 h-1 bg-[#00FF41] rounded-full animate-pulse" />
                      <span className="text-[7px] font-black text-[#00FF41] tracking-[0.3em]">SECURE_NODE_ACTIVE</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link href="/auth" className="text-gray-500 hover:text-white transition-colors">
              [ LOGIN_INTERFACE ]
            </Link>
          )}
          
          <button 
            onClick={() => handleAccessClick('pro')}
            className="px-6 py-2.5 bg-[#00FF41] text-black rounded-sm hover:shadow-[0_0_30px_rgba(0,255,65,0.4)] transition-all font-black text-[10px] tracking-widest"
          >
            GET_PRO
          </button>
        </div>
      </nav>

      {/* Resto de la página permanece igual */}
      <header className="relative pt-40 pb-32 px-6 flex flex-col items-center text-center z-10">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 mb-8 px-4 py-1.5 border border-[#00FF41]/20 bg-[#00FF41]/5 rounded-full mx-auto w-fit italic">
            <div className="w-1.5 h-1.5 bg-[#00FF41] rounded-full animate-pulse" />
            <span className="text-[#00FF41] text-[9px] font-black tracking-[0.4em] uppercase">Status: Connection Stable</span>
          </div>
          <h1 className="text-6xl md:text-[120px] font-black mb-8 tracking-tighter text-white uppercase leading-none italic">THE GHOST<br/><span className="text-[#00FF41]">AI_ENGINE</span></h1>
          <p className="max-w-2xl text-gray-500 text-lg mb-12 font-medium tracking-tight mx-auto uppercase leading-relaxed">High-performance invisible HUD designed for the top 1%.</p>
          <div className="flex gap-6 justify-center">
            <button onClick={() => handleAccessClick('pro')} className="px-10 py-5 bg-[#00FF41] text-black font-black text-sm tracking-[0.3em] hover:shadow-[0_0_50px_rgba(0,255,65,0.4)] transition-all">INITIALIZE_DOWNLOAD</button>
          </div>
        </motion.div>
      </header>

      {/* Pricing - Versión completa */}
      <section id="pricing" className="py-32 px-6 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-10">
          <PriceCard title="OPERATOR" price="0" features={["1 Chat Context", "System Audio", "Groq Llama 3.3"]} btnText="SELECT_FREE" onClick={() => handleAccessClick('free')} />
          <PriceCard title="ARCHITECT" price="29" features={["Unlimited Contexts", "Full WASAPI Loopback", "Vision AI Logic", "Neon Customization"]} highlight btnText="SELECT_PRO" onClick={() => handleAccessClick('pro')} />
        </div>
      </section>

      <footer className="py-20 border-t border-white/5 text-center text-gray-600 text-[10px] tracking-[0.5em] uppercase">© 2026 // OMNI HUD PROTOCOL</footer>
    </div>
  );
}

function PriceCard({ title, price, features, highlight = false, btnText, onClick }: any) {
  return (
    <div className={`p-16 border ${highlight ? 'border-[#00FF41] bg-[#00FF41]/5 shadow-[0_0_50px_rgba(0,255,65,0.05)]' : 'border-white/5'} text-left flex flex-col transition-all hover:bg-[#00FF41]/5 rounded-3xl group`}>
      <div className="text-[9px] font-black tracking-[0.5em] text-gray-500 mb-4 uppercase">{title}_LOG</div>
      <div className="text-6xl font-black mb-12 text-white italic tracking-tighter">${price}<span className="text-sm font-normal text-gray-600 not-italic tracking-normal">/mo</span></div>
      <ul className="space-y-6 mb-16 flex-1">
        {features.map((f: any, i: number) => (
          <li key={i} className="flex items-start gap-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest italic"><Check size={14} className="text-[#00FF41] shrink-0" /> {f}</li>
        ))}
      </ul>
      <button onClick={onClick} className={`w-full py-5 font-black text-[10px] tracking-[0.4em] uppercase transition-all ${highlight ? 'bg-[#00FF41] text-black shadow-[0_0_30px_rgba(0,255,65,0.2)]' : 'border border-white/10 text-white hover:border-white'}`}>{btnText}</button>
    </div>
  );
}
