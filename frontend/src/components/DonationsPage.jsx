import React, { useEffect, useState } from 'react';
import api, { cachedGet, invalidateCache } from '../api';
import { useAuth } from '../AuthContext';
import { TableRowSkeleton } from './PageLoader';

// Payment method verification fields config
const VERIFICATION_FIELDS = {
  'Mobile Banking (bKash)': {
    provider: 'bKash',
    fields: [
      { key: 'transaction_id', label: 'bKash Transaction ID', placeholder: 'e.g. ABC1234567890', required: true },
      { key: 'mobile_provider', label: 'Provider', value: 'bKash', hidden: true },
    ]
  },
  'Mobile Banking (Nagad)': {
    fields: [
      { key: 'transaction_id', label: 'Nagad Transaction ID', placeholder: 'e.g. NAG1234567890', required: true },
      { key: 'mobile_provider', label: 'Provider', value: 'Nagad', hidden: true },
    ]
  },
  'Mobile Banking (Rocket)': {
    fields: [
      { key: 'transaction_id', label: 'Rocket Transaction ID', placeholder: 'e.g. RKT1234567890', required: true },
      { key: 'mobile_provider', label: 'Provider', value: 'Rocket', hidden: true },
    ]
  },
  'Bank Transfer': {
    fields: [
      { key: 'bank_name', label: 'Bank Name', placeholder: 'e.g. Dutch Bangla Bank', required: true },
      { key: 'transaction_id', label: 'Reference / Transaction No.', placeholder: 'e.g. TXN00123456', required: true },
      { key: 'account_last4', label: 'Last 4 Digits of Account', placeholder: 'e.g. 4589', required: true },
    ]
  },
  'Credit / Debit Card': {
    fields: [
      { key: 'transaction_id', label: 'Transaction Reference', placeholder: 'From your bank statement', required: true },
      { key: 'account_last4', label: 'Last 4 Digits of Card', placeholder: 'e.g. 1234', required: true },
    ]
  },
  'Cash': {
    fields: [] // No verification needed
  },
};

