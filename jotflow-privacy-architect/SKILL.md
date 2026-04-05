---
name: jotflow-privacy-architect
description: Guides development on JotFlow to ensure E2EE (End-to-End Encryption) integrity and glassmorphism UI consistency. Use for Phase 2-8 tasks like location tracking, media attachments, or new widgets.
---

# JotFlow Privacy Architect

This skill ensures that all new features in JotFlow adhere to the project's core mandates: **Privacy First (E2EE)** and **Glassmorphism UX**.

## Core Mandates

1.  **Never Store Plaintext Sensitive Data**: Any field that identifies the user's personal context (journal titles, content, tags, location, media metadata) MUST be encrypted into the `encrypted_payload` blob in `journal_entries`.
2.  **Client-Side Only Cryptography**: Use `libsodium-wrappers` via `src/lib/crypto.js`. No plaintext should ever leave the client.
3.  **Glassmorphism UI**: All new components must use the project's CSS variables and `backdrop-filter: blur(18px)`.

## Workflow

### 1. Data Audit
When adding a feature (e.g., Geolocation), identify if the data is sensitive.
- **Sensitive**: Location name, lat/lng, specific timestamps, media URLs.
- **Non-Sensitive**: Created_at, pinned status, mood (integer), user_id (for RLS).

### 2. Encryption Implementation
Sensitive data must be added to the `sensitiveData` object in `useEntries.jsx`'s `addEntry` or `updateEntry` functions.
Refer to [E2EE_PATTERNS.md](references/e2ee-patterns.md) for the exact code structure.

### 3. UI/UX Implementation
Components should follow the "Glassmorphism" theme.
Refer to [UI_PATTERNS.md](references/ui-patterns.md) for CSS variables and component templates.

### 4. Database Schema
Update Supabase using the patterns in [SQL_TEMPLATES.md](references/sql-templates.md).

## Reference Files

- **[E2EE_PATTERNS.md](references/e2ee-patterns.md)**: Patterns for adding fields to the encrypted payload.
- **[UI_PATTERNS.md](references/ui-patterns.md)**: Glassmorphism CSS and common component templates.
- **[SQL_TEMPLATES.md](references/sql-templates.md)**: SQL for Supabase migrations.
