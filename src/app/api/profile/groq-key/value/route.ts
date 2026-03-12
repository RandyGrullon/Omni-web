import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { decrypt } from '@/lib/encryption';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SECRET_KEY_GROQ = 'groq_api_key';

async function getUserFromRequest(request: NextRequest) {
  const accessToken = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const refreshToken = request.headers.get('x-refresh-token') ?? '';
  if (!accessToken) return null;
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
  if (error) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

function getServiceRoleClient() {
  const key = SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false } });
}

/** Returns the decrypted Groq API key for the authenticated user (e.g. for Electron app). */
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from('user_secrets')
    .select('encrypted_value')
    .eq('user_id', user.id)
    .eq('secret_key', SECRET_KEY_GROQ)
    .maybeSingle();

  if (error || !data?.encrypted_value) {
    return NextResponse.json({ key: null }, { status: 200 });
  }

  try {
    const key = decrypt(data.encrypted_value);
    return NextResponse.json({ key });
  } catch (e) {
    console.error('[groq-key/value] decrypt error', e);
    return NextResponse.json({ key: null }, { status: 200 });
  }
}
