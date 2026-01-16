import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Debug logs to verify keys
console.log('Supabase Config:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    urlPrefix: supabaseUrl ? supabaseUrl.substring(0, 8) : 'N/A'
});

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('CRITICAL ERROR: Supabase URL or Anon Key is missing!');
    // To prevent total app crash, we might return a dummy object or let it throw but at least we logged it.
    // Throwing here ensures we don't try to continue with bad config.
}

// Ensure we don't crash if keys are missing during development debugging
const client = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : { from: () => ({ select: () => ({ data: [], error: 'No Connection' }) }) }; // Mock fallback to prevent blank screen crash

export const supabase = client;
