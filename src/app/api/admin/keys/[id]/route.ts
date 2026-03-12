// src/app/api/admin/keys/[id]/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// ─── PATCH /api/admin/keys/[id] ─────────────────────────────────────────────
// Update a key: plan_type, expires_at, key_text, is_used
// Scheduled plan change: if the key is still active when plan_type changes,
// the profile keeps its current plan until expiry. After expiry, the new
// plan_type applies. If the key is already expired, apply immediately.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (request.headers.get('x-admin-email') !== ADMIN_EMAIL) return unauthorized();

  try {
    const body = await request.json();
    const { id } = await params;

    const allowed = ['plan_type', 'expires_at', 'key_text', 'is_used', 'used_by_email', 'price_paid'];
    const updates: Record<string, any> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // ── Fetch current key state ───────────────────────────────────────────
    const { data: currentKey } = await supabaseAdmin
      .from('license_keys')
      .select('key_text, used_by_email, plan_type, expires_at')
      .eq('id', id)
      .single();

    // ── key_text changed → update profile's purchase_id ──────────────────
    if (updates.key_text && currentKey?.used_by_email) {
      await supabaseAdmin
        .from('profiles')
        .update({ purchase_id: updates.key_text })
        .eq('email', currentKey.used_by_email);
    }

    // ── expires_at changed → sync to profile ─────────────────────────────
    if (updates.expires_at && currentKey?.used_by_email) {
      await supabaseAdmin
        .from('profiles')
        .update({ plan_expires_at: updates.expires_at })
        .eq('email', currentKey.used_by_email);
    }

    // ── Scheduled plan_type change logic ──────────────────────────────────
    // Determine if the key is still active using the NEW expires_at (if changed)
    // or the current one.
    const effectiveExpiry = updates.expires_at ?? currentKey?.expires_at;
    const isStillActive = effectiveExpiry && new Date(effectiveExpiry) > new Date();
    const planTypeChanged = updates.plan_type && updates.plan_type !== currentKey?.plan_type;

    let scheduled = false;

    if (planTypeChanged && currentKey?.used_by_email) {
      if (isStillActive) {
        // Scheduled: keep profile.plan as-is until the key expires.
        // The new plan_type is stored on the license_keys row (applied below).
        // On the next billing cycle / renewal, the new plan_type will be used.
        scheduled = true;
        console.log(`[keys/PATCH] Scheduled plan change ${currentKey.plan_type} → ${updates.plan_type} for ${currentKey.used_by_email} (expires ${effectiveExpiry})`);
        // We still sync new price to profile if price changes (for display purposes)
        // but DO NOT change profile.plan yet.
      } else {
        // Key already expired → apply new plan to profile immediately
        await supabaseAdmin
          .from('profiles')
          .update({ plan: updates.plan_type })
          .eq('email', currentKey.used_by_email);
      }
    }

    const { data, error } = await supabaseAdmin
      .from('license_keys')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ key: data, scheduled });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── DELETE /api/admin/keys/[id] ────────────────────────────────────────────
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (request.headers.get('x-admin-email') !== ADMIN_EMAIL) return unauthorized();

  try {
    const { id } = await params;

    const { error } = await supabaseAdmin
      .from('license_keys')
      .delete()
      .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
