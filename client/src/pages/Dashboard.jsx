import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { getMeAPI } from '../services/api.js';

// day.js loaded from CDN (index.html) — available as window.dayjs
const dayjs = window.dayjs;

if (dayjs && window.dayjs_plugin_relativeTime) {
  dayjs.extend(window.dayjs_plugin_relativeTime);
}

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [fetchError, setFetchError] = useState('');

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
    return () => { isMounted = false; };
  }, []);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Dashboard</h1>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Welcome, {user?.firstName}!</h2>
        <p style={styles.text}>
          Logged in as <strong>{user?.email}</strong>
        </p>
        <p style={styles.text}>
          Role: <span style={styles.badge}>{user?.role}</span>
        </p>
      </div>

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
              Account created:{' '}
              {dayjs
                ? `${dayjs(profile.createdAt).fromNow()} (${dayjs(profile.createdAt).format('MMM D, YYYY')})`
                : new Date(profile.createdAt).toLocaleDateString()
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

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
