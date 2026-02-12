import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { signup } from '../api/auth.js';

export function Signup() {
  const navigate = useNavigate();
  const { login, token } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (token) {
    navigate('/', { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const data = await signup(email.trim(), password);
      login(data.token, data.user);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Sign up failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-page" aria-label="Sign up">
      <h1>Sign up</h1>
      <form onSubmit={handleSubmit} className="auth-form">
        {error && <p className="error" role="alert">{error}</p>}
        <div className="form-group">
          <label htmlFor="signup-email">Email</label>
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            autoFocus
          />
        </div>
        <div className="form-group">
          <label htmlFor="signup-password">Password (min 6 characters)</label>
          <input
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Signing up…' : 'Sign up'}
        </button>
      </form>
      <p className="auth-switch">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </section>
  );
}
