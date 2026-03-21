import { createContext, useState, useEffect, useCallback } from 'react';
import {
  loginAPI,
  registerAPI,
  logoutAPI,
  refreshAPI,
  registerLogoutCallback,
  clearAccessToken,
  initCsrf,
} from '../services/api.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    await logoutAPI();
    setUser(null);
  }, []);

  useEffect(() => {
    registerLogoutCallback(logout);
  }, [logout]);

  // Check existing session on page load
  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        await initCsrf();
        const data = await refreshAPI();
        if (isMounted) {
          setUser(data.data.user);
        }
      } catch {
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
    return () => { isMounted = false; };
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await loginAPI(email, password);
    setUser(data.data.user);
    return data;
  }, []);

  const register = useCallback(async (email, password, firstName, lastName) => {
    const data = await registerAPI(email, password, firstName, lastName);
    setUser(data.data.user);
    return data;
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
