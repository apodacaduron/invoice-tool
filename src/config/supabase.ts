import { createClient } from '@supabase/supabase-js';
// import { Database } from '../../types_db';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
// export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
