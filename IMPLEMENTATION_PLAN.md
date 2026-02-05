# Implementation Plan — JotFlow

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

## Phase 2: Gamification & Engagement (Core 3 ✅ COMPLETE)

*Encourage consistent journaling habits*

| Status | Feature | Ref | Description |
|--------|---------|-----|-------------|
| [x] | Streak Tracker | #3 | Display current streak, longest streak, total entries on Home page |
| [x] | Calendar Heatmap | #15 | Color intensity on calendar cells based on entry count per day |
| [x] | Entry Pinning | #7 | Star/pin icon on entries; pinned entries sort to top |
| [x] | Mood Tracking | NEW | Rate mood per entry; visualize emotional trends over time with charts |
| [ ] | Location & Date Stamps | NEW | Auto-capture geolocation and timestamp; display on entry cards |

**Database Changes:**
```sql
ALTER TABLE journal_entries ADD COLUMN pinned BOOLEAN DEFAULT false;
ALTER TABLE journal_entries ADD COLUMN mood INTEGER CHECK (mood >= 1 AND mood <= 5);
ALTER TABLE journal_entries ADD COLUMN location_lat DECIMAL(10, 8);
ALTER TABLE journal_entries ADD COLUMN location_lng DECIMAL(11, 8);
ALTER TABLE journal_entries ADD COLUMN location_name TEXT;
```

**Acceptance Criteria:**
- Streak resets if a day is missed
- Heatmap shows 4 intensity levels (0, 1, 2, 3+ entries)
- Pinned entries always appear first regardless of date sort
- Mood selector (1-5 scale) on entry form; mood trends chart on dashboard
- Location auto-detected with user permission; fallback to manual entry

---

## Phase 3: Organization & Power Features ✅ COMPLETE

*Better content management at scale*

| Status | Feature | Ref | Description |
|--------|---------|-----|-------------|
| [x] | Tags/Categories | #6 | Tag input on entries/todos; filter chips on list pages |
| [x] | Export Data | #10 | Download buttons for JSON export of entries and todos |
| [x] | Keyboard Shortcuts | #11 | `N` = new entry, `T` = todos, `/` = focus search |
| [x] | Command Palette | #18 | Ctrl+K overlay for quick navigation and actions |

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

## Phase 4: Performance, Reliability & Security (Core 3 ✅ COMPLETE)

*Scale, stability, and data protection*

| Status | Feature | Ref | Description |
|--------|---------|-----|-------------|
| [x] | Error Boundaries | #24 | Wrap pages with error boundary; show fallback UI on crash |
| [x] | Code Splitting | #25 | Lazy load Calendar, Review, Todos pages (bundle reduced from 508KB to 421KB) |
| [x] | Infinite Scroll | #23 | Load entries progressively as user scrolls (20 at a time) |
| [x] | End-to-End Encryption | NEW | Encrypt journal content client-side before storing; decrypt on read |
| [ ] | Biometric Auth | NEW | PIN code, fingerprint, or Face ID to unlock app (WebAuthn API) |

**Database Changes:** None (encryption happens client-side)

**Acceptance Criteria:**
- Component errors don't crash entire app
- Initial bundle size reduced by 30%+
- First 20 entries load immediately; more load on scroll
- Entry content encrypted with user-derived key; server never sees plaintext
- App locks after 5 min inactivity; biometric/PIN required to unlock

---

## Phase 5: Advanced Editor & Media (Editor ✅ COMPLETE)

*Rich editing experience with multimedia support*

| Status | Feature | Ref | Description |
|--------|---------|-----|-------------|
| [x] | Split-Pane Preview | #22 | Side-by-side editor with live markdown preview + synced scroll |
| [x] | Undo/Redo | #21 | Ctrl+Z / Ctrl+Shift+Z support with 50-state history stack |
| [x] | Animated Transitions | #19 | Smooth page transitions using framer-motion |
| [ ] | Photo Attachments | NEW | Upload and embed photos in entries; image gallery view |
| [ ] | Video Attachments | NEW | Embed video clips in entries; playback within app |
| [x] | Voice Notes | NEW | Record audio directly in app; automatic transcription via Web Speech API |
| [x] | Rich Text Toolbar | NEW | Formatting buttons (bold, italic, headers, lists, code, links) |

**Database Changes:**
```sql
CREATE TABLE entry_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  type TEXT CHECK (type IN ('image', 'video', 'audio')),
  storage_path TEXT NOT NULL,
  filename TEXT,
  mime_type TEXT,
  size_bytes INTEGER,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Acceptance Criteria:**
- Split pane responsive (stacks on mobile)
- Undo/redo tracks last 50 states
- Transitions are 200-300ms, interruptible
- Photos/videos upload to Supabase Storage; thumbnails generated
- Voice notes record up to 5 min; waveform visualization during playback
- Toolbar inserts markdown syntax; keyboard shortcuts for formatting

---

## Phase 6: Real-Time, Offline & Notifications (Core 2 ✅ COMPLETE)

*Advanced sync and engagement capabilities*

| Status | Feature | Ref | Description |
|--------|---------|-----|-------------|
| [x] | Real-Time Sync | #17 | Supabase Realtime subscriptions for live updates across tabs/devices |
| [ ] | Offline PWA | #16 | Service worker, asset caching, background sync queue |
| [x] | Drag-and-Drop Todos | #20 | Reorder inbox todos using @dnd-kit with sort_order persistence |
| [ ] | Push Reminders | NEW | Daily journaling reminders via push notifications; customizable time |
| [ ] | Cross-Device Sync | NEW | Robust conflict resolution for edits made on multiple devices |

**Database Changes:**
```sql
ALTER TABLE todos ADD COLUMN sort_order INTEGER DEFAULT 0;

CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  reminder_enabled BOOLEAN DEFAULT false,
  reminder_time TIME DEFAULT '20:00',
  reminder_days INTEGER[] DEFAULT '{1,2,3,4,5,6,0}',
  push_subscription JSONB,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE journal_entries ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE journal_entries ADD COLUMN version INTEGER DEFAULT 1;
```

**Acceptance Criteria:**
- Changes sync across tabs/devices within 2 seconds
- App works offline; queued changes sync on reconnect
- Drag reorder persists to database
- Push notifications at user-defined time; respect device quiet hours
- Conflict resolution: last-write-wins with merge option for concurrent edits

---

## Phase 7: Mobile Experience (Core 3 ✅ COMPLETE)

*Optimized for on-the-go journaling*

| Status | Feature | Ref | Description |
|--------|---------|-----|-------------|
| [x] | Mobile-First Redesign | NEW | Touch-optimized UI; larger tap targets (44x44px min) |
| [x] | Responsive Navigation | NEW | Bottom tab bar on mobile (<768px); top nav hidden |
| [x] | Quick Entry Widget | NEW | Floating action button on Journal page |
| [x] | Pull-to-Refresh | NEW | Native-feeling refresh gesture on Journal and Todos |
| [x] | Haptic Feedback | NEW | Subtle vibrations on interactions (Vibration API) |
| [ ] | App Install Prompt | NEW | Smart banner prompting PWA installation on mobile |

**Database Changes:** None

**Acceptance Criteria:**
- All touch targets minimum 44x44px (WCAG guidelines)
- Swipe left to delete, swipe right to edit entries
- Bottom nav shows on screens < 768px; sidebar on larger screens
- FAB visible on Journal/Todos pages for quick add
- Pull-to-refresh with loading indicator
- PWA install prompt appears after 3 visits

---

## Implementation Notes

### Priority Order
Phase 1 complete. Continue with **Phase 2** for engagement features, or jump to **Phase 7** if mobile is the primary use case.

### Dependencies
- Phase 3 (Command Palette) benefits from Phase 1 (Search) being complete
- Phase 4 (Encryption) should come before Phase 5 (Media) for secure storage
- Phase 6 (Offline PWA) should come after Phase 4 (Error Boundaries)
- Phase 6 (Push Reminders) requires PWA infrastructure
- Phase 7 (Mobile) can be done in parallel with other phases

### Tech Stack Additions by Phase
| Phase | New Dependencies |
|-------|------------------|
| 1 | None |
| 2 | chart.js or recharts (mood trends), Geolocation API |
| 3 | cmdk (command palette) |
| 4 | tweetnacl or libsodium-wrappers (E2E encryption), WebAuthn API |
| 5 | framer-motion, Supabase Storage, MediaRecorder API |
| 6 | vite-plugin-pwa, @dnd-kit/core, web-push |
| 7 | None (CSS/React refactoring) |

---

## Changelog

| Date | Phase | Feature | Status |
|------|-------|---------|--------|
| 2026-02-05 | 1 | Word Count | Complete |
| 2026-02-05 | 1 | Overdue Todos | Complete |
| 2026-02-05 | 1 | Entry Search | Complete |
| 2026-02-05 | 1 | Auto-Save Drafts | Complete |
| 2026-02-05 | 2 | Entry Pinning | Complete |
| 2026-02-05 | 2 | Calendar Heatmap | Complete |
| 2026-02-05 | 2 | Streak Tracker | Complete |
| 2026-02-05 | 3 | Tags/Categories | Complete |
| 2026-02-05 | 3 | Export Data | Complete |
| 2026-02-05 | 3 | Keyboard Shortcuts | Complete |
| 2026-02-05 | 3 | Command Palette | Complete |
| 2026-02-05 | 4 | Error Boundaries | Complete |
| 2026-02-05 | 4 | Code Splitting | Complete |
| 2026-02-05 | 4 | Infinite Scroll | Complete |
| 2026-02-05 | 5 | Split-Pane Preview | Complete |
| 2026-02-05 | 5 | Undo/Redo | Complete |
| 2026-02-05 | 5 | Rich Text Toolbar | Complete |
| 2026-02-05 | 6 | Real-Time Sync | Complete |
| 2026-02-05 | 6 | Drag-and-Drop Todos | Complete |
| 2026-02-05 | 7 | Bottom Navigation | Complete |
| 2026-02-05 | 7 | Floating Action Button | Complete |
| 2026-02-05 | 7 | Pull-to-Refresh | Complete |
| 2026-02-05 | 2 | Mood Tracking | Complete |
| 2026-02-05 | 5 | Animated Transitions | Complete |
| 2026-02-05 | 5 | Voice Notes | Complete |

*Update this table as features are completed.*
