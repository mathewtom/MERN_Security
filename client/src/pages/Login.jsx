// =============================================================================
// Login Page — client/src/pages/Login.jsx
// =============================================================================
// Handles the login form, calls the auth context's login function, and
// redirects on success.
//
// REACT PATTERN: CONTROLLED COMPONENTS
// ======================================
// There are two ways to handle form inputs in React:
//
//   1. UNCONTROLLED: The DOM owns the value. You read it with refs.
//      <input ref={emailRef} />
//      const email = emailRef.current.value;
//
//   2. CONTROLLED: React state owns the value. The input just reflects it.
//      const [email, setEmail] = useState('');
//      <input value={email} onChange={(e) => setEmail(e.target.value)} />
//
// We use CONTROLLED because:
//   - We can validate in real-time as the user types
//   - The form state is always in sync with what's displayed
//   - It's the React-recommended approach
//   - It enables easy state manipulation (like clearing the form)
//
// TRADEOFF: More boilerplate (useState + onChange for every field).
// For complex forms, libraries like React Hook Form reduce this.
// =============================================================================

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

export default function Login() {
  // ---- FORM STATE ----
  // Each input field gets its own state variable
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ---- HOOKS ----
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Where to redirect after login. If the user was trying to access a
  // protected page (e.g., /profile) and got redirected to /login,
  // ProtectedRoute saved the original location in state.from.
  // After login, we send them back there instead of always to /dashboard.
  const from = location.state?.from?.pathname || '/dashboard';

  // ---- FORM SUBMIT HANDLER ----
  async function handleSubmit(e) {
    // preventDefault stops the browser's default form behavior, which is
    // to do a full page reload and send data as URL-encoded form params.
    // We want to handle this in JavaScript with our API service instead.
    e.preventDefault();

    // Clear any previous error
    setError('');
    setSubmitting(true);

    try {
      await login(email, password);
      // Success! Redirect to the intended page.
      // replace: true so the login page isn't in the browser history
      // (pressing back after login won't take you to the login form)
      navigate(from, { replace: true });
    } catch (err) {
      // Show the server's error message (e.g., "Invalid email or password")
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Login</h1>

        {/* ERROR DISPLAY */}
        {/* Short-circuit rendering: only show if error is truthy */}
        {error && <div style={styles.error}>{error}</div>}

        {/* THE FORM */}
        {/* onSubmit fires when the user presses Enter or clicks the button */}
        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label htmlFor="email" style={styles.label}>Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={styles.input}
              placeholder="you@example.com"
            />
          </div>

          <div style={styles.field}>
            <label htmlFor="password" style={styles.label}>Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={styles.input}
              placeholder="Your password"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              ...styles.button,
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {/* Dynamic button text based on state */}
            {submitting ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p style={styles.footer}>
          Don't have an account?{' '}
          <Link to="/register" style={styles.footerLink}>Register</Link>
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MINIMAL STYLES — will be replaced with Tailwind later
// ---------------------------------------------------------------------------
const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 'calc(100vh - 60px)',
    padding: '2rem',
  },
  card: {
    width: '100%',
    maxWidth: '400px',
    padding: '2rem',
    backgroundColor: '#16213e',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
  },
  title: {
    textAlign: 'center',
    color: '#e0e0e0',
    marginBottom: '1.5rem',
  },
  error: {
    backgroundColor: '#e74c3c22',
    color: '#e74c3c',
    padding: '0.75rem',
    borderRadius: '4px',
    marginBottom: '1rem',
    fontSize: '0.9rem',
    border: '1px solid #e74c3c44',
  },
  field: {
    marginBottom: '1rem',
  },
  label: {
    display: 'block',
    marginBottom: '0.4rem',
    color: '#aaa',
    fontSize: '0.9rem',
  },
  input: {
    width: '100%',
    padding: '0.6rem',
    borderRadius: '4px',
    border: '1px solid #333',
    backgroundColor: '#0f3460',
    color: '#e0e0e0',
    fontSize: '1rem',
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: '#00d4ff',
    color: '#1a1a2e',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '0.5rem',
  },
  footer: {
    textAlign: 'center',
    marginTop: '1.5rem',
    color: '#aaa',
    fontSize: '0.9rem',
  },
  footerLink: {
    color: '#00d4ff',
    textDecoration: 'none',
  },
};
