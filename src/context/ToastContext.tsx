"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X, Loader2 } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'loading';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (type !== 'loading') {
      setTimeout(() => removeToast(id), 5000);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
              className={`pointer-events-auto relative overflow-hidden bg-[#0D0D0D] border border-[#222] p-4 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex items-center gap-4 font-mono group transition-all hover:border-[#00FF41]/30`}
            >
              <div className={`absolute left-0 top-0 h-full w-1 ${
                t.type === 'success' ? 'bg-[#00FF41]' : 
                t.type === 'error' ? 'bg-red-500' : 
                t.type === 'loading' ? 'bg-[#00FF41] animate-pulse' : 'bg-[#00A3FF]'
              }`} />

              <div className="flex-shrink-0">
                {t.type === 'success' && <CheckCircle2 size={20} className="text-[#00FF41]" />}
                {t.type === 'error' && <AlertCircle size={20} className="text-red-500" />}
                {t.type === 'info' && <Info size={20} className="text-[#00A3FF]" />}
                {t.type === 'loading' && <Loader2 size={20} className="text-[#00FF41] animate-spin" />}
              </div>

              <div className="flex-grow">
                <p className="text-[11px] font-black uppercase tracking-widest text-white leading-tight">
                  {t.type === 'loading' ? 'PROTOCOL_SYNC' : t.type.toUpperCase()}_LOG
                </p>
                <p className="text-[10px] text-gray-500 font-bold uppercase mt-1 leading-relaxed">
                  {t.message}
                </p>
              </div>

              <button 
                onClick={() => removeToast(t.id)}
                className="text-gray-700 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};
