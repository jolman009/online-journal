/*
 * supabase.js
 *
 * Initializes the Supabase client and exposes helpers for authentication
 * and journal entry CRUD operations.
 */

const SUPABASE_URL = 'https://hjqfnaxtpnswvrpfgrdi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqcWZuYXh0cG5zd3ZycGZncmRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxOTk4NDksImV4cCI6MjA4NTc3NTg0OX0.PtoRjur_UwyxSvHF9eJukiN38A1tB-zRzB2kPvpTZPA';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/** Redirect to login if there is no active session. */
async function requireAuth() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
        return null;
    }
    return session;
}

/** Get the current user or null. */
async function getCurrentUser() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    return user;
}

/** Sign out and redirect to login page. */
async function signOut() {
    await supabaseClient.auth.signOut();
    window.location.href = 'login.html';
}
