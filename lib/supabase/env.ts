export function getSupabaseUrl(): string | undefined {
  return process.env.SUPABASE_URL;
}

export function getSupabasePublishableKey(): string | undefined {
  return process.env.SUPABASE_PUBLISHABLE_KEY;
}
