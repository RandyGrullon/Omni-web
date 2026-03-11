// src/components/ui/NeuralBadge.tsx
import React from 'react';

interface NeuralBadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'danger' | 'warning' | 'info';
  size?: 'xs' | 'sm';
}

export const NeuralBadge: React.FC<NeuralBadgeProps> = ({ children, variant = 'info', size = 'xs' }) => {
  const variants = {
    success: "bg-[#00FF41]/10 text-[#00FF41] border-[#00FF41]/20",
    danger: "bg-red-500/10 text-red-500 border-red-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    info: "bg-white/5 text-gray-400 border-white/10"
  };

  const sizes = {
    xs: "text-[7px] px-2 py-0.5",
    sm: "text-[9px] px-3 py-1"
  };

  return (
    <span className={`inline-block rounded-lg font-black uppercase tracking-widest border ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
};
