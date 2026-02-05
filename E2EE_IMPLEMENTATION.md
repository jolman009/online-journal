# End-to-End Encryption (E2EE) Implementation for JotFlow

## 1. What is End-to-End Encryption (E2EE)?

End-to-End Encryption (E2EE) is a system of communication where only the communicating users can read the messages. In the context of JotFlow, it means that only the user can read their journal entries; no one else, not even the service provider (Supabase), has the keys to decrypt the data. The data is encrypted on the user's device before being sent to the server and is only decrypted on the user's device after being retrieved from the server. This ensures the highest level of confidentiality for sensitive journal entries.

## 2. Implementation Overview

JotFlow's E2EE is implemented client-side using the `libsodium-wrappers` cryptographic library. A user's master password derives a unique encryption key, which is kept in memory during their active session. This key is used to encrypt sensitive journal entry data before it is stored in Supabase and decrypt it upon retrieval.

## 3. Key Components

*   **`libsodium-wrappers` (`src/lib/crypto.js`):** A high-level JavaScript wrapper for the Sodium crypto library. It provides robust, peer-reviewed cryptographic primitives.
    *   `deriveKeyFromPassword(masterPassword, salt)`: Uses Argon2id (specifically `crypto_pwhash`) to derive a strong 32-byte (256-bit) encryption key from the user's master password and a unique salt.
    *   `generateSalt()`: Generates a cryptographically secure random salt for key derivation.
    *   `encryptData(data, key)`: Encrypts arbitrary JavaScript data (serialized to JSON string) using XSalsa20-Poly1305 (`crypto_secretbox_easy`). It generates a unique nonce for each encryption and returns Base64 encoded ciphertext and nonce.
    *   `decryptData({ ciphertext, nonce }, key)`: Decrypts Base64 encoded ciphertext using the provided key and nonce, verifying authenticity. Returns the original JavaScript data (parsed from JSON string).
*   **`AuthContext.jsx` (`src/context/AuthContext.jsx`):**
    *   Manages the `encryptionKey` state, storing the derived `Uint8Array` encryption key in volatile memory (`useState`).
    *   Ensures the `encryptionKey` is cleared (`setEncryptionKey(null)`) when the user signs out, preventing persistence.
*   **`useEntries` Hook (`src/hooks/useEntries.js`):**
    *   Integrates E2EE into the data lifecycle of journal entries.
    *   **Encryption on Save/Update:** Before `addEntry` or `updateEntry` sends data to Supabase, sensitive fields (`title`, `content`, `tags`) are combined into a JavaScript object, encrypted using `encryptData`, and stored as a JSON string in the `encrypted_payload` column.
    *   **Decryption on Load:** When `fetchEntries`, `getEntryById`, or real-time updates retrieve data from Supabase, the `encrypted_payload` is decrypted using `decryptData`. The decrypted fields are then merged back into the entry object for display.
    *   **Error Handling:** Implements robust error handling for decryption failures, adding `isDecrypted: false` and `decryptionError` flags to entry objects.
*   **`MasterPasswordModal.jsx` (`src/components/MasterPasswordModal.jsx`):**
    *   A UI component that prompts users to either "Set Master Password" (for new E2EE users) or "Unlock Encrypted Journal" (for existing E2EE users).
    *   Uses `deriveKeyFromPassword` to generate/verify keys.
    *   Stores the `salt` and KDF parameters (but NOT the master password or derived key) in the user's Supabase `user_metadata` for future key derivation.
    *   Updates the `encryptionKey` in `AuthContext` upon successful action.
*   **`NewEntry.jsx` (`src/pages/NewEntry.jsx`):**
    *   Integrates `encryptionKey` from `useAuth()` to manage secure drafts.
    *   `saveEncryptedDraft()` and `loadEncryptedDraft()` encrypt/decrypt draft content (title, content, tags) before storing/retrieving it from `localStorage`.
    *   Displays a warning and disables saving if E2EE is locked.
