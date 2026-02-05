import sodium from 'libsodium-wrappers';

// Initialize libsodium (must be called before any libsodium function)
const ensureLibsodiumReady = async () => {
  if (sodium.sodium_is_primitive_supported('pwhash', 'argon2id13')) {
    return; // Already ready or supported
  }
  await sodium.ready;
};

/**
 * Derives a strong encryption key from a master password using Argon2id.
 *
 * @param {string} masterPassword - The user's master password.
 * @param {Uint8Array} salt - A unique salt for key derivation.
 * @returns {Promise<Uint8Array>} A promise that resolves with the derived encryption key.
 * @throws {Error} If key derivation fails.
 */
export const deriveKeyFromPassword = async (masterPassword, salt) => {
  await ensureLibsodiumReady();

  // Recommended parameters for Argon2id from libsodium documentation (or similar secure defaults)
  // For production, these might need to be adjusted based on security requirements and hardware capabilities.
  const OPSLIMIT = sodium.crypto_pwhash_OPSLIMIT_MODERATE; // Moderate operations limit
  const MEMLIMIT = sodium.crypto_pwhash_MEMLIMIT_MODERATE; // Moderate memory limit
  const ALG = sodium.crypto_pwhash_ALG_ARGON2ID13;

  const KEYBYTES = sodium.crypto_secretbox_KEYBYTES; // 32 bytes for XSalsa20-Poly1305 key

  const passwordBuf = sodium.from_string(masterPassword);
  const derivedKey = new Uint8Array(KEYBYTES);

  try {
    await sodium.crypto_pwhash(
      derivedKey,
      passwordBuf,
      salt,
      OPSLIMIT,
      MEMLIMIT,
      ALG
    );
    return derivedKey;
  } catch (error) {
    console.error("Key derivation failed:", error);
    throw new Error("Failed to derive encryption key.");
  }
};

/**
 * Generates a cryptographically secure random salt.
 * @returns {Uint8Array} A unique salt.
 */
export const generateSalt = () => {
  ensureLibsodiumReady();
  return sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES);
};

/**
 * Encrypts arbitrary data (string, object, array) using the derived key.
 * The data is JSON.stringified before encryption.
 * The ciphertext and nonce are returned as Base64 strings.
 *
 * @param {any} data - The data to encrypt.
 * @param {Uint8Array} key - The encryption key.
 * @returns {Promise<{ciphertext: string, nonce: string}>} A promise that resolves with the encrypted data and nonce as Base64 strings.
 */
export const encryptData = async (data, key) => {
  await ensureLibsodiumReady();

  const plaintext = JSON.stringify(data);
  const plaintextBuf = sodium.from_string(plaintext);
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);

  const ciphertextBuf = sodium.crypto_secretbox_easy(plaintextBuf, nonce, key);

  return {
    ciphertext: sodium.to_base64(ciphertextBuf, sodium.base64_variants.ORIGINAL),
    nonce: sodium.to_base64(nonce, sodium.base64_variants.ORIGINAL),
  };
};

/**
 * Decrypts data. The ciphertext and nonce are expected as Base64 strings.
 * The decrypted data is JSON.parsed.
 *
 * @param {{ciphertext: string, nonce: string}} encryptedData - An object containing the ciphertext and nonce as Base64 strings.
 * @param {Uint8Array} key - The encryption key.
 * @returns {Promise<any>} A promise that resolves with the decrypted data.
 * @throws {Error} If decryption fails (e.g., incorrect key, tampered data).
 */
export const decryptData = async ({ ciphertext, nonce }, key) => {
  await ensureLibsodiumReady();

  const ciphertextBuf = sodium.from_base64(ciphertext, sodium.base64_variants.ORIGINAL);
  const nonceBuf = sodium.from_base64(nonce, sodium.base64_variants.ORIGINAL);

  try {
    const decryptedBuf = sodium.crypto_secretbox_open_easy(ciphertextBuf, nonceBuf, key);
    const plaintext = sodium.to_string(decryptedBuf);
    return JSON.parse(plaintext);
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Failed to decrypt data. Possible incorrect key or tampered data.");
  }
};
