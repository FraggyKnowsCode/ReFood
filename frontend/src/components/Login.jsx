import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Mail, Lock, Eye, EyeOff, Leaf } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-container fade-in">
        <div className="glass-card login-card">
          <div className="login-header">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Leaf size={28} color="#3b82f6" />
            </div>
            <h1>ReFood</h1>
            <p>Sign in to your account</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label htmlFor="login-email">Email Address</label>
              <div className="input-icon-wrap">
                <span className="input-icon"><Mail size={16} /></span>
                <input
                  id="login-email"
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="login-password">Password</label>
              <div className="input-icon-wrap">
                <span className="input-icon"><Lock size={16} /></span>
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  required
                  placeholder="••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button type="button" className="toggle-pw" onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button id="login-submit" type="submit" className="btn" style={{ marginTop: '0.5rem', background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }} disabled={loading}>
              {loading ? <div className="loader" style={{ width: '18px', height: '18px', margin: 'auto' }}></div> : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--accent-color)', textDecoration: 'none', fontWeight: '600' }}>
              Create one
            </Link>
          </p>

          <div style={{ textAlign: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
            <Link to="/admin/login" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textDecoration: 'none' }}>
              Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
