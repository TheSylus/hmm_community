import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://heikdrzyibpirttzioks.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlaWtkcnp5aWJwaXJ0dHppb2tzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NTM3MjQsImV4cCI6MjA3NzQyOTcyNH0.Ux_vopo2L-GJ7xRG0AEY1DDJcBks1TykO5X26RBjh8I';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
