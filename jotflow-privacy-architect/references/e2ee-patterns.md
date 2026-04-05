# E2EE (End-to-End Encryption) Patterns

To maintain privacy, all sensitive fields must be bundled into a `sensitiveData` object before being encrypted by `encryptData` and stored in the `encrypted_payload` column in `journal_entries`.

## Adding New Encrypted Fields (e.g., Geolocation)

### 1. Update `addEntry` or `updateEntry` in `useEntries.jsx`

Find the `sensitiveData` object inside the `addEntry` or `updateEntry` function. Add the new fields there.

```javascript
// BEFORE (Existing Pattern)
const sensitiveData = {
  title: entry.title,
  content: entry.content,
  tags: entry.tags || []
};

// AFTER (Adding Geolocation)
const sensitiveData = {
  title: entry.title,
  content: entry.content,
  tags: entry.tags || [],
  location: {
    lat: entry.location?.lat,
    lng: entry.location?.lng,
    name: entry.location?.name
  }
};
```

### 2. Update Decryption Flow

In the decryption logic (typically within a `.map()` inside `fetchEntries` or `getEntryById`), ensure the new fields are extracted and merged.

```javascript
// Inside the decryption loop:
if (decrypted) {
  return {
    ...entry,
    title: decrypted.title,
    content: decrypted.content,
    tags: decrypted.tags || [],
    location: decrypted.location || null, // Extract the new field
    isDecrypted: true
  };
}
```

### 3. Handle Drafts in `NewEntry.jsx`

Update `saveEncryptedDraft` and `loadEncryptedDraft` to include the new fields.

```javascript
// saveEncryptedDraft
const draftData = {
  title,
  content,
  tags,
  location // Add the new field
};
```

## Mandate: No Plaintext Columns for Sensitive Data
Do NOT create top-level columns in Supabase for sensitive data. Even if they are encrypted elsewhere, storing them as raw columns increases the risk of accidental plaintext leakage.
- **Exception**: `user_id` (required for RLS), `date` (required for calendar rendering/filtering), `pinned`, `mood`.
