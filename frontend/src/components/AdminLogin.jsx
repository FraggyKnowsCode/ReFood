import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import api from '../api';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data: authData, error: signInError } = await signIn(email, password);
      if (signInError) throw signInError;

      const token = authData?.session?.access_token;
      if (!token) throw new Error('Authentication failed.');

      // Verify the user is actually an admin
      const res = await api.get('/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.data?.is_admin) {
        // Sign them out immediately and show error
        await import('../supabaseClient').then(m => m.supabase.auth.signOut());
        throw new Error('Access denied. This portal is for administrators only.');
      }

      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper admin-login-wrapper">
      <div className="login-container fade-in">
        <div className="glass-card admin-login-card">
          {/* Admin badge */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(168, 85, 247, 0.15)',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              borderRadius: '999px',
              padding: '0.4rem 1rem',
              fontSize: '0.75rem',
              fontWeight: '700',
              letterSpacing: '1.5px',
              color: '#a855f7',
            }}>
              ADMIN PORTAL
            </div>
          </div>

          <div className="login-header" style={{ marginBottom: '1.5rem' }}>
            <h1 style={{ background: 'linear-gradient(to right, #a855f7, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Admin Access
            </h1>
            <p>Restricted to authorized administrators only</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label htmlFor="admin-email">Admin Email</label>
              <input
                id="admin-email"
                type="email"
                required
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ borderColor: 'rgba(168, 85, 247, 0.3)' }}
              />
            </div>
            <div className="input-group">
              <label htmlFor="admin-password">Password</label>
              <input
                id="admin-password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ borderColor: 'rgba(168, 85, 247, 0.3)' }}
              />
            </div>
            <button
              id="admin-login-submit"
              type="submit"
              className="btn"
              disabled={loading}
              style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
            >
              {loading
                ? <div className="loader" style={{ width: '18px', height: '18px', margin: 'auto' }}></div>
                : 'Access Admin Panel'
              }
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(168,85,247,0.2)' }}>
            <Link to="/login" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textDecoration: 'none' }}>
              ← Back to User Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
