import { createClient } from 'jsr:@supabase/supabase-js@2';

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!;
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!;
const GOOGLE_REDIRECT_URI = Deno.env.get('GOOGLE_REDIRECT_URI')!;

export { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI };

export function getSupabaseAdmin() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
}

export function getSupabaseClient(authHeader: string) {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );
}

export function getUserId(authHeader: string): string | null {
  try {
    const token = authHeader.replace('Bearer ', '');
    // Decode JWT payload (base64url) — the Supabase gateway already verified the signature
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.sub || null;
  } catch {
    return null;
  }
}

interface TokenRow {
  access_token: string;
  refresh_token: string;
  token_expiry: string;
}

export async function getValidAccessToken(userId: string): Promise<{ token: string } | { error: string }> {
  const admin = getSupabaseAdmin();

  const { data, error } = await admin
    .from('google_tokens')
    .select('access_token, refresh_token, token_expiry')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return { error: 'google_disconnected' };
  }

  const row = data as TokenRow;
  const expiry = new Date(row.token_expiry);
  const now = new Date();

  // If token still valid (with 60s buffer), return it
  if (expiry.getTime() - now.getTime() > 60_000) {
    return { token: row.access_token };
  }

  // Refresh the token
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: row.refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) {
    // Token was likely revoked
    await admin.from('google_tokens').delete().eq('user_id', userId);
    await admin.auth.admin.updateUserById(userId, {
      user_metadata: { google_calendar_connected: false },
    });
    return { error: 'google_disconnected' };
  }

  const tokens = await res.json();
  const newExpiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  await admin
    .from('google_tokens')
    .update({
      access_token: tokens.access_token,
      token_expiry: newExpiry,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  return { token: tokens.access_token };
}

export async function googleCalendarRequest(
  accessToken: string,
  method: string,
  path: string,
  body?: Record<string, unknown>,
): Promise<Response> {
  const url = `https://www.googleapis.com/calendar/v3${path}`;
  const options: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  return fetch(url, options);
}

export function buildSignedState(userId: string): string {
  // Simple state: base64-encode the userId + timestamp
  const payload = JSON.stringify({ userId, ts: Date.now() });
  return btoa(payload);
}

export function parseSignedState(state: string): { userId: string; ts: number } | null {
  try {
    const payload = JSON.parse(atob(state));
    // Reject states older than 10 minutes
    if (Date.now() - payload.ts > 10 * 60 * 1000) return null;
    return payload;
  } catch {
    return null;
  }
}
