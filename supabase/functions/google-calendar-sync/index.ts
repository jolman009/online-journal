import { corsHeaders, handleCors } from '../_shared/cors.ts';
import {
  getUserId,
  getValidAccessToken,
  googleCalendarRequest,
  getSupabaseAdmin,
} from '../_shared/google-client.ts';

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

    const { action, todo } = await req.json();

    if (!action || !todo) {
      return new Response(JSON.stringify({ error: 'Missing action or todo' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tokenResult = await getValidAccessToken(userId);
    if ('error' in tokenResult) {
      return new Response(JSON.stringify({ error: tokenResult.error }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const accessToken = tokenResult.token;
    const admin = getSupabaseAdmin();

    if (action === 'delete') {
      // Delete calendar event
      if (!todo.google_calendar_event_id) {
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const res = await googleCalendarRequest(
        accessToken,
        'DELETE',
        `/calendars/primary/events/${todo.google_calendar_event_id}`,
      );

      // 404 means already deleted — that's fine
      if (!res.ok && res.status !== 404) {
        console.error('Calendar delete failed:', await res.text());
      }

      // Clear the event ID from the todo
      await admin
        .from('todos')
        .update({ google_calendar_event_id: null })
        .eq('id', todo.id)
        .eq('user_id', userId);

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'upsert') {
      // If todo has no date, delete existing event and clear ID
      if (!todo.date) {
        if (todo.google_calendar_event_id) {
          await googleCalendarRequest(
            accessToken,
            'DELETE',
            `/calendars/primary/events/${todo.google_calendar_event_id}`,
          );
          await admin
            .from('todos')
            .update({ google_calendar_event_id: null })
            .eq('id', todo.id)
            .eq('user_id', userId);
        }
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const eventBody = {
        summary: todo.text,
        start: { date: todo.date },
        end: { date: todo.date },
        description: 'Synced from JotFlow',
        transparency: 'transparent',
      };

      let eventId = todo.google_calendar_event_id;

      if (eventId) {
        // Update existing event
        const res = await googleCalendarRequest(
          accessToken,
          'PUT',
          `/calendars/primary/events/${eventId}`,
          eventBody,
        );

        if (res.status === 404) {
          // Event was deleted externally, create a new one
          eventId = null;
        } else if (!res.ok) {
          const errText = await res.text();
          console.error('Calendar update failed:', errText);
          return new Response(JSON.stringify({ error: 'calendar_api_error' }), {
            status: 502,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      if (!eventId) {
        // Create new event
        const res = await googleCalendarRequest(
          accessToken,
          'POST',
          '/calendars/primary/events',
          eventBody,
        );

        if (!res.ok) {
          const errText = await res.text();
          console.error('Calendar create failed:', errText);
          return new Response(JSON.stringify({ error: 'calendar_api_error' }), {
            status: 502,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const event = await res.json();
        eventId = event.id;
      }

      // Save event ID to todo
      await admin
        .from('todos')
        .update({ google_calendar_event_id: eventId })
        .eq('id', todo.id)
        .eq('user_id', userId);

      return new Response(JSON.stringify({ eventId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('google-calendar-sync error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
