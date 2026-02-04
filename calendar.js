/*
 * calendar.js
 *
 * Calendar component for the online journal.
 * Provides a month-view grid showing which dates have journal entries
 * and lets users click a date to view/add entries.
 */

/**
 * Build a Set of YYYY-MM-DD strings from journal entries for O(1) lookup.
 * @param {Array<Object>} entries
 * @returns {Set<string>}
 */
function buildEntryDateSet(entries) {
    const set = new Set();
    entries.forEach(e => {
        if (e.date) set.add(e.date);
    });
    return set;
}

/**
 * Render a month-view calendar grid into the given container.
 * @param {HTMLElement} container
 * @param {number} year
 * @param {number} month - 0-indexed (0 = January)
 * @param {Set<string>} entryDateSet
 * @param {Object} options
 * @param {boolean} [options.compact] - compact mode for journal widget
 * @param {Set<string>} [options.todoDateSet] - dates with pending todos
 * @param {function} [options.onDateClick] - callback(dateStr)
 */
function renderCalendar(container, year, month, entryDateSet, options) {
    options = options || {};
    var todoDateSet = options.todoDateSet || new Set();
    container.innerHTML = '';

    const today = new Date();
    const todayStr = formatDateStr(today.getFullYear(), today.getMonth(), today.getDate());

    // Header with prev/next navigation
    const header = document.createElement('div');
    header.className = 'cal-header';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'cal-nav-btn';
    prevBtn.textContent = '\u2039';
    prevBtn.setAttribute('aria-label', 'Previous month');
    prevBtn.addEventListener('click', () => {
        let newMonth = month - 1;
        let newYear = year;
        if (newMonth < 0) { newMonth = 11; newYear--; }
        renderCalendar(container, newYear, newMonth, entryDateSet, options);
    });

    const nextBtn = document.createElement('button');
    nextBtn.className = 'cal-nav-btn';
    nextBtn.textContent = '\u203A';
    nextBtn.setAttribute('aria-label', 'Next month');
    nextBtn.addEventListener('click', () => {
        let newMonth = month + 1;
        let newYear = year;
        if (newMonth > 11) { newMonth = 0; newYear++; }
        renderCalendar(container, newYear, newMonth, entryDateSet, options);
    });

    const title = document.createElement('span');
    title.className = 'cal-title';
    const monthNames = ['January','February','March','April','May','June',
        'July','August','September','October','November','December'];
    title.textContent = monthNames[month] + ' ' + year;

    header.appendChild(prevBtn);
    header.appendChild(title);
    header.appendChild(nextBtn);
    container.appendChild(header);

    // Day-of-week labels
    const dowRow = document.createElement('div');
    dowRow.className = 'cal-dow';
    ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d => {
        const span = document.createElement('span');
        span.textContent = d;
        dowRow.appendChild(span);
    });
    container.appendChild(dowRow);

    // Build grid
    const grid = document.createElement('div');
    grid.className = 'cal-grid';

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Empty cells before the 1st
    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'cal-cell cal-cell--empty';
        grid.appendChild(empty);
    }

    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
        const cell = document.createElement('button');
        cell.className = 'cal-cell';
        cell.type = 'button';

        const dateStr = formatDateStr(year, month, day);
        cell.dataset.date = dateStr;

        const dayLabel = document.createElement('span');
        dayLabel.className = 'cal-day-num';
        dayLabel.textContent = day;
        cell.appendChild(dayLabel);

        if (dateStr === todayStr) {
            cell.classList.add('cal-cell--today');
        }

        var hasEntry = entryDateSet.has(dateStr);
        var hasTodo = todoDateSet.has(dateStr);

        if (hasEntry || hasTodo) {
            cell.classList.add('cal-cell--has-entry');
            var dotContainer = document.createElement('span');
            dotContainer.className = 'cal-dots';

            if (hasEntry) {
                var entryDot = document.createElement('span');
                entryDot.className = 'cal-dot cal-dot--entry';
                dotContainer.appendChild(entryDot);
            }
            if (hasTodo) {
                var todoDot = document.createElement('span');
                todoDot.className = 'cal-dot cal-dot--todo';
                dotContainer.appendChild(todoDot);
            }
            cell.appendChild(dotContainer);
        }

        cell.addEventListener('click', () => {
            // Remove previous selection
            const prev = grid.querySelector('.cal-cell--selected');
            if (prev) prev.classList.remove('cal-cell--selected');
            cell.classList.add('cal-cell--selected');
            if (options.onDateClick) options.onDateClick(dateStr);
        });

        grid.appendChild(cell);
    }

    container.appendChild(grid);
}

/**
 * Format year, month (0-indexed), day into YYYY-MM-DD.
 */
function formatDateStr(year, month, day) {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return year + '-' + m + '-' + d;
}

/**
 * Initialize the full calendar page (calendar.html).
 */
async function initCalendarPage() {
    const session = await requireAuth();
    if (!session) return;

    updateNavForAuth();

    const entries = await getEntries();
    const todos = await getTodos();
    const entryDateSet = buildEntryDateSet(entries);
    const todoDateSet = buildTodoDateSet(todos);
    const container = document.getElementById('calendarContainer');
    if (!container) return;

    const now = new Date();
    renderCalendar(container, now.getFullYear(), now.getMonth(), entryDateSet, {
        todoDateSet: todoDateSet,
        onDateClick: function(dateStr) {
            showEntriesForDate(dateStr, entries, todos);
        }
    });
}

