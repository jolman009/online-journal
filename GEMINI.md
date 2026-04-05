# JotFlow — Gemini Instruction Manual

This document provides context and guidelines for Gemini CLI interactions within the JotFlow project.

## Project Context
JotFlow is a privacy-first, cloud-synced journaling and task management application.

- **Tech Stack:** React 19, Vite 7, Supabase (DB/Auth/Realtime), PWA (`vite-plugin-pwa`).
- **Core Features:** Markdown journaling, templates, calendar integration, tasks (scheduled/inbox), weekly review, mood tracking, and modular dashboard widgets.
- **Privacy First:** Implements client-side **End-to-End Encryption (E2EE)** using `libsodium-wrappers`.

## Architectural Principles

1.  **Hook-Driven Logic:** Most domain logic (fetching, syncing, auth, E2EE) is encapsulated in custom hooks in `src/hooks/`. Prefer updating or creating hooks over putting logic directly in components.
2.  **State Management:** Uses React Context (`AuthContext`, `ThemeContext`) for global state.
3.  **Client-Side Security:** Encryption/decryption MUST happen client-side. The server (Supabase) should never see plaintext `title`, `content`, or `tags` for journal entries.
4.  **Modular Widgets:** The dashboard is built using a widget system found in `src/components/widgets/`. New features should ideally be implemented as widgets if they provide at-a-glance information.
5.  **Offline-First:** Built as a PWA with a sync queue (`src/lib/syncQueue.js`). Ensure new data-mutating features consider offline scenarios.

## Development Workflow

- **E2EE Integrity:** When modifying journal entry logic, always verify that `useEntries` encryption/decryption flows are preserved. See `E2EE_IMPLEMENTATION.md`.
- **Styling:** Primarily uses Vanilla CSS with CSS variables for theming (`src/styles.css`). Avoid adding new CSS frameworks unless requested.
- **Commands:**
    - `npm run dev`: Start development server.
    - `npm run build`: Build for production.
    - `npm run lint`: Run ESLint.
- **Sub-agents:** Use `codebase_investigator` for complex refactoring or understanding the widget registry.

## Critical Files & Folders

- `src/hooks/useEntries.jsx`: Core logic for journal entries, including E2EE integration.
- `src/hooks/useTodos.js`: Core logic for task management.
- `src/lib/crypto.js`: Cryptographic primitives for E2EE.
- `src/context/AuthContext.jsx`: Manages auth state and the in-memory encryption key.
- `src/components/widgets/WidgetRegistry.js`: Central registry for dashboard widgets.
- `supabase/functions/`: Deno edge functions for integrations (e.g., Google Calendar).

## Interaction Guidelines for Gemini

- **Always verify E2EE:** Before suggesting any changes to how entries are saved or loaded, check `useEntries.jsx`.
- **Proactive UI/UX:** JotFlow values a "visually appealing, functional prototype" with "rich aesthetics" (glassmorphism). Maintain this style in new components.
- **Testing:** When fixing bugs, prioritize reproducing them with a test case (see `src/lib/__tests__/crypto.test.js` for existing patterns).
- **Documentation:** Keep `PROJECT_FEATURES.md` and `IMPLEMENTATION_PLAN.md` updated as features are implemented.
