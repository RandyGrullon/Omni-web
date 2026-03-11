// src/components/ui/NeuralInput.tsx
import React from 'react';

interface NeuralInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const NeuralInput: React.FC<NeuralInputProps> = ({ label, error, icon, className = '', ...props }) => {
  return (
    <div className="space-y-2 w-full text-left">
      {label && (
        <label className="text-[8px] text-gray-600 uppercase font-black tracking-[0.2em] ml-1">
          {label}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-[#00FF41] transition-colors">
            {icon}
          </div>
        )}
        <input
          className={`w-full bg-black border border-[#222] p-4 rounded-2xl text-xs text-white focus:border-[#00FF41]/50 focus:bg-black/80 outline-none transition-all ${icon ? 'pl-12' : ''} ${error ? 'border-red-500/50' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-[8px] text-red-500 font-bold uppercase tracking-widest ml-1">{error}</p>}
    </div>
  );
};
