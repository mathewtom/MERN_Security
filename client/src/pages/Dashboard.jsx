// =============================================================================
// Dashboard Page — client/src/pages/Dashboard.jsx
// =============================================================================
// This is a PROTECTED page (only accessible when logged in, enforced by
// the ProtectedRoute wrapper in App.jsx).
//
// It demonstrates:
//   1. Reading user data from auth context (available immediately)
//   2. Making an authenticated API call (GET /api/users/me)
//   3. Handling loading and error states for API calls
//
// WHY TWO SOURCES OF USER DATA?
// The auth context has user info from the login/register response, which is
// available instantly. But you might also want to fetch FRESH data from the
// server (maybe another device updated the profile). This page shows both
// approaches.
// =============================================================================

import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { getMeAPI } from '../services/api.js';

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [fetchError, setFetchError] = useState('');

  // --------------------------------------------------------------------------
  // FETCH FRESH PROFILE DATA FROM SERVER
  // --------------------------------------------------------------------------
  // useEffect with [] runs once on mount. This makes an authenticated
  // GET /api/users/me request. The authenticatedRequest function in api.js
  // handles attaching the access token and refreshing if needed.
  // --------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    async function fetchProfile() {
      try {
        const data = await getMeAPI();
        if (isMounted) {
          setProfile(data.data.user);
        }
      } catch (err) {
        if (isMounted) {
          setFetchError(err.message || 'Failed to load profile');
        }
      }
    }

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Dashboard</h1>

      {/* User info from AUTH CONTEXT (immediate, from login response) */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Welcome, {user?.firstName}!</h2>
        <p style={styles.text}>
          Logged in as <strong>{user?.email}</strong>
        </p>
        <p style={styles.text}>
          Role: <span style={styles.badge}>{user?.role}</span>
        </p>
      </div>

      {/* User info from API CALL (fresh from server) */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Server Profile Data</h2>
        {fetchError && <p style={styles.error}>{fetchError}</p>}
        {!profile && !fetchError && (
          <p style={styles.textMuted}>Loading profile...</p>
        )}
        {profile && (
          <div>
            <p style={styles.text}>
              <strong>Name:</strong> {profile.firstName} {profile.lastName}
            </p>
            <p style={styles.text}>
              <strong>Email:</strong> {profile.email}
            </p>
            <p style={styles.text}>
              <strong>Role:</strong>{' '}
              <span style={styles.badge}>{profile.role}</span>
            </p>
            <p style={styles.textMuted}>
              Account created: {new Date(profile.createdAt).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MINIMAL STYLES
// ---------------------------------------------------------------------------
const styles = {
  container: {
    maxWidth: '700px',
    margin: '2rem auto',
    padding: '0 2rem',
  },
  title: {
    color: '#e0e0e0',
    marginBottom: '1.5rem',
  },
  card: {
    backgroundColor: '#16213e',
    padding: '1.5rem',
    borderRadius: '8px',
    marginBottom: '1.5rem',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
  },
  cardTitle: {
    color: '#00d4ff',
    marginBottom: '1rem',
    fontSize: '1.1rem',
  },
  text: {
    color: '#e0e0e0',
    marginBottom: '0.5rem',
    lineHeight: 1.5,
  },
  textMuted: {
    color: '#888',
    fontSize: '0.9rem',
  },
  badge: {
    backgroundColor: '#0f3460',
    color: '#00d4ff',
    padding: '0.15rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.85rem',
  },
  error: {
    color: '#e74c3c',
    fontSize: '0.9rem',
  },
};
