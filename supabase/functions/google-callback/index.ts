import {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
  getSupabaseAdmin,
  parseSignedState,
} from '../_shared/google-client.ts';

const FRONTEND_URL = Deno.env.get('FRONTEND_URL') || 'https://jotflow.me';

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      return Response.redirect(`${FRONTEND_URL}/todos?google=error&reason=${error}`, 302);
    }

    if (!code || !state) {
      return Response.redirect(`${FRONTEND_URL}/todos?google=error&reason=missing_params`, 302);
    }

    const parsed = parseSignedState(state);
    if (!parsed) {
      return Response.redirect(`${FRONTEND_URL}/todos?google=error&reason=invalid_state`, 302);
    }

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error('Token exchange failed:', errBody);
      return Response.redirect(`${FRONTEND_URL}/todos?google=error&reason=token_exchange`, 302);
    }

    const tokens = await tokenRes.json();
    const admin = getSupabaseAdmin();
    const expiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Upsert tokens
    const { error: dbError } = await admin
      .from('google_tokens')
      .upsert({
        user_id: parsed.userId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expiry: expiry,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (dbError) {
      console.error('DB upsert error:', dbError);
      return Response.redirect(`${FRONTEND_URL}/todos?google=error&reason=db_error`, 302);
    }

    // Set user metadata flag
    await admin.auth.admin.updateUserById(parsed.userId, {
      user_metadata: { google_calendar_connected: true },
    });

    return Response.redirect(`${FRONTEND_URL}/todos?google=connected`, 302);
  } catch (err) {
    console.error('google-callback error:', err);
    return Response.redirect(`${FRONTEND_URL}/todos?google=error&reason=internal`, 302);
  }
});
