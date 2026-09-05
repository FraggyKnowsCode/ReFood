import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { cachedGet, invalidateCache } from '../api';
import { useAuth } from '../AuthContext';
import { TableRowSkeleton } from './PageLoader';

const ProgramsList = () => {
  const { user, isAdmin } = useAuth();
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [formData, setFormData] = useState({
    program_name: '', start_date: '', end_date: '', participating_organizations: ''
  });

  const fetchPrograms = async () => {
    cachedGet('/programs', (data, _, err) => {
      if (!err && data) setPrograms(data);
      setLoading(false);
    });
  };

  useEffect(() => { fetchPrograms(); }, []);

  // User can edit/delete if they are admin OR the original creator
  const canModify = (program) => isAdmin || program.created_by === user?.id;

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await api.delete(`/programs/${id}`);
      invalidateCache('/programs');
      fetchPrograms();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete event.');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingProgram) {
        await api.put(`/programs/${editingProgram.id}`, formData);
      } else {
        await api.post('/programs', formData);
      }
      invalidateCache('/programs');
      setShowModal(false);
      fetchPrograms();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save event.');
    }
  };

  const openModal = (program = null) => {
    if (program) {
      setEditingProgram(program);
      setFormData({
        program_name: program.program_name,
        start_date: program.start_date,
        end_date: program.end_date,
        participating_organizations: program.participating_organizations
      });
    } else {
      setEditingProgram(null);
      setFormData({ program_name: '', start_date: '', end_date: '', participating_organizations: '' });
    }
    setShowModal(true);
  };

  return (
    <div className="fade-in dashboard-page">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Events</h1>
          <p className="subtitle">Browse and manage food waste reduction events.</p>
        </div>
        <button className="btn" onClick={() => openModal()} style={{ width: 'auto' }}>
          + Add Event
        </button>
      </header>

      {loading ? (
        <div className="data-table-container glass-card" style={{ padding: '0' }}>
          <table className="data-table">
            <thead><tr><th>Event Name</th><th>Timeline</th><th>Organizations</th><th>Created By</th><th>Actions</th></tr></thead>
            <tbody>{Array.from({length: 5}).map((_,i) => <TableRowSkeleton key={i} cols={5} />)}</tbody>
          </table>
        </div>
      ) : (
        <div className="data-table-container glass-card" style={{ padding: '0' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Timeline</th>
                <th>Organizations</th>
                <th>Created By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {programs.map(p => (
                <tr key={p.id}>
                  <td><strong>{p.program_name}</strong></td>
                  <td>{p.start_date} to {p.end_date}</td>
                  <td>{p.participating_organizations}</td>
                  <td>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {p.users ? `${p.users.first_name} ${p.users.last_name}` : '—'}
                    </span>
                  </td>
                  <td style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link to={`/programs/${p.id}`} className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>View</Link>
                    {canModify(p) && (
                      <>
                        <button className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'var(--bg-secondary)' }} onClick={() => openModal(p)}>Edit</button>
                        <button className="btn btn-danger" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleDelete(p.id)}>Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {programs.length === 0 && (
                <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No events found. Be the first to add one!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop fade-in" onClick={() => setShowModal(false)}>
          <div className="modal-content glass-card" onClick={e => e.stopPropagation()}>
            <h2>{editingProgram ? 'Edit Event' : 'New Event'}</h2>
            <form onSubmit={handleSave} style={{ marginTop: '1.5rem' }}>
              <div className="input-group">
                <label>Event Name</label>
                <input required type="text" value={formData.program_name} onChange={e => setFormData({...formData, program_name: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Start Date</label>
                  <input required type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>End Date</label>
                  <input required type="date" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} />
                </div>
              </div>
              <div className="input-group">
                <label>Participating Organizations</label>
                <input type="text" value={formData.participating_organizations} onChange={e => setFormData({...formData, participating_organizations: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn" style={{ background: 'var(--bg-secondary)' }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn">{editingProgram ? 'Save Changes' : 'Create Event'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgramsList;
