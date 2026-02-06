import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import { deriveKeyFromPassword, generateSalt, toBase64, fromBase64, KDF_OPSLIMIT_MODERATE, KDF_MEMLIMIT_MODERATE, KDF_ALG_ARGON2ID13 } from '../lib/crypto';
import {
  validatePassword,
  calculateStrengthScore,
  getStrengthInfo,
  checkPasswordRules,
  PASSWORD_RULES,
} from '../utils/passwordStrength';

function PasswordStrengthMeter({ password }) {
  const score = calculateStrengthScore(password);
  const strengthInfo = getStrengthInfo(score);
  const rules = checkPasswordRules(password);

  return (
    <div className="password-strength">
      <div className="password-strength__bar-container">
        <div
          className="password-strength__bar"
          style={{
            width: `${score}%`,
            backgroundColor: strengthInfo.color,
          }}
        />
      </div>
      <div className="password-strength__label" style={{ color: strengthInfo.color }}>
        {password ? strengthInfo.label : 'Enter password'}
      </div>

      <ul className="password-strength__rules">
        <li className={rules.minLength ? 'rule-met' : 'rule-unmet'}>
          {rules.minLength ? '✓' : '○'} At least {PASSWORD_RULES.minLength} characters
        </li>
        <li className={rules.hasUppercase ? 'rule-met' : 'rule-unmet'}>
          {rules.hasUppercase ? '✓' : '○'} One uppercase letter
        </li>
        <li className={rules.hasLowercase ? 'rule-met' : 'rule-unmet'}>
          {rules.hasLowercase ? '✓' : '○'} One lowercase letter
        </li>
        <li className={rules.hasNumber ? 'rule-met' : 'rule-unmet'}>
          {rules.hasNumber ? '✓' : '○'} One number
        </li>
        <li className={rules.hasSpecial ? 'rule-met' : 'rule-unmet'}>
          {rules.hasSpecial ? '✓' : '○'} One special character
        </li>
        {password && !rules.notCommon && (
          <li className="rule-unmet rule-warning">
            ✗ Contains common password pattern
          </li>
        )}
        {password && !rules.notSequential && (
          <li className="rule-unmet rule-warning">
            ✗ Contains sequential characters
          </li>
        )}
      </ul>
    </div>
  );
}

const MasterPasswordModal = ({ onClose }) => {
  const { user, encryptionKey, setEncryptionKey } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSettingMode, setIsSettingMode] = useState(false);

  useEffect(() => {
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
        // Validate password strength
        const validation = validatePassword(password);
        if (!validation.isValid) {
          throw new Error(validation.errors[0]);
        }

        if (password !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }

        const salt = await generateSalt();
        const derivedKey = await deriveKeyFromPassword(password, salt);

        const e2eeParams = {
          salt: await toBase64(salt),
          opslimit: KDF_OPSLIMIT_MODERATE,
          memlimit: KDF_MEMLIMIT_MODERATE,
          alg: KDF_ALG_ARGON2ID13,
        };

        const { error: updateError } = await supabase.auth.updateUser({
          data: { e2ee_params: e2eeParams },
        });

        if (updateError) {
          throw new Error("Failed to save E2EE parameters: " + updateError.message);
        }

        setEncryptionKey(derivedKey);
        onClose();

      } else {
        const e2eeParams = user.user_metadata.e2ee_params;
        if (!e2eeParams || !e2eeParams.salt) {
          throw new Error("E2EE parameters not found for user.");
        }

        const salt = await fromBase64(e2eeParams.salt);
        const derivedKey = await deriveKeyFromPassword(
          password,
          salt,
          e2eeParams.opslimit,
          e2eeParams.memlimit,
          e2eeParams.alg
        );
        setEncryptionKey(derivedKey);
        onClose();
      }
    } catch (err) {
      console.error("Master password action failed:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  if (encryptionKey) {
    return null;
  }

  const validation = validatePassword(password);
  const canSubmit = isSettingMode
    ? validation.isValid && password === confirmPassword
    : password.length > 0;

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
            autoComplete={isSettingMode ? "new-password" : "current-password"}
          />

          {isSettingMode && (
            <>
              <PasswordStrengthMeter password={password} />

              <label htmlFor="confirm-master-password">Confirm Master Password:</label>
              <input
                type="password"
                id="confirm-master-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                required
                autoComplete="new-password"
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="password-mismatch">Passwords do not match</p>
              )}
            </>
          )}

          {error && <p className="error-message">{error}</p>}

          <button
            type="submit"
            className="btn primary"
            disabled={isLoading || !canSubmit}
          >
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
