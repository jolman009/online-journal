/*
 * journal.js
 *
 * This script handles storing, retrieving and displaying journal entries using
 * the browser's localStorage API. Entries are saved under the key
 * "journalEntries" as a JSON string. Each entry consists of a title, date,
 * content, and a timestamp for ordering.
 */

/**
 * Retrieve journal entries from the server.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of entry objects.
 */
async function getEntries() {
    try {
        const response = await fetch('/api/entries');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (e) {
        console.error('Failed to fetch journal entries:', e);
        return [];
    }
}

/**
 * Add a new journal entry by sending it to the server.
 * @param {Object} entry - The entry to add.
 */
async function addEntry(entry) {
    try {
        const response = await fetch('/api/entries', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(entry),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        // Redirect to journal page after successful submission
        window.location.href = 'journal.html';
    } catch (error) {
        console.error('Failed to save entry:', error);
        alert('Failed to save entry. Please try again.');
    }
}

/**
 * Initialize the journal page by rendering entries.
 * This function should be called on load of journal.html.
 */
async function initJournalPage() {
    const container = document.getElementById('entriesContainer');
    if (!container) return;
    const entries = await getEntries();
    // Sort entries by timestamp descending
    entries.sort((a, b) => b.timestamp - a.timestamp);
    if (entries.length === 0) {
        const p = document.createElement('p');
        p.textContent = 'No entries yet. Use the "Add Entry" page to begin your journal.';
        container.appendChild(p);
        return;
    }
    entries.forEach(entry => {
        const card = document.createElement('article');
        card.className = 'entry-card';
        const title = document.createElement('h3');
        title.textContent = entry.title;
        const timeEl = document.createElement('time');
        // Format the date in a human friendly way
        // Create a Date object in UTC by appending a zero‑hour UTC offset. Without
        // specifying a time zone some browsers treat the ISO date string as UTC
        // while others treat it as local, which can cause the displayed day to be
        // off by one depending on the user’s timezone. Using a fixed UTC offset
        // avoids this issue.
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
        container.appendChild(card);
    });
}

/**
 * Initialize the new entry page by setting up the form handler.
 * This function should be called on load of new-entry.html.
 */
function initNewEntryPage() {
    const form = document.getElementById('entryForm');
    if (!form) return;
    // Template definitions. When a template is selected on the entry page the
    // corresponding value will populate the content area. Each template uses
    // Markdown headings and prompts so writers can organise their thoughts.
    const templates = {
        daily: `# YYYY-MM-DD — Day of the Week\n\n## Morning Intention\nWhat is the one thing this day is for?\n\n- \n\n## Reading\nWhat did I read today? What stayed with me?\n\n- Book / Article:\n- Pages:\n- Thought:\n\n## Work / Craft\nWhat did I *actually* work on?\n\n- \n\n## Personal / Family\nMoments that mattered.\n\n- `,
        weekly: `# Week XX — YYYY\nTheme: (A single word or phrase)\n\n## Focus of the Week\nIf nothing else happens, this must happen:\n\n- \n\n## Reading Goals\nBe realistic. Slow is still forward.\n\n- Book:\n- Target:\n\n## Writing / Journaling Goals\nWhat do I want to *say* this week?\n\n- \n\n## Life & Relationships\nWho needs my presence?\n\n- \n\n## Tasks (Only What Matters)\n- [ ] \n- [ ] \n- [ ] \n\n## Notes & Adjustments\nWhat needs to change midweek?\n\n\n## Reflection\nWhat went well?\nWhat felt heavy?\nWhat deserves gratitude?\n\n- \n\n## Closing Thought\nOne sentence to carry into tomorrow.`,
        reflection: `# Reflection — YYYY-MM-DD\n\n## What I Learned\nAbout myself, others, or the world.\n\n- \n\n## What I Read That Changed Me\nA sentence, an idea, a shift.\n\n- \n\n## Patterns I Notice\nGood or bad—name them.\n\n- \n\n## What I Need Less Of\nBe honest.\n\n- \n\n## What I Need More Of\nAlso be honest.\n\n- \n\n## One Decision Going Forward\nSmall. Concrete. Real.`,
        book: `# Book Title — Author\n\n## Why I’m Reading This\nWhat called me to it?\n\n- \n\n## Key Ideas\n- \n- \n- \n\n## Quotes Worth Keeping\n> “”\n\n## My Response\nAgreement, resistance, questions.\n\n- \n\n## Where This Fits in My Life\nWhat does this book ask of me?\n\n`,
        personal: `# Personal Index\n\n## Current Reading\n- \n\n## Current Focus\n- \n\n## Open Questions\n- \n\n## Ideas to Revisit\n- \n`
    };

    // Prefill content when a template is selected.
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
        const entry = {
            title: title,
            date: date,
            content: content,
            timestamp: Date.now()
        };
        await addEntry(entry);
        // Clear the form
        titleInput.value = '';
        dateInput.value = '';
        contentInput.value = '';
    });
}

// Automatically initialize appropriate page based on body data attribute
// Add a data attribute to body tag in each HTML file: data-page="journal" or "new-entry"

document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const page = body.getAttribute('data-page');
    if (page === 'journal') {
        initJournalPage();
    } else if (page === 'new-entry') {
        initNewEntryPage();
    }
});