const STATUS_COLORS = {
  pending:  { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', label: 'Pending'  },
  verified: { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', label: 'Verified' },
  rejected: { bg: 'rgba(239, 68, 68, 0.15)',  color: '#ef4444', label: 'Rejected' },
};

const DonationsPage = () => {
  const { isAdmin } = useAuth();
  const [ledger, setLedger] = useState({ donations: [], summary: { total: 0, byMethod: [] } });
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    donor_name: '', donor_email: '', amount: '',
    payment_method: 'Mobile Banking (bKash)',
    transaction_id: '', mobile_provider: '', bank_name: '', account_last4: ''
  });

  const methodConfig = VERIFICATION_FIELDS[formData.payment_method] || { fields: [] };

  const fetchDonations = () => {
    cachedGet('/donations', (data, _, err) => {
      if (!err && data) setLedger(data);
      setLoading(false);
    });
  };

  useEffect(() => { fetchDonations(); }, []);

  const handleMethodChange = (method) => {
    // Auto-populate hidden fields from config
    const config = VERIFICATION_FIELDS[method] || { fields: [] };
    const autoFill = {};
    config.fields?.forEach(f => { if (f.hidden && f.value) autoFill[f.key] = f.value; });
    setFormData({ ...formData, payment_method: method, transaction_id: '', bank_name: '', account_last4: '', mobile_provider: '', ...autoFill });
  };

  const handleDonate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/donations', formData);
      invalidateCache('/donations');
      setFormData({ donor_name: '', donor_email: '', amount: '', payment_method: 'Mobile Banking (bKash)', transaction_id: '', mobile_provider: '', bank_name: '', account_last4: '' });
      alert('Thank you! Your donation has been submitted and is pending verification.');
      fetchDonations();
    } catch (err) {
      alert('Failed to process donation: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleVerify = async (id, action) => {
    try {
      await api.patch(`/donations/${id}/${action}`);
      invalidateCache('/donations');
      fetchDonations();
    } catch (err) {
      alert('Failed to update donation status.');
    }
  };

  const selectStyle = { width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: '#fff' };

  return (
    <div className="fade-in dashboard-page">
      <header className="page-header">
        <h1>Donations Ledger</h1>
        <p className="subtitle">Contribute to our mission and track financial contributions.</p>
      </header>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        {/* Donation Form */}
        <div className="glass-card" style={{ flex: '1 1 360px' }}>
          <h2>Make a Donation</h2>
          <form onSubmit={handleDonate} style={{ marginTop: '1.5rem' }}>
            <div className="input-group">
              <label>Full Name</label>
              <input required type="text" value={formData.donor_name} onChange={e => setFormData({...formData, donor_name: e.target.value})} />
            </div>
            <div className="input-group">
              <label>Email Address</label>
              <input required type="email" value={formData.donor_email} onChange={e => setFormData({...formData, donor_email: e.target.value})} />
            </div>
            <div className="input-group">
              <label>Amount (BDT ৳)</label>
              <input required type="number" min="1" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
            </div>

            <div className="input-group">
              <label>Payment Method</label>
              <select value={formData.payment_method} onChange={e => handleMethodChange(e.target.value)} style={selectStyle}>
                {Object.keys(VERIFICATION_FIELDS).map(m => (
                  <option key={m} value={m} style={{ color: '#000' }}>{m}</option>
                ))}
              </select>
            </div>

            {/* Dynamic verification fields based on method */}
            {methodConfig.fields?.filter(f => !f.hidden).map(field => (
              <div className="input-group" key={field.key}>
                <label>{field.label}</label>
                <input
                  type="text"
                  required={field.required}
                  placeholder={field.placeholder}
                  value={formData[field.key] || ''}
                  onChange={e => setFormData({...formData, [field.key]: e.target.value})}
                />
              </div>
            ))}

            {formData.payment_method === 'Cash' && (
              <div style={{ padding: '0.75rem', background: 'rgba(245,158,11,0.1)', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b', fontSize: '0.85rem', marginBottom: '1rem' }}>
                ⚠️ Cash donations will be marked as pending until verified by an admin.
              </div>
            )}

            <button type="submit" className="btn">Donate Now</button>
          </form>
        </div>

        {/* Summary & Ledger */}
        <div style={{ flex: '2 1 600px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Total Verified</h3>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--success-color)', marginTop: '0.5rem' }}>
                ৳{ledger.summary.total.toFixed(2)}
              </div>
            </div>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '1rem' }}>By Method</h3>
              {ledger.summary.byMethod.map(m => (
                <div key={m.payment_method} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                  <span>{m.payment_method}</span>
                  <strong>৳{m.method_total.toFixed(2)}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="data-table-container glass-card" style={{ padding: 0 }}>
            {loading ? (
              <table className="data-table">
                <thead><tr><th>Donor</th><th>Amount</th><th>Method</th><th>Transaction ID</th><th>Status</th>{isAdmin && <th>Actions</th>}</tr></thead>
                <tbody>{Array.from({length:5}).map((_,i) => <TableRowSkeleton key={i} cols={isAdmin ? 6 : 5} />)}</tbody>
              </table>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Donor</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Transaction ID</th>
                    <th>Status</th>
                    {isAdmin && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {ledger.donations.map(d => {
                    const status = STATUS_COLORS[d.status] || STATUS_COLORS.pending;
                    return (
                      <tr key={d.id}>
                        <td>
                          <strong>{d.donor_name}</strong><br/>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{d.donor_email}</span>
                        </td>
                        <td style={{ color: 'var(--success-color)', fontWeight: 'bold' }}>৳{d.amount}</td>
                        <td>
                          <span style={{ fontSize: '0.85rem' }}>{d.payment_method}</span>
                          {d.bank_name && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{d.bank_name}</div>}
                          {d.mobile_provider && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{d.mobile_provider}</div>}
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                          {d.transaction_id || '—'}
                          {d.account_last4 && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>••••{d.account_last4}</div>}
                        </td>
                        <td>
                          <span style={{ padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: '600', background: status.bg, color: status.color }}>
                            {status.label}
                          </span>
                        </td>
                        {isAdmin && (
                          <td>
                            {d.status === 'pending' && (
                              <div style={{ display: 'flex', gap: '0.4rem' }}>
                                <button className="btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', background: 'rgba(16,185,129,0.2)', color: '#10b981' }} onClick={() => handleVerify(d.id, 'verify')}>✓ Verify</button>
                                <button className="btn btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => handleVerify(d.id, 'reject')}>✗ Reject</button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {ledger.donations.length === 0 && (
                    <tr><td colSpan={isAdmin ? 6 : 5} style={{ textAlign: 'center' }}>No donations recorded yet.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default DonationsPage;
