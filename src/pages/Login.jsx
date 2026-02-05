import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';

export default function Login() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (session) navigate('/journal', { replace: true });
  }, [session, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMessage({ text: error.message, isError: true });
      } else {
        setMessage({
          text: 'Account created! Check your email to confirm, then sign in.',
          isError: false,
        });
        setIsSignUp(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage({ text: error.message, isError: true });
      } else {
        navigate('/journal');
        return;
      }
    }

    setSubmitting(false);
  };

  const toggleMode = (e) => {
    e.preventDefault();
    setIsSignUp(!isSignUp);
    setMessage(null);
  };

  return (
    <section className="auth-container">
      <div className="form-card auth-card">
        <h2>{isSignUp ? 'Create Account' : 'Sign In'}</h2>
        <p className="muted">
          {isSignUp
            ? 'Sign up to sync your journal across devices.'
            : 'Welcome back. Enter your credentials below.'}
        </p>

        {message && (
          <div className={`auth-message ${message.isError ? 'error' : 'success'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            required
            aria-required="true"
            placeholder="you@example.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            required
            aria-required="true"
            placeholder="Your password"
            minLength={6}
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="btn primary" type="submit" disabled={submitting}>
            {submitting
              ? (isSignUp ? 'Creating account...' : 'Signing in...')
              : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <p className="auth-toggle">
          <span>{isSignUp ? 'Already have an account?' : "Don't have an account?"}</span>{' '}
          <a href="#" onClick={toggleMode}>
            {isSignUp ? 'Sign in' : 'Create one'}
          </a>
        </p>
      </div>
    </section>
  );
}
