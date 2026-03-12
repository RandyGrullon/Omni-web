import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';
import { encrypt } from '@/lib/encryption';

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

async function validateGroqKey(key: string): Promise<boolean> {
  try {
    const groq = new Groq({ apiKey: key });
    await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: 'Hi' }],
      max_tokens: 1,
    });
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { key?: string; confirmKey?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const key = typeof body.key === 'string' ? body.key.trim() : '';
  const confirmKey = typeof body.confirmKey === 'string' ? body.confirmKey.trim() : '';

  if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 });
  if (confirmKey && key !== confirmKey) {
    return NextResponse.json({ error: 'Key and confirmation do not match' }, { status: 400 });
  }

  const valid = await validateGroqKey(key);
  if (!valid) {
    return NextResponse.json({ error: 'Invalid Groq API key or Groq service error' }, { status: 400 });
  }

  try {
    const encrypted = encrypt(key);
    const supabase = getServiceRoleClient();
    const { error } = await supabase.from('user_secrets').upsert(
      {
        user_id: user.id,
        secret_key: SECRET_KEY_GROQ,
        encrypted_value: encrypted,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,secret_key' }
    );
    if (error) {
      console.error('[groq-key] upsert error', error);
      return NextResponse.json({ error: 'Failed to save key' }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message.includes('ENCRYPTION_KEY')) {
      return NextResponse.json(
        { error: 'Server encryption not configured. Add ENCRYPTION_KEY to .env.local (min 32 characters, or 64 hex characters).' },
        { status: 503 }
      );
    }
    console.error('[groq-key] encrypt/save error', e);
    return NextResponse.json({ error: 'Failed to save key' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from('user_secrets')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('secret_key', SECRET_KEY_GROQ)
    .maybeSingle();

  if (error) {
    console.error('[groq-key-status] select error', error);
    return NextResponse.json({ hasKey: false });
  }
  return NextResponse.json({ hasKey: !!data });
}
