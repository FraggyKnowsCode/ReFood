import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import api from '../api';

const Profile = () => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState({ first_name: '', last_name: '', phone: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/users/me');
        setProfile(res.data);
      } catch (err) {
        console.error('Failed to load profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.put('/users/me', {
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone
      });
      alert('Profile updated successfully!');
    } catch (err) {
      alert('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loader" style={{ margin: '4rem auto' }}></div>;

  return (
    <div className="fade-in dashboard-page">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>My Profile</h1>
          <p className="subtitle">Manage your personal information.</p>
        </div>
        <button className="btn btn-danger" onClick={signOut} style={{ width: 'auto' }}>
          Logout
        </button>
      </header>

      <div className="glass-card" style={{ maxWidth: '600px' }}>
        <form onSubmit={handleUpdate}>
          <div className="input-group">
            <label>Email Address</label>
            <input type="email" value={profile.email} disabled style={{ opacity: 0.7 }} />
            <small style={{ color: 'var(--text-secondary)' }}>Email cannot be changed.</small>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label>First Name</label>
              <input type="text" required value={profile.first_name} onChange={e => setProfile({...profile, first_name: e.target.value})} />
            </div>
            <div className="input-group">
              <label>Last Name</label>
              <input type="text" required value={profile.last_name} onChange={e => setProfile({...profile, last_name: e.target.value})} />
            </div>
          </div>

          <div className="input-group">
            <label>Phone Number</label>
            <input type="text" required value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} />
          </div>

          <button type="submit" className="btn" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
