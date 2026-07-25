import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://likajtjowrmwjkoieznp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpa2FqdGpvd3Jtd2prb2llem5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5NTgwNTEsImV4cCI6MjEwMDUzNDA1MX0.wknTP5CnWIm92YILSn91obuNLQry-p-A2qjjew6I0V0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);