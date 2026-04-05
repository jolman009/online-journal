# JotFlow — Project Features Document

## Overview

JotFlow is a cloud-synced journaling and task management application built with React, Vite, and Supabase. It features structured journal entries with markdown support and templates, a month-view calendar with visual indicators, a hybrid date-optional TODO system, and a weekly review dashboard. All data syncs across devices via Supabase with row-level security.

---

## Pages

| Page | Route | Component | Purpose |
|------|-------|-----------|---------|
| Home | `/` | `Home.jsx` | Landing page with feature overview and CTAs |
| Sign In | `/login` | `Login.jsx` | Email/password authentication with sign-up toggle |
| Journal | `/journal` | `Journal.jsx` | Entry list with calendar widget and todo widget |
| New Entry | `/new-entry` | `NewEntry.jsx` | Entry creation/editing form with template selector and markdown editor |
| Calendar | `/calendar` | `CalendarPage.jsx` | Full-page month-view calendar with date filtering |
| Todos | `/todos` | `Todos.jsx` | Task management with Scheduled and Inbox sections |
| Weekly Review | `/review` | `WeeklyReview.jsx` | Week stats, heatmap, entries/todos summary |

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

- Brand logo (gradient dot) + "JotFlow" title
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

- **Frontend**: React 19 + Vite 7 (migrated from vanilla JS)
- **Backend**: Supabase (PostgreSQL + Auth + Row Level Security)
- **Routing**: React Router v7 with SPA client-side navigation
- **State**: React Context (AuthContext, ThemeContext) + custom hooks (useEntries, useTodos, useCalendar)
- **Markdown**: marked + DOMPurify for safe rendering
- **Deployment**: Vercel with SPA routing config
- **Security**: RLS policies scope all data to the authenticated user; HTML sanitized via DOMPurify

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

> **Implementation tracking:** See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for phased roadmap and progress.

## High Impact

### 1. Entry Search

Add a search bar to journal.html that filters entries by title and content. Implement client-side with a debounced text input filtering `window._journalEntries`, or server-side with Supabase full-text search (`textSearch` on title + content columns) for larger datasets. This directly addresses the inability to find past entries as the journal grows.

### 2. Edit and Delete Entries ✅ IMPLEMENTED

~~Currently entries can only be created, not modified. Add an edit button on each entry card that navigates to `new-entry.html?id=<entry-id>`, pre-filling the form with existing data and switching the submit handler to an UPDATE operation. Add a delete button with a confirmation dialog. This is a basic CRUD gap that limits practical daily use.~~

*Implemented in commit `09e2373`. EntryCard includes Edit link and Delete button with confirmation dialog.*

### 3. Streak Tracker and Writing Stats

Display a writing streak counter (consecutive days with entries) on the journal page or home page. Show stats like total entries, entries this week/month, and longest streak. This gamification encourages consistency — the core value proposition of a journal app.

### 4. Rich Text / Markdown Rendering ✅ IMPLEMENTED

~~Replace the plain textarea with a lightweight editor (e.g., Markdown preview pane or a minimal contenteditable area). Render stored content with bold, italic, headers, and lists when displaying entries. This makes entries more readable without requiring a heavy editor library.~~

*Implemented in commit `05c38ea`. MarkdownEditor component with Write/Preview tabs using marked + DOMPurify.*

### 5. Todo Due Date Reminders

Add a visual indicator for overdue todos (past-date + incomplete) — red date badge instead of blue, and a separate "Overdue" section at the top of the Scheduled list. No push notifications needed; just clear visual urgency when the user opens the app.

## Medium Impact

### 6. Tags / Categories

Allow entries and todos to be tagged (e.g., "work", "personal", "health"). Store as a `tags` text array column. Add filter chips on journal.html and todos.html to filter by tag. This adds a second axis of organization beyond dates.

### 7. Entry Pinning / Favorites

Let users pin important entries to the top of the journal view. A simple `pinned` boolean column on `journal_entries` with a star/pin icon toggle. Pinned entries render first regardless of sort order.

