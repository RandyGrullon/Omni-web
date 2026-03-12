import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { get } from '@vercel/blob';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const BLOB_PATHNAMES: Record<'windows' | 'mac', { pathname: string; filename: string }> = {
  windows: { pathname: 'Omni_HUD_Setup.exe', filename: 'Omni_HUD_Setup.exe' },
  mac: { pathname: 'Omni_HUD_mac.dmg', filename: 'Omni_HUD_mac.dmg' },
};

export async function GET(request: NextRequest) {
  const platform = request.nextUrl.searchParams.get('platform') as 'windows' | 'mac' | null;
  if (!platform || platform !== 'windows' && platform !== 'mac') {
    return NextResponse.json({ error: 'Missing or invalid platform' }, { status: 400 });
  }

  const accessToken = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const refreshToken = request.headers.get('x-refresh-token') ?? '';
  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 503 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (sessionError) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('purchase_id')
    .eq('id', user.id)
    .single();

  if (!profile?.purchase_id) {
    return NextResponse.json({ error: 'Purchase required' }, { status: 403 });
  }

  const { pathname, filename } = BLOB_PATHNAMES[platform];

  try {
    const result = await get(pathname, { access: 'private' });

    if (!result || result.statusCode !== 200) {
      return NextResponse.json({ error: 'Installer not found' }, { status: 404 });
    }

    return new NextResponse(result.stream, {
      headers: {
        'Content-Type': result.blob.contentType ?? 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (err) {
    console.error('[download/installer] Blob get error:', err);
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ error: 'Blob storage not configured' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Installer not found' }, { status: 404 });
  }
}
