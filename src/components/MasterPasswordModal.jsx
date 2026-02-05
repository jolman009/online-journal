import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { deriveKeyFromPassword, generateSalt } from '../lib/crypto';
import sodium from 'libsodium-wrappers'; // For constants like crypto_pwhash_OPSLIMIT_MODERATE

const MasterPasswordModal = ({ onClose }) => {
  const { user, encryptionKey, setEncryptionKey } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSettingMode, setIsSettingMode] = useState(false); // True for setting, false for unlocking

  useEffect(() => {
    // Determine mode: if user has E2EE metadata, it's unlock mode. Otherwise, set mode.
    // Assuming E2EE metadata is stored in user.user_metadata.e2ee_params
    if (user?.user_metadata?.e2ee_params) {
      setIsSettingMode(false);
    } else {
      setIsSettingMode(true);
    }
  }, [user]);

  const handleAction = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!user) {
      setError("User not authenticated.");
      setIsLoading(false);
      return;
    }

    try {
      if (isSettingMode) {
        if (password.length < 8) { // Basic password strength check
          throw new Error("Master password must be at least 8 characters long.");
        }
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }

        const salt = generateSalt();
        const derivedKey = await deriveKeyFromPassword(password, salt);

        // Store salt and KDF params in user metadata (Base64 encode salt for storage)
        const e2eeParams = {
          salt: sodium.to_base64(salt, sodium.base64_variants.ORIGINAL),
          opslimit: sodium.crypto_pwhash_OPSLIMIT_MODERATE,
          memlimit: sodium.crypto_pwhash_MEMLIMIT_MODERATE,
          alg: sodium.crypto_pwhash_ALG_ARGON2ID13,
        };

        const { error: updateError } = await supabase.auth.updateUser({
          data: { e2ee_params: e2eeParams },
        });

        if (updateError) {
          throw new Error("Failed to save E2EE parameters: " + updateError.message);
        }

        setEncryptionKey(derivedKey);
        onClose(); // Close modal on success

      } else { // Unlocking mode
        const e2eeParams = user.user_metadata.e2ee_params;
        if (!e2eeParams || !e2eeParams.salt) {
          throw new Error("E2EE parameters not found for user.");
        }

        const salt = sodium.from_base64(e2eeParams.salt, sodium.base64_variants.ORIGINAL);
        const derivedKey = await deriveKeyFromPassword(
          password,
          salt,
          e2eeParams.opslimit, // Use stored parameters
          e2eeParams.memlimit,
          e2eeParams.alg
        );
        setEncryptionKey(derivedKey);
        onClose(); // Close modal on success
      }
    } catch (err) {
      console.error("Master password action failed:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  if (encryptionKey) {
    // If key is already set, don't show the modal
    return null;
  }

  return (
    <div className="master-password-modal-overlay">
      <div className="master-password-modal">
        <h2>{isSettingMode ? "Set Your Encryption Master Password" : "Unlock Your Encrypted Journal"}</h2>
        <p className="muted">
          {isSettingMode
            ? "This password will encrypt and decrypt your journal. We will NEVER store it. Losing it means permanent data loss."
            : "Enter your master password to decrypt your journal entries."}
        </p>

        <form onSubmit={handleAction}>
          <label htmlFor="master-password">Master Password:</label>
          <input
            type="password"
            id="master-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
          />

          {isSettingMode && (
            <>
              <label htmlFor="confirm-master-password">Confirm Master Password:</label>
              <input
                type="password"
                id="confirm-master-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </>
          )}

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="btn primary" disabled={isLoading}>
            {isLoading ? "Deriving key..." : (isSettingMode ? "Set Master Password" : "Unlock")}
          </button>
          {!isSettingMode && (
            <button type="button" className="btn ghost" onClick={onClose} disabled={isLoading}>
              Skip for Now (Journal will be locked)
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default MasterPasswordModal;
