// src/components/ui/NeuralCard.tsx
import { motion } from 'framer-motion';
import React from 'react';

interface NeuralCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'danger' | 'success' | 'warning';
  hoverGlow?: boolean;
}

export const NeuralCard: React.FC<NeuralCardProps> = ({ 
  children, 
  className = '', 
  variant = 'default',
  hoverGlow = true 
}) => {
  const borderColors = {
    default: 'border-[#222] hover:border-[#00FF41]/30',
    danger: 'border-red-500/20 hover:border-red-500/40',
    success: 'border-[#00FF41]/20 hover:border-[#00FF41]/40',
    warning: 'border-amber-500/20 hover:border-amber-500/40'
  };

  return (
    <div className={`bg-[#111] border ${borderColors[variant]} rounded-[2.5rem] p-8 transition-all duration-500 relative overflow-hidden group shadow-2xl ${className}`}>
      {hoverGlow && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      )}
      {children}
    </div>
  );
};
