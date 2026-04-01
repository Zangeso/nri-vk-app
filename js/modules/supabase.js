import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = "https://jrwgibmbjaoogsdnukzi.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_UjoyHMlGvIvQMxKTENAUMQ_OE3GtvON";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
