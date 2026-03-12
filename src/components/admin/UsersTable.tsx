// src/components/admin/UsersTable.tsx
"use client";
import React, { useState } from 'react';
import {
  Search, Globe, Zap, AlertTriangle, ShieldCheck, Clock,
  UserX, UserCheck, Ban, RotateCcw, Trash2, X
} from 'lucide-react';

interface UsersTableProps {
  profiles: any[];
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  filterPlan: string;
  setFilterPlan: (v: string) => void;
  setPage: (v: any) => void;
  selectedUser: any;
  setSelectedUser: (v: any) => void;
  fetchUserHistory: (email: string) => void;
  isKeyExpired: (date: string | null, plan?: string) => boolean;
  adminEmail: string;
  onRefresh: () => void;
}

async function callApi(url: string, method: string, adminEmail: string, body?: any) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', 'x-admin-email': adminEmail },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

type ConfirmAction = { id: string; action: 'cancel' | 'delete' };

const statusBadge: Record<string, string> = {
  active:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  expired:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
  blocked:   'bg-red-500/10 text-red-400 border-red-500/20',
  cancelled: 'bg-zinc-700/30 text-zinc-500 border-zinc-700/30',
  architect: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  free:      'bg-zinc-800/30 text-zinc-600 border-zinc-800/30',
};
const statusLabel: Record<string, string> = {
  active: 'ACTIVO', expired: 'EXPIRADO', blocked: 'BLOQUEADO',
  cancelled: 'CANCELADO', architect: 'ARCHITECT', free: 'FREE',
};

function getUserStatus(p: any): string {
  if (p.cancelled_at) return 'cancelled';
  if (p.is_blocked) return 'blocked';
  if (p.plan === 'architect') return 'architect';
  if (p.purchase_id) {
    if (p.plan_expires_at && new Date(p.plan_expires_at) < new Date()) return 'expired';
    return 'active';
  }
  return 'free';
}

