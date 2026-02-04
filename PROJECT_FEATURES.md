# My Online Journal — Project Features Document

## Overview

My Online Journal is a cloud-synced journaling and task management application built with vanilla JavaScript and Supabase. It features structured journal entries with templates, a month-view calendar with visual indicators, and a hybrid date-optional TODO system. All data syncs across devices via Supabase with row-level security.

---

## Pages

| Page | File | Purpose |
|---------|----------|
| Home | `index.html` | Landing page with feature overview and CTAs |
| Sign In | `login.html` | Email/password authentication with sign-up toggle |
| Journal | `journal.html` | Entry list with calendar widget and todo widget |
| New Entry | `new-entry.html` | Entry creation form with template selector |
| Calendar | `calendar.html` | Full-page month-view calendar with date filtering |
| Todos | `todos.html` | Task management with Scheduled and Inbox sections |

---

## Authentication

- **Provider**: Supabase Auth (email/password)
- **Sign Up**: Email confirmation required before first sign-in
- **Session**: Persisted in browser; checked on every protected page load
- **Protected Pages**: journal, new-entry, calendar, todos (redirect to login if unauthenticated)
- **Sign Out**: Clears session, redirects to login
- **Nav Integration**: "Sign In" link dynamically becomes "Sign Out" when authenticated

---

## Journal Entries

### Viewing Entries (journal.html)

- Entries displayed in a responsive card grid, newest first
- Each card shows: title, formatted date, and content with preserved line breaks
- HTML in content is escaped to prevent XSS
- Empty state message when no entries exist

### Creating Entries (new-entry.html)

- Form fields: template selector, title, date, content
- Date auto-fills from URL parameter (`?date=YYYY-MM-DD`) when linked from the calendar
- Content textarea is large (min-height 420px) with vertical resize

### Template System

Five pre-built templates populate the content textarea with structured prompts:

| Template | Sections |
|----------|----------|
| **Daily Entry** | Morning Intention, Reading, Work/Craft, Personal/Family |
| **Weekly Plan** | Focus, Reading Goals, Writing Goals, Life & Relationships, Tasks, Notes, Reflection, Closing Thought |
| **Reflection** | What I Learned, What I Read, Patterns, Need Less Of, Need More Of, One Decision |
| **Book Notes** | Why Reading, Key Ideas, Quotes, My Response, Where This Fits |
| **Personal Index** | Current Reading, Current Focus, Open Questions, Ideas to Revisit |

Headers use UPPERCASE formatting to stand out in the plain-text textarea.

---

## Calendar

### Rendering

- 7-column month grid with day-of-week labels (Sun-Sat)
- Previous/next month navigation with year boundary wrapping
- Today's date highlighted in accent blue
- Selected date gets a blue background/border

### Dot Indicators

- **Green dot**: Date has at least one journal entry
- **Blue dot**: Date has at least one pending (incomplete) todo
- Both dots appear side by side when a date has both

### Placements

- **Compact widget** on journal.html: clicking a date filters the entries grid, shows a filter bar with "Add entry" and "Show all" buttons
- **Full page** on calendar.html: clicking a date reveals an entries panel below the calendar showing matching entries, matching todos, and an "Add entry for this date" button

---

## TODO System

### Data Model

Each todo has: text, optional date, completed status, and created_at timestamp. Dated todos are "Scheduled"; undated todos are "Inbox."

### Dedicated Page (todos.html)

- **Inline add form**: text input + optional date picker + Add button (horizontal layout, stacks on mobile)
- **Scheduled section**: Todos with dates, sorted incomplete-first then by date ascending
- **Inbox section**: Undated todos, sorted incomplete-first then by creation date descending
- New todos appear instantly without page reload

### Todo Item Interactions

- **Checkbox**: Optimistic toggle — UI updates immediately, reverts if the database call fails
- **Strikethrough**: Completed todos get line-through text with reduced opacity
- **Date badge**: Small pill showing abbreviated date (e.g., "Feb 4") on scheduled todos
- **Delete button**: Removes the todo on success; shows empty-state message if section becomes empty

### Calendar Integration

- Pending dated todos appear as blue dots on calendar cells
- Clicking a date on calendar.html shows todos for that date below the entries
- Todos can be toggled or deleted directly from the calendar panel

### Journal Widget

- Compact "Pending Tasks" card on journal.html below the calendar widget
- Shows: count badge, top 5 pending todos with dot indicators, and "View all" link

---

## Navigation

All pages share a sticky header with:

- Brand logo (gradient dot) + "My Online Journal" title
- Navigation links: Home, View Journal, Calendar, Todos, Add Entry (green pill)
- Active page link gets a blue highlight
- "Sign Out" link appended dynamically on authenticated pages

---

## Visual Design

### Theme

- Dark glassmorphism with deep navy background (`#0b1324`)
- Radial gradient blobs (green top-left, cyan top-right) for depth
- Cards use `rgba(255,255,255,0.08)` backgrounds with `backdrop-filter: blur(18px)` and subtle borders

### Colors

| Role | Value | Usage |
|------|-------|-------|
| Background | `#0b1324` | Page background |
| Card | `rgba(255,255,255,0.08)` | All cards and panels |
| Text | `#e8eefc` | Primary text |
| Muted | `#a9b7d0` | Secondary text, labels |
| Accent | `#7dd3fc` | Links, highlights, todo dots |
| Accent Strong | `#22c55e` | Entry dots, checkboxes, CTAs |

