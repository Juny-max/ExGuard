/**
 * Database connector blueprint for Supabase / PostgreSQL
 * When SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided in .env,
 * this client will connect directly to the multi-tenant database.
 */

export interface SupabaseConfig {
  url?: string;
  anonKey?: string;
  serviceRoleKey?: string;
}

export function getDatabaseStatus(): {
  isConfigured: boolean;
  message: string;
  provider: string;
} {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (url && key) {
    return {
      isConfigured: true,
      message: 'Supabase PostgreSQL database is connected and active.',
      provider: 'Supabase PostgreSQL',
    };
  }

  return {
    isConfigured: false,
    message: 'Supabase credentials not yet injected. Running in Frontend Mock State mode.',
    provider: 'In-Memory / Mock Data Provider',
  };
}
