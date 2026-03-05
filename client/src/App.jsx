// =============================================================================
// App.jsx — client/src/App.jsx
// =============================================================================
// This is the ROOT component of the React app. It defines:
//   1. The routing structure (which URL renders which page)
//   2. The layout (Navbar appears on every page)
//   3. Which routes are protected
//

// ROUTE STRUCTURE:
//   /           → redirects to /dashboard (if logged in) or /login
//   /login      → Login page
//   /register   → Register page
//   /dashboard  → Dashboard (PROTECTED)
//   /profile    → Profile (PROTECTED)
//   *           → catch-all, redirects to /
// =============================================================================

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Profile from './pages/Profile.jsx';

export default function App() {
  return (
    // BrowserRouter must wrap everything that uses routing
    <BrowserRouter>
      {/* Navbar sits OUTSIDE <Routes> so it renders on EVERY page */}
      <Navbar />

      {/*
        PAGE CONTENT — only one <Route> renders at a time.
        
        The route structure reads top to bottom. React Router picks the
        first one that matches the current URL path.
      */}
      <Routes>
        {/* -------------------------------------------------------------- */}
        {/* PUBLIC ROUTES — accessible to everyone                         */}
        {/* -------------------------------------------------------------- */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* -------------------------------------------------------------- */}
        {/* PROTECTED ROUTES — only accessible when logged in              */}
        {/* -------------------------------------------------------------- */}
        {/*
          LAYOUT ROUTE PATTERN:
          ProtectedRoute has NO `path` prop — it's a LAYOUT route.
          It wraps its children and either:
            - Renders <Outlet /> (which becomes Dashboard or Profile)
            - Redirects to /login

          This is MUCH cleaner than wrapping each page individually:

          GOOD (layout route):
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

          WORSE (repetitive):
            <Route path="/dashboard" element={
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute><Profile /></ProtectedRoute>
            } />
        */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* -------------------------------------------------------------- */}
        {/* REDIRECTS                                                       */}
        {/* -------------------------------------------------------------- */}
        {/* Root path redirects to dashboard (ProtectedRoute handles the
            auth check — if not logged in, it redirects to /login) */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Catch-all: any unmatched URL goes to root */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