### Buttons

- **Primary**: Cyan-to-blue gradient with glow shadow, dark text
- **Ghost**: Transparent with subtle border
- All buttons are pill-shaped (border-radius 999px) with hover lift effect

### Responsive Breakpoints

| Breakpoint | Behavior |
|------------|----------|----------|
| > 900px | Hero in 2-column layout |
| <= 900px | Hero stacks to single column |
| <= 700px | Header stacks, nav wraps, form/filter elements stack vertically |
| <= 400px | Calendar cells and todo items use smaller fonts and tighter padding |

---

## Technical Architecture

- **Frontend**: Vanilla HTML/CSS/JS (no framework)
- **Backend**: Supabase (PostgreSQL + Auth + Row Level Security)
- **Server**: Express.js for static file serving
- **Scripts load order**: `supabase.js` -> `calendar.js` -> `todos.js` -> `journal.js`
- **Routing**: `data-page` attribute on `<body>` dispatched via DOMContentLoaded in journal.js
- **Security**: RLS policies scope all data to the authenticated user; HTML escaped in rendered content

---

## Database Tables

### journal_entries

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| user_id | UUID | FK to auth.users |
| title | TEXT | Entry title |
| date | DATE | Entry date |
| content | TEXT | Entry body |
| created_at | TIMESTAMPTZ | Auto-set |

### todos

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| user_id | UUID | FK to auth.users |
| text | TEXT | Task description |
| date | DATE | Nullable (null = inbox) |
| completed | BOOLEAN | Default false |
| created_at | TIMESTAMPTZ | Auto-set |

---

# Recommended Future Features

## High Impact

### 1. Entry Search

Add a search bar to journal.html that filters entries by title and content. Implement client-side with a debounced text input filtering `window._journalEntries`, or server-side with Supabase full-text search (`textSearch` on title + content columns) for larger datasets. This directly addresses the inability to find past entries as the journal grows.

### 2. Edit and Delete Entries

Currently entries can only be created, not modified. Add an edit button on each entry card that navigates to `new-entry.html?id=<entry-id>`, pre-filling the form with existing data and switching the submit handler to an UPDATE operation. Add a delete button with a confirmation dialog. This is a basic CRUD gap that limits practical daily use.

### 3. Streak Tracker and Writing Stats

Display a writing streak counter (consecutive days with entries) on the journal page or home page. Show stats like total entries, entries this week/month, and longest streak. This gamification encourages consistency — the core value proposition of a journal app.

### 4. Rich Text / Markdown Rendering

Replace the plain textarea with a lightweight editor (e.g., Markdown preview pane or a minimal contenteditable area). Render stored content with bold, italic, headers, and lists when displaying entries. This makes entries more readable without requiring a heavy editor library.

### 5. Todo Due Date Reminders

Add a visual indicator for overdue todos (past-date + incomplete) — red date badge instead of blue, and a separate "Overdue" section at the top of the Scheduled list. No push notifications needed; just clear visual urgency when the user opens the app.

## Medium Impact

### 6. Tags / Categories

Allow entries and todos to be tagged (e.g., "work", "personal", "health"). Store as a `tags` text array column. Add filter chips on journal.html and todos.html to filter by tag. This adds a second axis of organization beyond dates.

### 7. Entry Pinning / Favorites

Let users pin important entries to the top of the journal view. A simple `pinned` boolean column on `journal_entries` with a star/pin icon toggle. Pinned entries render first regardless of sort order.

### 8. Weekly Review Dashboard

A dedicated page that aggregates the current week's data: entries written, todos completed vs. pending, days with entries (mini heatmap), and a prompt to write a weekly reflection using the existing template. This ties the journal and todo systems together into a review habit.

### 9. Dark/Light Theme Toggle

Add a theme toggle in the nav or settings. Define a `:root[data-theme="light"]` override in CSS with inverted colors. Store preference in localStorage. The existing CSS variable system makes this straightforward to implement.

### 10. Export Data

Add an export button on journal.html that downloads all entries as a JSON or plain-text file. Similarly for todos. This gives users ownership of their data and addresses lock-in concerns.

## Lower Effort / Quality of Life

### 11. Keyboard Shortcuts

Add shortcuts for common actions: `N` to create new entry, `/` to focus search (once implemented), `T` to open todos. Intercept keydown events on the page level with modifier checks.

### 12. Auto-Save Drafts

Periodically save the new-entry form state to localStorage while the user types. Restore on page reload. This prevents data loss from accidental navigation or browser crashes.

### 13. Entry Word Count

Show a live word count below the textarea on new-entry.html. Simple `content.split(/\s+/).filter(Boolean).length` calculation on input event.

### 14. Todo Reordering

Allow drag-and-drop reordering of todos within sections. Add a `sort_order` integer column and update on drag. Libraries like SortableJS keep this lightweight.

### 15. Calendar Heatmap View

Add an alternative calendar visualization that uses color intensity (lighter to darker green) based on entry count per day, similar to GitHub's contribution graph. This gives an at-a-glance view of journaling consistency over months.
