// src/components/admin/KeysTable.tsx
"use client";
import React, { useState } from 'react';
import { Clock, Trash2, Activity, Plus, RefreshCcw, Edit3, X, Check, Search, ArrowRight } from 'lucide-react';

interface KeysTableProps {
  licenseKeys: any[];
  adminEmail: string;
  onRefresh: () => void;
}

async function callApi(url: string, method: string, adminEmail: string, body?: any) {
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-admin-email': adminEmail,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

type KeyStatus = 'all' | 'active' | 'expired' | 'available';

export const KeysTable: React.FC<KeysTableProps> = ({ licenseKeys, adminEmail, onRefresh }) => {
  const [editingKey, setEditingKey] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<KeyStatus>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const now = new Date();

  const getStatus = (k: any): 'active' | 'expired' | 'available' => {
    if (!k.is_used) return 'available';
    if (k.expires_at && new Date(k.expires_at) < now) return 'expired';
    return 'active';
  };

  const filtered = licenseKeys.filter((k) => {
    const matchSearch =
      !search ||
      k.key_text?.toLowerCase().includes(search.toLowerCase()) ||
      k.used_by_email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || getStatus(k) === statusFilter;
    return matchSearch && matchStatus;
  });

  const startEdit = (k: any) => {
    setEditingKey(k.id);
    setEditForm({
      plan_type: k.plan_type,
      expires_at: k.expires_at ? k.expires_at.substring(0, 10) : '',
      key_text: k.key_text,
    });
  };

  const saveEdit = async (id: string, currentKey: any) => {
    setLoadingId(id);
    const updates: any = { plan_type: editForm.plan_type, key_text: editForm.key_text };
    if (editForm.expires_at) updates.expires_at = new Date(editForm.expires_at).toISOString();
    const res = await callApi(`/api/admin/keys/${id}`, 'PATCH', adminEmail, updates);
    // If the plan change was scheduled (key still active), show a note
    if (res.scheduled) {
      const expiry = currentKey.expires_at ? new Date(currentKey.expires_at).toLocaleDateString() : 'la expiración';
      window.alert(`Cambio programado: el plan cambiará a "${editForm.plan_type}" después del ${expiry}.`);
    }
    setEditingKey(null);
    setLoadingId(null);
    onRefresh();
  };

  const addMonths = async (k: any, months: number) => {
    setLoadingId(k.id);
    const base = k.expires_at && new Date(k.expires_at) > now ? new Date(k.expires_at) : new Date();
    base.setMonth(base.getMonth() + months);
    await callApi(`/api/admin/keys/${k.id}`, 'PATCH', adminEmail, { expires_at: base.toISOString() });
    setLoadingId(null);
    onRefresh();
  };

  const regenKey = async (k: any) => {
    setLoadingId(k.id);
    const newKey = `OMNI-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase().substring(4)}`;
    await callApi(`/api/admin/keys/${k.id}`, 'PATCH', adminEmail, { key_text: newKey });
    setLoadingId(null);
    onRefresh();
  };

  const deleteKey = async (id: string) => {
    setLoadingId(id);
    await callApi(`/api/admin/keys/${id}`, 'DELETE', adminEmail);
    setConfirmDeleteId(null);
    setLoadingId(null);
    onRefresh();
  };

  const statusColors: Record<string, string> = {
    active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    expired: 'bg-red-500/10 text-red-400 border-red-500/20',
    available: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };
  const statusLabels: Record<string, string> = {
    active: 'ACTIVA',
    expired: 'EXPIRADA',
    available: 'DISPONIBLE',
  };

  return (
    <>
      {/* Header */}
      <div className="p-8 border-b border-zinc-800/50 space-y-4 bg-black/20">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-zinc-800/50 rounded-xl text-[#10b981]"><Activity size={20} /></div>
            <h3 className="font-bold text-xl tracking-tight">Registro de Neural Keys</h3>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800/20 border border-zinc-800/50 rounded-xl text-[10px] font-black text-zinc-500">
            TOTAL: {licenseKeys.length} &nbsp;|&nbsp; MOSTRANDO: {filtered.length}
          </div>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
            <input
              type="text"
              placeholder="Buscar por código o email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-black/40 border border-zinc-800/50 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:border-[#10b981]/50 text-white"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'active', 'expired', 'available'] as KeyStatus[]).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${statusFilter === s ? 'bg-[#10b981]/10 border-[#10b981] text-[#10b981]' : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
              >
                {s === 'all' ? 'TODAS' : s === 'active' ? 'ACTIVAS' : s === 'expired' ? 'EXPIRADAS' : 'DISPONIBLES'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] bg-black/40">
              <th className="px-8 py-5">Código</th>
              <th className="px-8 py-5">Tipo / Precio</th>
              <th className="px-8 py-5">Email Vinculado</th>
              <th className="px-8 py-5">Estado / Vigencia</th>
              <th className="px-8 py-5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/30">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-8 py-16 text-center text-zinc-600 text-xs font-bold uppercase tracking-widest">
                  No hay claves que coincidan con los filtros
                </td>
              </tr>
            )}
            {filtered.map((k) => {
              const status = getStatus(k);
              const isEditing = editingKey === k.id;
              const isLoading = loadingId === k.id;

              return (
                <tr key={k.id} className={`hover:bg-white/[0.01] transition-colors ${isEditing ? 'bg-[#10b981]/5' : ''}`}>
                  {/* Code */}
                  <td className="px-8 py-5">
                    {isEditing ? (
                      <input
                        value={editForm.key_text}
                        onChange={e => setEditForm({ ...editForm, key_text: e.target.value })}
                        className="text-xs font-mono font-black bg-zinc-900 border border-[#10b981]/40 px-3 py-1.5 rounded-lg text-[#10b981] w-full focus:outline-none"
                      />
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${status === 'active' ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]' : status === 'expired' ? 'bg-red-500' : 'bg-blue-400'}`} />
                        <code className="text-sm font-mono font-black text-zinc-200 bg-white/5 px-3 py-1 rounded-lg border border-white/5">{k.key_text}</code>
                      </div>
                    )}
                  </td>

                  {/* Type / Price */}
                  <td className="px-8 py-5">
                    {isEditing ? (
                      <div className="space-y-2">
                        <select
                          value={editForm.plan_type}
                          onChange={e => setEditForm({ ...editForm, plan_type: e.target.value })}
                          className="text-xs font-black bg-zinc-900 border border-zinc-700 px-3 py-1.5 rounded-lg text-zinc-300 focus:outline-none"
                        >
                          <option value="monthly">monthly — $19.99</option>
                          <option value="yearly">yearly — $107.99</option>
                        </select>
                        {/* Nota de cambio programado */}
                        {editForm.plan_type !== k.plan_type && status === 'active' && (
                          <div className="flex items-start gap-1.5 px-2 py-1.5 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                            <Clock size={10} className="text-amber-400 mt-0.5 flex-shrink-0" />
                            <p className="text-[9px] text-amber-400 font-bold leading-tight">
                              Cambio programado. La vigencia actual se respeta.
                              El nuevo plan aplica tras expirar.
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <span className={`text-[10px] font-black uppercase ${k.plan_type === 'yearly' ? 'text-amber-400' : 'text-blue-400'}`}>
                          {k.plan_type}
                        </span>
                        <span className="text-xs text-zinc-600 font-medium">${k.price_paid} USD</span>
                      </div>
                    )}
                  </td>

                  {/* Email */}
                  <td className="px-8 py-5">
                    {k.used_by_email ? (
                      <span className="text-xs font-bold text-zinc-300">{k.used_by_email}</span>
                    ) : (
                      <span className="text-[10px] text-zinc-700 italic uppercase tracking-widest font-bold">Sin Asignar</span>
                    )}
                  </td>

                  {/* Status / Expires */}
                  <td className="px-8 py-5">
                    {isEditing ? (
                      <input
                        type="date"
                        value={editForm.expires_at}
                        onChange={e => setEditForm({ ...editForm, expires_at: e.target.value })}
                        className="text-xs bg-zinc-900 border border-zinc-700 px-3 py-1.5 rounded-lg text-zinc-300 focus:outline-none"
                      />
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        <span className={`w-fit px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${statusColors[status]}`}>
                          {statusLabels[status]}
                        </span>
                        <span className="text-[10px] text-zinc-600 font-bold italic">
                          {k.expires_at ? new Date(k.expires_at).toLocaleDateString() : '∞ VITALICIO'}
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-8 py-5">
                    <div className="flex justify-end gap-2">
                      {isEditing ? (
                        <>
                          {/* Edit buttons */}
                          <button onClick={() => saveEdit(k.id, k)} disabled={isLoading} title="Guardar" className="p-2.5 bg-[#10b981]/10 rounded-xl text-[#10b981] hover:bg-[#10b981]/20 border border-[#10b981]/30 transition-all disabled:opacity-50">
                            <Check size={15} />
                          </button>
                          <button
                            onClick={() => setEditingKey(null)}
                            className="p-2.5 bg-zinc-900/50 rounded-xl text-zinc-500 hover:text-zinc-300 border border-zinc-800 transition-all"
                            title="Cancelar"
                          >
                            <X size={15} />
                          </button>
                        </>
                      ) : confirmDeleteId === k.id ? (
                        <>
                          <button
                            onClick={() => deleteKey(k.id)}
                            disabled={isLoading}
                            className="px-3 py-2 bg-red-500/10 rounded-xl text-red-400 hover:bg-red-500/20 border border-red-500/30 text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                            title="Confirmar eliminación"
                          >
                            {isLoading ? '...' : 'CONFIRMAR'}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="p-2.5 bg-zinc-900/50 rounded-xl text-zinc-500 border border-zinc-800 transition-all"
                            title="Cancelar"
                          >
                            <X size={15} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => addMonths(k, 1)} disabled={isLoading} title="+1 Mes" className="p-2.5 bg-zinc-900/50 rounded-xl text-zinc-600 hover:bg-[#10b981]/10 hover:text-[#10b981] border border-zinc-800 transition-all disabled:opacity-40"><Plus size={14} /></button>
                          <button onClick={() => regenKey(k)} disabled={isLoading} title="Regenerar Código" className="p-2.5 bg-zinc-900/50 rounded-xl text-zinc-600 hover:bg-blue-500/10 hover:text-blue-400 border border-zinc-800 transition-all disabled:opacity-40"><RefreshCcw size={14} /></button>
                          <button onClick={() => startEdit(k)} disabled={isLoading} title="Editar" className="p-2.5 bg-zinc-900/50 rounded-xl text-zinc-600 hover:bg-amber-500/10 hover:text-amber-400 border border-zinc-800 transition-all disabled:opacity-40"><Edit3 size={14} /></button>
                          <button onClick={() => setConfirmDeleteId(k.id)} disabled={isLoading} title="Eliminar" className="p-2.5 bg-zinc-900/50 rounded-xl text-zinc-600 hover:bg-red-500/10 hover:text-red-400 border border-zinc-800 transition-all disabled:opacity-40"><Trash2 size={14} /></button>
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
