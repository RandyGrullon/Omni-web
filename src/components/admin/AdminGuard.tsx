// src/components/admin/AdminGuard.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export const AdminGuard = ({ children }: { children: React.ReactNode }) => {
  const { profile, loading, isArchitect } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && !isArchitect) {
      router.push('/');
    }
  }, [loading, isArchitect, router]);

  if (loading || !isArchitect) {
    return (
      <div className="min-h-screen bg-[#020202] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          {mounted ? (
            <Loader2 className="text-[#10b981] animate-spin" size={40} />
          ) : (
            <div className="w-10 h-10" aria-hidden />
          )}
          <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em]">
            Authenticating_Architect_Privileges...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
