
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function promoteAdmin() {
  const email = 'thanarasansivanujan@gmail.com';
  
  // Find user by email
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
  if (userError) {
    console.error('Error listing users:', userError);
    return;
  }

  const user = users.find(u => u.email === email);
  if (!user) {
    console.error('User not found:', email);
    return;
  }

  // Update profile
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ 
      id: user.id, 
      role: 'superadmin', 
      status: 'active',
      updated_at: new Date().toISOString()
    });

  if (profileError) {
    console.error('Error updating profile:', profileError);
  } else {
    console.log('Successfully promoted thanarasansivanujan@gmail.com to superadmin');
  }
}

promoteAdmin();
