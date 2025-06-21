const { createClient } = require('@supabase/supabase-js');

let supabase;
function connectDB() {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  console.log('✅ Supabase connected');
}

module.exports = { connectDB, getSupabase: () => supabase };