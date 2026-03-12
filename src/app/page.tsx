// src/app/page.tsx
"use client";

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Zap, Layers, ChevronRight, Check, User, 
  Cpu, Globe, Lock, Terminal, Activity, ChevronDown, LogOut, LayoutDashboard, Mail, HardDrive, Menu, X
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    // Si Google OAuth redirigió aquí con tokens en el hash (#access_token=...), enviar a /auth/callback
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    if (hash && hash.includes('access_token')) {
      const search = typeof window !== 'undefined' ? window.location.search : '';
      router.replace(`/auth/callback${search}${hash}`);
      return;
    }
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      const currentUser = data.session?.user || null;
      setUser(currentUser);

      if (currentUser) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();
        setProfile(profileData);
      }
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
    await supabase.auth.signOut();
    setUser(null);
    setShowUserMenu(false);
    router.refresh();
  };

  const handleAccessClick = async (plan: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push(`/auth?next=/checkout&plan=${plan}`);
      return;
    }
    const { data: profile } = await supabase.from('profiles').select('first_name, last_name').eq('id', session.user.id).single();
    if (!profile?.first_name || !profile?.last_name) {
      router.push(`/complete-profile?plan=${plan}`);
    } else {
      router.push(`/checkout?plan=${plan}`);
    }
  };

  if (!mounted) return <div className="bg-[#050505] min-h-screen" />;

  const hasAccess = !!profile?.purchase_id || profile?.plan === 'architect';

  const navLinks = [
    { name: 'Performance', href: '#benchmarks' },
    { name: 'Specs', href: '#specs' },
    { name: 'Pricing', href: '#pricing' },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-[#E0E0E0] font-mono selection:bg-[#00FF41] selection:text-black overflow-x-hidden">
      <div className="fixed inset-0 z-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <nav className="flex justify-between items-center px-6 md:px-8 py-6 border-b border-white/5 sticky top-0 bg-[#050505]/80 backdrop-blur-xl z-50">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-[#00FF41] flex items-center justify-center rounded-sm rotate-45 shadow-[0_0_20px_rgba(0,255,65,0.4)]">
            <Activity className="text-black -rotate-45" size={16} />
          </div>
          <div className="text-xl font-black tracking-tighter text-white uppercase italic">
            Omni<span className="text-[#00FF41]">HUD</span>
          </div>
        </div>
        
        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-10 text-[9px] uppercase tracking-[0.4em] font-black">
          {navLinks.map((link) => (
            <a key={link.name} href={link.href} className="text-gray-500 hover:text-[#00FF41] transition-all">{link.name}</a>
          ))}
          
          {hasAccess && (
            <Link href="/dashboard" className="text-[#00FF41] hover:text-[#00FF41]/80 transition-all border-b border-[#00FF41]/30 pb-1">
              [ DASHBOARD ]
            </Link>
          )}
          
          {user ? (
            <div className="relative" ref={menuRef}>
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={`flex items-center gap-3 px-5 py-2 rounded-full border transition-all ${showUserMenu ? 'border-[#00FF41] bg-[#00FF41]/10' : 'border-white/10 bg-white/5'}`}
              >
                <span className="text-white tracking-widest">{user.email.split('@')[0]}</span>
                <ChevronDown size={12} />
              </button>
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 mt-4 w-56 bg-[#0D0D0D] border border-white/10 rounded-xl p-2 shadow-2xl">
                    <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 hover:bg-[#00FF41]/10 hover:text-[#00FF41] rounded-lg transition-all">
                      <LayoutDashboard size={14} /> Dashboard
                    </Link>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 text-red-500 rounded-lg transition-all text-left">
                      <LogOut size={14} /> Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link href="/auth" className="text-gray-500 hover:text-white">[ ID_LOGIN ]</Link>
          )}
          
          <button 
            onClick={() => handleAccessClick('pro')}
            className="px-6 py-2.5 bg-[#00FF41] text-black rounded-sm hover:shadow-[0_0_30px_rgba(0,255,65,0.4)] transition-all font-black text-[10px] tracking-widest"
          >
            GET_PRO
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="md:hidden p-2 text-[#00FF41] hover:bg-[#00FF41]/10 rounded-lg transition-all"
        >
          <Menu size={24} />
        </button>
      </nav>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-80 bg-[#0D0D0D] border-l border-white/10 z-[70] p-8 flex flex-col md:hidden shadow-[-20px_0_50px_rgba(0,0,0,0.5)]"
            >
              <div className="flex justify-between items-center mb-12">
                <div className="text-lg font-black text-white italic">NAVIGATION</div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-gray-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <div className="flex flex-col gap-8">
                {navLinks.map((link) => (
                  <a 
                    key={link.name} 
                    href={link.href} 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-xl font-black tracking-[0.2em] text-gray-400 hover:text-[#00FF41] transition-all uppercase"
                  >
                    {link.name}
                  </a>
                ))}
                <div className="h-[1px] w-full bg-white/5 my-4" />
                
                {user ? (
                  <>
                    <Link 
                      href="/dashboard" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-4 text-lg font-bold text-gray-300 hover:text-[#00FF41] transition-all"
                    >
                      <LayoutDashboard size={20} /> DASHBOARD
                    </Link>
                    <button 
                      onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                      className="flex items-center gap-4 text-lg font-bold text-red-500/80 hover:text-red-500 transition-all text-left"
                    >
                      <LogOut size={20} /> TERMINATE_SESSION
                    </button>
                  </>
                ) : (
                  <Link 
                    href="/auth" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-lg font-bold text-gray-300 hover:text-[#00FF41] transition-all"
                  >
                    [ ID_LOGIN_INTERFACE ]
                  </Link>
                )}
              </div>

              <div className="mt-auto">
                <button 
                  onClick={() => { handleAccessClick('pro'); setIsMobileMenuOpen(false); }}
                  className="w-full py-5 bg-[#00FF41] text-black font-black text-xs tracking-[0.3em] uppercase shadow-[0_0_30px_rgba(0,255,65,0.3)]"
                >
                  AUTHORIZE_PRO
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <header className="relative pt-32 md:pt-48 pb-32 px-6 flex flex-col items-center text-center z-10">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="inline-flex items-center gap-2 mb-10 px-5 py-2 border border-[#00FF41]/20 bg-[#00FF41]/5 rounded-full italic">
            <div className="w-1.5 h-1.5 bg-[#00FF41] rounded-full animate-pulse" />
            <span className="text-[#00FF41] text-[10px] font-black tracking-[0.5em] uppercase">NEURAL_INTERFACE_READY</span>
          </div>
          <h1 className="text-5xl md:text-[140px] font-black mb-8 tracking-tighter text-white leading-none italic uppercase">
            THE GHOST<br/><span className="text-[#00FF41] drop-shadow-[0_0_30px_rgba(0,255,65,0.3)]">AI_PROTOCOL</span>
          </h1>
          <p className="max-w-xl text-gray-500 text-xs md:text-sm mb-16 font-bold tracking-widest mx-auto uppercase leading-relaxed italic border-l-2 border-[#00FF41] pl-6">
            Zero-latency invisible HUD. <br/>Designed for engineers, architects and high-performance operators.
          </p>
          <button 
            onClick={() => hasAccess ? router.push('/dashboard') : handleAccessClick('pro')} 
            className="px-12 py-6 bg-[#00FF41] text-black font-black text-xs tracking-[0.5em] hover:shadow-[0_0_60px_rgba(0,255,65,0.5)] active:scale-95 transition-all skew-x-[-12deg]"
          >
            {hasAccess ? 'GO TO DASHBOARD' : 'INITIALIZE_SYSTEM_DEPLOYMENT'}
          </button>
        </motion.div>
      </header>

      {/* Benchmarks Section */}
      <section id="benchmarks" className="py-32 px-6 bg-white/[0.01] border-y border-white/5 relative">
        <div className="max-w-5xl mx-auto">
          <div className="mb-20">
            <h2 className="text-3xl font-black italic tracking-tighter mb-4 uppercase">System_Performance</h2>
            <p className="text-gray-500 text-[10px] tracking-[0.3em] uppercase">Hardware optimization comparison vs industry standard.</p>
          </div>
          
          <div className="space-y-16">
            <BenchmarkBar label="RAM_CONSUMPTION" omni={150} other={1200} unit="MB" otherLabel="Chrome (3 tabs)" />
            <BenchmarkBar label="CPU_IDLE_LOAD" omni={0.1} other={8.5} unit="%" otherLabel="Discord" />
            <BenchmarkBar label="RESPONSE_LATENCY" omni={450} other={2800} unit="ms" otherLabel="Standard GPT-4" />
          </div>
        </div>
      </section>

      {/* Specs Section */}
      <section id="specs" className="py-32 px-6 max-w-6xl mx-auto grid md:grid-cols-3 gap-12 text-left">
        <SpecCard icon={<Cpu className="text-[#00FF41]" />} title="LPU POWERED" desc="Groq LPU architecture for near-instant inference speeds. 500+ tokens/sec." />
        <SpecCard icon={<Shield className="text-[#00FF41]" />} title="GHOST MODE" desc="Completely invisible to OBS, Discord and screen recording software." />
        <SpecCard icon={<Globe className="text-[#00FF41]" />} title="NEURAL SEARCH" desc="Live internet access integration. Real-time data synthesis from the web." />
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-6 max-w-5xl mx-auto text-center">
        <div className="grid md:grid-cols-2 gap-12">
          <div className="p-10 md:p-16 border border-white/10 rounded-[3rem] text-left hover:border-white/20 transition-all group relative overflow-hidden">
            <div className="text-[10px] font-black text-gray-600 tracking-[0.5em] mb-6">PROTOCOL_FREE</div>
            <div className="text-6xl font-black mb-12 italic tracking-tighter text-white opacity-40">$0<span className="text-sm font-normal not-italic tracking-normal">/mo</span></div>
            <ul className="space-y-6 mb-16 text-[10px] font-bold text-gray-500 uppercase tracking-widest italic">
              <li className="flex gap-3"><Check size={14} className="text-[#00FF41]" /> 1 Neural Context</li>
              <li className="flex gap-3"><Check size={14} className="text-[#00FF41]" /> Llama 3.3 Engine</li>
              <li className="flex gap-3"><Check size={14} className="text-[#00FF41]" /> Basic Audio Bus</li>
            </ul>
            <button onClick={() => handleAccessClick('free')} className="w-full py-5 border border-white/10 text-white font-black text-[10px] tracking-[0.4em] uppercase hover:bg-white hover:text-black transition-all">INITIALIZE_FREE</button>
          </div>

          <div className="p-10 md:p-16 border-2 border-[#00FF41] bg-[#00FF41]/5 rounded-[3rem] text-left shadow-[0_0_80px_rgba(0,255,65,0.1)] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10"><Zap size={100} className="text-[#00FF41]" /></div>
            <div className="text-[10px] font-black text-[#00FF41] tracking-[0.5em] mb-6">PROTOCOL_ARCHITECT</div>
            <div className="text-7xl font-black mb-12 italic tracking-tighter text-white">$20<span className="text-sm font-normal not-italic tracking-normal text-gray-500">/mo</span></div>
            <ul className="space-y-6 mb-16 text-[10px] font-bold text-[#E0E0E0] uppercase tracking-widest italic">
              <li className="flex gap-3"><Zap size={14} className="text-[#00FF41]" /> UNLIMITED CONTEXTS</li>
              <li className="flex gap-3"><Zap size={14} className="text-[#00FF41]" /> VISION AI / OCR MODULE</li>
              <li className="flex gap-3"><Zap size={14} className="text-[#00FF41]" /> LIVE WEB SYNTHESIS</li>
              <li className="flex gap-3"><Zap size={14} className="text-[#00FF41]" /> WASAPI LOOPBACK AUDIO</li>
            </ul>
            <button onClick={() => handleAccessClick('pro')} className="w-full py-6 bg-[#00FF41] text-black font-black text-[10px] tracking-[0.4em] uppercase shadow-[0_0_40px_rgba(0,255,65,0.3)] hover:scale-105 transition-all">AUTHORIZE_FULL_LINK</button>
          </div>
        </div>
      </section>

      <footer className="py-24 border-t border-white/5 text-center">
        <div className="text-[10px] tracking-[0.8em] text-gray-700 uppercase font-black italic">OMNI HUD // HIGH PERFORMANCE AI PROTOCOL © 2026</div>
      </footer>
    </div>
  );
}

function BenchmarkBar({ label, omni, other, unit, otherLabel }: any) {
  const percentage = (omni / other) * 100;
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-black tracking-widest text-gray-400">{label}</span>
        <span className="text-[9px] font-bold text-[#00FF41] uppercase">Optimized Efficiency</span>
      </div>
      <div className="h-12 w-full bg-white/[0.02] border border-white/5 relative p-1 rounded-sm overflow-hidden">
        {/* Other App Bar */}
        <motion.div initial={{ width: 0 }} whileInView={{ width: '100%' }} transition={{ duration: 1.5 }} className="absolute inset-y-0 left-0 bg-white/[0.05]" />
        {/* Omni Bar */}
        <motion.div initial={{ width: 0 }} whileInView={{ width: `${percentage}%` }} transition={{ duration: 1.5, delay: 0.2 }} className="absolute inset-y-0 left-0 bg-[#00FF41] shadow-[0_0_20px_rgba(0,255,65,0.5)]" />
        
        <div className="relative flex justify-between items-center h-full px-4 text-[10px] font-black uppercase tracking-widest">
          <span className="text-black">OMNI: {omni}{unit}</span>
          <span className="text-gray-600">{otherLabel}: {other}{unit}</span>
        </div>
      </div>
    </div>
  );
}

function SpecCard({ icon, title, desc }: any) {
  return (
    <div className="p-8 border border-white/5 hover:bg-white/[0.02] transition-all rounded-2xl group">
      <div className="mb-6 p-3 bg-white/[0.03] w-fit rounded-lg group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="text-xs font-black tracking-[0.2em] mb-4 uppercase text-white italic">{title}</h3>
      <p className="text-[10px] text-gray-500 leading-loose uppercase tracking-widest font-bold">{desc}</p>
    </div>
  );
}
