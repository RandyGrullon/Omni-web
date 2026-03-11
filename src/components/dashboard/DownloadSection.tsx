// src/components/dashboard/DownloadSection.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Download, Lock, ShieldCheck } from 'lucide-react';
import { NeuralButton } from '@/components/ui/NeuralButton';
import Link from 'next/link';

interface DownloadSectionProps {
  isPurchaseValid: boolean;
  onDownload: () => void;
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
            <NeuralButton onClick={onDownload} icon={<Download size={18} />} className="px-12 py-6">
              Initialize Download
            </NeuralButton>
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
