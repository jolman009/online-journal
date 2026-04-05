import { useState } from 'react';
import { useSecurity } from '../hooks/useSecurity';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function Settings() {
  const { user, signOut } = useAuth();
  const { 
    pinEnabled, 
    biometricsEnabled, 
    enablePIN, 
    disablePIN, 
    enableBiometrics, 
    disableBiometrics 
  } = useSecurity();

  const [pin, setPin] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);
  const [error, setError] = useState('');

  const handleEnablePIN = async () => {
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits.');
      return;
    }
    try {
      await enablePIN(pin);
      setShowPinInput(false);
      setPin('');
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEnableBiometrics = async () => {
    try {
      await enableBiometrics();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Personalize & Secure</p>
          <h2>Settings</h2>
        </div>
        <Link className="btn ghost" to="/">Back to Dashboard</Link>
      </div>

      <section className="settings-grid">
        <div className="settings-card glass-card">
          <h3>Account</h3>
          <p className="muted">You are logged in as <strong>{user?.email}</strong></p>
          <button className="btn danger" onClick={signOut}>Sign Out</button>
        </div>

        <div className="settings-card glass-card">
          <h3>Privacy & Security</h3>
          <p className="muted">Manage how you unlock your journal on this device.</p>

          <div className="setting-item">
            <div className="setting-item__info">
              <h4>PIN Unlock</h4>
              <p className="muted">Fast unlock with a 4-6 digit code.</p>
            </div>
            <div className="setting-item__action">
              {pinEnabled ? (
                <button className="btn ghost danger" onClick={disablePIN}>Disable</button>
              ) : (
                <button className="btn ghost" onClick={() => setShowPinInput(true)}>Enable</button>
              )}
            </div>
          </div>

          {showPinInput && (
            <div className="pin-setup">
              <input
                type="password"
                placeholder="Enter 4-6 digit PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                maxLength={6}
              />
              <div className="pin-setup__actions">
                <button className="btn primary" onClick={handleEnablePIN}>Save PIN</button>
                <button className="btn ghost" onClick={() => setShowPinInput(false)}>Cancel</button>
              </div>
              {error && <p className="error-message">{error}</p>}
            </div>
          )}

          <div className="setting-item">
            <div className="setting-item__info">
              <h4>Biometric Unlock</h4>
              <p className="muted">Use TouchID, FaceID, or Windows Hello.</p>
            </div>
            <div className="setting-item__action">
              {biometricsEnabled ? (
                <button className="btn ghost danger" onClick={disableBiometrics}>Disable</button>
              ) : (
                <button className="btn ghost" onClick={handleEnableBiometrics}>Enable</button>
              )}
            </div>
          </div>
          
          <p className="info-text">
            <strong>Note:</strong> These settings only apply to this device. You will still need your master password on new devices.
          </p>
        </div>
      </section>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .settings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2rem;
          margin-top: 2rem;
        }
        .settings-card {
          padding: 2rem;
        }
        .setting-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 0;
          border-bottom: 1px solid var(--glass-3);
        }
        .setting-item:last-of-type {
          border-bottom: none;
        }
        .pin-setup {
          margin-top: 1rem;
          padding: 1rem;
          background: var(--glass-2);
          border-radius: 12px;
        }
        .pin-setup input {
          width: 100%;
          margin-bottom: 1rem;
        }
        .pin-setup__actions {
          display: flex;
          gap: 1rem;
        }
        .info-text {
          margin-top: 2rem;
          font-size: 0.85rem;
          color: var(--muted);
          padding: 1rem;
          background: var(--glass-1);
          border-radius: 8px;
        }
      `}} />
    </div>
  );
}
