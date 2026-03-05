// =============================================================================
// Profile Page — client/src/pages/Profile.jsx
// =============================================================================
// Protected page that lets users view and update their profile (firstName
// and lastName only — matching the server's ALLOWED_UPDATED_FIELDS whitelist).
//
// DEMONSTRATES:
//   - Fetching data on mount
//   - Edit mode toggle (view vs edit)
//   - PATCH request with the API service layer
//   - Optimistic-ish update (we refresh from server after success)
// =============================================================================

import { useState, useEffect } from 'react';
import { getMeAPI, updateMeAPI } from '../services/api.js';

export default function Profile() {
  // ---- STATE ----
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Edit mode state
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ firstName: '', lastName: '' });
  const [saving, setSaving] = useState(false);

  // --------------------------------------------------------------------------
  // FETCH PROFILE ON MOUNT
  // --------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const data = await getMeAPI();
        if (isMounted) {
          setProfile(data.data.user);
          setFormData({
            firstName: data.data.user.firstName,
            lastName: data.data.user.lastName,
          });
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load profile');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    load();
    return () => { isMounted = false; };
  }, []);

  // --------------------------------------------------------------------------
  // HANDLE EDIT FORM CHANGE
  // --------------------------------------------------------------------------
  function handleChange(e) {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  // --------------------------------------------------------------------------
  // HANDLE SAVE
  // --------------------------------------------------------------------------
  // Sends PATCH /api/users/me with { firstName, lastName }.
  // The server validates with the updateProfileSchema (Zod) and the
  // userService whitelist, so even if someone tampered with the request
  // body, they can't change role, email, etc.
  // --------------------------------------------------------------------------
  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      // Only send fields that actually changed to minimize the request
      const updates = {};
      if (formData.firstName !== profile.firstName) {
        updates.firstName = formData.firstName;
      }
      if (formData.lastName !== profile.lastName) {
        updates.lastName = formData.lastName;
      }

      // If nothing changed, don't make the request
      if (Object.keys(updates).length === 0) {
        setEditing(false);
        setSaving(false);
        return;
      }

      const data = await updateMeAPI(updates);
      setProfile(data.data.user);
      setSuccess('Profile updated successfully.');
      setEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }

  // --------------------------------------------------------------------------
  // CANCEL EDIT — reset form to current profile values
  // --------------------------------------------------------------------------
  function handleCancel() {
    setFormData({
      firstName: profile.firstName,
      lastName: profile.lastName,
    });
    setEditing(false);
    setError('');
  }

  // ---- LOADING STATE ----
  if (loading) {
    return (
      <div style={styles.container}>
        <p style={styles.textMuted}>Loading profile...</p>
      </div>
    );
  }

  // ---- ERROR STATE (couldn't load profile at all) ----
  if (!profile) {
    return (
      <div style={styles.container}>
        <p style={styles.error}>{error || 'Could not load profile.'}</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Profile</h1>

      {error && <div style={styles.errorBox}>{error}</div>}
      {success && <div style={styles.successBox}>{success}</div>}

      <div style={styles.card}>
        {editing ? (
          // ---- EDIT MODE ----
          <form onSubmit={handleSave}>
            <div style={styles.field}>
              <label htmlFor="firstName" style={styles.label}>First Name</label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>
            <div style={styles.field}>
              <label htmlFor="lastName" style={styles.label}>Last Name</label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>
            <div style={styles.buttonRow}>
              <button
                type="submit"
                disabled={saving}
                style={styles.saveBtn}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                style={styles.cancelBtn}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          // ---- VIEW MODE ----
          <>
            <div style={styles.profileRow}>
              <span style={styles.label}>First Name</span>
              <span style={styles.value}>{profile.firstName}</span>
            </div>
            <div style={styles.profileRow}>
              <span style={styles.label}>Last Name</span>
              <span style={styles.value}>{profile.lastName}</span>
            </div>
            <div style={styles.profileRow}>
              <span style={styles.label}>Email</span>
              <span style={styles.value}>{profile.email}</span>
            </div>
            <div style={styles.profileRow}>
              <span style={styles.label}>Role</span>
              <span style={styles.badge}>{profile.role}</span>
            </div>
            <div style={styles.profileRow}>
              <span style={styles.label}>Member Since</span>
              <span style={styles.value}>
                {new Date(profile.createdAt).toLocaleDateString()}
              </span>
            </div>

            <button onClick={() => setEditing(true)} style={styles.editBtn}>
              Edit Profile
            </button>
          </>
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
    maxWidth: '600px',
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
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
  },
  profileRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 0',
    borderBottom: '1px solid #1a1a3e',
  },
  label: {
    color: '#aaa',
    fontSize: '0.9rem',
    display: 'block',
    marginBottom: '0.4rem',
  },
  value: {
    color: '#e0e0e0',
  },
  badge: {
    backgroundColor: '#0f3460',
    color: '#00d4ff',
    padding: '0.15rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.85rem',
  },
  field: {
    marginBottom: '1rem',
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
  buttonRow: {
    display: 'flex',
    gap: '0.75rem',
    marginTop: '0.5rem',
  },
  editBtn: {
    marginTop: '1.25rem',
    padding: '0.6rem 1.2rem',
    backgroundColor: '#0f3460',
    color: '#00d4ff',
    border: '1px solid #00d4ff44',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  saveBtn: {
    padding: '0.6rem 1.2rem',
    backgroundColor: '#00d4ff',
    color: '#1a1a2e',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '0.9rem',
  },
  cancelBtn: {
    padding: '0.6rem 1.2rem',
    backgroundColor: 'transparent',
    color: '#aaa',
    border: '1px solid #555',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  errorBox: {
    backgroundColor: '#e74c3c22',
    color: '#e74c3c',
    padding: '0.75rem',
    borderRadius: '4px',
    marginBottom: '1rem',
    fontSize: '0.9rem',
    border: '1px solid #e74c3c44',
  },
  successBox: {
    backgroundColor: '#2ecc7022',
    color: '#2ecc70',
    padding: '0.75rem',
    borderRadius: '4px',
    marginBottom: '1rem',
    fontSize: '0.9rem',
    border: '1px solid #2ecc7044',
  },
  error: {
    color: '#e74c3c',
  },
  textMuted: {
    color: '#888',
    textAlign: 'center',
    padding: '2rem',
  },
};
