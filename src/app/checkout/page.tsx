// src/app/checkout/page.tsx
"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CreditCard, Lock, ChevronLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan') || 'pro';
  
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("No user found");

      // Simular ID de compra profesional
      const purchaseId = `OMNI-${Math.random().toString(36).toUpperCase().substring(2, 10)}`;

      // Actualizar el perfil en Supabase
      const { error } = await supabase
        .from('profiles')
        .update({ 
          plan: plan,
          purchase_id: purchaseId 
        })
        .eq('id', user.id);

      if (error) throw error;

      router.push('/dashboard');
    } catch (err: any) {
      alert("Billing Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return <div className="bg-[#0D0D0D] min-h-screen" />;

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white font-mono p-6 md:p-12 flex items-center justify-center">
      <div className="max-w-4xl w-full grid md:grid-cols-2 gap-12 items-start">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-[#00FF41] transition-colors mb-12 text-sm uppercase">
            <ChevronLeft size={16} /> Back
          </Link>
          <h2 className="text-[10px] tracking-[0.4em] text-[#00FF41] mb-4 uppercase font-black text-white/40">Checkout_Protocol</h2>
          <h1 className="text-4xl font-black mb-8 uppercase">
            {plan === 'pro' ? 'Architect Access' : 'Operator Access'}
          </h1>
          <div className="space-y-6 py-8 border-y border-[#222]">
            <div className="flex justify-between items-center text-sm"><span className="text-gray-500 uppercase">License</span><span>LIFETIME</span></div>
            <div className="flex justify-between items-center text-xl font-bold"><span>DUE</span><span className="text-[#00FF41]">${plan === 'pro' ? '29.00' : '0.00'}</span></div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-[#111] p-10 border border-[#222] rounded-3xl shadow-2xl">
          <form onSubmit={handlePayment} className="space-y-6">
            <input required type="text" placeholder="CARD IDENTITY" className="w-full bg-transparent border-b border-[#333] py-2 focus:border-[#00FF41] outline-none text-sm" />
            <div className="grid grid-cols-2 gap-8">
              <input required type="text" placeholder="MM/YY" className="w-full bg-transparent border-b border-[#333] py-2 focus:border-[#00FF41] outline-none text-sm" />
              <input required type="password" placeholder="CVC" className="w-full bg-transparent border-b border-[#333] py-2 focus:border-[#00FF41] outline-none text-sm" />
            </div>
            <button disabled={loading} className="w-full py-5 bg-[#00FF41] text-black font-black text-xs tracking-[0.3em] uppercase rounded-xl hover:shadow-[0_0_30px_rgba(0,255,65,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? 'INITIALIZING...' : <>AUTHORIZE PAYMENT <ArrowRight size={16} /></>}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="bg-[#0D0D0D] min-h-screen" />}>
      <CheckoutContent />
    </Suspense>
  );
}
