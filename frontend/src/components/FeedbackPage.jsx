import React, { useEffect, useState } from 'react';
import api from '../api';

const FeedbackPage = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({ rating: 5, comments: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const res = await api.get('/feedback');
      setFeedbacks(res.data);
    } catch (err) {
      console.error('Failed to load feedback', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.post('/feedback', formData);
      setFormData({ rating: 5, comments: '' });
      alert('Thank you for your feedback!');
      fetchFeedback();
    } catch (err) {
      alert('Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating) => `${rating}/5`;

  return (
    <div className="fade-in dashboard-page">
      <header className="page-header">
        <h1>Platform Feedback</h1>
        <p className="subtitle">Help us improve the Food Waste Management System.</p>
      </header>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        <div className="glass-card" style={{ flex: '1 1 350px' }}>
          <h2>Submit Feedback</h2>
          <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
            <div className="input-group">
              <label>Rating (1-5)</label>
              <select required value={formData.rating} onChange={e => setFormData({...formData, rating: Number(e.target.value)})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: '#fff' }}>
                <option value={5} style={{ color: '#000' }}>5 - Excellent</option>
                <option value={4} style={{ color: '#000' }}>4 - Very Good</option>
                <option value={3} style={{ color: '#000' }}>3 - Good</option>
                <option value={2} style={{ color: '#000' }}>2 - Fair</option>
                <option value={1} style={{ color: '#000' }}>1 - Poor</option>
              </select>
            </div>
            <div className="input-group">
              <label>Comments</label>
              <textarea required rows="4" value={formData.comments} onChange={e => setFormData({...formData, comments: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: '#fff' }}></textarea>
            </div>
            <button type="submit" className="btn" style={{ width: '100%' }} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </form>
        </div>

        <div style={{ flex: '2 1 600px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', alignContent: 'start' }}>
          {loading ? <div className="loader" style={{ margin: '2rem auto' }}></div> : (
            feedbacks.map(f => (
              <div key={f.id} className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <strong>{f.users?.first_name} {f.users?.last_name}</strong>
                  <span style={{ color: 'var(--accent-color)' }}>{renderStars(f.rating)}</span>
                </div>
                {f.reduction_programs && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    Program: {f.reduction_programs.program_name}
                  </div>
                )}
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>"{f.comments}"</p>
                <div style={{ fontSize: '0.8rem', color: 'var(--glass-border)', marginTop: '1rem' }}>
                  {new Date(f.created_at).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
          {feedbacks.length === 0 && !loading && <p style={{ color: 'var(--text-secondary)' }}>No feedback submitted yet.</p>}
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;
