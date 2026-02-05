import sodium from 'libsodium-wrappers';
import {
  deriveKeyFromPassword,
  generateSalt,
  encryptData,
  decryptData,
} from '../crypto';

// Mock libsodium.ready to be instantly resolved for testing
beforeAll(async () => {
  await sodium.ready; // Ensure libsodium is ready before tests run
  jest.spyOn(sodium, 'ready', 'get').mockReturnValue(Promise.resolve());
});

describe('Crypto Utilities', () => {
  const testPassword = 'mySuperSecurePassword123!';
  let masterKey;
  let salt;

  // Initialize masterKey and salt once for all tests
  beforeEach(async () => {
    salt = generateSalt();
    masterKey = await deriveKeyFromPassword(testPassword, salt);
  });

  describe('generateSalt', () => {
    it('should generate a Uint8Array of the correct length', () => {
      const generatedSalt = generateSalt();
      expect(generatedSalt).toBeInstanceOf(Uint8Array);
      expect(generatedSalt.length).toBe(sodium.crypto_pwhash_SALTBYTES);
    });

    it('should generate different salts each time', () => {
      const salt1 = generateSalt();
      const salt2 = generateSalt();
      expect(salt1).not.toEqual(salt2);
    });
  });

  describe('deriveKeyFromPassword', () => {
    it('should derive a key of the correct length', async () => {
      expect(masterKey).toBeInstanceOf(Uint8Array);
      expect(masterKey.length).toBe(sodium.crypto_secretbox_KEYBYTES);
    });

    it('should derive the same key for the same password and salt', async () => {
      const key1 = await deriveKeyFromPassword(testPassword, salt);
      const key2 = await deriveKeyFromPassword(testPassword, salt);
      expect(key1).toEqual(key2);
    });

    it('should derive different keys for different passwords', async () => {
      const differentPassword = 'anotherPassword';
      const differentKey = await deriveKeyFromPassword(differentPassword, salt);
      expect(masterKey).not.toEqual(differentKey);
    });

    it('should derive different keys for different salts', async () => {
      const differentSalt = generateSalt();
      const differentKey = await deriveKeyFromPassword(testPassword, differentSalt);
      expect(masterKey).not.toEqual(differentKey);
    });

    it('should throw an error for invalid inputs (e.g., empty password)', async () => {
      await expect(deriveKeyFromPassword('', salt)).rejects.toThrow();
    });
  });

  describe('encryptData and decryptData', () => {
    const testDataString = "This is a secret message.";
    const testDataObject = { key: "value", number: 123, list: [1, 2, 3] };

    it('should encrypt and decrypt a string successfully', async () => {
      const encrypted = await encryptData(testDataString, masterKey);
      expect(encrypted).toHaveProperty('ciphertext');
      expect(encrypted).toHaveProperty('nonce');

      const decrypted = await decryptData(encrypted, masterKey);
      expect(decrypted).toBe(testDataString);
    });

    it('should encrypt and decrypt an object successfully', async () => {
      const encrypted = await encryptData(testDataObject, masterKey);
      expect(encrypted).toHaveProperty('ciphertext');
      expect(encrypted).toHaveProperty('nonce');

      const decrypted = await decryptData(encrypted, masterKey);
      expect(decrypted).toEqual(testDataObject);
    });

    it('should fail decryption with an incorrect key', async () => {
      const encrypted = await encryptData(testDataString, masterKey);
      const incorrectKey = await deriveKeyFromPassword('wrongPassword', salt); // Derive a different key

      await expect(decryptData(encrypted, incorrectKey)).rejects.toThrow(
        "Failed to decrypt data. Possible incorrect key or tampered data."
      );
    });

    it('should fail decryption with a tampered ciphertext', async () => {
      const encrypted = await encryptData(testDataString, masterKey);
      const tamperedCiphertext = encrypted.ciphertext.substring(0, encrypted.ciphertext.length - 2) + 'AA'; // Corrupt last chars
      const tamperedEncrypted = { ...encrypted, ciphertext: tamperedCiphertext };

      await expect(decryptData(tamperedEncrypted, masterKey)).rejects.toThrow(
        "Failed to decrypt data. Possible incorrect key or tampered data."
      );
    });

    it('should fail decryption with an incorrect nonce', async () => {
      const encrypted = await encryptData(testDataString, masterKey);
      const incorrectNonce = sodium.to_base64(sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES), sodium.base64_variants.ORIGINAL);
      const tamperedEncrypted = { ...encrypted, nonce: incorrectNonce };

      await expect(decryptData(tamperedEncrypted, masterKey)).rejects.toThrow(
        "Failed to decrypt data. Possible incorrect key or tampered data."
      );
    });
  });
});