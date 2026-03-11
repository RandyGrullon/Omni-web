// src/components/ui/NeuralButton.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface NeuralButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  loading?: boolean;
  icon?: React.ReactNode;
  glow?: boolean;
}

export const NeuralButton: React.FC<NeuralButtonProps> = ({ 
  children, variant = 'primary', loading, icon, glow = true, className = '', ...props 
}) => {
  const baseStyles = "px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden relative group";
  
  const variants = {
    primary: "bg-[#00FF41] text-black hover:shadow-[0_0_30px_rgba(0,255,65,0.4)]",
    secondary: "bg-white text-black hover:bg-[#00FF41]",
    danger: "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white",
    outline: "bg-[#111] border border-[#222] text-gray-400 hover:text-white hover:border-white/20"
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {loading ? <Loader2 className="animate-spin" size={16} /> : (
        <>
          {icon && <span className="relative z-10">{icon}</span>}
          <span className="relative z-10">{children}</span>
        </>
      )}
      {glow && variant === 'primary' && (
        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
      )}
    </button>
  );
};
