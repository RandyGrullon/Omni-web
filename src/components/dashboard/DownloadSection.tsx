// src/components/dashboard/DownloadSection.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Download, Lock } from 'lucide-react';
import { NeuralButton } from '@/components/ui/NeuralButton';
import Link from 'next/link';

const iconSize = 28;

const WindowsLogo = () => (
  <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" className="shrink-0" aria-hidden>
    <path fill="#000" d="M3 5.5L10.5 4.2V11.5H3V5.5Z" />
    <path fill="#000" d="M10.5 4.2L21 3V11.5H10.5V4.2Z" />
    <path fill="#000" d="M3 18.5V12H10.5V19.8L3 18.5Z" />
    <path fill="#000" d="M10.5 12H21V21L10.5 19.8V12Z" />
  </svg>
);

const AppleLogo = () => (
  <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" className="shrink-0" aria-hidden>
    <path fill="#000" d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
  </svg>
);

interface DownloadSectionProps {
  isPurchaseValid: boolean;
  onDownload: (platform: 'windows' | 'mac') => void;
}

export const DownloadSection: React.FC<DownloadSectionProps> = ({ isPurchaseValid, onDownload }) => {
  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
      className={`relative overflow-hidden rounded-[3rem] p-1 transition-all duration-1000 ${isPurchaseValid ? 'bg-gradient-to-br from-[#00FF41]/20 via-transparent to-transparent' : 'bg-gradient-to-br from-red-500/10 via-transparent to-transparent'}`}
    >
      <div className="bg-[#0D0D0D] border border-[#222] rounded-[2.8rem] p-8 md:p-16 relative overflow-hidden text-left">
        {isPurchaseValid ? (
          <div className="relative z-10 text-left">
            <div className="inline-flex items-center gap-3 bg-[#00FF41]/10 border border-[#00FF41]/20 px-4 py-2 rounded-full mb-10 text-left">
              <Download className="text-[#00FF41] animate-bounce" size={16} />
              <span className="text-[10px] font-black text-[#00FF41] uppercase tracking-widest text-left">Protocol Ready for Uplink</span>
            </div>
            <h2 className="text-6xl font-black mb-6 uppercase tracking-tighter leading-[0.9] text-left text-white">
              Omni_HUD <br/> <span className="text-[#00FF41]">Elite_Build</span>
            </h2>
            <p className="text-gray-500 mb-12 text-xs tracking-widest leading-loose uppercase max-w-lg text-left">
              Full neural integration enabled. optimized for low-latency desktop execution. 
              v4.0.2 includes advanced screen processing and voice engine.
            </p>
            <p className="text-[12px] font-black text-gray-500 uppercase tracking-widest mb-4 text-left">Elige tu plataforma</p>
            <div className="grid grid-cols-2 gap-5 max-w-2xl">
              <button
                type="button"
                onClick={() => onDownload('windows')}
                className="group flex flex-col items-center justify-center gap-4 w-full py-8 px-6 rounded-2xl bg-[#00FF41] text-black border border-[#00FF41]/40 shadow-lg shadow-[#00FF41]/10 hover:shadow-xl hover:shadow-[#00FF41]/20 hover:border-[#00FF41] transition-all duration-200 active:scale-[0.98]"
              >
                <span className="flex items-center justify-center w-14 h-14 rounded-xl bg-black/10 p-2.5 transition-colors group-hover:bg-black/15">
                  <WindowsLogo />
                </span>
                <span className="font-bold text-sm md:text-base uppercase tracking-wider text-center">
                  Windows
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-widest text-black/70">
                  .exe installer
                </span>
              </button>
              <button
                type="button"
                onClick={() => onDownload('mac')}
                className="group flex flex-col items-center justify-center gap-4 w-full py-8 px-6 rounded-2xl bg-[#00FF41] text-black border border-[#00FF41]/40 shadow-lg shadow-[#00FF41]/10 hover:shadow-xl hover:shadow-[#00FF41]/20 hover:border-[#00FF41] transition-all duration-200 active:scale-[0.98]"
              >
                <span className="flex items-center justify-center w-14 h-14 rounded-xl bg-black/10 p-2.5 transition-colors group-hover:bg-black/15">
                  <AppleLogo />
                </span>
                <span className="font-bold text-sm md:text-base uppercase tracking-wider text-center">
                  macOS
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-widest text-black/70">
                  .dmg installer
                </span>
              </button>
            </div>
          </div>
        ) : (
          <div className="relative z-10 text-left">
            <div className="inline-flex items-center gap-3 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-full mb-10 text-left">
              <Lock className="text-red-500" size={16} />
              <span className="text-[10px] font-black text-red-500 uppercase tracking-widest text-left">Neural Link Offline</span>
            </div>
            <h2 className="text-6xl font-black mb-6 uppercase tracking-tighter leading-[0.9] text-gray-300 text-left">
              Access_ <br/> <span className="text-red-500/50 italic">Restricted</span>
            </h2>
            <p className="text-gray-500 mb-12 text-xs tracking-widest leading-loose uppercase max-w-lg text-left">
              The Omni HUD software requires an authorized neural protocol to initialize synchronization. 
              Purchase a plan to unlock the elite engineer toolkit.
            </p>
            <div className="flex gap-4">
              <Link href="/#pricing">
                <NeuralButton variant="secondary" className="px-12 py-6">Unlock Protocol</NeuralButton>
              </Link>
            </div>
          </div>
        )}
      </div>
    </motion.section>
  );
};
