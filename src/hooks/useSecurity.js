import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  deriveKeyFromPassword, 
  generateSalt, 
  toBase64, 
  fromBase64, 
  encryptData, 
  decryptData 
} from '../lib/crypto';
import { setSecurityValue, getSecurityValue, deleteSecurityValue } from '../lib/idb';

const PIN_SETTINGS_KEY = 'pin_settings';
const BIOMETRIC_SETTINGS_KEY = 'biometric_settings';

export function useSecurity() {
  const { encryptionKey, setEncryptionKey } = useAuth();
  const [pinEnabled, setPinEnabled] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      const pinSettings = await getSecurityValue(PIN_SETTINGS_KEY);
      const bioSettings = await getSecurityValue(BIOMETRIC_SETTINGS_KEY);
      setPinEnabled(!!pinSettings);
      setBiometricsEnabled(!!bioSettings);
      setLoading(false);
    }
    loadSettings();
  }, []);

  const enablePIN = useCallback(async (pin) => {
    if (!encryptionKey) throw new Error('Master key must be unlocked to enable PIN.');
    
    const salt = await generateSalt();
    const pinKey = await deriveKeyFromPassword(pin, salt); // Derives a key from PIN + salt
    const { ciphertext, nonce } = await encryptData(encryptionKey, pinKey); // Master key is the data we're encrypting

    await setSecurityValue(PIN_SETTINGS_KEY, {
      salt: await toBase64(salt),
      ciphertext,
      nonce
    });
    setPinEnabled(true);
  }, [encryptionKey]);

  const disablePIN = useCallback(async () => {
    await deleteSecurityValue(PIN_SETTINGS_KEY);
    setPinEnabled(false);
  }, []);

  const unlockWithPIN = useCallback(async (pin) => {
    const pinSettings = await getSecurityValue(PIN_SETTINGS_KEY);
    if (!pinSettings) throw new Error('PIN unlock not enabled.');

    const salt = await fromBase64(pinSettings.salt);
    const pinKey = await deriveKeyFromPassword(pin, salt);
    
    const decryptedMasterKey = await decryptData({
      ciphertext: pinSettings.ciphertext,
      nonce: pinSettings.nonce
    }, pinKey);

    // decryptedMasterKey will be a Uint8Array represented as an object after JSON.parse (from decryptData)
    // Wait, decryptData JSON.parses the result. 
    // If I encrypt a Uint8Array, JSON.stringify(encryptionKey) will turn it into an object { '0': 1, '1': 2... }
    // Let's make sure we return it as a Uint8Array.
    
    const masterKeyArray = new Uint8Array(Object.values(decryptedMasterKey));
    setEncryptionKey(masterKeyArray);
    return true;
  }, [setEncryptionKey]);

  // Biometrics (Simplified WebAuthn PRF flow)
  const enableBiometrics = useCallback(async () => {
    if (!encryptionKey) throw new Error('Master key must be unlocked to enable biometrics.');
    if (!window.PublicKeyCredential) throw new Error('Biometrics not supported on this browser.');

    // In a real implementation, we would use navigator.credentials.create with PRF extension
    // For this prototype, we'll simulate it by using a persistent key bound to the device
    // NOTE: This is a placeholder for actual WebAuthn PRF logic.
    
    // We'll just store a flag for now, and in a real app, we'd use the PRF derived key to encrypt the master key.
    // For now, let's just use a random device key stored in IndexedDB (not ideal for security, but okay for prototype)
    
    const deviceSalt = await generateSalt();
    const { ciphertext, nonce } = await encryptData(encryptionKey, deviceSalt); // Simulate encryption

    await setSecurityValue(BIOMETRIC_SETTINGS_KEY, {
      deviceSalt: await toBase64(deviceSalt),
      ciphertext,
      nonce
    });
    setBiometricsEnabled(true);
  }, [encryptionKey]);

  const disableBiometrics = useCallback(async () => {
    await deleteSecurityValue(BIOMETRIC_SETTINGS_KEY);
    setBiometricsEnabled(false);
  }, []);

  const unlockWithBiometrics = useCallback(async () => {
    const bioSettings = await getSecurityValue(BIOMETRIC_SETTINGS_KEY);
    if (!bioSettings) throw new Error('Biometric unlock not enabled.');

    if (!window.PublicKeyCredential) throw new Error('Biometrics not supported on this browser.');

    // Simulated WebAuthn prompt
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const options = {
      publicKey: {
        challenge,
        timeout: 60000,
        userVerification: 'required',
      }
    };

    try {
      await navigator.credentials.get(options);
      // If success, we release the master key
      const deviceSalt = await fromBase64(bioSettings.deviceSalt);
      const decryptedMasterKey = await decryptData({
        ciphertext: bioSettings.ciphertext,
        nonce: bioSettings.nonce
      }, deviceSalt);
      
      const masterKeyArray = new Uint8Array(Object.values(decryptedMasterKey));
      setEncryptionKey(masterKeyArray);
      return true;
    } catch (err) {
      console.error('Biometric auth failed:', err);
      throw new Error('Biometric authentication failed.');
    }
  }, [setEncryptionKey]);

  return {
    pinEnabled,
    biometricsEnabled,
    loading,
    enablePIN,
    disablePIN,
    unlockWithPIN,
    enableBiometrics,
    disableBiometrics,
    unlockWithBiometrics
  };
}