export const UsersTable: React.FC<UsersTableProps> = ({
  profiles, searchQuery, setSearchQuery, filterPlan, setFilterPlan,
  setPage, selectedUser, setSelectedUser, fetchUserHistory,
  adminEmail, onRefresh
}) => {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<ConfirmAction | null>(null);

  const filters = [
    { id: 'all',       label: 'TODOS',      icon: Globe },
    { id: 'active',    label: 'VIGENTES',   icon: Zap },
    { id: 'expired',   label: 'EXPIRADOS',  icon: AlertTriangle },
    { id: 'free',      label: 'SIN PLAN',   icon: UserX },
    { id: 'blocked',   label: 'BLOQUEADOS', icon: Ban },
    { id: 'cancelled', label: 'CANCELADOS', icon: UserX },
    { id: 'architect', label: 'ARCHITECTS', icon: ShieldCheck },
  ];

  const patchUser = async (id: string, action: string) => {
    setLoadingId(id);
    await callApi(`/api/admin/users/${id}`, 'PATCH', adminEmail, { action });
    setLoadingId(null);
    onRefresh();
  };

  const deleteUser = async (id: string) => {
    setLoadingId(id);
    await callApi(`/api/admin/users/${id}`, 'DELETE', adminEmail);
    setPendingConfirm(null);
    setLoadingId(null);
    onRefresh();
  };

  const handleConfirm = async () => {
    if (!pendingConfirm) return;
    if (pendingConfirm.action === 'delete') {
      await deleteUser(pendingConfirm.id);
    } else {
      await patchUser(pendingConfirm.id, 'cancel');
      setPendingConfirm(null);
    }
  };

  return (
    <>
      {/* Header + Search + Filters */}
      <div className="p-8 border-b border-zinc-800/50 space-y-6 bg-black/20">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-zinc-800/50 rounded-xl text-[#10b981]">
              <Globe size={20} />
            </div>
            <h3 className="font-bold text-xl tracking-tight">Directorio de Usuarios</h3>
          </div>
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-[#10b981] transition-colors" size={16} />
            <input
              type="text"
              placeholder="Buscar por email, nombre o alias..."
              className="w-full bg-black/40 border border-zinc-800/50 rounded-2xl py-3 pl-11 pr-4 text-xs focus:outline-none focus:border-[#10b981]/50 text-white"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => { setFilterPlan(f.id); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all border ${filterPlan === f.id ? 'bg-[#10b981]/10 border-[#10b981] text-[#10b981]' : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
            >
              <f.icon size={11} /> {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] bg-black/40">
              <th className="px-8 py-5">Sujeto</th>
              <th className="px-8 py-5">Neural Key</th>
              <th className="px-8 py-5">Estado</th>
              <th className="px-8 py-5">Plan / Vigencia</th>
              <th className="px-8 py-5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/30">
            {profiles.length === 0 && (
              <tr>
                <td colSpan={5} className="px-8 py-16 text-center text-zinc-600 text-xs font-bold uppercase tracking-widest">
                  Sin usuarios que mostrar
                </td>
              </tr>
            )}
            {profiles.map((p) => {
              const status = getUserStatus(p);
              const isSelected = selectedUser?.id === p.id;
              const isLoading = loadingId === p.id;
              const thisConfirm = pendingConfirm?.id === p.id ? pendingConfirm : null;

              return (
                <tr
                  key={p.id}
                  onClick={() => setSelectedUser(isSelected ? null : p)}
                  className={`hover:bg-white/[0.01] transition-colors cursor-pointer ${isSelected ? 'bg-[#10b981]/5 ring-1 ring-inset ring-[#10b981]/20' : ''} ${p.is_blocked ? 'opacity-60' : ''}`}
                >
                  {/* Subject */}
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${isSelected ? 'bg-[#10b981] text-black' : 'bg-zinc-800 text-zinc-400'}`}>
                        {p.first_name?.[0] ?? '?'}
                      </div>
                      <div className="flex flex-col">
                        <span className={`font-bold text-sm ${isSelected ? 'text-[#10b981]' : 'text-zinc-200'}`}>
                          {p.first_name ? `${p.first_name} ${p.last_name ?? ''}`.trim() : 'Sin nombre'}
                        </span>
                        <span className="text-[10px] text-zinc-500">{p.email}</span>
                      </div>
                    </div>
                  </td>

                  {/* Key */}
                  <td className="px-8 py-5">
                    {p.purchase_id ? (
                      <code className="text-[10px] font-mono font-black text-[#10b981] bg-[#10b981]/5 px-2 py-1 rounded border border-[#10b981]/10 uppercase">{p.purchase_id}</code>
                    ) : (
                      <span className="text-[9px] text-zinc-700 font-bold uppercase">Sin Clave</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-8 py-5">
                    <span className={`w-fit px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${statusBadge[status]}`}>
                      {statusLabel[status]}
                    </span>
                    {p.cancelled_at && (
                      <div className="text-[9px] text-zinc-600 mt-1">{new Date(p.cancelled_at).toLocaleDateString()}</div>
                    )}
                  </td>

                  {/* Plan */}
                  <td className="px-8 py-5">
                    <div className="flex flex-col gap-1">
                      <span className={`w-fit px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${p.plan === 'architect' ? 'bg-purple-500/10 text-purple-400' : 'bg-zinc-800 text-zinc-400'}`}>
                        {p.plan ?? 'free'}
                      </span>
                      <span className="text-[9px] text-zinc-500 font-bold">
                        {p.plan === 'architect' ? '∞' : p.plan_expires_at ? new Date(p.plan_expires_at).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-8 py-5">
                    <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                      {thisConfirm ? (
                        /* Confirmation row */
                        <>
                          <button
                            onClick={handleConfirm}
                            disabled={isLoading}
                            className="px-3 py-2 bg-red-500/10 rounded-xl text-red-400 hover:bg-red-500/20 border border-red-500/30 text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                            title={thisConfirm.action === 'delete' ? 'Confirmar eliminación' : 'Confirmar cancelación de cuenta'}
                          >
                            {isLoading ? '...' : thisConfirm.action === 'delete' ? 'ELIMINAR' : 'CANCELAR'}
                          </button>
                          <button
                            onClick={() => setPendingConfirm(null)}
                            className="p-2.5 bg-zinc-900/50 rounded-xl text-zinc-500 border border-zinc-800 transition-all"
                            title="Cancelar"
                          >
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        /* Normal buttons */
                        <>
                          <button
                            onClick={() => fetchUserHistory(p.email)}
                            className="p-2.5 bg-zinc-800/30 rounded-xl hover:bg-blue-500/10 hover:text-blue-400 border border-zinc-800/50 text-zinc-500 transition-all"
                            title="Historial"
                          >
                            <Clock size={14} />
                          </button>

                          {p.is_blocked ? (
                            <button onClick={() => patchUser(p.id, 'unblock')} disabled={isLoading} title="Desbloquear" className="p-2.5 bg-zinc-800/30 rounded-xl hover:bg-emerald-500/10 hover:text-emerald-400 border border-zinc-800/50 text-zinc-500 transition-all disabled:opacity-40">
                              <UserCheck size={14} />
                            </button>
                          ) : (
                            <button onClick={() => patchUser(p.id, 'block')} disabled={isLoading || p.plan === 'architect'} title="Bloquear" className="p-2.5 bg-zinc-800/30 rounded-xl hover:bg-red-500/10 hover:text-red-400 border border-zinc-800/50 text-zinc-500 transition-all disabled:opacity-40">
                              <Ban size={14} />
                            </button>
                          )}

                          {p.cancelled_at ? (
                            <button onClick={() => patchUser(p.id, 'restore')} disabled={isLoading} title="Restaurar" className="p-2.5 bg-zinc-800/30 rounded-xl hover:bg-emerald-500/10 hover:text-emerald-400 border border-zinc-800/50 text-zinc-500 transition-all disabled:opacity-40">
                              <RotateCcw size={14} />
                            </button>
                          ) : (
                            <button onClick={() => setPendingConfirm({ id: p.id, action: 'cancel' })} disabled={isLoading || p.plan === 'architect'} title="Cancelar cuenta" className="p-2.5 bg-zinc-800/30 rounded-xl hover:bg-amber-500/10 hover:text-amber-400 border border-zinc-800/50 text-zinc-500 transition-all disabled:opacity-40">
                              <UserX size={14} />
                            </button>
                          )}

                          <button onClick={() => setPendingConfirm({ id: p.id, action: 'delete' })} disabled={isLoading || p.plan === 'architect'} title="Eliminar" className="p-2.5 bg-zinc-800/30 rounded-xl hover:bg-red-500/10 hover:text-red-400 border border-zinc-800/50 text-zinc-500 transition-all disabled:opacity-40">
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};
