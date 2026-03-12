const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8');
let url = '', key = '';
env.split('\n').forEach(l => {
  if(l.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url=l.split('=')[1].trim();
  if(l.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) key=l.split('=')[1].trim();
});

const supabase = createClient(url, key);

async function test() {
  const { data, error } = await supabase.from('license_keys').insert([
    { key_text: 'OMNI-TEST-123', plan_type: 'monthly', price_paid: 9.99, expires_at: new Date().toISOString() }
  ]).select();
  console.log('INSERT DATA:', data);
  console.log('INSERT ERROR:', error);
}
test();
