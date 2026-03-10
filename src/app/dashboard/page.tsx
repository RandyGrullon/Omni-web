// src/app/dashboard/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  Key, 
  Terminal, 
  ShieldCheck, 
  AlertCircle, 
  User, 
  Settings, 
  LogOut, 
  Check, 
  X,
  Loader2,
  Mail,
  UserCircle
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: ''
  });

  const router = useRouter();

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (data) {
        setProfile(data);
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || ''
        });
      }
    }
    setLoading(false);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name
        })
        .eq('id', user.id);
      
      if (!error) {
        setProfile({ ...profile, ...formData });
        setEditing(false);
      } else {
        alert("Error updating profile: " + error.message);
      }
    }
    setSaving(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const [redeemKey, setRedeemKey] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setRedeeming(true);
    
    try {
      // 1. Verificar si la clave existe y no ha sido usada
      const { data: keyData, error: keyError } = await supabase
        .from('license_keys')
        .select('*')
        .eq('key_text', redeemKey.trim())
        .eq('is_used', false)
        .single();

      if (keyError || !keyData) {
        throw new Error("Invalid or already used key.");
      }

      // 2. Verificar si la clave ha expirado
      if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
        throw new Error("This key has expired.");
      }

      // 3. Actualizar perfil del usuario
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User session not found.");

      const daysToAdd = keyData.plan_type === 'monthly' ? 30 : 365;
      const newExpiry = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000);

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          plan: keyData.plan_type,
          plan_expires_at: newExpiry.toISOString(),
          purchase_id: keyData.key_text // Usamos la clave como ID de compra para activar descarga
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 4. Marcar clave como usada
      await supabase
        .from('license_keys')
        .update({ is_used: true, used_by_email: user.email })
        .eq('id', keyData.id);

      alert("PROTOCOL SYNCHRONIZED. ACCESS GRANTED.");
      window.location.reload(); // Recargar para activar dashboard
    } catch (err: any) {
      alert(err.message.toUpperCase());
    } finally {
      setRedeeming(false);
    }
  };

  const handleDownload = async () => {
    try {
      const { data, error } = await supabase
        .storage
        .from('omni-installers')
        .createSignedUrl('Omni_HUD_LiteSetup.exe', 60); // Link válido por 60 segundos

      if (error) throw error;

      // Crear un link temporal y hacer clic programáticamente
      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.download = 'Omni_HUD_Setup.exe';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert("DOWNLOAD ERROR: " + err.message.toUpperCase());
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
      <Loader2 className="text-[#00FF41] animate-spin" size={40} />
    </div>
  );

  if (!profile || !profile.purchase_id) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col items-center justify-center p-6 text-center font-mono relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none" />
        <AlertCircle size={64} className="text-[#00FF41]/50 mb-8" />
        <h1 className="text-4xl font-black mb-4 uppercase tracking-tighter">Initialize Access</h1>
        <p className="text-gray-500 max-w-md mb-10 uppercase text-[10px] tracking-[0.3em] leading-loose">
          Enter your Neural_Auth_Key to synchronize your profile with the Omni Network.
        </p>
        
        <form onSubmit={handleRedeem} className="w-full max-w-sm space-y-4 z-10">
          <input 
            type="text" 
            placeholder="OMNI-XXXX-XXXX-XXXX"
            value={redeemKey}
            onChange={(e) => setRedeemKey(e.target.value.toUpperCase())}
            className="w-full bg-[#111] border border-[#222] p-5 rounded-2xl text-center font-bold tracking-widest text-[#00FF41] outline-none focus:border-[#00FF41]/50 transition-all"
            required
          />
          <button 
            type="submit"
            disabled={redeeming}
            className="w-full py-5 bg-white text-black font-black uppercase text-xs tracking-widest hover:bg-[#00FF41] transition-all flex items-center justify-center gap-2"
          >
            {redeeming ? <Loader2 className="animate-spin" size={16} /> : "Validate Protocol"}
          </button>
        </form>

        <Link href="/#pricing" className="mt-8 text-gray-600 hover:text-white text-[10px] uppercase tracking-widest transition-colors">
          Don't have a key? Get one here
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white font-mono p-6 md:p-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Navigation / Header */}
        <div className="flex justify-between items-center mb-16 border-b border-[#222] pb-8 uppercase relative">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#00FF41]/10 rounded-xl flex items-center justify-center border border-[#00FF41]/20">
              <ShieldCheck className="text-[#00FF41]" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#00FF41] tracking-tighter">Access_Granted</h1>
              <p className="text-gray-500 text-[9px] mt-1 tracking-widest">Protocol: {profile.plan}</p>
            </div>
          </div>

          <div className="relative">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-12 h-12 bg-[#111] border border-[#222] rounded-xl flex items-center justify-center hover:border-[#00FF41]/50 transition-all group"
            >
              <User size={20} className="text-gray-400 group-hover:text-[#00FF41] transition-colors" />
            </button>

            <AnimatePresence>
              {isProfileOpen && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    onClick={() => setIsProfileOpen(false)}
                    className="fixed inset-0 z-40"
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute right-0 mt-4 w-80 bg-[#111] border border-[#222] rounded-3xl p-6 shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                      <UserCircle size={100} className="text-[#00FF41]" />
                    </div>

                    <div className="mb-6 border-b border-[#222] pb-4">
                      <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-1">Neural_Identity</p>
                      <h4 className="text-sm font-black text-white uppercase tracking-tight">
                        {profile.first_name ? `${profile.first_name} ${profile.last_name}` : 'Anonymous User'}
                      </h4>
                      <p className="text-[10px] text-gray-600 mt-1 lowercase">{profile.email}</p>
                    </div>

                    {!editing ? (
                      <div className="space-y-4">
                        <button 
                          onClick={() => setEditing(true)}
                          className="w-full flex items-center gap-3 p-3 bg-black/40 border border-[#222] rounded-xl text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-white hover:border-[#00FF41]/30 transition-all group"
                        >
                          <Settings size={14} className="group-hover:text-[#00FF41]" /> Edit Identity
                        </button>
                        <button 
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-3 p-3 bg-red-500/5 border border-red-500/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-all"
                        >
                          <LogOut size={14} /> Session_End
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[8px] text-gray-500 uppercase font-bold tracking-widest">First_Name</label>
                          <input 
                            type="text" 
                            value={formData.first_name}
                            onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                            className="w-full bg-black border border-[#222] p-2 rounded-lg text-xs outline-none focus:border-[#00FF41] transition-all"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[8px] text-gray-500 uppercase font-bold tracking-widest">Last_Name</label>
                          <input 
                            type="text" 
                            value={formData.last_name}
                            onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                            className="w-full bg-black border border-[#222] p-2 rounded-lg text-xs outline-none focus:border-[#00FF41] transition-all"
                            required
                          />
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button 
                            type="submit" 
                            disabled={saving}
                            className="flex-1 bg-[#00FF41] text-black py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#00D736] transition-all flex items-center justify-center"
                          >
                            {saving ? <Loader2 className="animate-spin" size={12} /> : <Check size={12} />}
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setEditing(false)}
                            className="flex-1 bg-[#222] text-white py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#333] transition-all flex items-center justify-center"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </form>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="grid lg:grid-cols-3 gap-8 text-center md:text-left">
          <div className="lg:col-span-2 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="bg-[#111] border border-[#00FF41]/20 rounded-[2.5rem] p-12 relative overflow-hidden group shadow-2xl"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                <ShieldCheck size={200} className="text-[#00FF41]" />
              </div>
              <Download className="text-[#00FF41] mb-8 mx-auto md:mx-0 animate-bounce" size={56} />
              <h2 className="text-5xl font-black mb-4 uppercase tracking-tighter">Omni_HUD_Lite.exe</h2>
              <p className="text-gray-500 mb-12 text-[10px] tracking-[0.3em] leading-loose uppercase max-w-md">
                Ultra-light Build. Requires Python 3.11+ Environment. Optimized for performance.
              </p>
              <button 
                onClick={handleDownload}
                className="px-14 py-6 bg-[#00FF41] text-black font-black uppercase text-xs tracking-[0.3em] hover:shadow-[0_0_50px_rgba(0,255,65,0.5)] active:scale-95 transition-all inline-block rounded-2xl cursor-pointer"
              >
                Initialize Download
              </button>
            </motion.div>

            {/* Tutorial Section */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-black/40 border border-[#222] rounded-[2.5rem] p-10 text-left"
            >
              <h3 className="text-[#00FF41] font-black text-sm uppercase tracking-widest mb-8 flex items-center gap-3">
                <Terminal size={20} /> Pre-Flight Requirements
              </h3>
              
              <div className="grid md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <span className="text-[#00FF41] font-black text-xl">01</span>
                    <div>
                      <h4 className="font-bold text-xs uppercase mb-2">Install Python Engine</h4>
                      <p className="text-[10px] text-gray-500 leading-relaxed uppercase">
                        Download Python 3.11 from the official site.
                      </p>
                      <a href="https://www.python.org/downloads/release/python-3119/" target="_blank" className="inline-block mt-3 text-[9px] font-black text-[#00FF41] border border-[#00FF41]/30 px-3 py-1 rounded-md hover:bg-[#00FF41]/10 transition-all">
                        DOWNLOAD_PYTHON_3.11
                      </a>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-4">
                    <span className="text-[#00FF41] font-black text-xl">02</span>
                    <div>
                      <h4 className="font-bold text-xs uppercase mb-2">CRITICAL: Enable PATH</h4>
                      <p className="text-[10px] text-gray-500 leading-relaxed uppercase">
                        During installation, you <span className="text-white font-bold underline">MUST</span> check the box that says: 
                        <br/><span className="text-[#00FF41]">"Add Python to PATH"</span>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 p-5 bg-[#00FF41]/5 border border-[#00FF41]/10 rounded-2xl">
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-loose">
                  <span className="text-[#00FF41]">System Note:</span> If Python is not in your PATH, the installer will fail to link the Neural libraries. Verify by typing <code className="text-white bg-white/10 px-2 py-0.5 rounded">python --version</code> in your terminal.
                </p>
              </div>
            </motion.div>
          </div>

          <div className="space-y-8">
            <div className="bg-[#111] border border-[#222] rounded-[2rem] p-8 hover:border-[#00FF41]/30 transition-all shadow-xl">
              <div className="flex items-center gap-2 mb-6">
                <Key className="text-gray-500" size={14} />
                <h3 className="font-black text-[9px] tracking-[0.3em] text-gray-500 uppercase">Neural_Auth_Key</h3>
              </div>
              <div className="bg-black/60 p-5 rounded-2xl border border-[#222] text-[#00FF41] text-xs break-all font-bold tracking-tight shadow-inner">
                {profile.purchase_id}
              </div>
            </div>

            <div className="bg-[#111] border border-[#222] rounded-[2rem] p-8 shadow-xl">
              <div className="flex items-center gap-2 mb-8">
                <Terminal className="text-gray-500" size={14} />
                <h3 className="font-black text-[9px] tracking-[0.3em] text-gray-500 uppercase">Initialize_Flow</h3>
              </div>
              <ul className="text-[9px] text-gray-400 space-y-5 font-bold tracking-[0.2em] uppercase">
                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-[#222] flex items-center justify-center text-[10px] text-[#00FF41]">01</span>
                  Execute Setup
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-[#222] flex items-center justify-center text-[10px] text-[#00FF41]">02</span>
                  <a href="https://console.groq.com/keys" target="_blank" className="text-[#00FF41] hover:underline">Get Groq API Key</a>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-[#222] flex items-center justify-center text-[10px] text-[#00FF41]">03</span>
                  Link Neural_ID & Key
                </li>
                <li className="flex items-center gap-3 text-white">
                  <span className="w-6 h-6 rounded-lg bg-[#00FF41] flex items-center justify-center text-[10px] text-black">04</span>
                  Auto-Sync Active
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
