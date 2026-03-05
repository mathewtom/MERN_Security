// =============================================================================
// Navigation — client/src/components/Navbar.jsx
// =============================================================================
// Conditional rendering based on auth state:
//   - Logged OUT → show Login and Register links
//   - Logged IN  → show Dashboard, Profile, and Logout button
//


import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  // Handle logout: call the context's logout function, then redirect
  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <nav style={styles.nav}>
      {/* Left side: app name/link */}
      <Link to="/" style={styles.brand}>
        MERN Auth
      </Link>

      {/* Right side: conditional links */}
      <div style={styles.links}>
        {isAuthenticated ? (
          // ---- LOGGED IN ----
          <>
            <Link to="/dashboard" style={styles.link}>
              Dashboard
            </Link>
            <Link to="/profile" style={styles.link}>
              Profile
            </Link>
            <span style={styles.greeting}>
              Hi, {user?.firstName}
            </span>
            <button onClick={handleLogout} style={styles.logoutBtn}>
              Logout
            </button>
          </>
        ) : (
          // ---- LOGGED OUT ----
          <>
            <Link to="/login" style={styles.link}>
              Login
            </Link>
            <Link to="/register" style={styles.link}>
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// INLINE STYLES — minimal but functional
// ---------------------------------------------------------------------------

const styles = {
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    backgroundColor: '#1a1a2e',
    color: '#e0e0e0',
  },
  brand: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#00d4ff',
    textDecoration: 'none',
  },
  links: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  link: {
    color: '#e0e0e0',
    textDecoration: 'none',
  },
  greeting: {
    color: '#aaa',
    fontSize: '0.9rem',
  },
  logoutBtn: {
    background: 'none',
    border: '1px solid #e74c3c',
    color: '#e74c3c',
    padding: '0.4rem 0.8rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
};
