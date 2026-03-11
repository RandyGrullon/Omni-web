// src/components/admin/KeysTable.tsx
import React from 'react';
import { Clock, Trash2, Activity } from 'lucide-react';

interface KeysTableProps {
  licenseKeys: any[];
  deleteKey: (id: string) => void;
}

export const KeysTable: React.FC<KeysTableProps> = ({ licenseKeys, deleteKey }) => {
  return (
    <>
      <div className="p-8 border-b border-zinc-800/50 flex justify-between items-center bg-black/20">
        <div className="flex items-center gap-4 text-left">
          <div className="p-3 bg-zinc-800/50 rounded-xl text-[#10b981]"><Activity size={20} /></div>
          <h3 className="font-bold text-xl tracking-tight text-left">Registro de Neural Keys</h3>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800/20 border border-zinc-800/50 rounded-xl text-[10px] font-black text-zinc-500">
          CLAVES TOTALES: {licenseKeys.length}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] bg-black/40">
              <th className="px-8 py-5 text-left">Código de Acceso</th>
              <th className="px-8 py-5 text-left">Tipo / Precio</th>
              <th className="px-8 py-5 text-left">Sujeto Vinculado</th>
              <th className="px-8 py-5 text-left">Estado / Expiración</th>
              <th className="px-8 py-5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/30">
            {licenseKeys.map((k) => (
              <tr key={k.id} className="hover:bg-white/[0.01] transition-colors group">
                <td className="px-8 py-6 text-left">
                  <div className="flex items-center gap-3 text-left">
                    <div className={`w-2 h-2 rounded-full ${k.is_used ? 'bg-red-500' : 'bg-[#10b981] shadow-[0_0_8px_#10b981]'}`} />
                    <code className="text-sm font-mono font-black text-zinc-200 bg-white/5 px-3 py-1 rounded-lg border border-white/5 text-left">{k.key_text}</code>
                  </div>
                </td>
                <td className="px-8 py-6 text-left">
                  <div className="flex flex-col text-left">
                    <span className={`text-[10px] font-black uppercase text-left ${k.plan_type === 'yearly' ? 'text-amber-400' : 'text-blue-400'}`}>{k.plan_type}</span>
                    <span className="text-xs text-zinc-600 font-medium text-left">${k.price_paid} USD</span>
                  </div>
                </td>
                <td className="px-8 py-6 text-left">
                  {k.used_by_email ? (
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-zinc-300 text-left">{k.used_by_email}</span>
                      <span className="text-[9px] text-[#10b981] font-black tracking-tighter uppercase mt-0.5 opacity-70 text-left">Protocolo Activo</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-zinc-700 italic uppercase tracking-widest font-bold text-left">Disponible</span>
                  )}
                </td>
                <td className="px-8 py-6 text-left">
                  <div className="flex flex-col gap-1.5 text-left">
                    <span className={`w-fit px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${k.is_used ? 'bg-red-500/10 text-red-400' : 'bg-[#10b981]/10 text-[#10b981]'}`}>
                      {k.is_used ? 'USADA' : 'DISPONIBLE'}
                    </span>
                    <span className="text-[10px] text-zinc-600 flex items-center gap-1 font-bold italic text-left"><Clock size={10} /> {new Date(k.expires_at).toLocaleDateString()}</span>
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <button onClick={() => deleteKey(k.id)} className="p-3 bg-zinc-900/50 rounded-xl text-zinc-600 hover:bg-red-500/10 hover:text-red-500 border border-zinc-800 transition-all"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};
