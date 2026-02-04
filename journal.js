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

    const content = document.createElement('div');
    content.className = 'entry-card__content';
    // Escape HTML then preserve line breaks
    const escaped = entry.content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    content.innerHTML = escaped.replace(/\n/g, '<br>');

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
    const todos = await getTodos();
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

    initJournalCalendarWidget(entries, todos);

    const todosWidget = document.getElementById('todosWidget');
    if (todosWidget) {
        renderTodosWidget(todosWidget, todos);
    }
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
        daily: `YYYY-MM-DD — DAY OF THE WEEK\n\nMORNING INTENTION\nWhat is the one thing this day is for?\n\n- \n\nREADING\nWhat did I read today? What stayed with me?\n\n- Book / Article:\n- Pages:\n- Thought:\n\nWORK / CRAFT\nWhat did I actually work on?\n\n- \n\nPERSONAL / FAMILY\nMoments that mattered.\n\n- `,
        weekly: `WEEK XX — YYYY\nTheme: (A single word or phrase)\n\nFOCUS OF THE WEEK\nIf nothing else happens, this must happen:\n\n- \n\nREADING GOALS\nBe realistic. Slow is still forward.\n\n- Book:\n- Target:\n\nWRITING / JOURNALING GOALS\nWhat do I want to say this week?\n\n- \n\nLIFE & RELATIONSHIPS\nWho needs my presence?\n\n- \n\nTASKS (ONLY WHAT MATTERS)\n- \n- \n- \n\nNOTES & ADJUSTMENTS\nWhat needs to change midweek?\n\n\nREFLECTION\nWhat went well?\nWhat felt heavy?\nWhat deserves gratitude?\n\n- \n\nCLOSING THOUGHT\nOne sentence to carry into tomorrow.`,
        reflection: `REFLECTION — YYYY-MM-DD\n\nWHAT I LEARNED\nAbout myself, others, or the world.\n\n- \n\nWHAT I READ THAT CHANGED ME\nA sentence, an idea, a shift.\n\n- \n\nPATTERNS I NOTICE\nGood or bad—name them.\n\n- \n\nWHAT I NEED LESS OF\nBe honest.\n\n- \n\nWHAT I NEED MORE OF\nAlso be honest.\n\n- \n\nONE DECISION GOING FORWARD\nSmall. Concrete. Real.`,
        book: `BOOK TITLE — AUTHOR\n\nWHY I'M READING THIS\nWhat called me to it?\n\n- \n\nKEY IDEAS\n- \n- \n- \n\nQUOTES WORTH KEEPING\n""\n\nMY RESPONSE\nAgreement, resistance, questions.\n\n- \n\nWHERE THIS FITS IN MY LIFE\nWhat does this book ask of me?\n\n`,
        personal: `PERSONAL INDEX\n\nCURRENT READING\n- \n\nCURRENT FOCUS\n- \n\nOPEN QUESTIONS\n- \n\nIDEAS TO REVISIT\n- \n`
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
    } else if (page === 'todos') {
        initTodosPage();
    }
});
