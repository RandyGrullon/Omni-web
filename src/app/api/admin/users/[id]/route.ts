// src/app/api/admin/users/[id]/route.ts
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

// ─── PATCH /api/admin/users/[id] ─────────────────────────────────────────────
// Supported actions: block, unblock, cancel, restore, change_plan
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (request.headers.get('x-admin-email') !== ADMIN_EMAIL) return unauthorized();

  try {
    const { id } = await params;
    const body = await request.json();
    const { action, plan, plan_expires_at } = body;

    let updates: Record<string, any> = {};

    switch (action) {
      case 'block':
        updates = { is_blocked: true };
        break;
      case 'unblock':
        updates = { is_blocked: false };
        break;
      case 'cancel':
        // Cancel: set cancelled_at timestamp and clear plan
        updates = {
          cancelled_at: new Date().toISOString(),
          plan: null,
          purchase_id: null,
          plan_expires_at: null,
        };
        break;
      case 'restore':
        updates = { cancelled_at: null, is_blocked: false };
        break;
      case 'change_plan':
        if (!plan) return NextResponse.json({ error: 'plan is required for change_plan' }, { status: 400 });
        updates = { plan };
        if (plan_expires_at) updates.plan_expires_at = plan_expires_at;
        break;
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ user: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── DELETE /api/admin/users/[id] ────────────────────────────────────────────
// Deletes the profile row. If SUPABASE_SERVICE_ROLE_KEY is set, also deletes
// the auth user so they cannot log in again.
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (request.headers.get('x-admin-email') !== ADMIN_EMAIL) return unauthorized();

  try {
    const { id } = await params;

    // Delete the profile first
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', id);

    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

    // If we have service role key, also delete from auth.users
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
      if (authError) {
        console.error('[API/users DELETE] auth.admin.deleteUser failed:', authError.message);
        // Don't fail the request — profile is already gone
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
