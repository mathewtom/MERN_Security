// =============================================================================
// Auth Context — client/src/context/AuthContext.jsx
// =============================================================================
// This is the BRAIN of the auth system on the frontend. It holds:
//   - The current user object (or null if logged out)
//   - Whether we're still loading (checking if user has a valid session)
//   - Functions to login, register, and logout
//


import { createContext, useState, useEffect, useCallback } from 'react';
import {
  loginAPI,
  registerAPI,
  logoutAPI,
  refreshAPI,
  registerLogoutCallback,
  clearAccessToken,
} from '../services/api.js';

// ---------------------------------------------------------------------------
// Step 1: CREATE THE CONTEXT
// ---------------------------------------------------------------------------

export const AuthContext = createContext(null);

// ---------------------------------------------------------------------------
// Step 2: THE PROVIDER COMPONENT
// ---------------------------------------------------------------------------

export function AuthProvider({ children }) {
  // ---- STATE ----
  // user:    The logged-in user object ({ id, email, firstName, lastName, role })
  //          or null if not logged in
  // loading: true while we're checking if the user has a valid session
  //          (on initial page load / refresh). Components should show a
  //          loading spinner while this is true to avoid flashing the
  //          login page before we know if the user is actually logged in.
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // --------------------------------------------------------------------------
  // LOGOUT FUNCTION
  // --------------------------------------------------------------------------
  
  const logout = useCallback(async () => {
    await logoutAPI();
    setUser(null);
  }, []);

  // --------------------------------------------------------------------------
  // REGISTER LOGOUT CALLBACK WITH API LAYER
  // --------------------------------------------------------------------------
  
  useEffect(() => {
    registerLogoutCallback(logout);
  }, [logout]);

  // --------------------------------------------------------------------------
  // CHECK EXISTING SESSION ON PAGE LOAD / REFRESH
  // --------------------------------------------------------------------------
  
  useEffect(() => {
    let isMounted = true; // Guard against setting state after unmount

    async function checkSession() {
      try {
        const data = await refreshAPI();
        if (isMounted) {
          setUser(data.data.user);
        }
      } catch {
        // No valid session — that's fine, user will need to login
        if (isMounted) {
          clearAccessToken();
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    checkSession();

    // CLEANUP FUNCTION:
    
    return () => {
      isMounted = false;
    };
  }, []);

  // --------------------------------------------------------------------------
  // LOGIN FUNCTION
  // --------------------------------------------------------------------------
  const login = useCallback(async (email, password) => {
    const data = await loginAPI(email, password);
    setUser(data.data.user);
    return data;
  }, []);

  // --------------------------------------------------------------------------
  // REGISTER FUNCTION
  // --------------------------------------------------------------------------
  const register = useCallback(async (email, password, firstName, lastName) => {
    const data = await registerAPI(email, password, firstName, lastName);
    setUser(data.data.user);
    return data;
  }, []);

  // --------------------------------------------------------------------------
  // THE CONTEXT VALUE — what gets broadcast to all subscribers
  // --------------------------------------------------------------------------
  
  const value = {
    user,
    loading,
    isAuthenticated: !!user, 
    login,
    register,
    logout,
  };

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
