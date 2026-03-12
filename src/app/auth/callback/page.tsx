// src/app/auth/callback/page.tsx
// CLIENT component: Google OAuth returns tokens in the URL hash (#access_token=...)
// which only the browser can read — server-side routes cannot access it.
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase reads the #access_token from the URL hash automatically
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('[callback] getSession error:', error.message);
          router.replace('/auth?error=auth_callback_failed');
          return;
        }

        if (session) {
          // Ensure the user has a profile row
          const user = session.user;
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .single();

          if (!profile) {
            await supabase.from('profiles').insert({
              id: user.id,
              email: user.email,
              first_name: user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0],
              last_name: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
              username: user.email?.split('@')[0],
              plan: 'free',
            });
          }

          const params = new URLSearchParams(window.location.search);
          const next = params.get('next') || '/dashboard';
          router.replace(next);
        } else {
          // Wait for SIGNED_IN event with a safety timeout
          const { data: listener } = supabase.auth.onAuthStateChange((event, sess) => {
            if (event === 'SIGNED_IN' && sess) {
              listener.subscription.unsubscribe();
              const params = new URLSearchParams(window.location.search);
              router.replace(params.get('next') || '/dashboard');
            }
          });

          setTimeout(() => {
            listener.subscription.unsubscribe();
            router.replace('/auth?error=auth_callback_failed');
          }, 5000);
        }
      } catch (err) {
        console.error('[callback] unexpected error:', err);
        router.replace('/auth?error=auth_callback_failed');
      }
    };

    handleCallback();
  }, [router]);

  // Pure CSS spinner — no SVG icons, avoids Dark Reader extension hydration conflicts
  return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-[#10b981]/20 border-t-[#10b981] rounded-full animate-spin" />
        <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em] font-mono">
          Authorizing_Neural_Identity...
        </p>
      </div>
    </div>
  );
}
