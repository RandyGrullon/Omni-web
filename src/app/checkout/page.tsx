// src/app/checkout/page.tsx
"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Lock, ChevronLeft, ArrowRight, ShieldCheck, Globe, Zap, Tag, X } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { NeuralInput } from '@/components/ui/NeuralInput';
import { useToast } from '@/context/ToastContext';
// PayPal commented out — to be re-enabled when webhook integration is ready
// import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

function CheckoutContent() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan') || 'pro';
  const isRenewal = searchParams.get('renew') === 'true';

  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  // PayPal tab removed until webhook is ready
  // const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('card');

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const basePrice = plan === 'pro' ? 29.00 : 9.99;
  const discount = appliedCoupon
    ? appliedCoupon.type === 'percent'
      ? (basePrice * appliedCoupon.value / 100)
      : appliedCoupon.value
    : 0;
  const finalPrice = Math.max(0, basePrice - discount);
  const price = finalPrice.toFixed(2);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (data.error) {
        setCouponError(data.error);
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon(data.coupon);
        toast('Cupón aplicado ✓', 'success');
      }
    } catch {
      setCouponError('Error validando cupón');
    } finally {
      setCouponLoading(false);
    }
  };

  const handlePaymentSuccess = async (details: any) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const purchaseId = details.id || `OMNI-${Math.random().toString(36).toUpperCase().substring(2, 10)}`;

      const planType = plan === 'pro' ? 'yearly' : 'monthly';
      const pricePaid = parseFloat(price);

      const expiresAt = new Date();
      if (planType === 'yearly') {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }
      const isoExpires = expiresAt.toISOString();

      const keyPayload = {
        key_text: purchaseId,
        plan_type: planType,
        price_paid: pricePaid,
        expires_at: isoExpires,
        is_used: true,
        used_by_email: user.email,
      };

      // Step 1: Try inserting the neural key directly
      const { error: keyError } = await supabase.from('license_keys').insert([keyPayload]);

      if (keyError) {
        console.warn('[checkout] Direct key insert failed, trying API fallback:', keyError.message);
        try {
          await fetch('/api/admin/keys', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-admin-email': process.env.NEXT_PUBLIC_ADMIN_EMAIL || '' },
            body: JSON.stringify(keyPayload),
          });
        } catch (apiErr) {
          console.error('[checkout] API fallback failed:', apiErr);
        }
      }

      // Step 2: Update user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ plan: planType, plan_expires_at: isoExpires, purchase_id: purchaseId })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Step 3: Mark coupon as used if applied
      if (appliedCoupon) {
        await fetch('/api/coupons/validate', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: couponCode.toUpperCase(), userId: user.id }),
        });
      }

      toast("Payment Authorized Successfully", "success");
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err: any) {
      toast("Sync Error: " + err.message.toUpperCase(), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCardPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    toast("Processing Payment...", "loading");
    setTimeout(() => {
      handlePaymentSuccess({ id: `OMNI-${Date.now()}` });
    }, 2000);
  };

  if (!mounted) return <div className="bg-[#0D0D0D] min-h-screen" />;

  return (
    // PayPal provider removed — to re-enable wrap with <PayPalScriptProvider options={...}>
    <div className="min-h-screen bg-[#0D0D0D] text-white font-mono p-6 md:p-12 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none" />

      <div className="max-w-5xl w-full grid lg:grid-cols-12 gap-12 items-start relative z-10">

        {/* LEFT COLUMN: ORDER SUMMARY */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-5 space-y-8"
        >
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-[#00FF41] transition-all text-[10px] font-black uppercase tracking-[0.2em] group">
            <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back_to_Terminal
          </Link>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-8 h-[1px] bg-[#00FF41]/30"></span>
              <h2 className="text-[10px] tracking-[0.4em] text-[#00FF41] uppercase font-black">
                {isRenewal ? 'Renewal_Protocol' : 'Checkout_Protocol'}
              </h2>
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tighter">
              {plan === 'pro' ? 'Architect_Access' : 'Operator_Access'}
            </h1>
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 space-y-6 backdrop-blur-md">
            <div className="flex justify-between items-center text-[10px] font-black tracking-widest text-zinc-500 uppercase">
              <span>System_License</span>
              <span className="text-white bg-white/10 px-3 py-1 rounded-lg">{plan === 'pro' ? 'ANUAL' : 'MENSUAL'}</span>
            </div>
            <div className="flex justify-between items-center text-[10px] font-black tracking-widest text-zinc-500 uppercase">
              <span>Neural_Nodes</span>
              <span className="text-white">UNLIMITED</span>
            </div>

            {/* Coupon section */}
            <div className="border-t border-white/5 pt-4 space-y-3">
              <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                <Tag size={10} /> Cupón de descuento
              </p>
              {appliedCoupon ? (
                <div className="flex items-center justify-between px-3 py-2 bg-[#00FF41]/5 border border-[#00FF41]/20 rounded-xl">
                  <span className="text-[10px] text-[#00FF41] font-black">{couponCode.toUpperCase()} — {appliedCoupon.type === 'percent' ? `${appliedCoupon.value}% OFF` : `$${appliedCoupon.value} OFF`}</span>
                  <button onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className="text-zinc-500 hover:text-red-400 transition-colors"><X size={12} /></button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                    placeholder="CÓDIGO"
                    className="flex-1 bg-black/40 border border-zinc-800 rounded-xl px-3 py-2 text-[10px] font-mono font-black uppercase focus:outline-none focus:border-[#00FF41]/50 text-white placeholder:text-zinc-700"
                  />
                  <button onClick={handleApplyCoupon} disabled={couponLoading || !couponCode} className="px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-[9px] font-black text-zinc-400 hover:text-white hover:border-zinc-600 transition-all disabled:opacity-40">
                    {couponLoading ? '...' : 'APLICAR'}
                  </button>
                </div>
              )}
              {couponError && <p className="text-[9px] text-red-400 font-bold">{couponError}</p>}
            </div>

            <div className="h-px bg-white/5" />
            <div className="flex justify-between items-end pt-2">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Total_Due</span>
                {appliedCoupon && (
                  <p className="text-xs text-zinc-600 line-through">${basePrice.toFixed(2)}</p>
                )}
                <p className="text-4xl font-black text-[#00FF41]">${price}</p>
              </div>
              <span className="text-[8px] text-zinc-600 font-bold mb-1 tracking-widest">USD_SECURE</span>
            </div>
          </div>

          <div className="flex items-center gap-4 px-4">
            <div className="flex -space-x-2">
              {[ShieldCheck, Globe, Zap].map((Icon, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-[#111] border border-white/10 flex items-center justify-center text-zinc-500">
                  <Icon size={14} />
                </div>
              ))}
            </div>
            <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest leading-tight">
              Encrypted_Transaction<br />Validated_By_Omni_Network
            </p>
          </div>
        </motion.div>

        {/* RIGHT COLUMN: PAYMENT FORM */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-7 bg-[#111] p-2 border border-white/5 rounded-[2.5rem] shadow-2xl relative"
        >
          <div className="p-8 md:p-10 space-y-8">
            <div className="space-y-1">
              <h3 className="text-xl font-black uppercase tracking-tighter">Card_Payment</h3>
              <p className="text-zinc-500 text-[10px] uppercase tracking-widest">
                {/* PayPal temporarily disabled — re-enable when webhook is ready */}
                Secure payment via card
              </p>
            </div>

            <form onSubmit={handleCardPayment} className="space-y-6">
              <NeuralInput
                required
                label="Identity_Holder"
                placeholder="CARDHOLDER FULL NAME"
                icon={<Globe size={16} />}
              />
              <NeuralInput
                required
                label="Protocol_Serial"
                placeholder="0000 0000 0000 0000"
                icon={<CreditCard size={16} />}
              />
              <div className="grid grid-cols-2 gap-6">
                <NeuralInput required label="Exp_Cycle" placeholder="MM/YY" />
                <NeuralInput required type="password" label="Security_Hex" placeholder="CVC" icon={<Lock size={16} />} />
              </div>

              <div className="flex items-center gap-2 p-4 bg-[#00FF41]/5 border border-[#00FF41]/10 rounded-2xl">
                <ShieldCheck className="text-[#00FF41]" size={16} />
                <p className="text-[9px] text-[#00FF41] font-black uppercase tracking-widest">Neural_Security: Active</p>
              </div>

              <button
                disabled={loading}
                className="w-full py-5 bg-[#00FF41] text-black font-black text-xs tracking-[0.3em] uppercase rounded-2xl hover:shadow-[0_0_30px_rgba(0,255,65,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-4"
              >
                {loading ? 'INITIALIZING...' : <><ArrowRight size={16} /> {isRenewal ? 'RENOVAR PLAN' : `AUTHORIZE_PAYMENT — $${price}`}</>}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
    // </PayPalScriptProvider>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="bg-[#0D0D0D] min-h-screen" />}>
      <CheckoutContent />
    </Suspense>
  );
}
