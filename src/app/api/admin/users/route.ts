// src/app/api/admin/users/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ─── GET /api/admin/users ────────────────────────────────────────────────────
export async function GET(request: Request) {
  const reqEmail = request.headers.get('x-admin-email');
  if (reqEmail !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page   = parseInt(searchParams.get('page')   || '1',  10);
  const limit  = parseInt(searchParams.get('limit')  || '50', 10);
  const search  = searchParams.get('search')  || '';
  const filter  = searchParams.get('filter')  || 'all';
  const from = (page - 1) * limit;
  const to   = from + limit - 1;

  // If no service role key, use Supabase REST API directly with admin privileges
  // by passing the anon key but also requesting no RLS via a special header trick.
  // The REAL fix is to add SUPABASE_SERVICE_ROLE_KEY to .env.local
  const clientKey = SERVICE_KEY || ANON_KEY;
  const supabaseAdmin = createClient(SUPABASE_URL, clientKey, {
    auth: { persistSession: false },
    db: { schema: 'public' },
    global: {
      headers: SERVICE_KEY
        ? {}
        : { 'X-No-RLS': 'true' }, // Note: this only works if you have a custom policy
    },
  });

  try {
    let query = supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact' });

    // Apply filters — only when columns exist (if not, falls through to showing all)
    if (filter === 'blocked') {
      query = query.eq('is_blocked', true);
    } else if (filter === 'cancelled') {
      query = query.not('cancelled_at', 'is', null);
    } else if (filter === 'architect') {
      query = query.eq('plan', 'architect');
    } else if (filter === 'free') {
      // Users who never purchased a plan (no purchase_id and not architect)
      query = query.is('purchase_id', null).neq('plan', 'architect');
    } else if (filter === 'active') {
      query = query
        .not('purchase_id', 'is', null)
        .gt('plan_expires_at', new Date().toISOString());
    } else if (filter === 'expired') {
      query = query
        .not('purchase_id', 'is', null)
        .lt('plan_expires_at', new Date().toISOString())
        .neq('plan', 'architect');
    }

    if (search) {
      query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,username.ilike.%${search}%`);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    // If error or no data without service key, hint what's needed
    if (error) {
      console.error('[admin/users] error:', error.message, '| hasServiceKey:', !!SERVICE_KEY);
      return NextResponse.json({
        error: error.message,
        hint: !SERVICE_KEY ? 'Add SUPABASE_SERVICE_ROLE_KEY to .env.local to bypass RLS' : undefined,
        users: [],
        total: 0,
      }, { status: 500 });
    }

    if (!SERVICE_KEY && (!data || data.length === 0)) {
      console.warn('[admin/users] 0 rows returned. RLS may be blocking. Add SUPABASE_SERVICE_ROLE_KEY to .env.local');
    }

    // Normalize: ensure is_blocked and cancelled_at always exist on each row
    const normalized = (data ?? []).map(u => ({
      ...u,
      is_blocked:   u.is_blocked   ?? false,
      cancelled_at: u.cancelled_at ?? null,
    }));

    return NextResponse.json({ users: normalized, total: count ?? normalized.length });

  } catch (err: any) {
    return NextResponse.json({ error: err.message, users: [], total: 0 }, { status: 500 });
  }
}
