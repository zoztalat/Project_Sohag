import { createClient } from '@supabase/supabase-js';

// البيانات اللي إنت بعتها
const supabaseUrl = 'https://pidasuiignkfcvijygle.supabase.co';
const supabaseAnonKey = 'sb_publishable_R-hzkpchyOgC_SbTac4i6w_1aO0Q3kN';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);