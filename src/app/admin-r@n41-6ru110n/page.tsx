// src/app/admin-r@n41-6ru110n/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft, ChevronRight, LogOut, Users, Key, Activity,
  Ban, UserX, Shield, Plus, X, RefreshCcw, Zap, CheckCircle2, Clipboard
} from 'lucide-react';
import { AdminModals } from '@/components/admin/AdminModals';
import { UsersTable } from '@/components/admin/UsersTable';
import { KeysTable } from '@/components/admin/KeysTable';
import { AdminGuard } from '@/components/admin/AdminGuard';

const MONTHLY_PRICE = 9.99;
const USERS_PER_PAGE = 50;
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? '';

function AdminDashboardContent() {
  const [activeTab, setActiveTab] = useState<'users' | 'keys'>('users');
  const [showGenerator, setShowGenerator] = useState(false);

  // Users state
  const [profiles, setProfiles] = useState<any[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');

  // Keys state
  const [licenseKeys, setLicenseKeys] = useState<any[]>([]);

  // Stats
  const [blockedCount, setBlockedCount] = useState(0);
  const [cancelledCount, setCancelledCount] = useState(0);

  // Generator state
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [planType, setPlanType] = useState<'monthly' | 'yearly'>('monthly');
  const [generating, setGenerating] = useState(false);
  const [recentKey, setRecentKey] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Modal state
  const [loading, setLoading] = useState(true);
  const [userHistory, setUserHistory] = useState<any[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<any>({ show: false, type: 'success', title: '', message: '' });

  const router = useRouter();
  const finalYearly = MONTHLY_PRICE * 12 * 0.9;

  const isKeyExpired = (date: string | null, plan?: string) => {
    if (plan === 'architect') return false;
    if (!date) return false;
    return new Date(date) < new Date();
  };

  // ─── Fetch Users ──────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page), limit: String(USERS_PER_PAGE),
        filter: filterPlan, search: searchQuery,
      });
      const res = await fetch(`/api/admin/users?${params}`, { headers: { 'x-admin-email': ADMIN_EMAIL } });
      if (!res.ok) throw new Error('Failed to fetch users');
      const { users, total } = await res.json();
      setProfiles(users);
      setTotalUsers(total);

      const { count: blocked } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_blocked', true);
      const { count: cancelled } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).not('cancelled_at', 'is', null);
      setBlockedCount(blocked ?? 0);
      setCancelledCount(cancelled ?? 0);
    } catch {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).range((page - 1) * USERS_PER_PAGE, page * USERS_PER_PAGE - 1);
      setProfiles(data ?? []);
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, filterPlan]);

  // ─── Fetch Keys ───────────────────────────────────────────────────────────
  const fetchKeys = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/keys', { headers: { 'x-admin-email': ADMIN_EMAIL } });
      if (!res.ok) throw new Error('Failed to fetch keys');
      const { keys } = await res.json();
      setLicenseKeys(keys ?? []);
    } catch {
      const { data } = await supabase.from('license_keys').select('*').order('created_at', { ascending: false });
      setLicenseKeys(data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'users') fetchData();
    else fetchKeys();
  }, [activeTab, fetchData, fetchKeys]);

  const fetchUserHistory = async (email: string) => {
    const { data } = await supabase.from('license_keys').select('*').eq('used_by_email', email).order('created_at', { ascending: false });
    setUserHistory(data ?? []);
    setIsHistoryOpen(true);
  };

  const generateKey = async () => {
    setGenerating(true);
    const keyText = `OMNI-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase().substring(4)}`;
    const price = planType === 'monthly' ? MONTHLY_PRICE : parseFloat(finalYearly.toFixed(2));
    const expiresAt = new Date();
    planType === 'monthly' ? expiresAt.setMonth(expiresAt.getMonth() + 1) : expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    const isoExpires = expiresAt.toISOString();

    const keyRes = await fetch('/api/admin/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-email': ADMIN_EMAIL },
      body: JSON.stringify({ key_text: keyText, plan_type: planType, price_paid: price, expires_at: isoExpires, is_used: !!selectedUser, used_by_email: selectedUser?.email ?? null }),
    });

    const keyData = await keyRes.json();
    if (keyData.error) {
      setModalConfig({ show: true, type: 'error', title: 'ERROR', message: keyData.error });
      setGenerating(false);
      return;
    }

    if (selectedUser) {
      await supabase.from('profiles').update({ plan: planType, plan_expires_at: isoExpires, purchase_id: keyText }).eq('id', selectedUser.id);
      setSelectedUser(null);
      fetchData(); fetchKeys();
      setModalConfig({ show: true, type: 'success', title: 'SINCRONIZADO', message: 'Protocolo activado exitosamente.' });
    } else {
      setRecentKey({ text: keyText });
      fetchKeys();
    }
    setGenerating(false);
  };

  // Derived stats
  const activeUsersCount = profiles.filter(p => p.purchase_id && !isKeyExpired(p.plan_expires_at, p.plan) && !p.cancelled_at).length;
  const architectsCount = profiles.filter(p => p.plan === 'architect').length;
  const activeKeys = licenseKeys.filter(k => k.is_used && (!k.expires_at || new Date(k.expires_at) >= new Date())).length;
  const expiredKeys = licenseKeys.filter(k => k.is_used && k.expires_at && new Date(k.expires_at) < new Date()).length;

  return (
    <div className="min-h-screen bg-[#020202] text-zinc-100 font-mono text-xs selection:bg-[#10b981] selection:text-black">
      <AdminModals modalConfig={modalConfig} setModalConfig={setModalConfig} isHistoryOpen={isHistoryOpen} setIsHistoryOpen={setIsHistoryOpen} userHistory={userHistory} />

      {/* ── Top Navigation Bar ───────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-[#020202]/90 backdrop-blur border-b border-zinc-900 px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-black tracking-tight">OMNI <span className="text-[#10b981]">COMMAND</span></h1>
          <div className="h-5 w-px bg-zinc-800" />
          <div className="flex gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            {([['users', 'USUARIOS', Users], ['keys', 'CLAVES', Key]] as const).map(([id, label, Icon]) => (
              <button key={id} onClick={() => setActiveTab(id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black transition-all ${activeTab === id ? 'bg-[#10b981] text-black' : 'text-zinc-500 hover:text-zinc-300'}`}>
                <Icon size={12} />{label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setShowGenerator(!showGenerator); setRecentKey(null); }} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black transition-all border ${showGenerator ? 'border-[#10b981] text-[#10b981] bg-[#10b981]/5' : 'border-zinc-800 text-zinc-400 bg-zinc-900 hover:border-zinc-700'}`} title="Generar Neural Key">
            {showGenerator ? <X size={14} /> : <Plus size={14} />} GENERAR KEY
          </button>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} className="p-2.5 bg-zinc-900 rounded-xl hover:text-red-400 transition-all border border-zinc-800" title="Cerrar sesión">
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* ── Stats Bar ────────────────────────────────────────────────────── */}
      <div className="px-6 py-4 border-b border-zinc-900 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: 'Total Usuarios', value: totalUsers, icon: Users, color: 'text-zinc-300' },
          { label: 'Activos', value: activeUsersCount, icon: Activity, color: 'text-[#10b981]' },
          { label: 'Architects', value: architectsCount, icon: Shield, color: 'text-purple-400' },
          { label: 'Bloqueados', value: blockedCount, icon: Ban, color: 'text-red-400' },
          { label: 'Cancelados', value: cancelledCount, icon: UserX, color: 'text-zinc-500' },
          { label: 'Keys Activas', value: activeKeys, icon: Key, color: 'text-[#10b981]' },
          { label: 'Keys Exp.', value: expiredKeys, icon: Key, color: 'text-amber-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl px-4 py-3 flex items-center gap-3">
            <Icon size={16} className={`${color} flex-shrink-0`} />
            <div>
              <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest leading-none mb-0.5">{label}</p>
              <p className={`text-lg font-black leading-none ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Key Generator Panel (collapsible) ────────────────────────────── */}
      {showGenerator && (
        <div className="px-6 py-5 border-b border-zinc-900 bg-[#10b981]/[0.02]">
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Generar Neural Key</p>
            {/* Plan selector */}
            <div className="flex gap-1 bg-black/50 p-1 rounded-xl border border-zinc-800">
              {(['monthly', 'yearly'] as const).map(t => (
                <button key={t} onClick={() => setPlanType(t)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${planType === t ? 'bg-[#10b981] text-black' : 'text-zinc-500 hover:text-zinc-300'}`}>{t} {t === 'monthly' ? '— $9.99' : `— $${finalYearly.toFixed(2)}`}</button>
              ))}
            </div>
            {/* Assign to user input */}
            {selectedUser ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#10b981]/10 border border-[#10b981]/30 rounded-xl">
                <span className="text-[10px] text-[#10b981] font-bold">{selectedUser.email}</span>
                <button onClick={() => setSelectedUser(null)} className="text-zinc-500 hover:text-red-400 transition-colors"><X size={12} /></button>
              </div>
            ) : (
              <span className="text-[10px] text-zinc-600 italic">Sin asignar · haz click en un usuario para asignar</span>
            )}
            {/* Generate button */}
            <button onClick={generateKey} disabled={generating} className="flex items-center gap-2 px-5 py-2 bg-[#10b981] text-black font-black rounded-xl text-[10px] uppercase hover:bg-[#0da870] transition-all disabled:opacity-50">
              {generating ? <RefreshCcw size={14} className="animate-spin" /> : <Zap size={14} />}
              GENERAR
            </button>
            {/* Copied key display */}
            {recentKey && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-black border border-zinc-800 rounded-xl">
                <code className="text-[11px] font-mono font-black text-[#10b981]">{recentKey.text}</code>
                <button onClick={() => { navigator.clipboard.writeText(recentKey.text); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className={`p-1 rounded transition-all ${copied ? 'text-[#10b981]' : 'text-zinc-500 hover:text-white'}`}>
                  {copied ? <CheckCircle2 size={14} /> : <Clipboard size={14} />}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Main Table (full width) ───────────────────────────────────────── */}
      <div className="px-6 py-6">
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl overflow-hidden">
          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-8 h-8 border-2 border-[#10b981]/20 border-t-[#10b981] rounded-full animate-spin" />
              <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Cargando...</span>
            </div>
          )}

          {!loading && activeTab === 'users' && (
            <UsersTable
              profiles={profiles}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filterPlan={filterPlan}
              setFilterPlan={setFilterPlan}
              setPage={setPage}
              selectedUser={selectedUser}
              setSelectedUser={(u) => { setSelectedUser(u); if (u) setShowGenerator(true); }}
              fetchUserHistory={fetchUserHistory}
              isKeyExpired={isKeyExpired}
              adminEmail={ADMIN_EMAIL}
              onRefresh={fetchData}
            />
          )}

          {!loading && activeTab === 'keys' && (
            <KeysTable licenseKeys={licenseKeys} adminEmail={ADMIN_EMAIL} onRefresh={fetchKeys} />
          )}

          {/* Pagination */}
          {!loading && activeTab === 'users' && (
            <div className="px-8 py-5 border-t border-zinc-800/60 flex items-center justify-between bg-black/20">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded-xl disabled:opacity-30 hover:bg-zinc-800 transition-all border border-zinc-800 text-[10px] font-bold" title="Página anterior">
                <ChevronLeft size={14} /> ANTERIOR
              </button>
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                Página <span className="text-zinc-300">{page}</span> · <span className="text-zinc-300">{totalUsers}</span> usuarios en total
              </span>
              <button onClick={() => setPage(p => p + 1)} disabled={profiles.length < USERS_PER_PAGE} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded-xl disabled:opacity-30 hover:bg-zinc-800 transition-all border border-zinc-800 text-[10px] font-bold" title="Página siguiente">
                SIGUIENTE <ChevronRight size={14} />
              </button>
            </div>
          )}
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
