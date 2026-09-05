import React, { useEffect, useState } from 'react';
import api, { cachedGet, invalidateCache } from '../api';
import { useAuth } from '../AuthContext';
import { Skeleton } from './PageLoader';

const FoodData = () => {
  const { user, isAdmin } = useAuth();
  const [foodData, setFoodData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [showLogModal, setShowLogModal] = useState(false);
  const [formData, setFormData] = useState({
    food_category: '', amount_wasted: '', cause_of_waste: '', location: '', disposal_method: '', date_of_waste: '', available: true
  });

  const fetchFoodData = () => {
    cachedGet('/food', (data, _, err) => {
      if (!err && data) setFoodData(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchFoodData();
  }, []);

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/food', formData);
      invalidateCache('/food');
      setShowLogModal(false);
      fetchFoodData();
    } catch (err) {
      alert('Failed to log food waste.');
    }
  };

  const handleRequest = async (id) => {
    if (!window.confirm('Do you want to submit a request for this food item? The provider will receive your contact information.')) return;
    try {
      await api.post(`/food/${id}/request`);
      invalidateCache('/food');
      fetchFoodData();
      alert('Request submitted successfully!');
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Failed to submit request.');
    }
  };

  const handleDeliver = async (id) => {
    if (!window.confirm('Mark this food item as delivered to the recipient?')) return;
    try {
      await api.patch(`/food/${id}/deliver`);
      invalidateCache('/food');
      fetchFoodData();
      alert('Food item marked as delivered!');
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Failed to mark as delivered.');
    }
  };

  return (
    <div className="fade-in dashboard-page">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Food Waste Hub</h1>
          <p className="subtitle">Track food waste and request available donations.</p>
        </div>
        <button className="btn" onClick={() => setShowLogModal(true)} style={{ width: 'auto' }}>
          + Log Food Waste
        </button>
      </header>

      {loading ? (
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {Array.from({length: 6}).map((_,i) => (
            <div key={i} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Skeleton style={{ width: '45%', height: 22, borderRadius: 4 }} />
                <Skeleton style={{ width: '30%', height: 14, borderRadius: 4 }} />
              </div>
              <Skeleton style={{ width: '50%', height: 28, borderRadius: 6 }} />
              <Skeleton style={{ width: '80%', height: 14, borderRadius: 4 }} />
              <Skeleton style={{ width: '65%', height: 14, borderRadius: 4 }} />
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between' }}>
                <Skeleton style={{ width: '40%', height: 14, borderRadius: 4 }} />
                <Skeleton style={{ width: '80px', height: 36, borderRadius: 10 }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {foodData.map(item => {
            const isOwner = user?.id && (user.id === item.user_id || user.id === item.users?.id);
            const requests = item.food_requests || [];
            const hasRequests = requests.length > 0;
            const isRequested = item.available && hasRequests;
            const isDelivered = !item.available && hasRequests;
            const userRequested = requests.some(r => r.user_id === user?.id);
            const latestRequester = hasRequests ? requests[0].users : null;
            const canDeliver = (isOwner || isAdmin) && isRequested;

            return (
              <div key={item.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ padding: '0.3rem 0.6rem', background: 'rgba(59, 130, 246, 0.2)', color: 'var(--accent-color)', borderRadius: '4px', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 'bold' }}>
                    {item.food_category}
                  </span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{new Date(item.date_of_waste).toLocaleDateString()}</span>
                </div>
                
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{item.amount_wasted} KG</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', flex: 1 }}>
                  <strong>Cause:</strong> {item.cause_of_waste} <br/>
                  <strong>Location:</strong> {item.location}
                </p>

                {hasRequests && (isOwner || isAdmin) && (
                  <div style={{
                    marginBottom: '0.75rem',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '8px',
                    background: isDelivered ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                    border: `1px solid ${isDelivered ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)'
                  }}>
                    <strong style={{ color: isDelivered ? '#34d399' : '#fbbf24' }}>
                      {isDelivered ? 'Delivered to:' : 'Recipient:'}
                    </strong>{' '}
                    {latestRequester ? `${latestRequester.first_name} ${latestRequester.last_name}` : 'Anonymous user'}
                    {latestRequester?.phone && <span> &bull; {latestRequester.phone}</span>}
                  </div>
                )}
                
                <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: '0.85rem' }}>
                    {isDelivered ? (
                      <span style={{ color: '#34d399', fontWeight: 600 }}>● Delivered</span>
                    ) : isRequested ? (
                      <span style={{ color: '#fbbf24', fontWeight: 600 }}>● Claimed</span>
                    ) : item.available ? (
                      <span style={{ color: 'var(--success-color)', fontWeight: 600 }}>● Available</span>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)' }}>○ Unavailable</span>
                    )}
                    <br/>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      By: {isOwner ? 'You' : (item.users?.first_name ? `${item.users.first_name} ${item.users.last_name || ''}` : 'Anonymous')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {canDeliver ? (
                      <button
                        className="btn"
                        style={{
                          padding: '0.45rem 0.85rem',
                          width: 'auto',
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          fontSize: '0.8rem',
                          fontWeight: 600
                        }}
                        onClick={() => handleDeliver(item.id)}
                      >
                        ✓ Mark Delivered
                      </button>
                    ) : item.available && !hasRequests ? (
                      isOwner ? (
                        <span style={{
                          padding: '0.35rem 0.75rem',
                          background: 'rgba(255,255,255,0.06)',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--glass-border)'
                        }}>
                          Your Listing
                        </span>
                      ) : (
                        <button
                          className="btn"
                          style={{ padding: '0.5rem 1rem', width: 'auto' }}
                          onClick={() => handleRequest(item.id)}
                        >
                          Request
                        </button>
                      )
                    ) : userRequested ? (
                      <span style={{
                        padding: '0.35rem 0.75rem',
                        background: 'rgba(59, 130, 246, 0.15)',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        color: '#60a5fa',
                        border: '1px solid rgba(59, 130, 246, 0.3)'
                      }}>
                        Requested by You
                      </span>
                    ) : isDelivered ? (
                      <span style={{
                        padding: '0.35rem 0.75rem',
                        background: 'rgba(16, 185, 129, 0.12)',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        color: '#34d399',
                        border: '1px solid rgba(16, 185, 129, 0.25)'
                      }}>
                        Fulfilled
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
          {foodData.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No food waste data available.</p>}
        </div>
      )}

      {showLogModal && (
        <div className="modal-backdrop fade-in" onClick={() => setShowLogModal(false)}>
          <div className="modal-content glass-card" onClick={e => e.stopPropagation()}>
            <h2>Log Food Waste</h2>
            <form onSubmit={handleLogSubmit} style={{ marginTop: '1.5rem', maxHeight: '70vh', overflowY: 'auto', paddingRight: '1rem' }}>
              <div className="input-group">
                <label>Food Category</label>
                <select required value={formData.food_category} onChange={e => setFormData({...formData, food_category: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: '#fff' }}>
                  <option value="" style={{ color: '#000' }}>Select Category...</option>
                  <option value="vegetables" style={{ color: '#000' }}>Vegetables</option>
                  <option value="fruits" style={{ color: '#000' }}>Fruits</option>
                  <option value="cooked" style={{ color: '#000' }}>Cooked</option>
                  <option value="dairy" style={{ color: '#000' }}>Dairy</option>
                  <option value="dry" style={{ color: '#000' }}>Dry Food</option>
                  <option value="others" style={{ color: '#000' }}>Others</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Amount (KG)</label>
                  <input required type="number" step="0.01" value={formData.amount_wasted} onChange={e => setFormData({...formData, amount_wasted: e.target.value})} />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Date of Waste</label>
                  <input required type="date" value={formData.date_of_waste} onChange={e => setFormData({...formData, date_of_waste: e.target.value})} />
                </div>
              </div>

              <div className="input-group">
                <label>Location</label>
                <input required type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
              </div>

              <div className="input-group">
                <label>Cause of Waste</label>
                <textarea required rows="2" value={formData.cause_of_waste} onChange={e => setFormData({...formData, cause_of_waste: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: '#fff' }}></textarea>
              </div>

              <div className="input-group">
                <label>Disposal Method</label>
                <select required value={formData.disposal_method} onChange={e => setFormData({...formData, disposal_method: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: '#fff' }}>
                  <option value="" style={{ color: '#000' }}>Select Method...</option>
                  <option value="landfill" style={{ color: '#000' }}>Landfill</option>
                  <option value="compost" style={{ color: '#000' }}>Compost</option>
                  <option value="donation" style={{ color: '#000' }}>Donation</option>
                </select>
              </div>

              <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '1rem' }}>
                <label style={{ margin: 0 }}>Available for Request?</label>
                <input type="checkbox" checked={formData.available} onChange={e => setFormData({...formData, available: e.target.checked})} style={{ width: '20px', height: '20px' }} />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn" style={{ background: 'var(--bg-secondary)' }} onClick={() => setShowLogModal(false)}>Cancel</button>
                <button type="submit" className="btn">Submit Log</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodData;
