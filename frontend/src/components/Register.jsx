import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import axios from 'axios';

const Register = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setFormData({ ...formData, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match.');
    }
    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters.');
    }

    try {
      setLoading(true);

      // 1. Register via backend (admin API — no email confirmation needed)
      await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/register`,
        {
          email: formData.email,
          password: formData.password,
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
        }
      );

      // 2. Immediately sign in to establish session
      const { error: signInError } = await signIn(formData.email, formData.password);
      if (signInError) throw signInError;

      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-container fade-in" style={{ maxWidth: '520px' }}>
        <div className="glass-card">
          <div className="login-header">
            <h1>Create Account</h1>
            <p>Join the mission to eliminate food waste</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label>First Name</label>
                <input id="reg-first-name" type="text" required placeholder="Fahad" value={formData.firstName} onChange={update('firstName')} />
              </div>
              <div className="input-group">
                <label>Last Name</label>
                <input id="reg-last-name" type="text" required placeholder="Sikder" value={formData.lastName} onChange={update('lastName')} />
              </div>
            </div>

            <div className="input-group">
              <label>Email Address</label>
              <input id="reg-email" type="email" required placeholder="you@example.com" value={formData.email} onChange={update('email')} />
            </div>

            <div className="input-group">
              <label>Phone Number</label>
              <input id="reg-phone" type="text" placeholder="01XXXXXXXXX" value={formData.phone} onChange={update('phone')} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label>Password</label>
                <input id="reg-password" type="password" required placeholder="Min. 6 characters" value={formData.password} onChange={update('password')} />
              </div>
              <div className="input-group">
                <label>Confirm Password</label>
                <input id="reg-confirm-password" type="password" required placeholder="Repeat password" value={formData.confirmPassword} onChange={update('confirmPassword')} />
              </div>
            </div>

            <button id="reg-submit" type="submit" className="btn" style={{ marginTop: '0.5rem' }} disabled={loading}>
              {loading ? <div className="loader" style={{ width: '18px', height: '18px', margin: 'auto' }}></div> : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent-color)', textDecoration: 'none', fontWeight: '500' }}>
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
