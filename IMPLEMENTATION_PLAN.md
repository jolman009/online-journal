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

## Phase 2: Gamification & Engagement (Core 3 ✅ COMPLETE)

*Encourage consistent journaling habits*

| Status | Feature | Ref | Description |
|--------|---------|-----|-------------|
| [x] | Streak Tracker | #3 | Display current streak, longest streak, total entries on Home page |
| [x] | Calendar Heatmap | #15 | Color intensity on calendar cells based on entry count per day |
| [x] | Entry Pinning | #7 | Star/pin icon on entries; pinned entries sort to top |
| [ ] | Mood Tracking | NEW | Rate mood per entry; visualize emotional trends over time with charts |
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

## Phase 4: Performance, Reliability & Security

*Scale, stability, and data protection*

| Status | Feature | Ref | Description |
|--------|---------|-----|-------------|
| [ ] | Error Boundaries | #24 | Wrap pages with error boundary; show fallback UI on crash |
| [ ] | Code Splitting | #25 | Lazy load Calendar, Review, Todos pages |
| [ ] | Infinite Scroll | #23 | Load entries progressively as user scrolls |
| [ ] | End-to-End Encryption | NEW | Encrypt journal content client-side before storing; decrypt on read |
| [ ] | Biometric Auth | NEW | PIN code, fingerprint, or Face ID to unlock app (WebAuthn API) |

**Database Changes:** None (encryption happens client-side)

**Acceptance Criteria:**
- Component errors don't crash entire app
- Initial bundle size reduced by 30%+
- First 20 entries load immediately; more load on scroll
- Entry content encrypted with user-derived key; server never sees plaintext
- App locks after 5 min inactivity; biometric/PIN required to unlock

---

## Phase 5: Advanced Editor & Media

*Rich editing experience with multimedia support*

| Status | Feature | Ref | Description |
|--------|---------|-----|-------------|
| [ ] | Split-Pane Preview | #22 | Side-by-side editor with live markdown preview |
| [ ] | Undo/Redo | #21 | Cmd+Z / Cmd+Shift+Z support with history stack |
| [ ] | Animated Transitions | #19 | Smooth page transitions using framer-motion |
| [ ] | Photo Attachments | NEW | Upload and embed photos in entries; image gallery view |
| [ ] | Video Attachments | NEW | Embed video clips in entries; playback within app |
| [ ] | Voice Notes | NEW | Record audio directly in app; transcription optional |
| [ ] | Rich Text Toolbar | NEW | WYSIWYG formatting buttons (bold, italic, lists, headers) |

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

## Phase 6: Real-Time, Offline & Notifications

*Advanced sync and engagement capabilities*

| Status | Feature | Ref | Description |
|--------|---------|-----|-------------|
| [ ] | Real-Time Sync | #17 | Supabase Realtime subscriptions for live updates |
| [ ] | Offline PWA | #16 | Service worker, asset caching, background sync queue |
| [ ] | Drag-and-Drop Todos | #20 | Reorder todos within sections using @dnd-kit |
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

## Phase 7: Mobile Experience

*Optimized for on-the-go journaling*

| Status | Feature | Ref | Description |
|--------|---------|-----|-------------|
| [ ] | Mobile-First Redesign | NEW | Touch-optimized UI; larger tap targets; swipe gestures |
| [ ] | Responsive Navigation | NEW | Bottom tab bar on mobile; hamburger menu for secondary actions |
| [ ] | Quick Entry Widget | NEW | Floating action button for instant entry creation |
| [ ] | Pull-to-Refresh | NEW | Native-feeling refresh gesture on entry lists |
| [ ] | Haptic Feedback | NEW | Subtle vibrations on interactions (Vibration API) |
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

*Update this table as features are completed.*
