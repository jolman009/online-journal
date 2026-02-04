/*
 * todos.js
 *
 * Hybrid date-optional TODO list for the online journal.
 * TODOs can optionally have a date. Dated tasks show on the calendar;
 * undated tasks live in an "Inbox" section.
 */

// ── CRUD ────────────────────────────────────────────────

async function getTodos() {
    const { data, error } = await supabaseClient
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Failed to fetch todos:', error.message);
        return [];
    }
    return data || [];
}

async function addTodo(todo) {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabaseClient
        .from('todos')
        .insert({
            user_id: user.id,
            text: todo.text,
            date: todo.date || null,
            completed: false,
        })
        .select()
        .single();

    if (error) {
        console.error('Failed to add todo:', error.message);
        return null;
    }
    return data;
}

async function toggleTodo(id, completed) {
    const { error } = await supabaseClient
        .from('todos')
        .update({ completed })
        .eq('id', id);

    if (error) {
        console.error('Failed to toggle todo:', error.message);
        return false;
    }
    return true;
}

async function deleteTodo(id) {
    const { error } = await supabaseClient
        .from('todos')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Failed to delete todo:', error.message);
        return false;
    }
    return true;
}

// ── Date Set Builder ────────────────────────────────────

function buildTodoDateSet(todos) {
    const set = new Set();
    todos.forEach(t => {
        if (t.date && !t.completed) set.add(t.date);
    });
    return set;
}

// ── DOM Rendering ───────────────────────────────────────

function createTodoItem(todo, options) {
    options = options || {};

    const item = document.createElement('div');
    item.className = 'todo-item';
    if (todo.completed) item.classList.add('todo-item--completed');
    item.dataset.id = todo.id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'todo-item__checkbox';
    checkbox.checked = todo.completed;
    checkbox.setAttribute('aria-label', 'Mark as ' + (todo.completed ? 'incomplete' : 'complete'));
    checkbox.addEventListener('change', async () => {
        const newState = checkbox.checked;
        item.classList.toggle('todo-item--completed', newState);
        const success = await toggleTodo(todo.id, newState);
        if (!success) {
            checkbox.checked = !newState;
            item.classList.toggle('todo-item--completed', !newState);
        }
        if (options.onToggle) options.onToggle(todo.id, newState);
    });

    const textSpan = document.createElement('span');
    textSpan.className = 'todo-item__text';
    textSpan.textContent = todo.text;

    const meta = document.createElement('span');
    meta.className = 'todo-item__meta';
    if (todo.date) {
        const dateObj = new Date(todo.date + 'T00:00:00Z');
        const badge = document.createElement('span');
        badge.className = 'todo-item__date-badge';
        badge.textContent = dateObj.toLocaleDateString(undefined, {
            month: 'short', day: 'numeric', timeZone: 'UTC'
        });
        meta.appendChild(badge);
    }

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'todo-item__delete';
    deleteBtn.type = 'button';
    deleteBtn.textContent = '\u00D7';
    deleteBtn.setAttribute('aria-label', 'Delete todo');
    deleteBtn.addEventListener('click', async () => {
        const success = await deleteTodo(todo.id);
        if (success) {
            item.remove();
            if (options.onDelete) options.onDelete(todo.id);
        }
    });

    item.appendChild(checkbox);
    item.appendChild(textSpan);
    item.appendChild(meta);
    item.appendChild(deleteBtn);
    return item;
}

function renderTodoList(container, todos, emptyMessage) {
    container.innerHTML = '';
    if (todos.length === 0) {
        const p = document.createElement('p');
        p.className = 'muted';
        p.textContent = emptyMessage;
        container.appendChild(p);
        return;
    }
    todos.forEach(todo => {
        container.appendChild(createTodoItem(todo, {
            onDelete: () => {
                if (container.children.length === 0) {
                    const p = document.createElement('p');
                    p.className = 'muted';
                    p.textContent = emptyMessage;
                    container.appendChild(p);
                }
            }
        }));
    });
}

