import React, { useEffect, useState } from 'react';
import api from '../api';

const CostManagement = () => {
  const [costs, setCosts] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    program_id: '', labour_cost: 0, maintenance_cost: 0, transportation_cost: 0, event_cost: 0, other_cost: 0
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [costsRes, programsRes] = await Promise.all([
        api.get('/costs'),
        api.get('/programs')
      ]);
      setCosts(costsRes.data);
      setPrograms(programsRes.data);
    } catch (err) {
      console.error('Error fetching cost data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogCost = async (e) => {
    e.preventDefault();
    try {
      await api.post('/costs', formData);
      setShowModal(false);
      setFormData({ program_id: '', labour_cost: 0, maintenance_cost: 0, transportation_cost: 0, event_cost: 0, other_cost: 0 });
      fetchData();
    } catch (err) {
      alert('Failed to log cost. Admin access required.');
    }
  };

  return (
    <div className="fade-in dashboard-page">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Cost Management</h1>
          <p className="subtitle">Track operational expenses across all active programs.</p>
        </div>
        <button className="btn btn-danger" onClick={() => setShowModal(true)} style={{ width: 'auto' }}>
          + Log Expense
        </button>
      </header>

      <div className="data-table-container glass-card" style={{ padding: 0 }}>
        {loading ? <div className="loader" style={{ margin: '2rem auto' }}></div> : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Program</th>
                <th>Labour</th>
                <th>Maintenance</th>
                <th>Transport</th>
                <th>Events</th>
                <th>Other</th>
                <th style={{ color: 'var(--accent-color)' }}>Total Cost</th>
              </tr>
            </thead>
            <tbody>
              {costs.map(c => (
                <tr key={c.id}>
                  <td><strong>{c.reduction_programs?.program_name}</strong></td>
                  <td>৳{c.labour_cost}</td>
                  <td>৳{c.maintenance_cost}</td>
                  <td>৳{c.transportation_cost}</td>
                  <td>৳{c.event_cost}</td>
                  <td>৳{c.other_cost}</td>
                  <td style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>৳{c.total_cost}</td>
                </tr>
              ))}
              {costs.length === 0 && (
                <tr><td colSpan="7" style={{ textAlign: 'center' }}>No expenses logged yet.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop fade-in" onClick={() => setShowModal(false)}>
          <div className="modal-content glass-card" onClick={e => e.stopPropagation()}>
            <h2>Log Operational Expense</h2>
            <form onSubmit={handleLogCost} style={{ marginTop: '1.5rem', maxHeight: '70vh', overflowY: 'auto', paddingRight: '1rem' }}>
              
              <div className="input-group">
                <label>Program</label>
                <select required value={formData.program_id} onChange={e => setFormData({...formData, program_id: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: '#fff' }}>
                  <option value="" style={{ color: '#000' }}>Select Program...</option>
                  {programs.map(p => (
                    <option key={p.id} value={p.id} style={{ color: '#000' }}>{p.program_name}</option>
                  ))}
                </select>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label>Labour Cost (৳)</label>
                  <input required type="number" step="0.01" min="0" value={formData.labour_cost} onChange={e => setFormData({...formData, labour_cost: e.target.value})} />
                </div>
                <div className="input-group">
                  <label>Maintenance (৳)</label>
                  <input required type="number" step="0.01" min="0" value={formData.maintenance_cost} onChange={e => setFormData({...formData, maintenance_cost: e.target.value})} />
                </div>
                <div className="input-group">
                  <label>Transport (৳)</label>
                  <input required type="number" step="0.01" min="0" value={formData.transportation_cost} onChange={e => setFormData({...formData, transportation_cost: e.target.value})} />
                </div>
                <div className="input-group">
                  <label>Events (৳)</label>
                  <input required type="number" step="0.01" min="0" value={formData.event_cost} onChange={e => setFormData({...formData, event_cost: e.target.value})} />
                </div>
                <div className="input-group">
                  <label>Other (৳)</label>
                  <input required type="number" step="0.01" min="0" value={formData.other_cost} onChange={e => setFormData({...formData, other_cost: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn" style={{ background: 'var(--bg-secondary)' }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-danger">Submit Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CostManagement;
