import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import PageLoader from './components/PageLoader';

// ── Eagerly load auth + shell (needed immediately) ────────────────────────
import Login     from './components/Login';
import AdminLogin from './components/AdminLogin';
import Register  from './components/Register';
import Layout    from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// ── Lazy load every page (code-split into separate chunks) ────────────────
const Dashboard      = lazy(() => import('./components/Dashboard'));
const ProgramsList   = lazy(() => import('./components/ProgramsList'));
const ProgramDetail  = lazy(() => import('./components/ProgramDetail'));
const FoodData       = lazy(() => import('./components/FoodData'));
const DonationsPage  = lazy(() => import('./components/DonationsPage'));
const CostManagement = lazy(() => import('./components/CostManagement'));
const Profile        = lazy(() => import('./components/Profile'));
const UserManagement = lazy(() => import('./components/UserManagement'));
const FeedbackPage   = lazy(() => import('./components/FeedbackPage'));

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Routes>
            <Route path="/login"       element={<Login />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/register"    element={<Register />} />

            {/* Protected Routes — pages are lazy, Layout/ProtectedRoute are not */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/dashboard" element={
                  <Suspense fallback={<PageLoader />}><Dashboard /></Suspense>
                } />
                <Route path="/programs" element={
                  <Suspense fallback={<PageLoader />}><ProgramsList /></Suspense>
                } />
                <Route path="/programs/:id" element={
                  <Suspense fallback={<PageLoader />}><ProgramDetail /></Suspense>
                } />
                <Route path="/food-data" element={
                  <Suspense fallback={<PageLoader />}><FoodData /></Suspense>
                } />
                <Route path="/donations" element={
                  <Suspense fallback={<PageLoader />}><DonationsPage /></Suspense>
                } />
                <Route path="/costs" element={
                  <Suspense fallback={<PageLoader />}><CostManagement /></Suspense>
                } />
                <Route path="/profile" element={
                  <Suspense fallback={<PageLoader />}><Profile /></Suspense>
                } />
                <Route path="/users" element={
                  <Suspense fallback={<PageLoader />}><UserManagement /></Suspense>
                } />
                <Route path="/feedback" element={
                  <Suspense fallback={<PageLoader />}><FeedbackPage /></Suspense>
                } />
              </Route>
            </Route>

            {/* Redirect root to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
