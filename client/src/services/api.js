// =============================================================================
// API Service Layer — client/src/services/api.js
// =============================================================================

const API_BASE = import.meta.env.VITE_API_URL;

// ---------------------------------------------------------------------------
// IN-MEMORY TOKEN STORAGE
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// REFRESH LOCK — prevents multiple simultaneous refresh requests
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
let refreshPromise = null;

// ---------------------------------------------------------------------------
// LOGOUT CALLBACK — set by AuthContext so api.js can trigger a full logout
// ---------------------------------------------------------------------------

let logoutCallback = null;

export function registerLogoutCallback(fn) {
  logoutCallback = fn;
}

// ---------------------------------------------------------------------------
// CORE REQUEST FUNCTION
// ---------------------------------------------------------------------------
// Every API call goes through this function. It handles:
//   1. Building the full URL from a relative path
//   2. Setting JSON headers
//   3. Attaching the access token (if we have one)
//   4. Sending cookies (credentials: 'include') for the refresh token
//   5. Parsing the JSON response
//   6. Throwing on error responses so callers can catch
// ---------------------------------------------------------------------------
async function request(endpoint, options = {}) {
  const {
    method = 'GET',
    body = null,
    headers = {},
    // skipAuth lets us make requests without the access token
    // (used for login, register, and the refresh call itself)
    skipAuth = false,
  } = options;

  // --- Build headers ---
  const requestHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // Attach access token if we have one and this isn't a skipAuth request
  if (!skipAuth && accessToken) {
    requestHeaders['Authorization'] = `Bearer ${accessToken}`;
  }

  // --- Make the request ---
  // credentials: 'include' tells the browser to send cookies (httpOnly
  // refresh token) with cross-origin requests. 
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : null,
    credentials: 'include',
  });

  // --- Handle the response ---
  
  const data = await response.json();

  if (!response.ok) {
    // Throw an error object that includes the server's message and status
    const error = new Error(data.message || 'Request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// ---------------------------------------------------------------------------
// AUTHENTICATED REQUEST — adds automatic 401 retry with token refresh
// ---------------------------------------------------------------------------

async function authenticatedRequest(endpoint, options = {}) {
  try {
    return await request(endpoint, options);
  } catch (error) {
    // Only attempt refresh on 401 (Unauthorized / expired token)
    if (error.status !== 401) {
      throw error;
    }

    // ---- TOKEN REFRESH LOGIC ----
    try {
      // If no refresh is in progress, start one
      if (!refreshPromise) {
        refreshPromise = request('/auth/refresh', {
          method: 'POST',
          skipAuth: true, // Don't attach the expired access token
        });
      }

      // Wait for the refresh to complete 
      const refreshData = refreshPromise;
      const result = await refreshData;

      // Store the new access token
      setAccessToken(result.data.accessToken);

      // Retry the ORIGINAL request with the fresh token
      return await request(endpoint, options);
    } catch (refreshError) {
      // Refresh failed — session is dead
      clearAccessToken();
      if (logoutCallback) {
        logoutCallback();
      }
      throw refreshError;
    } finally {
      // Clear the refresh promise so future 401s can try again
      refreshPromise = null;
    }
  }
}

// ---------------------------------------------------------------------------
// PUBLIC API METHODS — what the rest of the app imports and uses
// ---------------------------------------------------------------------------

// --- Auth endpoints (no access token needed) ---

export async function loginAPI(email, password) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: { email, password },
    skipAuth: true,
  });
  // Store the access token we just received
  setAccessToken(data.data.accessToken);
  return data;
}

export async function registerAPI(email, password, firstName, lastName) {
  const data = await request('/auth/register', {
    method: 'POST',
    body: { email, password, firstName, lastName },
    skipAuth: true,
  });
  // Store the access token we just received
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
    // Even if the server call fails, we still want to clear local state.
    
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

// --- Protected user endpoints (access token required, auto-refresh) ---

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
