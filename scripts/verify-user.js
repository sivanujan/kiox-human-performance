const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Error: Missing Supabase Environment Variables (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function verifyUser(email) {
  if (!email) {
    console.error("Usage: node scripts/verify-user.js <email>");
    process.exit(1);
  }

  console.log(`Searching for user: ${email}...`);

  // 1. Get user by email
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error("Error listing users:", listError.message);
    process.exit(1);
  }

  const targetUser = users.find(u => u.email === email);

  if (!targetUser) {
    console.error(`User with email ${email} not found in Auth system.`);
    process.exit(1);
  }

  console.log(`Found user: ${targetUser.id}. Overriding verification status...`);

  // 2. Update user to be confirmed
  const { data, error } = await supabase.auth.admin.updateUserById(
    targetUser.id,
    { email_confirm: true }
  );

  if (error) {
    console.error("Error updating user:", error.message);
    process.exit(1);
  }

  console.log("Success: User has been manually verified.");
  console.log("They can now log in and proceed past Step 2.");
}

const emailArg = process.argv[2];
verifyUser(emailArg);
