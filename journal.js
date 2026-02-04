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
 * Retrieve a single journal entry by ID.
 * @param {string} id - Entry UUID.
 * @returns {Promise<Object|null>}
 */
async function getEntryById(id) {
    const { data, error } = await supabaseClient
        .from('journal_entries')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Failed to fetch entry:', error.message);
        return null;
    }
    return data;
}

/**
 * Update an existing journal entry.
 * @param {string} id - Entry UUID.
 * @param {Object} fields - { title, date, content }
 */
async function updateEntry(id, fields) {
    const { error } = await supabaseClient
        .from('journal_entries')
        .update({
            title: fields.title,
            date: fields.date,
            content: fields.content,
        })
        .eq('id', id);

    if (error) {
        console.error('Failed to update entry:', error.message);
        alert('Failed to update entry. Please try again.');
        return false;
    }

    window.location.href = 'journal.html';
    return true;
}

/**
 * Delete a journal entry by ID.
 * @param {string} id - Entry UUID.
 * @returns {Promise<boolean>}
 */
async function deleteEntry(id) {
    const { error } = await supabaseClient
        .from('journal_entries')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Failed to delete entry:', error.message);
        return false;
    }
    return true;
}

/**
 * Show inline delete confirmation on an entry card, then delete on confirm.
 * @param {string} id - Entry UUID.
 * @param {HTMLElement} cardElement - The card DOM node.
 */
function confirmDeleteEntry(id, cardElement) {
    const actions = cardElement.querySelector('.entry-card__actions');
    if (!actions) return;

    const original = actions.innerHTML;

    actions.innerHTML = '';

    const msg = document.createElement('span');
    msg.className = 'entry-card__confirm-msg';
    msg.textContent = 'Delete this entry?';

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'entry-card__btn entry-card__btn--confirm';
    confirmBtn.type = 'button';
    confirmBtn.textContent = 'Yes, delete';
    confirmBtn.addEventListener('click', async () => {
        const success = await deleteEntry(id);
        if (success) {
            cardElement.remove();
            if (window._journalEntries) {
                window._journalEntries = window._journalEntries.filter(e => e.id !== id);
            }
        } else {
            actions.innerHTML = original;
            reattachCardListeners(actions, id, cardElement);
        }
    });

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'entry-card__btn';
    cancelBtn.type = 'button';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => {
        actions.innerHTML = original;
        reattachCardListeners(actions, id, cardElement);
    });

    actions.appendChild(msg);
    actions.appendChild(confirmBtn);
    actions.appendChild(cancelBtn);
}

/**
 * Re-attach event listeners after restoring action buttons HTML.
 */
function reattachCardListeners(actions, id, cardElement) {
    const deleteBtn = actions.querySelector('.entry-card__btn--delete');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => confirmDeleteEntry(id, cardElement));
    }
}

/**
 * Create an entry card DOM element for rendering.
 * @param {Object} entry
 * @returns {HTMLElement}
 */
