const API_BASE = import.meta.env.VITE_API_URL;

// CSRF — read token from cookie, send in X-CSRF-Token header
function getCsrfToken() {
  const match = document.cookie.match(/(^| )csrf-token=([^;]+)/);
  return match ? match[2] : null;
}

export async function initCsrf() {
  await fetch(`${API_BASE}/csrf-token`, { credentials: 'include' });
}

// In-memory token storage
let accessToken = null;

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token) {
  accessToken = token;
}

export function clearAccessToken() {
  accessToken = null;
}

// Refresh lock — prevents multiple simultaneous refresh requests
let refreshPromise = null;

// Logout callback — set by AuthContext so api.js can trigger a full logout
let logoutCallback = null;

export function registerLogoutCallback(fn) {
  logoutCallback = fn;
}

// Core request function
async function request(endpoint, options = {}) {
  const {
    method = 'GET',
    body = null,
    headers = {},
    skipAuth = false,
  } = options;

  const requestHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (!skipAuth && accessToken) {
    requestHeaders['Authorization'] = `Bearer ${accessToken}`;
  }

  // Attach CSRF token on state-changing requests
  if (method !== 'GET') {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      requestHeaders['X-CSRF-Token'] = csrfToken;
    }
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : null,
    credentials: 'include',
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || 'Request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// Authenticated request — auto-retries with token refresh on 401
async function authenticatedRequest(endpoint, options = {}) {
  try {
    return await request(endpoint, options);
  } catch (error) {
    if (error.status !== 401) {
      throw error;
    }

    try {
      if (!refreshPromise) {
        refreshPromise = request('/auth/refresh', {
          method: 'POST',
          skipAuth: true,
        });
      }

      const refreshData = refreshPromise;
      const result = await refreshData;
      setAccessToken(result.data.accessToken);
      return await request(endpoint, options);
    } catch (refreshError) {
      clearAccessToken();
      if (logoutCallback) {
        logoutCallback();
      }
      throw refreshError;
    } finally {
      refreshPromise = null;
    }
  }
}

// Auth endpoints (no access token needed)

export async function loginAPI(email, password) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: { email, password },
    skipAuth: true,
  });
  setAccessToken(data.data.accessToken);
  return data;
}

export async function registerAPI(email, password, firstName, lastName) {
  const data = await request('/auth/register', {
    method: 'POST',
    body: { email, password, firstName, lastName },
    skipAuth: true,
  });
  setAccessToken(data.data.accessToken);
  return data;
}

export async function logoutAPI() {
  try {
    await request('/auth/logout', {
      method: 'POST',
      skipAuth: true,
    });
  } catch {
    // Clear local state even if server call fails
  }
  clearAccessToken();
}

export async function refreshAPI() {
  const data = await request('/auth/refresh', {
    method: 'POST',
    skipAuth: true,
  });
  setAccessToken(data.data.accessToken);
  return data;
}

// Protected user endpoints (access token required, auto-refresh)

export async function getMeAPI() {
  return authenticatedRequest('/users/me');
}

export async function updateMeAPI(updates) {
  return authenticatedRequest('/users/me', {
    method: 'PATCH',
    body: updates,
  });
}

export async function listUsersAPI() {
  return authenticatedRequest('/users');
}
