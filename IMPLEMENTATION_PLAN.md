# Implementation Plan — My Online Journal

This document tracks the phased implementation of features from PROJECT_FEATURES.md.

---

## Status Legend

- [ ] Not started
- [~] In progress
- [x] Complete

---

## Already Implemented

These features from the roadmap have been completed:

| Feature | PR/Commit | Notes |
|---------|-----------|-------|
| React + Vite Migration | `05c38ea` | Full SPA architecture |
| Edit & Delete Entries (#2) | `09e2373` | EntryCard with confirmation dialog |
| Markdown Rendering (#4) | `05c38ea` | Write/Preview tabs in MarkdownEditor |
| Weekly Review Dashboard (#8) | `05c38ea` | Stats, heatmap, week navigation |
| Dark/Light Theme Toggle (#9) | `9e1ffa1` | ThemeContext with localStorage |

---

## Phase 1: Core UX Polish ✅ COMPLETE

*Foundation improvements that enhance daily usage*

| Status | Feature | Ref | Description |
|--------|---------|-----|-------------|
| [x] | Entry Search | #1 | Debounced search bar on Journal page filtering entries by title and content |
| [x] | Overdue Todos | #5 | Red date badges for past-due incomplete items; "Overdue" section at top of Scheduled list |
| [x] | Auto-Save Drafts | #12 | Persist NewEntry form state to localStorage; restore on page load |
| [x] | Word Count | #13 | Live word counter below editor textarea |

**Database Changes:** None

**Acceptance Criteria:**
- Search filters entries as user types (300ms debounce)
- Overdue todos visually distinct with red styling
- Form content survives accidental refresh
- Word count updates on each keystroke

---

## Phase 2: Gamification & Engagement

*Encourage consistent journaling habits*

| Status | Feature | Ref | Description |
|--------|---------|-----|-------------|
| [ ] | Streak Tracker | #3 | Display current streak, longest streak, total entries on Home page |
| [ ] | Calendar Heatmap | #15 | Color intensity on calendar cells based on entry count per day |
| [ ] | Entry Pinning | #7 | Star/pin icon on entries; pinned entries sort to top |

**Database Changes:**
```sql
ALTER TABLE journal_entries ADD COLUMN pinned BOOLEAN DEFAULT false;
```

**Acceptance Criteria:**
- Streak resets if a day is missed
- Heatmap shows 4 intensity levels (0, 1, 2, 3+ entries)
- Pinned entries always appear first regardless of date sort

---

## Phase 3: Organization & Power Features

*Better content management at scale*

| Status | Feature | Ref | Description |
|--------|---------|-----|-------------|
| [ ] | Tags/Categories | #6 | Tag input on entries/todos; filter chips on list pages |
| [ ] | Export Data | #10 | Download buttons for JSON export of entries and todos |
| [ ] | Keyboard Shortcuts | #11 | `N` = new entry, `T` = todos, `/` = focus search |
| [ ] | Command Palette | #18 | Cmd+K overlay for quick navigation and actions |

**Database Changes:**
```sql
ALTER TABLE journal_entries ADD COLUMN tags TEXT[] DEFAULT '{}';
ALTER TABLE todos ADD COLUMN tags TEXT[] DEFAULT '{}';
```

**Acceptance Criteria:**
- Tags are comma-separated input, stored as array
- Export produces valid JSON with all user data
- Shortcuts work globally except when typing in inputs
- Command palette searchable with fuzzy matching

---

## Phase 4: Performance & Reliability

*Scale and stability improvements*

| Status | Feature | Ref | Description |
|--------|---------|-----|-------------|
| [ ] | Error Boundaries | #24 | Wrap pages with error boundary; show fallback UI on crash |
| [ ] | Code Splitting | #25 | Lazy load Calendar, Review, Todos pages |
| [ ] | Infinite Scroll | #23 | Load entries progressively as user scrolls |

**Database Changes:** None

**Acceptance Criteria:**
- Component errors don't crash entire app
- Initial bundle size reduced by 30%+
- First 20 entries load immediately; more load on scroll

---

## Phase 5: Advanced Editor

*Rich editing experience*

| Status | Feature | Ref | Description |
|--------|---------|-----|-------------|
| [ ] | Split-Pane Preview | #22 | Side-by-side editor with live markdown preview |
| [ ] | Undo/Redo | #21 | Cmd+Z / Cmd+Shift+Z support with history stack |
| [ ] | Animated Transitions | #19 | Smooth page transitions using framer-motion |

**Database Changes:** None

**Acceptance Criteria:**
- Split pane responsive (stacks on mobile)
- Undo/redo tracks last 50 states
- Transitions are 200-300ms, interruptible

---

## Phase 6: Real-Time & Offline

*Advanced sync capabilities*

| Status | Feature | Ref | Description |
|--------|---------|-----|-------------|
| [ ] | Real-Time Sync | #17 | Supabase Realtime subscriptions for live updates |
| [ ] | Offline PWA | #16 | Service worker, asset caching, background sync queue |
| [ ] | Drag-and-Drop Todos | #20 | Reorder todos within sections using @dnd-kit |

**Database Changes:**
```sql
ALTER TABLE todos ADD COLUMN sort_order INTEGER DEFAULT 0;
```

**Acceptance Criteria:**
- Changes sync across tabs/devices within 2 seconds
- App works offline; queued changes sync on reconnect
- Drag reorder persists to database

---

## Implementation Notes

### Priority Order
Start with **Phase 1** — highest impact-to-effort ratio, addresses core usability gaps.

### Dependencies
- Phase 3 (Command Palette) benefits from Phase 1 (Search) being complete
- Phase 6 (Offline PWA) should come after Phase 4 (Error Boundaries)

### Tech Stack Additions by Phase
| Phase | New Dependencies |
|-------|------------------|
| 1 | None |
| 2 | None |
| 3 | None (or cmdk for command palette) |
| 4 | None |
| 5 | framer-motion |
| 6 | vite-plugin-pwa, @dnd-kit/core, @dnd-kit/sortable |

---

## Changelog

| Date | Phase | Feature | Status |
|------|-------|---------|--------|
| 2026-02-05 | 1 | Word Count | Complete |
| 2026-02-05 | 1 | Overdue Todos | Complete |
| 2026-02-05 | 1 | Entry Search | Complete |
| 2026-02-05 | 1 | Auto-Save Drafts | Complete |

*Update this table as features are completed.*