function createEntryCard(entry) {
    const card = document.createElement('article');
    card.className = 'entry-card';
    card.dataset.entryId = entry.id;

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

    const actions = document.createElement('div');
    actions.className = 'entry-card__actions';

    const editBtn = document.createElement('a');
    editBtn.className = 'entry-card__btn';
    editBtn.href = 'new-entry.html?id=' + entry.id;
    editBtn.textContent = 'Edit';

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'entry-card__btn entry-card__btn--delete';
    deleteBtn.type = 'button';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => confirmDeleteEntry(entry.id, card));

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    card.appendChild(title);
    card.appendChild(timeEl);
    card.appendChild(content);
    card.appendChild(actions);
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

    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('id');
    const prefillDate = urlParams.get('date');

    const titleInput = document.getElementById('title');
    const dateInput = document.getElementById('date');
    const contentInput = document.getElementById('content');
    const templateSelect = document.getElementById('template');
    const templateLabel = templateSelect ? templateSelect.previousElementSibling : null;
    const submitBtn = form.querySelector('button[type="submit"]');
    const pageHeading = document.querySelector('.page-header h2');
    const pageEyebrow = document.querySelector('.page-header .eyebrow');

    // Edit mode: fetch entry and pre-fill form
    if (editId) {
        const entry = await getEntryById(editId);
        if (!entry) {
            alert('Entry not found.');
            window.location.href = 'journal.html';
            return;
        }

        if (titleInput) titleInput.value = entry.title;
        if (dateInput) dateInput.value = entry.date;
        if (contentInput) contentInput.value = entry.content;
        if (pageHeading) pageHeading.textContent = 'Edit Entry';
        if (pageEyebrow) pageEyebrow.textContent = 'Update';
        if (submitBtn) submitBtn.textContent = 'Update Entry';
        if (templateSelect) templateSelect.style.display = 'none';
        if (templateLabel) templateLabel.style.display = 'none';
    } else if (prefillDate) {
        if (dateInput) dateInput.value = prefillDate;
    }

    const templates = {
        daily: `YYYY-MM-DD — DAY OF THE WEEK\n\nMORNING INTENTION\nWhat is the one thing this day is for?\n\n- \n\nREADING\nWhat did I read today? What stayed with me?\n\n- Book / Article:\n- Pages:\n- Thought:\n\nWORK / CRAFT\nWhat did I actually work on?\n\n- \n\nPERSONAL / FAMILY\nMoments that mattered.\n\n- `,
        weekly: `WEEK XX — YYYY\nTheme: (A single word or phrase)\n\nFOCUS OF THE WEEK\nIf nothing else happens, this must happen:\n\n- \n\nREADING GOALS\nBe realistic. Slow is still forward.\n\n- Book:\n- Target:\n\nWRITING / JOURNALING GOALS\nWhat do I want to say this week?\n\n- \n\nLIFE & RELATIONSHIPS\nWho needs my presence?\n\n- \n\nTASKS (ONLY WHAT MATTERS)\n- \n- \n- \n\nNOTES & ADJUSTMENTS\nWhat needs to change midweek?\n\n\nREFLECTION\nWhat went well?\nWhat felt heavy?\nWhat deserves gratitude?\n\n- \n\nCLOSING THOUGHT\nOne sentence to carry into tomorrow.`,
        reflection: `REFLECTION — YYYY-MM-DD\n\nWHAT I LEARNED\nAbout myself, others, or the world.\n\n- \n\nWHAT I READ THAT CHANGED ME\nA sentence, an idea, a shift.\n\n- \n\nPATTERNS I NOTICE\nGood or bad—name them.\n\n- \n\nWHAT I NEED LESS OF\nBe honest.\n\n- \n\nWHAT I NEED MORE OF\nAlso be honest.\n\n- \n\nONE DECISION GOING FORWARD\nSmall. Concrete. Real.`,
        book: `BOOK TITLE — AUTHOR\n\nWHY I'M READING THIS\nWhat called me to it?\n\n- \n\nKEY IDEAS\n- \n- \n- \n\nQUOTES WORTH KEEPING\n""\n\nMY RESPONSE\nAgreement, resistance, questions.\n\n- \n\nWHERE THIS FITS IN MY LIFE\nWhat does this book ask of me?\n\n`,
        personal: `PERSONAL INDEX\n\nCURRENT READING\n- \n\nCURRENT FOCUS\n- \n\nOPEN QUESTIONS\n- \n\nIDEAS TO REVISIT\n- \n`
    };

    if (templateSelect && !editId) {
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
        const title = titleInput.value.trim();
        const date = dateInput.value;
        const content = contentInput.value.trim();
        if (!title || !date || !content) {
            alert('Please fill in all fields.');
            return;
        }
        if (editId) {
            await updateEntry(editId, { title, date, content });
        } else {
            await addEntry({ title, date, content });
        }
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
