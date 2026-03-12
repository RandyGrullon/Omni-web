// src/app/dashboard/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Terminal, ShieldCheck, Loader2, Activity, Lock, Clipboard as ClipboardIcon, AlertCircle 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/context/ToastContext';
import { ProfileDrawer } from '@/components/dashboard/ProfileDrawer';
import { DashboardNavbar } from '@/components/dashboard/DashboardNavbar';
import { DownloadSection } from '@/components/dashboard/DownloadSection';
import { NeuralBadge } from '@/components/ui/NeuralBadge';
import { NeuralButton } from '@/components/ui/NeuralButton';

export default function DashboardPage() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ first_name: '', last_name: '', username: '' });
  const router = useRouter();

  useEffect(() => { 
    setMounted(true);
    checkAccess(); 
  }, []);

  const checkAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push('/auth');
    
    let { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (!data || error) {
      const { data: createdData } = await supabase.from('profiles').insert({
        id: user.id, email: user.email, first_name: user.email?.split('@')[0], 
        last_name: 'User', username: user.email?.split('@')[0], plan: 'free'
      }).select().single();
      data = createdData;
    }
    if (data) {
      setProfile(data);
      setFormData({ first_name: data.first_name || '', last_name: data.last_name || '', username: data.username || '' });
    }
    setLoading(false);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    toast("Synchronizing Neural Data...", "loading");
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No active session");

      const updateData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        username: formData.username.trim()
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);
      
      if (error) throw error;

      // Actualizar estados locales inmediatamente
      setProfile((prev: any) => ({ ...prev, ...updateData }));
      toast("Neural Identity Updated", "success");
      
      // Cerrar el drawer tras un pequeño delay para que vean el éxito
      setTimeout(() => setIsProfileOpen(false), 500);
    } catch (err: any) { 
      toast(err.message.toUpperCase(), "error"); 
    } finally { 
      setSaving(false); 
    }
  };

  const INSTALLER_FILES: Record<'windows' | 'mac', { storageKey: string; downloadName: string }> = {
    windows: { storageKey: 'Omni_HUD_LiteSetup.exe', downloadName: 'Omni_HUD_Setup.exe' },
    mac: { storageKey: 'Omni_HUD_mac.dmg', downloadName: 'Omni_HUD_mac.dmg' },
  };

  const handleDownload = async (platform: 'windows' | 'mac') => {
    const { storageKey, downloadName } = INSTALLER_FILES[platform];
    toast("Requesting Installer...", "loading");
    try {
      const { data, error } = await supabase.storage.from('omni-installers').createSignedUrl(storageKey, 60);
      if (error) throw error;
      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.download = downloadName;
      link.click();
      toast("Download Initialized", "success");
    } catch (err) { toast("DOWNLOAD ERROR", "error"); }
  };

  if (!mounted) return null;

  if (loading) return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center" suppressHydrationWarning>
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="text-[#00FF41] animate-spin" size={40} />
        <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em]">Synchronizing_Neural_Link...</p>
      </div>
    </div>
  );


  if (!profile) return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center p-6 text-center">
      <div className="max-w-sm space-y-6">
        <AlertCircle className="text-red-500 mx-auto" size={48} />
        <h2 className="text-xl font-black uppercase tracking-tighter">Connection_Lost</h2>
        <p className="text-gray-500 text-xs uppercase tracking-widest leading-relaxed">We could not establish your neural identity. Please attempt to authorize again.</p>
        <NeuralButton onClick={() => router.push('/auth')} variant="primary" className="w-full">Re-Authorize</NeuralButton>
      </div>
    </div>
  );

  const isPurchaseValid = !!profile.purchase_id;
  const validationProgress = [!!(profile.first_name && profile.username), isPurchaseValid].filter(Boolean).length * 50;

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white font-mono p-4 md:p-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none" />
      
      {/* STATUS BAR */}
      <div className="max-w-7xl mx-auto mb-6 flex items-center gap-4 bg-black/40 border border-[#222] p-2 rounded-2xl backdrop-blur-md">
        <div className="flex-1 flex items-center gap-3 px-4 text-left">
          <div className={`w-2 h-2 rounded-full ${isPurchaseValid ? 'bg-[#00FF41] animate-pulse' : 'bg-red-500'}`} />
          <p className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-500">
            System_Status: <span className={isPurchaseValid ? 'text-[#00FF41]' : 'text-red-500'}>{isPurchaseValid ? 'LINK_ACTIVE' : 'LOCKDOWN_MODE'}</span>
          </p>
        </div>
        <div className="h-4 w-px bg-[#222]" />
        <div className="flex-1 hidden md:flex items-center gap-3 px-4">
          <p className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-500">Neural_Sync:</p>
          <div className="flex-1 h-1 bg-[#111] rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${validationProgress}%` }} className={`h-full ${isPurchaseValid ? 'bg-[#00FF41]' : 'bg-red-500'} transition-all duration-1000`} />
          </div>
          <span className="text-[8px] font-black text-gray-400">{validationProgress}%</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <DashboardNavbar profile={profile} isPurchaseValid={isPurchaseValid} onProfileOpen={() => setIsProfileOpen(true)} />

        <div className="grid lg:grid-cols-12 gap-8 text-left">
          {/* MAIN CONTENT */}
          <div className="lg:col-span-8 space-y-8">
            <DownloadSection isPurchaseValid={isPurchaseValid} onDownload={(platform) => handleDownload(platform)} />

            <section className="bg-black/40 border border-[#222] rounded-[3rem] p-10 text-left">
              <h3 className="text-white font-black text-sm uppercase tracking-[0.3em] flex items-center gap-3 mb-10 text-left"><Terminal size={20} className="text-[#00FF41]" /> Pre-Flight Checklist</h3>
              <div className="grid md:grid-cols-2 gap-12 text-left">
                <div className="space-y-4 text-left">
                  <span className="text-3xl font-black text-[#00FF41] text-left">01</span>
                  <h4 className="font-black text-[11px] uppercase tracking-widest text-left">Python_Engine</h4>
                  <p className="text-[10px] text-gray-500 leading-relaxed uppercase text-left">Runs on Python 3.11. Ensure environment is established.</p>
                </div>
                <div className="space-y-4 text-left">
                  <span className="text-3xl font-black text-[#00FF41] text-left">02</span>
                  <h4 className="font-black text-[11px] uppercase tracking-widest text-left">Path_Integration</h4>
                  <p className="text-[10px] text-gray-500 leading-relaxed uppercase text-left">Enable "Add Python to PATH" during setup.</p>
                </div>
              </div>
            </section>
          </div>

          {/* ASIDE */}
          <aside className="lg:col-span-4 space-y-8 text-left">
            {isPurchaseValid ? (
              <div className="bg-[#111] border border-[#00FF41]/30 rounded-[2.5rem] p-8 relative overflow-hidden group text-left">
                <div className="flex items-center gap-3 mb-8 text-left">
                  <ShieldCheck className="text-[#00FF41]" size={16} />
                  <h3 className="font-black text-[10px] tracking-[0.3em] text-white uppercase text-left">Neural_Auth_Key</h3>
                </div>
                <div className="bg-black/60 p-6 rounded-2xl border border-[#222] text-[#00FF41] text-xs font-mono font-black break-all relative text-left">
                  {profile.purchase_id}
                  <button onClick={() => { navigator.clipboard.writeText(profile.purchase_id); toast("Key Copied", "success"); }} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-[#00FF41]/10 text-[#00FF41] rounded-lg"><ClipboardIcon size={14} /></button>
                </div>
              </div>
            ) : (
              <div className="bg-[#111] border border-red-500/10 rounded-[2.5rem] p-8 opacity-60 text-center text-left">
                <Lock className="mx-auto text-red-500/50 mb-4" size={32} />
                <h3 className="font-black text-[10px] tracking-[0.3em] text-gray-500 uppercase text-center">Protocol_Locked</h3>
              </div>
            )}
            <div className="bg-[#111] border border-[#222] rounded-[2.5rem] p-10 text-left">
              <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-10 flex items-center gap-3 text-left"><Activity className="text-[#00FF41]/50" size={16} /> Initialization_Flow</h3>
              <ul className="space-y-8 text-left">
                {['Execute Setup', 'Obtain Groq Key', 'Sync Identity', 'Auto-Sync Active'].map((s, i) => (
                  <li key={i} className="flex items-center gap-5 text-gray-500 text-[10px] font-black uppercase text-left">
                    <span className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#222] text-[#00FF41] text-left">{i+1}</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>

      <ProfileDrawer 
        isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} profile={profile} 
        formData={formData} setFormData={setFormData} onUpdate={handleUpdateProfile} 
        onSignOut={() => supabase.auth.signOut().then(() => router.push('/'))} saving={saving} 
      />
    </div>
  );
}
