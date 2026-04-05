# JotFlow — Pending Features TODO Checklist

This document tracks the remaining features and improvements for JotFlow, organized by their respective phases from the [Implementation Plan](./IMPLEMENTATION_PLAN.md).

---

## 🚀 Phase 2: Gamification & Engagement
*Focus: Encouraging consistent habits and rich metadata.*

- [x] **Location & Date Stamps**
    - [x] Implement Geolocation API to capture user's current city/coordinates.
    - [x] Update `journal_entries` table schema for location data. (Note: Stored in encrypted_payload as per E2EE mandate).
    - [x] Add location display to `EntryCard` and entry details.
    - [x] Add "Detect Location" button in `NewEntry` form.

---

## 🔒 Phase 4: Performance, Reliability & Security
*Focus: Enhancing privacy and access control.*

- [x] **Biometric Auth / PIN Unlock**
    - [x] Implement WebAuthn API for biometric login (TouchID/FaceID). (Implemented with simulated WebAuthn prompt and PRF-ready flow)
    - [x] Create a "Locked" state UI for the app. (Integrated into MasterPasswordModal with fallback options)
    - [x] Add settings to enable/disable biometric or PIN unlock. (New Settings page implemented)
    - [x] Ensure `encryptionKey` is protected by this secondary auth layer. (Key wrapping with PIN-derived keys stored in IndexedDB)

---

## 📝 Phase 5: Advanced Editor & Media
*Focus: Moving beyond text-only journaling.*

- [ ] **Photo Attachments**
    - [ ] Set up Supabase Storage bucket for images.
    - [ ] Implement image upload component in `MarkdownEditor`.
    - [ ] Update `entry_attachments` table to track images.
    - [ ] Create an image gallery view for entries.
- [ ] **Video Attachments**
    - [ ] Support video file uploads to Supabase Storage.
    - [ ] Implement inline video player for journal entries.
    - [ ] Handle video transcoding/thumbnails (if needed via Edge Functions).

---

## 🔔 Phase 6: Real-Time, Offline & Notifications
*Focus: Connectivity and habit triggers.*

- [ ] **Push Reminders**
    - [ ] Implement Web Push API notifications.
    - [ ] Create `user_preferences` table for notification schedules.
    - [ ] Build UI for users to customize daily reminder times.
    - [ ] Set up a background worker (or Supabase Edge Function) to trigger notifications.
- [ ] **Advanced Cross-Device Sync**
    - [ ] Implement conflict resolution logic (e.g., merge or last-write-wins with UI prompt).
    - [ ] Enhance `syncQueue` to handle complex edge cases during reconnection.

---

## 📱 Phase 7: Mobile Experience
*Focus: Seamless mobile integration.*

- [ ] **Smart App Install Prompt**
    - [ ] Trigger `beforeinstallprompt` event handling.
    - [ ] Create a custom "Add to Home Screen" banner.
    - [ ] Track "visted" count to avoid annoying frequent users (Smart Banner logic).

---

## 🧩 Phase 8: Widget Wizard Integration (In Progress)
*Focus: Fully customizable dashboard experience.*

- [x] **Widget Builder**
    - [x] Implement a drag-and-drop UI for the dashboard grid. (Implemented via `WidgetGrid` and `react-grid-layout`)
    - [x] Create a "Widget Store" or selection modal to add/remove components. (Implemented via `AddWidgetModal`)
- [~] **Streak Widget (External/Embeddable)**
    - [ ] Create a public-facing (but secure) endpoint for streak data.
    - [ ] Build a lightweight embed script for users' personal sites.
- [x] **Mood Chart Widget (Enhanced)**
    - [x] Add configurable date ranges and visualization types (bar vs line). (Settings modal + quick toggles implemented)
- [x] **Daily Prompt Widget**
    - [x] Build a rotating prompt system using the `journaling_prompts` table.
    - [x] Allow users to "skip" or "pin" current prompts.
- [x] **Goal Tracker Widget**
    - [x] UI for setting weekly/monthly journaling goals.
    - [x] Animated progress rings and completion celebrations.
- [x] **Quick Stats Widget**
    - [x] Aggregate and display metrics like average word count, top tags, etc. (Implemented entries, todos, completion, mood, words, and tags)

---

## 🛠️ Ongoing Maintenance & UX
- [ ] **Search Performance Optimization**: As entries grow, optimize the client-side search or implement server-side search (requires careful E2EE handling).
- [ ] **E2EE Audit**: Regular review of `src/lib/crypto.js` and `useEntries.jsx` for security best practices.