function renderTodoSections(todos, scheduledContainer, inboxContainer) {
    const scheduled = todos.filter(t => t.date !== null);
    const inbox = todos.filter(t => t.date === null);

    scheduled.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return (a.date || '').localeCompare(b.date || '');
    });

    inbox.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return new Date(b.created_at) - new Date(a.created_at);
    });

    renderTodoList(scheduledContainer, scheduled, 'No scheduled tasks.');
    renderTodoList(inboxContainer, inbox, 'No items in inbox.');
}

// ── Inline Add Form ─────────────────────────────────────

function setupTodoAddForm(form, onAdd) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const textInput = form.querySelector('#todoText');
        const dateInput = form.querySelector('#todoDate');
        const text = textInput.value.trim();
        if (!text) return;

        const date = dateInput.value || null;

        const newTodo = await addTodo({ text, date });
        if (newTodo) {
            textInput.value = '';
            dateInput.value = '';
            textInput.focus();
            if (onAdd) onAdd(newTodo);
        }
    });
}

// ── Page Init ───────────────────────────────────────────

async function initTodosPage() {
    const session = await requireAuth();
    if (!session) return;

    updateNavForAuth();

    const todos = await getTodos();
    const scheduledContainer = document.getElementById('scheduledTodos');
    const inboxContainer = document.getElementById('inboxTodos');
    const addForm = document.getElementById('todoAddForm');

    if (!scheduledContainer || !inboxContainer) return;

    renderTodoSections(todos, scheduledContainer, inboxContainer);

    if (addForm) {
        setupTodoAddForm(addForm, (newTodo) => {
            const targetContainer = newTodo.date ? scheduledContainer : inboxContainer;
            const emptyMsg = targetContainer.querySelector('p.muted');
            if (emptyMsg) emptyMsg.remove();

            const item = createTodoItem(newTodo, {
                onDelete: () => {
                    if (targetContainer.children.length === 0) {
                        const p = document.createElement('p');
                        p.className = 'muted';
                        p.textContent = newTodo.date
                            ? 'No scheduled tasks.'
                            : 'No items in inbox.';
                        targetContainer.appendChild(p);
                    }
                }
            });
            targetContainer.prepend(item);
        });
    }
}

// ── Journal Widget ──────────────────────────────────────

function renderTodosWidget(container, todos) {
    container.innerHTML = '';

    const pending = todos.filter(t => !t.completed);
    const count = pending.length;

    const header = document.createElement('div');
    header.className = 'todo-widget__header';

    const title = document.createElement('h3');
    title.className = 'todo-widget__title';
    title.textContent = 'Pending Tasks';

    const badge = document.createElement('span');
    badge.className = 'todo-widget__count';
    badge.textContent = count;

    const viewAll = document.createElement('a');
    viewAll.href = 'todos.html';
    viewAll.className = 'todo-widget__link';
    viewAll.textContent = 'View all';

    header.appendChild(title);
    header.appendChild(badge);
    header.appendChild(viewAll);
    container.appendChild(header);

    const preview = pending.slice(0, 5);
    if (preview.length === 0) {
        const p = document.createElement('p');
        p.className = 'muted';
        p.textContent = 'All caught up!';
        container.appendChild(p);
    } else {
        const list = document.createElement('div');
        list.className = 'todo-widget__list';
        preview.forEach(todo => {
            const row = document.createElement('div');
            row.className = 'todo-widget__item';

            const dot = document.createElement('span');
            dot.className = 'todo-widget__dot';

            const text = document.createElement('span');
            text.className = 'todo-widget__text';
            text.textContent = todo.text;

            row.appendChild(dot);
            row.appendChild(text);

            if (todo.date) {
                const dateBadge = document.createElement('span');
                dateBadge.className = 'todo-item__date-badge';
                const dateObj = new Date(todo.date + 'T00:00:00Z');
                dateBadge.textContent = dateObj.toLocaleDateString(undefined, {
                    month: 'short', day: 'numeric', timeZone: 'UTC'
                });
                row.appendChild(dateBadge);
            }

            list.appendChild(row);
        });
        container.appendChild(list);
    }
}