### 8. Weekly Review Dashboard ✅ IMPLEMENTED

~~A dedicated page that aggregates the current week's data: entries written, todos completed vs. pending, days with entries (mini heatmap), and a prompt to write a weekly reflection using the existing template. This ties the journal and todo systems together into a review habit.~~

*Implemented in commit `05c38ea`. WeeklyReview page at `/review` with stats, day heatmap, week navigation, and reflection prompt.*

### 9. Dark/Light Theme Toggle ✅ IMPLEMENTED

~~Add a theme toggle in the nav or settings. Define a `:root[data-theme="light"]` override in CSS with inverted colors. Store preference in localStorage. The existing CSS variable system makes this straightforward to implement.~~

*Implemented in commit `9e1ffa1`. ThemeContext with toggle button in Layout, CSS variables for both themes, localStorage persistence.*

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

---

## React/Vite-Enabled Features

These features are practical only because of the React + Vite migration. They rely on component lifecycle, shared state, build tooling, or the single-page architecture.

### 16. Offline-First PWA

Use `vite-plugin-pwa` to generate a service worker with asset caching and a background sync queue for entries and todos created while offline. The app becomes installable on mobile and desktop with its own icon. Requires Vite's build pipeline to generate the service worker manifest and precache assets — not possible without a build step.

### 17. Real-Time Sync Across Tabs and Devices

Subscribe to Supabase Realtime channels so entries and todos created on one device appear instantly on another without refreshing. React context + `useEffect` cleanup handles subscription lifecycle cleanly. In the vanilla multi-page architecture, each page managed its own global state, making cross-page live updates impractical.

### 18. Command Palette (Cmd+K)

A global search overlay that can navigate to pages, jump to specific entries by title, create new items, or toggle the theme. Built as a React portal with shared state, accessible from any page via a single keyboard shortcut. The vanilla architecture would have required duplicating the overlay logic and event listeners in every HTML file.

### 19. Animated Page Transitions

React Router keeps components mounted during navigation, enabling smooth fade/slide transitions between pages using `framer-motion` or CSS transition groups. Multi-page vanilla JS performs full page loads with no opportunity for cross-page animation.

### 20. Drag-and-Drop Todo Reordering

React's state-driven rendering makes reorder operations clean: update the array in state, UI re-renders automatically. Libraries like `@dnd-kit` integrate directly with React components. Add a `sort_order` column to the `todos` table and update on drop. The vanilla approach required manual DOM node splicing and fragile sort-order tracking.

### 21. Undo/Redo for Entry Editing

A state history stack using `useReducer` with past/present/future arrays gives Cmd+Z and Cmd+Shift+Z support in the markdown editor. Each keystroke or significant edit pushes to the history. Vanilla JS would require manual snapshot management outside any rendering cycle.

### 22. Split-Pane Live Preview

Replace the current Write/Preview tab toggle with a side-by-side editor where the markdown renders in real time as the user types. React's controlled inputs bind state to both panes simultaneously, keeping them in sync on every keystroke. The tab approach exists because vanilla JS couldn't efficiently maintain two synchronized views.

### 23. Infinite Scroll / Pagination

Use Intersection Observer + React state to progressively load older journal entries as the user scrolls down, instead of fetching everything at once. Clean `useEffect` cleanup prevents memory leaks and stale requests. Reduces initial load time as the journal grows to hundreds of entries.

### 24. Error Boundaries

Wrap pages with React error boundaries (`componentDidCatch`) to show a graceful fallback UI instead of a blank screen when a component throws. Errors in one page don't break the entire app. Vanilla JS had no equivalent — a single runtime error could leave the user on a broken page with no recovery option.

### 25. Code Splitting / Lazy Loading

Use `React.lazy()` + `Suspense` to load heavier pages (Calendar, Review, Todos) only when navigated to, reducing the initial JavaScript bundle size. Vite automatically generates separate chunks per lazy-loaded route. No build step existed in the vanilla architecture to enable this.
