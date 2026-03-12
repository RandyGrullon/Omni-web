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
  const { data, error } = await supabase.from('admin_license_keys').select('*');
  console.log('DATA:', data);
  console.log('ERROR:', error);
}
test();