*   **`EntryCard.jsx` (`src/components/EntryCard.jsx`):**
    *   Displays user-friendly messages for entries that fail to decrypt, indicating `decryptionError` and disabling actions like edit/delete/pin for locked entries.

## 4. E2EE Data Flow

### Saving/Updating an Entry:

1.  User enters/modifies journal entry data (title, content, tags, etc.) in `NewEntry.jsx`.
2.  `handleSubmit` in `NewEntry.jsx` calls `addEntry` or `updateEntry` from `useEntries`.
3.  Inside `useEntries`, it checks for the `encryptionKey` from `AuthContext`. If missing, the operation is prevented.
4.  Sensitive data fields are collected into a `sensitiveData` object.
5.  `encryptData(sensitiveData, encryptionKey)` is called:
    *   `sensitiveData` is `JSON.stringify`'d.
    *   A new random nonce is generated.
    *   XSalsa20-Poly1305 encrypts the JSON string with the `encryptionKey` and nonce.
    *   The ciphertext and nonce are Base64 encoded.
6.  The Base64 encoded ciphertext and nonce are stored as a JSON string in the `encrypted_payload` column of the `journal_entries` table in Supabase.
7.  Original plaintext `title`, `content`, `tags` columns are explicitly omitted or set to `NULL` to ensure no sensitive plaintext is sent or stored.

### Loading/Viewing an Entry:

1.  `fetchEntries`, `getEntryById`, or real-time subscription in `useEntries` fetches entries from Supabase.
2.  The query selects `id`, `user_id`, `date`, `pinned`, `created_at`, `updated_at`, and `encrypted_payload` from `journal_entries`.
3.  For each fetched entry:
    *   It checks for the `encryptionKey` from `AuthContext` and the presence of `encrypted_payload`.
    *   If available, `decryptData(JSON.parse(entry.encrypted_payload), encryptionKey)` is called:
        *   Base64 encoded ciphertext and nonce are converted to `Uint8Array`.
        *   XSalsa20-Poly1305 decrypts the data using the `encryptionKey` and nonce, also verifying authenticity.
        *   If successful, the resulting plaintext is `JSON.parse`'d back into the original sensitive data object.
    *   The decrypted data (`title`, `content`, `tags`) is merged into the entry object.
    *   If decryption fails (e.g., incorrect key, tampered data), the entry object is flagged with `isDecrypted: false` and a `decryptionError` message.
4.  UI components (e.g., `EntryCard`) render the decrypted content or display the `decryptionError` message if decryption failed.

## 5. Key Management

*   **Master Password:** The user's master password is the root of trust. It is **never** stored by JotFlow, neither client-side nor server-side.
*   **Key Derivation:** A computationally intensive Key Derivation Function (KDF), Argon2id, is used to derive a strong, fixed-size `encryptionKey` from the master password and a unique, random `salt`.
*   **Salt Storage:** The unique `salt` and the KDF parameters (`OPSLIMIT`, `MEMLIMIT`, `ALG`) are stored (unencrypted) in the user's `user_metadata` in Supabase. These parameters are not sensitive themselves but are necessary to re-derive the key on subsequent logins.
*   **In-Memory Storage:** The `encryptionKey` is stored in the React `AuthContext`'s state (`useState`) as a `Uint8Array`. This means it resides only in the browser's JavaScript memory heap and is never written to disk.
*   **Key Clearing:** Upon user logout, the `encryptionKey` is explicitly set to `null` in `AuthContext`, ensuring it is cleared from memory.

## 6. Supabase Integration

*   **Schema Change:** A new `TEXT` column, `encrypted_payload`, was added to the `public.journal_entries` table. This column stores the Base64 encoded JSON string `{ ciphertext: "...", nonce: "..." }`.
*   **Row Level Security (RLS):** Existing RLS policies, which filter access based on the unencrypted `user_id` column, remain fully functional and unaffected by E2EE. RLS ensures users can only retrieve their own encrypted data.
*   **No Server Decryption:** Supabase, as the server, never has access to the `encryptionKey` and thus cannot decrypt the `encrypted_payload`. It merely stores and retrieves the ciphertext.

## 7. Search Functionality

