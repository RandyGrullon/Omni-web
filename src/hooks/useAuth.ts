import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setProfile(profileData);
      }
      setLoading(false);
    };

    getAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          setUser(session.user);
          const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
          setProfile(data);
        } else {
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => authListener.subscription.unsubscribe();
  }, []);

  // isArchitect: true if DB plan is 'architect' OR if the logged-in email matches the admin email env var
  // This ensures admin access even if the DB hasn't been updated yet or if RLS blocks the profile read
  const isArchitect =
    profile?.plan === 'architect' ||
    (!!user?.email && !!ADMIN_EMAIL && user.email === ADMIN_EMAIL);

  const hasAccess = !!profile?.purchase_id || isArchitect;

  return { user, profile, loading, isArchitect, hasAccess };
};
