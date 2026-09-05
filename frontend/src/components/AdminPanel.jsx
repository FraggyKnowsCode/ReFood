import React from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminPanel = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <header className="admin-header">
        <h2>Dashboard Overview</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            Logged in as {user?.email}
          </span>
          <button className="btn btn-danger" style={{ width: 'auto' }} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>
      
      <main className="admin-content">
        <div className="glass-card">
          <h3 style={{ marginBottom: '1rem' }}>Welcome to the Admin Panel</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            This secure dashboard replaces the legacy procedural PHP `admin_panel.php`. 
            It is protected by Supabase GoTrue JWT authentication.
          </p>
          <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
             {/* Placeholder for dashboard widgets */}
             <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px' }}>
                <h4>Users</h4>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>124</p>
             </div>
             <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px' }}>
                <h4>Programs</h4>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success-color)' }}>8</p>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
