const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

let supabase = null;

const getSupabase = () => {
    if (!supabase) {
        supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_KEY
        );
    }
    return supabase;
};

module.exports = { getSupabase }; 