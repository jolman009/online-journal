import sodium from 'libsodium-wrappers-sumo';

// Standard libsodium constants (these are fixed values per the libsodium spec)
const SALT_BYTES = 16;        // crypto_pwhash_SALTBYTES
const KEY_BYTES = 32;         // crypto_secretbox_KEYBYTES
const NONCE_BYTES = 24;       // crypto_secretbox_NONCEBYTES

// Export KDF parameters for storage in user metadata
export const KDF_OPSLIMIT_MODERATE = 3;
export const KDF_MEMLIMIT_MODERATE = 268435456; // 256 MB
export const KDF_ALG_ARGON2ID13 = 2;

/**
 * Derives a strong encryption key from a master password using Argon2id.
 *
 * @param {string} masterPassword - The user's master password.
 * @param {Uint8Array} salt - A unique salt for key derivation.
 * @returns {Promise<Uint8Array>} A promise that resolves with the derived encryption key.
 * @throws {Error} If key derivation fails.
 */
export const deriveKeyFromPassword = async (masterPassword, salt) => {
  await sodium.ready;

  try {
    const derivedKey = sodium.crypto_pwhash(
      KEY_BYTES,
      masterPassword,
      salt,
      KDF_OPSLIMIT_MODERATE,
      KDF_MEMLIMIT_MODERATE,
      KDF_ALG_ARGON2ID13
    );
    return derivedKey;
  } catch (error) {
    console.error("Key derivation failed:", error);
    throw new Error("Failed to derive encryption key.");
  }
};

/**
 * Generates a cryptographically secure random salt.
 * @returns {Promise<Uint8Array>} A unique salt.
 */
export const generateSalt = async () => {
  await sodium.ready;
  return sodium.randombytes_buf(SALT_BYTES);
};

/**
 * Converts Uint8Array to Base64 string.
 */
export const toBase64 = async (data) => {
  await sodium.ready;
  return sodium.to_base64(data, sodium.base64_variants.ORIGINAL);
};

/**
 * Converts Base64 string to Uint8Array.
 */
export const fromBase64 = async (base64String) => {
  await sodium.ready;
  return sodium.from_base64(base64String, sodium.base64_variants.ORIGINAL);
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
  await sodium.ready;

  const plaintext = JSON.stringify(data);
  const plaintextBuf = sodium.from_string(plaintext);
  const nonce = sodium.randombytes_buf(NONCE_BYTES);

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
  await sodium.ready;

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
