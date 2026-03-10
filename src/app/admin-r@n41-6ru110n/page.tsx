'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Users, 
  Key, 
  LogOut, 
  Plus, 
  ShieldCheck, 
  ChevronLeft, 
  ChevronRight, 
  Clipboard, 
  CheckCircle2, 
  RefreshCcw, 
  Clock, 
  Search, 
  UserPlus,
  ArrowRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const ADMIN_EMAIL = 'randy6grullon@gmail.com';
const MONTHLY_PRICE = 9.99;
const USERS_PER_PAGE = 8;

export default function AdminDashboard() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [planType, setPlanType] = useState<'monthly' | 'yearly'>('monthly');
  const [recentKey, setRecentKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const router = useRouter();

  // Precios calculados
  const originalYearly = MONTHLY_PRICE * 12;
  const finalYearly = originalYearly * 0.9; // 10% descuento

  useEffect(() => {
    checkAdmin();
  }, [page, searchQuery]);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.email !== ADMIN_EMAIL) {
      router.push('/');
      return;
    }
    fetchData();
  };

  const fetchData = async () => {
    setLoading(true);
    let query = supabase.from('profiles').select('*', { count: 'exact' });

    if (searchQuery) {
      // Búsqueda por email, nombre o apellido
      query = query.or(`email.ilike.%${searchQuery}%,first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%`);
    }

    const start = (page - 1) * USERS_PER_PAGE;
    const end = start + USERS_PER_PAGE - 1;

    const { data, count } = await query
      .order('created_at', { ascending: false })
      .range(start, end);

    setProfiles(data || []);
    setTotalUsers(count || 0);
    setLoading(false);
  };

  const generateKey = async () => {
    setGenerating(true);
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const newKey = `OMNI-${randomPart}-${Date.now().toString(36).toUpperCase()}-${planType === 'monthly' ? 'MON' : 'YEA'}`;
    
    const { error } = await supabase.from('license_keys').insert([{
      key_text: newKey,
      plan_type: planType,
      price_paid: planType === 'monthly' ? MONTHLY_PRICE : finalYearly,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }]);

    if (!error) setRecentKey(newKey);
    setGenerating(false);
  };

  const assignDirectAccess = async (userProfile: any) => {
    const userName = userProfile.first_name ? `${userProfile.first_name} ${userProfile.last_name}` : userProfile.email;
    if (!confirm(`¿Asignar plan ${planType} a ${userName}?`)) return;
    
    setGenerating(true);
    const daysToAdd = planType === 'monthly' ? 30 : 365;
    const currentExpiry = userProfile.plan_expires_at ? new Date(userProfile.plan_expires_at) : new Date();
    const newExpiry = new Date(currentExpiry.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

    const { error } = await supabase.from('profiles').update({
      plan: planType,
      plan_expires_at: newExpiry.toISOString()
    }).eq('id', userProfile.id);

    if (!error) {
      alert("Acceso asignado correctamente.");
      fetchData();
      setSelectedUser(null);
    } else {
      alert("Error: " + error.message);
    }
    setGenerating(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 font-sans selection:bg-[#00FF41] selection:text-black">
      <div className="max-w-7xl mx-auto flex justify-between items-center mb-12">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#00FF41]/10 rounded-2xl flex items-center justify-center border border-[#00FF41]/20">
            <ShieldCheck className="text-[#00FF41]" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter">OMNI COMMAND</h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold">Admin Privado / Randy Grullón</p>
          </div>
        </div>
        <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} className="p-3 bg-zinc-900/50 rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-all border border-zinc-800">
          <LogOut size={20} />
        </button>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* PANEL IZQUIERDO: GENERADOR */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-zinc-900/40 border border-zinc-800/60 p-8 rounded-[2.5rem] backdrop-blur-xl">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Key className="text-[#00FF41]" size={20} /> {selectedUser ? 'Asignar a Usuario' : 'Generar Licencia'}
            </h2>

            {selectedUser && (
              <div className="mb-6 p-4 bg-[#00FF41]/5 border border-[#00FF41]/20 rounded-2xl flex items-center justify-between">
                <div className="overflow-hidden">
                  <p className="text-[10px] text-[#00FF41] font-black uppercase">Usuario Seleccionado</p>
                  <p className="text-sm font-bold truncate">
                    {selectedUser.first_name ? `${selectedUser.first_name} ${selectedUser.last_name}` : selectedUser.email}
                  </p>
                </div>
                <button onClick={() => setSelectedUser(null)} className="text-zinc-500 hover:text-white text-xs">Cancelar</button>
              </div>
            )}

            <div className="flex p-1 bg-black rounded-2xl mb-8 border border-zinc-800 shadow-inner">
              <button onClick={() => setPlanType('monthly')} className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${planType === 'monthly' ? 'bg-[#00FF41] text-black shadow-lg shadow-[#00FF41]/20' : 'text-zinc-500'}`}>MENSUAL</button>
              <button onClick={() => setPlanType('yearly')} className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${planType === 'yearly' ? 'bg-[#00FF41] text-black shadow-lg shadow-[#00FF41]/20' : 'text-zinc-500'}`}>ANUAL (-10%)</button>
            </div>

            <div className="mb-8 text-center bg-black/40 py-6 rounded-3xl border border-zinc-800/30">
              <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1 tracking-widest">Precio Final</p>
              <span className="text-4xl font-black text-[#00FF41]">${planType === 'monthly' ? MONTHLY_PRICE : finalYearly.toFixed(2)}</span>
            </div>

            <button 
              onClick={() => selectedUser ? assignDirectAccess(selectedUser) : generateKey()}
              className="w-full bg-[#00FF41] text-black h-16 rounded-2xl font-black tracking-tighter flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-[#00FF41]/10 disabled:opacity-50"
              disabled={generating}
            >
              {selectedUser ? <UserPlus size={22} /> : <Plus size={22} />}
              {selectedUser ? 'ASIGNAR ACCESO' : 'GENERAR CLAVE'}
            </button>

            {recentKey && !selectedUser && (
              <div className="mt-8 p-5 bg-[#00FF41]/10 border border-[#00FF41]/30 rounded-2xl animate-in zoom-in-95">
                <p className="text-[10px] text-[#00FF41] font-black uppercase mb-3">Clave para compartir</p>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-lg font-mono font-black text-white">{recentKey}</code>
                  <button onClick={() => {navigator.clipboard.writeText(recentKey); setCopied(true); setTimeout(() => setCopied(false), 2000)}} className="p-3 bg-[#00FF41]/20 rounded-xl text-[#00FF41] hover:bg-[#00FF41]/30">
                    {copied ? <CheckCircle2 size={20} /> : <Clipboard size={20} />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PANEL DERECHO: BUSCADOR Y LISTA */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-[2.5rem] overflow-hidden backdrop-blur-xl">
            <div className="p-8 border-b border-zinc-800/60 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-3">
                <Users size={22} className="text-zinc-500" />
                <h3 className="font-bold text-lg">Directorio de Usuarios</h3>
              </div>
              <div className="relative w-full md:w-80 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[#00FF41] transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar email o nombre..." 
                  className="w-full bg-black border border-zinc-800 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-[#00FF41]/50 focus:ring-4 focus:ring-[#00FF41]/5 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] text-zinc-500 font-black uppercase tracking-widest bg-black/30">
                    <th className="px-8 py-5">Nombre / Email</th>
                    <th className="px-8 py-5">Suscripción</th>
                    <th className="px-8 py-5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/40">
                  {profiles.map((p) => (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="font-bold text-zinc-200">
                            {p.first_name ? `${p.first_name} ${p.last_name}` : 'Sin Nombre'}
                          </span>
                          <span className="text-xs text-zinc-500">{p.email}</span>
                          <span className="text-[10px] text-zinc-600 font-mono">UID: {p.id.substring(0, 8)}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-1">
                          <span className={`w-fit px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            p.plan === 'architect' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                            p.plan === 'yearly' ? 'bg-[#00FF41]/10 text-[#00FF41] border border-[#00FF41]/20' :
                            p.plan === 'monthly' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                            'bg-zinc-800 text-zinc-500'
                          }`}>
                            {p.plan || 'SIN PLAN'}
                          </span>
                          {p.plan_expires_at && (
                            <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                              <Clock size={10} /> {new Date(p.plan_expires_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => setSelectedUser(p)}
                          className="px-4 py-2 bg-zinc-800/50 rounded-xl text-xs font-bold hover:bg-[#00FF41] hover:text-black transition-all flex items-center gap-2 ml-auto"
                        >
                          SELECCIONAR <ArrowRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-6 bg-black/40 border-t border-zinc-800/60 flex justify-between items-center">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-3 bg-zinc-900 rounded-xl disabled:opacity-20 hover:bg-zinc-800 transition-all"><ChevronLeft /></button>
              <div className="flex gap-2">
                {[...Array(Math.ceil(totalUsers / USERS_PER_PAGE))].slice(0, 5).map((_, i) => (
                  <button key={i} onClick={() => setPage(i + 1)} className={`w-10 h-10 rounded-xl text-xs font-bold transition-all ${page === i + 1 ? 'bg-[#00FF41] text-black shadow-lg shadow-[#00FF41]/20' : 'text-zinc-500 hover:text-white'}`}>{i + 1}</button>
                ))}
              </div>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(totalUsers / USERS_PER_PAGE)} className="p-3 bg-zinc-900 rounded-xl disabled:opacity-20 hover:bg-zinc-800 transition-all"><ChevronRight /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
