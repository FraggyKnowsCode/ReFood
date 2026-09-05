import React, { useEffect, useState } from 'react';
import api from '../api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleAdmin = async (user) => {
    if (!window.confirm(`Are you sure you want to ${user.is_admin ? 'revoke' : 'grant'} admin rights for ${user.first_name}?`)) return;
    try {
      await api.put(`/users/${user.id}`, { ...user, is_admin: !user.is_admin });
      fetchUsers();
    } catch (err) {
      alert('Failed to update user role.');
    }
  };

  const deleteUser = async (id, name) => {
    if (!window.confirm(`CRITICAL WARNING: Are you sure you want to permanently delete user ${name}? This will cascade and delete their food waste logs, requests, and feedback.`)) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (err) {
      alert('Failed to delete user.');
    }
  };

  return (
    <div className="fade-in dashboard-page">
      <header className="page-header">
        <h1>User Management</h1>
        <p className="subtitle">Administer platform users and roles.</p>
      </header>

      <div className="data-table-container glass-card" style={{ padding: 0 }}>
        {loading ? <div className="loader" style={{ margin: '2rem auto' }}></div> : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td><strong>{u.first_name} {u.last_name}</strong></td>
                  <td>{u.email}</td>
                  <td>{u.phone}</td>
                  <td>
                    <span style={{ 
                      padding: '0.2rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.8rem', 
                      background: u.is_admin ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                      color: u.is_admin ? 'var(--danger-color)' : 'var(--accent-color)'
                    }}>
                      {u.is_admin ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'var(--bg-secondary)' }} onClick={() => toggleAdmin(u)}>
                        Toggle Role
                      </button>
                      <button className="btn btn-danger" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => deleteUser(u.id, u.first_name)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
