/*
 * journal.js
 *
 * Handles storing, retrieving and displaying journal entries using Supabase.
 * Entries are stored in the "journal_entries" table and scoped per user via
 * Row Level Security.
 */

/**
 * Retrieve journal entries from Supabase for the current user.
 * @returns {Promise<Array<Object>>} Array of entry objects.
 */
async function getEntries() {
    const { data, error } = await supabaseClient
        .from('journal_entries')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Failed to fetch journal entries:', error.message);
        return [];
    }
    return data || [];
}

/**
 * Add a new journal entry to Supabase.
 * @param {Object} entry - The entry to add (title, date, content).
 */
async function addEntry(entry) {
    const user = await getCurrentUser();
    if (!user) return;

    const { error } = await supabaseClient
        .from('journal_entries')
        .insert({
            user_id: user.id,
            title: entry.title,
            date: entry.date,
            content: entry.content,
        });

    if (error) {
        console.error('Failed to save entry:', error.message);
        alert('Failed to save entry. Please try again.');
        return;
    }

    window.location.href = 'journal.html';
}

/**
 * Create an entry card DOM element for rendering.
 * @param {Object} entry
 * @returns {HTMLElement}
 */
function createEntryCard(entry) {
    const card = document.createElement('article');
    card.className = 'entry-card';

    const title = document.createElement('h3');
    title.textContent = entry.title;

    const timeEl = document.createElement('time');
    const dateObj = new Date(`${entry.date}T00:00:00Z`);
    timeEl.textContent = dateObj.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC'
    });

    const content = document.createElement('p');
    content.textContent = entry.content;

    card.appendChild(title);
    card.appendChild(timeEl);
    card.appendChild(content);
    return card;
}

/**
 * Initialize the journal page by rendering entries.
 */
async function initJournalPage() {
    const session = await requireAuth();
    if (!session) return;

    updateNavForAuth();

    const container = document.getElementById('entriesContainer');
    if (!container) return;

    const entries = await getEntries();
    window._journalEntries = entries;

    if (entries.length === 0) {
        const p = document.createElement('p');
        p.textContent = 'No entries yet. Use the "Add Entry" page to begin your journal.';
        container.appendChild(p);
    } else {
        entries.forEach(entry => {
            container.appendChild(createEntryCard(entry));
        });
    }

    initJournalCalendarWidget(entries);
}

/**
 * Initialize the new entry page by setting up the form handler.
 */
async function initNewEntryPage() {
    const session = await requireAuth();
    if (!session) return;

    updateNavForAuth();

    const form = document.getElementById('entryForm');
    if (!form) return;

    // Pre-fill date from URL param if present (e.g. ?date=2026-01-15)
    const urlParams = new URLSearchParams(window.location.search);
    const prefillDate = urlParams.get('date');
    if (prefillDate) {
        const dateInput = document.getElementById('date');
        if (dateInput) dateInput.value = prefillDate;
    }

    const templates = {
        daily: `# YYYY-MM-DD — Day of the Week\n\n## Morning Intention\nWhat is the one thing this day is for?\n\n- \n\n## Reading\nWhat did I read today? What stayed with me?\n\n- Book / Article:\n- Pages:\n- Thought:\n\n## Work / Craft\nWhat did I *actually* work on?\n\n- \n\n## Personal / Family\nMoments that mattered.\n\n- `,
        weekly: `# Week XX — YYYY\nTheme: (A single word or phrase)\n\n## Focus of the Week\nIf nothing else happens, this must happen:\n\n- \n\n## Reading Goals\nBe realistic. Slow is still forward.\n\n- Book:\n- Target:\n\n## Writing / Journaling Goals\nWhat do I want to *say* this week?\n\n- \n\n## Life & Relationships\nWho needs my presence?\n\n- \n\n## Tasks (Only What Matters)\n- [ ] \n- [ ] \n- [ ] \n\n## Notes & Adjustments\nWhat needs to change midweek?\n\n\n## Reflection\nWhat went well?\nWhat felt heavy?\nWhat deserves gratitude?\n\n- \n\n## Closing Thought\nOne sentence to carry into tomorrow.`,
        reflection: `# Reflection — YYYY-MM-DD\n\n## What I Learned\nAbout myself, others, or the world.\n\n- \n\n## What I Read That Changed Me\nA sentence, an idea, a shift.\n\n- \n\n## Patterns I Notice\nGood or bad—name them.\n\n- \n\n## What I Need Less Of\nBe honest.\n\n- \n\n## What I Need More Of\nAlso be honest.\n\n- \n\n## One Decision Going Forward\nSmall. Concrete. Real.`,
        book: `# Book Title — Author\n\n## Why I'm Reading This\nWhat called me to it?\n\n- \n\n## Key Ideas\n- \n- \n- \n\n## Quotes Worth Keeping\n> ""\n\n## My Response\nAgreement, resistance, questions.\n\n- \n\n## Where This Fits in My Life\nWhat does this book ask of me?\n\n`,
        personal: `# Personal Index\n\n## Current Reading\n- \n\n## Current Focus\n- \n\n## Open Questions\n- \n\n## Ideas to Revisit\n- \n`
    };

    const templateSelect = document.getElementById('template');
    const contentInput = document.getElementById('content');
    if (templateSelect) {
        templateSelect.addEventListener('change', function () {
            const selected = this.value;
            if (templates[selected]) {
                contentInput.value = templates[selected];
            } else {
                contentInput.value = '';
            }
        });
    }

    form.addEventListener('submit', async event => {
        event.preventDefault();
        const titleInput = document.getElementById('title');
        const dateInput = document.getElementById('date');
        const contentInput = document.getElementById('content');
        const title = titleInput.value.trim();
        const date = dateInput.value;
        const content = contentInput.value.trim();
        if (!title || !date || !content) {
            alert('Please fill in all fields.');
            return;
        }
        await addEntry({ title, date, content });
    });
}

/**
 * Add a logout link to the nav bar if the user is authenticated.
 */
function updateNavForAuth() {
    const nav = document.querySelector('nav ul');
    if (!nav || document.getElementById('logoutLink')) return;

    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = '#';
    a.id = 'logoutLink';
    a.textContent = 'Sign Out';
    a.addEventListener('click', async (e) => {
        e.preventDefault();
        await signOut();
    });
    li.appendChild(a);
    nav.appendChild(li);
}

// Automatically initialize the appropriate page
document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.getAttribute('data-page');
    if (page === 'journal') {
        initJournalPage();
    } else if (page === 'new-entry') {
        initNewEntryPage();
    } else if (page === 'calendar') {
        initCalendarPage();
    }
});
