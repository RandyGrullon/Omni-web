const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8');
let url = '', key = '';
env.split('\n').forEach(l => {
  if(l.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url=l.split('=')[1].trim();
  if(l.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) key=l.split('=')[1].trim();
});

const supabase = createClient(url, key);

async function syncKeys() {
  console.log('Fetching profiles with purchase_id...');
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .not('purchase_id', 'is', null);

  if (error) {
    console.error('Error fetching profiles:', error);
    return;
  }

  console.log(`Found ${profiles?.length || 0} profiles with a purchase_id.`);
  
  if (!profiles) return;

  let insertedCount = 0;
  for (const p of profiles) {
    if (p.plan === 'architect') continue;
    
    // Check if key already exists
    const { data: existing } = await supabase
      .from('license_keys')
      .select('id')
      .eq('key_text', p.purchase_id)
      .maybeSingle();
      
    if (!existing) {
      console.log(`Inserting missing key for ${p.email} (${p.purchase_id})...`);
      const planType = p.plan === 'pro' ? 'yearly' : 'monthly';
      
      const { error: insErr } = await supabase.from('license_keys').insert([{
        key_text: p.purchase_id,
        plan_type: planType,
        price_paid: planType === 'yearly' ? 29.00 : 9.99,
        expires_at: p.plan_expires_at || new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
        is_used: true,
        used_by_email: p.email
      }]);
      
      if (insErr) {
        console.error('Failed to insert key:', p.purchase_id, insErr);
      } else {
        insertedCount++;
      }
    } else {
      console.log(`Key ${p.purchase_id} already exists in DB.`);
    }
  }
  
  console.log(`Sync completed. Inserted ${insertedCount} missing keys.`);
}

syncKeys();
