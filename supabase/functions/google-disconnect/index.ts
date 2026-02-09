import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { getUserId, getSupabaseAdmin } from '../_shared/google-client.ts';

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = await getUserId(authHeader);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = getSupabaseAdmin();

    // Get the token to revoke it
    const { data: tokenRow } = await admin
      .from('google_tokens')
      .select('access_token')
      .eq('user_id', userId)
      .single();

    if (tokenRow?.access_token) {
      // Revoke token at Google (best-effort)
      await fetch(
        `https://oauth2.googleapis.com/revoke?token=${tokenRow.access_token}`,
        { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      ).catch(() => {});
    }

    // Delete tokens from DB
    await admin.from('google_tokens').delete().eq('user_id', userId);

    // Clear user metadata flag
    await admin.auth.admin.updateUserById(userId, {
      user_metadata: { google_calendar_connected: false },
    });

    // Nullify google_calendar_event_id on all user's todos
    await admin
      .from('todos')
      .update({ google_calendar_event_id: null })
      .eq('user_id', userId);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('google-disconnect error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
