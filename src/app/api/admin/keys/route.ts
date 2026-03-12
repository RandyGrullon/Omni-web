// src/app/api/admin/keys/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Use service role key if available (bypasses RLS completely), else fall back to anon
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

// Admin-level supabase client (server-side only)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── GET /api/admin/keys ────────────────────────────────────────────────────
// Returns all license_keys and auto-syncs any user in `profiles` who has a
// purchase_id that doesn't yet have a matching row in license_keys.
export async function GET(request: Request) {
  // Auth: allow only known admin email (sent in header from client)
  const callerEmail = request.headers.get('x-admin-email') ?? '';
  if (!ADMIN_EMAIL || callerEmail !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // ── 1. Fetch all profiles that have completed a purchase ──────────────
    const { data: profilesWithKeys, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, plan, purchase_id, plan_expires_at')
      .not('purchase_id', 'is', null)
      .neq('plan', 'architect');

    if (profilesError) {
      console.error('[API/keys] profiles fetch error:', profilesError.message);
    }

    // ── 2. Fetch all existing license_keys ───────────────────────────────
    const { data: existingKeys, error: keysError } = await supabaseAdmin
      .from('license_keys')
      .select('key_text');

    if (keysError) {
      console.error('[API/keys] license_keys fetch error:', keysError.message);
      return NextResponse.json({ error: keysError.message }, { status: 500 });
    }

    const existingKeyTexts = new Set((existingKeys ?? []).map((k: any) => k.key_text));

    // ── 3. Find profiles whose purchase_id is NOT in license_keys ─────────
    const missingProfiles = (profilesWithKeys ?? []).filter(
      (p: any) => p.purchase_id && !existingKeyTexts.has(p.purchase_id)
    );

    let syncedCount = 0;
    if (missingProfiles.length > 0) {
      console.log(`[API/keys] Syncing ${missingProfiles.length} missing neural keys…`);

      const inserts = missingProfiles.map((p: any) => {
        // 'pro' and 'yearly' both map to yearly pricing
        const planType = p.plan === 'pro' || p.plan === 'yearly' ? 'yearly' : 'monthly';
        const pricePaid = planType === 'yearly' ? 29.0 : 9.99;

        let expiresAt = p.plan_expires_at;
        if (!expiresAt) {
          const d = new Date();
          planType === 'yearly'
            ? d.setFullYear(d.getFullYear() + 1)
            : d.setMonth(d.getMonth() + 1);
          expiresAt = d.toISOString();
        }

        return {
          key_text: p.purchase_id,
          plan_type: planType,
          price_paid: pricePaid,
          expires_at: expiresAt,
          is_used: true,
          used_by_email: p.email,
        };
      });

      const { error: insertError } = await supabaseAdmin
        .from('license_keys')
        .insert(inserts);

      if (insertError) {
        // Log but don't fail – we'll still return whatever already exists
        console.error('[API/keys] Sync insert error:', insertError.message);
      } else {
        syncedCount = inserts.length;
      }
    }

    // ── 4. Return the final, complete list of keys ───────────────────────
    const { data: finalKeys, error: finalError } = await supabaseAdmin
      .from('license_keys')
      .select('*')
      .order('created_at', { ascending: false });

    if (finalError) {
      return NextResponse.json({ error: finalError.message }, { status: 500 });
    }

    return NextResponse.json({
      keys: finalKeys ?? [],
      synced: syncedCount,
    });
  } catch (err: any) {
    console.error('[API/keys] Unexpected error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── POST /api/admin/keys ───────────────────────────────────────────────────
// Upsert a single neural key. Called by admin panel when generating a key,
// and also from checkout to guarantee the key lands in the table.
export async function POST(request: Request) {
  const callerEmail = request.headers.get('x-admin-email') ?? '';
  if (!ADMIN_EMAIL || callerEmail !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { key_text, plan_type, price_paid, expires_at, is_used, used_by_email } = body;

    if (!key_text || !plan_type) {
      return NextResponse.json({ error: 'Missing required fields: key_text, plan_type' }, { status: 400 });
    }

    // Avoid duplicates
    const { data: existing } = await supabaseAdmin
      .from('license_keys')
      .select('id')
      .eq('key_text', key_text)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ message: 'Key already exists', id: existing.id });
    }

    const { data, error } = await supabaseAdmin
      .from('license_keys')
      .insert([{ key_text, plan_type, price_paid, expires_at, is_used, used_by_email }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ key: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