*   **Client-Side Only:** Due to E2EE, direct server-side search on encrypted content (e.g., `title`, `content`) is not possible.
*   **Implementation:** Search functionality is performed entirely client-side. The `useEntries` hook fetches all accessible entries (which are then decrypted if the `encryptionKey` is available). The `Journal` page then filters these *decrypted* entries based on the user's search query.
*   **Performance:** For users with a very large number of entries, fetching and decrypting all entries for client-side search may lead to performance overhead. This is a known trade-off for client-side E2EE.

## 8. Drafts Handling

*   **Encrypted `localStorage`:** Journal entry drafts are stored in the browser's `localStorage` for auto-save functionality. To maintain E2EE, these drafts are encrypted using the user's `encryptionKey` before being stored.
*   **`NewEntry.jsx`:** The `saveEncryptedDraft` and `loadEncryptedDraft` functions in `NewEntry.jsx` handle the encryption/decryption of draft content.
*   **Security:** If the `encryptionKey` is not available (E2EE locked), sensitive drafts are not saved to `localStorage` in plaintext. Existing encrypted drafts cannot be loaded until the user unlocks E2EE.

## 9. Master Password Change Mechanism

*   Changing the master password is a multi-step, sensitive process:
    1.  **Verification:** The user must provide their `Current Master Password` to verify identity and re-derive the old encryption key.
    2.  **New Key Derivation:** A new `salt` is generated, and a `newEncryptionKey` is derived from the `New Master Password`.
    3.  **Data Re-encryption:** All existing encrypted journal entries for the user must be retrieved, decrypted with the `oldEncryptionKey`, re-encrypted with the `newEncryptionKey` and a new nonce, and then updated in Supabase. This ensures all historical data remains accessible with the new password.
    4.  **Metadata Update:** The `user_metadata` in Supabase is updated with the `newSalt` and KDF parameters.
    5.  **In-Memory Key Update:** The `AuthContext` is updated with the `newEncryptionKey`.
*   This process is computationally intensive and requires careful handling to ensure data integrity and user experience.

## 10. Migration of Old Data

*   **Strategy:** For users with existing plaintext entries created before E2EE was implemented, a user-initiated migration process is planned.
*   **Process:** The user will be prompted to encrypt their old entries. The client application will fetch plaintext entries, encrypt their sensitive fields using the active `encryptionKey`, and then update them in Supabase, setting the original plaintext columns to `NULL`.
*   **Final Step:** After a successful migration phase for the user base, the original plaintext columns (`title`, `content`, `tags`, etc.) will be permanently dropped from the `journal_entries` table in the database to eliminate any remaining sensitive plaintext data on the server.

## 11. Security Considerations & Recommendations

*   **Unit Tests:** Comprehensive unit tests for all cryptographic operations (`deriveKeyFromPassword`, `encryptData`, `decryptData`, `generateSalt`) have been outlined (`src/lib/__tests__/crypto.test.js`). These tests cover success and failure cases, including incorrect keys and data tampering.
*   **Integration Tests:** Detailed integration test scenarios covering the entire E2EE data flow (user setup, entry creation, viewing, updating, drafts, error handling) have been outlined. These tests are crucial to verify the correct functioning of E2EE across the application.
*   **Security Testing:** Thorough security testing is recommended, including:
    *   Testing master password strength enforcement.
    *   Verifying in-memory key handling and proper key clearing.
    *   Attempting data tampering on `encrypted_payload` and `nonce` in Supabase to ensure integrity checks prevent decryption.
    *   Inspecting network traffic and `localStorage` to confirm no sensitive plaintext data leakage.
*   **Independent Security Audit:** Implementing E2EE correctly is highly challenging. It is **strongly recommended** that an independent security audit be performed by a qualified third party specializing in cryptography and application security. This external review is vital to identify subtle flaws, vulnerabilities, and build trust in the E2EE implementation.
*   **User Responsibility:** Users must be educated about the importance of their master password and the implications of losing it (data irrevocably lost). JotFlow has no way to recover a forgotten master password.