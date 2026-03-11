// src/app/admin-r@n41-6ru110n/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Users, LogOut, ChevronLeft, ChevronRight, Lock, Activity } from 'lucide-react';
import { AdminModals } from '@/components/admin/AdminModals';
import { AdminStats } from '@/components/admin/AdminStats';
import { SubjectExpedient } from '@/components/admin/SubjectExpedient';
import { UsersTable } from '@/components/admin/UsersTable';
import { KeysTable } from '@/components/admin/KeysTable';
import { AdminGuard } from '@/components/admin/AdminGuard';

const MONTHLY_PRICE = 9.99;
const USERS_PER_PAGE = 50;

function AdminDashboardContent() {
  const [activeTab, setActiveTab] = useState<'users' | 'keys'>('users');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [licenseKeys, setLicenseKeys] = useState<any[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsersCount, setActiveUsersCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [planType, setPlanType] = useState<'monthly' | 'yearly'>('monthly');
  const [recentKey, setRecentKey] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [userHistory, setUserHistory] = useState<any[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<any>({ show: false, type: 'success', title: '', message: '' });

  const router = useRouter();
  const finalYearly = MONTHLY_PRICE * 12 * 0.9;

  useEffect(() => { 
    if (activeTab === 'users') fetchData(); else fetchKeys();
  }, [page, searchQuery, filterPlan, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    const { count: total } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: active } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).gt('plan_expires_at', new Date().toISOString());
    setTotalUsers(total || 0); setActiveUsersCount(active || 0);

    let query = supabase.from('profiles').select('*', { count: 'exact' });
    if (filterPlan !== 'all') {
      if (filterPlan === 'expired') query = query.lt('plan_expires_at', new Date().toISOString()).neq('plan', 'architect');
      else if (filterPlan === 'active') query = query.gt('plan_expires_at', new Date().toISOString());
      else query = query.eq('plan', filterPlan);
    }
    if (searchQuery) query = query.or(`email.ilike.%${searchQuery}%,first_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`);
    
    const { data, count } = await query.order('created_at', { ascending: false }).range((page-1)*USERS_PER_PAGE, page*USERS_PER_PAGE-1);
    setProfiles(data || []); setTotalUsers(count || 0); setLoading(false);
  };

  const fetchKeys = async () => {
    setLoading(true);
    const { data } = await supabase.from('license_keys').select('*').order('created_at', { ascending: false });
    setLicenseKeys(data || []); setLoading(false);
  };

  const fetchUserHistory = async (email: string) => {
    const { data } = await supabase.from('license_keys').select('*').eq('used_by_email', email).order('created_at', { ascending: false });
    setUserHistory(data || []); setIsHistoryOpen(true);
  };

  const isKeyExpired = (d: string | null, p?: string) => p === 'architect' ? false : !d || new Date(d) < new Date();

  const generateKey = async () => {
    const expired = isKeyExpired(selectedUser?.plan_expires_at, selectedUser?.plan);
    if (selectedUser && !expired && selectedUser.purchase_id) return;
    if (selectedUser) {
      setModalConfig({ show: true, type: 'confirm_assign', title: 'CONFIRMACIÓN', message: `¿Asignar ${planType} a ${selectedUser.email}?`, action: executeKeyGeneration });
    } else executeKeyGeneration();
  };

  const executeKeyGeneration = async () => {
    setGenerating(true); setModalConfig({ ...modalConfig, show: false });
    const keyText = `OMNI-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase().substring(4)}`;
    const expiry = new Date(); expiry.setDate(expiry.getDate() + (planType === 'monthly' ? 30 : 365));
    const price = planType === 'monthly' ? MONTHLY_PRICE : parseFloat(finalYearly.toFixed(2));

    const { data: ins } = await supabase.from('license_keys').insert([{ key_text: keyText, plan_type: planType, price_paid: price, expires_at: expiry.toISOString(), is_used: !!selectedUser, used_by_email: selectedUser?.email }]).select();
    if (ins && selectedUser) {
      await supabase.from('profiles').update({ plan: planType, plan_expires_at: expiry.toISOString(), purchase_id: keyText }).eq('id', selectedUser.id);
      fetchData(); fetchKeys(); setSelectedUser(null);
      setModalConfig({ show: true, type: 'success', title: 'SINCRONIZADO', message: 'Protocolo activado correctamente.' });
    } else if (ins) setRecentKey({ id: ins[0].id, text: keyText });
    setGenerating(false);
  };

  const deleteKey = async (id: string) => {
    setModalConfig({ show: true, type: 'confirm_delete', title: 'ELIMINAR', message: '¿Borrar clave?', action: async () => {
      await supabase.from('license_keys').delete().eq('id', id);
      fetchKeys(); setModalConfig({ show: false });
    }});
  };

  return (
    <div className="min-h-screen bg-[#020202] text-zinc-100 p-4 md:p-8 font-mono text-xs selection:bg-[#10b981] selection:text-black">
      <AdminModals modalConfig={modalConfig} setModalConfig={setModalConfig} isHistoryOpen={isHistoryOpen} setIsHistoryOpen={setIsHistoryOpen} userHistory={userHistory} />
      
      <div className="max-w-7xl mx-auto flex justify-between items-center mb-12">
        <h1 className="text-3xl font-black tracking-tight">OMNI <span className="text-[#10b981]">COMMAND</span></h1>
        <div className="flex gap-4 text-left">
          <button onClick={() => setActiveTab('users')} className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'users' ? 'bg-[#10b981] text-black shadow-lg shadow-[#10b981]/10' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'}`}>USUARIOS</button>
          <button onClick={() => setActiveTab('keys')} className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'keys' ? 'bg-[#10b981] text-black shadow-lg shadow-[#10b981]/10' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'}`}>CLAVES</button>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} className="p-3 bg-zinc-900 rounded-xl hover:text-red-500 transition-all border border-zinc-800"><LogOut size={20} /></button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-8 text-left">
          <AdminStats totalUsers={totalUsers} activeUsersCount={activeUsersCount} architectsCount={profiles.filter(p => p.plan === 'architect').length || 1} />
          <SubjectExpedient selectedUser={selectedUser} setSelectedUser={setSelectedUser} planType={planType} setPlanType={setPlanType} generating={generating} generateKey={generateKey} recentKey={recentKey} copied={copied} setCopied={setCopied} fetchUserHistory={fetchUserHistory} isKeyExpired={isKeyExpired} prices={{monthly: MONTHLY_PRICE, yearly: finalYearly}} />
        </div>

        <div className="lg:col-span-8">
          <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-[2.5rem] overflow-hidden backdrop-blur-2xl text-left">
            {activeTab === 'users' ? (
              <UsersTable profiles={profiles} searchQuery={searchQuery} setSearchQuery={setSearchQuery} filterPlan={filterPlan} setFilterPlan={setFilterPlan} setPage={setPage} selectedUser={selectedUser} setSelectedUser={setSelectedUser} fetchUserHistory={fetchUserHistory} isKeyExpired={isKeyExpired} />
            ) : (
              <KeysTable licenseKeys={licenseKeys} deleteKey={deleteKey} />
            )}
            <div className="p-6 bg-black/40 border-t border-zinc-800/60 flex justify-between items-center text-left">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-3 bg-zinc-900 rounded-xl disabled:opacity-20"><ChevronLeft /></button>
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Protocol_Page {page}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={profiles.length < USERS_PER_PAGE} className="p-3 bg-zinc-900 rounded-xl disabled:opacity-20"><ChevronRight /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <AdminGuard>
      <AdminDashboardContent />
    </AdminGuard>
  );
}
