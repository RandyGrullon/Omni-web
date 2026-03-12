// src/components/ui/NeuralModal.tsx
"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, Info, CheckCircle2 } from 'lucide-react';

interface NeuralModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'error' | 'info' | 'success';
}

export const NeuralModal: React.FC<NeuralModalProps> = ({ 
  isOpen, onClose, title, message, type = 'info' 
}) => {
  const icons = {
    error: <AlertCircle className="text-red-500" size={40} />,
    info: <Info className="text-blue-500" size={40} />,
    success: <CheckCircle2 className="text-[#00FF41]" size={40} />
  };

  const colors = {
    error: 'border-red-500/30',
    info: 'border-blue-500/30',
    success: 'border-[#00FF41]/30'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
          />
          <div className="fixed inset-0 flex items-center justify-center z-[101] p-6 pointer-events-none">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`max-w-md w-full bg-[#0D0D0D] border ${colors[type]} p-8 rounded-[2.5rem] pointer-events-auto shadow-2xl relative overflow-hidden font-mono`}
            >
              <div className="absolute top-0 right-0 p-6">
                <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col items-center text-center gap-6">
                <div className={`p-4 rounded-3xl bg-white/5 border border-white/5`}>
                  {icons[type]}
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-black uppercase tracking-tighter text-white">{title}</h3>
                  <p className="text-gray-500 text-xs uppercase tracking-widest leading-relaxed">{message}</p>
                </div>

                <button 
                  onClick={onClose}
                  className="w-full py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-black text-[10px] tracking-[0.3em] uppercase transition-all"
                >
                  Confirm_Protocol
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
