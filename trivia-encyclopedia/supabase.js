// ============================================
// SUPABASE CLIENT
// ============================================
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ntmbqgvlqongaetzpeyv.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50bWJxZ3ZscW9uZ2FldHpwZXl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MzgxODMsImV4cCI6MjA4ODAxNDE4M30.CLo5qNZ8FBMG_D1uzCWg3S4eHqmrhTHHGUgb9zyT1NY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