/**
 * Show entry cards and todos for a specific date below the calendar on calendar.html.
 * @param {string} dateStr - YYYY-MM-DD
 * @param {Array<Object>} entries
 * @param {Array<Object>} [todos]
 */
function showEntriesForDate(dateStr, entries, todos) {
    const panel = document.getElementById('calendarEntries');
    if (!panel) return;

    panel.innerHTML = '';
    panel.style.display = 'block';

    const dateObj = new Date(dateStr + 'T00:00:00Z');
    const formatted = dateObj.toLocaleDateString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
    });

    const header = document.createElement('div');
    header.className = 'calendar-entries__header';

    const heading = document.createElement('h3');
    heading.textContent = 'Entries for ' + formatted;

    const addBtn = document.createElement('a');
    addBtn.className = 'btn primary';
    addBtn.href = 'new-entry.html?date=' + dateStr;
    addBtn.textContent = 'Add entry for this date';

    header.appendChild(heading);
    header.appendChild(addBtn);
    panel.appendChild(header);

    const matching = entries.filter(e => e.date === dateStr);

    if (matching.length === 0) {
        const p = document.createElement('p');
        p.className = 'muted';
        p.textContent = 'No entries for this date.';
        panel.appendChild(p);
    } else {
        const grid = document.createElement('div');
        grid.className = 'entries-grid';
        matching.forEach(entry => {
            grid.appendChild(createEntryCard(entry));
        });
        panel.appendChild(grid);
    }

    // Todos for this date
    todos = todos || [];
    const matchingTodos = todos.filter(t => t.date === dateStr);
    if (matchingTodos.length > 0) {
        const todoHeader = document.createElement('h4');
        todoHeader.className = 'calendar-todos__heading';
        todoHeader.textContent = 'Tasks for this date';
        panel.appendChild(todoHeader);

        const todoList = document.createElement('div');
        todoList.className = 'todo-list';
        matchingTodos.forEach(todo => {
            todoList.appendChild(createTodoItem(todo));
        });
        panel.appendChild(todoList);
    }
}

/**
 * Initialize the compact calendar widget on journal.html.
 * @param {Array<Object>} entries
 * @param {Array<Object>} [todos]
 */
function initJournalCalendarWidget(entries, todos) {
    const container = document.getElementById('calendarWidget');
    if (!container) return;

    const entryDateSet = buildEntryDateSet(entries);
    const todoDateSet = buildTodoDateSet(todos || []);
    const now = new Date();

    renderCalendar(container, now.getFullYear(), now.getMonth(), entryDateSet, {
        compact: true,
        todoDateSet: todoDateSet,
        onDateClick: function(dateStr) {
            filterJournalEntries(dateStr, entries);
        }
    });
}

/**
 * Filter journal entries grid to show only entries for a specific date.
 * Shows a filter bar with "Add entry" and "Show all" buttons.
 * @param {string} dateStr - YYYY-MM-DD
 * @param {Array<Object>} entries
 */
function filterJournalEntries(dateStr, entries) {
    const filterBar = document.getElementById('calendarFilterBar');
    const entriesContainer = document.getElementById('entriesContainer');
    if (!filterBar || !entriesContainer) return;

    const dateObj = new Date(dateStr + 'T00:00:00Z');
    const formatted = dateObj.toLocaleDateString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
    });

    // Update filter bar
    filterBar.style.display = 'flex';
    const label = filterBar.querySelector('.filter-date-label');
    if (label) label.textContent = 'Showing entries for ' + formatted;

    const addLink = filterBar.querySelector('.filter-add-link');
    if (addLink) addLink.href = 'new-entry.html?date=' + dateStr;

    // Replace entries grid content
    entriesContainer.innerHTML = '';
    const matching = entries.filter(e => e.date === dateStr);

    if (matching.length === 0) {
        const p = document.createElement('p');
        p.className = 'muted';
        p.textContent = 'No entries for this date.';
        entriesContainer.appendChild(p);
    } else {
        matching.forEach(entry => {
            entriesContainer.appendChild(createEntryCard(entry));
        });
    }
}

/**
 * Restore all entries in the journal grid (called by "Show all" button).
 */
function showAllEntries() {
    const filterBar = document.getElementById('calendarFilterBar');
    if (filterBar) filterBar.style.display = 'none';

    // Remove calendar selection highlight
    const widget = document.getElementById('calendarWidget');
    if (widget) {
        const sel = widget.querySelector('.cal-cell--selected');
        if (sel) sel.classList.remove('cal-cell--selected');
    }

    const entriesContainer = document.getElementById('entriesContainer');
    if (!entriesContainer) return;

    const entries = window._journalEntries || [];
    entriesContainer.innerHTML = '';

    if (entries.length === 0) {
        const p = document.createElement('p');
        p.textContent = 'No entries yet. Use the "Add Entry" page to begin your journal.';
        entriesContainer.appendChild(p);
    } else {
        entries.forEach(entry => {
            entriesContainer.appendChild(createEntryCard(entry));
        });
    }
}
