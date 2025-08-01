// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://xqtasatjxfchzzkhnmci.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxdGFzYXRqeGZjaHp6a2hubWNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NzI4ODMsImV4cCI6MjA2NzM0ODg4M30.qYVTj_pYCXCmltThZCrrSKLC5dzSkqGSrF9Wofc-2sg";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});